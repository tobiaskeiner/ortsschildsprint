<p align="center">
  <img src="docs/logo%20trikot%20white.png" alt="ortsschildsprint.com" width="760" />
</p>

# Ortsschildsprint

Ortsschildsprint enriches cycling route files with town or city limit signs along the route. Upload a `.gpx`, `.tcx`, or `.fit` route, review the detected signs on a map, and export an enriched route for navigation devices.

The app is built around a privacy-first flow: route files are parsed in the browser, and only the route bounding box is sent to the API to query nearby signs.

## Features

- Upload GPX, TCX, and FIT route files.
- Parse route geometry in the browser.
- Query city limit signs from a Supabase-backed API.
- Snap signs to the route and flag ambiguous matches for review.
- Review, select, or remove signs on an interactive MapLibre map.
- Export enriched routes as GPX, TCX, or FIT.
- Preserve multiple selected route passes for the same sign in FIT exports.
- German and English UI copy.

## Repository Structure

```txt
.
├── api/        Cloudflare Worker API built with Hono
├── docs/       Design documentation and project assets
├── frontend/   React + Vite + Tailwind frontend
├── shared/     Types shared by frontend and API
└── package.json
```

## Tech Stack

- **Package manager:** pnpm workspaces
- **Frontend:** React 19, Vite, Tailwind CSS, MapLibre via `react-map-gl`
- **Route parsing/export:** `@tmcw/togeojson`, `@garmin/fitsdk`, Turf.js
- **API:** Hono on Cloudflare Workers
- **Data:** Supabase/PostGIS RPC for sign lookup
- **Deployment:** Cloudflare Workers and Cloudflare static assets

## Requirements

- Node.js
- pnpm
- Cloudflare Wrangler for API/frontend deployment
- Supabase project with the expected `city_limit_signs` table and `signs_in_box` RPC

## Setup

Install dependencies from the repository root:

```sh
pnpm install
```

Create local environment files as needed.

Frontend:

```sh
# frontend/.env.local
VITE_OS_API_URL=http://localhost:8787
```

API:

```sh
# api/.dev.vars
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_or_anon_key
```

## Development

Run all workspace dev servers:

```sh
pnpm dev
```

Run one package at a time:

```sh
pnpm --dir api dev
pnpm --dir frontend dev
```

By default, Wrangler serves the API Worker locally and Vite serves the frontend. Ensure `VITE_OS_API_URL` points at the running API Worker.

## Useful Commands

Frontend:

```sh
pnpm --dir frontend build
pnpm --dir frontend lint
pnpm --dir frontend preview
pnpm --dir frontend prettier
```

API:

```sh
pnpm --dir api dev
pnpm --dir api deploy
pnpm --dir api cf-typegen
pnpm --dir api prettier
```

## API

`POST /signs`

Request body:

```json
{
  "minLat": 50.0,
  "minLong": 8.0,
  "maxLat": 51.0,
  "maxLong": 9.0
}
```
