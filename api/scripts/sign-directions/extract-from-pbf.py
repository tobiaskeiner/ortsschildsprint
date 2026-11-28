"""Builds the sign-direction tile cache from a local OSM extract.

The same files compute-sign-directions.mjs would otherwise download from
Overpass are written to api/.cache/sign-directions/, so the scoring script then
runs fully offline:

    python extract-from-pbf.py germany-latest.osm.pbf
    node --env-file=.env scripts/compute-sign-directions.mjs

Needs pyosmium (`pip install osmium`). Node locations are indexed in a sparse
file next to the extract (~16 bytes per node, ~7 GB for Germany; deleted
afterwards) because an in-memory index for Germany exceeds 20 GB of RAM.
"""

import json
import math
import resource
import shutil
import sys
import time
from collections import defaultdict
from pathlib import Path

import osmium

# Must match compute-sign-directions.mjs.
TILE_LAT = 0.25
TILE_LON = 0.35
PLACE_PADDING_DEG = 0.06
BUILDING_RADIUS_M = 300
# Roads passing this close to a sign can carry it (Overpass: around.s:20).
ROAD_RADIUS_M = 25
PLACE_TYPES = {
    "city", "town", "village", "hamlet", "suburb", "quarter",
    "neighbourhood", "isolated_dwelling", "locality",
}

# Neighbourhood grid: a 3x3 block of cells covers at least ~500 m around a sign.
CELL_LAT = 0.005
CELL_LON = 0.0075

CACHE_DIR = Path(__file__).resolve().parent.parent.parent / ".cache" / "sign-directions"


def tile_key(lat, lon):
    return f"{math.floor(lat / TILE_LAT)}_{math.floor(lon / TILE_LON)}"


def cell(lat, lon):
    return (math.floor(lat / CELL_LAT), math.floor(lon / CELL_LON))


def near_meters(lat1, lon1, lat2, lon2):
    x = math.radians(lon2 - lon1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return 6371008.8 * math.hypot(x, y)


def main(pbf):
    started = time.time()

    # Pass 1: tagged nodes only — signs and places.
    signs, places = [], []
    for node in osmium.FileProcessor(pbf, osmium.osm.NODE).with_filter(
        osmium.filter.KeyFilter("traffic_sign", "place")
    ):
        tags = dict(node.tags)
        loc = node.location
        if tags.get("traffic_sign") == "city_limit":
            signs.append({"type": "node", "id": node.id, "lat": loc.lat, "lon": loc.lon, "tags": tags})
        elif tags.get("place") in PLACE_TYPES and "name" in tags:
            places.append({"type": "node", "id": node.id, "lat": loc.lat, "lon": loc.lon, "tags": tags})
    print(f"{len(signs)} signs, {len(places)} places ({time.time() - started:.0f}s)", flush=True)

    grid = defaultdict(list)  # cell -> signs
    for s in signs:
        grid[cell(s["lat"], s["lon"])].append(s)

    def signs_near(lat, lon):
        ci, cj = cell(lat, lon)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                yield from grid.get((ci + di, cj + dj), ())

    ways = {}  # way id -> (refs, coords, tags); kept once, referenced by tiles
    tile_ways = defaultdict(set)  # tile -> way ids
    tile_buildings = defaultdict(dict)  # tile -> way id -> (lat, lon)

    def signs_on_segment(a, b):
        """Signs within ROAD_RADIUS_M of segment a-b (planar, metres)."""
        seen = set()
        for lat, lon in (a, b):
            for s in signs_near(lat, lon):
                if s["id"] in seen:
                    continue
                seen.add(s["id"])
                k = math.cos(math.radians(s["lat"]))
                ax, ay = (a[1] - s["lon"]) * k, a[0] - s["lat"]
                bx, by = (b[1] - s["lon"]) * k, b[0] - s["lat"]
                dx, dy = bx - ax, by - ay
                t = max(0.0, min(1.0, -(ax * dx + ay * dy) / ((dx * dx + dy * dy) or 1e-18)))
                if math.hypot(ax + t * dx, ay + t * dy) * 111_195 <= ROAD_RADIUS_M:
                    yield s

    # Pass 2: highway and building ways with node locations.
    index_file = Path(pbf).with_suffix(".nodes.idx")
    processor = (
        osmium.FileProcessor(pbf, osmium.osm.NODE | osmium.osm.WAY)
        .with_locations(osmium.index.create_map(f"sparse_file_array,{index_file}"))
        .with_filter(osmium.filter.EntityFilter(osmium.osm.WAY))
        .with_filter(osmium.filter.KeyFilter("highway", "building"))
    )
    try:
        for count, way in enumerate(processor):
            if count % 5_000_000 == 0:
                rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1e6
                print(f"  {count:,} ways, {len(ways):,} roads kept, peak RSS {rss:.1f} GB ({time.time() - started:.0f}s)", flush=True)
            refs, coords = [], []
            for n in way.nodes:
                if n.location.valid():
                    refs.append(n.ref)
                    coords.append((n.location.lat, n.location.lon))
            if not coords:
                continue
            if "highway" in way.tags:
                # a sign that is a node of the road lies on one of its segments
                near = set()
                for a, b in zip(coords, coords[1:]):
                    near.update(tile_key(s["lat"], s["lon"]) for s in signs_on_segment(a, b))
                if not near:
                    continue
                ways[way.id] = (tuple(refs), tuple(coords), dict(way.tags))
                for t in near:
                    tile_ways[t].add(way.id)
            else:
                lat = sum(c[0] for c in coords) / len(coords)
                lon = sum(c[1] for c in coords) / len(coords)
                for s in signs_near(lat, lon):
                    if near_meters(lat, lon, s["lat"], s["lon"]) <= BUILDING_RADIUS_M:
                        tile_buildings[tile_key(s["lat"], s["lon"])][way.id] = (lat, lon)
    finally:
        index_file.unlink(missing_ok=True)
    print(f"Collected {len(ways):,} roads and buildings ({time.time() - started:.0f}s)", flush=True)

    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)
    CACHE_DIR.mkdir(parents=True)

    (CACHE_DIR / "germany-signs.json").write_text(
        json.dumps({"elements": [{"type": "node", "id": s["id"], "lat": s["lat"], "lon": s["lon"]} for s in signs]})
    )

    tile_signs = defaultdict(list)
    for s in signs:
        tile_signs[tile_key(s["lat"], s["lon"])].append(s)

    for key, members in tile_signs.items():
        i, j = (int(v) for v in key.split("_"))
        south, west = i * TILE_LAT - PLACE_PADDING_DEG, j * TILE_LON - PLACE_PADDING_DEG
        north, east = (i + 1) * TILE_LAT + PLACE_PADDING_DEG, (j + 1) * TILE_LON + PLACE_PADDING_DEG
        tile_places = [p for p in places if south <= p["lat"] <= north and west <= p["lon"] <= east]
        elements = (
            members
            + [
                {
                    "type": "way",
                    "id": wid,
                    "nodes": list(ways[wid][0]),
                    "geometry": [{"lat": lat, "lon": lon} for lat, lon in ways[wid][1]],
                    "tags": ways[wid][2],
                }
                for wid in tile_ways[key]
            ]
            + tile_places
            + [
                {"type": "way", "id": wid, "center": {"lat": c[0], "lon": c[1]}}
                for wid, c in tile_buildings[key].items()
            ]
        )
        (CACHE_DIR / f"tile-{key}.json").write_text(json.dumps({"elements": elements}))

    print(f"Wrote {len(tile_signs)} tiles to {CACHE_DIR} ({time.time() - started:.0f}s)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: extract-from-pbf.py <extract.osm.pbf>")
    main(sys.argv[1])
