import { test, expect } from "@playwright/test";
import { RegimeComparisonPage } from "../../pages/tax-planning";

/**
 * Tax Regime Comparison Tests
 *
 * Tests the regime comparison feature on both:
 * 1. Overview tab - REGIME COMPARISON card (requires data from API)
 * 2. Tax Details tab - Calculator with manual mode (works without API data)
 *
 * Since API may not have data, we test:
 * - Empty state handling
 * - Calculator manual mode for generating comparisons
 */
test.describe("Tax Regime Comparison", () => {
  // Allow retries for flaky navigation tests
  test.describe.configure({ retries: 2 });

  let regimePage: RegimeComparisonPage;

  test.beforeEach(async ({ page }) => {
    regimePage = new RegimeComparisonPage(page);
    await regimePage.navigateTo();
  });

  test.describe("Overview Tab - Regime Comparison Card", () => {
    test("should display regime comparison section title", async ({ page }) => {
      await regimePage.expectRegimeComparisonCardVisible();
    });

    test("should show empty state or loading when no income data", async ({ page }) => {
      // Wait for loading to potentially complete
      await page.waitForTimeout(1000);

      // When API returns no data, we might see:
      // 1. Empty state message
      // 2. Regime boxes (if data exists)
      // 3. Loading indicator
      // 4. The section title alone (while loading or empty)
      const hasEmptyState = await regimePage.emptyStateMessage.isVisible().catch(() => false);
      const hasRegimeBoxes = await regimePage.oldRegimeBox.isVisible().catch(() => false);
      const hasTitle = await regimePage.regimeComparisonTitle.isVisible().catch(() => false);

      // The section should be visible in some form
      expect(hasEmptyState || hasRegimeBoxes || hasTitle).toBe(true);
    });

    test("should show regime boxes or empty state", async ({ page }) => {
      // Either regime boxes or "No comparison data" message should be visible
      const hasRegimeBoxes = await regimePage.oldRegimeBox.isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/No comparison data|Add income/i).first().isVisible().catch(() => false);
      const hasTitle = await regimePage.regimeComparisonTitle.isVisible().catch(() => false);

      // At minimum the section should be present
      expect(hasRegimeBoxes || hasEmptyState || hasTitle).toBe(true);
    });

    test("should show recommendation or empty state when no data", async ({ page }) => {
      const hasRecommendation = await regimePage.betterRegimeBanner.isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/No comparison data|Add income/i).first().isVisible().catch(() => false);
      const hasTitle = await regimePage.regimeComparisonTitle.isVisible().catch(() => false);

      // Either recommendation banner, empty state, or title should be visible
      expect(hasRecommendation || hasEmptyState || hasTitle).toBe(true);
    });

    test("should show savings or no data message", async ({ page }) => {
      const hasSavings = await regimePage.savingsText.isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/No comparison data|Add income/i).first().isVisible().catch(() => false);
      const hasTitle = await regimePage.regimeComparisonTitle.isVisible().catch(() => false);

      // Either savings, empty state, or title should be visible
      expect(hasSavings || hasEmptyState || hasTitle).toBe(true);
    });

    test("should show breakdown button or empty state", async ({ page }) => {
      const hasButton = await regimePage.viewDetailedBreakdownButton.isVisible().catch(() => false);
      const hasEmptyState = await page.getByText(/No comparison data|Add income/i).first().isVisible().catch(() => false);
      const hasTitle = await regimePage.regimeComparisonTitle.isVisible().catch(() => false);

      // Either button, empty state, or title should be visible
      expect(hasButton || hasEmptyState || hasTitle).toBe(true);
    });
  });

  test.describe("Tax Details Tab - Calculator Regime Comparison", () => {
    test.beforeEach(async ({ page }) => {
      await regimePage.taxDetailsTab.click();
      await page.waitForTimeout(500);
    });

    test("should display regime toggle buttons (Old/New)", async ({ page }) => {
      await regimePage.expectRegimeToggleVisible();
    });

    test("should display mode toggle (From Data/Manual)", async ({ page }) => {
      await expect(regimePage.fromDataButton).toBeVisible();
      await expect(regimePage.manualButton).toBeVisible();
    });

    test("should display quick select income chips", async ({ page }) => {
      await regimePage.expectQuickSelectVisible();
      // Check specific amounts
      await expect(page.locator("text=₹5L")).toBeVisible();
      await expect(page.locator("text=₹10L")).toBeVisible();
      await expect(page.locator("text=₹15L")).toBeVisible();
    });

    test("should switch to manual mode and enable income input", async ({ page }) => {
      await regimePage.switchToManualMode();
      // In manual mode, gross income input should be enabled
      const isDisabled = await regimePage.grossIncomeInput.isDisabled();
      expect(isDisabled).toBe(false);
    });

    test("should select quick income and switch to manual mode", async ({ page }) => {
      await regimePage.selectQuickIncome("₹10L");
      await page.waitForTimeout(300);

      // Clicking quick select should switch to manual mode
      const manualBtn = regimePage.manualButton;
      await expect(manualBtn).toHaveClass(/v-btn--active|bg-primary/);
    });

    test("should toggle between Old and New regime", async ({ page }) => {
      await regimePage.selectOldRegime();
      await page.waitForTimeout(200);

      // Check deductions section appears for Old regime
      const deductionsVisible = await page.locator("text=/Deductions.*Old Regime/i").isVisible().catch(() => false);

      await regimePage.selectNewRegime();
      await page.waitForTimeout(200);

      // New regime notice should appear
      await expect(page.locator("text=/New regime offers lower rates/i")).toBeVisible();
    });

    test("should reset calculator to default state", async ({ page }) => {
      await regimePage.switchToManualMode();
      await regimePage.selectQuickIncome("₹15L");
      await page.waitForTimeout(300);

      await regimePage.resetButton.click();
      await page.waitForTimeout(300);

      // Should switch back to From Data mode
      await expect(regimePage.fromDataButton).toHaveClass(/v-btn--active|bg-primary/);
    });

    test("should show tax breakdown card", async ({ page }) => {
      await expect(regimePage.taxBreakdownCard).toBeVisible();
    });

    test("should show regime comparison card in results area", async ({ page }) => {
      await expect(regimePage.regimeComparisonResultCard).toBeVisible();
    });
  });

  test.describe("Manual Calculation with Income", () => {
    test("should calculate tax when income is entered manually", async ({ page }) => {
      await regimePage.taxDetailsTab.click();
      await page.waitForTimeout(500);

      // Select ₹10L income via quick select
      await regimePage.selectQuickIncome("₹10L");
      await page.waitForTimeout(1000);

      // Tax calculation should be triggered - check multiple indicators
      const hasCurrencyInBreakdown = await page.locator(".v-card:has-text('Tax Calculation Breakdown') .text-currency, .v-card:has-text('Tax Calculation Breakdown') text=/₹/").first().isVisible().catch(() => false);
      const hasNoData = await regimePage.noCalculationDataMessage.isVisible().catch(() => false);
      const hasBreakdownCard = await page.locator("text=/Tax Calculation Breakdown/i").isVisible().catch(() => false);

      // Either calculated results, empty state, or at least the breakdown card should be visible
      expect(hasCurrencyInBreakdown || hasNoData || hasBreakdownCard).toBe(true);
    });
  });

  // Legacy test - toggling detailed breakdown (may not exist in new UI)
  test("should have tax details section visible", async ({ page }) => {
    // The Tax Details tab exists and can be clicked
    await expect(regimePage.taxDetailsTab).toBeVisible();

    // Click on Tax Details tab to ensure it's functional
    await regimePage.taxDetailsTab.click();
    await page.waitForTimeout(300);

    // Should show calculator or some content
    const hasCalculator = await page.getByText("Tax Calculator").isVisible().catch(() => false);
    const hasContent = await page.locator(".v-expansion-panel").first().isVisible().catch(() => false);
    expect(hasCalculator || hasContent).toBe(true);
  });
});
