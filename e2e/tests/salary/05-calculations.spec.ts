import { test, expect } from "@playwright/test";
import { SalaryHistoryPage, SalaryFormPage } from "../../pages/salary";

test.describe("Salary Calculations", () => {
  let historyPage: SalaryHistoryPage;
  let formPage: SalaryFormPage;

  test.beforeEach(async ({ page }) => {
    historyPage = new SalaryHistoryPage(page);
    formPage = new SalaryFormPage(page);
    await historyPage.navigateTo();
  });

  test("should calculate gross = sum of all earnings", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Fill all earnings
    await formPage.basicSalaryInput.fill("50000");
    await formPage.hraInput.fill("25000");
    await formPage.conveyanceInput.fill("1600");
    await formPage.medicalInput.fill("1250");
    await formPage.specialAllowanceInput.fill("15000");
    await formPage.otherAllowancesInput.fill("3000");

    // Gross should be 50000 + 25000 + 1600 + 1250 + 15000 + 3000 = 95,850
    await formPage.expectGrossEarnings("95,850");
  });

  test("should calculate deductions = sum of all deductions", async ({
    page,
  }) => {
    await historyPage.clickAddMonth();

    // Fill all deductions
    await formPage.epfInput.fill("6000");
    await formPage.vpfInput.fill("3000");
    await formPage.professionalTaxInput.fill("200");
    await formPage.tdsInput.fill("5000");

    // Total deductions = 6000 + 3000 + 200 + 5000 = 14,200
    const deductionsText = await formPage.getTotalDeductions();
    expect(deductionsText).toContain("14,200");
  });

  test("should calculate net = gross - deductions", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Fill earnings (total: 85000)
    await formPage.basicSalaryInput.fill("50000");
    await formPage.hraInput.fill("25000");
    await formPage.specialAllowanceInput.fill("10000");

    // Fill deductions (total: 11200)
    await formPage.epfInput.fill("6000");
    await formPage.professionalTaxInput.fill("200");
    await formPage.tdsInput.fill("5000");

    // Net should be 85000 - 11200 = 73800
    await formPage.expectNetSalary("73,800");
  });

  test("should handle zero earnings correctly", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Only fill basic, others stay at 0
    await formPage.basicSalaryInput.fill("50000");

    // Gross should just be basic
    await formPage.expectGrossEarnings("50,000");
  });

  test("should handle zero deductions correctly", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Fill earnings only
    await formPage.basicSalaryInput.fill("50000");
    await formPage.hraInput.fill("25000");

    // All deductions stay at 0
    // Net should equal gross: 75000
    const netText = await formPage.getNetSalary();
    expect(netText).toContain("75,000");
  });

  test("should update calculations on field change", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Initial values
    await formPage.basicSalaryInput.fill("50000");
    await formPage.expectGrossEarnings("50,000");

    // Add HRA - should update gross
    await formPage.hraInput.fill("25000");
    await formPage.expectGrossEarnings("75,000");

    // Add deduction - should update net
    await formPage.epfInput.fill("6000");
    const netText = await formPage.getNetSalary();
    expect(netText).toContain("69,000"); // 75000 - 6000
  });

  test("should display correct INR formatting with commas", async ({
    page,
  }) => {
    await historyPage.clickAddMonth();

    // Enter large numbers
    await formPage.basicSalaryInput.fill("100000");
    await formPage.hraInput.fill("50000");

    // Should show Indian format: 1,50,000
    await formPage.expectGrossEarnings("1,50,000");
  });

  test("should handle large numbers (lakhs)", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Enter values that sum to lakhs
    await formPage.basicSalaryInput.fill("200000");
    await formPage.hraInput.fill("100000");
    await formPage.specialAllowanceInput.fill("50000");

    // Should correctly show 3,50,000
    await formPage.expectGrossEarnings("3,50,000");
  });

  test("should verify FY 2022-23 April data calculations", async ({ page }) => {
    // Navigate to FY 2022-23
    await historyPage.selectFinancialYear("2022-23");
    await page.waitForTimeout(500);

    // Edit Apr'22 to verify calculations
    await historyPage.clickEditOnRow("Apr'22");

    // Verify gross: 88,350
    await formPage.expectGrossEarnings("88,350");

    // Verify net calculation
    const netText = await formPage.getNetSalary();
    // Gross 88350 - EPF 5400 - PT 200 - TDS 5000 = 77,750
    expect(netText).toContain("77,750");
  });

  test("should verify FY 2024-25 calculations with higher values", async ({
    page,
  }) => {
    await historyPage.selectFinancialYear("2024-25");
    await page.waitForTimeout(500);

    // Edit Apr'24 to verify calculations
    await historyPage.clickEditOnRow("Apr'24");

    // Verify gross: 1,45,350
    await formPage.expectGrossEarnings("1,45,350");
  });

  test("should update table totals after adding record", async ({ page }) => {
    await historyPage.selectFinancialYear("2021-22");
    await page.waitForTimeout(500);

    // Get initial totals
    const initialTotals = await historyPage.getTotals();

    // Add a new record
    await historyPage.clickAddMonth();
    await formPage.fillForm({
      month: "November",
      basicSalary: 50000,
      tdsDeduction: 5000,
    });
    await formPage.save();
    await page.waitForTimeout(500);

    // Get updated totals
    const updatedTotals = await historyPage.getTotals();

    // Totals should be higher
    expect(parseInt(updatedTotals.gross.replace(/[₹,]/g, ""))).toBeGreaterThan(
      parseInt(initialTotals.gross.replace(/[₹,]/g, ""))
    );
  });
});
