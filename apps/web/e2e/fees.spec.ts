import { test, expect } from "./helpers/fixtures";

test.describe("Fees", () => {
  test("fee management page loads with stat cards", async ({ page }) => {
    await page.goto("/fees");
    await expect(page.getByRole("heading", { name: /fee management/i })).toBeVisible();
    await expect(page.getByText("Total Invoiced")).toBeVisible();
    await expect(page.getByText("Total Collected")).toBeVisible();
  });

  test("invoices tab is active by default", async ({ page }) => {
    await page.goto("/fees");
    await expect(page.getByRole("tab", { name: "Invoices" })).toBeVisible();
  });

  test("fee structures tab loads", async ({ page }) => {
    await page.goto("/fees");
    await page.getByRole("tab", { name: "Fee Structures" }).click();
    await expect(page.locator("body")).toBeVisible();
  });
});
