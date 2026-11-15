import { env } from "cloudflare:workers";

interface StravaBindings {
  INTERNAL_API_SECRET: string;
  STRAVA_CLIENT_ID: string;
  STRAVA_CLIENT_SECRET: string;
  STRAVA_REDIRECT_URI: string;
  STRAVA_STATE_SECRET: string;
  STRAVA_TOKEN_ENCRYPTION_KEY: string;
  STRAVA_WEBHOOK_VERIFY_TOKEN: string;
  STRAVA_WEBHOOK_SIGNING_SECRET: string;
}

export const bindings = env as typeof env & StravaBindings;

export const assertStravaConfiguration = () => {
  for (const value of [
    bindings.STRAVA_CLIENT_ID,
    bindings.STRAVA_CLIENT_SECRET,
    bindings.STRAVA_REDIRECT_URI,
    bindings.STRAVA_STATE_SECRET,
    bindings.STRAVA_TOKEN_ENCRYPTION_KEY,
    bindings.STRAVA_WEBHOOK_VERIFY_TOKEN,
  ]) {
    if (!value) throw new Error("Strava integration is not configured");
  }
};
