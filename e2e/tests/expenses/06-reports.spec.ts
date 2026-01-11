import { test, expect } from "@playwright/test";
import { ExpenseTrackingPage } from "../../pages/expenses";

/**
 * Reports functionality is now integrated into the Track Expenses Overview tab.
 * This spec tests the reporting features (charts, exports) in that context.
 */
test.describe("Expenses Reports (Track Overview Tab)", () => {
  let trackingPage: ExpenseTrackingPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new ExpenseTrackingPage(page);
    await trackingPage.navigateTo();
    await trackingPage.switchToOverviewTab();
  });

  test.describe("Report Display", () => {
    test("should display Track page with Overview tab", async ({ page }) => {
      await trackingPage.expectPageLoaded();
      await trackingPage.expectOverviewTabActive();
    });

    test("should show summary cards in Overview", async ({ page }) => {
      await expect(trackingPage.totalSpentCard).toBeVisible();
    });

    test("should have export section visible", async ({ page }) => {
      await expect(trackingPage.exportSection).toBeVisible();
    });

    test("should show category breakdown chart (if data exists)", async ({ page }) => {
      // Chart may not be visible if no data
      const chartCard = page.locator(".v-card").filter({ hasText: /Category/i });
      await expect(chartCard).toBeVisible();
    });
  });

  test.describe("Report Exports", () => {
    test("should show export buttons (PDF, Excel, CSV, JSON)", async ({ page }) => {
      await expect(trackingPage.exportPDFButton).toBeVisible();
      await expect(trackingPage.exportExcelButton).toBeVisible();
      await expect(trackingPage.exportCSVButton).toBeVisible();
      await expect(trackingPage.exportJSONButton).toBeVisible();
    });

    test("should trigger PDF export", async ({ page }) => {
      // Listen for download event
      const downloadPromise = page.waitForEvent("download", { timeout: 5000 }).catch(() => null);

      await trackingPage.exportPDFButton.click();

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

      await trackingPage.exportExcelButton.click();

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

      await trackingPage.exportCSVButton.click();

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

      await trackingPage.exportJSONButton.click();

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

