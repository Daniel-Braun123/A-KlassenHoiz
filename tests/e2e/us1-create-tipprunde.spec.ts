import { expect, test } from "@playwright/test";

test.describe("US1 Tipprunde creation and Admin dashboard", () => {
  test("shows auth pages and the Tipprunde admin overview shell", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Registrieren" })).toBeVisible();
    await expect(page.getByLabel("Anzeigename")).toBeVisible();

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();

    await page.goto("/admin/tipprunden/neu");
    await expect(page.getByRole("heading", { name: "Tipprunde erstellen" })).toBeVisible();
    await expect(page.getByLabel("Tipprunden-Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tipprunde erstellen" })).toBeVisible();

    await page.goto("/admin/tipprunden/demo-tipprunde");
    await expect(page.getByRole("heading", { name: "Tipprunde verwalten" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Archivieren" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Endgueltig loeschen" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Co-Admins" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Spielplan verwalten" })).toHaveAttribute(
      "href",
      "/admin/tipprunden/demo-tipprunde/spielplan",
    );
  });
});
