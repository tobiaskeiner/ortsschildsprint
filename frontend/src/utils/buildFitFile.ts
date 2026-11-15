import { Encoder, Profile } from "@garmin/fitsdk";
import type { Sign } from "../../../shared/types";

/** Degrees to FIT semicircles */
const toSemicircles = (degrees: number): number =>
  Math.round(degrees * (2 ** 31 / 180));

/** Haversine distance in meters between two [lon, lat] points */
const haversineDistance = (
  [lon1, lat1]: number[],
  [lon2, lat2]: number[],
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const buildFitFromGeoJson = (
  geoJson: GeoJSON.FeatureCollection,
  signs: Sign[],
  routeName?: string,
): Uint8Array => {
  const coordinates = geoJson.features.flatMap((f) =>
    f.geometry.type === "LineString" ? f.geometry.coordinates : [],
  );

  if (coordinates.length === 0) {
    throw new Error("error.export.noLineString");
  }

  // Compute cumulative distances for each trackpoint
  const cumulativeDistances: number[] = [0];
  for (let i = 1; i < coordinates.length; i++) {
    cumulativeDistances.push(
      cumulativeDistances[i - 1] +
        haversineDistance(coordinates[i - 1], coordinates[i]),
    );
  }
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const now = new Date();
  // Records are spaced 1s apart, so the course runs for one second per record
  const totalElapsedTime = coordinates.length - 1;
  const timestampForRecord = (index: number): Date =>
    new Date(now.getTime() + index * 1000);

  const encoder = new Encoder();

  // 1. FILE_ID — required header, type "course" = 6
  encoder.onMesg(Profile.MesgNum.FILE_ID, {
    type: "course",
    manufacturer: "development",
    product: 0,
    serialNumber: Math.floor(now.getTime() / 1000),
    timeCreated: now,
  });

  // 2. COURSE — the route name
  encoder.onMesg(Profile.MesgNum.COURSE, {
    name: (routeName ?? "Exported Route").slice(0, 15), // 16-char limit
    sport: "cycling",
  });

  // 3. LAP — required summary record
  encoder.onMesg(Profile.MesgNum.LAP, {
    timestamp: now,
    startTime: now,
    totalElapsedTime,
    totalTimerTime: totalElapsedTime,
    totalDistance,
    startPositionLat: toSemicircles(coordinates[0][1]),
    startPositionLong: toSemicircles(coordinates[0][0]),
    endPositionLat: toSemicircles(coordinates[coordinates.length - 1][1]),
    endPositionLong: toSemicircles(coordinates[coordinates.length - 1][0]),
  });

  // 4. Timer start event — required for course files; devices arm the
  // course point alerts while this timer window is open
  encoder.onMesg(Profile.MesgNum.EVENT, {
    timestamp: now,
    event: "timer",
    eventType: "start",
  });

  // 5. RECORD messages — the trackpoints, with the COURSE_POINT messages
  // interleaved right after the record at which the sign is reached
  // (Garmin devices expect course points inside the timer window)
  const coursePoints = signs
    .filter((sign) => sign.positionOnRoute)
    .sort(
      (a, b) =>
        a.positionOnRoute!.distanceAlongRoute -
        b.positionOnRoute!.distanceAlongRoute,
    );
  let coursePointIndex = 0;
  const writeCoursePoint = (recordIndex: number) => {
    const sign = coursePoints[coursePointIndex];
    encoder.onMesg(Profile.MesgNum.COURSE_POINT, {
      messageIndex: coursePointIndex,
      timestamp: timestampForRecord(recordIndex),
      positionLat: toSemicircles(sign.positionOnRoute!.lat),
      positionLong: toSemicircles(sign.positionOnRoute!.long),
      distance: sign.positionOnRoute!.distanceAlongRoute,
      name: (sign.tags.name ?? "Ortsschild").slice(0, 15),
      type: "sprint",
    });
    coursePointIndex++;
  };

  for (let i = 0; i < coordinates.length; i++) {
    const [lon, lat] = coordinates[i];
    encoder.onMesg(Profile.MesgNum.RECORD, {
      timestamp: timestampForRecord(i), // fake timestamps, 1s apart
      positionLat: toSemicircles(lat),
      positionLong: toSemicircles(lon),
      distance: cumulativeDistances[i],
    });

    while (
      coursePointIndex < coursePoints.length &&
      coursePoints[coursePointIndex].positionOnRoute!.distanceAlongRoute <=
        cumulativeDistances[i]
    ) {
      writeCoursePoint(i);
    }
  }

  // Flush signs that resolved beyond the last record so they are not lost
  while (coursePointIndex < coursePoints.length) {
    writeCoursePoint(coordinates.length - 1);
  }

  // 6. Timer stop event — closes the course's timing window
  encoder.onMesg(Profile.MesgNum.EVENT, {
    timestamp: timestampForRecord(coordinates.length - 1),
    event: "timer",
    eventType: "stopAll",
  });

  return encoder.close(); // returns Uint8Array
};
