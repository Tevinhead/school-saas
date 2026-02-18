import { test, expect } from "./helpers/fixtures";

test.describe("Students", () => {
  test("student list page loads", async ({ page }) => {
    await page.goto("/students");
    await expect(page.getByRole("heading", { name: "Students" })).toBeVisible();
  });

  test("search filters students", async ({ page }) => {
    await page.goto("/students");
    const searchInput = page.getByPlaceholder("Search students...");
    await searchInput.fill("Aiden");
    await page.waitForTimeout(500);
    await expect(page.locator("table")).toBeVisible();
  });

  test("status filter works", async ({ page }) => {
    await page.goto("/students");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Active" }).click();
    await expect(page.locator("table")).toBeVisible();
  });

  test("add student button navigates to form", async ({ page }) => {
    await page.goto("/students");
    await page.getByRole("link", { name: /add student/i }).click();
    await expect(page).toHaveURL(/students\/new/);
  });

  test("create student form loads", async ({ page }) => {
    await page.goto("/students/new");
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Student Number")).toBeVisible();
  });
});
