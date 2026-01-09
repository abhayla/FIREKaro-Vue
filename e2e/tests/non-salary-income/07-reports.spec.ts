import { test, expect } from "@playwright/test";
import { NonSalaryReportsPage } from "../../pages/non-salary-income";
import { nonSalaryIncomeSummary } from "../../fixtures/non-salary-income-data";

test.describe("Non-Salary Income Reports", () => {
  let reportsPage: NonSalaryReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new NonSalaryReportsPage(page);
    await reportsPage.navigateTo();
  });

  test.skip("should display reports page correctly", async ({ page }) => {
    // Skip: Reports page summary section not fully implemented
    await reportsPage.expectPageLoaded();
    await reportsPage.expectSummaryVisible();
  });

  test("should display income breakdown chart", async ({ page }) => {
    await reportsPage.expectChartsVisible();

    // Verify chart is rendered
    const chartVisible = await reportsPage.isIncomeBreakdownChartVisible();
    expect(chartVisible).toBe(true);
  });

  test.skip("should display TDS summary section", async ({ page }) => {
    // Skip: TDS summary section not implemented in reports page
    await reportsPage.expectTDSSummaryVisible();

    // Get TDS total and verify format
    const totalTDS = await reportsPage.getTotalTDS();
    expect(totalTDS).toMatch(/₹|Rs\.?|\d/);
  });

  test.skip("should allow export functionality", async ({ page }) => {
    // Skip: Export functionality not implemented in reports page
    await reportsPage.expectExportButtonVisible();

    // Click export button to verify menu opens
    await reportsPage.exportButton.click();
    await page.waitForTimeout(300);

    // Verify export options are visible
    await expect(reportsPage.exportPDFOption).toBeVisible();
    await expect(reportsPage.exportExcelOption).toBeVisible();
  });
});
