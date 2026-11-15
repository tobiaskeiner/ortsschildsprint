import { supabase } from "../supabase";
import {
  getAccessToken,
  stravaApi,
  stravaApiForAthlete,
  StravaApiError,
  StravaAthleteNotConnectedError,
} from "./client";
import { StravaReconnectRequiredError } from "./crypto";
import type { Activity, ActivitySummary } from "./types";

const ROUTE_COORDINATES_PER_MATCH = 2_000;
const OUTDOOR_RIDE_TYPES = new Set([
  "Ride",
  "EBikeRide",
  "MountainBikeRide",
  "EMountainBikeRide",
  "GravelRide",
  "Handcycle",
  "Velomobile",
]);

interface ProcessActivityOptions {
  accessToken?: string;
  activitySummary?: ActivitySummary;
  skipProcessedCheck?: boolean;
  retryWhenStreamUnavailable?: boolean;
  updateDescription?: boolean;
}

interface ActivityCompletion {
  already_processed: boolean;
  description_updated: boolean;
  new_sign_count: number;
}

export class StravaActivityNotReadyError extends Error {
  constructor() {
    super("Strava has not made this activity route available yet");
  }
}

export const isOutdoorRide = ({
  sport_type: sportType,
  trainer,
  manual,
  private: isPrivate,
}: Pick<ActivitySummary, "sport_type" | "trainer" | "manual" | "private">) =>
  OUTDOOR_RIDE_TYPES.has(sportType ?? "") && !trainer && !manual && !isPrivate;

const appendCollectionSummary = (
  description: string | null,
  newSignCount: number,
) => {
  const signLabel = newSignCount === 1 ? "sign" : "signs";
  const summary = `🪧 Ortschildsprint: ${newSignCount} new city limit ${signLabel} collected.`;
  return `${(description ?? "").replace(/\n*🪧 Ortschildsprint:.*$/s, "").trimEnd()}\n\n${summary}`;
};

const getMatchedOsmIds = async (coordinates: unknown[]) => {
  const matchedOsmIds = new Set<number>();

  for (
    let start = 0;
    start < coordinates.length - 1;
    start += ROUTE_COORDINATES_PER_MATCH - 1
  ) {
    const routeChunk = coordinates.slice(
      start,
      start + ROUTE_COORDINATES_PER_MATCH,
    ) as [number, number][];
    const { data: matchedSigns, error } = await supabase.rpc(
      "sign_ids_near_route",
      {
        route_geojson: {
          type: "LineString",
          coordinates: routeChunk.map(([lat, long]) => [long, lat]),
        },
        max_distance_meters: 10,
      },
    );
    if (error) throw new Error(error.message);
    for (const sign of matchedSigns ?? []) {
      matchedOsmIds.add(sign.osm_id as number);
    }
  }

  return [...matchedOsmIds];
};

const hasCoordinates = (
  coordinates: unknown,
): coordinates is [number, number][] =>
  Array.isArray(coordinates) &&
  coordinates.length >= 2 &&
  coordinates.every(
    (coordinate) =>
      Array.isArray(coordinate) &&
      coordinate.length === 2 &&
      coordinate.every(
        (value) => typeof value === "number" && Number.isFinite(value),
      ),
  );

const getProcessedActivity = async (athleteId: number, activityId: number) => {
  const { data, error } = await supabase
    .from("strava_activities")
    .select("new_sign_count, description_updated")
    .eq("athlete_id", athleteId)
    .eq("activity_id", activityId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

const getAppendSignSummaryPreference = async (athleteId: number) => {
  const { data, error } = await supabase
    .from("strava_athletes")
    .select("append_sign_summary")
    .eq("athlete_id", athleteId)
    .single();
  if (error) throw new Error(error.message);
  return data.append_sign_summary as boolean;
};

export const getUnprocessedActivityIds = async (
  athleteId: number,
  activityIds: number[],
) => {
  if (!activityIds.length) return new Set<number>();
  const { data, error } = await supabase
    .from("strava_activities")
    .select("activity_id")
    .eq("athlete_id", athleteId)
    .in("activity_id", activityIds);
  if (error) throw new Error(error.message);
  return new Set(
    (data ?? []).map((activity) => activity.activity_id as number),
  );
};

export const getProcessedActivityCount = async (athleteId: number) => {
  const { count, error } = await supabase
    .from("strava_activities")
    .select("*", { count: "exact", head: true })
    .eq("athlete_id", athleteId);
  if (error) throw new Error(error.message);
  return count ?? 0;
};

export const removeActivityCollection = async (
  athleteId: number,
  activityId: number,
) => {
  const { error } = await supabase.rpc("remove_strava_activity_collection", {
    athlete_id_input: athleteId,
    activity_id_input: activityId,
  });
  if (error) throw new Error(error.message);
};

/**
 * Confirms with Strava's API that an activity is really unavailable to this
 * integration (deleted, private, or behind a revoked authorization) before
 * collection data is removed. Webhook deliveries are unauthenticated, so a
 * destructive event is only honored on positive confirmation; ambiguous
 * failures throw so the event is retried instead of deleting data.
 */
export const isActivityUnavailable = async (
  athleteId: number,
  activityId: number,
) => {
  try {
    const response = await stravaApiForAthlete(
      athleteId,
      `/activities/${activityId}`,
    );
    const activity = (await response.json()) as Activity;
    return Boolean(activity.private);
  } catch (error) {
    if (error instanceof StravaApiError) {
      // 404 means the activity no longer exists, and a 401 with a freshly
      // refreshed token means the authorization itself was revoked.
      return error.status === 404 || error.status === 401;
    }
    if (
      error instanceof StravaAthleteNotConnectedError ||
      error instanceof StravaReconnectRequiredError
    ) {
      // Nothing is stored for an unconnected athlete, and a revoked
      // authorization cannot be re-verified; removal is safe in both cases.
      return true;
    }
    throw error;
  }
};

const completeActivity = async (
  athleteId: number,
  activityId: number,
  activity: Activity,
  matchedOsmIds: number[],
) => {
  const { data, error } = await supabase.rpc("complete_strava_activity", {
    athlete_id_input: athleteId,
    activity_id_input: activityId,
    activity_started_at_input: activity.start_date,
    matched_osm_ids_input: matchedOsmIds,
  });
  if (error) throw new Error(error.message);

  const completion = (data?.[0] ?? undefined) as ActivityCompletion | undefined;
  if (!completion) throw new Error("Could not complete Strava activity");
  return completion;
};

const updateActivityDescription = async (
  accessToken: string,
  activityId: number,
  activity: Activity,
  newSignCount: number,
) => {
  await stravaApi(accessToken, `/activities/${activityId}`, {
    method: "PUT",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      description: appendCollectionSummary(
        activity.description ?? null,
        newSignCount,
      ),
    }),
  });
};

const markActivityDescriptionUpdated = async (activityId: number) => {
  const { error } = await supabase
    .from("strava_activities")
    .update({ description_updated: true })
    .eq("activity_id", activityId);
  if (error) throw new Error(error.message);
};

/**
 * Processes one activity and reports whether it counts toward the athlete's
 * total of eligible outdoor rides: true for eligible outdoor rides and for
 * previously processed activities whose eligibility may have just changed.
 * Callers use this to invalidate the cached ride total only when it can
 * actually have changed.
 */
export const processActivity = async (
  athleteId: number,
  activityId: number,
  options: ProcessActivityOptions = {},
): Promise<boolean> => {
  const {
    activitySummary,
    retryWhenStreamUnavailable = false,
    skipProcessedCheck = false,
    updateDescription,
  } = options;
  const shouldUpdateDescription =
    updateDescription ?? (await getAppendSignSummaryPreference(athleteId));
  const existingActivity = skipProcessedCheck
    ? undefined
    : await getProcessedActivity(athleteId, activityId);

  const accessToken = options.accessToken ?? (await getAccessToken(athleteId));
  const activity: Activity =
    activitySummary ??
    ((await (
      await stravaApi(accessToken, `/activities/${activityId}`)
    ).json()) as Activity);
  if (activity.private) {
    await removeActivityCollection(athleteId, activityId);
    return Boolean(existingActivity);
  }
  if (!isOutdoorRide(activity)) {
    await removeActivityCollection(athleteId, activityId);
    return Boolean(existingActivity);
  }
  if (
    existingActivity &&
    (!shouldUpdateDescription ||
      existingActivity.new_sign_count === 0 ||
      existingActivity.description_updated)
  ) {
    return true;
  }
  if (existingActivity) {
    await updateActivityDescription(
      accessToken,
      activityId,
      activity,
      existingActivity.new_sign_count,
    );
    await markActivityDescriptionUpdated(activityId);
    return true;
  }

  const streams = (await (
    await stravaApi(
      accessToken,
      `/activities/${activityId}/streams?keys=latlng&key_by_type=true`,
    )
  ).json()) as { latlng?: { data?: unknown } };
  if (!hasCoordinates(streams.latlng?.data)) {
    if (retryWhenStreamUnavailable && activity.map?.summary_polyline) {
      throw new StravaActivityNotReadyError();
    }
    await completeActivity(athleteId, activityId, activity, []);
    return true;
  }

  const matchedOsmIds = await getMatchedOsmIds(streams.latlng.data);
  const completion = await completeActivity(
    athleteId,
    activityId,
    activity,
    matchedOsmIds,
  );
  if (
    shouldUpdateDescription &&
    completion.new_sign_count > 0 &&
    !completion.description_updated
  ) {
    await updateActivityDescription(
      accessToken,
      activityId,
      activity,
      completion.new_sign_count,
    );
    await markActivityDescriptionUpdated(activityId);
  }
  return true;
};
