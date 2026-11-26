import { useMemo, useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  getTickStep,
  indexAtDistance,
  type RouteProfile as RouteProfileData,
} from "../utils/routeProfile";

interface RouteProfileProps {
  profile: RouteProfileData;
  activeIndex: number | null;
  onActiveIndexChange: (index: number | null) => void;
}

const MAX_PATH_POINTS = 600;
const CHART_TOP = 6;
const CHART_HEIGHT = 90;

const RouteProfile: React.FC<RouteProfileProps> = ({
  profile,
  activeIndex,
  onActiveIndexChange,
}) => {
  const intl = useIntl();
  const trackRef = useRef<HTMLDivElement>(null);
  const { distances, elevations, totalKm } = profile;

  const km = (value: number, digits = 1) =>
    intl.formatNumber(value, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    });
  const metres = (value: number) =>
    intl.formatNumber(Math.round(value), { maximumFractionDigits: 0 });

  const chart = useMemo(() => {
    if (!elevations || profile.minM == null || profile.maxM == null) {
      return null;
    }
    const padding = Math.max(10, (profile.maxM - profile.minM) * 0.12);
    const low = profile.minM - padding;
    const high = profile.maxM + padding;
    const toY = (elevation: number) =>
      CHART_TOP + (1 - (elevation - low) / (high - low)) * CHART_HEIGHT;
    const stride = Math.max(1, Math.ceil(elevations.length / MAX_PATH_POINTS));

    let line = "";
    for (let i = 0; i < elevations.length; i += stride) {
      line += `${line ? "L" : "M"}${((distances[i] / totalKm) * 1000).toFixed(1)},${toY(elevations[i]).toFixed(2)}`;
    }
    line += `L1000,${toY(elevations[elevations.length - 1]).toFixed(2)}`;

    return {
      line,
      area: `${line}L1000,100L0,100Z`,
      toY,
    };
  }, [distances, elevations, profile.maxM, profile.minM, totalKm]);

  const tickStep = getTickStep(totalKm);
  const ticks: number[] = [];
  for (let t = 0; t <= totalKm - tickStep * 0.35; t += tickStep) ticks.push(t);

  const updateFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / rect.width),
    );
    onActiveIndexChange(indexAtDistance(distances, fraction * totalKm));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = activeIndex == null ? 0 : distances[activeIndex];
    const step = totalKm / 100;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? current + step
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? current - step
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? totalKm
              : null;
    if (next == null) return;
    event.preventDefault();
    onActiveIndexChange(
      indexAtDistance(distances, Math.min(totalKm, Math.max(0, next))),
    );
  };

  const activeKm = activeIndex == null ? null : distances[activeIndex];
  const activeElevation =
    activeIndex == null || !elevations ? null : elevations[activeIndex];
  const activeFraction = activeKm == null ? 0 : activeKm / totalKm;
  const readout =
    activeKm == null
      ? undefined
      : activeElevation == null
        ? `${km(activeKm)} km`
        : `${km(activeKm)} km · ${metres(activeElevation)} m`;

  return (
    <section
      aria-labelledby="route-profile-title"
      className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-[0_12px_40px_-24px_rgb(0_0_0/0.25)] sm:p-5 md:rounded-[1.75rem] md:px-6 lg:flex lg:flex-wrap lg:items-end lg:gap-x-10"
    >
      <h2 id="route-profile-title" className="sr-only">
        <FormattedMessage
          id={
            elevations ? "preview.profile.title" : "preview.profile.titleFlat"
          }
        />
      </h2>
      <dl className="grid grid-cols-3 gap-x-4 sm:flex sm:gap-x-10 lg:shrink-0 lg:pb-7">
        <div className="flex flex-col justify-between">
          <dt className="font-headline text-xs leading-tight font-bold tracking-[0.1em] text-secondary uppercase">
            <FormattedMessage id="preview.stats.distance" />
          </dt>
          <dd className="mt-0.5 font-headline text-xl font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-2xl">
            {km(totalKm)}
            <span className="ml-1 text-sm text-secondary sm:text-base">km</span>
          </dd>
        </div>
        {profile.gainM != null && (
          <div className="flex flex-col justify-between">
            <dt className="font-headline text-xs leading-tight font-bold tracking-[0.1em] text-secondary uppercase">
              <FormattedMessage id="preview.stats.gain" />
            </dt>
            <dd className="mt-0.5 font-headline text-xl font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-2xl">
              {metres(profile.gainM)}
              <span className="ml-1 text-sm text-secondary sm:text-base">
                m
              </span>
            </dd>
          </div>
        )}
        {profile.maxM != null && (
          <div className="flex flex-col justify-between">
            <dt className="font-headline text-xs leading-tight font-bold tracking-[0.1em] text-secondary uppercase">
              <FormattedMessage id="preview.stats.highest" />
            </dt>
            <dd className="mt-0.5 font-headline text-xl font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-2xl">
              {metres(profile.maxM)}
              <span className="ml-1 text-sm text-secondary sm:text-base">
                m
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div
        aria-label={intl.formatMessage({
          id: elevations
            ? "preview.profile.title"
            : "preview.profile.titleFlat",
        })}
        aria-valuemax={Math.round(totalKm * 10) / 10}
        aria-valuemin={0}
        aria-valuenow={activeKm == null ? 0 : Math.round(activeKm * 10) / 10}
        aria-valuetext={readout ?? `0 km`}
        className="group relative mt-3 cursor-crosshair touch-pan-y select-none rounded-xl outline-offset-4 lg:mt-0 lg:min-w-0 lg:flex-1"
        onBlur={() => onActiveIndexChange(null)}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => updateFromClientX(event.clientX)}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") onActiveIndexChange(null);
        }}
        onPointerMove={(event) => updateFromClientX(event.clientX)}
        ref={trackRef}
        role="slider"
        tabIndex={0}
      >
        <div className="relative h-7">
          <p
            aria-hidden="true"
            className={`absolute top-0 left-0 font-headline text-xs font-bold text-secondary transition-opacity duration-150 ${readout ? "opacity-0" : "opacity-100"}`}
          >
            <span className="sm:hidden">
              <FormattedMessage id="preview.profile.hintShort" />
            </span>
            <span className="hidden sm:inline">
              <FormattedMessage
                id={
                  elevations
                    ? "preview.profile.hint"
                    : "preview.profile.hintFlat"
                }
              />
            </span>
          </p>
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-0 z-10 rounded-full bg-on-surface px-2.5 py-0.5 font-headline text-xs font-bold whitespace-nowrap text-surface tabular-nums transition-opacity duration-150 ${readout ? "opacity-100" : "opacity-0"}`}
            style={{
              left: `${activeFraction * 100}%`,
              transform: `translateX(${activeFraction > 0.85 ? "-100%" : activeFraction < 0.15 ? "0" : "-50%"})`,
            }}
          >
            {readout ?? " "}
          </span>
        </div>
        {chart ? (
          <div className="relative h-14 sm:h-16">
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 1000 100"
            >
              <line
                className="stroke-outline-variant"
                strokeDasharray="2 4"
                vectorEffect="non-scaling-stroke"
                x1="0"
                x2="1000"
                y1={chart.toY(profile.maxM!)}
                y2={chart.toY(profile.maxM!)}
              />
              <path className="fill-surface-container-high" d={chart.area} />
              <path
                className="fill-none stroke-on-surface"
                d={chart.line}
                strokeLinejoin="round"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {activeKm != null && activeElevation != null && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-container-lowest bg-on-surface shadow-[0_1px_4px_rgb(0_0_0/0.3)]"
                style={{
                  left: `${activeFraction * 100}%`,
                  top: `${chart.toY(activeElevation)}%`,
                }}
              />
            )}
          </div>
        ) : (
          <div className="flex h-8 items-center">
            <div className="h-1.5 w-full rounded-full bg-on-surface" />
          </div>
        )}

        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-6 bottom-6 w-px bg-on-surface/40 transition-opacity duration-150 ${activeKm == null ? "opacity-0" : "opacity-100"}`}
          style={{ left: `${activeFraction * 100}%` }}
        />

        <div
          aria-hidden="true"
          className="relative mt-2 h-4 border-t border-outline-variant font-headline text-xs font-bold tabular-nums text-secondary"
        >
          {ticks.map((tick) => (
            <span
              className="absolute top-1 -translate-x-1/2 first:translate-x-0"
              key={tick}
              style={{ left: `${(tick / totalKm) * 100}%` }}
            >
              {intl.formatNumber(tick)}
            </span>
          ))}
          <span className="absolute top-1 right-0">{km(totalKm)} km</span>
        </div>
      </div>

      {!elevations && (
        <p className="mt-3 text-sm text-secondary lg:basis-full">
          <FormattedMessage id="preview.profile.noElevation" />
        </p>
      )}
    </section>
  );
};

export default RouteProfile;
