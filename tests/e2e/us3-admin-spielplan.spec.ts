import { expect, test } from "@playwright/test";

test.describe("US3 Admin Spielplanpflege", () => {
  test("shows maintenance controls for Teams, Spieltage and Spiele", async ({ page }) => {
    await page.goto("/admin/tipprunden/demo-tipprunde/spielplan");

    await expect(page.getByRole("heading", { name: "Spielplan verwalten" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Teams/Vereine" })).toBeVisible();
    await expect(page.getByLabel("Teamname", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Logo-URL", { exact: true })).toBeVisible();
    await expect(page.getByText("Fallback-Logo")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Spieltage" })).toBeVisible();
    await expect(page.getByLabel("Spieltag-Name", { exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Abschnitt", exact: true })).toContainText(
      "Hinrunde",
    );
    await expect(page.getByLabel("Sortierung", { exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Spiele" })).toBeVisible();
    await expect(page.getByLabel("Heimteam-ID für Spiel")).toBeVisible();
    await expect(page.getByLabel("Auswärtsteam-ID für Spiel")).toBeVisible();
    await expect(page.getByLabel("Anstoßdatum für Spiel")).toBeVisible();
    await expect(page.getByLabel("Anstoßzeit für Spiel")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Status bearbeiten" })).toContainText(
      "verschoben",
    );
  });
});
