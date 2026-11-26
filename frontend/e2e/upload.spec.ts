import {
  EXAMPLEVILLE,
  expect,
  gpxRoute,
  mockSigns,
  test,
  uploadRoute,
} from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockSigns(page, [EXAMPLEVILLE]);
  await page.goto("/");
});

test("rejects unsupported file types and lets the error be dismissed", async ({
  page,
}) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a route"),
  });

  const alert = page.getByRole("alert");
  await expect(alert).toContainText(
    "This file type is not supported. Choose a GPX, TCX, or FIT file.",
  );
  await expect(page).toHaveURL("/");

  await alert.getByRole("button", { name: "Dismiss error" }).click();
  await expect(alert).toHaveCount(0);
});

test("reports a corrupt FIT file", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "broken.fit",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("definitely not a FIT file"),
  });

  await expect(page.getByRole("alert")).toContainText("Not a valid FIT file.");
  await expect(page).toHaveURL("/");
});

test("recovers from an error with a valid upload", async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({
    name: "broken.fit",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("definitely not a FIT file"),
  });
  await expect(page.getByRole("alert")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(gpxRoute());
  await expect(page).toHaveURL("/route");
  await expect(
    page.getByRole("heading", { name: "Route: Morning Ride" }),
  ).toBeVisible();
});

test("falls back to the file name when a GPX route has no name", async ({
  page,
}) => {
  const file = gpxRoute({ fileName: "unnamed.gpx" });
  file.buffer = Buffer.from(
    file.buffer.toString("utf8").replace(/<metadata>.*<\/metadata>/, ""),
  );
  await uploadRoute(page, file);

  await expect(
    page.getByRole("heading", { name: "Route: unnamed.gpx" }),
  ).toBeVisible();
});

test("shows route facts on the preview step", async ({ page }) => {
  await uploadRoute(page, gpxRoute());

  const routeFile = page.getByRole("region", { name: "Route file" });
  await expect(routeFile).toContainText("GPX");
  await expect(routeFile).toContainText("Point to point");
});
