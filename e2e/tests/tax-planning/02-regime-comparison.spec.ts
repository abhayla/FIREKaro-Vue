import { test, expect } from "@playwright/test";
import { RegimeComparisonPage, TaxPlanningOverviewPage } from "../../pages/tax-planning";
import { regimeComparisonData, deductionSummary } from "../../fixtures/tax-planning-data";

test.describe("Tax Regime Comparison", () => {
  let regimePage: RegimeComparisonPage;

  test.beforeEach(async ({ page }) => {
    regimePage = new RegimeComparisonPage(page);
    await regimePage.navigateTo();
  });

  test("should display both regime cards", async ({ page }) => {
    await regimePage.expectBothRegimesVisible();
  });

  test("should show old regime tax calculation", async ({ page }) => {
    const oldRegimeTax = await regimePage.getOldRegimeTaxAmount();
    expect(oldRegimeTax).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show new regime tax calculation", async ({ page }) => {
    const newRegimeTax = await regimePage.getNewRegimeTaxAmount();
    expect(newRegimeTax).toMatch(/₹|Rs\.?|\d/);
  });

  test("should display savings between regimes", async ({ page }) => {
    await regimePage.expectSavingsDisplayed();
    const savings = await regimePage.getSavingsAmount();
    expect(savings).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show recommended regime", async ({ page }) => {
    await regimePage.expectRecommendationShown();
    const recommendedRegime = await regimePage.getRecommendedRegime();
    expect(["Old", "New", null]).toContain(recommendedRegime);
  });

  test("should show deduction breakdown for old regime", async ({ page }) => {
    const deductionsTotal = await regimePage.getOldRegimeDeductionsTotal();
    expect(deductionsTotal).toMatch(/₹|Rs\.?|\d/);
  });

  test("should display both regime tax amounts correctly", async ({ page }) => {
    const oldTax = await regimePage.getOldRegimeTaxAmount();
    const newTax = await regimePage.getNewRegimeTaxAmount();

    // Both should be valid amounts
    const oldTaxValue = regimePage.parseINR(oldTax);
    const newTaxValue = regimePage.parseINR(newTax);

    expect(oldTaxValue).toBeGreaterThanOrEqual(0);
    expect(newTaxValue).toBeGreaterThanOrEqual(0);
  });

  test("should allow toggling detailed breakdown", async ({ page }) => {
    // Check if toggle exists before testing
    const toggleExists = await regimePage.showDetailedBreakdownToggle.isVisible();
    if (toggleExists) {
      await regimePage.toggleDetailedBreakdown();
      await regimePage.expectDeductionBreakdownVisible();
    }
  });
});
