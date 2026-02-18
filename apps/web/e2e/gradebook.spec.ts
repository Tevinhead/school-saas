import { test, expect } from "./helpers/fixtures";

test.describe("Gradebook", () => {
  test("gradebook page loads", async ({ page }) => {
    await page.goto("/gradebook");
    await expect(page.getByRole("heading", { name: /gradebook/i })).toBeVisible();
  });

  test("class and section selectors are visible", async ({ page }) => {
    await page.goto("/gradebook");
    await expect(page.getByText("Class")).toBeVisible();
    await expect(page.getByText("Section")).toBeVisible();
  });

  test("grading scales page loads", async ({ page }) => {
    await page.goto("/gradebook/grading-scales");
    await expect(page.locator("body")).toBeVisible();
  });
});
