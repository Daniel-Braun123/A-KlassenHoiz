import { expect, test } from "@playwright/test";

test.describe("US3 Admin Spielplanpflege", () => {
  test("shows the Liga-first maintenance flow for Vereine, Spieltage and Spiele", async ({
    page,
  }) => {
    await page.goto("/admin/tipprunden/demo-tipprunde/spielplan");

    await expect(page.getByRole("heading", { name: "Spielplan verwalten" })).toBeVisible();
    await expect(page.getByText("Liga", { exact: true })).toBeVisible();
    await expect(page.getByText("A-Klasse Nord")).toBeVisible();

    await expect(page.getByRole("tab", { name: "Vereine" })).toBeVisible();
    await page.getByRole("tab", { name: "Vereine" }).click();
    await expect(page.getByLabel("Vereinsname", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Logo-URL", { exact: true })).toBeVisible();
    await expect(page.getByText("FC Hoiz")).toBeVisible();

    await page.getByRole("tab", { name: "Spieltage & Spiele" }).click();
    await expect(page.getByRole("heading", { name: "Spieltage & Spiele" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Abschnitt" })).toContainText("Hinrunde");
    await expect(page.getByRole("button", { name: "Nächsten Spieltag anlegen" })).toBeVisible();

    await expect(page.getByRole("combobox", { name: "Heimverein" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Auswärtsverein" })).toBeVisible();
    await expect(page.getByLabel("Anpfiff-Datum")).toBeVisible();
    await expect(page.getByLabel("Anpfiff-Uhrzeit")).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Status" })).toContainText("verschoben");
    await expect(page.locator(".spiel-list .spiel-row").first().locator("strong")).toHaveCount(0);
    await expect(page.locator(".spiel-list .spiel-matchup").first()).toBeVisible();
    await expect(page.locator(".spiel-list .spiel-center").first()).toContainText(/\d{2}:\d{2}/);

    const heimverein = page.locator("#heimverein");
    const auswaertsverein = page.locator("#auswaertsverein");
    await heimverein.selectOption("verein-1");
    await expect(auswaertsverein).not.toContainText("FC Hoiz");
    await auswaertsverein.selectOption("verein-2");
    await page.getByLabel("Anpfiff-Datum").fill("2026-08-08");
    await page.getByLabel("Anpfiff-Uhrzeit").fill("15:30");
    await page.getByRole("button", { name: "Spiel anlegen" }).click();
    await expect(page.getByRole("status")).toContainText("Spiel angelegt.");
    await expect(heimverein).toHaveValue("");
    await expect(auswaertsverein).toHaveValue("");

    await page.getByRole("tab", { name: "Ergebnisse" }).click();
    await expect(page.locator("#ergebnisse-heading")).toBeVisible();
  });

  test("shows LIVE in the Spielplan list while a Spiel is currently running", async ({ page }) => {
    await page.addInitScript(`
      const fixedNow = new Date("2026-08-01T14:00:00.000Z").valueOf();
      const RealDate = Date;

      class MockDate extends RealDate {
        constructor(...args) {
          if (args.length === 0) {
            super(fixedNow);
            return;
          }
          super(...args);
        }

        static now() {
          return fixedNow;
        }
      }

      window.Date = MockDate;
    `);

    await page.goto("/admin/tipprunden/demo-tipprunde/spielplan");
    await page.getByRole("tab", { name: "Spieltage & Spiele" }).click();

    const firstSpiel = page.locator(".spiel-list .spiel-row").first();
    await expect(firstSpiel.locator(".spiel-center")).toContainText("LIVE");
    await expect(firstSpiel.locator(".live-dot")).toBeVisible();
  });
});
