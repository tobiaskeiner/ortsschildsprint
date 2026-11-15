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
    <section className="rounded-[1.5rem] bg-surface-container-low p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary-container text-on-surface">
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
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 font-headline text-sm font-black text-on-surface shadow-sm transition-[background-color,box-shadow,transform] hover:cursor-pointer hover:bg-on-surface hover:text-surface hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
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
