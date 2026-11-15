import { supabase } from "./supabase";
import { bindings } from "./config";

const SIGNS_REQUESTS_PER_MINUTE = 60;
const STRAVA_REQUESTS_PER_MINUTE = 120;
// Webhook deliveries are unauthenticated (Strava does not sign them), so they
// get a dedicated, generous limit: high enough for bursts from Strava's shared
// sending infrastructure, low enough to blunt floods of forged deliveries.
const STRAVA_WEBHOOK_REQUESTS_PER_MINUTE = 300;
const RATE_LIMIT_RETENTION_MILLISECONDS = 24 * 60 * 60 * 1_000;
const encoder = new TextEncoder();

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/**
 * HMACs the client address under a per-feature namespace so the raw IP is never
 * stored in the database and one feature's windows cannot collide with
 * another's.
 */
const getClientKey = async (namespace: string, clientAddress: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(bindings.INTERNAL_API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(`${namespace}:${clientAddress}`),
      ),
    ),
  );
};

/**
 * Consumes one request from a per-client, per-minute fixed window. The
 * `consume_signs_rate_limit` database function is a generic fixed-window
 * limiter (key, limit); it is shared by all rate-limited endpoints.
 */
const consumeRateLimit = async (
  namespace: string,
  clientAddress: string,
  maxRequests: number,
) => {
  const { data, error } = await supabase.rpc("consume_signs_rate_limit", {
    client_key_input: await getClientKey(namespace, clientAddress),
    max_requests_input: maxRequests,
  });
  if (error) throw new Error(error.message);
  return data === true;
};

export const getClientAddress = (request: Request) =>
  request.headers.get("CF-Connecting-IP") ?? "unknown";

export const canRequestSigns = (clientAddress: string) =>
  consumeRateLimit("signs", clientAddress, SIGNS_REQUESTS_PER_MINUTE);

export const canRequestStrava = (clientAddress: string) =>
  consumeRateLimit("strava", clientAddress, STRAVA_REQUESTS_PER_MINUTE);

export const canRequestStravaWebhook = (clientAddress: string) =>
  consumeRateLimit(
    "strava-webhook",
    clientAddress,
    STRAVA_WEBHOOK_REQUESTS_PER_MINUTE,
  );

export const pruneExpiredSignsRateLimitWindows = async () => {
  const { error } = await supabase
    .from("signs_rate_limit_windows")
    .delete()
    .lt(
      "window_started_at",
      new Date(Date.now() - RATE_LIMIT_RETENTION_MILLISECONDS).toISOString(),
    );
  if (error) throw new Error(error.message);
};
