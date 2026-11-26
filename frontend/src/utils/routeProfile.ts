/** Elevation changes smaller than this (metres) are treated as GPS noise. */
const GAIN_THRESHOLD_M = 3;
/** Start and finish closer than this (km) make a route a loop. */
const LOOP_THRESHOLD_KM = 0.25;
/** Share of track points that must carry elevation to draw a profile. */
const MIN_ELEVATION_COVERAGE = 0.8;

export interface RouteProfile {
  coordinates: GeoJSON.Position[];
  /** Cumulative distance from the start in kilometres, one per coordinate. */
  distances: number[];
  totalKm: number;
  /** Elevation in metres per coordinate, or null when the file has none. */
  elevations: number[] | null;
  gainM: number | null;
  maxM: number | null;
  minM: number | null;
  isLoop: boolean;
  bounds: [[number, number], [number, number]];
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const haversineKm = (a: GeoJSON.Position, b: GeoJSON.Position) => {
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

export const getRouteCoordinates = (geoJson: GeoJSON.FeatureCollection) =>
  geoJson.features.flatMap((feature) => {
    if (feature.geometry.type === "LineString") {
      return feature.geometry.coordinates;
    }
    if (feature.geometry.type === "MultiLineString") {
      return feature.geometry.coordinates.flat();
    }
    return [];
  });

const getElevations = (coordinates: GeoJSON.Position[]) => {
  const withElevation = coordinates.filter((c) => Number.isFinite(c[2]));
  if (
    coordinates.length < 2 ||
    withElevation.length / coordinates.length < MIN_ELEVATION_COVERAGE
  ) {
    return null;
  }

  // carry the last known value over gaps so the profile stays continuous
  let last = withElevation[0][2];
  return coordinates.map((c) => {
    if (Number.isFinite(c[2])) last = c[2];
    return last;
  });
};

const getGain = (elevations: number[]) => {
  let reference = elevations[0];
  let gain = 0;
  for (const elevation of elevations) {
    if (elevation - reference >= GAIN_THRESHOLD_M) {
      gain += elevation - reference;
      reference = elevation;
    } else if (reference - elevation >= GAIN_THRESHOLD_M) {
      reference = elevation;
    }
  }
  return gain;
};

export const buildRouteProfile = (
  geoJson: GeoJSON.FeatureCollection,
): RouteProfile | null => {
  const coordinates = getRouteCoordinates(geoJson);
  if (coordinates.length < 2) return null;

  const distances = [0];
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  coordinates.forEach((c, i) => {
    if (i > 0) {
      distances.push(distances[i - 1] + haversineKm(coordinates[i - 1], c));
    }
    minLon = Math.min(minLon, c[0]);
    maxLon = Math.max(maxLon, c[0]);
    minLat = Math.min(minLat, c[1]);
    maxLat = Math.max(maxLat, c[1]);
  });

  const totalKm = distances[distances.length - 1];
  // a track that never moves has no distance axis to draw
  if (!(totalKm > 0)) return null;
  const elevations = getElevations(coordinates);

  return {
    coordinates,
    distances,
    totalKm,
    elevations,
    gainM: elevations ? getGain(elevations) : null,
    maxM: elevations ? Math.max(...elevations) : null,
    minM: elevations ? Math.min(...elevations) : null,
    isLoop:
      totalKm > LOOP_THRESHOLD_KM * 2 &&
      haversineKm(coordinates[0], coordinates[coordinates.length - 1]) <
        LOOP_THRESHOLD_KM,
    bounds: [
      [minLon, minLat],
      [maxLon, maxLat],
    ],
  };
};

/** Index of the track point closest to the given distance along the route. */
export const indexAtDistance = (distances: number[], km: number) => {
  let low = 0;
  let high = distances.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (distances[mid] < km) low = mid + 1;
    else high = mid;
  }
  if (low > 0 && km - distances[low - 1] < distances[low] - km) return low - 1;
  return low;
};

/** A readable tick step (km) giving roughly `target` ticks over `totalKm`. */
export const getTickStep = (totalKm: number, target = 6) => {
  const raw = totalKm / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= raw) ?? 10;
  return step * magnitude;
};
