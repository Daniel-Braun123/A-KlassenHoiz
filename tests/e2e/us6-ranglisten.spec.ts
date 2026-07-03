import { expect, test } from "@playwright/test";

test.describe("US6 Ranglisten und Ergebnisse", () => {
  test("shows Gesamt-, Spieltagsrangliste and past Ergebnisse", async ({ page }) => {
    await page.goto("/demo-tipprunde/rangliste");

    await expect(page.getByRole("heading", { name: "Gesamtrangliste" })).toBeVisible();
    await expect(page.getByText("Platz 1")).toHaveCount(2);
    await expect(page.getByText("Platz 3")).toBeVisible();
    await expect(page.getByText("Exakte Tipps")).toBeVisible();
    await expect(page.getByText("Richtige Tordifferenz")).toBeVisible();

    await page.goto("/demo-tipprunde/spieltage/demo-spieltag/rangliste");
    await expect(page.getByRole("heading", { name: "Spieltagsrangliste" })).toBeVisible();
    await expect(page.getByText("Anna")).toBeVisible();
    await expect(page.getByText("Berta")).toBeVisible();

    await page.goto("/demo-tipprunde/ergebnisse");
    await expect(
      page.getByRole("heading", { name: "Vergangene Spieltage und Ergebnisse" }),
    ).toBeVisible();
    await expect(page.getByText("1. Spieltag")).toBeVisible();
    await expect(page.getByText("FC Hoiz")).toBeVisible();
    await expect(page.getByText("2:1")).toBeVisible();
    await expect(page.getByText("Geändertes Ergebnis")).toBeVisible();
  });
});
