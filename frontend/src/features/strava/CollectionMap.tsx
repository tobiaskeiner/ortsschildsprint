import { useMemo, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import { FormattedMessage, useIntl } from "react-intl";
import { LocalIcon, type LocalIconName } from "../../components/LocalIcon";
import MapMarkerIcon from "../../components/MapMarkerIcon";
import type { StravaDashboard } from "./types";

interface CollectionMapProps {
  signs: StravaDashboard["signs"];
}

export const CollectionMap = ({ signs }: CollectionMapProps) => {
  const intl = useIntl();
  const [mapView, setMapView] = useState<"signposts" | "heatmap" | "dots">(
    "dots",
  );
  const [selectedSignOsmId, setSelectedSignOsmId] = useState<number>();
  const defaultSignName = intl.formatMessage({ id: "strava.map.defaultSign" });
  const signGeoJson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: signs.map((sign) => ({
        type: "Feature" as const,
        properties: { name: sign.tags.name ?? defaultSignName },
        geometry: {
          type: "Point" as const,
          coordinates: [sign.long, sign.lat],
        },
      })),
    }),
    [defaultSignName, signs],
  );
  const firstSign = signs[0];
  const selectedSign = signs.find((sign) => sign.osm_id === selectedSignOsmId);
  if (!firstSign) {
    return (
      <section className="rounded-[1.75rem] border border-outline-variant/55 bg-surface-container-low p-8 shadow-sm">
        <p className="font-headline text-xs font-black tracking-[0.18em] text-secondary uppercase">
          <FormattedMessage id="strava.map.title" />
        </p>
        <p className="mt-3 text-secondary">
          <FormattedMessage id="strava.map.empty" />
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-outline-variant/55 bg-surface-container-low shadow-[0_1.25rem_3rem_rgb(6_15_30/0.1)]">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="font-headline text-xs font-black tracking-[0.18em] text-secondary uppercase">
            <FormattedMessage id="strava.map.title" />
          </p>
          <h2 className="mt-2 font-headline text-2xl font-black text-on-surface">
            <FormattedMessage id="strava.map.heading" />
          </h2>
          <p className="mt-1 text-sm text-secondary">
            <FormattedMessage id="strava.map.description" />
          </p>
        </div>
        <div
          aria-label={intl.formatMessage({ id: "strava.map.view" })}
          className="flex w-fit flex-wrap gap-1 rounded-[1rem] border border-outline-variant/45 bg-surface-container-high p-1"
          role="group"
        >
          {[
            {
              id: "signposts",
              labelId: "strava.map.view.signposts",
              icon: "pin",
            },
            {
              id: "heatmap",
              labelId: "strava.map.view.heatmap",
              icon: "heatmap",
            },
            { id: "dots", labelId: "strava.map.view.dots", icon: "dots" },
          ].map(({ id, icon, labelId }) => {
            const isSelected = mapView === id;
            return (
              <button
                aria-pressed={isSelected}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 font-headline text-xs font-black transition-[background-color,color,box-shadow] hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
                  isSelected
                    ? "bg-on-surface text-surface shadow-[0_0.35rem_1rem_rgb(0_0_0/0.22)]"
                    : "text-secondary hover:bg-surface-container-lowest/60 hover:text-on-surface"
                }`}
                key={id}
                onClick={() =>
                  setMapView(id as "signposts" | "heatmap" | "dots")
                }
                type="button"
              >
                <LocalIcon name={icon as LocalIconName} size={16} />
                <FormattedMessage id={labelId} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative h-[34rem]">
        <Map
          initialViewState={{
            longitude: firstSign.long,
            latitude: firstSign.lat,
            zoom: 7,
          }}
          mapStyle="https://tiles.openfreemap.org/styles/positron"
          style={{ height: "100%", width: "100%" }}
        >
          {mapView === "signposts" &&
            signs.map((sign) => (
              <Marker
                key={sign.osm_id}
                latitude={sign.lat}
                longitude={sign.long}
                anchor="bottom"
                className="hover:cursor-pointer"
                onClick={() => setSelectedSignOsmId(sign.osm_id)}
              >
                <MapMarkerIcon
                  className={`text-town-sign transition-transform hover:scale-120 ${
                    selectedSign?.osm_id === sign.osm_id ? "text-[#c5a600]" : ""
                  }`}
                />
              </Marker>
            ))}
          {mapView === "heatmap" && (
            <Source data={signGeoJson} id="collected-signs" type="geojson">
              <Layer
                id="collected-sign-heat"
                type="heatmap"
                paint={{
                  "heatmap-color": [
                    "interpolate",
                    ["linear"],
                    ["heatmap-density"],
                    0,
                    "rgba(28, 28, 28, 0)",
                    0.2,
                    "#b5b5b0",
                    0.55,
                    "#777772",
                    0.82,
                    "#3f3f3d",
                    0.94,
                    "#252524",
                    1,
                    "#111111",
                  ],
                  "heatmap-intensity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    1,
                    12,
                    3,
                  ],
                  "heatmap-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    16,
                    12,
                    42,
                  ],
                  "heatmap-opacity": 0.88,
                }}
              />
            </Source>
          )}
          {mapView === "dots" && (
            <Source data={signGeoJson} id="collected-signs" type="geojson">
              <Layer
                id="collected-sign-dots"
                type="circle"
                paint={{
                  "circle-color": "#f0cf20",
                  "circle-opacity": 0.82,
                  "circle-radius": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    0,
                    3,
                    12,
                    8,
                  ],
                  "circle-stroke-color": "#202020",
                  "circle-stroke-width": 2,
                }}
              />
            </Source>
          )}
        </Map>

        {selectedSign && (
          <div className="absolute inset-x-3 top-3 z-10 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-[1.5rem] border border-outline-variant/55 bg-surface-container-lowest p-3.5 shadow-xl sm:inset-x-4 sm:max-h-[calc(100%-2rem)] sm:p-5 md:inset-x-auto md:right-6 md:top-6 md:w-[22rem] md:max-h-[calc(100%-3rem)] md:rounded-[1.75rem]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="mb-1 break-words font-headline text-xl font-black leading-none tracking-tight text-on-surface uppercase sm:text-3xl">
                  {selectedSign.tags.name ?? `#${selectedSign.osm_id}`}
                </h3>
                <p className="font-headline text-[10px] font-bold tracking-widest text-zinc-500">
                  <FormattedMessage id="strava.map.signId" />: #
                  {selectedSign.osm_id}
                </p>
              </div>
              <button
                aria-label={intl.formatMessage({ id: "strava.map.closeSign" })}
                className="cursor-pointer p-1 text-on-surface/50 transition-colors hover:text-on-surface"
                onClick={() => setSelectedSignOsmId(undefined)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-low p-3 md:p-4">
                <div className="mb-1 font-headline text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  <FormattedMessage id="strava.map.coordinates" />
                </div>
                <div className="font-headline text-xs font-bold leading-tight">
                  {selectedSign.lat.toFixed(4)} / {selectedSign.long.toFixed(4)}
                </div>
              </div>

              <a
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary-container px-4 py-3 font-headline text-xs font-bold uppercase tracking-wider text-on-primary-container transition-colors hover:cursor-pointer hover:bg-primary hover:text-white md:py-4 md:text-sm"
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedSign.lat},${selectedSign.long}`}
                rel="noopener"
                target="_blank"
              >
                <span className="material-symbols-outlined">streetview</span>
                <FormattedMessage id="strava.map.streetView" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
