import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { FormattedMessage, useIntl } from "react-intl";
import { ActivitySummaryPreference } from "../features/strava/ActivitySummaryPreference";
import { CollectionMap } from "../features/strava/CollectionMap";
import { CollectionStats } from "../features/strava/CollectionStats";
import { ConnectStrava } from "../features/strava/ConnectStrava";
import { HistoricImportCard } from "../features/strava/HistoricImportCard";
import { useStravaDashboard } from "../features/strava/useStravaDashboard";

const SkeletonBlock = ({ className }: { className: string }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse rounded-full bg-surface-container-highest/80 ${className}`}
  />
);

const StravaDashboardSkeleton = () => {
  const intl = useIntl();

  return (
    <section
      aria-busy="true"
      aria-label={intl.formatMessage({
        id: "strava.dashboard.loading.label",
      })}
      className="flex w-full flex-col gap-5"
    >
      <span className="sr-only" role="status">
        <FormattedMessage id="strava.dashboard.loading.collection" />
      </span>
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-10 w-52 sm:w-72" />
        </div>
        <SkeletonBlock className="h-14 w-14 shrink-0 rounded-full" />
      </header>

      <section
        aria-hidden="true"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {["primary", "rides", "month", "places"].map((key) => (
          <div
            className="space-y-4 rounded-[1.5rem] bg-surface-container-low p-5"
            key={key}
          >
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-12 w-16" />
            <SkeletonBlock className="h-4 w-full max-w-44" />
          </div>
        ))}
      </section>

      <div aria-hidden="true" className="grid gap-4 xl:grid-cols-2">
        {["notes", "history"].map((key) => (
          <div
            className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-surface-container-low p-4 sm:p-5"
            key={key}
          >
            <div className="flex min-w-0 items-center gap-3">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-[0.9rem]" />
              <div className="w-full space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-4 w-full max-w-64" />
              </div>
            </div>
            <SkeletonBlock className="h-11 w-28 shrink-0" />
          </div>
        ))}
      </div>

      <section
        aria-hidden="true"
        className="overflow-hidden rounded-[1.75rem] bg-surface-container-low"
      >
        <div className="space-y-3 p-5 sm:p-6">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-full max-w-md" />
        </div>
        <div className="h-[22rem] animate-pulse bg-surface-container" />
      </section>
    </section>
  );
};

const StravaDashboardPage: React.FC = () => {
  const intl = useIntl();
  const {
    dashboard,
    error: hasDashboardError,
    reloadDashboard,
  } = useStravaDashboard();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>();
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [pendingActivitySummary, setPendingActivitySummary] = useState<
    boolean | undefined
  >();
  const [preferenceError, setPreferenceError] = useState<string>();

  const importHistory = async () => {
    setIsImporting(true);
    setImportError(undefined);
    try {
      const response = await fetch("/api/strava/import", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error();
      await reloadDashboard();
    } catch {
      setImportError(
        intl.formatMessage({ id: "strava.error.importActivities" }),
      );
      void reloadDashboard().catch(() => undefined);
    } finally {
      setIsImporting(false);
    }
  };

  const updateActivitySummaryPreference = async (
    appendSignSummary: boolean,
  ) => {
    setIsSavingPreference(true);
    setPendingActivitySummary(appendSignSummary);
    setPreferenceError(undefined);
    try {
      const response = await fetch("/api/strava/preferences", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appendSignSummary }),
      });
      if (!response.ok) throw new Error();
      await reloadDashboard();
    } catch {
      setPreferenceError(
        intl.formatMessage({ id: "strava.error.savePreference" }),
      );
    } finally {
      setIsSavingPreference(false);
      setPendingActivitySummary(undefined);
    }
  };

  if (dashboard === undefined) {
    if (hasDashboardError) {
      return (
        <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 rounded-[1.75rem] bg-surface-container-low p-6 sm:p-8">
          <h1 className="font-headline text-2xl font-black text-on-surface">
            <FormattedMessage id="strava.dashboard.error.title" />
          </h1>
          <p className="text-secondary">
            <FormattedMessage id="strava.dashboard.error.description" />
          </p>
          <button
            className="rounded-full bg-primary-container px-5 py-3 font-headline text-sm font-black text-on-surface transition-[background-color,color,transform] hover:cursor-pointer hover:scale-[1.02] hover:bg-on-surface hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
            onClick={() => void reloadDashboard()}
            type="button"
          >
            <FormattedMessage id="strava.dashboard.retry" />
          </button>
        </section>
      );
    }
    return <StravaDashboardSkeleton />;
  }

  if (dashboard === null) return <ConnectStrava />;

  return (
    <section className="flex w-full flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-headline text-xs font-black tracking-[0.2em] text-secondary uppercase">
            <FormattedMessage id="strava.dashboard.collection" />
          </p>
          <h1 className="font-headline text-3xl font-black tracking-tight text-on-surface sm:text-5xl">
            {dashboard.athlete?.display_name}
          </h1>
        </div>
        {dashboard.athlete?.profile_image_url && (
          <img
            alt=""
            className="h-14 w-14 rounded-full object-cover"
            src={dashboard.athlete.profile_image_url}
          />
        )}
      </header>

      <CollectionStats
        {...dashboard.stats}
        asOf={dashboard.generatedAt}
        collection={dashboard.collection}
        signs={dashboard.signs}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {dashboard.athlete && (
          <ActivitySummaryPreference
            appendSignSummary={
              pendingActivitySummary ?? dashboard.athlete.append_sign_summary
            }
            canWriteActivities={dashboard.athlete.granted_scopes.includes(
              "activity:write",
            )}
            error={preferenceError}
            isSaving={isSavingPreference}
            onChange={(appendSignSummary) =>
              void updateActivitySummaryPreference(appendSignSummary)
            }
          />
        )}
        <HistoricImportCard
          error={importError}
          importState={dashboard.importState}
          isImporting={isImporting}
          onImport={() => void importHistory()}
          processedActivities={dashboard.stats.processedActivities}
          totalRides={dashboard.stats.totalRides}
        />
      </div>
      <CollectionMap signs={dashboard.signs} />
    </section>
  );
};

export default StravaDashboardPage;
