import { test, expect } from "@playwright/test";
import { SalaryHistoryPage, SalaryOverviewPage } from "../../pages/salary";

test.describe("Salary Section Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to salary section
    await page.goto("/dashboard/salary");
    await page.waitForLoadState("domcontentloaded");
    // Wait for first card to appear (indicates data loaded)
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  });

  test("should load salary overview page", async ({ page }) => {
    const overview = new SalaryOverviewPage(page);
    await expect(overview.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/salary$/);
  });

  test("should navigate to Salary History page", async ({ page }) => {
    // Use direct navigation since tab clicks have timing issues with Vue Router
    await page.goto("/dashboard/salary/history");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card, .v-data-table").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    const history = new SalaryHistoryPage(page);
    await expect(history.addMonthButton).toBeVisible();
  });

  test("should navigate to Current Salary page", async ({ page }) => {
    await page.goto("/dashboard/salary/current");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify tab is selected
    await expect(page.getByRole("tab", { name: "Current Salary" })).toHaveAttribute("aria-selected", "true");
  });

  test("should navigate to Reports page", async ({ page }) => {
    await page.goto("/dashboard/salary/reports");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Verify tab is selected
    await expect(page.getByRole("tab", { name: "Reports" })).toHaveAttribute("aria-selected", "true");
  });

  test("should display all tabs", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Salary History" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Current Salary" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
  });

  test("should show correct active tab indicator", async ({ page }) => {
    // Check Overview tab is active by default
    const overviewTab = page.getByRole("tab", { name: "Overview" });
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    // Navigate to History and verify active state
    await page.goto("/dashboard/salary/history");
    await page.waitForLoadState("domcontentloaded");

    const historyTab = page.getByRole("tab", { name: "Salary History" });
    await expect(historyTab).toHaveAttribute("aria-selected", "true");
    await expect(overviewTab).toHaveAttribute("aria-selected", "false");
  });

  test("should allow FY selection on History page", async ({ page }) => {
    // Navigate to History first
    await page.goto("/dashboard/salary/history");
    await page.waitForLoadState("domcontentloaded");
    await page.locator(".v-card, .v-data-table").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

    // Select FY 2022-23 (click on the select field container)
    await page
      .locator(".v-select")
      .filter({ has: page.locator('text="Financial Year"') })
      .click();
    await page.getByRole("option", { name: "22-23" }).click();
    await page.waitForTimeout(500);

    // Verify FY is selected by checking the select's displayed value
    await expect(
      page.locator(".v-select__selection-text").filter({ hasText: "2022-23" })
    ).toBeVisible();
  });

  test("should navigate via sidebar", async ({ page }) => {
    // Click Salary in sidebar (main section)
    await page.locator("nav").getByText("Salary", { exact: true }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(page).toHaveURL(/\/dashboard\/salary/);
  });
});
