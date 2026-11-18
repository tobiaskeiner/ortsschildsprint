import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { LocalIcon } from "../../components/LocalIcon";

export const ConnectStrava = () => {
  const [appendSignSummary, setAppendSignSummary] = useState(true);

  return (
    <section className="mx-auto w-full max-w-[1320px] overflow-hidden rounded-[1.5rem] border border-outline-variant bg-surface-container-lowest">
      <div className="grid lg:min-h-[34rem] lg:grid-cols-[minmax(0,1.12fr)_minmax(24rem,0.88fr)]">
        <header className="flex flex-col justify-center p-5 sm:p-8 lg:p-12">
          <h1 className="max-w-xl font-headline text-4xl font-black leading-[0.98] tracking-[-0.04em] text-on-surface sm:text-5xl">
            <FormattedMessage id="strava.connect.title" />
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-secondary sm:text-lg">
            <FormattedMessage id="strava.connect.description" />
          </p>
        </header>

        <div className="border-t border-outline-variant bg-surface-container-low p-5 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
          <fieldset>
            <legend className="font-headline text-lg font-black tracking-[-0.02em] text-on-surface">
              <FormattedMessage id="strava.connect.summary.question" />
            </legend>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-secondary">
              <FormattedMessage id="strava.connect.summary.hint" />
            </p>
            <div className="mt-6 grid gap-3">
              <label
                className="strava-connect-choice flex cursor-pointer items-start gap-3.5 rounded-[1rem] p-4 text-on-surface transition-[border-color,background-color] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-town-sign"
                data-selected={appendSignSummary}
              >
                <input
                  checked={appendSignSummary}
                  className="sr-only"
                  name="activity-summary"
                  onChange={() => setAppendSignSummary(true)}
                  type="radio"
                  value="enabled"
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-town-sign text-[#171716]">
                  <LocalIcon name="note" size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-headline text-base font-black">
                    <FormattedMessage id="strava.connect.addSummary" />
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-secondary">
                    <FormattedMessage id="strava.connect.addSummary.description" />
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    appendSignSummary
                      ? "border-town-sign bg-town-sign text-[#171716]"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
                >
                  {appendSignSummary && <LocalIcon name="check" size={13} />}
                </span>
              </label>
              <label
                className="strava-connect-choice flex cursor-pointer items-start gap-3.5 rounded-[1rem] p-4 text-on-surface transition-[border-color,background-color] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-town-sign"
                data-selected={!appendSignSummary}
              >
                <input
                  checked={!appendSignSummary}
                  className="sr-only"
                  name="activity-summary"
                  onChange={() => setAppendSignSummary(false)}
                  type="radio"
                  value="disabled"
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-high text-on-surface">
                  <LocalIcon name="noteOff" size={21} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-headline text-base font-black">
                    <FormattedMessage id="strava.connect.keepDescriptions" />
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-secondary">
                    <FormattedMessage id="strava.connect.keepDescriptions.description" />
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    !appendSignSummary
                      ? "border-town-sign bg-town-sign text-[#171716]"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
                >
                  {!appendSignSummary && <LocalIcon name="check" size={13} />}
                </span>
              </label>
            </div>
          </fieldset>
          <a
            className="group mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#fc4c02] px-5 py-3 font-headline text-sm font-black text-white transition-[background-color,transform] hover:cursor-pointer hover:bg-[#e34402] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fc4c02]"
            href={`/api/strava/connect?activity_summary=${appendSignSummary ? "1" : "0"}`}
          >
            <FormattedMessage id="strava.connect.action" />
            <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </a>
          <p className="mt-3 text-center text-xs leading-relaxed text-secondary">
            <FormattedMessage id="strava.connect.handoff" />
          </p>
        </div>
      </div>
    </section>
  );
};
