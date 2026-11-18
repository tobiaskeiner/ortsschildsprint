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
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(20rem,0.75fr)_minmax(32rem,1.25fr)] lg:items-center lg:gap-x-12 lg:gap-y-10">
        <div className="lg:col-start-1 lg:row-start-1">
          <h1 className="max-w-[11ch] text-balance font-headline text-5xl font-black leading-[0.9] tracking-[-0.04em] text-on-surface sm:text-6xl lg:text-7xl">
            <FormattedMessage id="home.title" />
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-on-surface-variant sm:text-lg">
            <FormattedMessage id="home.description"></FormattedMessage>
          </p>
        </div>
        <div className="flex flex-col gap-6 lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <FileUploader
            onParseSuccessful={() => {
              navigateToWorkflow();
            }}
          />
          <PrivacyStatement />
        </div>
        <div className="mt-8 lg:col-start-1 lg:row-start-2 lg:mt-0">
          <a
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-strava-orange px-5 py-3.5 font-headline text-xs font-bold text-white transition-[background-color,transform] hover:cursor-pointer hover:bg-strava-orange-hover active:scale-[0.98]"
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
