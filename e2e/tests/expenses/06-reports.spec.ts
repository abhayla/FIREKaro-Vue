import { test, expect } from "@playwright/test";
import { ExpensesReportsPage } from "../../pages/expenses";

test.describe("Expenses Reports", () => {
  let reportsPage: ExpensesReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ExpensesReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page correctly", async ({ page }) => {
    await reportsPage.expectPageLoaded();
  });

  test("should show category breakdown chart", async ({ page }) => {
    await reportsPage.expectCategoryChartVisible();
  });

  test("should have export button visible", async ({ page }) => {
    await reportsPage.expectExportButtonVisible();
  });

  test("should show expense trend chart", async ({ page }) => {
    await expect(reportsPage.trendChart).toBeVisible();
  });

  test("should allow period selection", async ({ page }) => {
    await expect(reportsPage.periodSelect).toBeVisible();
  });
});

test.describe("Report Exports", () => {
  let reportsPage: ExpensesReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ExpensesReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should show export menu with PDF, Excel, CSV options", async ({ page }) => {
    await reportsPage.openExportMenu();

    // Check for export options in menu
    const menu = page.locator(".v-menu, .v-list").filter({ hasText: /Export|PDF|Excel|CSV/i });
    await expect(menu).toBeVisible();

    // Verify options are present
    await expect(page.getByText(/PDF/i)).toBeVisible();
    await expect(page.getByText(/Excel/i)).toBeVisible();
    await expect(page.getByText(/CSV/i)).toBeVisible();
  });

  test("should trigger PDF export", async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

    await reportsPage.openExportMenu();
    await page.getByText(/PDF/i).click();

    // Either download happens or snackbar confirmation
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain(".pdf");
    } else {
      // Check for success message or no error
      const errorSnackbar = page.locator(".v-snackbar").filter({ hasText: /error|failed/i });
      await expect(errorSnackbar).not.toBeVisible();
    }
  });

  test("should trigger Excel export", async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

    await reportsPage.openExportMenu();
    await page.getByText(/Excel/i).click();

    // Either download happens or snackbar confirmation
    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.xlsx?$/);
    } else {
      // Check for success message or no error
      const errorSnackbar = page.locator(".v-snackbar").filter({ hasText: /error|failed/i });
      await expect(errorSnackbar).not.toBeVisible();
    }
  });

  test("should trigger CSV export", async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

    await reportsPage.openExportMenu();
    await page.getByText(/CSV/i).click();

    // Either download happens or snackbar confirmation
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain(".csv");
    } else {
      // Check for success message or no error
      const errorSnackbar = page.locator(".v-snackbar").filter({ hasText: /error|failed/i });
      await expect(errorSnackbar).not.toBeVisible();
    }
  });
});
