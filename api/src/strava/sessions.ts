import { supabase } from "../supabase";

export const SESSION_COOKIE = "oss_strava_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export const createSession = async (athleteId: number) => {
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_SECONDS * 1_000,
  ).toISOString();
  const { data, error } = await supabase
    .from("strava_sessions")
    .insert({ athlete_id: athleteId, expires_at: expiresAt })
    .select("id")
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create session");
  }
  return data.id as string;
};

export const getSessionAthleteId = async (sessionId: string | undefined) => {
  if (!sessionId) return undefined;
  const { data } = await supabase
    .from("strava_sessions")
    .select("athlete_id, expires_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) {
    return undefined;
  }
  return data.athlete_id as number;
};

export const pruneExpiredSessions = async () => {
  const { error } = await supabase
    .from("strava_sessions")
    .delete()
    .lte("expires_at", new Date().toISOString());
  if (error) throw new Error(error.message);
};
