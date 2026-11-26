import { use } from "react";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "@tanstack/react-router";
import { GeoJsonContext } from "../context/GeoJsonContext";
import ErrorAlert from "../components/ErrorAlert";
import HomeRouteMap from "../components/HomeRouteMap";
import { LocalIcon } from "../components/LocalIcon";
import { useRouteFileDrop } from "../components/useRouteFileDrop";
import { STRAVA_ROUTE, WORKFLOW_ROUTE } from "../utils/routes";

const FORMATS = ["GPX", "TCX", "FIT"];

const Home: React.FC = () => {
  const geoContext = use(GeoJsonContext);
  const navigate = useNavigate();
  const {
    getRootProps,
    getInputProps,
    open,
    isDragActive,
    isTouchDevice,
    cancelParse,
    isProcessing,
    fileName,
  } = useRouteFileDrop({
    onParseSuccessful: () => {
      void navigate({ to: WORKFLOW_ROUTE as never });
    },
  });

  return (
    <>
      <section
        {...getRootProps({
          className: "home-stage",
          "data-drag-active": isDragActive,
        })}
      >
        <HomeRouteMap />

        <div className="home-panel home-panel--route">
          <input {...getInputProps()} />
          <p className="sr-only" role="status">
            {isProcessing && <FormattedMessage id="upload.processing" />}
          </p>
          <h1 className="text-balance font-headline text-4xl font-black leading-[1.02] tracking-[-0.04em] text-on-surface sm:text-5xl xl:text-6xl">
            <FormattedMessage id="home.title" />
          </h1>

          {isProcessing ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 animate-spin rounded-full border-[3px] border-surface-container-highest border-t-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="font-headline text-base font-bold text-on-surface">
                  <FormattedMessage id="upload.processing" />
                </p>
                {fileName && (
                  <p className="truncate text-sm text-secondary">{fileName}</p>
                )}
              </div>
              <button
                className="inline-flex min-h-11 items-center rounded-full bg-surface-container-high px-5 font-headline text-sm font-bold text-on-surface transition-colors hover:cursor-pointer hover:bg-surface-container-highest"
                onClick={cancelParse}
                type="button"
              >
                <FormattedMessage id="upload.cancel" />
              </button>
            </div>
          ) : (
            <>
              <p className="mt-4 max-w-[34rem] text-pretty text-base leading-relaxed text-on-surface-variant sm:text-lg">
                <FormattedMessage id="home.description" />
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
                <button
                  className="inline-flex min-h-12 items-center rounded-full bg-on-surface px-7 font-headline text-sm font-bold text-surface shadow-[0_0.5rem_1.25rem_rgb(0_0_0/0.16)] transition-[opacity,transform] hover:cursor-pointer hover:opacity-85 active:scale-[0.98]"
                  onClick={open}
                  type="button"
                >
                  <FormattedMessage id="upload.button" />
                </button>
                <ul className="flex items-center gap-1.5">
                  {FORMATS.map((format) => (
                    <li
                      className="rounded-full border border-outline-variant px-2.5 py-1 font-headline text-xs font-bold tracking-[0.06em] text-on-surface-variant"
                      key={format}
                    >
                      {format}
                    </li>
                  ))}
                </ul>
              </div>
              {!isTouchDevice && (
                <p className="mt-3 text-sm text-secondary">
                  <FormattedMessage id="upload.drop.hint" />
                </p>
              )}
            </>
          )}

          <p className="home-panel-fact">
            <LocalIcon className="shrink-0" name="shield" size={18} />
            <FormattedMessage id="privacy.description" />
          </p>
        </div>

        <a className="home-strava-link" href={STRAVA_ROUTE}>
          <img alt="" className="h-4 w-4" src="/img/strava.png" />
          <FormattedMessage id="strava.home.link" />
        </a>

        {isDragActive && (
          <div aria-hidden="true" className="home-drop-overlay">
            <span className="rounded-full bg-on-surface px-6 py-3 font-headline text-base font-bold text-surface shadow-lg">
              <FormattedMessage id="upload.drop.active" />
            </span>
          </div>
        )}
      </section>

      {geoContext?.parseState === "Error" && (
        <ErrorAlert
          description={
            <FormattedMessage
              id={geoContext.parseError ?? "error.parse.generic"}
            />
          }
          onDismiss={() => geoContext.reset()}
        />
      )}
    </>
  );
};

export default Home;
