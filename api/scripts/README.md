# Refreshing city-limit signs

`refresh-city-limit-signs.mjs` replaces the live city-limit-sign dataset from
OpenStreetMap without exposing a partially updated result.

## Prerequisites

Apply the city-sign refresh migrations before the first run. From `api/`, run
`supabase db push` after linking the intended project. The script needs these
values in `api/.env`:

```txt
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

Use a service-role key only in this server-side file. The staging table has RLS
enabled and must not be accessed from a browser.

## Run a refresh

From the repository root:

```sh
pnpm --dir api refresh:city-limit-signs
```

The script downloads OSM nodes tagged `traffic_sign=city_limit`, validates
them, uploads them to `city_limit_signs_refresh`, and promotes the complete
dataset in one database transaction. A failed download, validation, or upload
leaves the live `city_limit_signs` table unchanged.

The regular Overpass endpoint is retried four times with exponential backoff.
Override its URL or retry count when necessary:

```sh
OVERPASS_URL=https://overpass.example/api/interpreter \
OVERPASS_MAX_ATTEMPTS=6 \
pnpm --dir api refresh:city-limit-signs
```

## Use a downloaded Overpass Turbo export

Choose **raw OSM data / JSON** in Overpass Turbo, then pass the absolute path
to that export instead of downloading it again:

```sh
OSM_SOURCE_FILE=/absolute/path/to/export.json \
pnpm --dir api refresh:city-limit-signs
```
