export const HOME_ROUTE = "/";
export const WORKFLOW_ROUTE = "/route";
export const WORKFLOW_EDIT_ROUTE = "/route/edit";
export const WORKFLOW_EXPORT_ROUTE = "/route/export";
export const LEGAL_NOTICE_ROUTE = "/legal-notice";
export const PRIVACY_POLICY_ROUTE = "/privacy-policy";

export type WorkflowStepKey = "preview" | "edit" | "export";

const trimTrailingSlash = (pathname: string) => {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export const normalizePathname = (pathname: string) =>
  trimTrailingSlash(pathname || HOME_ROUTE);

export const isWorkflowRoute = (pathname: string) =>
  normalizePathname(pathname).startsWith(WORKFLOW_ROUTE);

export const getWorkflowStepFromPathname = (
  pathname: string,
): WorkflowStepKey | null => {
  switch (normalizePathname(pathname)) {
    case WORKFLOW_ROUTE:
      return "preview";
    case WORKFLOW_EDIT_ROUTE:
      return "edit";
    case WORKFLOW_EXPORT_ROUTE:
      return "export";
    default:
      return null;
  }
};
