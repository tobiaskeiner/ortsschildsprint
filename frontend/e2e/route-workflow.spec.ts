import { Decoder, Stream } from "@garmin/fitsdk";
import type { Page } from "@playwright/test";
import {
  EXAMPLEVILLE,
  expect,
  gpxRoute,
  mockSigns,
  readDownload,
  tcxRoute,
  test,
  uploadRoute,
} from "./fixtures";

const goToExport = async (page: Page) => {
  await page.getByRole("button", { name: "Find signs" }).click();
  await expect(page).toHaveURL("/route/edit");
  await page.getByRole("button", { name: "Proceed to export" }).click();
  await expect(page).toHaveURL("/route/export");
};

const chooseFormat = (page: Page, format: "fit" | "gpx" | "tcx") =>
  page.getByRole("radio", { name: format }).check();

const downloadAs = async (page: Page, format: "fit" | "gpx" | "tcx") => {
  await chooseFormat(page, format);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: `Download .${format}` }).click();
  return download;
};

test.beforeEach(async ({ page }) => {
  await mockSigns(page, [EXAMPLEVILLE]);
});

test("uploads a route, reviews its signs, and downloads an enriched GPX", async ({
  page,
}) => {
  await uploadRoute(page, gpxRoute());
  await expect(
    page.getByRole("heading", { name: "Route: Morning Ride" }),
  ).toBeVisible();

  await goToExport(page);
  await expect(
    page.getByRole("list", { name: "City-limit signs in this file" }),
  ).toContainText("Exampleville");
  await expect(page.getByRole("radio", { name: "fit" })).toBeChecked();
  await chooseFormat(page, "gpx");
  await expect(
    page.getByText("Your original .gpx file, with the signs added."),
  ).toBeVisible();

  const download = await downloadAs(page, "gpx");
  expect(download.suggestedFilename()).toBe("Morning Ride.gpx");
  const gpx = (await readDownload(download)).toString("utf8");
  expect(gpx).toContain("<name>Exampleville</name>");
  expect(gpx).toMatch(/<wpt lat="[\d.]+" lon="[\d.]+"/);
});

test("converts an uploaded GPX route to TCX", async ({ page }) => {
  await uploadRoute(page, gpxRoute());
  await goToExport(page);

  const download = await downloadAs(page, "tcx");
  expect(download.suggestedFilename()).toBe("Morning Ride.tcx");
  const tcx = (await readDownload(download)).toString("utf8");
  expect(tcx).toContain("<TrainingCenterDatabase");
  expect(tcx).toContain("<CoursePoint>");
  expect(tcx).toContain("Exampleville");
});

test("converts an uploaded GPX route to a FIT course with a course point", async ({
  page,
}) => {
  await uploadRoute(page, gpxRoute());
  await goToExport(page);

  const download = await downloadAs(page, "fit");
  expect(download.suggestedFilename()).toBe("Morning Ride.fit");
  const fit = await readDownload(download);
  expect(fit.subarray(8, 12).toString("ascii")).toBe(".FIT");

  const decoder = new Decoder(Stream.fromBuffer(fit));
  expect(decoder.checkIntegrity()).toBe(true);
  const { messages, errors } = decoder.read();
  expect(errors).toEqual([]);
  expect(messages.courseMesgs?.[0]?.name).toBe("Morning Ride");
  expect((messages.coursePointMesgs ?? []).map((point) => point.name)).toEqual([
    "Exampleville",
  ]);
});

test("enriches an uploaded TCX route in its original format", async ({
  page,
}) => {
  await uploadRoute(page, tcxRoute());
  await expect(
    page.getByRole("heading", { name: "Route: Evening Loop" }),
  ).toBeVisible();
  await goToExport(page);
  await chooseFormat(page, "tcx");
  await expect(
    page.getByText("Your original .tcx file, with the signs added."),
  ).toBeVisible();

  const download = await downloadAs(page, "tcx");
  expect(download.suggestedFilename()).toBe("Evening Loop.tcx");
  const tcx = (await readDownload(download)).toString("utf8");
  expect(tcx).toContain("<Name>Evening Loop</Name>");
  expect(tcx).toContain("<CoursePoint>");
  expect(tcx).toContain("Exampleville");
});

test("converts an uploaded TCX route to GPX", async ({ page }) => {
  await uploadRoute(page, tcxRoute());
  await goToExport(page);
  await chooseFormat(page, "gpx");
  await expect(
    page.getByText(
      "Built from your .tcx file. Some of its metadata may be lost.",
    ),
  ).toBeVisible();

  const download = await downloadAs(page, "gpx");
  expect(download.suggestedFilename()).toBe("Evening Loop.gpx");
  const gpx = (await readDownload(download)).toString("utf8");
  expect(gpx).toContain("<gpx");
  expect(gpx).toContain("Exampleville");
});

test("replaces the route from the preview step", async ({ page }) => {
  await uploadRoute(page, gpxRoute());
  await expect(
    page.getByRole("heading", { name: "Route: Morning Ride" }),
  ).toBeVisible();

  await page
    .locator('input[type="file"]')
    .setInputFiles(gpxRoute({ name: "Second Ride", fileName: "second.gpx" }));

  await expect(page).toHaveURL("/route");
  await expect(
    page.getByRole("heading", { name: "Route: Second Ride" }),
  ).toBeVisible();
});

test("moves between workflow steps with the stepper", async ({ page }) => {
  await uploadRoute(page, gpxRoute());
  const stepper = page.getByLabel("Progress Stepper");

  await stepper.getByRole("button", { name: "Export" }).click();
  await expect(page).toHaveURL("/route/export");
  await stepper.getByRole("button", { name: "Edit" }).click();
  await expect(page).toHaveURL("/route/edit");
  await stepper.getByRole("button", { name: "Upload" }).click();
  await expect(page).toHaveURL("/route");
  await expect(
    page.getByRole("heading", { name: "Route: Morning Ride" }),
  ).toBeVisible();
});
