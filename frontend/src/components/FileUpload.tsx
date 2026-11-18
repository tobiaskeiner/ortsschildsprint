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
    <div className="rounded-[1.75rem] bg-surface-container-lowest p-2 shadow-lg sm:p-3">
      <div
        {...getRootProps({
          className: `flex flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color] sm:px-10 sm:py-12 ${
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
          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-primary sm:h-20 sm:w-20">
              <span
                className="material-symbols-outlined"
                data-icon="upload_file"
              >
                upload_file
              </span>
            </div>
            <div className="text-center">
              <h2 className="font-headline text-2xl font-black tracking-[-0.02em] text-on-surface sm:text-3xl">
                <FormattedMessage id="upload.title" />
              </h2>
              <p className="mt-2 text-sm text-secondary">
                <FormattedMessage
                  id={
                    isTouchDevice ? "upload.subtitle.mobile" : "upload.subtitle"
                  }
                />
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {["GPX", "TCX", "FIT"].map((format) => (
                  <span
                    className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold tracking-wide text-secondary"
                    key={format}
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
            <button
              className="w-full max-w-xs rounded-full bg-primary-container px-8 py-3 font-headline text-xs font-bold text-on-primary-container transition-[background-color,transform] hover:cursor-pointer hover:bg-surface-container-highest active:scale-[0.98] sm:w-auto"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                open();
              }}
            >
              <FormattedMessage id="upload.button" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
