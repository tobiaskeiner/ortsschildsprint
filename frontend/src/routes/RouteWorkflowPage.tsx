import { Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { use, useState } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Formats, Sign } from "../../../shared/types";
import { FormattedMessage } from "react-intl";
import ErrorAlert from "../components/ErrorAlert";
import ExportLabel from "../components/ExportLabel";
import MapMarkerIcon from "../components/MapMarkerIcon";
import RouteInfo from "../components/RouteInfo";
import Edit from "../steps/Edit";
import Preview from "../steps/Preview";
import { buildFitFromGeoJson } from "../utils/buildFitFile";
import {
  buildGpx,
  buildGpxFromGeoJson,
  buildTcx,
  buildTcxFromGeoJson,
  downloadFile,
} from "../utils/downloadHelper";
import { getZoomLevel } from "../utils/getZoomLevel";
import { getExportSnapCandidates } from "../utils/signRouteSelection";
import {
  HOME_ROUTE,
  WORKFLOW_EDIT_ROUTE,
  WORKFLOW_EXPORT_ROUTE,
  WORKFLOW_ROUTE,
  getWorkflowStepFromPathname,
} from "../utils/routes";

type ResolvedSign = Sign & {
  positionOnRoute: NonNullable<Sign["positionOnRoute"]>;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith("error.export.")) {
    return error.message;
  }

  return "error.export.generic";
};

const RouteWorkflowPage: React.FC = () => {
  const geoContext = use(GeoJsonContext);
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const step = getWorkflowStepFromPathname(pathname);
  const [format, setFormat] = useState<Formats>("gpx");
  const [error, setError] = useState<string | null>(null);
  // The route the user deleted signs from. Kept as the route object so a new
  // upload (a new object) shows the "no signs detected" notice again.
  const [routeWithDeletedSigns, setRouteWithDeletedSigns] =
    useState<GeoJSON.FeatureCollection>();
  const navigateTo = (to: string) => {
    void navigate({ to: to as never });
  };

  if (!step || !geoContext) {
    return <Navigate replace to={HOME_ROUTE} />;
  }

  if (!geoContext.geoJson) {
    if (geoContext.parseState === "inProgress") {
      return (
        <div className="flex min-h-[50vh] items-center justify-center rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-container border-t-primary" />
            <p className="text-center font-medium text-secondary">
              Processing file...
            </p>
          </div>
        </div>
      );
    }

    return <Navigate replace to={HOME_ROUTE} />;
  }

  if (step === "preview") {
    return (
      <Preview
        onContinue={() => navigateTo(WORKFLOW_EDIT_ROUTE)}
        onReplaced={() => navigateTo(WORKFLOW_ROUTE)}
      />
    );
  }

  if (step === "edit") {
    return (
      <Edit
        noSignsFound={
          geoContext.parseState === "Done" &&
          geoContext.signs != null &&
          geoContext.signs.length < 1 &&
          routeWithDeletedSigns !== geoContext.geoJson
        }
        onBack={() => navigateTo(WORKFLOW_ROUTE)}
        onContinue={() => navigateTo(WORKFLOW_EXPORT_ROUTE)}
        onSignDeleted={() => setRouteWithDeletedSigns(geoContext.geoJson)}
      />
    );
  }

  const onDownload = (fileFormat: Formats) => {
    const { routeXml, routeName, signs, fileExtension, geoJson } = geoContext;

    setError(null);

    if (!geoJson) {
      setError("error.export.noRouteData");
      return;
    }

    if (!signs || signs.length < 1) {
      setError("error.export.noSigns");
      return;
    }

    const filename = (routeName ?? "enriched_route") + "." + fileFormat;

    try {
      const resolvedSigns: ResolvedSign[] = signs
        .map((sign) => {
          const primaryPosition = getExportSnapCandidates(sign)[0];
          return primaryPosition
            ? { ...sign, positionOnRoute: primaryPosition }
            : undefined;
        })
        .filter((sign): sign is ResolvedSign => Boolean(sign?.positionOnRoute))
        .sort(
          (a, b) =>
            a.positionOnRoute.distanceAlongRoute -
            b.positionOnRoute.distanceAlongRoute,
        );

      if (resolvedSigns.length < 1) {
        throw new Error("error.export.noResolvedSigns");
      }

      const fitSigns: ResolvedSign[] = signs
        .flatMap((sign) =>
          getExportSnapCandidates(sign).map((positionOnRoute) => ({
            ...sign,
            positionOnRoute,
          })),
        )
        .sort(
          (a, b) =>
            a.positionOnRoute.distanceAlongRoute -
            b.positionOnRoute.distanceAlongRoute,
        );

      const content = (() => {
        switch (fileFormat) {
          case "gpx":
            if (fileExtension === "gpx") {
              if (!routeXml) throw new Error("error.export.missingRouteXml");
              return buildGpx(routeXml, resolvedSigns);
            }
            return buildGpxFromGeoJson(
              geoJson,
              resolvedSigns,
              routeName ?? "enriched_route",
            );
          case "tcx":
            if (fileExtension === "tcx") {
              if (!routeXml) throw new Error("error.export.missingRouteXml");
              return buildTcx(routeXml, resolvedSigns);
            }
            return buildTcxFromGeoJson(
              geoJson,
              resolvedSigns,
              routeName ?? "enriched_route",
            );
          case "fit":
            return buildFitFromGeoJson(geoJson, fitSigns, routeName);
        }
      })();

      const mime = (() => {
        switch (fileFormat) {
          case "fit":
            return "application/vnd.ant.fit";
          case "gpx":
            return "application/gpx+xml";
          case "tcx":
            return "application/vnd.garmin.tcx+xml";
        }
      })();

      downloadFile(content, filename, mime);
    } catch (downloadError: unknown) {
      setError(getErrorMessage(downloadError));
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>,
  ) => {
    setFormat(event.target.value as Formats);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <RouteInfo />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-8">
        <div className="min-w-0 xl:col-span-2">
          <div className="overflow-hidden rounded-[1.5rem] bg-surface-container-lowest p-2 shadow-lg sm:rounded-[1.75rem] sm:p-3">
            <div className="h-[45vh] min-h-[18rem] max-h-[32rem] md:h-[32rem] md:max-h-none xl:h-[38rem]">
              <Map
                initialViewState={{
                  longitude: geoContext.center?.geometry.coordinates[0],
                  latitude: geoContext.center?.geometry.coordinates[1],
                  zoom: getZoomLevel(geoContext.geoJson),
                }}
                style={{ width: "100%", height: "100%", borderRadius: 20 }}
                mapStyle="https://tiles.openfreemap.org/styles/positron"
              >
                <Source id="route" type="geojson" data={geoContext.geoJson}>
                  <Layer
                    id="route-line"
                    type="line"
                    paint={{ "line-color": "#202020", "line-width": 3 }}
                  />
                </Source>
                {(geoContext.signs ?? []).map((sign) => (
                  <Marker
                    key={sign.id}
                    latitude={sign.lat}
                    longitude={sign.long}
                    anchor="bottom"
                  >
                    <MapMarkerIcon style={{ color: "black" }} />
                  </Marker>
                ))}
              </Map>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-1 xl:gap-8">
          <div className="flex flex-col gap-6 rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-lg sm:rounded-[1.75rem] sm:p-6 md:gap-8 md:p-8">
            <div>
              <h2 className="mb-2 flex items-center gap-3 font-headline text-2xl font-black uppercase">
                <span
                  className="material-symbols-outlined text-3xl"
                  data-icon="file_download"
                >
                  file_download
                </span>
                <FormattedMessage id="export.title" />
              </h2>
              <p className="text-sm text-secondary">
                <FormattedMessage id="export.description" />
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onDownload(format);
              }}
            >
              <ExportLabel
                label={<FormattedMessage id="export.gpx.label" />}
                subtitle={
                  geoContext.fileExtension === "gpx" ? (
                    <FormattedMessage id="export.gpx.subtitle.original" />
                  ) : (
                    <FormattedMessage id="export.convert.hint" />
                  )
                }
                description={<FormattedMessage id="export.gpx.description" />}
                value="gpx"
                checked={format === "gpx"}
                onChange={handleChange}
              />
              <ExportLabel
                label="TCX"
                subtitle={
                  geoContext.fileExtension === "tcx" ? (
                    <FormattedMessage id="export.tcx.subtitle.original" />
                  ) : (
                    <FormattedMessage id="export.convert.hint" />
                  )
                }
                description={<FormattedMessage id="export.tcx.description" />}
                value="tcx"
                checked={format === "tcx"}
                onChange={handleChange}
              />
              <ExportLabel
                label={<FormattedMessage id="export.fit.label" />}
                description={<FormattedMessage id="export.fit.description" />}
                value="fit"
                checked={format === "fit"}
                onChange={handleChange}
              />
              <div className="mt-8">
                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-3 rounded-full bg-primary-container py-4 font-headline text-base font-black uppercase tracking-tight text-on-primary-container transition-all hover:cursor-pointer hover:bg-zinc-900 hover:text-white active:scale-[0.98] sm:text-lg sm:py-5"
                >
                  <FormattedMessage id="export.download" />
                  <span
                    className="material-symbols-outlined transition-transform group-hover:translate-y-[-2px]"
                    data-icon="download"
                  >
                    download
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {error && <ErrorAlert description={<FormattedMessage id={error} />} />}
    </div>
  );
};

export default RouteWorkflowPage;
