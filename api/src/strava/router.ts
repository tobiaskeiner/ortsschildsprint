import { getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { assertStravaConfiguration, bindings } from "../config";
import {
  canRequestStrava,
  canRequestStravaWebhook,
  getClientAddress,
} from "../rate-limit";
import { supabase } from "../supabase";
import {
  createOAuthState,
  encryptToken,
  StravaReconnectRequiredError,
  verifyOAuthState,
} from "./crypto";
import { getDashboard, getDashboardProgress } from "./dashboard";
import {
  ensureInitialImportState,
  importHistoricBatchExclusively,
  importInitialRidesExclusively,
  queueTotalRideCountRefresh,
  StravaImportInProgressError,
} from "./imports";
import {
  createSession,
  getSessionAthleteId,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "./sessions";
import { oAuthTokenResponseSchema } from "./types";
import {
  processStravaWebhookEvent,
  recordStravaWebhookEvent,
} from "./webhook-events";
import { parseStravaWebhookEvent, verifyWebhookSignature } from "./webhook";

const dashboardPath = "/strava";
const webhookPath = "/strava/webhook";
const OAUTH_STATE_COOKIE = "oss_strava_oauth_state";
const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const ACTIVITY_SUMMARY_COOKIE = "oss_strava_activity_summary";
const STRAVA_JSON_REQUEST_BODY_MAX_BYTES = 4 * 1024;
const STRAVA_WEBHOOK_BODY_MAX_BYTES = 64 * 1024;

const activitySummaryPreferenceSchema = z.object({
  appendSignSummary: z.boolean(),
});

const cookieOptions = (requestUrl: string, maxAge: number) => ({
  httpOnly: true,
  maxAge,
  path: "/",
  sameSite: "Lax" as const,
  secure: new URL(requestUrl).protocol === "https:",
});

const getAuthenticatedAthleteId = async (sessionId: string | undefined) => {
  const athleteId = await getSessionAthleteId(sessionId);
  if (!athleteId) return undefined;
  return athleteId;
};

export const createStravaRouter = () => {
  const app = new Hono();

  app.use(async (c, next) => {
    // Webhook deliveries arrive from shared Strava infrastructure and are not
    // authenticated per event (Strava does not sign them), so they skip the
    // per-IP Strava limit and get a generous dedicated one instead. Strava
    // retries events only three times, so real deliveries must not be
    // throttled under normal conditions.
    if (c.req.path === webhookPath) {
      if (!(await canRequestStravaWebhook(getClientAddress(c.req.raw)))) {
        return c.json({ error: "Too many webhook requests" }, 429);
      }
      return next();
    }
    if (!(await canRequestStrava(getClientAddress(c.req.raw)))) {
      return c.json({ error: "Too many Strava requests" }, 429);
    }
    await next();
  });

  app.get("/connect", async (c) => {
    assertStravaConfiguration();
    const appendSignSummary = c.req.query("activity_summary") !== "0";
    const oauthNonce = crypto.randomUUID();
    setCookie(
      c,
      OAUTH_STATE_COOKIE,
      oauthNonce,
      cookieOptions(c.req.url, OAUTH_STATE_TTL_SECONDS),
    );
    setCookie(
      c,
      ACTIVITY_SUMMARY_COOKIE,
      String(appendSignSummary),
      cookieOptions(c.req.url, OAUTH_STATE_TTL_SECONDS),
    );
    const authorizationUrl = new URL("https://www.strava.com/oauth/authorize");
    authorizationUrl.search = new URLSearchParams({
      client_id: bindings.STRAVA_CLIENT_ID,
      redirect_uri: bindings.STRAVA_REDIRECT_URI,
      response_type: "code",
      approval_prompt: "auto",
      scope: appendSignSummary
        ? "activity:read_all,activity:write"
        : "activity:read_all",
      state: await createOAuthState(oauthNonce),
    }).toString();
    return c.redirect(authorizationUrl.toString());
  });

  app.get("/callback", async (c) => {
    assertStravaConfiguration();
    const code = c.req.query("code");
    const stateNonce = await verifyOAuthState(c.req.query("state"));
    const cookieNonce = getCookie(c, OAUTH_STATE_COOKIE);
    const appendSignSummary = getCookie(c, ACTIVITY_SUMMARY_COOKIE) !== "false";
    setCookie(c, OAUTH_STATE_COOKIE, "", cookieOptions(c.req.url, 0));
    setCookie(c, ACTIVITY_SUMMARY_COOKIE, "", cookieOptions(c.req.url, 0));
    if (!code || !stateNonce || stateNonce !== cookieNonce) {
      return c.redirect(`${dashboardPath}?connection=denied`);
    }

    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: bindings.STRAVA_CLIENT_ID,
        client_secret: bindings.STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });
    if (!response.ok) return c.redirect(`${dashboardPath}?connection=failed`);

    const result = oAuthTokenResponseSchema.safeParse(await response.json());
    if (!result.success) {
      return c.redirect(`${dashboardPath}?connection=failed`);
    }
    const token = result.data;
    // The token response reports the scopes Strava actually granted. The
    // scope query parameter on the callback is client-controlled and must not
    // be trusted for storage.
    const grantedScopes = (token.scope ?? "").split(/[\s,]+/).filter(Boolean);
    if (
      !grantedScopes.includes("activity:read_all") ||
      (appendSignSummary && !grantedScopes.includes("activity:write"))
    ) {
      return c.redirect(`${dashboardPath}?connection=denied`);
    }

    const athleteId = token.athlete.id;
    const { data: existingAthlete, error: existingAthleteError } =
      await supabase
        .from("strava_athletes")
        .select("athlete_id")
        .eq("athlete_id", athleteId)
        .maybeSingle();
    if (existingAthleteError) throw new Error(existingAthleteError.message);

    const { error } = await supabase.from("strava_athletes").upsert({
      athlete_id: athleteId,
      display_name:
        [token.athlete.firstname, token.athlete.lastname]
          .filter(Boolean)
          .join(" ") || `Strava athlete ${athleteId}`,
      profile_image_url: token.athlete.profile ?? null,
      access_token_ciphertext: await encryptToken(token.access_token),
      refresh_token_ciphertext: await encryptToken(token.refresh_token),
      access_token_expires_at: new Date(token.expires_at * 1_000).toISOString(),
      granted_scopes: grantedScopes,
      append_sign_summary: appendSignSummary,
      updated_at: new Date().toISOString(),
    });
    if (error) return c.redirect(`${dashboardPath}?connection=failed`);

    const sessionId = await createSession(athleteId);
    setCookie(c, SESSION_COOKIE, sessionId, {
      httpOnly: true,
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
      sameSite: "Lax",
      secure: new URL(c.req.url).protocol === "https:",
    });
    if (!existingAthlete) {
      await ensureInitialImportState(athleteId);
      c.executionCtx.waitUntil(
        importInitialRidesExclusively(athleteId).catch((error) =>
          console.error("Initial Strava import failed", error),
        ),
      );
    }
    return c.redirect(`${dashboardPath}?connection=success`);
  });

  app.get("/dashboard", async (c) => {
    const athleteId = await getAuthenticatedAthleteId(
      getCookie(c, SESSION_COOKIE),
    );
    if (!athleteId) return c.json({ error: "Not connected" }, 401);
    const dashboard = await getDashboard(athleteId);
    if (dashboard.stats.totalRides === null) {
      c.executionCtx.waitUntil(queueTotalRideCountRefresh(athleteId));
    }
    return c.json(dashboard);
  });

  app.get("/dashboard/progress", async (c) => {
    const athleteId = await getAuthenticatedAthleteId(
      getCookie(c, SESSION_COOKIE),
    );
    if (!athleteId) return c.json({ error: "Not connected" }, 401);
    return c.json(await getDashboardProgress(athleteId));
  });

  app.patch(
    "/preferences",
    bodyLimit({
      maxSize: STRAVA_JSON_REQUEST_BODY_MAX_BYTES,
      onError: (c) => c.json({ error: "Request body is too large" }, 413),
    }),
    zValidator("json", activitySummaryPreferenceSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: "A valid preference is required" }, 400);
      }
    }),
    async (c) => {
      const athleteId = await getAuthenticatedAthleteId(
        getCookie(c, SESSION_COOKIE),
      );
      if (!athleteId) return c.json({ error: "Not connected" }, 401);

      const { appendSignSummary } = c.req.valid("json");
      const { data: athlete, error: athleteError } = await supabase
        .from("strava_athletes")
        .select("granted_scopes")
        .eq("athlete_id", athleteId)
        .single();
      if (athleteError) throw new Error(athleteError.message);
      const grantedScopes = (athlete.granted_scopes ?? []) as string[];
      if (appendSignSummary && !grantedScopes.includes("activity:write")) {
        return c.json(
          {
            error:
              "Reconnect with activity-writing permission to add summaries to Strava activities.",
          },
          409,
        );
      }

      const { error } = await supabase
        .from("strava_athletes")
        .update({
          append_sign_summary: appendSignSummary,
          updated_at: new Date().toISOString(),
        })
        .eq("athlete_id", athleteId);
      if (error) throw new Error(error.message);
      return c.json({ appendSignSummary });
    },
  );

  app.post("/import", async (c) => {
    const athleteId = await getAuthenticatedAthleteId(
      getCookie(c, SESSION_COOKIE),
    );
    if (!athleteId) return c.json({ error: "Not connected" }, 401);

    const { error: requestError } = await supabase
      .from("strava_import_state")
      .upsert({
        athlete_id: athleteId,
        full_history_requested: true,
        completed: false,
        updated_at: new Date().toISOString(),
      });
    if (requestError) throw new Error(requestError.message);

    try {
      return c.json(await importHistoricBatchExclusively(athleteId));
    } catch (error) {
      if (
        error instanceof StravaReconnectRequiredError ||
        error instanceof StravaImportInProgressError
      ) {
        return c.json({ error: error.message }, 409);
      }
      throw error;
    }
  });

  app.get("/webhook", (c) => {
    if (
      c.req.query("hub.mode") !== "subscribe" ||
      c.req.query("hub.verify_token") !== bindings.STRAVA_WEBHOOK_VERIFY_TOKEN
    ) {
      return c.json({ error: "Verification failed" }, 403);
    }
    return c.json({ "hub.challenge": c.req.query("hub.challenge") });
  });

  app.post(
    "/webhook",
    bodyLimit({
      maxSize: STRAVA_WEBHOOK_BODY_MAX_BYTES,
      onError: (c) => c.json({ error: "Request body is too large" }, 413),
    }),
    async (c) => {
      const rawBody = await c.req.text();
      // Deliveries are accepted without a signature (Strava does not sign
      // them); a presented signature must still validate. Destructive events
      // are re-verified against the Strava API before any data is removed.
      const signatureIsValid = await verifyWebhookSignature(
        c.req.header("X-Strava-Signature"),
        rawBody,
      );
      if (!signatureIsValid) {
        return c.json({ error: "Invalid webhook signature" }, 403);
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return c.json({ error: "Invalid event" }, 400);
      }
      const event = parseStravaWebhookEvent(payload);
      if (!event) {
        return c.json({ error: "Invalid event" }, 400);
      }
      const eventId = await recordStravaWebhookEvent(event);
      c.executionCtx.waitUntil(
        processStravaWebhookEvent(eventId).catch((error) =>
          console.error("Could not start Strava webhook processing", error),
        ),
      );
      return c.body(null, 200);
    },
  );

  return app;
};
