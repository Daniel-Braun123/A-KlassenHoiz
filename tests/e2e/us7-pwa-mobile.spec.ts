import { expect, test } from "@playwright/test";

test.describe("US7 PWA und mobile Navigation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("exposes PWA metadata, quick mobile links and a no-connection message", async ({ page }) => {
    const manifestResponse = await page.request.get("/manifest.webmanifest");
    expect(manifestResponse.ok()).toBe(true);
    const manifest = (await manifestResponse.json()) as {
      name: string;
      short_name: string;
      display: string;
      theme_color: string;
      icons: Array<{ src: string; purpose?: string }>;
    };

    expect(manifest).toMatchObject({
      name: "A-KlassenHoiz",
      short_name: "KlassenHoiz",
      display: "standalone",
      theme_color: "#07111f",
    });
    expect(manifest.icons.some((icon) => icon.src.includes("icon"))).toBe(true);

    await page.goto("/demo-tipprunde/spieltage/demo-spieltag");
    await expect(page.getByRole("link", { name: "Zur Home-Übersicht" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tippen" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rangliste" })).toBeVisible();

    await page.context().setOffline(true);
    await expect(
      page.getByText("Keine Verbindung. Tipps können nur online gespeichert werden."),
    ).toBeVisible();
    await page.context().setOffline(false);
  });
});
