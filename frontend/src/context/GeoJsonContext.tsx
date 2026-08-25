import React, { createContext, useState } from "react";
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

const GeoJsonContext = createContext<GeoJsonContextType | undefined>(undefined);

const GeoJsonProvider = ({ children }: { children: React.ReactNode }) => {
  const [geoJson, setGeoJson] = useState<GeoJSON.FeatureCollection | undefined>(
    undefined,
  );
  const [parseState, setParseState] = useState<ParseState>("pending");
  const [parseError, setParseError] = useState<string | null>(null);
  const [center, setCenter] = useState<
    GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties> | undefined
  >();
  const [signs, setSigns] = useState<Sign[] | undefined>(undefined);
  const [routeName, setRouteName] = useState<string | undefined>(undefined);
  const [routeLength, setRouteLength] = useState<number | undefined>(undefined);
  const [routeXml, setRouteXml] = useState<Document | undefined>(undefined);
  const [fileExtension, setFileExtension] = useState<Formats | undefined>(
    undefined,
  );
  const [rawFileName, setRawFileName] = useState<string | undefined>(undefined);

  const reset = () => {
    setCenter(undefined);
    setFileExtension(undefined);
    setGeoJson(undefined);
    setParseError(null);
    setParseState("pending");
    setRawFileName(undefined);
    setRouteLength(undefined);
    setRouteName(undefined);
    setRouteXml(undefined);
    setSigns(undefined);
  };

  return (
    <GeoJsonContext
      value={{
        geoJson,
        parseState,
        parseError,
        center,
        signs,
        routeName,
        routeLength,
        routeXml,
        fileExtension,
        rawFileName,
        setGeoJson,
        setParseState,
        setParseError,
        setCenter,
        setSigns,
        setRouteName,
        reset,
        setRouteLength,
        setRouteXml,
        setFileExtension,
        setRawFileName,
      }}
    >
      {children}
    </GeoJsonContext>
  );
};

export { GeoJsonContext, GeoJsonProvider };
