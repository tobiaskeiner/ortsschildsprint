import type { Page } from "@playwright/test";
import {
  EXAMPLEVILLE,
  expect,
  gpxRoute,
  mockSigns,
  test,
  uploadRoute,
} from "./fixtures";

const openMenu = async (page: Page) => {
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Close menu", exact: true }).first(),
  ).toHaveAttribute("aria-expanded", "true");
};

test.describe("routing", () => {
  test("sends deep links into the workflow home when no route is loaded", async ({
    page,
  }) => {
    for (const path of ["/route", "/route/edit", "/route/export"]) {
      await page.goto(path);
      await expect(page).toHaveURL("/");
    }
  });

  test("redirects unknown paths home", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: "City-limit signs along your route" }),
    ).toBeVisible();
  });

  test("returns home from the workflow via the logo", async ({ page }) => {
    await mockSigns(page, [EXAMPLEVILLE]);
    await uploadRoute(page, gpxRoute());

    await page.getByRole("button", { name: "Go to Home" }).click();
    await expect(page).toHaveURL("/");
  });

  test("links to the Strava dashboard from home", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: "Connect Strava" }),
    ).toHaveAttribute("href", "/strava");
  });
});

test.describe("menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens the legal notice", async ({ page }) => {
    await openMenu(page);
    await page.getByRole("button", { name: "Legal Notice" }).click();

    await expect(page).toHaveURL("/legal-notice");
    await expect(
      page.getByRole("heading", { level: 1, name: "Legal Notice" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Legal Notice" }),
    ).toHaveCount(0);
  });

  test("opens the privacy policy", async ({ page }) => {
    await openMenu(page);
    await page.getByRole("button", { name: "Privacy Policy" }).click();

    await expect(page).toHaveURL("/privacy-policy");
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
  });

  test("links to external projects in a new tab", async ({ page }) => {
    await openMenu(page);

    for (const [name, href] of [
      ["Strava", "https://www.strava.com/clubs/ortsschildsprint"],
      ["GitHub Project", "https://github.com/tobiaskeiner/ortsschildsprint"],
    ]) {
      const link = page.getByRole("link", { name, exact: true });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });

  test("closes from its toggle", async ({ page }) => {
    await openMenu(page);
    await page
      .getByRole("button", { name: "Close menu", exact: true })
      .first()
      .click();

    await expect(page.getByText("Menu", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open menu", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  test("closes when clicking outside", async ({ page }) => {
    await openMenu(page);
    await expect(page.getByText("Menu", { exact: true })).toBeVisible();

    await page.mouse.click(20, 400);
    await expect(page.getByText("Menu", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Open menu", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("preferences", () => {
  test("switches the language to German and remembers it", async ({ page }) => {
    await page.goto("/");
    await openMenu(page);
    await page.getByRole("button", { name: "German" }).click();

    const germanTitle = page.getByRole("heading", {
      name: "Ortsschilder entlang deiner Route",
    });
    await expect(germanTitle).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");

    await page.reload();
    await expect(germanTitle).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Route auswählen" }),
    ).toBeVisible();
  });

  test("switches to dark mode and remembers it", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");

    await openMenu(page);
    await page.getByRole("button", { name: "Dark mode" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await openMenu(page);
    await expect(
      page.getByRole("button", { name: "Dark mode" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("for a German browser", () => {
  test.use({ locale: "de-DE" });

  test("defaults to German", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Ortsschilder entlang deiner Route" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });
});

test.describe("for a dark system color scheme", () => {
  test.use({ colorScheme: "dark" });

  test("starts in dark mode", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
