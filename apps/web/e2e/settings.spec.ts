import { test, expect } from "./helpers/fixtures";

test.describe("Settings", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("School Information")).toBeVisible();
  });

  test("academic years page loads", async ({ page }) => {
    await page.goto("/settings/academic-years");
    await expect(page.getByText("Academic Years")).toBeVisible();
  });

  test("grade levels page loads", async ({ page }) => {
    await page.goto("/settings/grade-levels");
    await expect(page.getByText("Grade Levels")).toBeVisible();
  });

  test("subjects page loads", async ({ page }) => {
    await page.goto("/settings/subjects");
    await expect(page.getByText("Subjects")).toBeVisible();
  });
});
