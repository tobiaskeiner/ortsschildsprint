import { use, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { FormattedMessage, useIntl } from "react-intl";
import type { Sign, SnapCandidate } from "../../../shared/types";
import NoSignFound from "../components/NoSignFound";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { getZoomLevel } from "../utils/getZoomLevel";
import { buildRouteProfile } from "../utils/routeProfile";
import {
  getSelectedSnapCandidates,
  isSameSnapCandidate,
  toggleSnapCandidateSelection,
} from "../utils/signRouteSelection";

interface EditProps {
  noSignsFound: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSignDeleted: () => void;
}

// the basemap stays light in both themes, so marker ink is fixed
const MAP_INK = "#1b1b1a";

const ARROW_IMAGE = "route-direction";

/** A white chevron pointing along the line, drawn at 2x for crisp edges. */
const drawArrow = () => {
  const size = 28;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d")!;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(10, 7);
  context.lineTo(18, 14);
  context.lineTo(10, 21);
  context.strokeStyle = MAP_INK;
  context.lineWidth = 7;
  context.stroke();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  context.stroke();
  return context.getImageData(0, 0, size, size);
};

/** Where the rider first meets the sign; fixes its place in the list. */
const firstPassAlongRoute = (sign: Sign) => {
  const result = sign.snapResult;
  if (result?.status === "ok") return result.position.distanceAlongRoute;
  if (result?.status === "ambiguous") {
    return Math.min(...result.candidates.map((c) => c.distanceAlongRoute));
  }
  return sign.positionOnRoute?.distanceAlongRoute ?? Number.POSITIVE_INFINITY;
};

const needsPass = (sign: Sign) =>
  sign.snapResult?.status === "ambiguous" &&
  getSelectedSnapCandidates(sign).length === 0;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const Edit: React.FC<EditProps> = ({
  noSignsFound,
  onBack,
  onContinue,
  onSignDeleted,
}) => {
  const geoContext = use(GeoJsonContext);
  const intl = useIntl();
  const mapRef = useRef<MapRef>(null);
  const rowRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const [selectedSignId, setSelectedSignId] = useState<Sign["id"]>();
  const [showProceedWarning, setShowProceedWarning] = useState(false);
  const [arrowsReady, setArrowsReady] = useState(false);
  const geoJson = geoContext?.geoJson;
  const profile = useMemo(
    () => (geoJson ? buildRouteProfile(geoJson) : null),
    [geoJson],
  );
  const signs = useMemo(
    () =>
      [...(geoContext?.signs ?? [])].sort(
        (a, b) => firstPassAlongRoute(a) - firstPassAlongRoute(b),
      ),
    [geoContext?.signs],
  );

  if (!geoContext || !geoJson) return null;

  const unresolvedCount = signs.filter(needsPass).length;

  const km = (meters: number) =>
    intl.formatNumber(meters / 1000, {
      style: "unit",
      unit: "kilometer",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

  const select = (sign: Sign | undefined) => {
    if (!sign || sign.id === selectedSignId) {
      setSelectedSignId(undefined);
      return;
    }
    setSelectedSignId(sign.id);
    const map = mapRef.current;
    map?.flyTo({
      center: [sign.long, sign.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: prefersReducedMotion() ? 0 : 600,
    });
    requestAnimationFrame(() =>
      rowRefs.current[sign.id]?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        // phones: put the row right under the sticky map
        block: window.matchMedia("(min-width: 1024px)").matches
          ? "nearest"
          : "start",
      }),
    );
  };

  const togglePass = (signId: Sign["id"], candidate: SnapCandidate) => {
    geoContext.setSigns(
      geoContext.signs?.map((sign) =>
        sign.id === signId
          ? toggleSnapCandidateSelection(sign, candidate)
          : sign,
      ),
    );
  };

  const deleteSign = (sign: Sign) => {
    const index = signs.findIndex(({ id }) => id === sign.id);
    const next = signs[index + 1] ?? signs[index - 1];
    geoContext.setSigns(geoContext.signs?.filter(({ id }) => id !== sign.id));
    onSignDeleted();
    // keep the walk-through going: the next sign along the route opens
    select(next && next.id !== sign.id ? next : undefined);
  };

  const proceed = () => {
    if (unresolvedCount > 0) {
      setShowProceedWarning(true);
      return;
    }
    onContinue();
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:h-[calc(100dvh-9rem)] lg:min-h-[36rem]">
      <header className="min-w-0 shrink-0">
        <h1 className="font-headline text-3xl leading-[1.05] font-black tracking-tighter text-balance break-words text-on-surface uppercase sm:text-4xl xl:text-5xl">
          Route: {geoContext.routeName ?? geoContext.rawFileName}
        </h1>
        <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-secondary sm:text-base">
          <FormattedMessage id="edit.intro" />
        </p>
      </header>

      <div className="relative grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        {/* on phones the map sticks; the page-ground band hides rows scrolling under it */}
        <div className="sticky top-[4.25rem] z-10 -mx-3 bg-surface px-3 pt-2 pb-3 sm:-mx-5 sm:px-5 md:top-16 md:-mx-8 md:px-8 md:pt-4 lg:static lg:m-0 lg:flex lg:bg-transparent lg:p-0">
          <div
            className={`map-quiet-attribution ${selectedSignId == null ? "h-[40vh]" : "h-[30vh]"} min-h-[14rem] w-full overflow-hidden rounded-[1.5rem] bg-surface-container shadow-[0_12px_40px_-24px_rgb(0_0_0/0.25)] md:rounded-[1.75rem] lg:h-auto`}
          >
            <Map
              ref={mapRef}
              onLoad={({ target: map }) => {
                // compact attribution opens expanded on load and covers the route
                map
                  .getContainer()
                  .querySelector(".maplibregl-compact-show")
                  ?.classList.remove("maplibregl-compact-show");
                if (!map.hasImage(ARROW_IMAGE)) {
                  map.addImage(ARROW_IMAGE, drawArrow(), { pixelRatio: 2 });
                }
                setArrowsReady(true);
              }}
              initialViewState={
                profile
                  ? {
                      bounds: profile.bounds,
                      fitBoundsOptions: { padding: 48 },
                    }
                  : {
                      longitude: geoContext.center?.geometry.coordinates[0],
                      latitude: geoContext.center?.geometry.coordinates[1],
                      zoom: getZoomLevel(geoJson),
                    }
              }
              attributionControl={{ compact: true }}
              mapStyle="https://tiles.openfreemap.org/styles/positron"
              style={{ width: "100%", height: "100%" }}
            >
              <Source data={geoJson} id="route" type="geojson">
                <Layer
                  id="route-line"
                  layout={{ "line-cap": "round", "line-join": "round" }}
                  paint={{ "line-color": MAP_INK, "line-width": 3.5 }}
                  type="line"
                />
                {arrowsReady && (
                  <Layer
                    id="route-arrows"
                    type="symbol"
                    layout={{
                      "symbol-placement": "line",
                      "symbol-spacing": 90,
                      "icon-image": ARROW_IMAGE,
                      "icon-size": 1,
                      "icon-rotation-alignment": "map",
                      "icon-allow-overlap": true,
                      "icon-ignore-placement": true,
                    }}
                  />
                )}
              </Source>

              {signs.map((sign, index) => {
                const isSelected = sign.id === selectedSignId;
                return (
                  <Marker
                    key={sign.id}
                    latitude={sign.lat}
                    longitude={sign.long}
                    style={{ zIndex: isSelected ? 2 : 1 }}
                  >
                    <button
                      aria-label={sign.tags.name ?? `#${sign.osm_id}`}
                      aria-pressed={isSelected}
                      className={`flex items-center justify-center rounded-full font-headline font-bold tabular-nums shadow-[0_2px_6px_rgb(0_0_0/0.35)] transition-transform duration-150 ease-out hover:scale-110 hover:cursor-pointer ${
                        isSelected
                          ? "h-10 w-10 border-[3px] border-[#1b1b1a] bg-town-sign text-sm text-[#1b1b1a]"
                          : needsPass(sign)
                            ? "h-8 w-8 border-2 border-dashed border-[#1b1b1a] bg-white text-xs text-[#1b1b1a]"
                            : "h-8 w-8 border-2 border-white bg-[#1b1b1a] text-xs text-white"
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        select(sign);
                      }}
                      type="button"
                    >
                      {index + 1}
                    </button>
                  </Marker>
                );
              })}
            </Map>
          </div>
        </div>

        <section
          aria-labelledby="edit-signs-title"
          className="flex min-h-0 flex-col rounded-[1.5rem] bg-surface-container-lowest shadow-[0_12px_40px_-24px_rgb(0_0_0/0.25)] md:rounded-[1.75rem]"
        >
          <h2
            className="shrink-0 border-b border-surface-container-high px-5 py-4 font-headline text-base font-bold tracking-tight uppercase sm:px-6"
            id="edit-signs-title"
          >
            <FormattedMessage
              id="edit.list.title"
              values={{ count: signs.length }}
            />
          </h2>

          <ol className="min-h-0 flex-1 lg:overflow-y-auto">
            {signs.map((sign, index) => {
              const isSelected = sign.id === selectedSignId;
              const result = sign.snapResult;
              const passes =
                result?.status === "ambiguous" ? result.candidates : [];
              const name = sign.tags.name ?? `#${sign.osm_id}`;
              const panelId = `sign-panel-${sign.id}`;

              return (
                <li
                  className={`scroll-mt-[calc(30vh+6rem)] scroll-mb-28 border-b border-surface-container-high transition-colors duration-150 last:border-b-0 lg:scroll-m-0 ${
                    isSelected ? "bg-surface-container-low" : ""
                  }`}
                  key={sign.id}
                  ref={(element) => {
                    rowRefs.current[sign.id] = element;
                  }}
                >
                  <button
                    aria-controls={panelId}
                    aria-expanded={isSelected}
                    className="grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors duration-150 hover:cursor-pointer hover:bg-surface-container-low sm:px-6"
                    onClick={() => select(sign)}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-headline text-xs font-bold tabular-nums ${
                        isSelected
                          ? "border-2 border-[#1b1b1a] bg-town-sign text-[#1b1b1a]"
                          : needsPass(sign)
                            ? "border-2 border-dashed border-on-surface text-on-surface"
                            : "bg-on-surface text-surface"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-headline text-base font-bold uppercase">
                        {name}
                      </span>
                      {needsPass(sign) && !isSelected && (
                        <span className="block text-xs text-secondary">
                          <FormattedMessage id="edit.pass.needed" />
                        </span>
                      )}
                    </span>
                    <span className="font-headline text-sm font-bold whitespace-nowrap text-secondary tabular-nums">
                      {passes.length > 1
                        ? passes
                            .map((pass) => km(pass.distanceAlongRoute))
                            .join(" · ")
                        : km(firstPassAlongRoute(sign))}
                    </span>
                  </button>

                  {isSelected && (
                    <div
                      className="flex flex-col gap-4 px-5 pb-4 sm:px-6 sm:pl-[4.25rem]"
                      id={panelId}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <a
                          className="flex items-center justify-center gap-2 rounded-full bg-surface-container-high px-4 py-3 whitespace-nowrap font-headline text-xs font-bold tracking-[0.06em] text-on-surface uppercase transition-colors duration-150 hover:bg-surface-container-highest"
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${sign.lat},${sign.long}`}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-lg"
                          >
                            streetview
                          </span>
                          Street View
                        </a>
                        <button
                          className="flex items-center justify-center gap-2 rounded-full px-4 py-3 whitespace-nowrap font-headline text-xs font-bold tracking-[0.06em] text-on-surface uppercase ring-1 ring-outline-variant transition-colors duration-150 hover:cursor-pointer hover:bg-surface-container-high"
                          onClick={() => deleteSign(sign)}
                          type="button"
                        >
                          <span
                            aria-hidden="true"
                            className="material-symbols-outlined text-lg"
                          >
                            delete
                          </span>
                          <FormattedMessage id="edit.sign.delete" />
                        </button>
                      </div>
                      {passes.length > 1 && (
                        <fieldset>
                          <legend className="mb-2 text-sm leading-snug text-on-surface">
                            <FormattedMessage id="edit.pass.question" />
                          </legend>
                          <div className="grid grid-cols-2 gap-2">
                            {passes.map((candidate, passIndex) => {
                              const chosen = getSelectedSnapCandidates(
                                sign,
                              ).some((position) =>
                                isSameSnapCandidate(position, candidate),
                              );
                              return (
                                <label
                                  className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-colors duration-150 hover:cursor-pointer ${
                                    chosen
                                      ? "bg-on-surface text-surface"
                                      : "bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant hover:bg-surface-container"
                                  }`}
                                  key={candidate.distanceAlongRoute}
                                >
                                  <input
                                    checked={chosen}
                                    className="h-4 w-4 shrink-0 accent-town-sign"
                                    onChange={() =>
                                      togglePass(sign.id, candidate)
                                    }
                                    type="checkbox"
                                  />
                                  <span className="min-w-0 leading-tight">
                                    <span className="block font-headline text-xs font-bold uppercase">
                                      <FormattedMessage
                                        id="edit.pass.label"
                                        values={{ number: passIndex + 1 }}
                                      />
                                    </span>
                                    <span className="block font-headline text-sm font-bold tabular-nums">
                                      {km(candidate.distanceAlongRoute)}
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs leading-snug text-secondary">
                            <FormattedMessage id="edit.pass.formats" />
                          </p>
                        </fieldset>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {/* phones: the pill stops floating while a sign is open, so its passes stay visible */}
          <div
            className={`z-10 shrink-0 p-3 sm:p-4 lg:static lg:border-t lg:border-surface-container-high ${
              selectedSignId == null
                ? "sticky bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-4"
                : ""
            }`}
          >
            <button
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-on-surface px-7 py-4 font-headline text-sm font-bold tracking-[0.08em] text-surface uppercase shadow-[0_10px_24px_-12px_rgb(0_0_0/0.5)] transition-[background-color,transform] duration-200 ease-out hover:cursor-pointer hover:bg-on-surface/85 active:scale-[0.98] sm:text-base"
              onClick={proceed}
              type="button"
            >
              <FormattedMessage id="edit.proceed.button" />
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-xl transition-transform duration-200 ease-out group-hover:translate-x-1"
              >
                arrow_forward
              </span>
            </button>
          </div>
        </section>

        {noSignsFound && (
          <div className="fixed inset-0 z-[70]">
            <NoSignFound onBack={onBack} onContinue={onContinue} />
          </div>
        )}
      </div>

      {showProceedWarning && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowProceedWarning(false);
          }}
        >
          <div
            aria-labelledby="edit-warning-title"
            aria-modal="true"
            className="w-full max-w-md rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)] sm:p-8"
            role="dialog"
          >
            <h2
              className="font-headline text-2xl leading-tight font-black tracking-tight text-on-surface uppercase sm:text-3xl"
              id="edit-warning-title"
            >
              <FormattedMessage id="edit.proceed.warning.title" />
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-secondary">
              <FormattedMessage
                id="edit.proceed.warning.description"
                values={{ count: unresolvedCount }}
              />
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                autoFocus
                className="rounded-full px-5 py-3 font-headline text-sm font-bold tracking-[0.06em] text-on-surface uppercase ring-1 ring-outline-variant transition-colors duration-150 hover:cursor-pointer hover:bg-surface-container"
                onClick={() => setShowProceedWarning(false)}
                type="button"
              >
                <FormattedMessage id="edit.proceed.warning.cancel" />
              </button>
              <button
                className="rounded-full bg-on-surface px-5 py-3 font-headline text-sm font-bold tracking-[0.06em] text-surface uppercase transition-colors duration-150 hover:cursor-pointer hover:bg-on-surface/85"
                onClick={() => {
                  setShowProceedWarning(false);
                  onContinue();
                }}
                type="button"
              >
                <FormattedMessage id="edit.proceed.warning.confirm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Edit;
