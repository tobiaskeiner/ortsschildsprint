import { use, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import useFileParse from "../hooks/useParseFile";
import { GeoJsonContext } from "../context/GeoJsonContext";

interface RouteFileDropOptions {
  onParseSuccessful?: () => void;
}

const detectTouchDevice = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0);

/**
 * Drop/select handling for a GPX, TCX or FIT route file. The caller decides
 * which element becomes the drop target via `getRootProps`.
 */
export const useRouteFileDrop = ({
  onParseSuccessful,
}: RouteFileDropOptions) => {
  const geoContext = use(GeoJsonContext);
  const { parseFile } = useFileParse();
  const [isTouchDevice, setIsTouchDevice] = useState(detectTouchDevice);

  // Bumped on every new drop and on cancel; in-flight parses check it and
  // discard their results, so only the newest run may write state.
  const runIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateIsTouchDevice = () => setIsTouchDevice(detectTouchDevice());

    mediaQuery.addEventListener("change", updateIsTouchDevice);

    return () => {
      mediaQuery.removeEventListener("change", updateIsTouchDevice);
    };
  }, []);

  const dropzone = useDropzone({
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
    noDrag: isTouchDevice,
    accept: { "application/xml": [".gpx", ".tcx", ".fit"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        return;
      }
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

  return {
    ...dropzone,
    isTouchDevice,
    cancelParse,
    isProcessing: geoContext?.parseState === "inProgress",
    fileName: geoContext?.rawFileName,
  };
};
