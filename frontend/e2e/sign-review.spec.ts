import { Decoder, Stream } from "@garmin/fitsdk";
import type { Page } from "@playwright/test";
import {
  EXAMPLEVILLE,
  OUT_AND_BACK_TRACK,
  TWICE_PASSED_SIGN,
  expect,
  gpxRoute,
  mockSigns,
  readDownload,
  signMarkers,
  test,
  uploadRoute,
} from "./fixtures";

const findSigns = async (page: Page) => {
  await page.getByRole("button", { name: "Find signs" }).click();
  await expect(page).toHaveURL("/route/edit");
};

const sprintPoints = (page: Page) =>
  page.getByText("Sprint Points", { exact: true }).locator("..");

test("shows sign details and removes a deleted sign from the export", async ({
  page,
}) => {
  await mockSigns(page, [EXAMPLEVILLE]);
  await uploadRoute(page, gpxRoute());
  await findSigns(page);

  await expect(signMarkers(page)).toHaveCount(1);
  await signMarkers(page).click();
  await expect(
    page.getByRole("heading", { name: "Exampleville" }),
  ).toBeVisible();
  await expect(page.getByText("OSM SIGN ID: #123")).toBeVisible();
  await expect(page.getByText("50.0050 / 8.0050")).toBeVisible();
  await expect(page.getByRole("link", { name: "Street View" })).toHaveAttribute(
    "href",
    /viewpoint=50\.005,8\.005$/,
  );

  await page.getByRole("button", { name: "Delete sign" }).click();
  await expect(signMarkers(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Exampleville" })).toHaveCount(
    0,
  );

  // Removing signs by hand is not the same as finding none.
  await expect(
    page.getByRole("heading", {
      name: "No city limit signs detected along this route",
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Proceed to export" }).click();
  await expect(page).toHaveURL("/route/export");
  await expect(sprintPoints(page)).toContainText("0");

  await page.getByRole("button", { name: "Download Enriched Route" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "No signs available to include in the export.",
  );
});

test("offers to go back or continue when no signs are found", async ({
  page,
}) => {
  await mockSigns(page, []);
  await uploadRoute(page, gpxRoute());
  await findSigns(page);

  const noSigns = page.getByRole("heading", {
    name: "No city limit signs detected along this route",
  });
  await expect(noSigns).toBeVisible();

  await page.getByRole("button", { name: "Back to Upload" }).click();
  await expect(page).toHaveURL("/route");

  await findSigns(page);
  await page.getByRole("button", { name: "Continue to Export anyway" }).click();
  await expect(page).toHaveURL("/route/export");

  await page.getByRole("button", { name: "Download Enriched Route" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "No signs available to include in the export.",
  );
});

test("ignores signs that are not on the route", async ({ page }) => {
  await mockSigns(page, [
    EXAMPLEVILLE,
    {
      id: 9,
      osm_id: 999,
      tags: { name: "Farawayton" },
      lat: 50.009,
      long: 8.0,
    },
  ]);
  await uploadRoute(page, gpxRoute());
  await findSigns(page);

  await expect(signMarkers(page)).toHaveCount(1);
});

test.describe("a sign passed twice on an out-and-back route", () => {
  test.beforeEach(async ({ page }) => {
    await mockSigns(page, [TWICE_PASSED_SIGN]);
    await uploadRoute(
      page,
      gpxRoute({ name: "Out and Back", points: OUT_AND_BACK_TRACK }),
    );
    await findSigns(page);
    await expect(signMarkers(page)).toHaveCount(1);
  });

  test("warns before exporting while the sign is unreviewed", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await expect(
      page.getByRole("heading", { name: "Continue anyway?" }),
    ).toBeVisible();
    await expect(
      page.getByText("1 ambiguous sign still has no clear route assignment."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Back to review" }).click();
    await expect(
      page.getByRole("heading", { name: "Continue anyway?" }),
    ).toHaveCount(0);
    await expect(page).toHaveURL("/route/edit");

    await page.getByRole("button", { name: "Proceed to export" }).click();
    await page.getByRole("button", { name: "Continue anyway" }).click();
    await expect(page).toHaveURL("/route/export");
  });

  test("exports an unreviewed sign at its first pass after confirming", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await page.getByRole("button", { name: "Continue anyway" }).click();
    await expect(page).toHaveURL("/route/export");

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Enriched Route" }).click();
    const gpx = (await readDownload(await download)).toString("utf8");
    expect(gpx).toContain("<name>Twiceburg</name>");
  });

  test("exports every selected route pass to FIT", async ({ page }) => {
    await signMarkers(page).click();
    await expect(
      page.getByRole("heading", { name: "Twiceburg" }),
    ).toBeVisible();
    await expect(page.getByText("0/2 selected")).toBeVisible();

    await page.getByRole("button", { name: /^OFF Route Pass 1/ }).click();
    await expect(page.getByText("1/2 selected")).toBeVisible();
    await page.getByRole("button", { name: /^OFF Route Pass 2/ }).click();
    await expect(page.getByText("2/2 selected")).toBeVisible();

    // Resolved, so the warning no longer interrupts.
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await expect(page).toHaveURL("/route/export");

    await page.getByText("FIT (Recommended)", { exact: true }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Enriched Route" }).click();
    const fit = await readDownload(await download);

    const { messages } = new Decoder(Stream.fromBuffer(fit)).read();
    expect(
      (messages.coursePointMesgs ?? []).map((point) => point.name),
    ).toEqual(["Twiceburg", "Twiceburg"]);
    const [first, second] = (messages.coursePointMesgs ?? []).map(
      (point) => point.distance!,
    );
    expect(second - first).toBeGreaterThan(200);
  });

  test("exports only the first selected pass to GPX", async ({ page }) => {
    await signMarkers(page).click();
    await page.getByRole("button", { name: /^OFF Route Pass 2/ }).click();
    await page.getByRole("button", { name: /^OFF Route Pass 1/ }).click();
    await expect(page.getByText("2/2 selected")).toBeVisible();
    await page.getByRole("button", { name: "Proceed to export" }).click();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Enriched Route" }).click();
    const gpx = (await readDownload(await download)).toString("utf8");

    expect(gpx.match(/<wpt /g)).toHaveLength(1);
  });
});
