import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const OUT = process.env.OUT_DIR ?? ".impeccable/review";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(name, { viewport, theme = "light", locale = "de" }) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
  });
  await context.addInitScript(
    ([themeValue, localeValue]) => {
      window.localStorage.setItem("app-theme", themeValue);
      window.localStorage.setItem("app-locale", localeValue);
    },
    [theme, locale],
  );
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await context.close();
  console.log(`captured ${name}`);
}

await shot("home-desktop-de-light", {
  viewport: { width: 1440, height: 900 },
});
await shot("home-desktop-de-dark", {
  viewport: { width: 1440, height: 900 },
  theme: "dark",
});
await shot("home-desktop-en-light", {
  viewport: { width: 1440, height: 900 },
  locale: "en",
});
await shot("home-mobile-de-light", {
  viewport: { width: 390, height: 844 },
});
await shot("home-mobile-de-dark", {
  viewport: { width: 390, height: 844 },
  theme: "dark",
});

await browser.close();
console.log("done");
