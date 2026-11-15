import { bindings } from "../config";
import type { StravaWebhookEvent } from "./types";

const encoder = new TextEncoder();
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

const hexToBytes = (value: string) => {
  if (!/^[\da-f]{64}$/i.test(value)) return undefined;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const getSignatureParts = (header: string | undefined) => {
  if (!header) return undefined;
  const parts = new Map(
    header.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value] as const;
    }),
  );
  const timestamp = Number(parts.get("t"));
  const signature = parts.get("v1");
  if (!Number.isSafeInteger(timestamp) || !signature) return undefined;
  return { timestamp, signature };
};

export const verifyWebhookSignature = async (
  signatureHeader: string | undefined,
  rawBody: string,
) => {
  if (!bindings.STRAVA_WEBHOOK_SIGNING_SECRET) return false;
  const signatureParts = getSignatureParts(signatureHeader);
  if (!signatureParts) return false;
  if (
    Math.abs(Date.now() / 1_000 - signatureParts.timestamp) >
    MAX_WEBHOOK_AGE_SECONDS
  ) {
    return false;
  }

  const signature = hexToBytes(signatureParts.signature);
  if (!signature) return false;
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(bindings.STRAVA_WEBHOOK_SIGNING_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    signingKey,
    signature,
    encoder.encode(`${signatureParts.timestamp}.${rawBody}`),
  );
};

const isSafeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);

export const isStravaWebhookEvent = (
  value: unknown,
): value is Required<
  Pick<
    StravaWebhookEvent,
    "aspect_type" | "event_time" | "object_id" | "object_type" | "owner_id"
  >
> &
  StravaWebhookEvent => {
  if (typeof value !== "object" || value === null) return false;
  const event = value as StravaWebhookEvent;
  return (
    typeof event.object_type === "string" &&
    typeof event.aspect_type === "string" &&
    isSafeInteger(event.object_id) &&
    isSafeInteger(event.owner_id) &&
    isSafeInteger(event.event_time)
  );
};
