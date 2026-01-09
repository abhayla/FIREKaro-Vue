import { test, expect } from "@playwright/test";
import { InvestmentReportsPage } from "../../pages/investments";
import { portfolioSummary, assetAllocation } from "../../fixtures/investments-data";

test.describe("Investment Reports", () => {
  let reportsPage: InvestmentReportsPage;

  test.beforeEach(async ({ page }) => {
    reportsPage = new InvestmentReportsPage(page);
    await reportsPage.navigateTo();
  });

  test("should display reports page correctly", async ({ page }) => {
    await reportsPage.expectPageLoaded();
    await reportsPage.expectSummaryVisible();
  });

  test("should show asset allocation chart", async ({ page }) => {
    await reportsPage.expectAllocationChartVisible();
    // Should show equity vs debt breakdown
    await expect(page.getByText(/Equity/i)).toBeVisible();
    await expect(page.getByText(/Debt/i)).toBeVisible();
  });

  test("should show performance metrics", async ({ page }) => {
    // Should show returns metrics
    const xirr = await reportsPage.getXIRR();
    expect(xirr).toMatch(/%/); // Percentage values
  });

  test("should have export button visible", async ({ page }) => {
    await reportsPage.expectExportButtonVisible();
  });

  test("should export report as PDF", async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent("download");
    await reportsPage.exportToPDF();
    const download = await downloadPromise;

    // Verify download started
    expect(download.suggestedFilename()).toContain(".pdf");
  });
});
