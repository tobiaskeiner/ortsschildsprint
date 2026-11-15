import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { LocalIcon } from "../../components/LocalIcon";

export const ConnectStrava = () => {
  const [appendSignSummary, setAppendSignSummary] = useState(true);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 rounded-[1.75rem] bg-surface-container-low p-6 sm:p-10">
      <div>
        <p className="font-headline text-xs font-black tracking-[0.2em] text-secondary uppercase">
          <FormattedMessage id="strava.connect.eyebrow" />
        </p>
        <h1 className="mt-3 font-headline text-4xl font-black tracking-tight text-on-surface sm:text-5xl">
          <FormattedMessage id="strava.connect.title" />
        </h1>
        <p className="mt-4 max-w-2xl text-secondary">
          <FormattedMessage id="strava.connect.description" />
        </p>
      </div>

      <fieldset className="w-full">
        <legend className="font-headline text-sm font-black text-on-surface">
          <FormattedMessage id="strava.connect.activityDescriptions" />
        </legend>
        <p className="mt-1 text-sm text-secondary">
          <FormattedMessage id="strava.connect.permissionHint" />
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            aria-pressed={appendSignSummary}
            className={`rounded-[1.25rem] p-5 text-left transition-[background-color,color,transform] hover:cursor-pointer hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
              appendSignSummary
                ? "bg-primary-container text-on-surface"
                : "bg-surface-container-lowest text-on-surface"
            }`}
            onClick={() => setAppendSignSummary(true)}
            type="button"
          >
            <LocalIcon name="note" size={25} />
            <span className="mt-5 block font-headline text-base font-black">
              <FormattedMessage id="strava.connect.addSummary" />
            </span>
            <span className="mt-1 block text-sm opacity-80">
              <FormattedMessage id="strava.connect.addSummary.description" />
            </span>
          </button>
          <button
            aria-pressed={!appendSignSummary}
            className={`rounded-[1.25rem] p-5 text-left transition-[background-color,color,transform] hover:cursor-pointer hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface ${
              !appendSignSummary
                ? "bg-primary-container text-on-surface"
                : "bg-surface-container-lowest text-on-surface"
            }`}
            onClick={() => setAppendSignSummary(false)}
            type="button"
          >
            <LocalIcon name="noteOff" size={25} />
            <span className="mt-5 block font-headline text-base font-black">
              <FormattedMessage id="strava.connect.keepDescriptions" />
            </span>
            <span className="mt-1 block text-sm opacity-80">
              <FormattedMessage id="strava.connect.keepDescriptions.description" />
            </span>
          </button>
        </div>
      </fieldset>

      <a
        className="rounded-full bg-primary-container px-6 py-3 font-headline text-sm font-black text-on-surface transition-[background-color,color] hover:bg-on-surface hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
        href={`/api/strava/connect?activity_summary=${appendSignSummary ? "1" : "0"}`}
      >
        <FormattedMessage id="strava.connect.action" />
      </a>
    </section>
  );
};
