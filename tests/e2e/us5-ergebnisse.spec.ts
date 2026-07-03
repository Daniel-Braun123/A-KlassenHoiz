import { expect, test } from "@playwright/test";

test.describe("US5 Ergebnisverwaltung", () => {
  test("shows Ergebnis entry controls and changed Ergebnis marker", async ({ page }) => {
    await page.goto("/admin/tipprunden/demo-tipprunde/spielplan");

    await expect(page.getByRole("heading", { name: "Ergebnisse" })).toBeVisible();
    await expect(page.getByLabel("Spiel-ID fuer Ergebnis")).toBeVisible();
    await expect(page.getByLabel("Heimtore Ergebnis")).toBeVisible();
    await expect(page.getByLabel("Auswaertstore Ergebnis")).toBeVisible();
    await expect(page.getByLabel("Aenderungsgrund")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ergebnis speichern" })).toBeVisible();
    await expect(page.getByText("Geaendertes Ergebnis")).toBeVisible();
  });
});
