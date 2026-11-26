import PrivacyStatement from "../components/PrivacyStatement";
import FileUploader from "../components/FileUpload";
import { use } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import ErrorAlert from "../components/ErrorAlert";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "@tanstack/react-router";
import { STRAVA_ROUTE, WORKFLOW_ROUTE } from "../utils/routes";

const Home: React.FC = () => {
  const geoContext = use(GeoJsonContext);
  const navigate = useNavigate();
  const navigateToWorkflow = () => {
    void navigate({ to: WORKFLOW_ROUTE as never });
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-12 xl:grid-cols-5 xl:gap-x-16">
          <div className="lg:col-start-1 lg:row-start-1 xl:col-span-2 xl:col-start-1 xl:row-start-1">
            <h1 className="max-w-[11ch] text-balance font-headline text-5xl font-black leading-[1.05] tracking-[-0.04em] text-on-surface sm:text-6xl xl:text-7xl">
              <FormattedMessage id="home.title" />
            </h1>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-on-surface-variant sm:text-lg">
              <FormattedMessage id="home.description"></FormattedMessage>
            </p>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 xl:col-span-3 xl:col-start-3 xl:row-span-2 xl:row-start-1">
            <FileUploader
              onParseSuccessful={() => {
                navigateToWorkflow();
              }}
            />
          </div>
          <div className="lg:col-start-1 lg:row-start-2 lg:self-end xl:col-span-2 xl:col-start-1 xl:row-start-2">
            <a
              className="inline-flex min-h-11 items-center gap-2 rounded-[1rem] bg-strava-orange px-5 py-3.5 font-headline text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white transition-[background-color,transform] hover:cursor-pointer hover:bg-strava-orange-hover active:scale-[0.98]"
              href={STRAVA_ROUTE}
            >
              <img
                alt=""
                aria-hidden="true"
                className="h-4 w-4"
                src="/img/strava.png"
              />
              <FormattedMessage id="strava.home.link" />
            </a>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-secondary">
              <FormattedMessage id="strava.connect.description" />
            </p>
          </div>
        </div>
        <div className="mt-12 xl:mt-16">
          <PrivacyStatement />
        </div>
      </div>
      {/* Error Popup Implementation */}
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
