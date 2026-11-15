# Ortschildsprint API

Cloudflare Worker API for Ortschildsprint. It provides city-limit-sign lookup
for GPX routes and the Strava integration.

Public sign lookups are rate-limited to 60 requests per minute per Cloudflare
client address, and must use a bounded geographic area. This protects the
spatial database from broad, expensive queries.

## Commands

Run these from the repository root:

```sh
pnpm --dir api dev
pnpm --dir api lint
pnpm --dir api typecheck
pnpm --dir api prettier:check
pnpm --dir api test
pnpm --dir api deploy
```

`test` runs a Wrangler deployment dry-run. Generate Worker binding types after
changing `wrangler.jsonc` or Worker secrets:

```sh
pnpm --dir api cf-typegen
```

## Database migrations

The Supabase migrations live in `api/supabase/migrations`, the standard CLI
location when working from this directory. Link the intended project, then
apply them before deploying code that uses the new schema:

```sh
cd api
supabase link --project-ref your-project-ref
supabase db push
```

## Local configuration

Create `api/.env` with the Supabase URL, service-role key, and an
`INTERNAL_API_SECRET` used by the local Worker. Do not create `api/.dev.vars`
alongside it: Wrangler gives that file precedence and it can hide values from
`.env`.

Set the same `INTERNAL_API_SECRET` in `frontend/.env.local`. It is server-only:
do not use the `VITE_` prefix. Generate a value with `openssl rand -base64 32`.
The deployed frontend Worker attaches it only when proxying `/api/signs`; the
API rejects direct requests to that endpoint.

The frontend development server proxies `/api/*` to this Worker at port 8787.
Start both applications with:

```sh
pnpm run dev
```

## Guides

- [Refreshing city-limit signs](./scripts/README.md)
- [Strava integration](./src/strava/README.md)
