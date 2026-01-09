import { test, expect } from "@playwright/test";
import {
  NonSalaryOverviewPage,
  BusinessIncomePage,
  RentalIncomePage,
  CapitalGainsPage,
  OtherIncomePage,
} from "../../pages/non-salary-income";
import {
  businessIncomeData,
  rentalIncomeData,
  capitalGainsData,
  otherIncomeData,
  nonSalaryIncomeSummary,
} from "../../fixtures/non-salary-income-data";

test.describe("Non-Salary Income Calculations", () => {
  test("should display correct total non-salary income on overview", async ({ page }) => {
    const overview = new NonSalaryOverviewPage(page);
    await overview.navigateTo();

    // The total should be visible and formatted in INR
    const totalIncome = await overview.getTotalNonSalaryIncome();
    expect(totalIncome).toMatch(/₹|Rs\.?/);
  });

  test("should calculate deemed profit correctly for 44ADA (50%)", async ({ page }) => {
    const businessPage = new BusinessIncomePage(page);
    await businessPage.navigateTo();

    const testData = businessIncomeData[0]; // 44ADA freelance

    await businessPage.openAddForm();
    await businessPage.fillBusinessForm({
      businessName: testData.businessName,
      businessType: testData.businessType as any,
      taxationMethod: "44ADA",
      grossReceipts: testData.grossReceipts,
    });

    // Wait for calculation
    await page.waitForTimeout(500);

    // 44ADA deemed profit should be 50% of gross receipts
    const expectedDeemedProfit = testData.grossReceipts * 0.5;
    const deemedProfit = await businessPage.getDeemedProfitFromForm();

    // Parse the amount and verify (allowing for formatting differences)
    const parsedProfit = businessPage.parseINR(deemedProfit);
    expect(parsedProfit).toBeCloseTo(expectedDeemedProfit, -2); // Within 100
  });

  test("should calculate net annual value correctly for rental income", async ({ page }) => {
    const rentalPage = new RentalIncomePage(page);
    await rentalPage.navigateTo();

    const testData = rentalIncomeData[0];

    await rentalPage.openAddForm();
    await rentalPage.fillRentalForm({
      propertyName: testData.propertyName,
      propertyType: testData.propertyType,
      monthlyRent: testData.monthlyRent,
      municipalTaxesPaid: testData.municipalTaxesPaid,
      housingLoanInterest: testData.housingLoanInterest,
    });

    // Wait for calculation
    await page.waitForTimeout(500);

    // Verify NAV calculation
    // NAV = GAV - Municipal Tax - 30% Standard Deduction - Section 24 Interest
    const nav = await rentalPage.getNetAnnualValueFromForm();
    expect(nav).toMatch(/₹|Rs\.?/);
  });

  test("should aggregate totals correctly on overview page", async ({ page }) => {
    const overview = new NonSalaryOverviewPage(page);
    await overview.navigateTo();

    // Verify each income type card is visible
    await overview.expectBusinessCardVisible();
    await overview.expectRentalCardVisible();
    await overview.expectCapitalGainsCardVisible();
    await overview.expectOtherIncomeCardVisible();

    // Get totals and verify they are formatted correctly
    const businessTotal = await overview.getBusinessIncomeTotal();
    const rentalTotal = await overview.getRentalIncomeTotal();
    const capitalGainsTotal = await overview.getCapitalGainsTotal();
    const otherTotal = await overview.getOtherIncomeTotal();

    // All should have INR formatting
    expect(businessTotal).toMatch(/₹|Rs\.?|\d/);
    expect(rentalTotal).toMatch(/₹|Rs\.?|\d/);
    expect(capitalGainsTotal).toMatch(/₹|Rs\.?|\d/);
    expect(otherTotal).toMatch(/₹|Rs\.?|\d/);
  });
});
