export const appRoutes = ["/", "/imprint", "/privacy-policy"] as const;

export type AppRoute = (typeof appRoutes)[number];

export const MAIN_ROUTE: AppRoute = "/";

export function normalizeAppRoute(pathname: string): AppRoute {
  if (!pathname) return MAIN_ROUTE;

  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return appRoutes.find((route) => route === normalizedPath) ?? MAIN_ROUTE;
}
