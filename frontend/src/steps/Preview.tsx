import { use, useMemo, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { FormattedMessage, useIntl } from "react-intl";
import { GeoJsonContext } from "../context/GeoJsonContext";
import RouteProfile from "../components/RouteProfile";
import TownSignMark from "../components/TownSignMark";
import { useRouteFileDrop } from "../components/useRouteFileDrop";
import { getZoomLevel } from "../utils/getZoomLevel";
import { buildRouteProfile } from "../utils/routeProfile";

interface PreviewProps {
  onContinue: () => void;
  onReplaced: () => void;
}

const RouteEndMarker: React.FC<{ variant: "start" | "finish" }> = ({
  variant,
}) => (
  <span
    aria-hidden="true"
    className={`block h-4 w-4 border-[3px] border-[#1b1b1a] bg-white shadow-[0_1px_4px_rgb(0_0_0/0.35)] ${
      variant === "start" ? "rounded-full" : "rounded-[3px]"
    }`}
  />
);

const Preview: React.FC<PreviewProps> = ({ onContinue, onReplaced }) => {
  const geoContext = use(GeoJsonContext);
  const intl = useIntl();
  const { getRootProps, getInputProps, isDragActive, open } = useRouteFileDrop({
    onParseSuccessful: onReplaced,
  });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const geoJson = geoContext?.geoJson;
  const profile = useMemo(
    () => (geoJson ? buildRouteProfile(geoJson) : null),
    [geoJson],
  );

  if (!geoContext || !geoJson) return null;

  // without a drawable line (single point, waypoints only) the map still
  // shows the file, centred, and the profile and route facts stay hidden
  const start = profile?.coordinates[0];
  const finish = profile?.coordinates.at(-1);
  const active =
    activeIndex == null ? undefined : profile?.coordinates.at(activeIndex);
  const format = (
    geoContext.fileExtension ??
    geoContext.rawFileName?.split(".").pop() ??
    ""
  ).toUpperCase();

  const facts = [
    {
      id: "format",
      label: <FormattedMessage id="preview.file.format" />,
      value: format,
    },
    ...(profile
      ? [
          {
            id: "points",
            label: <FormattedMessage id="preview.file.points" />,
            value: intl.formatNumber(profile.coordinates.length),
          },
          {
            id: "shape",
            label: <FormattedMessage id="preview.file.shape" />,
            value: (
              <FormattedMessage
                id={
                  profile.isLoop ? "preview.shape.loop" : "preview.shape.oneWay"
                }
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 gap-4 [grid-template-areas:'title''map''profile''action''file'] sm:gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_auto_1fr_auto] lg:[grid-template-areas:'title_title''map_file''map_action''profile_profile'] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <header className="min-w-0 [grid-area:title]">
        <h1 className="font-headline text-4xl leading-[1.05] font-black tracking-tighter text-balance break-words text-on-surface uppercase sm:text-5xl xl:text-6xl">
          Route: {geoContext.routeName ?? geoContext.rawFileName}
        </h1>
        <p className="mt-2 font-headline text-sm font-bold tracking-[0.06em] break-all text-secondary uppercase sm:text-base">
          {geoContext.rawFileName}
        </p>
      </header>

      <div className="flex items-end [grid-area:action]">
        <button
          className="group flex w-full items-center justify-center gap-3 rounded-full bg-on-surface px-7 py-4 font-headline text-base font-bold tracking-[0.06em] text-surface uppercase shadow-[0_10px_24px_-12px_rgb(0_0_0/0.5)] transition-[background-color,transform] duration-200 ease-out hover:cursor-pointer hover:bg-on-surface/85 active:scale-[0.98] sm:py-5"
          onClick={onContinue}
          type="button"
        >
          <TownSignMark />
          <FormattedMessage id="preview.action.button" />
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-xl transition-transform duration-200 ease-out group-hover:translate-x-1"
          >
            arrow_forward
          </span>
        </button>
      </div>

      <div className="map-quiet-attribution relative h-[52vh] min-h-[18rem] max-h-[28rem] overflow-hidden rounded-[1.5rem] bg-surface-container shadow-[0_12px_40px_-24px_rgb(0_0_0/0.25)] [grid-area:map] md:rounded-[1.75rem] lg:h-auto lg:min-h-[21rem] lg:max-h-none">
        <Map
          key={
            profile
              ? `${start?.join()}-${profile.coordinates.length}`
              : "no-route-line"
          }
          initialViewState={
            profile
              ? { bounds: profile.bounds, fitBoundsOptions: { padding: 48 } }
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
              paint={{ "line-color": "#1b1b1a", "line-width": 3.5 }}
              type="line"
            />
          </Source>
          {profile && finish && !profile.isLoop && (
            <Marker latitude={finish[1]} longitude={finish[0]}>
              <RouteEndMarker variant="finish" />
            </Marker>
          )}
          {start && (
            <Marker latitude={start[1]} longitude={start[0]}>
              <RouteEndMarker variant="start" />
            </Marker>
          )}
          {active && (
            <Marker latitude={active[1]} longitude={active[0]}>
              <span
                aria-hidden="true"
                className="block h-6 w-6 rounded-full border-4 border-white bg-[#1b1b1a] shadow-[0_2px_8px_rgb(0_0_0/0.4)]"
              />
            </Marker>
          )}
        </Map>
      </div>

      <section
        {...getRootProps({ role: "region" })}
        aria-labelledby="route-file-title"
        className="flex flex-col gap-4 rounded-[1.5rem] bg-surface-container-lowest p-5 shadow-[0_12px_40px_-24px_rgb(0_0_0/0.25)] [grid-area:file] sm:p-6 md:rounded-[1.75rem]"
      >
        <h2
          className="font-headline text-lg font-black tracking-tight uppercase"
          id="route-file-title"
        >
          <FormattedMessage id="preview.file.title" />
        </h2>
        <dl className="flex flex-col">
          {facts.map(({ id, label, value }, index) => (
            <div
              className={`flex items-baseline justify-between gap-4 py-2.5 ${
                index > 0 ? "border-t border-surface-container-high" : ""
              }`}
              key={id}
            >
              <dt className="text-sm text-secondary">{label}</dt>
              <dd className="font-headline text-base font-bold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <input {...getInputProps()} />
        <button
          className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 font-headline text-sm font-bold tracking-[0.08em] text-on-surface uppercase transition-colors duration-150 hover:cursor-pointer hover:bg-surface-container-highest ${
            isDragActive
              ? "bg-surface-container-highest"
              : "bg-surface-container-high"
          }`}
          onClick={open}
          type="button"
        >
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-lg"
          >
            upload_file
          </span>
          <FormattedMessage id="preview.file.replace" />
        </button>
      </section>

      {profile && (
        <div className="min-w-0 [grid-area:profile]">
          <RouteProfile
            activeIndex={activeIndex}
            onActiveIndexChange={setActiveIndex}
            profile={profile}
          />
        </div>
      )}
    </div>
  );
};

export default Preview;
