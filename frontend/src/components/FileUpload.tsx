import { use, useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import useFileParse from "../hooks/useParseFile";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { FormattedMessage } from "react-intl";

interface FileUploaderProps {
  onParseSuccessful?: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = (props) => {
  const { onParseSuccessful } = props;
  const geoContext = use(GeoJsonContext);
  const { parseFile } = useFileParse();
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.matchMedia("(pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0
    );
  });

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

  return (
    <div className="rounded-[1.75rem] bg-surface-container-lowest p-2 shadow-lg sm:p-3">
      <div className="group relative flex min-h-[23rem] flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-outline-variant/60 bg-surface-container-low px-5 py-10 text-center transition-[border-color,background-color] hover:border-primary hover:bg-surface-container sm:min-h-[26rem] sm:px-8 md:min-h-[30rem] md:px-10">
        <Dropzone
          maxFiles={1}
          noClick
          noDrag={isTouchDevice}
          accept={{ "application/xml": [".gpx", ".tcx", ".fit"] }}
          onDrop={(acceptedFiles) =>
            void parseFile({
              file: acceptedFiles[0],
              onSuccess: onParseSuccessful,
            })
          }
        >
          {({ getRootProps, getInputProps, open }) => (
            <section className="w-full">
              <div
                {...getRootProps({
                  className: isTouchDevice ? "w-full" : "w-full cursor-pointer",
                })}
              >
                <input {...getInputProps()} />
                {geoContext?.parseState === "inProgress" ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-container border-t-primary rounded-full animate-spin"></div>
                    <p className="text-secondary font-medium">
                      Processing file...
                    </p>
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
                            isTouchDevice
                              ? "upload.subtitle.mobile"
                              : "upload.subtitle"
                          }
                        />
                      </p>
                    </div>
                    <button
                      className="w-full max-w-xs rounded-full bg-primary-container px-8 py-3 font-headline text-sm font-black text-on-primary-container transition-[background-color,transform] hover:cursor-pointer hover:bg-surface-container-highest active:scale-[0.98] sm:w-auto"
                      type="button"
                      onClick={open}
                    >
                      <FormattedMessage id="upload.button" />
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </Dropzone>
      </div>
    </div>
  );
};

export default FileUploader;
