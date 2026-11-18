// Manages the Strava push subscription for this application. Strava allows
// only one subscription per application, and its deliveries trigger the
// GET /strava/webhook verification handshake implemented by the Worker.
//
// Usage (from api/):
//   node --env-file=.env scripts/strava-webhook-subscription.mjs          # list
//   node --env-file=.env scripts/strava-webhook-subscription.mjs create
//   node --env-file=.env scripts/strava-webhook-subscription.mjs delete <id>
//
// Required in api/.env:
//   STRAVA_CLIENT_ID
//   STRAVA_CLIENT_SECRET
//   STRAVA_WEBHOOK_VERIFY_TOKEN (create) — must equal the Worker's secret
//   STRAVA_WEBHOOK_CALLBACK_URL (create) — optional callback URL override

const STRAVA_PUSH_SUBSCRIPTIONS_URL =
  "https://www.strava.com/api/v3/push_subscriptions";
const DEFAULT_CALLBACK_URL = "https://ortsschildsprint.com/api/strava/webhook";

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error(
    "STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set in the environment.",
  );
}

const request = async (method, path, body) => {
  const url = new URL(`${STRAVA_PUSH_SUBSCRIPTIONS_URL}${path}`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);

  const response = await fetch(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: new URLSearchParams(body),
        }),
  });

  // Strava answers a successful create with 201 and a list with 200. A
  // duplicate create or an unknown delete id surfaces as a non-2xx status
  // with a JSON error body worth showing in full.
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new Error(
      `Strava request failed: ${response.status} ${response.statusText}\n${JSON.stringify(payload, null, 2)}`,
    );
  }
  return payload;
};

const printSubscriptions = (subscriptions) => {
  if (!subscriptions.length) {
    console.log("No push subscription exists for this application.");
    return;
  }
  for (const subscription of subscriptions) {
    console.log(JSON.stringify(subscription, null, 2));
  }
};

const [mode = "list", subscriptionId] = process.argv.slice(2);

if (mode === "list") {
  printSubscriptions(await request("GET", ""));
} else if (mode === "create") {
  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    throw new Error(
      "STRAVA_WEBHOOK_VERIFY_TOKEN must be set; Strava sends it back during the callback verification handshake and the Worker rejects mismatches.",
    );
  }
  const callbackUrl =
    process.env.STRAVA_WEBHOOK_CALLBACK_URL ?? DEFAULT_CALLBACK_URL;
  const subscription = await request("POST", "", {
    callback_url: callbackUrl,
    verify_token: verifyToken,
  });
  console.log(`Created push subscription ${subscription.id}:`);
  console.log(JSON.stringify(subscription, null, 2));
} else if (mode === "delete") {
  if (!subscriptionId) {
    throw new Error("Usage: … delete <subscription-id>");
  }
  await request("DELETE", `/${subscriptionId}`);
  console.log(`Deleted push subscription ${subscriptionId}.`);
} else {
  throw new Error(
    `Unknown mode "${mode}". Use list (default), create, or delete <id>.`,
  );
}
