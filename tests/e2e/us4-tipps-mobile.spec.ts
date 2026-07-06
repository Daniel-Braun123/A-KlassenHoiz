import { expect, test } from "@playwright/test";

test.describe("US4 Mobile Spieltag tippen", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows a mobile-first Spieltag Tipp flow with per-Spiel Tippfrist", async ({ page }) => {
    await page.goto("/demo-tipprunde/spieltage/demo-spieltag");

    await expect(page.getByLabel("Spieltag auswählen")).toBeVisible();
    await expect(page.getByText("FC Hoiz")).toBeVisible();
    await expect(page.getByText("TSV Spät")).toBeVisible();
    await expect(page.getByText("LIVE")).toBeVisible();

    const openCard = page.getByTestId("tipp-card-spiel-offen");
    await expect(openCard.getByLabel("Heimtore")).toBeVisible();
    await expect(openCard.getByLabel("Auswärtstore")).toBeVisible();
    await expect(openCard.getByRole("button", { name: "Tipp speichern" })).toBeVisible();
  });
});
