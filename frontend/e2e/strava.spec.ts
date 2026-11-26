import type { Page, Route } from "@playwright/test";
import type { StravaDashboard } from "../src/features/strava/types";
import { expect, test } from "./fixtures";

/**
 * A settled dashboard: ride total known and import state not running, so the
 * page does not start background progress polling or refresh timers.
 */
const dashboardFixture = (
  overrides: Partial<StravaDashboard> = {},
): StravaDashboard => ({
  athlete: {
    append_sign_summary: true,
    display_name: "Ada Rider",
    granted_scopes: ["read", "activity:read_all", "activity:write"],
    profile_image_url: null,
  },
  generatedAt: "2026-11-20T12:00:00.000Z",
  stats: { collectedSigns: 3, processedActivities: 4, totalRides: 10 },
  importState: {
    analyzed_ride_count: 4,
    completed: false,
    full_history_requested: false,
    initial_import_complete: true,
    total_ride_count: 10,
    updated_at: "2026-11-20T12:00:00.000Z",
  },
  signs: [
    { osm_id: 1, tags: { name: "Exampleville" }, lat: 50.0, long: 8.0 },
    { osm_id: 2, tags: { name: "Sampleton" }, lat: 50.1, long: 8.1 },
    { osm_id: 3, tags: { name: "Exampleville" }, lat: 50.2, long: 8.2 },
  ],
  collection: [
    {
      collected_at: "2026-11-18T08:00:00.000Z",
      first_activity_id: 11,
      osm_id: 1,
    },
    {
      collected_at: "2026-11-18T08:00:00.000Z",
      first_activity_id: 11,
      osm_id: 2,
    },
    {
      collected_at: "2026-01-02T08:00:00.000Z",
      first_activity_id: 7,
      osm_id: 3,
    },
  ],
  ...overrides,
});

/** Serves successive dashboard responses; the last one repeats. */
const mockDashboard = async (
  page: Page,
  ...responses: ((route: Route) => Promise<void>)[]
) => {
  let call = 0;
  await page.route("**/api/strava/dashboard", (route) =>
    responses[Math.min(call++, responses.length - 1)](route),
  );
};

const json = (body: unknown) => (route: Route) =>
  route.fulfill({ contentType: "application/json", json: body });
const status = (code: number) => (route: Route) =>
  route.fulfill({ status: code, json: {} });

test.describe("when not connected", () => {
  test.beforeEach(async ({ page }) => {
    await mockDashboard(page, status(401));
    await page.goto("/strava");
  });

  test("asks to connect, carrying the summary choice to Strava", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Connect Strava" }),
    ).toBeVisible();
    const connect = page.getByRole("link", { name: /Continue to Strava/ });
    await expect(connect).toHaveAttribute(
      "href",
      "/api/strava/connect?activity_summary=1",
    );

    await page.getByText("Keep descriptions untouched").click();
    await expect(
      page.getByRole("radio", { name: /Keep descriptions untouched/ }),
    ).toBeChecked();
    await expect(connect).toHaveAttribute(
      "href",
      "/api/strava/connect?activity_summary=0",
    );

    await page.getByText("Add a sign summary", { exact: true }).click();
    await expect(connect).toHaveAttribute(
      "href",
      "/api/strava/connect?activity_summary=1",
    );
  });
});

test("offers a retry when the dashboard fails to load", async ({ page }) => {
  await mockDashboard(page, status(500), json(dashboardFixture()));
  await page.goto("/strava");

  await expect(
    page.getByRole("heading", { name: "Could not load your collection" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();

  await expect(page.getByRole("heading", { name: "Ada Rider" })).toBeVisible();
});

test.describe("when connected", () => {
  test("shows the athlete's collection", async ({ page }) => {
    await mockDashboard(page, json(dashboardFixture()));
    await page.goto("/strava");

    await expect(
      page.getByRole("heading", { name: "Ada Rider" }),
    ).toBeVisible();
    const stats = page.getByRole("region", { name: "Collection statistics" });
    await expect(stats).toContainText("Signs collected");
    await expect(stats).toContainText("4/ 10");
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "4",
    );
    await expect(
      page.getByRole("heading", { name: "Collected signs" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Density" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.getByRole("button", { name: "Density" }).click();
    await expect(page.getByRole("button", { name: "Density" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("shows an empty map before any ride is processed", async ({ page }) => {
    await mockDashboard(
      page,
      json(
        dashboardFixture({
          signs: [],
          collection: [],
          stats: { collectedSigns: 0, processedActivities: 0, totalRides: 0 },
        }),
      ),
    );
    await page.goto("/strava");

    await expect(
      page.getByText(
        "Signs appear here after a Strava ride has been processed.",
      ),
    ).toBeVisible();
  });

  test("turns activity summaries off", async ({ page }) => {
    const off = dashboardFixture({
      athlete: { ...dashboardFixture().athlete!, append_sign_summary: false },
    });
    await mockDashboard(page, json(dashboardFixture()), json(off));
    let patchBody: unknown;
    await page.route("**/api/strava/preferences", async (route) => {
      expect(route.request().method()).toBe("PATCH");
      patchBody = route.request().postDataJSON();
      await route.fulfill({ status: 204 });
    });
    await page.goto("/strava");

    const toggle = page.getByRole("switch", {
      name: "Do not add a sign summary",
    });
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await toggle.click();

    await expect(
      page.getByRole("switch", { name: "Add a sign summary" }),
    ).toHaveAttribute("aria-checked", "false");
    await expect(
      page.getByText("Strava activity descriptions are not changed."),
    ).toBeVisible();
    expect(patchBody).toEqual({ appendSignSummary: false });
  });

  test("reports a preference that could not be saved", async ({ page }) => {
    await mockDashboard(page, json(dashboardFixture()));
    await page.route("**/api/strava/preferences", status(500));
    await page.goto("/strava");

    await page
      .getByRole("switch", { name: "Do not add a sign summary" })
      .click();

    await expect(
      page.getByText("Could not save your preference."),
    ).toBeVisible();
    await expect(
      page.getByRole("switch", { name: "Do not add a sign summary" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("asks to reconnect when write access is missing", async ({ page }) => {
    await mockDashboard(
      page,
      json(
        dashboardFixture({
          athlete: {
            ...dashboardFixture().athlete!,
            granted_scopes: ["read", "activity:read_all"],
          },
        }),
      ),
    );
    await page.goto("/strava");

    await expect(page.getByRole("switch")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Reconnect to add summaries" }),
    ).toHaveAttribute("href", "/api/strava/connect?activity_summary=1");
  });

  test("checks older rides", async ({ page }) => {
    const complete = dashboardFixture({
      stats: { collectedSigns: 5, processedActivities: 10, totalRides: 10 },
      importState: {
        ...dashboardFixture().importState!,
        analyzed_ride_count: 10,
        completed: true,
        full_history_requested: true,
      },
    });
    await mockDashboard(page, json(dashboardFixture()), json(complete));
    let importRequests = 0;
    await page.route("**/api/strava/import", async (route) => {
      expect(route.request().method()).toBe("POST");
      importRequests++;
      await route.fulfill({ status: 202, json: {} });
    });
    await page.goto("/strava");

    await expect(page.getByText("Older rides not scanned")).toBeVisible();
    await page.getByRole("button", { name: "Check older rides" }).click();

    await expect(page.getByText("All rides checked")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Check older rides" }),
    ).toHaveCount(0);
    expect(importRequests).toBe(1);
  });

  test("reports a failed import", async ({ page }) => {
    await mockDashboard(page, json(dashboardFixture()));
    await page.route("**/api/strava/import", status(500));
    await page.goto("/strava");

    await page.getByRole("button", { name: "Check older rides" }).click();

    await expect(page.getByText("Could not import activities.")).toBeVisible();
  });
});
