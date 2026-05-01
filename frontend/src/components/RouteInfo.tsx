import { use } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { FormattedMessage } from "react-intl";

const RouteInfo: React.FC = () => {
  const geoContext = use(GeoJsonContext);

  if (!geoContext?.geoJson) return;
  const hasSigns = !!geoContext.signs;

  return (
    <div className="flex flex-col gap-3 md:gap-6">
      <h1 className="break-words font-headline text-2xl font-black leading-tight tracking-tighter text-on-surface uppercase sm:text-4xl md:text-6xl xl:text-7xl">
        Route: {geoContext.routeName ?? "Route01"}
      </h1>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 xl:grid-cols-3">
        <div className="rounded-[1rem] bg-surface-container-lowest p-3 shadow-lg sm:rounded-[1.5rem] sm:p-6">
          <p className="mb-1 font-headline text-[10px] font-bold tracking-[0.12em] text-secondary uppercase sm:mb-2 sm:text-xs">
            <FormattedMessage id="info.distance" />
          </p>
          <p className="font-headline text-lg font-bold uppercase sm:text-4xl xl:text-5xl">
            {geoContext.routeLength?.toFixed(2)} KM
          </p>
        </div>
        <div className="rounded-[1rem] bg-surface-container-lowest p-3 shadow-lg sm:rounded-[1.5rem] sm:p-6">
          <p className="mb-1 font-headline text-[10px] font-bold tracking-[0.12em] text-secondary uppercase sm:mb-2 sm:text-xs">
            <FormattedMessage id="info.points" />
          </p>
          <p className="font-headline text-lg font-bold uppercase sm:text-4xl xl:text-5xl">
            {hasSigns ? (
              geoContext.signs?.length
            ) : (
              <FormattedMessage id="info.noSign" />
            )}
          </p>
        </div>
        <div className="rounded-[1rem] bg-surface-container-lowest p-3 shadow-lg sm:rounded-[1.5rem] sm:p-6">
          <p className="mb-1 font-headline text-[10px] font-bold tracking-[0.12em] text-secondary uppercase sm:mb-2 sm:text-xs">
            Status
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="h-3 w-3 rounded-full bg-tertiary-container animate-pulse sm:h-4 sm:w-4"></span>
            <p className="font-headline text-lg font-bold text-tertiary uppercase animate-pulse sm:text-4xl xl:text-5xl">
              <FormattedMessage id="info.status" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteInfo;
