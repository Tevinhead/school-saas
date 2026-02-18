import { test, expect } from "./helpers/fixtures";

test.describe("Portal", () => {
  test("portal home loads", async ({ page }) => {
    await page.goto("/portal");
    await expect(page.locator("body")).toBeVisible();
  });

  test("portal grades page loads", async ({ page }) => {
    await page.goto("/portal/grades");
    await expect(page.locator("body")).toBeVisible();
  });

  test("portal attendance page loads", async ({ page }) => {
    await page.goto("/portal/attendance");
    await expect(page.locator("body")).toBeVisible();
  });

  test("portal fees page loads", async ({ page }) => {
    await page.goto("/portal/fees");
    await expect(page.locator("body")).toBeVisible();
  });

  test("portal announcements page loads", async ({ page }) => {
    await page.goto("/portal/announcements");
    await expect(page.locator("body")).toBeVisible();
  });

  test("portal report cards page loads", async ({ page }) => {
    await page.goto("/portal/report-cards");
    await expect(page.locator("body")).toBeVisible();
  });
});
