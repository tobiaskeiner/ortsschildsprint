import { getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { assertStravaConfiguration, bindings } from "../config";
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
import type { OAuthTokenResponse } from "./types";
import {
  processStravaWebhookEvent,
  recordStravaWebhookEvent,
} from "./webhook-events";
import { isStravaWebhookEvent, verifyWebhookSignature } from "./webhook";

const dashboardPath = "/strava";
const OAUTH_STATE_COOKIE = "oss_strava_oauth_state";
const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const ACTIVITY_SUMMARY_COOKIE = "oss_strava_activity_summary";
const STRAVA_JSON_REQUEST_BODY_MAX_BYTES = 4 * 1024;
const STRAVA_WEBHOOK_BODY_MAX_BYTES = 64 * 1024;

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
    const grantedScopes = (c.req.query("scope") ?? "")
      .split(/[\s,]+/)
      .filter(Boolean);
    if (
      !code ||
      !stateNonce ||
      stateNonce !== cookieNonce ||
      !grantedScopes.includes("activity:read_all") ||
      (appendSignSummary && !grantedScopes.includes("activity:write"))
    ) {
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

    const result = (await response.json()) as OAuthTokenResponse;
    const athleteId = result.athlete.id;
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
        [result.athlete.firstname, result.athlete.lastname]
          .filter(Boolean)
          .join(" ") || `Strava athlete ${athleteId}`,
      profile_image_url: result.athlete.profile ?? null,
      access_token_ciphertext: await encryptToken(result.access_token),
      refresh_token_ciphertext: await encryptToken(result.refresh_token),
      access_token_expires_at: new Date(
        result.expires_at * 1_000,
      ).toISOString(),
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
    async (c) => {
      const athleteId = await getAuthenticatedAthleteId(
        getCookie(c, SESSION_COOKIE),
      );
      if (!athleteId) return c.json({ error: "Not connected" }, 401);

      const body = (await c.req.json().catch(() => undefined)) as
        { appendSignSummary?: unknown } | undefined;
      if (typeof body?.appendSignSummary !== "boolean") {
        return c.json({ error: "A valid preference is required" }, 400);
      }

      const { data: athlete, error: athleteError } = await supabase
        .from("strava_athletes")
        .select("granted_scopes")
        .eq("athlete_id", athleteId)
        .single();
      if (athleteError) throw new Error(athleteError.message);
      const grantedScopes = (athlete.granted_scopes ?? []) as string[];
      if (body.appendSignSummary && !grantedScopes.includes("activity:write")) {
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
          append_sign_summary: body.appendSignSummary,
          updated_at: new Date().toISOString(),
        })
        .eq("athlete_id", athleteId);
      if (error) throw new Error(error.message);
      return c.json({ appendSignSummary: body.appendSignSummary });
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
      if (!isStravaWebhookEvent(payload)) {
        return c.json({ error: "Invalid event" }, 400);
      }
      const eventId = await recordStravaWebhookEvent(payload);
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
