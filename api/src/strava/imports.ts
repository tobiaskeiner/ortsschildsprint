import { supabase } from "../supabase";
import { getAccessToken, stravaApi } from "./client";
import {
  getProcessedActivityCount,
  getUnprocessedActivityIds,
  isOutdoorRide,
  processActivity,
} from "./activities";
import type { ActivitySummary } from "./types";

const HISTORIC_RIDES_PER_BATCH = 15;
const INITIAL_RIDES_PER_IMPORT = 20;
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
  const { data: importState, error: stateError } = await supabase
    .from("strava_import_state")
    .select("total_ride_count")
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (stateError) throw new Error(stateError.message);
  if (!importState || importState.total_ride_count !== null) return;

  const totalRideCount = await getTotalRideCount(
    await getAccessToken(athleteId),
  );
  const { error: updateError } = await supabase
    .from("strava_import_state")
    .update({ total_ride_count: totalRideCount })
    .eq("athlete_id", athleteId)
    .is("total_ride_count", null);
  if (updateError) throw new Error(updateError.message);
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

export const runScheduledHistoricImport = async () => {
  const { data: state, error } = await supabase
    .from("strava_import_state")
    .select("athlete_id")
    .eq("completed", false)
    .eq("full_history_requested", true)
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!state) return false;
  try {
    await importHistoricBatchExclusively(state.athlete_id);
  } catch (error) {
    if (error instanceof StravaImportInProgressError) return;
    await deferFailedScheduledImport(state.athlete_id);
    throw error;
  }
  return true;
};

export const runScheduledInitialImport = async () => {
  const { data: state, error } = await supabase
    .from("strava_import_state")
    .select("athlete_id")
    .eq("initial_import_complete", false)
    .eq("full_history_requested", false)
    .order("updated_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!state) return;
  try {
    await importInitialRidesExclusively(state.athlete_id);
  } catch (error) {
    if (error instanceof StravaImportInProgressError) return;
    await deferFailedScheduledImport(state.athlete_id);
    throw error;
  }
};
