import { bindings } from "../config";

const encoder = new TextEncoder();

export class StravaReconnectRequiredError extends Error {
  constructor() {
    super("The stored Strava authorization cannot be read. Reconnect Strava.");
  }
}

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const base64UrlDecode = (value: string) => {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const importStateSigningKey = () =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(bindings.STRAVA_STATE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

const signState = async (payload: string) =>
  base64UrlEncode(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        await importStateSigningKey(),
        encoder.encode(payload),
      ),
    ),
  );

export const createOAuthState = async (nonce: string) => {
  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({ expiresAt: Date.now() + 10 * 60 * 1_000, nonce }),
    ),
  );
  return `${payload}.${await signState(payload)}`;
};

export const verifyOAuthState = async (state: string | undefined) => {
  if (!state) return undefined;
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return undefined;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await importStateSigningKey(),
    base64UrlDecode(signature),
    encoder.encode(payload),
  );
  if (!valid) return undefined;

  try {
    const value: unknown = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payload)),
    );
    const validState =
      typeof value === "object" &&
      value !== null &&
      "expiresAt" in value &&
      typeof value.expiresAt === "number" &&
      value.expiresAt > Date.now() &&
      "nonce" in value &&
      typeof value.nonce === "string" &&
      value.nonce.length > 0;
    if (!validState) return undefined;
    return value.nonce;
  } catch {
    return undefined;
  }
};

const importTokenKey = () =>
  crypto.subtle.importKey(
    "raw",
    base64UrlDecode(bindings.STRAVA_TOKEN_ENCRYPTION_KEY),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );

export const encryptToken = async (token: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      await importTokenKey(),
      encoder.encode(token),
    ),
  );
  return `${base64UrlEncode(iv)}.${base64UrlEncode(encrypted)}`;
};

export const decryptToken = async (ciphertext: string) => {
  try {
    const [iv, encrypted] = ciphertext.split(".");
    if (!iv || !encrypted) throw new Error("Invalid encrypted Strava token");
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlDecode(iv) },
      await importTokenKey(),
      base64UrlDecode(encrypted),
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    throw new StravaReconnectRequiredError();
  }
};
