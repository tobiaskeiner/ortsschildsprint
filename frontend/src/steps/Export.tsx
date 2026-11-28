import { use, useMemo, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { FormattedMessage, useIntl } from "react-intl";
import type { Formats, Sign } from "../../../shared/types";
import ErrorAlert from "../components/ErrorAlert";
import TownSignMark from "../components/TownSignMark";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { buildFitFromGeoJson } from "../utils/buildFitFile";
import {
  buildGpx,
  buildGpxFromGeoJson,
  buildTcx,
  buildTcxFromGeoJson,
  downloadFile,
} from "../utils/downloadHelper";
import { getZoomLevel } from "../utils/getZoomLevel";
import { buildRouteProfile } from "../utils/routeProfile";
import {
  firstPassAlongRoute,
  getExportSnapCandidates,
} from "../utils/signRouteSelection";

interface ExportProps {
  onBack: () => void;
  onUploadNew: () => void;
}

type ResolvedSign = Sign & {
  positionOnRoute: NonNullable<Sign["positionOnRoute"]>;
};

// FIT first: it keeps every chosen pass, so it is the recommended default
const FORMATS: Formats[] = ["fit", "gpx", "tcx"];

// the basemap stays light in both themes, so marker ink is fixed
const MAP_INK = "#1b1b1a";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.startsWith("error.export.")) {
    return error.message;
  }

  return "error.export.generic";
};

const panelClass =
  "rounded-[1.5rem] bg-surface-container-lowest shadow-[0_12px_40px_-24px_rgb(0_0_0/0.25)] md:rounded-[1.75rem]";

const Export: React.FC<ExportProps> = ({ onBack, onUploadNew }) => {
  const geoContext = use(GeoJsonContext);
  const intl = useIntl();
  const [format, setFormat] = useState<Formats>("fit");
  const [error, setError] = useState<string | null>(null);
  const geoJson = geoContext?.geoJson;
  const profile = useMemo(
    () => (geoJson ? buildRouteProfile(geoJson) : null),
    [geoJson],
  );
  // what the file holds: every sign the route passes, in route order
  const included = useMemo(
    () =>
      [...(geoContext?.signs ?? [])]
        .map((sign) => ({ sign, passes: getExportSnapCandidates(sign) }))
        .filter(({ passes }) => passes.length > 0)
        .sort(
          (a, b) => firstPassAlongRoute(a.sign) - firstPassAlongRoute(b.sign),
        ),
    [geoContext?.signs],
  );

  if (!geoContext || !geoJson) return null;

  const keepsEveryPass = format === "fit";
  const waypointCount = keepsEveryPass
    ? included.reduce((sum, { passes }) => sum + passes.length, 0)
    : included.length;
  const routeName = geoContext.routeName ?? "enriched_route";
  const sourceExtension = geoContext.fileExtension;
  // GPX and TCX enrich an uploaded file of the same type; FIT is always rebuilt
  const keepsOriginal = format !== "fit" && sourceExtension === format;
  const isEmpty = included.length === 0;
  const passedTwiceCount = included.filter(
    ({ passes }) => passes.length > 1,
  ).length;

  const km = (meters: number) =>
    intl.formatNumber(meters / 1000, {
      style: "unit",
      unit: "kilometer",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

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

  const facts = [
    {
      id: "waypoints",
      label: <FormattedMessage id="export.file.waypoints" />,
      value: intl.formatNumber(waypointCount),
    },
    {
      id: "signs",
      label: <FormattedMessage id="export.file.signs" />,
      value: intl.formatNumber(included.length),
    },
    ...(geoContext.routeLength != null
      ? [
          {
            id: "distance",
            label: <FormattedMessage id="export.file.distance" />,
            value: km(geoContext.routeLength * 1000),
          },
        ]
      : []),
  ];

  const downloadButton = (
    <button
      className="group flex w-full items-center justify-center gap-3 rounded-full bg-on-surface px-7 py-4 font-headline text-sm font-bold tracking-[0.08em] text-surface uppercase shadow-[0_10px_24px_-12px_rgb(0_0_0/0.5)] transition-[background-color,transform] duration-200 ease-out hover:cursor-pointer hover:bg-on-surface/85 active:scale-[0.98] sm:py-5 sm:text-base"
      form="export-form"
      type="submit"
    >
      <TownSignMark />
      <FormattedMessage id="export.download" values={{ ext: format }} />
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-xl transition-transform duration-200 ease-out group-hover:translate-y-0.5"
      >
        download
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:max-h-[max(38rem,calc(100dvh-9rem))]">
      <header className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="font-headline text-3xl leading-[1.05] font-black tracking-tighter text-balance break-words text-on-surface uppercase sm:text-4xl xl:text-5xl">
            Route: {geoContext.routeName ?? geoContext.rawFileName}
          </h1>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-secondary sm:text-base">
            <FormattedMessage
              id="export.intro"
              values={{ count: included.length }}
            />
          </p>
        </div>
        <button
          className="flex shrink-0 items-center gap-2 self-start rounded-full px-5 py-3 font-headline text-xs font-bold tracking-[0.08em] whitespace-nowrap text-on-surface uppercase ring-1 ring-outline-variant transition-colors duration-150 hover:cursor-pointer hover:bg-surface-container sm:self-auto sm:text-sm"
          onClick={onBack}
          type="button"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined -scale-x-100 text-lg"
          >
            arrow_forward
          </span>
          <FormattedMessage id="export.back" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-6">
        <section
          aria-labelledby="export-file-name"
          className={`${panelClass} grid min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[14rem_minmax(0,1fr)] lg:min-h-[26rem] xl:grid-cols-[17rem_minmax(0,1fr)]`}
        >
          <div className="map-quiet-attribution h-60 bg-surface-container sm:h-64 md:h-auto">
            <Map
              attributionControl={{ compact: true }}
              initialViewState={
                profile
                  ? {
                      bounds: profile.bounds,
                      fitBoundsOptions: { padding: 24 },
                    }
                  : {
                      longitude: geoContext.center?.geometry.coordinates[0],
                      latitude: geoContext.center?.geometry.coordinates[1],
                      zoom: getZoomLevel(geoJson),
                    }
              }
              interactive={false}
              mapStyle="https://tiles.openfreemap.org/styles/positron"
              onLoad={({ target: map }) => {
                // compact attribution opens expanded on load and covers the route
                map
                  .getContainer()
                  .querySelector(".maplibregl-compact-show")
                  ?.classList.remove("maplibregl-compact-show");
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <Source data={geoJson} id="route" type="geojson">
                <Layer
                  id="route-line"
                  layout={{ "line-cap": "round", "line-join": "round" }}
                  paint={{ "line-color": MAP_INK, "line-width": 3 }}
                  type="line"
                />
              </Source>
              {included.map(({ sign }, index) => (
                <Marker key={sign.id} latitude={sign.lat} longitude={sign.long}>
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#1b1b1a] font-headline text-xs font-bold text-white tabular-nums shadow-[0_2px_6px_rgb(0_0_0/0.35)]"
                  >
                    {index + 1}
                  </span>
                </Marker>
              ))}
            </Map>
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="shrink-0 border-b border-surface-container-high px-5 pt-5 pb-4 sm:px-7 sm:pt-7 sm:pb-5">
              <h2
                className="font-headline text-2xl leading-[1.1] font-black tracking-tight break-words text-on-surface sm:text-3xl"
                id="export-file-name"
              >
                {routeName}
                <span
                  className={`export-ext ml-1 inline-block rounded-[0.5rem] px-2 align-[0.1em] text-[0.8em] lowercase ${
                    isEmpty
                      ? "text-outline ring-1 ring-outline-variant"
                      : "bg-on-surface text-surface"
                  }`}
                  key={format}
                >
                  .{format}
                </span>
              </h2>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
                {facts.map(({ id, label, value }) => (
                  <div key={id}>
                    <dt className="font-headline text-xs font-bold tracking-[0.12em] text-secondary uppercase">
                      {label}
                    </dt>
                    <dd
                      className="export-ext font-headline text-xl font-bold tracking-tight tabular-nums sm:text-2xl"
                      key={id === "waypoints" ? format : id}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {isEmpty ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-2 px-5 py-8 sm:px-7">
                <h3 className="font-headline text-lg font-bold tracking-tight uppercase">
                  <FormattedMessage id="export.empty.title" />
                </h3>
                <p className="max-w-[52ch] text-sm leading-relaxed text-secondary">
                  <FormattedMessage id="export.empty.description" />
                </p>
              </div>
            ) : (
              <ol
                aria-label={intl.formatMessage({ id: "export.file.list" })}
                className="min-h-0 flex-1 px-5 py-2 sm:px-7 lg:overflow-y-auto"
              >
                {included.map(({ sign, passes }, index) => {
                  const kept = keepsEveryPass ? passes : passes.slice(0, 1);
                  const dropped = keepsEveryPass ? [] : passes.slice(1);
                  return (
                    <li
                      className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-surface-container-high py-2.5 last:border-b-0"
                      key={sign.id}
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-on-surface font-headline text-xs font-bold text-surface tabular-nums"
                      >
                        {index + 1}
                      </span>
                      <span className="truncate font-headline text-sm font-bold uppercase sm:text-base">
                        {sign.tags.name ?? `#${sign.osm_id}`}
                      </span>
                      <span className="text-right font-headline text-sm font-bold whitespace-nowrap text-secondary tabular-nums">
                        {kept
                          .map((pass) => km(pass.distanceAlongRoute))
                          .join(" · ")}
                        {dropped.map((pass) => (
                          <span
                            className="text-outline"
                            key={pass.distanceAlongRoute}
                          >
                            {" · "}
                            <del className="decoration-1">
                              {km(pass.distanceAlongRoute)}
                              <span className="sr-only">
                                {" "}
                                <FormattedMessage id="export.pass.dropped" />
                              </span>
                            </del>
                          </span>
                        ))}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </section>

        <section
          className={`${panelClass} flex flex-col gap-5 p-5 sm:p-7 lg:self-start ${isEmpty ? "order-first lg:order-none" : ""}`}
        >
          {isEmpty ? (
            <>
              <p className="text-sm leading-relaxed text-secondary">
                <FormattedMessage id="export.empty.hint" />
              </p>
              <button
                className="flex w-full items-center justify-center gap-3 rounded-full bg-on-surface px-7 py-4 font-headline text-sm font-bold tracking-[0.08em] text-surface uppercase transition-[background-color,transform] duration-200 ease-out hover:cursor-pointer hover:bg-on-surface/85 active:scale-[0.98] sm:text-base"
                onClick={onUploadNew}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-xl"
                >
                  upload_file
                </span>
                <FormattedMessage id="export.empty.action" />
              </button>
            </>
          ) : (
            <form
              className="flex flex-1 flex-col gap-5"
              id="export-form"
              onSubmit={(event) => {
                event.preventDefault();
                onDownload(format);
              }}
            >
              <fieldset className="flex flex-col gap-4">
                <legend className="mb-4 font-headline text-lg font-black tracking-tight uppercase">
                  <FormattedMessage id="export.format.title" />
                </legend>
                <div>
                  <div className="grid grid-cols-3 gap-1 rounded-full bg-surface-container p-1.5">
                    {FORMATS.map((value) => (
                      <label
                        className={`relative rounded-full py-3 text-center font-headline text-base font-bold tracking-[0.08em] uppercase transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-town-sign sm:text-lg ${
                          format === value
                            ? "bg-on-surface text-surface"
                            : "text-on-surface hover:cursor-pointer hover:bg-surface-container-highest"
                        }`}
                        key={value}
                      >
                        <input
                          checked={format === value}
                          className="absolute inset-0 m-0 cursor-pointer appearance-none rounded-full opacity-0"
                          name="format"
                          onChange={() => setFormat(value)}
                          type="radio"
                          value={value}
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 grid grid-cols-3 px-1.5 text-center font-headline text-xs font-bold tracking-[0.08em] text-secondary uppercase">
                    <span>
                      <FormattedMessage id="export.format.recommended" />
                    </span>
                  </p>
                </div>
                <div aria-live="polite">
                  <p className="font-headline text-base font-bold tracking-tight">
                    <FormattedMessage id={`export.format.${format}.title`} />
                  </p>
                  <p className="mt-1 max-w-[60ch] text-sm leading-relaxed text-on-surface-variant">
                    <FormattedMessage
                      id={`export.format.${format}.description`}
                    />
                  </p>
                  {sourceExtension && (
                    <p className="mt-3 border-t border-surface-container-high pt-3 text-sm leading-snug text-secondary">
                      <FormattedMessage
                        id={
                          keepsOriginal
                            ? "export.source.original"
                            : "export.source.converted"
                        }
                        values={{ ext: sourceExtension }}
                      />
                    </p>
                  )}
                </div>
              </fieldset>

              {passedTwiceCount > 0 && (
                <dl className="flex flex-col rounded-[1rem] bg-surface-container-low px-4">
                  <div className="flex items-baseline justify-between gap-4 py-3">
                    <dt className="text-sm text-secondary">
                      <FormattedMessage id="export.facts.twice" />
                    </dt>
                    <dd className="font-headline text-base font-bold tabular-nums">
                      {intl.formatNumber(passedTwiceCount)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-t border-surface-container-high py-3">
                    <dt className="text-sm text-secondary">
                      <FormattedMessage id="export.facts.passes" />
                    </dt>
                    <dd
                      className="export-ext text-right font-headline text-base font-bold"
                      key={format}
                    >
                      <FormattedMessage
                        id={
                          keepsEveryPass
                            ? "export.facts.passes.all"
                            : "export.facts.passes.first"
                        }
                      />
                    </dd>
                  </div>
                </dl>
              )}

              {error && (
                <ErrorAlert description={<FormattedMessage id={error} />} />
              )}

              <div className="hidden pt-1 lg:block">{downloadButton}</div>
            </form>
          )}
        </section>
      </div>

      {/* phones and tablets: the pill floats above the bottom nav while the file scrolls */}
      {!isEmpty && (
        <div className="sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-10 md:bottom-4 lg:hidden">
          {downloadButton}
        </div>
      )}
    </div>
  );
};

export default Export;
