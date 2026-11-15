import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const OVERPASS_URL =
  process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const OSM_SOURCE_FILE = process.env.OSM_SOURCE_FILE;
const OVERPASS_MAX_ATTEMPTS = Number.parseInt(
  process.env.OVERPASS_MAX_ATTEMPTS ?? "4",
  10,
);
const STAGING_TABLE = "city_limit_signs_refresh";
const CHUNK_SIZE = 1_000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY must be set.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const overpassQuery = `[out:json][timeout:900];
node["traffic_sign"="city_limit"];
out body;`;

function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

function validateElements(elements) {
  if (!Array.isArray(elements) || elements.length === 0) {
    throw new Error("Overpass returned no city-limit-sign nodes.");
  }

  const seenOsmIds = new Set();
  const rows = [];

  for (const element of elements) {
    const { id, lat, lon, tags, type } = element;
    const isValidCoordinate =
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180;

    if (
      type !== "node" ||
      !Number.isSafeInteger(id) ||
      !isValidCoordinate ||
      tags?.traffic_sign !== "city_limit" ||
      seenOsmIds.has(id)
    ) {
      throw new Error(
        `Invalid or duplicate OSM element: ${JSON.stringify(element)}`,
      );
    }

    seenOsmIds.add(id);
    rows.push({
      osm_id: id,
      location: `POINT(${lon} ${lat})`,
      tags,
    });
  }

  return rows;
}

async function fetchCityLimitSigns() {
  if (OSM_SOURCE_FILE) {
    console.log(`Reading downloaded OSM data from ${OSM_SOURCE_FILE} …`);
    const payload = JSON.parse(await readFile(OSM_SOURCE_FILE, "utf8"));
    return validateElements(payload.elements);
  }

  if (
    !Number.isSafeInteger(OVERPASS_MAX_ATTEMPTS) ||
    OVERPASS_MAX_ATTEMPTS < 1
  ) {
    throw new Error("OVERPASS_MAX_ATTEMPTS must be a positive integer.");
  }

  let lastError;
  for (let attempt = 1; attempt <= OVERPASS_MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `Downloading OSM data from ${OVERPASS_URL} (attempt ${attempt}/${OVERPASS_MAX_ATTEMPTS}) …`,
      );
      const response = await fetch(OVERPASS_URL, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "user-agent":
            "ortsschildsprint-data-refresh/1.0 (https://ortsschildsprint.com)",
        },
        body: new URLSearchParams({ data: overpassQuery }),
        signal: AbortSignal.timeout(20 * 60 * 1_000),
      });

      if (response.ok) {
        const payload = await response.json();
        return validateElements(payload.elements);
      }

      const message = `Overpass request failed: ${response.status} ${response.statusText}`;
      if (![429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(message);
      }
      lastError = new Error(message);
    } catch (error) {
      lastError = error;
    }

    if (attempt < OVERPASS_MAX_ATTEMPTS) {
      const delayMs = Math.min(120_000, 15_000 * 2 ** (attempt - 1));
      console.warn(
        `Overpass request did not complete (${lastError.message}); retrying in ${delayMs / 1_000}s …`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

async function clearStagingTable() {
  // OSM node IDs are positive. Clearing staging does not touch the live table.
  const { error } = await supabase.from(STAGING_TABLE).delete().gt("osm_id", 0);
  if (error) throw new Error(`Could not clear staging data: ${error.message}`);
}

async function uploadToStaging(rows) {
  const batches = chunk(rows, CHUNK_SIZE);
  for (const [index, batch] of batches.entries()) {
    const { error } = await supabase
      .from(STAGING_TABLE)
      .upsert(batch, { onConflict: "osm_id" });
    if (error) {
      throw new Error(
        `Staging upload failed in batch ${index + 1}: ${error.message}`,
      );
    }
    console.log(`Uploaded ${index + 1}/${batches.length} batches`);
  }
}

async function main() {
  const rows = await fetchCityLimitSigns();
  console.log(`Validated ${rows.length} city-limit-sign nodes.`);

  await clearStagingTable();
  await uploadToStaging(rows);

  const { error } = await supabase.rpc("promote_city_limit_signs_refresh", {
    expected_count: rows.length,
  });
  if (error) throw new Error(`Promotion failed: ${error.message}`);

  console.log(`Promoted ${rows.length} city-limit signs successfully.`);
}

await main();
