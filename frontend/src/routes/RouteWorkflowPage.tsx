import { Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { use, useState } from "react";
import { GeoJsonContext } from "../context/GeoJsonContext";
import { FormattedMessage } from "react-intl";
import Edit from "../steps/Edit";
import Export from "../steps/Export";
import Preview from "../steps/Preview";
import {
  HOME_ROUTE,
  WORKFLOW_EDIT_ROUTE,
  WORKFLOW_EXPORT_ROUTE,
  WORKFLOW_ROUTE,
  getWorkflowStepFromPathname,
} from "../utils/routes";

const RouteWorkflowPage: React.FC = () => {
  const geoContext = use(GeoJsonContext);
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const step = getWorkflowStepFromPathname(pathname);
  // The route the user deleted signs from. Kept as the route object so a new
  // upload (a new object) shows the "no signs detected" notice again.
  const [routeWithDeletedSigns, setRouteWithDeletedSigns] =
    useState<GeoJSON.FeatureCollection>();
  const navigateTo = (to: string) => {
    void navigate({ to: to as never });
  };

  if (!step || !geoContext) {
    return <Navigate replace to={HOME_ROUTE} />;
  }

  if (!geoContext.geoJson) {
    if (geoContext.parseState === "inProgress") {
      return (
        <div className="flex min-h-[50vh] items-center justify-center rounded-[1.75rem] bg-surface-container-lowest p-6 shadow-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-container border-t-primary" />
            <p className="text-center font-medium text-secondary">
              <FormattedMessage id="upload.processing" />
            </p>
          </div>
        </div>
      );
    }

    return <Navigate replace to={HOME_ROUTE} />;
  }

  if (step === "preview") {
    return (
      <Preview
        onContinue={() => navigateTo(WORKFLOW_EDIT_ROUTE)}
        onReplaced={() => navigateTo(WORKFLOW_ROUTE)}
      />
    );
  }

  if (step === "edit") {
    return (
      <Edit
        noSignsFound={
          geoContext.parseState === "Done" &&
          geoContext.signs != null &&
          geoContext.signs.length < 1 &&
          routeWithDeletedSigns !== geoContext.geoJson
        }
        onBack={() => navigateTo(WORKFLOW_ROUTE)}
        onContinue={() => navigateTo(WORKFLOW_EXPORT_ROUTE)}
        onSignDeleted={() => setRouteWithDeletedSigns(geoContext.geoJson)}
      />
    );
  }

  return (
    <Export
      onBack={() => navigateTo(WORKFLOW_EDIT_ROUTE)}
      onUploadNew={() => navigateTo(HOME_ROUTE)}
    />
  );
};

export default RouteWorkflowPage;
