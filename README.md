<p align="center">
  <img src="docs/logo%20trikot%20white.png" alt="ortsschildsprint.com" width="760" />
</p>

<h1 align="center">Ortsschildsprint</h1>

<p align="center">
  <strong>Find the city-limit signs on your cycling route and put them on your bike computer.</strong>
</p>

<p align="center">
  <a href="https://ortsschildsprint.com">ortsschildsprint.com</a>
  ·
  <a href="#getting-started">Getting started</a>
  ·
  <a href="./api/README.md">API</a>
  ·
  <a href="./api/src/strava/README.md">Strava integration</a>
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-f38020?logo=cloudflare&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostGIS-3ecf8e?logo=supabase&logoColor=white" />
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue" />
</p>

---

Upload a `.gpx`, `.tcx`, or `.fit` route, review the detected signs on a map, and
download an enriched route for your navigation device. Optionally, connect Strava
to build a personal collection of every sign you've ridden past.

## How it works

```txt
 ┌──────────────┐     ┌───────────────────┐     ┌────────────────┐     ┌──────────────┐
 │ 1. Upload    │ ──▶ │ 2. Match          │ ──▶ │ 3. Review      │ ──▶ │ 4. Export    │
 │ GPX/TCX/FIT  │     │ signs near route  │     │ on the map     │     │ GPX/TCX/FIT  │
 │ (in browser) │     │ (bounding box)    │     │ keep / remove  │     │ with signs   │
 └──────────────┘     └───────────────────┘     └────────────────┘     └──────────────┘
```

1. **Upload** – the route file is parsed entirely in your browser.
2. **Match** – only the route's bounding box is sent to the API, which returns nearby
   signs from OpenStreetMap-derived data. Signs are snapped to the route; ambiguous
   matches are flagged.
3. **Review** – check each sign on an interactive map, then keep or remove it.
4. **Export** – download the route with the signs embedded as waypoints / course points.

## Features

| | |
| --- | --- |
| 🔒 **Privacy-first** | Route files never leave your browser. No account or tracking required. |
| 🗺️ **Map review** | Inspect, select, and remove signs on a MapLibre map. |
| ⚠️ **Ambiguity flags** | Uncertain sign-to-route matches are flagged so you can decide. |
| 📦 **Three formats** | Import and export GPX, TCX, and FIT. |
| 🔁 **Multiple passes** | FIT exports keep every selected pass of a sign the route crosses more than once. |
| 🏅 **Strava collection** | Optional: import outdoor rides and collect the signs you've passed, with map and stats. |
| 🌍 **Bilingual** | Full German and English UI. |

> [!NOTE]
> The Strava integration is opt-in and works differently from the file flow: it
> requires server-side authentication and stores ride and collection data. Tokens are
> encrypted before storage. See the [Strava guide](./api/src/strava/README.md).

## Tech stack

| Area | Tools |
| --- | --- |
| Monorepo | pnpm workspaces |
| Frontend | React 19, Vite, Tailwind CSS, TanStack Router, react-intl |
| Maps | MapLibre GL via `react-map-gl` |
| Route parsing & export | `@tmcw/togeojson`, `@garmin/fitsdk`, Turf.js |
| API | Hono on Cloudflare Workers (service binding) |
| Data | Supabase / PostGIS (`signs_in_box` RPC) |
| Testing | Playwright end-to-end tests |

## Repository structure

```txt
.
├── api/        Cloudflare Worker API (Hono): sign lookup + Strava integration
│   ├── scripts/    Sign data refresh and Strava webhook tooling
│   ├── src/        Worker source
│   └── supabase/   Database migrations
├── docs/       Project assets
├── frontend/   React + Vite + Tailwind web app
│   └── e2e/        Playwright tests
└── shared/     Types shared by frontend and API
```

## Getting started

### Requirements

- Node.js and [pnpm](https://pnpm.io)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for local Workers and deployment
- A Supabase project with the migrations from `api/supabase/migrations` applied
  (see the [API README](./api/README.md#database-migrations))

### Install

```sh
pnpm install
```

### Configure

Create `api/.env` (**not** `api/.dev.vars` – Wrangler would give it precedence):

```sh
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
INTERNAL_API_SECRET=a_shared_local_secret   # openssl rand -base64 32
```

Set the same `INTERNAL_API_SECRET` in `frontend/.env.local` (without a `VITE_` prefix –
it is server-only). Optional Strava settings are described in the
[Strava guide](./api/src/strava/README.md).

### Run

```sh
pnpm dev                     # API + frontend together
pnpm --dir api dev           # API Worker only (port 8787)
pnpm --dir frontend dev      # Frontend only
```

Vite proxies `/api/*` to the local Worker on port 8787.

## Commands

Run from the repository root:

| Command | What it does |
| --- | --- |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all package tests |
| `pnpm prettier:check` | Check formatting everywhere |
| `pnpm --dir frontend test:e2e` | Run Playwright end-to-end tests |
| `pnpm --dir frontend deploy` | Build and deploy the frontend Worker |
| `pnpm --dir api typecheck` | Type-check the API |
| `pnpm --dir api deploy` | Deploy the API Worker |
| `pnpm --dir api cf-typegen` | Regenerate Worker binding types |
| `pnpm --dir api refresh:city-limit-signs` | Refresh sign data ([guide](./api/scripts/README.md)) |

## API at a glance

`POST /signs` returns all city-limit signs inside a bounding box:

```json
{
  "minLat": 50.0,
  "minLong": 8.0,
  "maxLat": 51.0,
  "maxLong": 9.0
}
```

The box may span at most 15° in each direction and 100 square degrees in total.
Requests are rate-limited and accepted only via the frontend Worker. Details on
limits and the Strava endpoints are in the [API README](./api/README.md).

## License

[MIT](./LICENSE) © Tobias Keiner
