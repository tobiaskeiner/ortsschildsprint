// Works out which side of a city-limit sign is inside the town.
//
// A sign sits on (or next to) a road. Each road direction leaving the sign is
// an "arm". Independent signals vote on which of the two arms points into
// town; the result is stored as the inside arm's compass bearing. A rider whose
// heading points along that bearing enters the town, the opposite way exits it.

const EARTH_RADIUS_M = 6371008.8;
const ARM_LOOKAHEAD_M = 40;
export const BUILDING_RADIUS_M = 300;
const PLACE_MAX_DISTANCE_M = 6000;
const OFF_ROAD_MAX_DISTANCE_M = 20;

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export function distance(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function bearing(a, b) {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

const cosDiff = (b1, b2) => Math.cos(rad(b1 - b2));

function toLocal(origin, p) {
  return {
    x: rad(p.lon - origin.lon) * EARTH_RADIUS_M * Math.cos(rad(origin.lat)),
    y: rad(p.lat - origin.lat) * EARTH_RADIUS_M,
  };
}

function projectOnSegment(origin, a, b) {
  const A = toLocal(origin, a);
  const B = toLocal(origin, b);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, (-A.x * dx - A.y * dy) / len2));
  return { t, d: Math.hypot(A.x + t * dx, A.y + t * dy) };
}

// The point ARM_LOOKAHEAD_M along the polyline from `start`, walking from
// index `i` in direction `step`. Short dead ends still give a usable bearing.
function pointAhead(start, points, i, step) {
  let previous = start;
  let walked = 0;
  for (let j = i; j >= 0 && j < points.length; j += step) {
    const d = distance(previous, points[j]);
    if (walked + d >= ARM_LOOKAHEAD_M) return points[j];
    walked += d;
    previous = points[j];
  }
  return walked > 5 ? previous : null;
}

/**
 * Road directions leaving the sign. `ways` are highway ways with `nodes` and
 * `geometry` (Overpass `out body geom`). Each arm carries the tags of the way
 * it runs along and `step` (+1 along the way's direction, -1 against it).
 */
export function buildArms(sign, ways) {
  const onWay = ways.filter((w) => w.nodes.includes(sign.id));
  if (onWay.length > 0) {
    const arms = [];
    for (const way of onWay) {
      const i = way.nodes.indexOf(sign.id);
      for (const step of [1, -1]) {
        const ahead = pointAhead(sign, way.geometry, i + step, step);
        if (ahead)
          arms.push({ bearing: bearing(sign, ahead), tags: way.tags, step });
      }
    }
    return arms;
  }

  let best = null;
  for (const way of ways) {
    for (let i = 0; i < way.geometry.length - 1; i++) {
      const { t, d } = projectOnSegment(
        sign,
        way.geometry[i],
        way.geometry[i + 1],
      );
      if (!best || d < best.d) best = { way, i, t, d };
    }
  }
  if (!best || best.d > OFF_ROAD_MAX_DISTANCE_M) return [];

  const g = best.way.geometry;
  const snapped = {
    lat: g[best.i].lat + best.t * (g[best.i + 1].lat - g[best.i].lat),
    lon: g[best.i].lon + best.t * (g[best.i + 1].lon - g[best.i].lon),
  };
  const arms = [];
  for (const [startIndex, step] of [
    [best.i + 1, 1],
    [best.i, -1],
  ]) {
    const ahead = pointAhead(snapped, g, startIndex, step);
    if (ahead)
      arms.push({
        bearing: bearing(snapped, ahead),
        tags: best.way.tags,
        step,
      });
  }
  return arms;
}

// ---------- signals: +1 = arm 0 is inside, -1 = arm 1 is inside, 0 = no idea

function zoneOf(tags) {
  const values = [
    tags["zone:traffic"],
    tags["source:maxspeed"],
    tags["maxspeed:type"],
    tags.maxspeed,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/urban/.test(values)) return "urban";
  if (/rural|motorway/.test(values)) return "rural";
  return null;
}

function voteZone([a0, a1]) {
  const z0 = zoneOf(a0.tags);
  const z1 = zoneOf(a1.tags);
  if (z0 === z1) return 0;
  if (z0 === "urban" || (z1 === "rural" && z0 === null)) return 1;
  if (z1 === "urban" || (z0 === "rural" && z1 === null)) return -1;
  return 0;
}

function voteMaxspeed([a0, a1]) {
  const m0 = Number.parseInt(a0.tags.maxspeed ?? "", 10);
  const m1 = Number.parseInt(a1.tags.maxspeed ?? "", 10);
  if (!Number.isFinite(m0) || !Number.isFinite(m1) || m0 === m1) return 0;
  return m0 < m1 ? 1 : -1;
}

const COMPASS = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  ESE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSW: 202.5,
  SW: 225,
  WSW: 247.5,
  W: 270,
  WNW: 292.5,
  NW: 315,
  NNW: 337.5,
};

// Mapper-tagged facing. The node describes the entry face unless it is tagged
// `city_limit=end`. forward/backward refer to the direction of the way.
function voteTagged(sign, arms) {
  const raw = (
    sign.tags["traffic_sign:direction"] ??
    sign.tags.direction ??
    ""
  ).trim();
  if (!raw) return 0;
  const exitFace = sign.tags.city_limit === "end";

  if (raw === "forward" || raw === "backward") {
    // Two ways meeting head-to-head or tail-to-tail make forward meaningless.
    if (arms[0].step === arms[1].step) return 0;
    const insideStep = (raw === "forward" ? 1 : -1) * (exitFace ? -1 : 1);
    return arms[0].step === insideStep ? 1 : -1;
  }

  const facing = COMPASS[raw.toUpperCase()] ?? Number.parseFloat(raw);
  if (!Number.isFinite(facing)) return 0;
  // A sign facing north is read by traffic heading south.
  const travel = (facing + (exitFace ? 0 : 180)) % 360;
  const c0 = cosDiff(arms[0].bearing, travel);
  const c1 = cosDiff(arms[1].bearing, travel);
  if (Math.abs(c0 - c1) < 0.5) return 0;
  return c0 > c1 ? 1 : -1;
}

const normalizeName = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

function votePlace(sign, arms, places) {
  const names = new Set(
    [sign.tags.name, sign.tags["name:de"], sign.tags["city_limit:name"]]
      .filter(Boolean)
      .flatMap((n) => [n, ...n.split(/[;/]/)])
      .map(normalizeName)
      .filter(Boolean),
  );
  if (names.size === 0) return 0;

  const matches = places
    .filter((p) => names.has(normalizeName(p.tags?.name)))
    .map((p) => ({ p, d: distance(sign, p) }))
    .filter((m) => m.d <= PLACE_MAX_DISTANCE_M)
    .sort((a, b) => a.d - b.d);
  if (matches.length === 0) return 0;
  // Two different towns on one double-sided sign: no single "inside".
  if (new Set(matches.map((m) => normalizeName(m.p.tags.name))).size > 1)
    return 0;

  const target = bearing(sign, matches[0].p);
  const c0 = cosDiff(arms[0].bearing, target);
  const c1 = cosDiff(arms[1].bearing, target);
  if (Math.abs(c0 - c1) < 0.3) return 0;
  return c0 > c1 ? 1 : -1;
}

function voteBuildings(sign, arms, buildings) {
  let n0 = 0;
  let n1 = 0;
  for (const b of buildings) {
    const d = distance(sign, b);
    if (d > BUILDING_RADIUS_M || d < 1) continue;
    const towards = bearing(sign, b);
    const c0 = cosDiff(arms[0].bearing, towards);
    const c1 = cosDiff(arms[1].bearing, towards);
    if (c0 > 0.3 && c0 > c1) n0++;
    else if (c1 > 0.3 && c1 > c0) n1++;
  }
  if (n0 + n1 < 4) return 0;
  if (n0 >= 2 * n1 + 2) return 1;
  if (n1 >= 2 * n0 + 2) return -1;
  return 0;
}

/**
 * @returns {{ insideBearing: number, confidence: "high" | "low" } | null}
 * "high": at least two signals and none disagree. "low": one signal, or a
 * majority against a dissent. null: no road axis or no signal at all.
 */
export function scoreSign(sign, { ways, places, buildings }) {
  const arms = buildArms(sign, ways);
  if (arms.length !== 2) return null;

  const votes = [
    voteTagged(sign, arms),
    voteZone(arms),
    voteMaxspeed(arms),
    votePlace(sign, arms, places),
    voteBuildings(sign, arms, buildings),
  ].filter((v) => v !== 0);
  const sum = votes.reduce((a, v) => a + v, 0);
  if (sum === 0) return null;

  const unanimous = votes.every((v) => v === votes[0]);
  return {
    insideBearing: Math.round(arms[sum > 0 ? 0 : 1].bearing) % 360,
    confidence: unanimous && votes.length >= 2 ? "high" : "low",
  };
}
