import { expect, test } from "@playwright/test";

test.describe("US2 Einladungslink Beitritt", () => {
  test("shows invitation management and join screens with Tipprunden-Nickname", async ({
    page,
  }) => {
    await page.goto("/admin/tipprunden/demo-tipprunde");
    await expect(page.getByRole("heading", { name: "Einladungslink" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Neuen Link generieren" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "QR-Code" })).toBeVisible();

    await page.goto("/einladungen/demo-token");
    await expect(page.getByRole("heading", { name: "Tipprunde beitreten" })).toBeVisible();
    await expect(page.getByLabel("Tipprunden-Nickname")).toBeVisible();
    await expect(page.getByRole("button", { name: "Beitreten" })).toBeVisible();
  });
});
