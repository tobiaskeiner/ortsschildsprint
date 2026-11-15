import { supabase } from "../supabase";
import {
  getAccessToken,
  rateLimitPauseUntil,
  stravaApi,
  StravaRateLimitError,
} from "./client";
import {
  getProcessedActivityCount,
  getUnprocessedActivityIds,
  isOutdoorRide,
  processActivity,
} from "./activities";
import type { ActivitySummary } from "./types";

const HISTORIC_RIDES_PER_BATCH = 15;
const INITIAL_RIDES_PER_IMPORT = 20;
// One batch per pending athlete per schedule keeps every athlete's import
// progressing instead of serializing all athletes behind the oldest request.
// The per-athlete Strava usage stays far below Strava's rate limits.
const MAX_ATHLETES_PER_SCHEDULE = 25;
// Keeps one scheduled invocation comfortably inside Worker execution limits
// even when individual batches are slow; the next schedule continues the work.
const SCHEDULED_IMPORT_BUDGET_MILLISECONDS = 2 * 60 * 1_000;
const totalRideCountRefreshes = new Map<number, Promise<void>>();

export class StravaImportInProgressError extends Error {
  constructor() {
    super("A historic import is already running. Try again shortly.");
  }
}

export const withStravaImportLock = async <Result>(
  athleteId: number,
  callback: () => Promise<Result>,
) => {
  const lockId = crypto.randomUUID();
  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_strava_import_lock",
    { athlete_id_input: athleteId, lock_id_input: lockId },
  );
  if (claimError) throw new Error(claimError.message);
  if (!claimed) throw new StravaImportInProgressError();

  try {
    return await callback();
  } finally {
    const { error: releaseError } = await supabase.rpc(
      "release_strava_import_lock",
      { athlete_id_input: athleteId, lock_id_input: lockId },
    );
    if (releaseError)
      console.error("Could not release Strava import lock", releaseError);
  }
};

interface GetActivitiesOptions {
  before?: number | null;
  page?: number;
}

const getActivities = async (
  accessToken: string,
  { before, page }: GetActivitiesOptions = {},
) => {
  const query = new URLSearchParams({ per_page: "200" });
  if (before) query.set("before", String(before));
  if (page) query.set("page", String(page));
  return (await (
    await stravaApi(accessToken, `/athlete/activities?${query}`)
  ).json()) as ActivitySummary[];
};

const getCursor = (activity: ActivitySummary | undefined) =>
  activity
    ? Math.floor(new Date(activity.start_date).getTime() / 1_000) - 1
    : null;

const getRidesForBatch = (
  activities: ActivitySummary[],
  maximumRideCount: number,
) => {
  const eligibleRides = activities.filter(isOutdoorRide);
  const initialRides = eligibleRides.slice(0, maximumRideCount);
  const cutoffStartDate = initialRides.at(-1)?.start_date;
  const rides = cutoffStartDate
    ? eligibleRides.filter(
        (activity, index) =>
          index < maximumRideCount || activity.start_date === cutoffStartDate,
      )
    : initialRides;
  return {
    hasMoreEligibleRides: eligibleRides.length > rides.length,
    rides,
  };
};

const getTotalRideCount = async (accessToken: string) => {
  let page = 1;
  let totalRideCount = 0;

  for (;;) {
    const activities = await getActivities(accessToken, { page });
    totalRideCount += activities.filter(isOutdoorRide).length;
    if (activities.length < 200) return totalRideCount;
    page += 1;
  }
};

const refreshTotalRideCount = async (athleteId: number) => {
  // The claim keeps concurrent dashboard loads from duplicating the scan. A
  // failed scan deliberately leaves the claim in place: it goes stale after
  // ten minutes, so repeated failures back off instead of re-scanning on
  // every dashboard load.
  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_total_ride_count_refresh",
    { athlete_id_input: athleteId },
  );
  if (claimError) throw new Error(claimError.message);
  if (!claimed) return;

  const totalRideCount = await getTotalRideCount(
    await getAccessToken(athleteId),
  );
  const { error: completeError } = await supabase.rpc(
    "complete_total_ride_count_refresh",
    {
      athlete_id_input: athleteId,
      total_ride_count_input: totalRideCount,
    },
  );
  if (completeError) throw new Error(completeError.message);
};

/**
 * Keeps a slow first-time Strava history count out of the request that renders
 * the dashboard. The map also absorbs React development-mode's duplicate
 * effect invocation while this worker isolate is alive.
 */
export const queueTotalRideCountRefresh = (athleteId: number) => {
  const existingRefresh = totalRideCountRefreshes.get(athleteId);
  if (existingRefresh) return existingRefresh;

  const refresh = refreshTotalRideCount(athleteId)
    .catch((error) =>
      console.error("Could not refresh Strava ride total", error),
    )
    .finally(() => totalRideCountRefreshes.delete(athleteId));
  totalRideCountRefreshes.set(athleteId, refresh);
  return refresh;
};

const processActivities = async (
  athleteId: number,
  activities: ActivitySummary[],
  accessToken: string,
) => {
  const processedActivityIds = await getUnprocessedActivityIds(
    athleteId,
    activities.map((activity) => activity.id),
  );
  for (const activity of activities) {
    if (processedActivityIds.has(activity.id)) continue;
    await processActivity(athleteId, activity.id, {
      accessToken,
      activitySummary: activity,
      skipProcessedCheck: true,
      updateDescription: false,
    });
  }
};

/**
 * Processes up to one batch of unprocessed eligible rides from the athlete's
 * newest activities, catching rides whose webhook delivery was missed (Strava
 * retries only three times). Used by import batches and scheduled
 * reconciliation. Returns the rides it processed and the page size scanned.
 */
const syncRecentRides = async (athleteId: number, accessToken: string) => {
  const activities = await getActivities(accessToken);
  const processedActivityIds = await getUnprocessedActivityIds(
    athleteId,
    activities.map((activity) => activity.id),
  );
  const rides = activities
    .filter(isOutdoorRide)
    .filter((activity) => !processedActivityIds.has(activity.id))
    .slice(0, HISTORIC_RIDES_PER_BATCH);
  await processActivities(athleteId, rides, accessToken);
  return { processedRides: rides, scannedActivities: activities.length };
};

const importHistoricBatch = async (athleteId: number) => {
  const { data: state, error: stateError } = await supabase
    .from("strava_import_state")
    .select("next_before_epoch, completed, total_ride_count")
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (stateError) throw new Error(stateError.message);
  if (state?.completed) {
    return { completed: true, processedActivities: 0, scannedActivities: 0 };
  }

  const accessToken = await getAccessToken(athleteId);

  // Reconcile the newest rides before walking the historic cursor. The cursor
  // is untouched, so the historic walk continues independently.
  const { processedRides: recentRides, scannedActivities: recentScanned } =
    await syncRecentRides(athleteId, accessToken);
  if (recentRides.length > 0) {
    const { error } = await supabase.from("strava_import_state").upsert({
      athlete_id: athleteId,
      completed: false,
      analyzed_ride_count: await getProcessedActivityCount(athleteId),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return {
      completed: false,
      processedActivities: recentRides.length,
      scannedActivities: recentScanned,
    };
  }

  const activities = await getActivities(accessToken, {
    before: state?.next_before_epoch,
  });
  const { rides, hasMoreEligibleRides } = getRidesForBatch(
    activities,
    HISTORIC_RIDES_PER_BATCH,
  );
  await processActivities(athleteId, rides, accessToken);

  const cursorActivity = rides.at(-1) ?? activities.at(-1);
  const completed = activities.length < 200 && !hasMoreEligibleRides;
  const { error } = await supabase.from("strava_import_state").upsert({
    athlete_id: athleteId,
    next_before_epoch: getCursor(cursorActivity),
    completed,
    analyzed_ride_count: await getProcessedActivityCount(athleteId),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  return {
    completed,
    processedActivities: rides.length,
    scannedActivities: activities.length,
  };
};

export const importHistoricBatchExclusively = (athleteId: number) =>
  withStravaImportLock(athleteId, () => importHistoricBatch(athleteId));

export const ensureInitialImportState = async (athleteId: number) => {
  const { error } = await supabase
    .from("strava_import_state")
    .insert({ athlete_id: athleteId });
  if (error?.code === "23505") return;
  if (error) throw new Error(error.message);
};

const importInitialRides = async (athleteId: number) => {
  await ensureInitialImportState(athleteId);
  const { data: state, error: stateError } = await supabase
    .from("strava_import_state")
    .select("initial_import_complete")
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (stateError) throw new Error(stateError.message);
  if (state?.initial_import_complete) return;

  const accessToken = await getAccessToken(athleteId);
  const activities = await getActivities(accessToken);
  const { rides } = getRidesForBatch(activities, INITIAL_RIDES_PER_IMPORT);
  await processActivities(athleteId, rides, accessToken);

  const cursorActivity = rides.at(-1) ?? activities.at(-1);
  const { error } = await supabase.from("strava_import_state").upsert({
    athlete_id: athleteId,
    next_before_epoch: getCursor(cursorActivity),
    initial_import_complete: true,
    analyzed_ride_count: await getProcessedActivityCount(athleteId),
    completed: false,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
};

export const importInitialRidesExclusively = (athleteId: number) =>
  withStravaImportLock(athleteId, () => importInitialRides(athleteId));

const deferFailedScheduledImport = async (athleteId: number) => {
  const { error } = await supabase
    .from("strava_import_state")
    .update({ updated_at: new Date().toISOString() })
    .eq("athlete_id", athleteId);
  if (error) {
    console.error("Could not defer failed Strava import", error);
  }
};

/**
 * Processes one import batch for every pending athlete per schedule, so a
 * backlog for one athlete cannot starve the others. The database lock still
 * bounds each athlete to one batch at a time, and the athlete cap and time
 * budget keep a single scheduled invocation inside Worker limits. Returns the
 * epoch time until which Strava requests should pause when a rate limit was
 * hit, or null.
 */
const runScheduledImportBatches = async (
  getPendingAthleteIds: () => Promise<number[]>,
  importBatch: (athleteId: number) => Promise<unknown>,
  maxAthletes: number = MAX_ATHLETES_PER_SCHEDULE,
  budgetMilliseconds: number = SCHEDULED_IMPORT_BUDGET_MILLISECONDS,
): Promise<number | null> => {
  const pendingAthleteIds = await getPendingAthleteIds();
  const deadline = Date.now() + budgetMilliseconds;
  for (const [index, athleteId] of pendingAthleteIds.entries()) {
    if (index >= maxAthletes || Date.now() >= deadline) return null;
    try {
      await importBatch(athleteId);
    } catch (error) {
      if (error instanceof StravaImportInProgressError) continue;
      await deferFailedScheduledImport(athleteId);
      console.error(
        `Scheduled Strava import failed for athlete ${athleteId}`,
        error,
      );
      // Strava's application-wide rate limit is shared by all athletes, so a
      // rate-limited batch pauses the remaining Strava work in this run
      // instead of burning it on requests that would also be rejected.
      if (error instanceof StravaRateLimitError) {
        return rateLimitPauseUntil(error);
      }
    }
  }
  return null;
};

const getPendingHistoricAthleteIds = async () => {
  const { data, error } = await supabase
    .from("strava_import_state")
    .select("athlete_id")
    .eq("completed", false)
    .eq("full_history_requested", true)
    .order("updated_at", { ascending: true })
    .limit(MAX_ATHLETES_PER_SCHEDULE);
  if (error) throw new Error(error.message);
  return (data ?? []).map((state) => state.athlete_id as number);
};

const getPendingInitialAthleteIds = async () => {
  const { data, error } = await supabase
    .from("strava_import_state")
    .select("athlete_id")
    .eq("initial_import_complete", false)
    .eq("full_history_requested", false)
    .order("updated_at", { ascending: true })
    .limit(MAX_ATHLETES_PER_SCHEDULE);
  if (error) throw new Error(error.message);
  return (data ?? []).map((state) => state.athlete_id as number);
};

export const runScheduledHistoricImport = () =>
  runScheduledImportBatches(
    getPendingHistoricAthleteIds,
    importHistoricBatchExclusively,
  );

export const runScheduledInitialImport = () =>
  runScheduledImportBatches(
    getPendingInitialAthleteIds,
    importInitialRidesExclusively,
  );

const RECONCILE_ATHLETES_PER_SCHEDULE = 5;
const RECONCILE_BUDGET_MILLISECONDS = 30 * 1_000;

const reconcileAthlete = async (athleteId: number) => {
  const accessToken = await getAccessToken(athleteId);
  const { processedRides } = await syncRecentRides(athleteId, accessToken);
  await supabase.from("strava_import_state").upsert({
    athlete_id: athleteId,
    last_reconciled_at: new Date().toISOString(),
    ...(processedRides.length > 0
      ? { analyzed_ride_count: await getProcessedActivityCount(athleteId) }
      : {}),
  });
};

/**
 * Reconciles a few connected athletes per schedule, round-robin by
 * `last_reconciled_at`, so a ride whose webhook delivery was missed is
 * recovered for every connected athlete without waiting for an Import
 * request — including athletes whose historic import already completed.
 */
export const runScheduledReconciliation = () =>
  runScheduledImportBatches(
    async () => {
      const { data, error } = await supabase
        .from("strava_import_state")
        .select("athlete_id")
        .order("last_reconciled_at", { ascending: true, nullsFirst: true })
        .limit(RECONCILE_ATHLETES_PER_SCHEDULE);
      if (error) throw new Error(error.message);
      return (data ?? []).map((state) => state.athlete_id as number);
    },
    (athleteId) =>
      withStravaImportLock(athleteId, () => reconcileAthlete(athleteId)),
    RECONCILE_ATHLETES_PER_SCHEDULE,
    RECONCILE_BUDGET_MILLISECONDS,
  );
