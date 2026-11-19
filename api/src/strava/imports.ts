import { supabase } from "../supabase";
import {
  startSubrequestBudget,
  type SubrequestBudget,
  SubrequestBudgetExhaustedError,
} from "../subrequests";
import {
  getAccessToken,
  rateLimitPauseUntil,
  remainingStravaRequestsForBackgroundWork,
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

// Each ride costs a Strava stream request plus one sign-matching request per
// 2,000 GPS coordinates, so its subrequest and Strava-read cost is checked
// before it starts. Batches therefore no longer need a fixed two-ride size to
// squeeze through the Worker subrequest limit (50 per invocation on the free
// plan, shared by every Strava and Supabase call in the run): a clean cutoff
// leaves partially processed work to the next schedule. Strava's rate limits
// — shared by every task that calls its API — are enforced by pacing against
// the usage Strava reports with every response, not by small batches.
const HISTORIC_RIDES_PER_BATCH = 10;
const INITIAL_RIDES_PER_IMPORT = 10;
// One batch per pending athlete per schedule keeps every athlete's import
// progressing instead of serializing all athletes behind the oldest request.
// The per-athlete Strava usage stays far below Strava's rate limits; the
// round-robin order moves an athlete to the back once its batch completes.
const MAX_ATHLETES_PER_SCHEDULE = 25;
// The scheduler runs every minute and hands each invocation its own
// subrequest budget, so a batch that cannot finish in time is rare; the next
// schedule continues where the cursor stopped.
const SCHEDULED_IMPORT_BUDGET_MILLISECONDS = 45 * 1_000;
// The estimated subrequest cost of starting an athlete's batch: import lock
// and state requests, token reads, the two activity listings, and enough
// headroom for the first ride.
const SUBREQUESTS_TO_START_BATCH = 14;
// Every batch needs two activity listings and a ride's stream request
// against Strava's window; less remaining room than that belongs to the
// schedules within the window that have enough again.
const STRAVA_READS_TO_START_BATCH = 3;
const STRAVA_READS_PER_RIDE = 1;
const SUBREQUESTS_TO_START_RIDE = 3;
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
    // The scan pages through an athlete's entire history, so it defers to
    // the background headroom: it stops before hitting Strava's windows, and
    // its claim deliberately goes stale so the next dashboard load retries.
    if (remainingStravaRequestsForBackgroundWork() < 1) {
      throw new StravaRateLimitError(null, "/athlete/activities");
    }
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

interface ProcessActivitiesOptions {
  /** The number of rides to process before stopping. */
  maxRides: number;
  subrequestBudget?: SubrequestBudget;
}

/**
 * Processes the activities a batch has listed, pausing before a ride whose
 * budgets cannot cover it. It returns only the rides it fully processed, so a
 * caller moves its cursor past exactly those rides and the next schedule
 * picks up where this one stopped.
 */
const processActivities = async (
  athleteId: number,
  activities: ActivitySummary[],
  accessToken: string,
  { maxRides, subrequestBudget }: ProcessActivitiesOptions,
) => {
  const processedActivityIds = await getUnprocessedActivityIds(
    athleteId,
    activities.map((activity) => activity.id),
  );
  const processedRides: ActivitySummary[] = [];
  for (const activity of activities) {
    if (processedActivityIds.has(activity.id)) continue;
    if (processedRides.length >= maxRides) break;
    // Each ride costs one Strava read and, typically, a stream, route-match,
    // and completion request; longer routes cost more sign-matching requests.
    // Stops here are clean: the ride stays unprocessed, so it is retried by
    // the next schedule instead of being cut off mid-request.
    if (remainingStravaRequestsForBackgroundWork() < STRAVA_READS_PER_RIDE)
      break;
    if (!subrequestBudget?.canSpend(SUBREQUESTS_TO_START_RIDE)) break;
    try {
      await processActivity(athleteId, activity.id, {
        accessToken,
        activitySummary: activity,
        skipProcessedCheck: true,
        updateDescription: false,
        subrequestBudget,
      });
      processedRides.push(activity);
    } catch (error) {
      if (error instanceof SubrequestBudgetExhaustedError) break;
      throw error;
    }
  }
  return processedRides;
};

/**
 * Processes the athlete's newest activities, catching rides whose webhook
 * delivery was missed (Strava retries only three times). Used by import
 * batches and scheduled reconciliation. Returns the rides it processed and
 * the page size scanned.
 */
const syncRecentRides = async (
  athleteId: number,
  accessToken: string,
  { maxRides, subrequestBudget }: ProcessActivitiesOptions,
) => {
  const activities = await getActivities(accessToken);
  const processedRides = await processActivities(
    athleteId,
    activities.filter(isOutdoorRide),
    accessToken,
    { maxRides, subrequestBudget },
  );
  return { processedRides, scannedActivities: activities.length };
};

const importHistoricBatch = async (
  athleteId: number,
  subrequestBudget: SubrequestBudget,
) => {
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

  // Reconcile the newest rides before walking the historic cursor, so a ride
  // whose webhook delivery was missed is imported by the next batch or
  // Import request. The historic cursor is untouched by this reconciliation;
  // the walk below continues with whatever batch capacity remains.
  const recent = await syncRecentRides(athleteId, accessToken, {
    maxRides: HISTORIC_RIDES_PER_BATCH,
    subrequestBudget,
  });
  const processedRides = [...recent.processedRides];
  const remainingRides = HISTORIC_RIDES_PER_BATCH - processedRides.length;
  let historicScanned = 0;
  let cursorActivity: ActivitySummary | undefined;
  let completed = false;

  if (remainingRides > 0 && remainingStravaRequestsForBackgroundWork() > 0) {
    const activities = await getActivities(accessToken, {
      before: state?.next_before_epoch,
    });
    historicScanned = activities.length;
    const { rides, hasMoreEligibleRides } = getRidesForBatch(
      activities,
      remainingRides,
    );
    const historicProcessedRides = await processActivities(
      athleteId,
      rides,
      accessToken,
      { maxRides: remainingRides, subrequestBudget },
    );
    processedRides.push(...historicProcessedRides);

    // The cursor only advances past rides this run fully processed; rides it
    // could not afford stay ahead of the cursor for the next schedule. When
    // nothing held the page back, ineligible activities were scanned as a
    // whole, and a short page with no pending eligible rides ends the walk.
    const partiallyProcessed = historicProcessedRides.length < rides.length;
    cursorActivity =
      historicProcessedRides.at(-1) ??
      (partiallyProcessed || hasMoreEligibleRides
        ? undefined
        : activities.at(-1));
    completed =
      activities.length < 200 && !hasMoreEligibleRides && !partiallyProcessed;
  }

  if (
    processedRides.length === 0 &&
    cursorActivity === undefined &&
    !completed
  ) {
    return {
      completed: false,
      processedActivities: 0,
      scannedActivities: recent.scannedActivities + historicScanned,
    };
  }

  const { error } = await supabase.from("strava_import_state").upsert({
    athlete_id: athleteId,
    ...(cursorActivity ? { next_before_epoch: getCursor(cursorActivity) } : {}),
    completed,
    ...(processedRides.length > 0 || cursorActivity || completed
      ? { analyzed_ride_count: await getProcessedActivityCount(athleteId) }
      : {}),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  return {
    completed,
    processedActivities: processedRides.length,
    scannedActivities: recent.scannedActivities + historicScanned,
  };
};

export const importHistoricBatchExclusively = (
  athleteId: number,
  subrequestBudget: SubrequestBudget = startSubrequestBudget(),
) =>
  withStravaImportLock(athleteId, () =>
    importHistoricBatch(athleteId, subrequestBudget),
  );

export const ensureInitialImportState = async (athleteId: number) => {
  const { error } = await supabase
    .from("strava_import_state")
    .insert({ athlete_id: athleteId });
  if (error?.code === "23505") return;
  if (error) throw new Error(error.message);
};

const importInitialRides = async (
  athleteId: number,
  subrequestBudget: SubrequestBudget,
) => {
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
  const processedRides = await processActivities(
    athleteId,
    rides,
    accessToken,
    { maxRides: INITIAL_RIDES_PER_IMPORT, subrequestBudget },
  );

  // As with the historic cursor, the initial cursor only passes rides that
  // were fully processed; the scheduled sweeps pick up what a budget cut
  // left behind.
  const cursorActivity =
    processedRides.at(-1) ??
    (processedRides.length < rides.length
      ? undefined
      : (rides.at(-1) ?? activities.at(-1)));
  const { error } = await supabase.from("strava_import_state").upsert({
    athlete_id: athleteId,
    next_before_epoch: getCursor(cursorActivity),
    initial_import_complete: true,
    ...(processedRides.length > 0
      ? { analyzed_ride_count: await getProcessedActivityCount(athleteId) }
      : {}),
    completed: false,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
};

export const importInitialRidesExclusively = (
  athleteId: number,
  subrequestBudget: SubrequestBudget = startSubrequestBudget(),
) =>
  withStravaImportLock(athleteId, () =>
    importInitialRides(athleteId, subrequestBudget),
  );

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
 * backlog for one athlete cannot starve the others. The database lock bounds
 * each athlete to one batch at a time, the athlete cap and time budget keep a
 * single scheduled invocation inside Worker limits, and the two guard rails
 * stop starting work whose cost does not fit: the per-invocation subrequest
 * budget shared with every other task of the run, and the Strava request
 * headroom left above what live webhook processing needs. Returns the epoch
 * time until which Strava requests should pause when a rate limit was hit, or
 * null.
 */
const runScheduledImportBatches = async (
  getPendingAthleteIds: () => Promise<number[]>,
  importBatch: (
    athleteId: number,
    subrequestBudget: SubrequestBudget,
  ) => Promise<unknown>,
  maxAthletes: number = MAX_ATHLETES_PER_SCHEDULE,
  budgetMilliseconds: number = SCHEDULED_IMPORT_BUDGET_MILLISECONDS,
  subrequestBudget: SubrequestBudget,
): Promise<number | null> => {
  const pendingAthleteIds = await getPendingAthleteIds();
  const deadline = Date.now() + budgetMilliseconds;
  for (const [index, athleteId] of pendingAthleteIds.entries()) {
    if (index >= maxAthletes || Date.now() >= deadline) return null;
    // When a budget runs out, the remaining athletes wait for the next
    // schedule instead of starting batches the platform would cut short.
    if (!subrequestBudget.canSpend(SUBREQUESTS_TO_START_BATCH)) return null;
    if (
      remainingStravaRequestsForBackgroundWork() < STRAVA_READS_TO_START_BATCH
    )
      return null;
    try {
      await importBatch(athleteId, subrequestBudget);
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

export const runScheduledHistoricImport = (
  subrequestBudget: SubrequestBudget,
) =>
  runScheduledImportBatches(
    getPendingHistoricAthleteIds,
    importHistoricBatchExclusively,
    MAX_ATHLETES_PER_SCHEDULE,
    SCHEDULED_IMPORT_BUDGET_MILLISECONDS,
    subrequestBudget,
  );

export const runScheduledInitialImport = (subrequestBudget: SubrequestBudget) =>
  runScheduledImportBatches(
    getPendingInitialAthleteIds,
    importInitialRidesExclusively,
    MAX_ATHLETES_PER_SCHEDULE,
    SCHEDULED_IMPORT_BUDGET_MILLISECONDS,
    subrequestBudget,
  );

// Reconciliation is a safety net for missed webhook deliveries, so each
// connected athlete is re-checked when its last sweep is older than the
// interval below — a few list requests per athlete per day instead of a fixed
// number of athletes on every schedule. Up to
// (RECONCILE_ATHLETES_PER_SCHEDULE) athletes are caught up per schedule.
const RECONCILE_ATHLETES_PER_SCHEDULE = 4;
const RECONCILE_INTERVAL_MILLISECONDS = 2 * 60 * 60 * 1_000;
const RECONCILE_BUDGET_MILLISECONDS = 45 * 1_000;

const getPendingReconciliationAthleteIds = async () => {
  const dueBefore = new Date(
    Date.now() - RECONCILE_INTERVAL_MILLISECONDS,
  ).toISOString();
  const { data, error } = await supabase
    .from("strava_import_state")
    .select("athlete_id")
    .or(`last_reconciled_at.is.null,last_reconciled_at.lt.${dueBefore}`)
    .order("last_reconciled_at", { ascending: true, nullsFirst: true })
    .limit(RECONCILE_ATHLETES_PER_SCHEDULE);
  if (error) throw new Error(error.message);
  return (data ?? []).map((state) => state.athlete_id as number);
};

const reconcileAthlete = async (
  athleteId: number,
  subrequestBudget: SubrequestBudget,
) => {
  if (remainingStravaRequestsForBackgroundWork() < 1) return;
  const accessToken = await getAccessToken(athleteId);
  const { processedRides } = await syncRecentRides(athleteId, accessToken, {
    maxRides: HISTORIC_RIDES_PER_BATCH,
    subrequestBudget,
  });
  await supabase.from("strava_import_state").upsert({
    athlete_id: athleteId,
    last_reconciled_at: new Date().toISOString(),
    ...(processedRides.length > 0
      ? { analyzed_ride_count: await getProcessedActivityCount(athleteId) }
      : {}),
  });
};

/**
 * Reconciles connected athletes whose last sweep is due, oldest first, so a
 * ride whose webhook delivery was missed is recovered for every connected
 * athlete without waiting for an Import request — including athletes whose
 * historic import already completed.
 */
export const runScheduledReconciliation = (
  subrequestBudget: SubrequestBudget,
) =>
  runScheduledImportBatches(
    getPendingReconciliationAthleteIds,
    (athleteId, budget) =>
      withStravaImportLock(athleteId, () =>
        reconcileAthlete(athleteId, budget),
      ),
    RECONCILE_ATHLETES_PER_SCHEDULE,
    RECONCILE_BUDGET_MILLISECONDS,
    subrequestBudget,
  );
