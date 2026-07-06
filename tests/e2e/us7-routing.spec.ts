import { expect, test } from "@playwright/test";

test.describe("US7 Login-Routing und Tipprunden-Auswahl", () => {
  test("shows 0/1/multiple Tipprunden states and remembers the selected Tipprunde", async ({
    page,
  }) => {
    await page.goto("/?demoTipprunden=0");
    await expect(page.getByRole("heading", { name: "Meine Tipprunden" })).toBeVisible();
    await expect(
      page.getByRole("banner", { name: "App Navigation" }).getByLabel("Profil"),
    ).toBeVisible();
    await expect(page.getByText("Du bist noch in keiner Tipprunde.")).toBeVisible();

    await page.goto("/?demoTipprunden=1");
    await expect(page.getByRole("heading", { name: "Meine Tipprunden" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Demo Tipprunde" })).toBeVisible();
    await page.getByRole("link", { name: "Öffnen" }).click();
    await expect(page).toHaveURL(/\/demo-tipprunde\/spieltage\/demo-spieltag$/);

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/?demoTipprunden=mehrere");
    await expect(page.getByRole("heading", { name: "Meine Tipprunden" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zweite Tipprunde" })).toBeVisible();
    await page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "Zweite Tipprunde" }) })
      .getByRole("link", { name: "Öffnen" })
      .click();
    await expect(page).toHaveURL(/\/zweite-tipprunde\/spieltage\/demo-spieltag$/);
    await expect(
      page.evaluate(() => localStorage.getItem("a-klassenhoiz.active-tipprunde")),
    ).resolves.toBe("zweite-tipprunde");

    await page.goto("/demo-tipprunde/rangliste");
    await expect(page.getByRole("navigation", { name: "Mobile Navigation" })).toBeVisible();
    await expect(page.getByLabel("Tipprunde wechseln")).toHaveCount(0);
  });
});
