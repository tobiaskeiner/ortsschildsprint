import { gpx, tcx } from "@tmcw/togeojson";
import { use } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import center from "@turf/center";
import bbox from "@turf/bbox";
import type { SignsResponse } from "../../../shared/types";
import { point } from "@turf/helpers";
import { buffer } from "@turf/buffer";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { length } from "@turf/length";
import type { Formats } from "../../../shared/types";
import { Decoder, Stream } from "@garmin/fitsdk";
import { buildRouteIndex, findSnapCandidates } from "../utils/indexRoute";

interface parseFileProps {
  file: File;
  setParseSuccessful?: (state: boolean) => void;
}

const getParseErrorMessageId = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith("error.parse.")) {
    return error.message;
  }

  return "error.parse.generic";
};

export const parseFitToGeoJson = (
  buffer: ArrayBuffer,
): { geoJson: GeoJSON.FeatureCollection; routeName?: string } => {
  const stream = Stream.fromArrayBuffer(buffer);
  const decoder = new Decoder(stream);

  if (!decoder.isFIT()) throw new Error("error.parse.invalidFit");
  if (!decoder.checkIntegrity()) throw new Error("error.parse.fitIntegrity");

  const { messages } = decoder.read();

  const coordinates: [number, number][] = messages.recordMesgs
    .filter((r) => r.positionLat != null && r.positionLong != null)
    .map((r) => [
      r.positionLong! * (180 / 2 ** 31),
      r.positionLat! * (180 / 2 ** 31),
    ]);

  if (coordinates.length === 0) {
    throw new Error("error.parse.noFitPositionData");
  }

  const routeName = messages.courseMesgs[0]?.name;

  return {
    routeName,
    geoJson: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      ],
    },
  };
};

const useParseFile = () => {
  const geoJsonContext = use(GeoJsonContext);

  const parseFile = async ({ file, setParseSuccessful }: parseFileProps) => {
    geoJsonContext?.setParseState("inProgress");
    geoJsonContext?.setParseError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      geoJsonContext?.setFileExtension(extension as Formats | undefined);
      geoJsonContext?.setRawFileName(file.name);

      let geoJson: GeoJSON.FeatureCollection;

      if (extension === "fit") {
        const buffer = await file.arrayBuffer();
        const { geoJson: parsedGeoJson, routeName } = parseFitToGeoJson(buffer);
        geoJsonContext?.setRouteName(routeName);
        geoJsonContext?.setGeoJson(parsedGeoJson);
        geoJson = parsedGeoJson;
      } else if (extension === "tcx") {
        const text = await file.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const parsedGeoJson = tcx(xml);

        geoJsonContext?.setRouteXml(xml);
        geoJsonContext?.setGeoJson(parsedGeoJson);

        const routeName = xml
          .querySelector("Courses")
          ?.querySelector("Course")
          ?.querySelector("Name")?.innerHTML;
        geoJsonContext?.setRouteName(routeName);
        geoJson = parsedGeoJson;
      } else {
        const text = await file.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        const parsedGeoJson = gpx(xml);

        geoJsonContext?.setRouteXml(xml);
        geoJsonContext?.setGeoJson(parsedGeoJson);

        const routeName = xml
          .querySelector("metadata")
          ?.querySelector("name")?.innerHTML;
        geoJsonContext?.setRouteName(routeName);
        geoJson = parsedGeoJson;
      }

      // calculate center of route, used for initial map position
      const routeCenter = center(geoJson);
      geoJsonContext?.setCenter(routeCenter);

      geoJsonContext?.setParseState("Done");
      geoJsonContext?.setParseError(null);
      if (setParseSuccessful) setParseSuccessful(true);

      // already fetch signs for performance
      const bound = bbox(geoJson);
      const response = await fetch("/api/signs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minLong: bound.at(0),
          minLat: bound.at(1),
          maxLong: bound.at(2),
          maxLat: bound.at(3),
        }),
      });
      const signs = (await response.json()) as SignsResponse;

      // transform geoJson to turf line
      const line = geoJson.features.find(
        (f) => f.geometry.type === "LineString",
      ) as GeoJSON.Feature<GeoJSON.LineString>;

      // calculate route length
      const routeLength = length(line, { units: "kilometers" });
      geoJsonContext?.setRouteLength(routeLength);

      // transform line to polygon + 10m tolerance
      const routeBuffer = buffer(line, 10, { units: "meters" });
      const filteredSigns = signs.filter(
        (sign) =>
          routeBuffer &&
          booleanPointInPolygon(point([sign.long, sign.lat]), routeBuffer),
      );
      geoJsonContext?.setSigns(filteredSigns);

      const coordinates: GeoJSON.Position[] =
        geoJson.features.flatMap((f) =>
          f.geometry.type === "LineString" ? f.geometry.coordinates : [],
        ) ?? [];

      // index RBush tree
      const { tree } = buildRouteIndex(coordinates);
      geoJsonContext?.setSigns(
        filteredSigns.map((sign) => {
          const snapResult = findSnapCandidates(
            coordinates,
            tree,
            sign.lat,
            sign.long,
          );
          return {
            ...sign,
            snapResult,
            ...(snapResult.status === "ok" && {
              positionOnRoute: snapResult.position,
              selectedPositionsOnRoute: [snapResult.position],
            }),
          };
        }),
      );
    } catch (error) {
      geoJsonContext?.setParseError(getParseErrorMessageId(error));
      geoJsonContext?.setParseState("Error");
    }
  };
  return { parseFile };
};

export default useParseFile;
