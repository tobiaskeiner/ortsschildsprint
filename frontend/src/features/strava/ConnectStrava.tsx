import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { LocalIcon } from "../../components/LocalIcon";

export const ConnectStrava = () => {
  const [appendSignSummary, setAppendSignSummary] = useState(true);

  return (
    <section className="strava-connect-shell relative mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl items-center overflow-hidden rounded-[2rem] border border-outline-variant/55 p-5 sm:min-h-[calc(100vh-9rem)] sm:p-8 lg:p-12">
      <div
        aria-hidden="true"
        className="strava-connect-grid pointer-events-none absolute -right-28 -top-28 h-[32rem] w-[32rem] opacity-50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="relative grid w-full gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(21rem,0.95fr)] lg:items-center lg:gap-14">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-container/55 px-3.5 py-2 font-headline text-[0.68rem] font-black tracking-[0.18em] text-on-primary-container uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-town-sign shadow-[0_0_0.65rem_#f0cf20]" />
            <FormattedMessage id="strava.connect.eyebrow" />
          </p>
          <h1 className="mt-6 font-headline text-4xl font-black leading-[0.98] tracking-[-0.055em] text-on-surface sm:text-5xl lg:text-6xl">
            <FormattedMessage id="strava.connect.title" />
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-secondary sm:text-lg">
            <FormattedMessage id="strava.connect.description" />
          </p>
          <div className="mt-9 flex items-center gap-3 text-sm font-medium text-secondary">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-town-sign/60 bg-town-sign text-[#171716] shadow-sm">
              <LocalIcon name="pin" size={20} />
            </span>
            <span className="max-w-[17rem] leading-snug">
              <FormattedMessage id="strava.connect.activityDescriptions" />
            </span>
          </div>
        </div>

        <fieldset className="rounded-[1.75rem] border border-outline-variant/65 bg-surface-container-lowest/70 p-4 shadow-[0_1.5rem_3.5rem_rgb(6_15_30/0.12)] backdrop-blur-sm sm:p-5">
          <legend className="sr-only">
            <FormattedMessage id="strava.connect.activityDescriptions" />
          </legend>
          <div className="px-1 pt-1">
            <p className="font-headline text-sm font-black text-on-surface">
              <FormattedMessage id="strava.connect.activityDescriptions" />
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary">
              <FormattedMessage id="strava.connect.permissionHint" />
            </p>
          </div>
          <div className="mt-5 grid gap-3">
            <button
              aria-pressed={appendSignSummary}
              className="strava-connect-choice group relative rounded-[1.25rem] border p-4 text-left text-on-surface transition-[border-color,background-color,box-shadow,transform] hover:cursor-pointer hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-town-sign sm:p-5"
              data-selected={appendSignSummary}
              onClick={() => setAppendSignSummary(true)}
              type="button"
            >
              <span className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-town-sign text-[#171716] transition-transform group-hover:scale-105">
                  <LocalIcon name="note" size={21} />
                </span>
                <span className="min-w-0">
                  <span className="block font-headline text-base font-black">
                    <FormattedMessage id="strava.connect.addSummary" />
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-secondary">
                    <FormattedMessage id="strava.connect.addSummary.description" />
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    appendSignSummary
                      ? "border-town-sign bg-town-sign text-[#171716]"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
                >
                  {appendSignSummary && <LocalIcon name="check" size={13} />}
                </span>
              </span>
            </button>
            <button
              aria-pressed={!appendSignSummary}
              className="strava-connect-choice group relative rounded-[1.25rem] border p-4 text-left text-on-surface transition-[border-color,background-color,box-shadow,transform] hover:cursor-pointer hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-town-sign sm:p-5"
              data-selected={!appendSignSummary}
              onClick={() => setAppendSignSummary(false)}
              type="button"
            >
              <span className="flex items-start gap-3.5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                    !appendSignSummary
                      ? "bg-town-sign text-[#171716]"
                      : "bg-surface-container-high text-on-surface"
                  }`}
                >
                  <LocalIcon name="noteOff" size={21} />
                </span>
                <span className="min-w-0">
                  <span className="block font-headline text-base font-black">
                    <FormattedMessage id="strava.connect.keepDescriptions" />
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-secondary">
                    <FormattedMessage id="strava.connect.keepDescriptions.description" />
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    !appendSignSummary
                      ? "border-town-sign bg-town-sign text-[#171716]"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
                >
                  {!appendSignSummary && <LocalIcon name="check" size={13} />}
                </span>
              </span>
            </button>
          </div>
          <a
            className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-5 py-3.5 font-headline text-sm font-black text-white shadow-[0_0.75rem_1.75rem_rgb(252_76_2/0.28)] transition-[background-color,box-shadow,transform] hover:cursor-pointer hover:bg-[#e34402] hover:shadow-[0_1rem_2.25rem_rgb(252_76_2/0.36)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fc4c02]"
            href={`/api/strava/connect?activity_summary=${appendSignSummary ? "1" : "0"}`}
          >
            <FormattedMessage id="strava.connect.action" />
            <span className="material-symbols-outlined text-[1.05rem] transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </a>
        </fieldset>
      </div>
    </section>
  );
};
