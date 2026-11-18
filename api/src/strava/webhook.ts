import { bindings } from "../config";
import { stravaWebhookEventSchema } from "./types";

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

/**
 * Strava may send an X-Strava-Signature header without making a signing secret
 * available. With no configured secret, a delivery is therefore an untrusted
 * trigger: destructive events are re-verified against the Strava API before
 * any data is removed. If a signing secret is configured (for example, from a
 * signing proxy or a future Strava integration), every presented signature
 * must validate.
 */
export const verifyWebhookSignature = async (
  signatureHeader: string | undefined,
  rawBody: string,
) => {
  if (!signatureHeader) return true;
  if (!bindings.STRAVA_WEBHOOK_SIGNING_SECRET) return true;
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

/**
 * Parses a Strava webhook delivery into a typed event, or undefined when the
 * payload does not match Strava's documented webhook contract.
 */
export const parseStravaWebhookEvent = (value: unknown) => {
  const result = stravaWebhookEventSchema.safeParse(value);
  return result.success ? result.data : undefined;
};
