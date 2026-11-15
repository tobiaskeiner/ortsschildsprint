import { LocalIcon } from "../../components/LocalIcon";
import { FormattedMessage, useIntl } from "react-intl";

interface ActivitySummaryPreferenceProps {
  canWriteActivities: boolean;
  error?: string;
  isSaving: boolean;
  onChange: (appendSignSummary: boolean) => void;
  appendSignSummary: boolean;
}

export const ActivitySummaryPreference = ({
  appendSignSummary,
  canWriteActivities,
  error,
  isSaving,
  onChange,
}: ActivitySummaryPreferenceProps) => {
  const intl = useIntl();

  return (
    <section className="flex h-full flex-col rounded-[1.5rem] bg-surface-container-low p-4 sm:p-5">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-primary-container text-on-surface">
            <LocalIcon name={appendSignSummary ? "note" : "noteOff"} />
          </span>
          <div>
            <h2 className="font-headline text-base font-black text-on-surface">
              <FormattedMessage id="strava.preference.title" />
            </h2>
            <p className="mt-0.5 text-sm text-secondary">
              <FormattedMessage
                id={
                  appendSignSummary
                    ? "strava.preference.enabled.description"
                    : "strava.preference.disabled.description"
                }
              />
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          {canWriteActivities ? (
            <>
              <span
                aria-live="polite"
                className="min-w-9 text-right font-headline text-xs font-black tracking-wide text-secondary uppercase"
              >
                <FormattedMessage
                  id={
                    isSaving
                      ? "strava.preference.saving"
                      : appendSignSummary
                        ? "strava.preference.on"
                        : "strava.preference.off"
                  }
                />
              </span>
              <button
                aria-busy={isSaving}
                aria-checked={appendSignSummary}
                aria-label={intl.formatMessage({
                  id: appendSignSummary
                    ? "strava.preference.disable"
                    : "strava.preference.enable",
                })}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors duration-200 hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface disabled:cursor-wait disabled:opacity-60 ${
                  appendSignSummary
                    ? "bg-on-surface"
                    : "bg-surface-container-highest"
                }`}
                disabled={isSaving}
                onClick={() => onChange(!appendSignSummary)}
                role="switch"
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`h-4 w-4 rounded-full bg-surface-container-lowest shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    appendSignSummary ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </>
          ) : (
            <a
              className="rounded-full bg-primary-container px-4 py-2.5 font-headline text-xs font-black text-on-surface transition-[background-color,color] hover:bg-on-surface hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
              href="/api/strava/connect?activity_summary=1"
            >
              <FormattedMessage id="strava.preference.reconnect" />
            </a>
          )}
        </div>
      </div>
      {!canWriteActivities && (
        <p className="mt-3 text-xs text-secondary">
          <FormattedMessage id="strava.preference.permission" />
        </p>
      )}
      {error && <p className="mt-3 text-sm text-error">{error}</p>}
    </section>
  );
};
