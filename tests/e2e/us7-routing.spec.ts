import { expect, test } from "@playwright/test";

test.describe("US7 Login-Routing und Tipprunden-Wechsel", () => {
  test("shows 0/1/multiple Tipprunden states and remembers the active Tipprunde", async ({
    page,
  }) => {
    await page.goto("/?demoTipprunden=0");
    await expect(page.getByRole("heading", { name: "Meine Tipprunden" })).toBeVisible();
    await expect(page.getByText("Du bist noch in keiner Tipprunde.")).toBeVisible();

    await page.goto("/?demoTipprunden=1");
    await expect(page).toHaveURL(/\/demo-tipprunde\/spieltage\/demo-spieltag$/);

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/?demoTipprunden=mehrere");
    await expect(page.getByRole("heading", { name: "Tipprunde waehlen" })).toBeVisible();
    await page.getByRole("link", { name: "Zweite Tipprunde oeffnen" }).click();
    await expect(page).toHaveURL(/\/zweite-tipprunde\/spieltage\/demo-spieltag$/);
    await expect(
      page.evaluate(() => localStorage.getItem("a-klassenhoiz.active-tipprunde")),
    ).resolves.toBe("zweite-tipprunde");

    await page.goto("/demo-tipprunde/rangliste");
    await expect(page.getByRole("navigation", { name: "Mobile Navigation" })).toBeVisible();
    await page.getByLabel("Tipprunde wechseln").selectOption("zweite-tipprunde");
    await expect(page).toHaveURL(/\/zweite-tipprunde\/spieltage\/demo-spieltag$/);
  });
});
