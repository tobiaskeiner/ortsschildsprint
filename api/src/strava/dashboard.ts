import { supabase } from "../supabase";

const COLLECTION_PAGE_SIZE = 1_000;
const MAP_SIGN_BATCH_SIZE = 500;

const chunk = <Item>(items: Item[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

const getCollectedSigns = async (athleteId: number) => {
  const collectedSigns = [];

  for (let start = 0; ; start += COLLECTION_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("athlete_city_limit_signs")
      .select("osm_id, collected_at, first_activity_id")
      .eq("athlete_id", athleteId)
      .order("collected_at", { ascending: false })
      .order("osm_id", { ascending: false })
      .range(start, start + COLLECTION_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    collectedSigns.push(...(data ?? []));
    if (!data || data.length < COLLECTION_PAGE_SIZE) return collectedSigns;
  }
};

const getMapSigns = async (osmIds: number[]) => {
  const batches = chunk(osmIds, MAP_SIGN_BATCH_SIZE);
  const responses = await Promise.all(
    batches.map(async (osmIdBatch) => {
      const { data, error } = await supabase.rpc("signs_by_osm_ids", {
        osm_ids: osmIdBatch,
      });
      if (error) throw new Error(error.message);
      return data ?? [];
    }),
  );
  return responses.flat();
};

/**
 * The dashboard needs the athlete's ride total to express progress. A
 * completed import has processed every eligible ride of the athlete's entire
 * history, so the processed rides themselves are the total — always current
 * as new rides arrive, and known without any Strava request. The one-shot
 * history scan only serves imports that are still running; its snapshot
 * could not keep up with new rides anyway, and a long history can outlive the
 * dashboard request's waitUntil window, which would leave its claim stuck and
 * the dashboard without a total at all.
 */
const resolveTotalRides = (
  completed: boolean | null | undefined,
  totalRideCount: number | null | undefined,
  processedRideCount: number,
) =>
  completed
    ? Math.max(totalRideCount ?? 0, processedRideCount)
    : (totalRideCount ?? null);

export const getDashboard = async (athleteId: number) => {
  const [
    { data: athlete, error: athleteError },
    collectedSigns,
    { count: collectedSignCount, error: collectedSignCountError },
    { count: activityCount, error: activityCountError },
    { data: importState, error: importStateError },
  ] = await Promise.all([
    supabase
      .from("strava_athletes")
      .select(
        "display_name, profile_image_url, append_sign_summary, granted_scopes",
      )
      .eq("athlete_id", athleteId)
      .single(),
    getCollectedSigns(athleteId),
    supabase
      .from("athlete_city_limit_signs")
      .select("osm_id", { count: "exact", head: true })
      .eq("athlete_id", athleteId),
    supabase
      .from("strava_activities")
      .select("activity_id", { count: "exact", head: true })
      .eq("athlete_id", athleteId),
    supabase
      .from("strava_import_state")
      .select(
        "analyzed_ride_count, completed, full_history_requested, initial_import_complete, total_ride_count, updated_at",
      )
      .eq("athlete_id", athleteId)
      .maybeSingle(),
  ]);
  for (const error of [
    athleteError,
    collectedSignCountError,
    activityCountError,
    importStateError,
  ]) {
    if (error) throw new Error(error.message);
  }

  const osmIds = collectedSigns.map((sign) => sign.osm_id as number);
  const signs = osmIds.length ? await getMapSigns(osmIds) : [];

  return {
    athlete,
    generatedAt: new Date().toISOString(),
    stats: {
      collectedSigns: collectedSignCount ?? 0,
      processedActivities: activityCount ?? 0,
      totalRides: resolveTotalRides(
        importState?.completed,
        importState?.total_ride_count,
        activityCount ?? 0,
      ),
    },
    importState,
    collection: collectedSigns,
    signs,
  };
};

export const getDashboardProgress = async (athleteId: number) => {
  const { data: importState, error } = await supabase
    .from("strava_import_state")
    .select("analyzed_ride_count, completed, total_ride_count")
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    totalRides: resolveTotalRides(
      importState?.completed,
      importState?.total_ride_count,
      importState?.analyzed_ride_count ?? 0,
    ),
  };
};
