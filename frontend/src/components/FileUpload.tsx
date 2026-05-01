import { use, useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import useFileParse from "../hooks/useParseFile";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { FormattedMessage } from "react-intl";

interface FileUploaderProps {
  setParseSuccessful: (state: boolean) => void;
}

const FileUploader: React.FC<FileUploaderProps> = (props) => {
  const { setParseSuccessful } = props;
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
    <div className="rounded-[1.75rem] bg-surface-container-lowest p-3 shadow-lg">
      <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed border-outline-variant/40 bg-surface-container-low px-4 py-4 text-center transition-all hover:border-primary-container sm:min-h-[28rem] sm:px-8 md:aspect-[4/3] md:min-h-0 md:px-10">
        <Dropzone
          maxFiles={1}
          noClick
          noDrag={isTouchDevice}
          accept={{ "application/xml": [".gpx", ".tcx", ".fit"] }}
          onDrop={(acceptedFiles) =>
            void parseFile({
              file: acceptedFiles[0],
              setParseSuccessful,
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
                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-primary sm:h-20 sm:w-20">
                      <span
                        className="material-symbols-outlined"
                        data-icon="upload_file"
                      >
                        upload_file
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="mb-1 font-headline text-lg font-bold uppercase sm:text-xl">
                        <FormattedMessage id="upload.title" />
                      </p>
                      <p className="text-xs font-medium uppercase tracking-widest text-secondary">
                        <FormattedMessage
                          id={
                            isTouchDevice
                              ? "upload.subtitle.mobile"
                              : "upload.subtitle"
                          }
                        />
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1">
                          <span className="h-2 w-2 rounded-full bg-primary"></span>
                          <span className="font-headline text-[10px] font-black">
                            .GPX
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1">
                          <span className="h-2 w-2 rounded-full bg-secondary"></span>
                          <span className="font-headline text-[10px] font-black">
                            .TCX
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1">
                          <span className="h-2 w-2 rounded-full bg-tertiary"></span>
                          <span className="font-headline text-[10px] font-black">
                            .FIT
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="w-full max-w-xs rounded-full bg-primary-container px-8 py-3 font-bold uppercase text-on-primary-container shadow-sm transition-transform hover:scale-105 hover:cursor-pointer sm:w-auto"
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
