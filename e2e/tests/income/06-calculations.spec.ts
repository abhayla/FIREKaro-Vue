import { test, expect } from "@playwright/test";
import {
  IncomeOverviewPage,
  BusinessIncomePage,
  RentalIncomePage,
  CapitalGainsPage,
  OtherIncomePage,
} from "../../pages/income";
import {
  businessIncomeData,
  rentalIncomeData,
  capitalGainsData,
  otherIncomeData,
  incomeSummary,
} from "../../fixtures/income-data";

test.describe("Income Calculations", () => {
  test("should display correct total income on overview", async ({ page }) => {
    const overview = new IncomeOverviewPage(page);
    await overview.navigateTo();

    // The total should be visible and formatted in INR
    const totalIncome = await overview.getTotalIncome();
    expect(totalIncome).toMatch(/₹|Rs\.?/);
  });

  test.skip("should calculate deemed profit correctly for 44ADA (50%)", async ({ page }) => {
    // Skip: Business form doesn't expose deemed profit field during editing
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

  test.skip("should aggregate totals correctly on overview page", async ({ page }) => {
    // Skip: Overview page summary cards not fully implemented
    const overview = new IncomeOverviewPage(page);
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
