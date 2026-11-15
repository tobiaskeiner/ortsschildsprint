# Strava integration

The Strava Worker integration lets athletes collect city-limit signs from
outdoor rides. It stores only signs new to that athlete and displays the
collection on the dashboard. During connection, athletes choose whether a
summary is appended to new Strava activities that collect signs.

## Database migration

Apply the migrations in `api/supabase/migrations` before deploying the Worker:

```sh
cd api
supabase db push
```

## Required configuration

The Worker needs the normal Supabase service-role configuration plus these
values:

```txt
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REDIRECT_URI=...
STRAVA_STATE_SECRET=...
STRAVA_TOKEN_ENCRYPTION_KEY=...
STRAVA_WEBHOOK_VERIFY_TOKEN=...
STRAVA_WEBHOOK_SIGNING_SECRET=...
```

For local development, put these in `api/.env`. In production, store them as
Wrangler secrets:

```sh
pnpm --dir api exec wrangler secret put STRAVA_CLIENT_ID
pnpm --dir api exec wrangler secret put STRAVA_CLIENT_SECRET
pnpm --dir api exec wrangler secret put STRAVA_REDIRECT_URI
pnpm --dir api exec wrangler secret put STRAVA_STATE_SECRET
pnpm --dir api exec wrangler secret put STRAVA_TOKEN_ENCRYPTION_KEY
pnpm --dir api exec wrangler secret put STRAVA_WEBHOOK_VERIFY_TOKEN
pnpm --dir api exec wrangler secret put STRAVA_WEBHOOK_SIGNING_SECRET
```

Generate the encryption key with `openssl rand -base64 32`. Keep it stable:
changing it makes previously encrypted Strava tokens unreadable and athletes
must reconnect.

`STRAVA_WEBHOOK_SIGNING_SECRET` is the signing secret for your Strava webhook,
not the subscription validation token. It is used to validate the
`X-Strava-Signature` HMAC on every incoming webhook POST.

## Strava application settings

Set the application's Authorization Callback Domain to the domain hosting the
frontend. Configure the redirect URI to match it exactly:

```txt
https://ortsschildsprint.com/api/strava/callback
```

During authorization Ortschildsprint always requests `activity:read_all` to
analyse rides. It requests `activity:write` only when the athlete opts in to
activity summaries; that permission is used only to update the description of
a newly completed ride that collected new signs.

Create a Strava webhook subscription after deployment with:

```txt
https://ortsschildsprint.com/api/strava/webhook
```

Use the same value for the subscription verify token and
`STRAVA_WEBHOOK_VERIFY_TOKEN`. Webhook POSTs are accepted only when their
`X-Strava-Signature` HMAC and timestamp validate against
`STRAVA_WEBHOOK_SIGNING_SECRET`.

## Import behavior

- A first connection analyses the latest 20 eligible outdoor rides in the
  background. It never changes historic activity descriptions. If that work is
  interrupted, the deployed hourly scheduler resumes it.
- Dashboard imports process up to 15 eligible outdoor rides per batch. A
  deployed Worker continues one requested import batch every hour. Only one
  batch for an athlete can run at a time; another request receives a `409` and
  can be retried shortly.
- A historic batch uses one activity-listing request, then one route-stream
  request for each previously unprocessed ride. The listing already supplies
  the metadata needed to filter historic rides, and one access token is reused
  across the batch. A live ride still fetches its detailed activity and, when
  it finds new signs and the athlete enabled activity summaries, uses one
  write request to update its description.
- Routes are split only for Supabase sign matching; that does not add Strava
  requests.
- Activity completion and sign collection are written atomically. A failed
  webhook is retried by the hourly scheduler with backoff; an activity whose
  route stream is not ready is therefore not incorrectly marked as processed.
- When historic imports later reach an older matching ride, the collection is
  attributed to that earlier ride. This makes `first_activity_id` and
  `collected_at` correct once the full history has finished importing.
- Eligible rides include road, e-bike, mountain, e-mountain, gravel,
  handcycle, and velomobile activities. Trainer, manual, and virtual rides are
  excluded, as are activities marked private in Strava.
- When Strava reports that an activity was deleted or made private, its
  activity-derived collection data is removed. If it becomes shareable again,
  Ortschildsprint analyses it without changing its description.

## Local testing

Use `localhost` as the Strava callback domain and set:

```txt
STRAVA_REDIRECT_URI=http://localhost:5173/api/strava/callback
```

Start the full application with `pnpm run dev`, then open
`http://localhost:5173/strava`. Strava can only deliver webhooks to a public
HTTPS URL, so a tunnel is needed to test automatic ride processing locally.
