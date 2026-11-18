import { FormattedMessage, useIntl } from "react-intl";
import type { StravaDashboard } from "./types";

interface CollectionStatsProps {
  asOf: string;
  collectedSigns: number;
  processedActivities: number;
  totalRides: number | null;
  collection: StravaDashboard["collection"];
  signs: StravaDashboard["signs"];
}

export const CollectionStats = ({
  asOf,
  collectedSigns,
  processedActivities,
  totalRides,
  collection,
  signs,
}: CollectionStatsProps) => {
  const intl = useIntl();
  const collectedDates = collection
    .map(({ collected_at: collectedAt }) => new Date(collectedAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((first, second) => first.getTime() - second.getTime());
  const thirtyDaysAgo = new Date(asOf).getTime() - 30 * 24 * 60 * 60 * 1_000;
  const signsThisMonth = collectedDates.filter(
    (date) => date.getTime() >= thirtyDaysAgo,
  ).length;
  const namedPlaces = new Set(
    signs
      .map((sign) => sign.tags.name?.trim())
      .filter((name): name is string => Boolean(name)),
  ).size;
  const signsPerRide = processedActivities
    ? collectedSigns / processedActivities
    : undefined;
  const hasRideTotal = totalRides !== null;
  const checkedRides = hasRideTotal
    ? Math.min(processedActivities, totalRides)
    : processedActivities;
  const rideProgress = hasRideTotal
    ? totalRides === 0
      ? 100
      : Math.min(100, (checkedRides / totalRides) * 100)
    : 32;
  const signsPerRideDescription = signsPerRide
    ? intl.formatMessage(
        { id: "strava.stats.signsPerRide" },
        {
          count: intl.formatNumber(signsPerRide, {
            maximumFractionDigits: 1,
          }),
        },
      )
    : intl.formatMessage({ id: "strava.stats.uniqueSign" });

  return (
    <section
      aria-label={intl.formatMessage({ id: "strava.stats.label" })}
      className="collection-stats"
    >
      <div className="collection-stat-primary">
        <p className="font-headline text-5xl font-black leading-none tracking-[-0.04em] tabular-nums sm:text-7xl">
          {intl.formatNumber(collectedSigns)}
        </p>
        <div className="mt-2 sm:mt-3">
          <p className="font-headline text-xs font-black tracking-[0.12em] text-town-sign uppercase sm:text-sm">
            <FormattedMessage id="strava.stats.signsCollected" />
          </p>
          <p className="mt-1.5 hidden max-w-[26rem] text-sm leading-relaxed text-white/72 sm:block">
            {signsPerRideDescription}
          </p>
        </div>
      </div>

      <div className="collection-stat-rides">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <p className="font-headline text-3xl font-black leading-none tracking-[-0.035em] tabular-nums sm:text-5xl">
              {intl.formatNumber(checkedRides)}
              {hasRideTotal && (
                <span className="ml-1.5 text-lg text-white/60 sm:text-2xl">
                  / {intl.formatNumber(totalRides)}
                </span>
              )}
            </p>
            <p className="mt-1.5 font-headline text-xs font-black tracking-[0.12em] text-white/72 uppercase sm:mt-2">
              <FormattedMessage id="strava.stats.ridesChecked" />
            </p>
          </div>
          <p className="hidden max-w-[15rem] text-sm leading-relaxed text-white/64 sm:block">
            {hasRideTotal
              ? totalRides === 0
                ? intl.formatMessage({ id: "strava.stats.noOutdoorRides" })
                : intl.formatMessage(
                    { id: "strava.stats.ridesCheckedPercent" },
                    {
                      progress: intl.formatNumber(rideProgress / 100, {
                        maximumFractionDigits: 0,
                        style: "percent",
                      }),
                    },
                  )
              : intl.formatMessage({ id: "strava.stats.countingRides" })}
          </p>
        </div>
        <div
          aria-label={
            hasRideTotal
              ? intl.formatMessage(
                  { id: "strava.stats.ridesCheckedProgress" },
                  { checked: checkedRides, total: totalRides },
                )
              : intl.formatMessage({ id: "strava.stats.loadingRideCount" })
          }
          aria-valuemax={hasRideTotal ? totalRides : undefined}
          aria-valuemin={hasRideTotal ? 0 : undefined}
          aria-valuenow={hasRideTotal ? checkedRides : undefined}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/16 sm:mt-5 sm:h-2"
          role="progressbar"
        >
          <span
            className={`block h-full rounded-full bg-town-sign ${
              hasRideTotal ? "transition-[width] duration-500" : "animate-pulse"
            }`}
            style={{ width: `${rideProgress}%` }}
          />
        </div>
      </div>

      <div className="collection-stat-summary">
        <div>
          <p className="font-headline text-3xl font-black leading-none tracking-[-0.035em] tabular-nums sm:text-4xl">
            {intl.formatNumber(signsThisMonth)}
          </p>
          <p className="mt-1.5 font-headline text-xs font-black tracking-[0.12em] text-white/72 uppercase sm:mt-2">
            <FormattedMessage id="strava.stats.lastThirtyDays" />
          </p>
          <p className="mt-1.5 hidden text-sm leading-relaxed text-white/58 sm:block">
            <FormattedMessage id="strava.stats.signsThisMonth" />
          </p>
        </div>
        <div>
          <p className="font-headline text-3xl font-black leading-none tracking-[-0.035em] tabular-nums sm:text-4xl">
            {intl.formatNumber(namedPlaces)}
          </p>
          <p className="mt-1.5 font-headline text-xs font-black tracking-[0.12em] text-white/72 uppercase sm:mt-2">
            <FormattedMessage id="strava.stats.namedPlaces" />
          </p>
          <p className="mt-1.5 hidden text-sm leading-relaxed text-white/58 sm:block">
            <FormattedMessage id="strava.stats.distinctNames" />
          </p>
        </div>
      </div>
    </section>
  );
};
