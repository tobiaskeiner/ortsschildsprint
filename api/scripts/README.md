# Managing the Strava webhook subscription

Strava delivers activity events only to the subscription registered for the
application, and exactly one subscription can exist at a time. The callback
URL must be the deployed Worker's `https://ortsschildsprint.com/api/strava/webhook`,
and the verify token must equal the Worker's `STRAVA_WEBHOOK_VERIFY_TOKEN` so
the verification handshake succeeds.

Check the current state, create the subscription, or delete it:

```sh
pnpm --dir api strava:webhook               # list the current subscription
pnpm --dir api strava:webhook create        # register the subscription
pnpm --dir api strava:webhook delete <id>   # remove a subscription by id
```

`create` requires `STRAVA_WEBHOOK_VERIFY_TOKEN` in `api/.env`; override the
callback URL with `STRAVA_WEBHOOK_CALLBACK_URL` when testing against another
host.

## Refreshing city-limit signs

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

## Computing town entry and exit directions

`compute-sign-directions.mjs` works out which side of each German city-limit
sign is inside the town, and stores that as a compass bearing in
`city_limit_sign_directions`. The browser compares it with the route heading
at each pass to tell town entries from exits. Signs without a stored
direction are simply left for the rider to review, so this is optional and
runs independently of the sign refresh above.

Five signals vote on the inside side: the sign's own `direction` tags (taking
`city_limit=end` into account), urban/rural road tags (`zone:traffic`,
`source:maxspeed`), a speed-limit change at the sign, the direction to the
`place` named on the sign, and building density on either side. A sign is
`high` confidence when at least two signals agree and none disagree; only
those are acted on automatically.

Apply the migrations first (`supabase db push`), then build the tile cache from
a Geofabrik extract. This needs pyosmium, about 7 GB of free disk for a
temporary node index, and takes roughly half an hour:

```sh
python -m venv ~/dev/osm-tools/.venv && ~/dev/osm-tools/.venv/bin/pip install osmium
curl -L -o ~/dev/osm-tools/germany-latest.osm.pbf \
  https://download.geofabrik.de/europe/germany-latest.osm.pbf
~/dev/osm-tools/.venv/bin/python api/scripts/sign-directions/extract-from-pbf.py \
  ~/dev/osm-tools/germany-latest.osm.pbf
```

Then score the signs and replace the live directions:

```sh
pnpm --dir api compute:sign-directions             # upload
pnpm --dir api compute:sign-directions --dry-run   # inspect only
```

Without a prepared cache the script downloads the same data from Overpass
instead, which takes about six hours for Germany and is close to the public
server's daily limits. `--limit N` or `--tiles a,b` restrict a dry run to a
few tiles. The cache lives in `api/.cache/sign-directions/`; delete it to
start fresh.
