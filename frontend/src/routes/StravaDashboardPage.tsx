import { useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { FormattedMessage, useIntl } from "react-intl";
import { ActivitySummaryPreference } from "../features/strava/ActivitySummaryPreference";
import { CollectionMap } from "../features/strava/CollectionMap";
import { CollectionStats } from "../features/strava/CollectionStats";
import { ConnectStrava } from "../features/strava/ConnectStrava";
import { HistoricImportCard } from "../features/strava/HistoricImportCard";
import { useStravaDashboard } from "../features/strava/useStravaDashboard";
import { LocalIcon } from "../components/LocalIcon";

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
      className="strava-dashboard mx-auto flex w-full max-w-[1320px] flex-col gap-5"
    >
      <span className="sr-only" role="status">
        <FormattedMessage id="strava.dashboard.loading.collection" />
      </span>
      <header className="strava-dashboard-masthead">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <SkeletonBlock className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="space-y-2.5">
            <SkeletonBlock className="h-9 w-48 sm:w-64" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        </div>
        <SkeletonBlock className="h-14 w-14 shrink-0 rounded-full" />
      </header>

      <div aria-hidden="true" className="strava-dashboard-stage">
        <div className="strava-dashboard-ledger p-5 sm:p-6">
          <SkeletonBlock className="h-16 w-28 bg-white/15" />
          <SkeletonBlock className="mt-5 h-4 w-44 bg-white/15" />
          <div className="mt-8 border-t border-white/15 pt-6">
            <SkeletonBlock className="h-11 w-44 bg-white/15" />
            <SkeletonBlock className="mt-4 h-2 w-full bg-white/15" />
          </div>
          <div className="mt-7 grid grid-cols-2 gap-5 border-t border-white/15 pt-6">
            <SkeletonBlock className="h-14 w-full bg-white/15" />
            <SkeletonBlock className="h-14 w-full bg-white/15" />
          </div>
        </div>
        <section className="strava-dashboard-map">
          <div className="collection-map-toolbar">
            <div className="space-y-3">
              <SkeletonBlock className="h-8 w-52" />
              <SkeletonBlock className="h-4 w-72 max-w-full" />
            </div>
            <SkeletonBlock className="h-10 w-44" />
          </div>
          <div className="collection-map-canvas animate-pulse bg-surface-container" />
        </section>
        <div className="strava-dashboard-actions">
          {["notes", "history"].map((key) => (
            <div className="strava-operation" key={key}>
              <div className="flex min-w-0 items-center gap-3">
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
                <div className="w-full space-y-2">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-4 w-full max-w-64" />
                </div>
              </div>
              <SkeletonBlock className="h-9 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
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
        <section className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 rounded-[1.75rem] border border-outline-variant/60 bg-surface-container-low p-6 shadow-[0_1.5rem_4rem_rgb(6_15_30/0.12)] sm:p-8">
          <h1 className="font-headline text-2xl font-black text-on-surface">
            <FormattedMessage id="strava.dashboard.error.title" />
          </h1>
          <p className="text-secondary">
            <FormattedMessage id="strava.dashboard.error.description" />
          </p>
          <button
            className="rounded-full bg-on-surface px-5 py-3 font-headline text-sm font-black text-surface shadow-[0_0.75rem_1.75rem_rgb(0_0_0/0.22)] transition-[box-shadow,opacity,transform] hover:cursor-pointer hover:scale-[1.02] hover:opacity-85 hover:shadow-[0_1rem_2rem_rgb(0_0_0/0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
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
    <section className="strava-dashboard mx-auto flex w-full max-w-[1320px] flex-col gap-5">
      <header className="strava-dashboard-masthead">
        <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-town-sign/65 bg-town-sign text-[#171716] shadow-sm sm:h-13 sm:w-13">
            <LocalIcon name="pin" size={23} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-headline text-3xl font-black tracking-[-0.04em] text-on-surface sm:text-5xl">
              {dashboard.athlete?.display_name ??
                intl.formatMessage({ id: "strava.dashboard.collection" })}
            </h1>
          </div>
        </div>
        {dashboard.athlete?.profile_image_url && (
          <img
            alt=""
            className="h-14 w-14 rounded-full border-2 border-surface-container-lowest object-cover ring-2 ring-primary/35 shadow-lg"
            src={dashboard.athlete.profile_image_url}
          />
        )}
      </header>

      <div className="strava-dashboard-stage">
        <div className="strava-dashboard-ledger">
          <CollectionStats
            {...dashboard.stats}
            asOf={dashboard.generatedAt}
            collection={dashboard.collection}
            signs={dashboard.signs}
          />
        </div>
        <CollectionMap signs={dashboard.signs} />
        <aside className="strava-dashboard-actions">
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
        </aside>
      </div>
    </section>
  );
};

export default StravaDashboardPage;
