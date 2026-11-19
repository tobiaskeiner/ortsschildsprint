import { supabase } from "../supabase";
import { type SubrequestBudget } from "../subrequests";
import {
  isActivityUnavailable,
  processActivity,
  removeActivityCollection,
} from "./activities";
import {
  isAthleteAuthorized,
  rateLimitPauseUntil,
  remainingStravaRequestsForBackgroundWork,
  StravaAthleteNotConnectedError,
  StravaRateLimitError,
} from "./client";
import { withStravaImportLock } from "./imports";
import type { StravaWebhookEvent } from "./types";

const RETRY_EVENTS_PER_SCHEDULE = 3;
// An event retries with up to a dozen subrequests — claiming, locking, the
// Strava verification and processing requests, and the completion update —
// and two Strava requests: the activity fetch and its route stream.
const SUBREQUESTS_TO_RETRY_EVENT = 10;
const STRAVA_READS_TO_RETRY_EVENT = 2;
const PROCESSED_EVENT_RETENTION_MILLISECONDS = 30 * 24 * 60 * 60 * 1_000;
const encoder = new TextEncoder();

interface StoredWebhookEvent {
  aspect_type: string;
  event_time: string;
  id: number;
  object_id: number;
  object_type: string;
  owner_id: number;
  updates: Record<string, unknown>;
}

const updateEquals = (value: unknown, expected: boolean) =>
  value === expected || value === String(expected);

const hasUpdate = (updates: Record<string, unknown>, field: string) =>
  Object.prototype.hasOwnProperty.call(updates, field);

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([firstKey], [secondKey]) =>
      firstKey < secondKey ? -1 : firstKey > secondKey ? 1 : 0,
    )
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
    .join(",")}}`;
};

const getEventFingerprint = async (event: StravaWebhookEvent) => {
  const payload = stableJson({
    aspect_type: event.aspect_type,
    event_time: event.event_time,
    object_id: event.object_id,
    object_type: event.object_type,
    owner_id: event.owner_id,
    updates: event.updates ?? {},
  });
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(payload)),
  );
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

const claimWebhookEvent = async (eventId: number, lockId: string) => {
  const { data, error } = await supabase.rpc("claim_strava_webhook_event", {
    event_id_input: eventId,
    lock_id_input: lockId,
  });
  if (error) throw new Error(error.message);
  return (data?.[0] ?? undefined) as StoredWebhookEvent | undefined;
};

const completeWebhookEvent = async (eventId: number, lockId: string) => {
  const { error } = await supabase.rpc("complete_strava_webhook_event", {
    event_id_input: eventId,
    lock_id_input: lockId,
  });
  if (error) throw new Error(error.message);
};

const failWebhookEvent = async (
  eventId: number,
  lockId: string,
  error: unknown,
) => {
  const { error: failError } = await supabase.rpc("fail_strava_webhook_event", {
    event_id_input: eventId,
    lock_id_input: lockId,
    error_input: error instanceof Error ? error.message : String(error),
    // A rate-limited attempt retries when Strava says so instead of after the
    // fixed backoff.
    retry_after_seconds_input:
      error instanceof StravaRateLimitError ? error.retryAfterSeconds : null,
  });
  if (failError) throw new Error(failError.message);
};

const invalidateTotalRideCount = async (athleteId: number) => {
  const { error } = await supabase
    .from("strava_import_state")
    .update({ total_ride_count: null })
    .eq("athlete_id", athleteId);
  if (error) throw new Error(error.message);
};

const processActivityWebhookEvent = async (event: StoredWebhookEvent) => {
  const activityWasMadePrivate =
    event.aspect_type === "update" && updateEquals(event.updates.private, true);
  if (event.aspect_type === "delete" || activityWasMadePrivate) {
    // Deliveries are unauthenticated, so a destructive event is only honored
    // once Strava's API confirms the activity is really unavailable.
    if (!(await isActivityUnavailable(event.owner_id, event.object_id))) return;
    await removeActivityCollection(event.owner_id, event.object_id);
    await invalidateTotalRideCount(event.owner_id);
    return;
  }

  const activityWasMadeShareable =
    event.aspect_type === "update" &&
    updateEquals(event.updates.private, false);
  const activityEligibilityMayHaveChanged =
    event.aspect_type === "update" &&
    (hasUpdate(event.updates, "type") ||
      hasUpdate(event.updates, "sport_type") ||
      hasUpdate(event.updates, "trainer") ||
      hasUpdate(event.updates, "manual"));
  if (
    event.aspect_type === "create" ||
    activityWasMadeShareable ||
    activityEligibilityMayHaveChanged
  ) {
    try {
      // The athlete's summary preference decides whether descriptions are
      // updated: opted-out athletes never granted activity:write, so a forced
      // update would fail on every new ride and churn webhook retries.
      const countsTowardRideTotal = await processActivity(
        event.owner_id,
        event.object_id,
        { retryWhenStreamUnavailable: true },
      );
      // Only activities that count toward the ride total can change it, so runs,
      // walks, and trainer rides no longer invalidate the cached total (whose
      // refresh pages through the athlete's entire Strava history).
      if (countsTowardRideTotal) {
        await invalidateTotalRideCount(event.owner_id);
      }
    } catch (error) {
      // A deauthorization can remove the athlete while earlier activity events
      // are still queued; there is nothing left to process for them.
      if (error instanceof StravaAthleteNotConnectedError) return;
      throw error;
    }
  }
};

const processClaimedWebhookEvent = async (event: StoredWebhookEvent) => {
  if (
    event.object_type === "athlete" &&
    event.aspect_type === "update" &&
    updateEquals(event.updates.authorized, false)
  ) {
    // Deliveries are unauthenticated, so the athlete's data is only removed
    // once Strava's API confirms the authorization is really gone.
    if (await isAthleteAuthorized(event.owner_id)) return;
    const { error } = await supabase
      .from("strava_athletes")
      .delete()
      .eq("athlete_id", event.owner_id);
    if (error) throw new Error(error.message);
    return;
  }

  if (event.object_type !== "activity") return;
  await withStravaImportLock(event.owner_id, () =>
    processActivityWebhookEvent(event),
  );
};

export const processStravaWebhookEvent = async (eventId: number) => {
  const lockId = crypto.randomUUID();
  const event = await claimWebhookEvent(eventId, lockId);
  if (!event) return false;

  try {
    await processClaimedWebhookEvent(event);
    await completeWebhookEvent(event.id, lockId);
    return true;
  } catch (error) {
    try {
      await failWebhookEvent(event.id, lockId, error);
    } catch (failError) {
      console.error("Could not record Strava webhook failure", failError);
    }
    console.error("Could not process Strava webhook event", error);
    // Rate limits are propagated so the scheduler can pause the remaining
    // Strava work in this run instead of retrying into the limit.
    if (error instanceof StravaRateLimitError) throw error;
    return false;
  }
};

export const recordStravaWebhookEvent = async (event: StravaWebhookEvent) => {
  const eventValues = {
    event_fingerprint: await getEventFingerprint(event),
    object_type: event.object_type,
    object_id: event.object_id,
    aspect_type: event.aspect_type,
    owner_id: event.owner_id,
    event_time: new Date(event.event_time * 1_000).toISOString(),
    updates: event.updates ?? {},
  };
  const { data, error } = await supabase
    .from("strava_webhook_events")
    .insert(eventValues)
    .select("id")
    .maybeSingle();
  if (!error && data) return data.id as number;
  if (error?.code !== "23505") {
    throw new Error(error?.message ?? "Could not record Strava event");
  }

  const { data: existingEvent, error: existingEventError } = await supabase
    .from("strava_webhook_events")
    .select("id")
    .eq("event_fingerprint", eventValues.event_fingerprint)
    .single();
  if (existingEventError || !existingEvent) {
    throw new Error(
      existingEventError?.message ?? "Could not find Strava event",
    );
  }
  return existingEvent.id as number;
};

export const runScheduledWebhookRetries = async (
  subrequestBudget: SubrequestBudget,
): Promise<number | null> => {
  const { data, error } = await supabase
    .from("strava_webhook_events")
    .select("id")
    .is("processed_at", null)
    .lte("next_retry_at", new Date().toISOString())
    .order("next_retry_at", { ascending: true })
    .limit(RETRY_EVENTS_PER_SCHEDULE);
  if (error) throw new Error(error.message);

  for (const event of data ?? []) {
    // Retries are deferred work, so they wait for budgets that fit a full
    // attempt instead of starting what the platform would cut short. Events
    // delivered live are processed by the request handler without these
    // bounds.
    if (!subrequestBudget.canSpend(SUBREQUESTS_TO_RETRY_EVENT)) break;
    if (
      remainingStravaRequestsForBackgroundWork() < STRAVA_READS_TO_RETRY_EVENT
    )
      break;
    try {
      await processStravaWebhookEvent(event.id as number);
    } catch (error) {
      if (error instanceof StravaRateLimitError) {
        return rateLimitPauseUntil(error);
      }
      throw error;
    }
  }
  return null;
};

export const pruneProcessedWebhookEvents = async () => {
  const { error } = await supabase
    .from("strava_webhook_events")
    .delete()
    .not("processed_at", "is", null)
    .lt(
      "processed_at",
      new Date(
        Date.now() - PROCESSED_EVENT_RETENTION_MILLISECONDS,
      ).toISOString(),
    );
  if (error) throw new Error(error.message);
};
