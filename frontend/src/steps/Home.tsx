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
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(20rem,0.75fr)_minmax(32rem,1.25fr)] lg:items-center lg:gap-12">
        <div>
          <h1 className="max-w-[11ch] text-balance font-headline text-5xl font-black leading-[0.9] tracking-[-0.04em] text-on-surface sm:text-6xl lg:text-7xl">
            <FormattedMessage id="home.title" />
          </h1>
          <p className="mt-5 max-w-[38rem] text-base leading-relaxed text-on-surface-variant sm:text-lg">
            <FormattedMessage id="home.description"></FormattedMessage>
          </p>
          <a
            className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-strava-orange px-5 py-3 font-headline text-sm font-black text-white transition-[background-color,transform] hover:cursor-pointer hover:bg-strava-orange-hover active:scale-[0.98]"
            href={STRAVA_ROUTE}
          >
            <img alt="" className="h-4 w-4" src="/img/strava.png" />
            <FormattedMessage id="strava.home.link" />
          </a>
        </div>
        <div>
          <FileUploader
            onParseSuccessful={() => {
              navigateToWorkflow();
            }}
          />
        </div>
      </div>
      <div className="mx-auto mt-6 w-full max-w-6xl">
        <div className="max-w-xl border-t border-outline-variant pt-5">
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
        />
      )}
    </>
  );
};

export default Home;
