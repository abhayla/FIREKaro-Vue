import { test, expect } from "@playwright/test";
import { TaxDeductionsPage } from "../../pages/tax-planning";
import { deductionsData, deductionSummary, hraExemptionData } from "../../fixtures/tax-planning-data";

/**
 * Tax Deductions Tests
 *
 * Structure: Tax Details tab → Deductions accordion section
 * The deductions section is now inside an accordion in the Tax Details tab
 */
test.describe("Tax Deductions (80C, 80D, HRA)", () => {
  let deductionsPage: TaxDeductionsPage;

  test.beforeEach(async ({ page }) => {
    deductionsPage = new TaxDeductionsPage(page);
    // navigateTo() now handles: go to page → click Tax Details tab → expand Deductions accordion
    await deductionsPage.navigateTo();
  });

  test("should display deductions page correctly", async ({ page }) => {
    await deductionsPage.expectPageLoaded();
    await deductionsPage.expectSection80CVisible();
    await deductionsPage.expectSection80DVisible();
  });

  test("should show Section 80C total and limit", async ({ page }) => {
    await deductionsPage.expectSection80CVisible();
    const section80CTotal = await deductionsPage.getSection80CTotal();
    expect(section80CTotal).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show Section 80D total", async ({ page }) => {
    await deductionsPage.expectSection80DVisible();
    const section80DTotal = await deductionsPage.getSection80DTotal();
    expect(section80DTotal).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show total deductions summary", async ({ page }) => {
    await deductionsPage.expectTotalDeductionsVisible();
    const totalDeductions = await deductionsPage.getTotalDeductions();
    expect(totalDeductions).toMatch(/₹|Rs\.?|\d/);
  });

  test("should show 80C progress within limit", async ({ page }) => {
    await deductionsPage.expect80CWithinLimit();
  });

  test("should add new deduction", async ({ page }) => {
    await deductionsPage.openAddDeductionForm();
    await deductionsPage.expectDeductionFormVisible();

    // Fill and save deduction
    await deductionsPage.addDeduction("PPF", 50000, "PPF Contribution");
    await deductionsPage.expectDeductionFormClosed();
  });

  test("should cancel deduction form", async ({ page }) => {
    await deductionsPage.openAddDeductionForm();
    await deductionsPage.expectDeductionFormVisible();
    await deductionsPage.cancelAddDeduction();
    await deductionsPage.expectDeductionFormClosed();
  });
});
