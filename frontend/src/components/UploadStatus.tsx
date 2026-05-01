import { use } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";

const UploadStatus: React.FC = () => {
  const geoContext = use(GeoJsonContext);

  return (
    <div className="mt-8 bg-surface-container-high rounded-xl p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-outline-variant/40 pb-3">
        <span className="text-label-md font-label uppercase tracking-widest text-secondary font-bold">
          Protocol
        </span>
        <span className="font-headline font-black text-on-surface">
          GPX / TCX
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-label-md font-label uppercase tracking-widest text-secondary font-bold">
          Status
        </span>
        {geoContext?.parseState === "Done" && (
          <span className="flex items-center gap-2 font-headline font-black text-success">
            PARSED ROUTE
          </span>
        )}
        {geoContext?.parseState === "pending" && (
          <span className="flex items-center gap-2 font-headline font-black text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            AWAITING INPUT
          </span>
        )}
        {geoContext?.parseState === "inProgress" && (
          <span className="flex items-center gap-2 font-headline font-black text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            PARSING ROUTE
          </span>
        )}
      </div>
    </div>
  );
};

export default UploadStatus;
