import type { StravaDashboard } from "./types";
import { FormattedMessage, useIntl } from "react-intl";
import { LocalIcon } from "../../components/LocalIcon";

interface HistoricImportCardProps {
  importState: StravaDashboard["importState"];
  isImporting: boolean;
  error?: string;
  processedActivities: number;
  totalRides: number | null;
  onImport: () => void;
}

export const HistoricImportCard = ({
  importState,
  isImporting,
  error,
  processedActivities,
  totalRides,
  onImport,
}: HistoricImportCardProps) => {
  const intl = useIntl();
  const fullHistoryIsRunning =
    importState?.full_history_requested && !importState.completed;
  const initialScanComplete = importState?.initial_import_complete;
  const recentRidesAreLoading =
    !initialScanComplete && !importState?.full_history_requested;
  const actionLabel = recentRidesAreLoading
    ? intl.formatMessage({ id: "strava.history.action.loadingRecent" })
    : !importState?.full_history_requested
      ? intl.formatMessage({ id: "strava.history.action.searchFull" })
      : isImporting
        ? intl.formatMessage({ id: "strava.history.action.checking" })
        : intl.formatMessage({ id: "strava.history.action.checkNext" });
  const status = importState?.completed
    ? intl.formatMessage({ id: "strava.history.status.complete" })
    : fullHistoryIsRunning
      ? intl.formatMessage({ id: "strava.history.status.running" })
      : recentRidesAreLoading
        ? intl.formatMessage({ id: "strava.history.status.loadingRecent" })
        : intl.formatMessage({ id: "strava.history.status.notScanned" });
  const description = importState?.completed
    ? intl.formatMessage({ id: "strava.history.description.complete" })
    : fullHistoryIsRunning
      ? intl.formatMessage({ id: "strava.history.description.running" })
      : recentRidesAreLoading
        ? intl.formatMessage({ id: "strava.history.description.loadingRecent" })
        : intl.formatMessage({ id: "strava.history.description.notScanned" });

  return (
    <section className="rounded-[1.5rem] border border-outline-variant/55 bg-surface-container-low p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-town-sign text-[#171716]">
            <LocalIcon name="history" />
          </span>
          <div>
            <h2 className="font-headline text-base font-black text-on-surface">
              <FormattedMessage id="strava.history.title" />
            </h2>
            <p className="mt-0.5 text-sm text-secondary">{description}</p>
            <p className="mt-1 font-headline text-xs font-black text-secondary uppercase">
              {totalRides === null
                ? intl.formatMessage(
                    { id: "strava.history.ridesChecked" },
                    { count: processedActivities },
                  )
                : intl.formatMessage(
                    { id: "strava.history.ridesChecked.withTotal" },
                    { processed: processedActivities, total: totalRides },
                  )}{" "}
              · {status}
            </p>
          </div>
        </div>
        {!importState?.completed && (
          <button
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-on-surface px-4 py-2.5 font-headline text-sm font-black text-surface shadow-[0_0.65rem_1.5rem_rgb(0_0_0/0.2)] transition-[box-shadow,opacity,transform] hover:cursor-pointer hover:opacity-85 hover:shadow-[0_0.85rem_1.8rem_rgb(0_0_0/0.28)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            disabled={isImporting || recentRidesAreLoading}
            onClick={onImport}
            type="button"
          >
            <LocalIcon
              className="transition-transform group-hover:-rotate-12"
              name="history"
              size={17}
            />
            {actionLabel}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </section>
  );
};
