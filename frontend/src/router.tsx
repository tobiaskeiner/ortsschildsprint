import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Navigate,
} from "@tanstack/react-router";
import RootLayout from "./routes/RootLayout";
import {
  LEGAL_NOTICE_ROUTE,
  PRIVACY_POLICY_ROUTE,
  WORKFLOW_ROUTE,
} from "./utils/routes";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => <Navigate replace to="/" />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./steps/Home")),
});

const workflowRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: WORKFLOW_ROUTE.slice(1),
  component: lazyRouteComponent(() => import("./routes/RouteWorkflowPage")),
});

const workflowEditRoute = createRoute({
  getParentRoute: () => workflowRoute,
  path: "edit",
  component: () => null,
});

const workflowExportRoute = createRoute({
  getParentRoute: () => workflowRoute,
  path: "export",
  component: () => null,
});

const legalNoticeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: LEGAL_NOTICE_ROUTE.slice(1),
  component: lazyRouteComponent(() => import("./components/LegalPage")),
});

const privacyPolicyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: PRIVACY_POLICY_ROUTE.slice(1),
  component: lazyRouteComponent(() => import("./components/PrivacyPolicy")),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  workflowRoute.addChildren([workflowEditRoute, workflowExportRoute]),
  legalNoticeRoute,
  privacyPolicyRoute,
]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
