import { bindings } from "../config";
import { supabase } from "../supabase";
import {
  decryptToken,
  encryptToken,
  StravaReconnectRequiredError,
} from "./crypto";
import { stravaTokenResponseSchema, type StravaTokenResponse } from "./types";

export class StravaApiError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
  ) {
    super(`Strava API request failed: ${status} ${statusText}`);
  }
}

/**
 * Strava rejected the request because a rate limit was hit. Callers do not
 * wait out the window (Retry-After can be minutes); they defer instead —
 * scheduled batches move on to the next athlete, webhook events back off,
 * and the ride-total scan leaves its claim to go stale.
 */
export class StravaRateLimitError extends Error {
  constructor(
    readonly retryAfterSeconds: number | null,
    path: string,
  ) {
    super(
      `Strava API rate limit exceeded for ${path}` +
        (retryAfterSeconds === null
          ? ""
          : `; retry after ${retryAfterSeconds} seconds`),
    );
  }
}

/** Strava's rate-limit windows are 15 minutes; assume a full window when the response carries no Retry-After. */
const STRAVA_RATE_LIMIT_DEFAULT_PAUSE_SECONDS = 15 * 60;

/** Epoch milliseconds until Strava requests may resume after a rate limit. */
export const rateLimitPauseUntil = (error: StravaRateLimitError) =>
  Date.now() +
  (error.retryAfterSeconds ?? STRAVA_RATE_LIMIT_DEFAULT_PAUSE_SECONDS) * 1_000;

export class StravaAthleteNotConnectedError extends Error {
  constructor() {
    super("Strava athlete is not connected");
  }
}

interface StoredAthleteTokens {
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  access_token_expires_at: string;
}

const parseRetryAfterSeconds = (response: Response) => {
  const header = response.headers.get("retry-after");
  if (!header) return null;
  const seconds = Number.parseInt(header, 10);
  return Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : null;
};

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
    if (response.status === 429) {
      throw new StravaRateLimitError(parseRetryAfterSeconds(response), path);
    }
    throw new StravaApiError(response.status, response.statusText);
  }
  return response;
};

const getAthleteTokens = async (
  athleteId: number,
): Promise<StoredAthleteTokens | undefined> => {
  const { data: athlete, error } = await supabase
    .from("strava_athletes")
    .select(
      "access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at",
    )
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!athlete) return undefined;
  return athlete as StoredAthleteTokens;
};

const requestRefreshedToken = async (
  refreshTokenCiphertext: string,
): Promise<StravaTokenResponse> => {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: bindings.STRAVA_CLIENT_ID,
      client_secret: bindings.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: await decryptToken(refreshTokenCiphertext),
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
  return refreshed.data;
};

export const getAccessToken = async (
  athleteId: number,
  { forceRefresh = false }: { forceRefresh?: boolean } = {},
) => {
  const stored = await getAthleteTokens(athleteId);
  if (!stored) throw new StravaAthleteNotConnectedError();

  if (
    !forceRefresh &&
    new Date(stored.access_token_expires_at).getTime() > Date.now() + 60_000
  ) {
    return decryptToken(stored.access_token_ciphertext);
  }
  return refreshAccessToken(athleteId, stored);
};

/**
 * Refreshes the athlete's tokens, writing them only when no concurrent
 * request refreshed first: Strava can reject a refresh token once it has been
 * used, so the loser of a refresh race adopts the winner's freshly stored
 * tokens instead of overwriting them.
 */
const refreshAccessToken = async (
  athleteId: number,
  stored: StoredAthleteTokens,
) => {
  let refreshed: StravaTokenResponse;
  try {
    refreshed = await requestRefreshedToken(stored.refresh_token_ciphertext);
  } catch (error) {
    // A rejected refresh token can also mean a concurrent request already
    // used it, so the rejection is only treated as revocation when the stored
    // tokens are unchanged since this refresh started.
    if (error instanceof StravaReconnectRequiredError) {
      const current = await getAthleteTokens(athleteId);
      if (
        current &&
        current.access_token_expires_at !== stored.access_token_expires_at
      ) {
        return decryptToken(current.access_token_ciphertext);
      }
    }
    throw error;
  }

  const { data: updatedRows, error } = await supabase
    .from("strava_athletes")
    .update({
      access_token_ciphertext: await encryptToken(refreshed.access_token),
      refresh_token_ciphertext: await encryptToken(refreshed.refresh_token),
      access_token_expires_at: new Date(
        refreshed.expires_at * 1_000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("athlete_id", athleteId)
    .eq("access_token_expires_at", stored.access_token_expires_at)
    .select("access_token_ciphertext");
  if (error) throw new Error(error.message);
  if (updatedRows && updatedRows.length > 0) return refreshed.access_token;

  // A concurrent request refreshed first; prefer its newer stored tokens.
  const current = await getAthleteTokens(athleteId);
  if (!current) throw new StravaAthleteNotConnectedError();
  return decryptToken(current.access_token_ciphertext);
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
