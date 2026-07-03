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
      theme_color: "#14532d",
    });
    expect(manifest.icons.some((icon) => icon.src.includes("icon"))).toBe(true);

    await page.goto("/demo-tipprunde/spieltage/demo-spieltag");
    await expect(page.getByRole("link", { name: "Jetzt tippen" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rangliste" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Aktueller Spieltag" })).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    await expect(
      page.getByText("Keine Verbindung. Tipps koennen nur online gespeichert werden."),
    ).toBeVisible();
  });
});
