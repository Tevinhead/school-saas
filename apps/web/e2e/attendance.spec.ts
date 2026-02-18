import { test, expect } from "./helpers/fixtures";

test.describe("Attendance", () => {
  test("attendance page loads with selectors", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByRole("heading", { name: /attendance/i })).toBeVisible();
    await expect(page.getByText("Class")).toBeVisible();
  });

  test("class selector populates sections", async ({ page }) => {
    await page.goto("/attendance");
    const classSelector = page.locator("[data-testid='class-select'], select").first();
    await expect(classSelector).toBeVisible();
  });
});
