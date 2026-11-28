import {
  test as base,
  expect,
  type Download,
  type Page,
} from "@playwright/test";

/** Minimal valid MapLibre style so maps render without the tile server. */
const EMPTY_MAP_STYLE = { version: 8, sources: {}, layers: [] };

export interface RouteFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export interface MockSign {
  id: number;
  osm_id: number;
  tags: Record<string, string>;
  lat: number;
  long: number;
  direction?: { insideBearing: number; confidence: "high" | "low" };
}

type Position = readonly [lat: number, lon: number];

/** A two-point track heading north-east; the default route of most tests. */
export const STRAIGHT_TRACK: Position[] = [
  [50.0, 8.0],
  [50.01, 8.01],
];

/**
 * Out-and-back track: north on one side of the road, back south ~3.5 m to
 * the east. A sign in between is within the snap threshold of both passes,
 * and the passes are >200 m apart along the route, so it is ambiguous.
 */
export const OUT_AND_BACK_TRACK: Position[] = [
  [50.0, 8.0],
  [50.01, 8.0],
  [50.0, 8.00005],
];

export const gpxRoute = ({
  name = "Morning Ride",
  fileName = "morning-ride.gpx",
  points = STRAIGHT_TRACK,
}: {
  name?: string;
  fileName?: string;
  points?: Position[];
} = {}): RouteFile => ({
  name: fileName,
  mimeType: "application/gpx+xml",
  buffer: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="playwright" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${name}</name></metadata>
  <trk><name>${name}</name><trkseg>
${points.map(([lat, lon]) => `    <trkpt lat="${lat}" lon="${lon}"><ele>100</ele></trkpt>`).join("\n")}
  </trkseg></trk>
</gpx>`),
});

export const tcxRoute = ({
  name = "Evening Loop",
  fileName = "evening-loop.tcx",
  points = STRAIGHT_TRACK,
}: {
  name?: string;
  fileName?: string;
  points?: Position[];
} = {}): RouteFile => ({
  name: fileName,
  mimeType: "application/vnd.garmin.tcx+xml",
  buffer: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Courses>
    <Course>
      <Name>${name}</Name>
      <Track>
${points
  .map(
    ([lat, lon]) => `        <Trackpoint>
          <Position><LatitudeDegrees>${lat}</LatitudeDegrees><LongitudeDegrees>${lon}</LongitudeDegrees></Position>
          <AltitudeMeters>100</AltitudeMeters>
        </Trackpoint>`,
  )
  .join("\n")}
      </Track>
    </Course>
  </Courses>
</TrainingCenterDatabase>`),
});

export const EXAMPLEVILLE: MockSign = {
  id: 1,
  osm_id: 123,
  tags: { name: "Exampleville" },
  lat: 50.005,
  long: 8.005,
};

/** Sits between both passes of {@link OUT_AND_BACK_TRACK}. */
export const TWICE_PASSED_SIGN: MockSign = {
  id: 2,
  osm_id: 456,
  tags: { name: "Twiceburg" },
  lat: 50.005,
  long: 8.000025,
};

/** Answers the sign lookup with the given signs. */
export const mockSigns = async (page: Page, signs: MockSign[]) => {
  await page.route("**/api/signs", (route) =>
    route.fulfill({ contentType: "application/json", json: signs }),
  );
};

export const readDownload = async (download: Download) => {
  const chunks: Buffer[] = [];
  for await (const chunk of await download.createReadStream()) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
};

/** Uploads a route from the home screen and waits for the preview step. */
export const uploadRoute = async (page: Page, file: RouteFile) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page).toHaveURL("/route");
};

/** Sign markers on the workflow map (`react-map-gl` renders them as DOM). */
export const signMarkers = (page: Page) => page.locator(".maplibregl-marker");

export const test = base.extend<{ isolateNetwork: void }>({
  isolateNetwork: [
    async ({ context }, use) => {
      // Keep the suite hermetic: no third-party tiles, no real API.
      await context.route(
        (url) => url.hostname !== "127.0.0.1" && url.hostname !== "localhost",
        (route) => {
          if (route.request().url().includes("/styles/")) {
            return route.fulfill({ json: EMPTY_MAP_STYLE });
          }
          return route.abort();
        },
      );
      await context.route("**/api/**", (route) =>
        route.fulfill({ status: 503, json: { error: "unmocked API call" } }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
