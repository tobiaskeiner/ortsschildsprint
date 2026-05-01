import type { Sign } from "../../../shared/types";
import xmlFormat from "xml-formatter";

export const buildGpx = (routeXml: Document, signs: Sign[]): string => {
  const clone = routeXml.cloneNode(true) as Document; // avoid mutating context state
  appendGpxWaypoints(clone, signs);
  const serialized = new XMLSerializer().serializeToString(clone);
  return xmlFormat.minify(serialized);
};

export const buildTcx = (routeXml: Document, signs: Sign[]): string => {
  const clone = routeXml.cloneNode(true) as Document;
  appendTcxCoursePoints(clone, signs);
  const serialized = new XMLSerializer().serializeToString(clone);
  return xmlFormat.minify(serialized);
};

const appendTcxCoursePoints = (xml: Document, signs: Sign[]) => {
  const TCX_NS =
    xml.documentElement.namespaceURI ??
    "http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2";

  const course = xml.documentElement.querySelector("Course");
  if (!course) return;

  for (const sign of signs) {
    if (!sign.positionOnRoute) continue;

    const cp = xml.createElementNS(TCX_NS, "CoursePoint");

    const entries: [string, string][] = [
      ["Name", sign.tags.name ?? "Ortsschild"],
      ["PointType", "Generic"],
    ];

    const position = xml.createElementNS(TCX_NS, "Position");
    const lat = xml.createElementNS(TCX_NS, "LatitudeDegrees");
    lat.textContent = sign.positionOnRoute.lat.toString();
    const lon = xml.createElementNS(TCX_NS, "LongitudeDegrees");
    lon.textContent = sign.positionOnRoute.long.toString();
    position.appendChild(lat);
    position.appendChild(lon);
    cp.appendChild(position);

    for (const [tag, text] of entries) {
      const el = xml.createElementNS(TCX_NS, tag);
      el.textContent = text;
      cp.appendChild(el);
    }

    course.appendChild(cp);
  }
};

export const appendGpxWaypoints = (xml: Document, signs: Sign[]) => {
  const GPX_NS =
    xml.documentElement.namespaceURI ?? "http://www.topografix.com/GPX/1/1";

  const trk = xml.documentElement.querySelector("trk");
  for (const sign of signs) {
    if (!sign.positionOnRoute) continue;
    const wpt = xml.createElementNS(GPX_NS, "wpt");
    wpt.setAttribute("lat", sign.positionOnRoute.lat.toString());
    wpt.setAttribute("lon", sign.positionOnRoute.long.toString());

    const children: [string, string][] = [
      ["name", sign.tags.name ?? "Ortsschild"],
      ["sym", "Distance Marker"],
      ["type", "Distance Marker"],
    ];

    for (const [tag, text] of children) {
      const el = xml.createElementNS(GPX_NS, tag);
      el.textContent = text;
      wpt.appendChild(el);
    }

    xml.documentElement.insertBefore(wpt, trk);
  }
};

export const downloadFile = (
  content: string | Uint8Array,
  filename: string,
  type: string,
) => {
  const blob = new Blob([content as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
    style: "display: none",
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const buildTcxFromGeoJson = (
  geoJson: GeoJSON.FeatureCollection,
  signs: Sign[],
  routeName?: string,
): string => {
  const coordinates =
    geoJson.features.flatMap((f) =>
      f.geometry.type === "LineString" ? f.geometry.coordinates : [],
    ) ?? [];

  const trackpoints = coordinates
    .map(
      ([lon, lat]) => `
      <Trackpoint>
        <Position>
          <LatitudeDegrees>${lat}</LatitudeDegrees>
          <LongitudeDegrees>${lon}</LongitudeDegrees>
        </Position>
      </Trackpoint>`,
    )
    .join("");

  const coursePoints = signs
    .map((sign) => {
      if (!sign.positionOnRoute) return "";
      return `
      <CoursePoint>
        <Name>${sign.tags.name ?? "Ortsschild"}</Name>
        <Position>
          <LatitudeDegrees>${sign.positionOnRoute.lat}</LatitudeDegrees>
          <LongitudeDegrees>${sign.positionOnRoute.long}</LongitudeDegrees>
        </Position>
        <PointType>Generic</PointType>
      </CoursePoint>`;
    })
    .join("");

  const name = routeName ?? "Exported Route";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
              <TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
                <Courses>
                  <Course>
                    <Name>${name}</Name>
                    <Track>
                      ${trackpoints}
                    </Track>
                    ${coursePoints}
                  </Course>
                </Courses>
              </TrainingCenterDatabase>`;
  return xmlFormat.minify(xml);
};

export const buildGpxFromGeoJson = (
  geoJson: GeoJSON.FeatureCollection,
  signs: Sign[],
  routeName: string,
): string => {
  const coordinates =
    geoJson.features.flatMap((f) =>
      f.geometry.type === "LineString" ? f.geometry.coordinates : [],
    ) ?? [];

  const trackpoints = coordinates
    .map(([lon, lat, ele]) => {
      const eleTag = ele != null ? `<ele>${ele}</ele>` : "";
      return `<trkpt lat="${lat}" lon="${lon}">${eleTag}</trkpt>`;
    })
    .join("\n        ");

  const waypoints = signs
    .map(
      (sign) => `
    <wpt lat="${sign.positionOnRoute?.lat ?? sign.lat}" lon="${sign.positionOnRoute?.long ?? sign.long}">
      <name>${sign.tags.name ?? "Ortsschild"}</name>
      <sym>Distance Marker</sym>
      <type>Distance Marker</type>
    </wpt>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
              <gpx version="1.1" creator="ortsschildsprint" xmlns="http://www.topografix.com/GPX/1/1">
                <metadata>
                  <name>${routeName}</name>
                </metadata>
                ${waypoints}
                <trk>
                  <name>${routeName}</name>
                  <trkseg>
                    ${trackpoints}
                  </trkseg>
                </trk>
              </gpx>`;
  return xmlFormat.minify(xml);
};
