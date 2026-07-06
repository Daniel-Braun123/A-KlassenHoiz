import { expect, test } from "@playwright/test";

test.describe("US5 Ergebnisverwaltung", () => {
  test("uses Spieltag and Spiel selection before Ergebnis entry", async ({ page }) => {
    await page.goto("/admin/tipprunden/demo-tipprunde/spielplan");

    await page.getByRole("tab", { name: "Ergebnisse" }).click();

    await expect(page.getByRole("heading", { name: "Ergebnisse" })).toBeVisible();
    await expect(page.getByLabel("Spieltag")).toBeVisible();
    await expect(page.getByRole("button", { name: "Spiel auswählen" })).toBeVisible();
    await expect(page.getByText("FC Hoiz")).toHaveCount(0);
    await expect(page.getByLabel("Heimtore")).toHaveCount(0);

    await page.getByRole("button", { name: "Spiel auswählen" }).click();
    await expect(page.getByRole("option", { name: /FC Hoiz.*SV Bretterbach/ })).toBeVisible();
    await expect(page.getByText("01.08.2026").first()).toBeVisible();
    await page.getByRole("option", { name: /FC Hoiz.*SV Bretterbach/ }).click();

    await expect(page.getByLabel("Heimtore")).toBeVisible();
    await expect(page.getByLabel("Auswärtstore")).toBeVisible();
    await expect(page.getByLabel("Änderungsgrund")).toHaveCount(0);

    await page.getByRole("button", { name: "Spiel auswählen" }).click();
    await page.getByRole("option", { name: /SV Bretterbach.*FC Hoiz/ }).click();

    await expect(page.getByLabel("Ergebnis 1 zu 1")).toBeVisible();
    await expect(page.getByLabel("Heimtore")).toHaveCount(0);
    await expect(page.getByLabel("Änderungsgrund")).toHaveCount(0);
    await expect(page.getByText("Geändertes Ergebnis")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ergebnis ändern" })).toBeVisible();

    await page.getByRole("button", { name: "Ergebnis ändern" }).click();

    await expect(page.getByLabel("Heimtore")).toBeVisible();
    await expect(page.getByLabel("Änderungsgrund")).toBeVisible();
    await expect(page.getByLabel("Änderungsgrund")).toHaveAttribute("required", "");
    await expect(page.getByText("Geändertes Ergebnis")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ergebnis speichern" })).toBeVisible();
  });
});
