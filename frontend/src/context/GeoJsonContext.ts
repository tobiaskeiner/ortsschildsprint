import { createContext } from "react";
import type { Sign, Formats } from "../../../shared/types";

export type ParseState = "pending" | "inProgress" | "Done" | "Error";

interface GeoJsonContextType {
  geoJson?: GeoJSON.FeatureCollection;
  routeXml?: Document;
  parseState: ParseState;
  parseError?: string | null;
  center?: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>;
  signs?: Sign[];
  routeName?: string;
  routeLength?: number;
  fileExtension?: Formats;
  rawFileName?: string;
  setGeoJson: (geoJson: GeoJSON.FeatureCollection) => void;
  setParseState: (state: ParseState) => void;
  setParseError: (error: string | null) => void;
  setCenter: (
    center:
      GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties> | undefined,
  ) => void;
  setSigns: (signs?: Sign[]) => void;
  setRouteName: (name?: string) => void;
  setRouteLength: (length?: number) => void;
  setRouteXml: (xml?: Document) => void;
  setFileExtension: (format?: Formats) => void;
  setRawFileName: (name?: string) => void;
  reset: () => void;
}

export const GeoJsonContext = createContext<GeoJsonContextType | undefined>(
  undefined,
);
