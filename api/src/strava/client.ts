import { bindings } from "../config";
import { supabase } from "../supabase";
import {
  decryptToken,
  encryptToken,
  StravaReconnectRequiredError,
} from "./crypto";
import { stravaTokenResponseSchema } from "./types";

export class StravaApiError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
  ) {
    super(`Strava API request failed: ${status} ${statusText}`);
  }
}

export class StravaAthleteNotConnectedError extends Error {
  constructor() {
    super("Strava athlete is not connected");
  }
}

export const stravaApi = async (
  accessToken: string,
  path: string,
  init?: RequestInit,
) => {
  const response = await fetch(`https://www.strava.com/api/v3${path}`, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, ...init?.headers },
  });
  if (!response.ok) {
    throw new StravaApiError(response.status, response.statusText);
  }
  return response;
};

export const getAccessToken = async (
  athleteId: number,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
) => {
  const { data: athlete, error } = await supabase
    .from("strava_athletes")
    .select(
      "access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at",
    )
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!athlete) throw new StravaAthleteNotConnectedError();

  if (
    !forceRefresh &&
    new Date(athlete.access_token_expires_at).getTime() > Date.now() + 60_000
  ) {
    return decryptToken(athlete.access_token_ciphertext);
  }

  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: bindings.STRAVA_CLIENT_ID,
      client_secret: bindings.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: await decryptToken(athlete.refresh_token_ciphertext),
    }),
  });
  if (!response.ok) {
    // A 400 or 401 from the token endpoint is Strava positively rejecting the
    // refresh token, which means the authorization was revoked. Any other
    // status is ambiguous and must not be treated as revocation.
    if (response.status === 400 || response.status === 401) {
      throw new StravaReconnectRequiredError();
    }
    throw new Error("Could not refresh Strava access token");
  }

  const refreshed = stravaTokenResponseSchema.safeParse(await response.json());
  if (!refreshed.success) {
    throw new Error("Received an invalid Strava token response");
  }
  const { error: updateTokenError } = await supabase
    .from("strava_athletes")
    .update({
      access_token_ciphertext: await encryptToken(refreshed.data.access_token),
      refresh_token_ciphertext: await encryptToken(
        refreshed.data.refresh_token,
      ),
      access_token_expires_at: new Date(
        refreshed.data.expires_at * 1_000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("athlete_id", athleteId);
  if (updateTokenError) throw new Error(updateTokenError.message);
  return refreshed.data.access_token;
};

/**
 * Performs a Strava API request with the athlete's stored authorization,
 * retrying once with a forcibly refreshed token on 401: a concurrent request
 * can refresh the token between this module's read and its API call, so a
 * single 401 does not prove the authorization was revoked.
 */
export const stravaApiForAthlete = async (athleteId: number, path: string) => {
  try {
    return await stravaApi(await getAccessToken(athleteId), path);
  } catch (error) {
    if (!(error instanceof StravaApiError) || error.status !== 401) throw error;
    return stravaApi(
      await getAccessToken(athleteId, { forceRefresh: true }),
      path,
    );
  }
};

/**
 * Confirms with Strava's API that an athlete's stored authorization still
 * grants API access. Webhook deliveries are unauthenticated, so a
 * deauthorization event is only honored once Strava positively rejects the
 * stored credentials; ambiguous failures throw so the event is retried
 * instead of deleting the athlete's data.
 */
export const isAthleteAuthorized = async (athleteId: number) => {
  try {
    await stravaApiForAthlete(athleteId, "/athlete");
    return true;
  } catch (error) {
    if (error instanceof StravaApiError && error.status === 401) return false;
    if (
      error instanceof StravaAthleteNotConnectedError ||
      error instanceof StravaReconnectRequiredError
    ) {
      return false;
    }
    throw error;
  }
};
