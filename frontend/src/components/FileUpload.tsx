import { use, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import useFileParse from "../hooks/useParseFile";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { FormattedMessage, useIntl } from "react-intl";

interface FileUploaderProps {
  onParseSuccessful?: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = (props) => {
  const { onParseSuccessful } = props;
  const geoContext = use(GeoJsonContext);
  const { parseFile } = useFileParse();
  const intl = useIntl();
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0
    );
  });

  // Bumped on every new drop and on cancel; in-flight parses check it and
  // discard their results, so only the newest run may write state.
  const runIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateIsTouchDevice = () =>
      setIsTouchDevice(mediaQuery.matches || navigator.maxTouchPoints > 0);

    mediaQuery.addEventListener("change", updateIsTouchDevice);

    return () => {
      mediaQuery.removeEventListener("change", updateIsTouchDevice);
    };
  }, []);

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    maxFiles: 1,
    noKeyboard: true,
    noDrag: isTouchDevice,
    accept: { "application/xml": [".gpx", ".tcx", ".fit"] },
    onDrop: (acceptedFiles) => {
      const runId = ++runIdRef.current;
      void parseFile({
        file: acceptedFiles[0],
        onSuccess: onParseSuccessful,
        isCancelled: () => runIdRef.current !== runId,
      });
    },
    onDropRejected: () => {
      runIdRef.current += 1;
      geoContext?.reset();
      geoContext?.setParseError("error.parse.rejectedFile");
      geoContext?.setParseState("Error");
    },
  });

  const cancelParse = () => {
    runIdRef.current += 1;
    geoContext?.reset();
  };

  return (
    <div className="rounded-[2rem] bg-surface-container-lowest p-2 shadow-lg sm:p-2.5 lg:h-full">
      <div
        {...getRootProps({
          className: `flex flex-col items-center justify-center overflow-hidden rounded-[1.75rem] border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color] sm:px-10 sm:py-12 lg:h-full lg:px-12 lg:py-14 ${
            isDragActive
              ? "border-primary bg-surface-container"
              : "border-outline-variant/60 bg-surface-container-low"
          } ${isTouchDevice ? "" : "cursor-pointer"}`,
        })}
      >
        <input {...getInputProps()} />
        <p className="sr-only" role="status">
          {geoContext?.parseState === "inProgress"
            ? intl.formatMessage({ id: "upload.processing" })
            : ""}
        </p>
        {geoContext?.parseState === "inProgress" ? (
          <div className="flex flex-col items-center gap-4">
            <div
              aria-hidden="true"
              className="h-12 w-12 animate-spin rounded-full border-4 border-primary-container border-t-primary"
            ></div>
            <p className="font-medium text-secondary">
              <FormattedMessage id="upload.processing" />
            </p>
            {geoContext?.rawFileName && (
              <p className="max-w-full truncate px-2 text-xs text-secondary">
                {geoContext.rawFileName}
              </p>
            )}
            <button
              className="inline-flex min-h-11 items-center rounded-full bg-surface-container-high px-5 font-headline text-sm font-bold text-on-surface transition-colors hover:cursor-pointer hover:bg-surface-container-highest"
              onClick={(event) => {
                event.stopPropagation();
                cancelParse();
              }}
              type="button"
            >
              <FormattedMessage id="upload.cancel" />
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex w-full flex-col items-center gap-6 lg:flex-row lg:gap-9">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-20 sm:w-20 lg:h-28 lg:w-28">
              <img
                alt=""
                className="h-10 w-10 sm:h-14 sm:w-14 lg:h-[4.5rem] lg:w-[4.5rem]"
                src="/stravaClub.png"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-4 lg:items-start">
              <h2 className="font-headline text-2xl font-black tracking-[-0.02em] text-on-surface sm:text-3xl">
                <FormattedMessage id="upload.title" />
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {["GPX", "TCX", "FIT"].map((format) => (
                  <span
                    className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold tracking-wide text-on-surface-variant"
                    key={format}
                  >
                    {format}
                  </span>
                ))}
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 lg:justify-start">
                <button
                  className="rounded-full bg-primary-container px-8 py-3 font-headline text-xs font-bold text-on-primary-container transition-[background-color,transform] hover:cursor-pointer hover:bg-surface-container-highest active:scale-[0.98]"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    open();
                  }}
                >
                  <FormattedMessage id="upload.button" />
                </button>
                {!isTouchDevice && (
                  <p className="text-sm text-secondary">
                    <FormattedMessage id="upload.drop.hint" />
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
