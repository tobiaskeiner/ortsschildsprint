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
  startSubrequestBudget,
  usableSubrequestsPerInvocation,
} from "./subrequests";
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
// Pruning only reclaims expired rows; running it on every minute-scheduled
// invocation would spend subrequests that scheduled Strava batches can use
// better. The isolation-shared timestamp keeps it periodic per isolate.
const PRUNE_INTERVAL_MILLISECONDS = 10 * 60 * 1_000;
// Each scheduled Strava task starts with a small database query; when even
// that does not fit, the task waits for the next schedule.
const SUBREQUESTS_TO_START_TASK = 2;
let lastPrunedAt = 0;

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
        // Every task of this invocation shares its subrequest budget, so each
        // one stops before the platform would cut it off and the invocation
        // stays a cheap, reliable increment of the import pipeline.
        const subrequestBudget = startSubrequestBudget(
          usableSubrequestsPerInvocation(),
        );
        // Strava's rate limits are shared by every task that calls its API, so
        // a rate-limited task pauses the remaining Strava work in this run.
        let stravaPauseUntil: number | null = null;
        const runStravaTask = async (
          name: string,
          task: () => Promise<number | null>,
        ) => {
          if (stravaPauseUntil !== null && Date.now() < stravaPauseUntil)
            return;
          if (!subrequestBudget.canSpend(SUBREQUESTS_TO_START_TASK)) return;
          const pauseUntil = await runScheduledTask(name, task);
          if (pauseUntil) stravaPauseUntil = pauseUntil;
        };
        await runStravaTask("historic Strava import", () =>
          runScheduledHistoricImport(subrequestBudget),
        );
        await runStravaTask("initial Strava import", () =>
          runScheduledInitialImport(subrequestBudget),
        );
        await runStravaTask("Strava webhook retries", () =>
          runScheduledWebhookRetries(subrequestBudget),
        );
        await runStravaTask("Strava reconciliation", () =>
          runScheduledReconciliation(subrequestBudget),
        );
        if (
          Date.now() - lastPrunedAt >= PRUNE_INTERVAL_MILLISECONDS &&
          subrequestBudget.canSpend(SUBREQUESTS_TO_START_TASK * 3)
        ) {
          lastPrunedAt = Date.now();
          await runScheduledTask(
            "expired sign rate-limit windows",
            pruneExpiredSignsRateLimitWindows,
          );
          await runScheduledTask(
            "expired Strava sessions",
            pruneExpiredSessions,
          );
          await runScheduledTask(
            "processed Strava webhook events",
            pruneProcessedWebhookEvents,
          );
        }
      })(),
    );
  },
};
