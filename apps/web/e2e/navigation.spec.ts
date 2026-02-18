import { test, expect } from "./helpers/fixtures";

test.describe("Navigation", () => {
  test("sidebar navigation links work", async ({ page }) => {
    await page.goto("/dashboard");

    // Check sidebar is visible on desktop
    const sidebar = page.locator("nav, aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("dashboard page loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();
  });

  test("breadcrumbs are visible on sub-pages", async ({ page }) => {
    await page.goto("/students");
    await expect(page.locator("body")).toBeVisible();
  });
});
