import { expect, test } from "@playwright/test";

test.describe("Mobile Accessibility", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps mobile Tipp forms and navigation reachable by labels and keyboard", async ({
    page,
  }) => {
    await page.goto("/demo-tipprunde/spieltage/demo-spieltag");

    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );
    await expect(page.getByRole("navigation", { name: "Mobile Navigation" })).toBeVisible();
    await expect(page.getByLabel("Tipprunde wechseln")).toBeVisible();

    const openCard = page.getByTestId("tipp-card-spiel-offen");
    await expect(openCard.getByLabel("Heimtore")).toBeVisible();
    await expect(openCard.getByLabel("Auswärtstore")).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("keeps login and registration forms labelled on mobile", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();

    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Registrieren" })).toBeVisible();
    await expect(page.getByLabel("Anzeigename")).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
  });
});
