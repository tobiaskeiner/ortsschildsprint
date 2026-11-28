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
```

Generate the encryption key with `openssl rand -base64 32`. Keep it stable:
changing it makes previously encrypted Strava tokens unreadable and athletes
must reconnect.

`STRAVA_WEBHOOK_SIGNING_SECRET` is optional. Strava may send an
`X-Strava-Signature` header without providing a signing secret. In that case,
leave this value unset: deliveries are accepted as untrusted triggers and the
Worker verifies their effects against the Strava API. Set the secret only when
it is actually provided by Strava or a signing proxy; then every presented
signature must validate.

## Strava application settings

Set the application's Authorization Callback Domain to the domain hosting the
frontend. Configure the redirect URI to match it exactly:

```txt
https://ortsschildsprint.com/api/strava/callback
```

During authorization Ortsschildsprint always requests `activity:read_all` to
analyse rides. It requests `activity:write` only when the athlete opts in to
activity summaries; that permission is used only to update the description of
a newly completed ride that collected new signs.

Create a Strava webhook subscription after deployment with:

```txt
https://ortsschildsprint.com/api/strava/webhook
```

Use the same value for the subscription verify token and
`STRAVA_WEBHOOK_VERIFY_TOKEN`. Without a configured signing secret, webhook
deliveries are treated as untrusted triggers: activity data is always fetched
from the Strava API with the athlete's stored token, and destructive events —
activity deletion, privatization, and deauthorization — are only honored once
Strava's API confirms them.

## Import behavior

- A first connection analyses the latest 10 eligible outdoor rides in the
  background. It never changes historic activity descriptions. If that work
  is interrupted, the deployed scheduler resumes it every minute.
- Dashboard imports process up to 10 eligible outdoor rides per batch. A
  deployed Worker continues one import batch per pending athlete every
  minute, up to 25 athletes per run. Only one batch for an athlete can run at
  a time; another request receives a `409` and can be retried shortly.
- Each batch first reconciles the newest rides before walking the historic
  cursor, so a ride whose webhook delivery was missed (Strava retries only
  three times) is imported by the next batch or Import request. The historic
  cursor is untouched by this reconciliation; the walk continues with
  whatever batch capacity remains.
- The whole pipeline is budget-aware, on two axes. Strava's rate limits —
  200 read requests per 15 minutes and 2,000 per day, 400 and 4,000 overall —
  are tracked from the usage headers every Strava response carries, so
  deferred work only runs while those windows have headroom above what live
  webhook processing needs, and never has to discover a limit by hitting it.
  And each Worker invocation plans to stay inside its subrequest limit
  (50 per invocation on the free plan, shared by every Strava and Supabase
  call of the run): a batch whose budgets run low stops cleanly between
  rides, moves its cursor past every ride it made sure of — the rides it
  processed and the ones it skipped because they were already processed —
  and the next schedule continues. Advancing over already-processed rides
  keeps an import that meets them ahead of its cursor moving forward
  instead of wedging the cursor in place.
- A historic batch uses one activity-listing request, then one route-stream
  request for each previously unprocessed ride. The listing already supplies
  the metadata needed to filter historic rides, and one access token is reused
  across the batch. A live ride still fetches its detailed activity and, when
  it finds new signs and the athlete enabled activity summaries, uses one
  write request to update its description.
- Routes are split only for Supabase sign matching; that does not add Strava
  requests.
- Activity completion and sign collection are written atomically. A failed
  webhook event is retried by the scheduler with backoff (using Strava's
  Retry-After when provided) and abandoned after 12 attempts (roughly seven
  hours), recorded with its last error; an activity whose route stream is not
  ready is therefore not incorrectly marked as processed.
- When historic imports later reach an older matching ride, the collection is
  attributed to that earlier ride. This makes `first_activity_id` and
  `collected_at` correct once the full history has finished importing.
- Eligible rides include road, e-bike, mountain, e-mountain, gravel,
  handcycle, and velomobile activities. Trainer, manual, and virtual rides are
  excluded, as are activities marked private in Strava.
- The scheduler also re-reconciles every connected athlete whose last sweep is
  older than two hours — oldest first, up to four athletes per run — so a
  missed webhook delivery is recovered for every connected athlete without an
  Import request, including athletes whose historic import already completed.
  Roughly one list request per athlete per sweep keeps this safety net cheap.
- The dashboard needs the athlete's ride total to express progress. Once an
  import has completed, every eligible ride of the history is processed, so
  the dashboard reports the total from the processed rides themselves — no
  Strava request needed, and current as new rides arrive. The one-shot
  multi-page history scan serves only imports that are still running; a
  very long history can outlive the dashboard request's waitUntil window,
  which is why completed imports must not depend on it.
- When Strava reports that an activity was deleted or made private, its
  activity-derived collection data is removed — but only after Strava's API
  confirms the report, since webhook deliveries are unauthenticated. If an
  activity becomes shareable again, Ortsschildsprint analyses it without
  changing its description.

## Local testing

Use `localhost` as the Strava callback domain and set:

```txt
STRAVA_REDIRECT_URI=http://localhost:5173/api/strava/callback
```

Start the full application with `pnpm run dev`, then open
`http://localhost:5173/strava`. Strava can only deliver webhooks to a public
HTTPS URL, so a tunnel is needed to test automatic ride processing locally.
