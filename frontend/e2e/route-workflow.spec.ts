import { expect, test } from "@playwright/test";

const routeFile = {
  name: "morning-ride.gpx",
  mimeType: "application/gpx+xml",
  buffer: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="playwright" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Morning Ride</name></metadata>
  <trk><name>Morning Ride</name><trkseg>
    <trkpt lat="50.0000" lon="8.0000" />
    <trkpt lat="50.0100" lon="8.0100" />
  </trkseg></trk>
</gpx>`),
};

test("uploads a route, reviews its signs, and downloads an enriched GPX", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("app-locale", "en");
    localStorage.setItem("app-theme", "light");
  });
  await page.route("**/api/signs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: 1,
          osm_id: 123,
          tags: { name: "Exampleville" },
          lat: 50.005,
          long: 8.005,
        },
      ]),
    });
  });

  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(routeFile);

  await expect(page).toHaveURL("/route");
  await expect(
    page.getByRole("heading", { name: "Route: Morning Ride" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go to Editor" }).click();

  await expect(page).toHaveURL("/route/edit");
  await page.getByRole("button", { name: "Proceed to export" }).click();

  await expect(page).toHaveURL("/route/export");
  await expect(page.getByText("Sprint Points")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Enriched Route" }).click();
  const downloadedFile = await download;

  expect(downloadedFile.suggestedFilename()).toBe("Morning Ride.gpx");
  const stream = await downloadedFile.createReadStream();
  let content = "";
  for await (const chunk of stream) {
    content += Buffer.from(chunk as Uint8Array).toString("utf8");
  }
  expect(content).toContain("<name>Exampleville</name>");
});
