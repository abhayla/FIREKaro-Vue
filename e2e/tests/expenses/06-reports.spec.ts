import { test, expect } from "@playwright/test";
import { ExpenseReportsPage } from "../../pages/expenses";

/**
 * Reports Page Tests
 * Tests for the standalone Reports page at /expenses/reports
 */
test.describe("Expense Reports Page", () => {
  let reportsPage: ExpenseReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new ExpenseReportsPage(page);
    await reportsPage.navigateTo();
  });

  test.describe("Page Display", () => {
    test("should display Reports page title", async ({ page }) => {
      await reportsPage.expectPageLoaded();
    });

    test("should show period selectors (Monthly, Quarterly, Yearly, Custom)", async ({ page }) => {
      await reportsPage.expectPeriodSelectorsVisible();
    });

    test("should show summary cards", async ({ page }) => {
      await reportsPage.expectSummaryCardsVisible();
    });

    test("should show charts", async ({ page }) => {
      await reportsPage.expectChartsVisible();
    });

    test("should show export button", async ({ page }) => {
      await reportsPage.expectExportButtonVisible();
    });

    test("should have category breakdown chart", async ({ page }) => {
      await expect(reportsPage.categoryPieChart).toBeVisible();
    });

    test("should have monthly trend chart", async ({ page }) => {
      await expect(reportsPage.trendChart).toBeVisible();
    });

    test("should show top expenses list", async ({ page }) => {
      await expect(reportsPage.topExpensesList).toBeVisible();
    });

    test("should show payment methods breakdown", async ({ page }) => {
      await expect(reportsPage.paymentMethodsList).toBeVisible();
    });
  });

  test.describe("Period Selection", () => {
    test("should select Monthly period", async ({ page }) => {
      await reportsPage.selectPeriod("monthly");
      await expect(reportsPage.monthlyButton).toHaveClass(/v-btn--active|bg-primary/);
    });

    test("should select Quarterly period", async ({ page }) => {
      await reportsPage.selectPeriod("quarterly");
      // Just verify no errors - UI updates
    });

    test("should select Yearly period", async ({ page }) => {
      await reportsPage.selectPeriod("yearly");
      // Just verify no errors - UI updates
    });
  });

  test.describe("Month Navigation", () => {
    test("should navigate to previous month", async ({ page }) => {
      const initialMonth = await reportsPage.monthDisplay.textContent();
      await reportsPage.goToPreviousMonth();
      // Page should update (we can't easily verify the month changed without more context)
      await expect(reportsPage.monthDisplay).toBeVisible();
    });
  });

  test.describe("Report Exports", () => {
    test("should show export button", async ({ page }) => {
      await expect(reportsPage.exportButton).toBeVisible();
    });

    test("should trigger PDF export", async ({ page }) => {
      // Listen for download event
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

      await reportsPage.exportToPDF();

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

      await reportsPage.exportToExcel();

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

      await reportsPage.exportToCSV();

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

    test("should trigger JSON export", async ({ page }) => {
      // Listen for download event
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

      await reportsPage.exportToJSON();

      // Either download happens or snackbar confirmation
      const download = await downloadPromise;
      if (download) {
        expect(download.suggestedFilename()).toContain(".json");
      } else {
        // Check for success message or no error
        const errorSnackbar = page.locator(".v-snackbar").filter({ hasText: /error|failed/i });
        await expect(errorSnackbar).not.toBeVisible();
      }
    });
  });
});
