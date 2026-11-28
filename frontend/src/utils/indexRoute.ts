import RBush from "rbush";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import { point, lineString } from "@turf/helpers";
import length from "@turf/length";
import type {
  SignCrossing,
  SignDirection,
  SignSnapResult,
  SnapCandidate,
} from "../../../shared/types";

const SNAP_THRESHOLD_METERS = 10;

const metersToLatitudeDegrees = (meters: number) => meters / 111320;

const metersToLongitudeDegrees = (meters: number, latitude: number) => {
  const cosLat = Math.cos((latitude * Math.PI) / 180);

  // Keep the search conservative near the poles rather than underestimating.
  if (Math.abs(cosLat) < 1e-6) return 180;

  return meters / (111320 * Math.abs(cosLat));
};

interface SegmentItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  index: number; // index of coordinates[index] → coordinates[index+1]
  distanceAtStart: number; // cumulative meters along route at start of segment
}

// Build the index once per route — reuse it for all signs
export const buildRouteIndex = (
  coordinates: GeoJSON.Position[],
): { tree: RBush<SegmentItem>; cumulativeDistances: number[] } => {
  const tree = new RBush<SegmentItem>();
  const cumulativeDistances: number[] = [0];

  const items: SegmentItem[] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    const midpointLat = (lat1 + lat2) / 2;
    const latThresholdDegrees = metersToLatitudeDegrees(SNAP_THRESHOLD_METERS);
    const lonThresholdDegrees = metersToLongitudeDegrees(
      SNAP_THRESHOLD_METERS,
      midpointLat,
    );

    const segmentLength = length(
      lineString([coordinates[i], coordinates[i + 1]]),
      { units: "meters" },
    );
    cumulativeDistances.push(cumulativeDistances[i] + segmentLength);

    items.push({
      minX: Math.min(lon1, lon2) - lonThresholdDegrees,
      minY: Math.min(lat1, lat2) - latThresholdDegrees,
      maxX: Math.max(lon1, lon2) + lonThresholdDegrees,
      maxY: Math.max(lat1, lat2) + latThresholdDegrees,
      index: i,
      distanceAtStart: cumulativeDistances[i],
    });
  }

  tree.load(items); // bulk load is faster than inserting one by one
  return { tree, cumulativeDistances };
};

// Half the stretch of route whose overall bearing is the rider's heading at a
// sign. Long enough to smooth GPS jitter and tiny segments, short enough to
// stay on the road the sign stands on.
const HEADING_HALF_WINDOW_METERS = 20;
// cos(60°): the heading must point clearly into or out of town.
const CROSSING_MIN_ALIGNMENT = 0.5;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const pointAtDistance = (
  coordinates: GeoJSON.Position[],
  cumulativeDistances: number[],
  distance: number,
): GeoJSON.Position => {
  const last = cumulativeDistances.length - 1;
  if (distance <= 0) return coordinates[0];
  if (distance >= cumulativeDistances[last]) return coordinates[last];
  let low = 0;
  let high = last;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (cumulativeDistances[mid] <= distance) low = mid;
    else high = mid;
  }
  const span = cumulativeDistances[high] - cumulativeDistances[low] || 1;
  const t = (distance - cumulativeDistances[low]) / span;
  const [lon1, lat1] = coordinates[low];
  const [lon2, lat2] = coordinates[high];
  return [lon1 + t * (lon2 - lon1), lat1 + t * (lat2 - lat1)];
};

const bearingBetween = (
  [lon1, lat1]: GeoJSON.Position,
  [lon2, lat2]: GeoJSON.Position,
) => {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.cos(toRadians(lon2 - lon1));
  return (Math.atan2(y, x) * 180) / Math.PI;
};

/**
 * Whether riding the route at this pass enters or leaves the town. Only a
 * high-confidence sign direction and a clearly aligned heading give an answer.
 */
export const classifyCrossing = (
  coordinates: GeoJSON.Position[],
  cumulativeDistances: number[],
  distanceAlongRoute: number,
  direction: SignDirection | undefined,
): SignCrossing => {
  if (direction?.confidence !== "high") return "unknown";
  const before = pointAtDistance(
    coordinates,
    cumulativeDistances,
    distanceAlongRoute - HEADING_HALF_WINDOW_METERS,
  );
  const after = pointAtDistance(
    coordinates,
    cumulativeDistances,
    distanceAlongRoute + HEADING_HALF_WINDOW_METERS,
  );
  if (before[0] === after[0] && before[1] === after[1]) return "unknown";
  const alignment = Math.cos(
    toRadians(bearingBetween(before, after) - direction.insideBearing),
  );
  if (alignment >= CROSSING_MIN_ALIGNMENT) return "entry";
  if (alignment <= -CROSSING_MIN_ALIGNMENT) return "exit";
  return "unknown";
};

export const findSnapCandidates = (
  coordinates: number[][],
  tree: RBush<SegmentItem>,
  signLat: number,
  signLon: number,
): SignSnapResult => {
  const signPoint = point([signLon, signLat]);
  const latThresholdDegrees = metersToLatitudeDegrees(SNAP_THRESHOLD_METERS);
  const lonThresholdDegrees = metersToLongitudeDegrees(
    SNAP_THRESHOLD_METERS,
    signLat,
  );

  // Only check segments whose bounding box intersects the threshold radius
  const nearby = tree.search({
    minX: signLon - lonThresholdDegrees,
    minY: signLat - latThresholdDegrees,
    maxX: signLon + lonThresholdDegrees,
    maxY: signLat + latThresholdDegrees,
  });

  const candidates: SnapCandidate[] = [];

  for (const item of nearby) {
    const segment = lineString([
      coordinates[item.index],
      coordinates[item.index + 1],
    ]);
    const snapped = nearestPointOnLine(segment, signPoint, { units: "meters" });
    const distToSign = snapped.properties.pointDistance;

    if (distToSign <= SNAP_THRESHOLD_METERS) {
      candidates.push({
        lat: snapped.geometry.coordinates[1],
        long: snapped.geometry.coordinates[0],
        distanceAlongRoute:
          item.distanceAtStart + snapped.properties.totalDistance,
      });
    }
  }

  // Sort by distance along route so deduplication is stable
  candidates.sort((a, b) => a.distanceAlongRoute - b.distanceAlongRoute);

  if (candidates.length === 0) return { status: "off_route" };

  const deduplicated = candidates.filter((c, i) => {
    if (i === 0) return true;
    return c.distanceAlongRoute - candidates[i - 1].distanceAlongRoute > 200;
  });

  if (deduplicated.length === 1)
    return { status: "ok", position: deduplicated[0] };
  return { status: "ambiguous", candidates: deduplicated };
};
