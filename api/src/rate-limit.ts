import { supabase } from "./supabase";
import { bindings } from "./config";

const SIGNS_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_RETENTION_MILLISECONDS = 24 * 60 * 60 * 1_000;
const encoder = new TextEncoder();

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

const getClientKey = async (clientAddress: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(bindings.INTERNAL_API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(clientAddress)),
    ),
  );
};

export const getClientAddress = (request: Request) =>
  request.headers.get("CF-Connecting-IP") ?? "unknown";

export const canRequestSigns = async (clientAddress: string) => {
  const { data, error } = await supabase.rpc("consume_signs_rate_limit", {
    client_key_input: await getClientKey(clientAddress),
    max_requests_input: SIGNS_REQUESTS_PER_MINUTE,
  });
  if (error) throw new Error(error.message);
  return data === true;
};

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
