import PrivacyStatement from "../components/PrivacyStatement";
import FileUploader from "../components/FileUpload";
import { use } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import ErrorAlert from "../components/ErrorAlert";
import { FormattedMessage } from "react-intl";
import { useNavigate } from "@tanstack/react-router";
import { WORKFLOW_ROUTE } from "../utils/routes";

const Home: React.FC = () => {
  const geoContext = use(GeoJsonContext);
  const navigate = useNavigate();
  const navigateToWorkflow = () => {
    void navigate({ to: WORKFLOW_ROUTE as never });
  };

  return (
    <>
      <div className="grid w-full gap-4 xl:grid-cols-5 xl:items-center xl:gap-8">
        <div className="xl:col-span-2">
          <div className="mb-4 grid grid-cols-[max-content_auto] grid-rows-2 items-center gap-x-3 uppercase sm:block sm:mb-8">
            <FormattedMessage
              id="home.title"
              values={{
                br: <br />,
                sentence: (chunks) => (
                  <h1 className="col-start-1 row-span-2 self-center pb-3 text-5xl leading-[0.85] font-black tracking-tighter text-on-surface font-headline sm:block sm:text-6xl md:text-7xl xl:text-8xl">
                    {chunks}
                  </h1>
                ),
                highlight: (chunks) => (
                  <span className="col-start-2 row-span-2 self-center justify-self-center inline-block w-fit bg-on-surface px-2 py-2 text-5xl font-black text-primary-container font-headline sm:text-6xl md:text-7xl xl:text-8xl">
                    {chunks}
                  </span>
                ),
              }}
            />
          </div>
          <p className="max-w-xl text-sm text-on-surface-variant sm:text-base xl:max-w-sm">
            <FormattedMessage id="home.description"></FormattedMessage>
          </p>
          <div className="hidden sm:mt-8 xl:block">
            <PrivacyStatement />
          </div>
        </div>
        <div className="xl:col-span-3">
          <FileUploader
            onParseSuccessful={() => {
              navigateToWorkflow();
            }}
          />
          <div className="mt-5 xl:hidden">
            <PrivacyStatement />
          </div>
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
