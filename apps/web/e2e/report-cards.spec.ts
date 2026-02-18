import { test, expect } from "./helpers/fixtures";

test.describe("Report Cards", () => {
  test("report cards list page loads", async ({ page }) => {
    await page.goto("/report-cards");
    await expect(page.getByRole("heading", { name: /report card/i })).toBeVisible();
  });

  test("create report cards page loads", async ({ page }) => {
    await page.goto("/report-cards/create");
    await expect(page.locator("body")).toBeVisible();
  });
});
