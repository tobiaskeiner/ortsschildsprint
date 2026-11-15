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
    <section aria-label={intl.formatMessage({ id: "strava.stats.label" })}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-[#151515] via-[#2a2a2a] to-[#5a5a5a] p-5 text-white shadow-[0_1.25rem_2.75rem_rgb(0_0_0/0.22)]">
          <p className="font-headline text-xs font-bold tracking-widest text-town-sign uppercase">
            <FormattedMessage id="strava.stats.signsCollected" />
          </p>
          <p className="mt-2 font-headline text-5xl font-black">
            {intl.formatNumber(collectedSigns)}
          </p>
          <p className="mt-3 text-sm text-white/75">
            {signsPerRideDescription}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-outline-variant/55 bg-surface-container-lowest p-5 text-on-surface shadow-sm">
          <p className="font-headline text-xs font-bold tracking-widest text-secondary uppercase">
            <FormattedMessage id="strava.stats.ridesChecked" />
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 font-headline font-black">
            <span className="text-5xl">{intl.formatNumber(checkedRides)}</span>
            {hasRideTotal && (
              <span className="text-2xl">
                / {intl.formatNumber(totalRides)}
              </span>
            )}
          </p>
          <div className="mt-4">
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
              className="h-2 overflow-hidden rounded-full bg-surface-container-high"
              role="progressbar"
            >
              <span
                className={`block h-full rounded-full bg-town-sign ${
                  hasRideTotal
                    ? "transition-[width] duration-500"
                    : "animate-pulse"
                }`}
                style={{ width: `${rideProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-secondary">
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
        </div>
        <div className="rounded-[1.5rem] border border-outline-variant/55 bg-surface-container-lowest p-5 text-on-surface shadow-sm">
          <p className="font-headline text-xs font-bold tracking-widest text-secondary uppercase">
            <FormattedMessage id="strava.stats.lastThirtyDays" />
          </p>
          <p className="mt-2 font-headline text-5xl font-black">
            {intl.formatNumber(signsThisMonth)}
          </p>
          <p className="mt-3 text-sm text-secondary">
            <FormattedMessage id="strava.stats.signsThisMonth" />
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-outline-variant/55 bg-surface-container-lowest p-5 text-on-surface shadow-sm">
          <p className="font-headline text-xs font-bold tracking-widest text-secondary uppercase">
            <FormattedMessage id="strava.stats.namedPlaces" />
          </p>
          <p className="mt-2 font-headline text-5xl font-black">
            {intl.formatNumber(namedPlaces)}
          </p>
          <p className="mt-3 text-sm text-secondary">
            <FormattedMessage id="strava.stats.distinctNames" />
          </p>
        </div>
      </div>
    </section>
  );
};
