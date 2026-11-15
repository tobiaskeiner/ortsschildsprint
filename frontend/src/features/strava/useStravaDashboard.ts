import { useCallback, useEffect, useState } from "react";
import type { StravaDashboard } from "./types";

type DashboardResponse = StravaDashboard | null;

let inFlightDashboardRequest: Promise<DashboardResponse> | undefined;

const requestDashboard = (force = false) => {
  if (!force && inFlightDashboardRequest) return inFlightDashboardRequest;

  const request = fetch("/api/strava/dashboard", {
    credentials: "include",
  })
    .then(async (response) => {
      if (response.status === 401) return null;
      if (!response.ok) throw new Error();
      return (await response.json()) as StravaDashboard;
    })
    .finally(() => {
      if (inFlightDashboardRequest === request) {
        inFlightDashboardRequest = undefined;
      }
    });
  inFlightDashboardRequest = request;
  return request;
};

const requestDashboardProgress = async () => {
  const response = await fetch("/api/strava/dashboard/progress", {
    credentials: "include",
  });
  if (!response.ok) throw new Error();
  return (await response.json()) as { totalRides: number | null };
};

/**
 * Shared in-flight request and progress polling for the dashboard. Sharing
 * the request makes React Strict Mode's duplicate effect invocation harmless.
 */
export const useStravaDashboard = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | undefined>();
  const [hasError, setHasError] = useState(false);

  const loadDashboard = useCallback(
    (force = false) => requestDashboard(force),
    [],
  );

  const reloadDashboard = useCallback(async () => {
    try {
      const dashboard = await loadDashboard(true);
      setDashboard(dashboard);
      setHasError(false);
      return dashboard;
    } catch (error) {
      setHasError(true);
      throw error;
    }
  }, [loadDashboard]);

  useEffect(() => {
    let active = true;
    void loadDashboard()
      .then((dashboard) => {
        if (!active) return;
        setDashboard(dashboard);
        setHasError(false);
      })
      .catch(() => {
        if (active) setHasError(true);
      });
    return () => {
      active = false;
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (dashboard?.stats.totalRides !== null) return;

    let active = true;
    let timer: number | undefined;
    const poll = async () => {
      try {
        const { totalRides } = await requestDashboardProgress();
        if (!active) return;
        if (totalRides !== null) {
          setDashboard((current) =>
            current
              ? {
                  ...current,
                  importState: current.importState
                    ? {
                        ...current.importState,
                        total_ride_count: totalRides,
                      }
                    : null,
                  stats: { ...current.stats, totalRides },
                }
              : current,
          );
          return;
        }
      } catch {
        // Keep the dashboard usable and retry progress in the background.
      }

      if (active) timer = window.setTimeout(poll, 5_000);
    };

    timer = window.setTimeout(poll, 1_500);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [dashboard]);

  useEffect(() => {
    if (
      !dashboard?.importState?.full_history_requested ||
      dashboard.importState.completed
    ) {
      return;
    }
    const refresh = window.setInterval(() => {
      void reloadDashboard().catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(refresh);
  }, [
    dashboard?.importState?.completed,
    dashboard?.importState?.full_history_requested,
    reloadDashboard,
  ]);

  return { dashboard, error: hasError, reloadDashboard };
};
