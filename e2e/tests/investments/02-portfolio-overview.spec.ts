import { test, expect } from "@playwright/test";
import { PortfolioPage, InvestmentsOverviewPage } from "../../pages/investments";
import { portfolioSummary, assetAllocation } from "../../fixtures/investments-data";

test.describe("Portfolio Overview", () => {
  let portfolioPage: PortfolioPage;

  test.beforeEach(async ({ page }) => {
    portfolioPage = new PortfolioPage(page);
    await portfolioPage.navigateTo();
  });

  test("should display portfolio summary cards", async ({ page }) => {
    await expect(portfolioPage.portfolioValueCard).toBeVisible();
    await expect(portfolioPage.dayChangeCard).toBeVisible();
    await expect(portfolioPage.totalGainCard).toBeVisible();
  });

  test("should show total portfolio value", async ({ page }) => {
    const totalValue = await portfolioPage.getPortfolioValue();
    expect(totalValue).toContain("₹");
    // Verify it's a significant amount (> 10L based on fixtures)
    const numericValue = portfolioPage.parseINR(totalValue);
    expect(numericValue).toBeGreaterThan(1000000);
  });

  test("should show total gain amount", async ({ page }) => {
    const totalGain = await portfolioPage.getTotalGain();
    expect(totalGain).toContain("₹");
    const numericValue = portfolioPage.parseINR(totalGain);
    expect(numericValue).toBeGreaterThan(0);
  });

  test("should display asset allocation chart", async ({ page }) => {
    await expect(portfolioPage.allocationChart).toBeVisible();
    // Should show equity and debt segments
    await expect(page.getByText(/Equity/i)).toBeVisible();
    await expect(page.getByText(/Debt/i)).toBeVisible();
  });

  test("should display investment breakdown by type", async ({ page }) => {
    // Should show breakdown cards/sections
    await expect(page.getByText(/Stocks/i)).toBeVisible();
    await expect(page.getByText(/Mutual Funds/i)).toBeVisible();
    await expect(page.getByText(/EPF|PPF/i)).toBeVisible();
    await expect(page.getByText(/NPS/i)).toBeVisible();
  });

  test("should show allocation section", async ({ page }) => {
    await portfolioPage.expectAllocationSectionVisible();
    // Should show equity and debt allocation
    await expect(portfolioPage.equityAllocation).toBeVisible();
    await expect(portfolioPage.debtAllocation).toBeVisible();
  });

  test("should navigate to specific asset type from overview", async ({ page }) => {
    // Click on Stocks breakdown to navigate
    const stocksSection = page.locator("[data-testid='stocks-section'], .v-card:has-text('Stocks')");
    if (await stocksSection.isVisible()) {
      await stocksSection.click();
      await expect(page).toHaveURL(/\/dashboard\/investments\/stocks/);
    }
  });
});
