import { expect, test } from "@playwright/test";

test.describe("Theme Mode", () => {
  test.use({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });

  test("follows the system by default and applies stored preferences early", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

    await page.evaluate(() => {
      window.localStorage.setItem("a-klassenhoiz.theme", "light");
    });
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  });
});
