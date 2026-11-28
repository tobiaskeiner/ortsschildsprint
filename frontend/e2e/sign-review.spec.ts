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

const signRow = (page: Page, name: string) =>
  page.locator("section ol").getByRole("button", { name });

const expectEmptyExport = async (page: Page) => {
  await expect(
    page.getByRole("heading", { name: "No signs in this file" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Download/ })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Upload a route" }),
  ).toBeVisible();
};

test("shows sign details and removes a deleted sign from the export", async ({
  page,
}) => {
  await mockSigns(page, [EXAMPLEVILLE]);
  await uploadRoute(page, gpxRoute());
  await findSigns(page);

  await expect(signMarkers(page)).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "1 sign along the route" }),
  ).toBeVisible();
  await signMarkers(page).click();
  await expect(signRow(page, "Exampleville")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("link", { name: "Street View" })).toHaveAttribute(
    "href",
    /viewpoint=50\.005,8\.005$/,
  );

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(signMarkers(page)).toHaveCount(0);
  await expect(signRow(page, "Exampleville")).toHaveCount(0);

  // Removing signs by hand is not the same as finding none.
  await expect(
    page.getByRole("heading", {
      name: "No city limit signs detected along this route",
    }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Proceed to export" }).click();
  await expect(page).toHaveURL("/route/export");
  await expectEmptyExport(page);
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
  await expectEmptyExport(page);
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
      page.getByText(
        "1 sign still needs a pass chosen. If you continue, its first pass is used.",
      ),
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

    await page.getByRole("radio", { name: "gpx" }).check();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download .gpx" }).click();
    const gpx = (await readDownload(await download)).toString("utf8");
    expect(gpx).toContain("<name>Twiceburg</name>");
  });

  test("exports every selected route pass to FIT", async ({ page }) => {
    await expect(page.getByText("Choose a pass")).toBeVisible();
    await signMarkers(page).click();
    await expect(signRow(page, "Twiceburg")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.getByRole("checkbox", { name: /^Pass 1/ }).check();
    await expect(page.getByText("Choose a pass")).toHaveCount(0);
    await page.getByRole("checkbox", { name: /^Pass 2/ }).check();

    // Resolved, so the warning no longer interrupts.
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await expect(page).toHaveURL("/route/export");

    await expect(page.getByRole("radio", { name: "fit" })).toBeChecked();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download .fit" }).click();
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
    await signRow(page, "Twiceburg").click();
    await page.getByRole("checkbox", { name: /^Pass 2/ }).check();
    await page.getByRole("checkbox", { name: /^Pass 1/ }).check();
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(2);
    await page.getByRole("button", { name: "Proceed to export" }).click();

    await page.getByRole("radio", { name: "gpx" }).check();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download .gpx" }).click();
    const gpx = (await readDownload(await download)).toString("utf8");

    expect(gpx.match(/<wpt /g)).toHaveLength(1);
  });
});

test.describe("detected town entries and exits", () => {
  // STRAIGHT_TRACK heads north-east, about 33° from north
  const entry = { insideBearing: 33, confidence: "high" as const };
  const exit = { insideBearing: 213, confidence: "high" as const };

  test("keeps a detected entry", async ({ page }) => {
    await mockSigns(page, [{ ...EXAMPLEVILLE, direction: entry }]);
    await uploadRoute(page, gpxRoute());
    await findSigns(page);

    await expect(page.getByText("Town entry")).toBeVisible();
    await expect(
      page.getByText(/We've left town exits out of the export/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await expect(page).toHaveURL("/route/export");
    await expect(page.getByRole("button", { name: /^Download/ })).toBeVisible();
  });

  test("skips a detected exit until it is added back", async ({ page }) => {
    await mockSigns(page, [{ ...EXAMPLEVILLE, direction: exit }]);
    await uploadRoute(page, gpxRoute());
    await findSigns(page);

    await expect(page.getByText("Town exit · not exported")).toBeVisible();
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await expectEmptyExport(page);

    await page.getByRole("button", { name: "Back to review" }).click();
    await page
      .getByRole("button", { name: "Add Exampleville back to the export" })
      .click();
    await expect(page.getByText("Town exit", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await page.getByRole("radio", { name: "gpx" }).check();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download .gpx" }).click();
    const gpx = (await readDownload(await download)).toString("utf8");
    expect(gpx).toContain("<name>Exampleville</name>");
  });

  test("chooses the entering pass of a sign passed twice", async ({ page }) => {
    // inside lies north: the outbound leg enters, the way back leaves
    await mockSigns(page, [
      {
        ...TWICE_PASSED_SIGN,
        direction: { insideBearing: 0, confidence: "high" },
      },
    ]);
    await uploadRoute(
      page,
      gpxRoute({ name: "Out and Back", points: OUT_AND_BACK_TRACK }),
    );
    await findSigns(page);

    await expect(page.getByText("Choose a pass")).toHaveCount(0);
    await signRow(page, "Twiceburg").click();
    await expect(
      page.getByRole("checkbox", { name: /^Pass 1.*Town entry/ }),
    ).toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: /^Pass 2.*Town exit/ }),
    ).not.toBeChecked();

    // resolved, so no warning before the export
    await page.getByRole("button", { name: "Proceed to export" }).click();
    await expect(page).toHaveURL("/route/export");
  });

  test("flags a sign passed twice when one pass is unclear", async ({
    page,
  }) => {
    // north through the sign (entry), later west across it (perpendicular)
    await mockSigns(page, [
      {
        ...TWICE_PASSED_SIGN,
        direction: { insideBearing: 0, confidence: "high" },
      },
    ]);
    await uploadRoute(
      page,
      gpxRoute({
        name: "Crossing",
        points: [
          [50.0, 8.0],
          [50.01, 8.0],
          [50.005, 8.003],
          [50.005, 7.997],
        ],
      }),
    );
    await findSigns(page);

    await expect(
      page.getByText("Direction unclear, please check"),
    ).toBeVisible();
    await signRow(page, "Twiceburg").click();
    await expect(
      page.getByRole("checkbox", { name: /^Pass 1.*Town entry/ }),
    ).toBeChecked();
    await expect(
      page.getByRole("checkbox", { name: /^Pass 2.*Direction unclear/ }),
    ).not.toBeChecked();
  });

  test("leaves a low-confidence sign to the rider", async ({ page }) => {
    await mockSigns(page, [
      { ...EXAMPLEVILLE, direction: { ...exit, confidence: "low" } },
    ]);
    await uploadRoute(page, gpxRoute());
    await findSigns(page);

    await expect(
      page.getByText(/The data can't tell town entries/),
    ).toBeVisible();
    await expect(page.getByText(/Town exit/)).toHaveCount(0);
  });
});
