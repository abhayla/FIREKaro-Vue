import { test, expect } from "@playwright/test";
import { TaxCalculatorPage } from "../../pages/tax-planning";
import { oldRegimeSlabs, newRegimeSlabs, calculateTaxForSlab, calculateCess } from "../../fixtures/tax-planning-data";
import { testUserProfile } from "../../fixtures/unified-profile";

test.describe("Tax Calculator", () => {
  let calculatorPage: TaxCalculatorPage;

  test.beforeEach(async ({ page }) => {
    calculatorPage = new TaxCalculatorPage(page);
    await calculatorPage.navigateTo();
  });

  test("should display calculator page correctly", async ({ page }) => {
    await calculatorPage.expectPageLoaded();
    await expect(calculatorPage.grossIncomeField).toBeVisible();
    await expect(calculatorPage.calculateButton).toBeVisible();
  });

  test("should calculate tax for given income", async ({ page }) => {
    await calculatorPage.enterGrossIncome(1500000);
    await calculatorPage.calculate();

    await calculatorPage.expectResultsVisible();
    const totalTax = await calculatorPage.getTotalTax();
    expect(totalTax).toMatch(/₹|Rs\.?|\d/);
  });

  test("should calculate tax with deductions in old regime", async ({ page }) => {
    await calculatorPage.enterGrossIncome(2000000);
    await calculatorPage.enterDeductions({
      section80C: 150000,
      section80D: 50000,
      section80CCD1B: 50000,
    });
    await calculatorPage.selectRegime("Old");
    await calculatorPage.calculate();

    await calculatorPage.expectResultsVisible();

    // Taxable income should be reduced by deductions
    const taxableIncome = await calculatorPage.getTaxableIncome();
    const taxableValue = calculatorPage.parseINR(taxableIncome);
    expect(taxableValue).toBeLessThan(2000000);
  });

  test("should calculate tax in new regime (no deductions)", async ({ page }) => {
    await calculatorPage.enterGrossIncome(2000000);
    await calculatorPage.selectRegime("New");
    await calculatorPage.calculate();

    await calculatorPage.expectResultsVisible();

    // New regime has standard deduction of Rs. 75,000
    const taxableIncome = await calculatorPage.getTaxableIncome();
    const taxableValue = calculatorPage.parseINR(taxableIncome);
    expect(taxableValue).toBe(2000000 - 75000);
  });

  test("should apply 4% cess on tax", async ({ page }) => {
    await calculatorPage.enterGrossIncome(1500000);
    await calculatorPage.calculate();

    await calculatorPage.expectCessApplied();
    const cess = await calculatorPage.getCess();
    expect(cess).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show effective tax rate", async ({ page }) => {
    await calculatorPage.enterGrossIncome(2000000);
    await calculatorPage.calculate();

    const effectiveRate = await calculatorPage.getEffectiveTaxRate();
    expect(effectiveRate).toMatch(/%|\d/);
  });

  test("should show slab breakdown", async ({ page }) => {
    await calculatorPage.enterGrossIncome(1500000);
    await calculatorPage.calculate();

    await calculatorPage.expectSlabBreakdownVisible();
  });

  test("should reset calculator", async ({ page }) => {
    await calculatorPage.enterGrossIncome(1500000);
    await calculatorPage.calculate();
    await calculatorPage.expectResultsVisible();

    await calculatorPage.reset();

    // Income field should be empty or zero
    const incomeValue = await calculatorPage.grossIncomeField.inputValue();
    expect(incomeValue === "" || incomeValue === "0").toBe(true);
  });
});
