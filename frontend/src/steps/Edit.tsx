import { use, useState } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import type { Sign, SnapCandidate } from "../../../shared/types";
import { getZoomLevel } from "../utils/getZoomLevel";
import NoSignFound from "../components/NoSignFound";
import {
  getSelectedSnapCandidates,
  isSameSnapCandidate,
  toggleSnapCandidateSelection,
} from "../utils/signRouteSelection";
import { FormattedMessage } from "react-intl";
import MapMarkerIcon from "../components/MapMarkerIcon";

interface EditProps {
  onContinue: () => void;
  onBack: () => void;
}

const formatDistanceAlongRoute = (distanceAlongRoute: number) =>
  `${(distanceAlongRoute / 1000).toFixed(2)} km`;

const Edit: React.FC<EditProps> = (props: EditProps) => {
  const { onContinue, onBack } = props;
  const geoContext = use(GeoJsonContext);
  const [selectedSignId, setSelectedSignId] = useState<Sign["id"] | undefined>(
    undefined,
  );
  const [showHint, setShowHint] = useState(true);
  const [showProceedWarning, setShowProceedWarning] = useState(false);

  if (geoContext?.parseState !== "Done") return null;

  const selectedSign = geoContext.signs?.find(
    (sign) => sign.id === selectedSignId,
  );

  const noSignsFound =
    geoContext?.parseState === "Done" &&
    geoContext.signs &&
    geoContext.signs.length < 1;

  const unresolvedAmbiguousSignsCount = (geoContext.signs ?? []).filter(
    (sign) =>
      sign.snapResult?.status === "ambiguous" &&
      getSelectedSnapCandidates(sign).length === 0,
  ).length;

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

  const handleProceed = () => {
    if (unresolvedAmbiguousSignsCount > 0) {
      setShowProceedWarning(true);
      return;
    }

    onContinue();
  };

  return (
    <>
      <div className="relative flex min-h-[28rem] w-full flex-1 overflow-hidden rounded-[1.5rem] bg-surface-container-low shadow-xl md:min-h-0 md:rounded-[1.75rem]">
        <div className="relative min-h-0 flex-1">
          <Map
            initialViewState={{
              longitude: geoContext.center?.geometry.coordinates[0],
              latitude: geoContext.center?.geometry.coordinates[1],
              zoom: getZoomLevel(geoContext?.geoJson),
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="https://tiles.openfreemap.org/styles/positron"
          >
            {geoContext.geoJson && (
              <Source id="route" type="geojson" data={geoContext.geoJson}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{ "line-color": "#f0ca00", "line-width": 3 }}
                />
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
              </Source>
            )}
            {(geoContext.signs ?? []).map((sign) => (
              <Marker
                key={sign.id}
                latitude={sign.lat}
                longitude={sign.long}
                anchor="bottom"
                onClick={() => setSelectedSignId(sign.id)}
                className="hover:cursor-pointer"
              >
                <MapMarkerIcon
                  style={{
                    ...(sign.snapResult
                      ? sign.snapResult.status === "ok"
                        ? { color: "black" }
                        : { color: "#ba1a1a" }
                      : { color: "black" }),
                  }}
                  className={`transition-transform hover:scale-120 ${selectedSign?.id === sign.id ? "text-error" : ""}`}
                />
              </Marker>
            ))}
            {selectedSign?.snapResult?.status === "ambiguous" &&
              selectedSign.snapResult.candidates.map((candidate, index) => {
                const candidateIsSelected = getSelectedSnapCandidates(
                  selectedSign,
                ).some((position) => isSameSnapCandidate(position, candidate));

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

          {showHint && (
            <div className="absolute top-3 z-10 rounded-2xl bg-black/70 font-body text-white backdrop-sm flex flex-row gap-3 items-center p-2 right-3">
              <p className="text-xs leading-none">
                <FormattedMessage id="edit.hint.title" />
                {": Select markers to review or remove"}
              </p>
              <button
                className="cursor-pointer flex items-center justify-center"
                type="button"
                onClick={() => setShowHint(false)}
              >
                <span className="material-symbols-outlined block">close</span>
              </button>
            </div>
          )}

          {selectedSign && (
            <div className="absolute inset-x-3 bottom-[5.5rem] z-10 max-h-[16rem] overflow-y-auto rounded-[1.5rem] bg-surface-container-lowest p-3.5 shadow-xl sm:inset-x-4 sm:bottom-28 sm:max-h-[60vh] sm:p-5 md:inset-x-auto md:bottom-auto md:right-6 md:top-6 md:w-[22rem] md:max-h-[calc(100%-3rem)] md:rounded-[1.75rem]">
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
                          Select every route pass that should trigger this sign.
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
                          const candidateIsSelected = getSelectedSnapCandidates(
                            selectedSign,
                          ).some((position) =>
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

          <div className="absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[60] sm:inset-x-4 sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-6 md:right-6 md:z-10">
            <button
              onClick={handleProceed}
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

          {showProceedWarning && (
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
                        onContinue();
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
      </div>
      {noSignsFound && <NoSignFound onBack={onBack} onContinue={onContinue} />}
    </>
  );
};

export default Edit;
