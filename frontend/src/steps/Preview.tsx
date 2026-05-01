import { use } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { getZoomLevel } from "../utils/getZoomLevel";
import ChangeFile from "../components/ChangeFile";
import { FormattedMessage } from "react-intl";

interface PreviewProps {
  onContinue: () => void;
}

const Preview: React.FC<PreviewProps> = (props) => {
  const { onContinue } = props;
  const geoContext = use(GeoJsonContext);
  if (!geoContext) return;

  const mapHeightClass =
    "h-[45vh] min-h-[18rem] max-h-[32rem] md:h-[32rem] md:max-h-none";

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <div className="min-w-0">
        <h1 className="break-words font-headline text-4xl font-black leading-tight tracking-tighter text-on-surface uppercase sm:text-5xl md:text-6xl xl:text-7xl">
          Route: {geoContext.routeName ?? "File parsed."}
        </h1>
        <h2 className="mt-2 break-all font-headline text-sm font-bold tracking-tight text-secondary uppercase sm:text-lg sm:break-words md:text-2xl">
          {geoContext.rawFileName}
        </h2>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-8">
        <div className="xl:col-span-2">
          <div className="overflow-hidden rounded-[1.5rem] bg-surface-container-lowest p-2 shadow-lg sm:rounded-[1.75rem] sm:p-3">
            {geoContext.parseState === "inProgress" ? (
              <div
                className={`${mapHeightClass} flex items-center justify-center rounded-[1.25rem] bg-surface-container`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary-container border-t-primary rounded-full animate-spin"></div>
                  <p className="text-secondary font-medium">
                    Processing file...
                  </p>
                </div>
              </div>
            ) : (
              <div className={mapHeightClass}>
                <Map
                  initialViewState={{
                    longitude: geoContext?.center?.geometry.coordinates[0],
                    latitude: geoContext?.center?.geometry.coordinates[1],
                    zoom: getZoomLevel(geoContext?.geoJson),
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 20,
                  }}
                  mapStyle="https://tiles.openfreemap.org/styles/positron"
                >
                  {geoContext?.geoJson && (
                    <Source
                      id="route"
                      type="geojson"
                      data={geoContext?.geoJson}
                    >
                      <Layer
                        id="route-line"
                        type="line"
                        paint={{ "line-color": "#f0ca00", "line-width": 3 }}
                      />
                    </Source>
                  )}
                </Map>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 xl:col-span-1 xl:gap-8">
          <div className="order-1 flex flex-col gap-4 rounded-[1.5rem] bg-surface-container-high p-5 sm:rounded-[1.75rem] sm:p-8 xl:order-2 xl:gap-6">
            <div>
              <h3 className="mb-2 font-headline text-2xl font-black tracking-tighter uppercase">
                <FormattedMessage id="preview.action.title" />
              </h3>
              <p className="text-on-surface-variant text-sm font-body">
                <FormattedMessage id="preview.action.description" />
              </p>
            </div>
            <button
              onClick={onContinue}
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-primary-container py-4 transition-all duration-300 hover:scale-[1.02] hover:bg-primary active:scale-95 sm:gap-4 sm:py-5"
            >
              <span className="font-headline text-lg font-black tracking-tight text-on-primary-container uppercase transition-colors group-hover:text-white sm:text-xl">
                <FormattedMessage id="preview.action.button" />
              </span>
              <span className="material-symbols-outlined font-black text-on-primary-container group-hover:text-white transition-colors">
                arrow_forward
              </span>
            </button>
          </div>
          <div className="order-2 xl:order-1">
            <ChangeFile />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Preview;
