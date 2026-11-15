import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { isInternalApplicationRequest } from "./internal-auth";
import {
  canRequestSigns,
  getClientAddress,
  pruneExpiredSignsRateLimitWindows,
} from "./rate-limit";
import {
  runScheduledHistoricImport,
  runScheduledInitialImport,
  runScheduledReconciliation,
} from "./strava/imports";
import { createStravaRouter } from "./strava/router";
import {
  pruneProcessedWebhookEvents,
  runScheduledWebhookRetries,
} from "./strava/webhook-events";
import { pruneExpiredSessions } from "./strava/sessions";
import { supabase } from "./supabase";

const app = new Hono();

const SIGNS_REQUEST_BODY_MAX_BYTES = 4 * 1024;

const runScheduledTask = async <Result>(
  name: string,
  task: () => Promise<Result>,
) => {
  try {
    return await task();
  } catch (error) {
    console.error(`Scheduled ${name} failed`, error);
    return undefined;
  }
};

app.route("/strava", createStravaRouter());

const signsInBoxSchema = z
  .object({
    minLat: z.number().min(-90).max(90),
    minLong: z.number().min(-180).max(180),
    maxLat: z.number().min(-90).max(90),
    maxLong: z.number().min(-180).max(180),
  })
  .refine(
    ({ minLat, minLong, maxLat, maxLong }) =>
      minLat < maxLat &&
      minLong < maxLong &&
      maxLat - minLat <= 15 &&
      maxLong - minLong <= 15 &&
      (maxLat - minLat) * (maxLong - minLong) <= 100,
    "Requested area is too large",
  );

app.post(
  "/signs",
  bodyLimit({
    maxSize: SIGNS_REQUEST_BODY_MAX_BYTES,
    onError: (c) => c.json({ error: "Request body is too large" }, 413),
  }),
  async (c, next) => {
    if (!isInternalApplicationRequest(c.req.raw)) {
      return c.json({ error: "Application authentication required" }, 401);
    }
    if (!(await canRequestSigns(getClientAddress(c.req.raw)))) {
      return c.json({ error: "Too many sign lookup requests" }, 429);
    }
    await next();
  },
  zValidator("json", signsInBoxSchema),
  async (c) => {
    const bounds = c.req.valid("json");
    const { data, error } = await supabase.rpc("signs_in_box", {
      min_lat: bounds.minLat,
      min_long: bounds.minLong,
      max_lat: bounds.maxLat,
      max_long: bounds.maxLong,
    });
    if (error) throw new Error(error.message);
    return c.json(data);
  },
);

export default {
  fetch: app.fetch,
  scheduled(
    _controller: ScheduledController,
    _env: CloudflareBindings,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      (async () => {
        // Strava's rate limits are shared by every task that calls its API, so
        // a rate-limited task pauses the remaining Strava work in this run.
        let stravaPauseUntil: number | null = null;
        const runStravaTask = async (
          name: string,
          task: () => Promise<number | null>,
        ) => {
          if (stravaPauseUntil !== null && Date.now() < stravaPauseUntil)
            return;
          const pauseUntil = await runScheduledTask(name, task);
          if (pauseUntil) stravaPauseUntil = pauseUntil;
        };
        await runStravaTask(
          "historic Strava import",
          runScheduledHistoricImport,
        );
        await runStravaTask("initial Strava import", runScheduledInitialImport);
        await runStravaTask(
          "Strava webhook retries",
          runScheduledWebhookRetries,
        );
        await runStravaTask(
          "Strava reconciliation",
          runScheduledReconciliation,
        );
        await runScheduledTask(
          "expired sign rate-limit windows",
          pruneExpiredSignsRateLimitWindows,
        );
        await runScheduledTask("expired Strava sessions", pruneExpiredSessions);
        await runScheduledTask(
          "processed Strava webhook events",
          pruneProcessedWebhookEvents,
        );
      })(),
    );
  },
};
