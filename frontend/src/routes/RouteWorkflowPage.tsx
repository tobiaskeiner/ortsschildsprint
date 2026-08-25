import { Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { use, useState } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Formats, Sign, SnapCandidate } from "../../../shared/types";
import { FormattedMessage } from "react-intl";
import ChangeFile from "../components/ChangeFile";
import ErrorAlert from "../components/ErrorAlert";
import ExportLabel from "../components/ExportLabel";
import MapMarkerIcon from "../components/MapMarkerIcon";
import NoSignFound from "../components/NoSignFound";
import RouteInfo from "../components/RouteInfo";
import { buildFitFromGeoJson } from "../utils/buildFitFile";
import {
  buildGpx,
  buildGpxFromGeoJson,
  buildTcx,
  buildTcxFromGeoJson,
  downloadFile,
} from "../utils/downloadHelper";
import { getZoomLevel } from "../utils/getZoomLevel";
import {
  getSelectedSnapCandidates,
  isSameSnapCandidate,
  toggleSnapCandidateSelection,
} from "../utils/signRouteSelection";
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

const formatDistanceAlongRoute = (distanceAlongRoute: number) =>
  `${(distanceAlongRoute / 1000).toFixed(2)} km`;

const RouteWorkflowPage: React.FC = () => {
  const geoContext = use(GeoJsonContext);
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const step = getWorkflowStepFromPathname(pathname);
  const [selectedSignId, setSelectedSignId] = useState<Sign["id"] | undefined>(
    undefined,
  );
  const [showHint, setShowHint] = useState(true);
  const [showProceedWarning, setShowProceedWarning] = useState(false);
  const [format, setFormat] = useState<Formats>("gpx");
  const [error, setError] = useState<string | null>(null);
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

  const selectedSign = geoContext.signs?.find(
    (sign) => sign.id === selectedSignId,
  );
  const unresolvedAmbiguousSignsCount = (geoContext.signs ?? []).filter(
    (sign) =>
      sign.snapResult?.status === "ambiguous" &&
      getSelectedSnapCandidates(sign).length === 0,
  ).length;
  const noSignsFound =
    step === "edit" &&
    geoContext.parseState === "Done" &&
    geoContext.signs != null &&
    geoContext.signs.length < 1;

  const handleSelectCandidate = (
    signId: Sign["id"],
    candidate: SnapCandidate,
  ) => {
    geoContext.setSigns(
      geoContext.signs?.map((sign) =>
        sign.id === signId
          ? toggleSnapCandidateSelection(sign, candidate)
          : sign,
      ),
    );
  };

  const handleProceedToExport = () => {
    if (unresolvedAmbiguousSignsCount > 0) {
      setShowProceedWarning(true);
      return;
    }

    navigateTo(WORKFLOW_EXPORT_ROUTE);
  };

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
          const primaryPosition = getSelectedSnapCandidates(sign)[0];
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
          getSelectedSnapCandidates(sign).map((positionOnRoute) => ({
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

  const showWorkflowMarkers = step === "edit" || step === "export";
  const mapHeightClass =
    step === "edit"
      ? "h-[calc(100dvh-10rem)] min-h-[30rem] md:h-[calc(100dvh-8rem)]"
      : "h-[45vh] min-h-[18rem] max-h-[32rem] md:h-[32rem] md:max-h-none xl:h-[38rem]";
  const mapContainerClassName =
    step === "edit"
      ? "relative overflow-hidden rounded-[1.5rem] bg-surface-container-low shadow-xl md:rounded-[1.75rem]"
      : "overflow-hidden rounded-[1.5rem] bg-surface-container-lowest p-2 shadow-lg sm:rounded-[1.75rem] sm:p-3";

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      {step === "preview" ? (
        <div className="relative min-w-0">
          <h1 className="break-words font-headline text-4xl font-black leading-tight tracking-tighter text-on-surface uppercase sm:text-5xl md:text-6xl xl:text-7xl">
            Route: {geoContext.routeName ?? "File parsed."}
          </h1>
          <h2 className="mt-2 break-all font-headline text-sm font-bold tracking-tight text-secondary uppercase sm:text-lg sm:break-words md:text-2xl">
            {geoContext.rawFileName}
          </h2>
        </div>
      ) : step === "export" ? (
        <RouteInfo />
      ) : null}

      <div
        className={`grid grid-cols-1 gap-4 xl:gap-8 ${
          step === "edit" ? "" : "xl:grid-cols-3"
        }`}
      >
        <div className={`min-w-0 ${step !== "edit" ? "xl:col-span-2" : ""}`}>
          <div className={mapContainerClassName}>
            <div className={mapHeightClass}>
              <Map
                initialViewState={{
                  longitude: geoContext.center?.geometry.coordinates[0],
                  latitude: geoContext.center?.geometry.coordinates[1],
                  zoom: getZoomLevel(geoContext.geoJson),
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  ...(step === "edit" ? {} : { borderRadius: 20 }),
                }}
                mapStyle="https://tiles.openfreemap.org/styles/positron"
              >
                <Source id="route" type="geojson" data={geoContext.geoJson}>
                  <Layer
                    id="route-line"
                    type="line"
                    paint={{ "line-color": "#f0ca00", "line-width": 3 }}
                  />
                  {step === "edit" && (
                    <Layer
                      id="route-arrows"
                      type="symbol"
                      layout={{
                        "symbol-placement": "line",
                        "symbol-spacing": 80,
                        "icon-image": "arrow",
                        "icon-size": 3.5,
                        "icon-rotate": 0,
                        "icon-rotation-alignment": "map",
                        "icon-allow-overlap": true,
                        "icon-ignore-placement": true,
                      }}
                    />
                  )}
                </Source>
                {showWorkflowMarkers &&
                  (geoContext.signs ?? []).map((sign) => (
                    <Marker
                      key={sign.id}
                      latitude={sign.lat}
                      longitude={sign.long}
                      anchor="bottom"
                      onClick={
                        step === "edit"
                          ? () => setSelectedSignId(sign.id)
                          : undefined
                      }
                      className={
                        step === "edit" ? "hover:cursor-pointer" : undefined
                      }
                    >
                      <MapMarkerIcon
                        style={{
                          ...(step === "edit" && sign.snapResult
                            ? sign.snapResult.status === "ok"
                              ? { color: "black" }
                              : { color: "#ba1a1a" }
                            : { color: "black" }),
                        }}
                        className={`transition-transform ${
                          step === "edit" ? "hover:scale-120" : ""
                        } ${selectedSign?.id === sign.id ? "text-error" : ""}`}
                      />
                    </Marker>
                  ))}
                {step === "edit" &&
                  selectedSign?.snapResult?.status === "ambiguous" &&
                  selectedSign.snapResult.candidates.map((candidate, index) => {
                    const candidateIsSelected = getSelectedSnapCandidates(
                      selectedSign,
                    ).some((position) =>
                      isSameSnapCandidate(position, candidate),
                    );

                    return (
                      <Marker
                        key={`${selectedSign.id}-${candidate.distanceAlongRoute}`}
                        latitude={candidate.lat}
                        longitude={candidate.long}
                        anchor="center"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectCandidate(selectedSign.id, candidate)
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-headline font-black shadow-lg transition-all hover:scale-105 hover:cursor-pointer ${
                            candidateIsSelected
                              ? "border-primary-container bg-primary-container text-on-primary-container"
                              : "border-surface-container-highest bg-surface-container-lowest text-on-surface"
                          }`}
                        >
                          {index + 1}
                        </button>
                      </Marker>
                    );
                  })}
              </Map>
            </div>

            {step === "edit" && showHint && (
              <div className="absolute right-3 top-3 z-10 flex flex-row items-center gap-3 rounded-2xl bg-black/70 p-2 font-body text-white backdrop-blur-sm">
                <p className="text-xs leading-none">
                  <FormattedMessage id="edit.hint.title" />
                  {": Select markers to review or remove"}
                </p>
                <button
                  className="flex items-center justify-center cursor-pointer"
                  type="button"
                  onClick={() => setShowHint(false)}
                >
                  <span className="material-symbols-outlined block">close</span>
                </button>
              </div>
            )}

            {step === "edit" && selectedSign && (
              <div className="absolute inset-x-3 top-3 z-10 max-h-[45vh] overflow-y-auto rounded-[1.5rem] bg-surface-container-lowest p-3.5 shadow-xl sm:inset-x-4 sm:max-h-[50vh] sm:p-5 md:inset-x-auto md:right-6 md:top-6 md:w-[22rem] md:max-h-[calc(100%-8.5rem)] md:rounded-[1.75rem]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="mb-1 break-words font-headline text-xl font-black leading-none tracking-tight text-on-surface uppercase sm:text-3xl">
                      {selectedSign.tags.name ?? `#${selectedSign.id}`}
                    </h1>
                    <p className="font-headline text-[10px] font-bold tracking-widest text-zinc-500">
                      OSM SIGN ID: #{selectedSign.osm_id}
                    </p>
                  </div>
                  <button
                    className="cursor-pointer p-1 text-on-surface/50 transition-colors hover:text-on-surface"
                    onClick={() => setSelectedSignId(undefined)}
                    type="button"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-3 md:p-4">
                    <div className="mb-1 font-headline text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                      LAT / LONG
                    </div>
                    <div className="font-headline text-xs font-bold leading-tight">
                      {selectedSign.lat.toFixed(4)} /{" "}
                      {selectedSign.long.toFixed(4)}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-surface-container-highest px-4 py-3 font-headline text-xs font-bold uppercase tracking-wider text-on-surface transition-colors hover:cursor-pointer hover:bg-surface-container-high md:py-4 md:text-sm"
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedSign.lat},${selectedSign.long}`}
                      rel="noopener"
                      target="_blank"
                    >
                      <span className="material-symbols-outlined">
                        streetview
                      </span>
                      Street View
                    </a>
                    <button
                      aria-label="Delete sign"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-error-container/50 text-error transition-colors hover:cursor-pointer hover:bg-error-container/90 md:h-14 md:w-14"
                      onClick={() => {
                        geoContext.setSigns(
                          geoContext.signs?.filter(
                            (sign) => sign.id !== selectedSign.id,
                          ),
                        );
                        setSelectedSignId(undefined);
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {selectedSign.snapResult?.status === "ambiguous" && (
                    <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-3 md:p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 font-headline text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                            Route Matches
                          </div>
                          <p className="text-sm leading-snug text-on-surface">
                            Select every route pass that should trigger this
                            sign.
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-surface-container-lowest px-3 py-1 font-headline text-[10px] font-black tracking-widest text-secondary uppercase">
                          {getSelectedSnapCandidates(selectedSign).length}/
                          {selectedSign.snapResult.candidates.length} selected
                        </span>
                      </div>
                      <p className="rounded-xl bg-surface-container-lowest px-3 py-2 text-[11px] leading-snug text-secondary">
                        Multiple selections are preserved in FIT export. GPX and
                        TCX fall back to the first selected route pass.
                      </p>
                      <div className="flex flex-col gap-2">
                        {selectedSign.snapResult.candidates.map(
                          (candidate, index) => {
                            const candidateIsSelected =
                              getSelectedSnapCandidates(selectedSign).some(
                                (position) =>
                                  isSameSnapCandidate(position, candidate),
                              );

                            return (
                              <button
                                key={`${selectedSign.id}-${candidate.distanceAlongRoute}`}
                                type="button"
                                onClick={() =>
                                  handleSelectCandidate(
                                    selectedSign.id,
                                    candidate,
                                  )
                                }
                                className={`group flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-all hover:cursor-pointer ${
                                  candidateIsSelected
                                    ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary/15"
                                    : "bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant/15 hover:bg-surface-container"
                                }`}
                              >
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-headline font-black uppercase transition-all ${
                                    candidateIsSelected
                                      ? "border-on-primary-container bg-on-primary-container text-primary-container"
                                      : "border-secondary text-secondary"
                                  }`}
                                >
                                  {candidateIsSelected ? "ON" : "OFF"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-headline text-sm font-black uppercase tracking-wide">
                                    Route Pass {index + 1}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      candidateIsSelected
                                        ? "text-on-primary-container/80"
                                        : "text-secondary"
                                    }`}
                                  >
                                    {formatDistanceAlongRoute(
                                      candidate.distanceAlongRoute,
                                    )}{" "}
                                    from start
                                  </p>
                                </div>
                                <div
                                  className={`font-headline text-[10px] font-black tracking-widest uppercase ${
                                    candidateIsSelected
                                      ? "text-on-primary-container"
                                      : "text-zinc-400"
                                  }`}
                                >
                                  {candidateIsSelected ? "Included" : "Add"}
                                </div>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "edit" && (
              <div className="absolute inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] sm:inset-x-4 sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-6 md:right-6 md:z-10">
                <button
                  onClick={handleProceedToExport}
                  className="group flex w-full items-center justify-center gap-3 rounded-full bg-zinc-950 px-5 py-3.5 font-headline text-xs font-black uppercase tracking-[0.18em] text-white shadow-lg transition-transform hover:cursor-pointer hover:scale-[1.02] active:scale-95 md:min-w-[18rem] md:px-10 md:py-5 md:text-sm"
                  type="button"
                >
                  <FormattedMessage id="edit.proceed.button" />
                  <span
                    className="material-symbols-outlined text-primary-container transition-transform group-hover:translate-x-2"
                    data-icon="arrow_forward"
                  >
                    arrow_forward
                  </span>
                </button>
              </div>
            )}

            {step === "edit" && showProceedWarning && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-3 sm:p-4">
                <div className="max-h-[calc(100%-1.5rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-surface-container-lowest p-6 shadow-2xl">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-headline text-[10px] font-black tracking-[0.3em] text-error uppercase">
                        <FormattedMessage id="edit.proceed.warning.eyebrow" />
                      </p>
                      <h2 className="mt-2 font-headline text-3xl font-black leading-none text-on-surface uppercase">
                        <FormattedMessage id="edit.proceed.warning.title" />
                      </h2>
                    </div>
                    <p className="text-sm leading-relaxed text-secondary">
                      <FormattedMessage
                        id="edit.proceed.warning.description"
                        values={{ count: unresolvedAmbiguousSignsCount }}
                      />
                    </p>
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setShowProceedWarning(false)}
                        className="rounded-full border border-outline-variant/30 px-5 py-3 font-headline text-sm font-black tracking-widest text-on-surface uppercase transition-colors hover:cursor-pointer hover:bg-surface-container"
                      >
                        <FormattedMessage id="edit.proceed.warning.cancel" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProceedWarning(false);
                          navigateTo(WORKFLOW_EXPORT_ROUTE);
                        }}
                        className="rounded-full bg-zinc-950 px-5 py-3 font-headline text-sm font-black tracking-widest text-white uppercase transition-transform hover:cursor-pointer hover:scale-[1.01] active:scale-95"
                      >
                        <FormattedMessage id="edit.proceed.warning.confirm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {noSignsFound && (
            <NoSignFound
              onBack={() => {
                navigateTo(WORKFLOW_ROUTE);
              }}
              onContinue={() => {
                navigateTo(WORKFLOW_EXPORT_ROUTE);
              }}
            />
          )}
        </div>

        {step !== "edit" && (
          <div className="flex flex-col gap-4 xl:col-span-1 xl:gap-8">
            {step === "preview" && (
              <>
                <div className="order-1 flex flex-col gap-4 rounded-[1.5rem] bg-surface-container-high p-5 sm:rounded-[1.75rem] sm:p-8 xl:order-2 xl:gap-6">
                  <div>
                    <h3 className="mb-2 font-headline text-2xl font-black tracking-tighter uppercase">
                      <FormattedMessage id="preview.action.title" />
                    </h3>
                    <p className="text-sm font-body text-on-surface-variant">
                      <FormattedMessage id="preview.action.description" />
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigateTo(WORKFLOW_EDIT_ROUTE);
                    }}
                    className="group flex w-full items-center justify-center gap-3 rounded-full bg-primary-container py-4 transition-all duration-300 hover:scale-[1.02] hover:bg-primary active:scale-95 sm:gap-4 sm:py-5"
                    type="button"
                  >
                    <span className="font-headline text-lg font-black tracking-tight text-on-primary-container uppercase transition-colors group-hover:text-white sm:text-xl">
                      <FormattedMessage id="preview.action.button" />
                    </span>
                    <span className="material-symbols-outlined font-black text-on-primary-container transition-colors group-hover:text-white">
                      arrow_forward
                    </span>
                  </button>
                </div>
                <div className="order-2 xl:order-1">
                  <ChangeFile
                    onParseSuccessful={() => {
                      navigateTo(WORKFLOW_ROUTE);
                    }}
                  />
                </div>
              </>
            )}

            {step === "export" && (
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
                    description={
                      <FormattedMessage id="export.gpx.description" />
                    }
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
                    description={
                      <FormattedMessage id="export.tcx.description" />
                    }
                    value="tcx"
                    checked={format === "tcx"}
                    onChange={handleChange}
                  />
                  <ExportLabel
                    label={<FormattedMessage id="export.fit.label" />}
                    description={
                      <FormattedMessage id="export.fit.description" />
                    }
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
            )}
          </div>
        )}
      </div>

      {error && <ErrorAlert description={<FormattedMessage id={error} />} />}
    </div>
  );
};

export default RouteWorkflowPage;
