import { bindings } from "../config";
import { supabase } from "../supabase";
import { decryptToken, encryptToken } from "./crypto";
import type { StravaTokenResponse } from "./types";

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
    throw new Error(
      `Strava API request failed: ${response.status} ${response.statusText}`,
    );
  }
  return response;
};

export const getAccessToken = async (athleteId: number) => {
  const { data: athlete, error } = await supabase
    .from("strava_athletes")
    .select(
      "access_token_ciphertext, refresh_token_ciphertext, access_token_expires_at",
    )
    .eq("athlete_id", athleteId)
    .single();
  if (error || !athlete) throw new Error("Strava athlete is not connected");

  if (
    new Date(athlete.access_token_expires_at).getTime() >
    Date.now() + 60_000
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
  if (!response.ok) throw new Error("Could not refresh Strava access token");

  const refreshed = (await response.json()) as StravaTokenResponse;
  const { error: updateError } = await supabase
    .from("strava_athletes")
    .update({
      access_token_ciphertext: await encryptToken(refreshed.access_token),
      refresh_token_ciphertext: await encryptToken(refreshed.refresh_token),
      access_token_expires_at: new Date(
        refreshed.expires_at * 1_000,
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("athlete_id", athleteId);
  if (updateError) throw new Error(updateError.message);
  return refreshed.access_token;
};
