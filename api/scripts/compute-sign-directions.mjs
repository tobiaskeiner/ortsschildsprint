// Computes, for every city-limit sign in Germany, which side is inside the
// town (see sign-directions/score.mjs) and replaces the live direction table.
//
// Runs separately from refresh-city-limit-signs.mjs: a failed run here never
// blocks a sign refresh, and signs without a direction simply stay "unsure".
//
//   node --env-file=.env scripts/compute-sign-directions.mjs [--dry-run] [--limit N]
//
// Overpass responses are cached per tile in .cache/sign-directions/, so an
// interrupted run resumes where it stopped. Delete the folder for fresh data.
import { createClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { BUILDING_RADIUS_M, scoreSign } from "./sign-directions/score.mjs";

const OVERPASS_URL =
  process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const CACHE_DIR =
  process.env.SIGN_DIRECTIONS_CACHE_DIR ??
  path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../.cache/sign-directions",
  );
const TILE_LAT = 0.25;
const TILE_LON = 0.35;
const PLACE_PADDING_DEG = 0.06;
const PAUSE_BETWEEN_REQUESTS_MS = 2_000;
const STAGING_TABLE = "city_limit_sign_directions_refresh";
const CHUNK_SIZE = 1_000;

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    limit: { type: "string" },
    tiles: { type: "string" },
  },
});
const tileLimit = args.limit ? Number.parseInt(args.limit, 10) : Infinity;
const onlyTiles = args.tiles ? new Set(args.tiles.split(",")) : null;
const dryRun =
  args["dry-run"] || Number.isFinite(tileLimit) || onlyTiles !== null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function overpass(query, cacheFile) {
  if (existsSync(cacheFile)) {
    return {
      json: JSON.parse(await readFile(cacheFile, "utf8")),
      cached: true,
    };
  }
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const started = Date.now();
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "user-agent":
            "ortsschildsprint-sign-directions/1.0 (https://ortsschildsprint.com)",
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(10 * 60 * 1_000),
      });
      if (response.ok) {
        const text = await response.text();
        await writeFile(cacheFile, text);
        return {
          json: JSON.parse(text),
          cached: false,
          ms: Date.now() - started,
          bytes: text.length,
        };
      }
      lastError = new Error(
        `Overpass request failed: ${response.status} ${response.statusText}`,
      );
      if (![429, 500, 502, 503, 504].includes(response.status)) throw lastError;
    } catch (error) {
      lastError = error;
    }
    const delayMs = Math.min(300_000, 30_000 * 2 ** (attempt - 1));
    console.warn(`  ${lastError.message}; retrying in ${delayMs / 1_000}s …`);
    await sleep(delayMs);
  }
  throw lastError;
}

function tileQuery([south, west, north, east]) {
  const bbox = `${south},${west},${north},${east}`;
  const padded = [
    south - PLACE_PADDING_DEG,
    west - PLACE_PADDING_DEG,
    north + PLACE_PADDING_DEG,
    east + PLACE_PADDING_DEG,
  ].join(",");
  return `[out:json][timeout:600];
node["traffic_sign"="city_limit"](${bbox})->.s;
.s out body;
way(around.s:20)["highway"];
out body geom;
node["place"~"^(city|town|village|hamlet|suburb|quarter|neighbourhood|isolated_dwelling|locality)$"](${padded});
out body;
way["building"](around.s:${BUILDING_RADIUS_M});
out ids center;`;
}

function tilesFor(signs) {
  const keys = new Map();
  for (const s of signs) {
    const i = Math.floor(s.lat / TILE_LAT);
    const j = Math.floor(s.lon / TILE_LON);
    keys.set(`${i}_${j}`, [i, j]);
  }
  return [...keys.values()]
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
    .map(([i, j]) => ({
      key: `${i}_${j}`,
      bbox: [
        i * TILE_LAT,
        j * TILE_LON,
        (i + 1) * TILE_LAT,
        (j + 1) * TILE_LON,
      ],
    }));
}

function scoreTile(elements, [south, west, north, east]) {
  const signs = [];
  const ways = [];
  const places = [];
  const buildings = [];
  for (const e of elements) {
    if (e.type === "node" && e.tags?.traffic_sign === "city_limit")
      signs.push(e);
    else if (e.type === "node" && e.tags?.place) places.push(e);
    else if (e.type === "way" && e.tags?.highway && e.geometry) ways.push(e);
    else if (e.type === "way" && e.center) buildings.push(e.center);
  }

  const results = [];
  for (const sign of signs) {
    // The tile query is a closed bbox: a sign on a tile edge belongs to one tile.
    if (
      sign.lat >= north ||
      sign.lon >= east ||
      sign.lat < south ||
      sign.lon < west
    )
      continue;
    const nearbyWays = ways.filter((w) =>
      w.geometry.some(
        (p) =>
          Math.abs(p.lat - sign.lat) < 0.004 &&
          Math.abs(p.lon - sign.lon) < 0.006,
      ),
    );
    const score = scoreSign(sign, { ways: nearbyWays, places, buildings });
    results.push({ osm_id: sign.id, score });
  }
  return results;
}

async function upload(rows) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set.");
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { error: clearError } = await supabase
    .from(STAGING_TABLE)
    .delete()
    .gt("osm_id", 0);
  if (clearError)
    throw new Error(`Could not clear staging: ${clearError.message}`);

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase
      .from(STAGING_TABLE)
      .upsert(rows.slice(i, i + CHUNK_SIZE), { onConflict: "osm_id" });
    if (error) throw new Error(`Staging upload failed: ${error.message}`);
  }

  const { error } = await supabase.rpc(
    "promote_city_limit_sign_directions_refresh",
    {
      expected_count: rows.length,
    },
  );
  if (error) throw new Error(`Promotion failed: ${error.message}`);
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });

  console.log("Listing city-limit signs in Germany …");
  const { json: signList } = await overpass(
    `[out:json][timeout:900];
area["ISO3166-1"="DE"][admin_level=2]->.de;
node["traffic_sign"="city_limit"](area.de);
out skel;`,
    path.join(CACHE_DIR, "germany-signs.json"),
  );
  const tiles = tilesFor(signList.elements).filter(
    (t) => !onlyTiles || onlyTiles.has(t.key),
  );
  console.log(`${signList.elements.length} signs in ${tiles.length} tiles.`);

  const rows = [];
  const stats = {
    signs: 0,
    high: 0,
    low: 0,
    none: 0,
    fetched: 0,
    ms: 0,
    bytes: 0,
  };
  for (const [index, tile] of tiles.slice(0, tileLimit).entries()) {
    const result = await overpass(
      tileQuery(tile.bbox),
      path.join(CACHE_DIR, `tile-${tile.key}.json`),
    );
    if (!result.cached) {
      stats.fetched++;
      stats.ms += result.ms;
      stats.bytes += result.bytes;
    }
    for (const { osm_id, score } of scoreTile(
      result.json.elements,
      tile.bbox,
    )) {
      stats.signs++;
      if (!score) {
        stats.none++;
        continue;
      }
      stats[score.confidence]++;
      rows.push({
        osm_id,
        inside_bearing: score.insideBearing,
        confidence: score.confidence,
      });
    }
    // downloads are slow enough to report each; cached tiles only every 100
    if (!result.cached || (index + 1) % 100 === 0) {
      console.log(
        `Tile ${index + 1}/${tiles.length} ${tile.key}` +
          (result.cached
            ? " (cached)"
            : ` ${(result.ms / 1_000).toFixed(1)}s ${(result.bytes / 1e6).toFixed(1)} MB`),
      );
    }
    if (!result.cached) await sleep(PAUSE_BETWEEN_REQUESTS_MS);
  }

  const pct = (n) => `${((100 * n) / (stats.signs || 1)).toFixed(1)}%`;
  console.log(
    `\nScored ${stats.signs} signs: high ${stats.high} (${pct(stats.high)}), ` +
      `low ${stats.low} (${pct(stats.low)}), none ${stats.none} (${pct(stats.none)}).`,
  );
  if (stats.fetched > 0) {
    const perTileS = stats.ms / stats.fetched / 1_000;
    const perTileMb = stats.bytes / stats.fetched / 1e6;
    console.log(
      `Fetched ${stats.fetched} tiles: ${perTileS.toFixed(1)}s and ${perTileMb.toFixed(1)} MB per tile. ` +
        `Estimate for all ${tiles.length} tiles: ~${(((perTileS + PAUSE_BETWEEN_REQUESTS_MS / 1_000) * tiles.length) / 60).toFixed(0)} min, ` +
        `~${(perTileMb * tiles.length).toFixed(0)} MB.`,
    );
  }

  if (dryRun) {
    const out = path.join(CACHE_DIR, "directions.json");
    await writeFile(out, JSON.stringify(rows, null, 1));
    console.log(
      `Dry run: wrote ${rows.length} rows to ${out}; nothing uploaded.`,
    );
    return;
  }
  if (rows.length < 1)
    throw new Error("No directions computed; refusing to upload.");
  await upload(rows);
  console.log(`Promoted ${rows.length} sign directions.`);
}

await main();
