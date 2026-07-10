import { expect, test } from "@playwright/test";

const responsiveCases = [
  { name: "tippen-320", width: 320, height: 720, path: "/demo-tipprunde/spieltage/demo-spieltag" },
  { name: "home-360", width: 360, height: 800, path: "/?demoTipprunden=mehrere" },
  { name: "admin-390", width: 390, height: 844, path: "/admin/tipprunden/demo-tipprunde" },
  { name: "rangliste-430", width: 430, height: 900, path: "/demo-tipprunde/rangliste" },
  { name: "tippen-768", width: 768, height: 900, path: "/demo-tipprunde/spieltage/demo-spieltag" },
  { name: "admin-1024", width: 1024, height: 900, path: "/admin/tipprunden/demo-tipprunde" },
  { name: "home-1280", width: 1280, height: 900, path: "/?demoTipprunden=mehrere" },
  { name: "rangliste-1440", width: 1440, height: 900, path: "/demo-tipprunde/rangliste" },
] as const;

test.describe("Responsive Redesign", () => {
  for (const responsiveCase of responsiveCases) {
    test(`${responsiveCase.name} stays inside the viewport`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: responsiveCase.width, height: responsiveCase.height });
      await page.goto(responsiveCase.path);
      await expect(page.locator("main")).toBeVisible();

      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      await page.screenshot({
        path: testInfo.outputPath(`${responsiveCase.name}.png`),
        fullPage: true,
      });
    });
  }
});
