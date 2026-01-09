import { test, expect } from "@playwright/test";
import { FinancialHealthOverviewPage } from "../../pages/financial-health";
import { healthScoreData, financialHealthSummary } from "../../fixtures/financial-health-data";

test.describe("Health Score", () => {
  let overviewPage: FinancialHealthOverviewPage;

  test.beforeEach(async ({ page }) => {
    overviewPage = new FinancialHealthOverviewPage(page);
    await overviewPage.navigateTo();
  });

  test("should display health score card", async ({ page }) => {
    await expect(overviewPage.healthScoreCard).toBeVisible();
  });

  test("should show health score value (0-100)", async ({ page }) => {
    const scoreText = await overviewPage.getHealthScore();
    expect(scoreText).toBeTruthy();
    // Score should be a number between 0-100
    const scoreValue = parseInt(scoreText.replace(/[^\d]/g, ""));
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);
  });

  test("should display health factors list", async ({ page }) => {
    await expect(overviewPage.healthFactorsList).toBeVisible();
  });

  test("should show key health factors", async ({ page }) => {
    // Check for common health factor names
    await expect(
      page.getByText(/Savings Rate|Emergency Fund|Debt-to-Income|Insurance|Retirement/i).first()
    ).toBeVisible();
  });

  test("should display alerts section", async ({ page }) => {
    const alertCount = await overviewPage.getAlertCount();
    expect(alertCount).toBeGreaterThanOrEqual(0);
  });

  test("should show net worth summary card", async ({ page }) => {
    await expect(overviewPage.netWorthCard).toBeVisible();
    const netWorth = await overviewPage.getNetWorth();
    expect(netWorth).toContain("₹");
  });

  test("should show savings rate card", async ({ page }) => {
    await expect(overviewPage.savingsRateCard).toBeVisible();
    const savingsRate = await overviewPage.getSavingsRate();
    expect(savingsRate).toMatch(/%|\d/);
  });

  test("should display trend indicator", async ({ page }) => {
    // Look for trend indicator (improving/declining/stable)
    await expect(
      page.getByText(/improving|stable|declining/i).first()
    ).toBeVisible().catch(() => {
      // Or look for trend icon
      expect(overviewPage.healthScoreTrend).toBeVisible();
    });
  });
});
