import { test, expect } from "@playwright/test";
import { SalaryHistoryPage, SalaryFormPage } from "../../pages/salary";

test.describe("Add Salary Entry", () => {
  let historyPage: SalaryHistoryPage;
  let formPage: SalaryFormPage;

  // Test employer name - unique per test run to avoid conflicts
  const testEmployer = "Test Company E2E";

  test.beforeEach(async ({ page }) => {
    historyPage = new SalaryHistoryPage(page);
    formPage = new SalaryFormPage(page);
    await historyPage.navigateTo();
  });

  test("should open add salary dialog from history page", async ({ page }) => {
    await historyPage.clickAddMonth();
    await formPage.expectDialogOpen();
    await expect(page.getByText("Add Salary Entry")).toBeVisible();
  });

  test("should have correct default values when dialog opens", async ({
    page,
  }) => {
    await historyPage.clickAddMonth();

    // Check paid days defaults to 30
    await expect(formPage.paidDaysInput).toHaveValue("30");

    // Check all numeric fields default to 0
    await expect(formPage.basicSalaryInput).toHaveValue("0");
    await expect(formPage.hraInput).toHaveValue("0");
    await expect(formPage.epfInput).toHaveValue("0");
    await expect(formPage.tdsInput).toHaveValue("0");
  });

  test("should calculate gross earnings in real-time", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Fill earnings
    await formPage.basicSalaryInput.fill("50000");
    await formPage.hraInput.fill("25000");
    await formPage.specialAllowanceInput.fill("10000");

    // Gross should be 85000
    await formPage.expectGrossEarnings("85,000");
  });

  test("should calculate total deductions in real-time", async ({ page }) => {
    await historyPage.clickAddMonth();

    await formPage.epfInput.fill("6000");
    await formPage.professionalTaxInput.fill("200");
    await formPage.tdsInput.fill("5000");

    // Total deductions should show 11,200
    const deductionsText = await formPage.getTotalDeductions();
    expect(deductionsText).toContain("11,200");
  });

  test("should calculate net salary correctly", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Fill earnings (total: 85000)
    await formPage.basicSalaryInput.fill("50000");
    await formPage.hraInput.fill("25000");
    await formPage.specialAllowanceInput.fill("10000");

    // Fill deductions (total: 11200)
    await formPage.epfInput.fill("6000");
    await formPage.professionalTaxInput.fill("200");
    await formPage.tdsInput.fill("5000");

    // Net should be 73800 (85000 - 11200)
    await formPage.expectNetSalary("73,800");
  });

  test("should allow creating a new employer", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Create a new employer via the dialog
    await formPage.createNewEmployer("New Test Corp");

    // The employer should be selected automatically after creation
    // Verify by checking the form still works
    await formPage.basicSalaryInput.fill("50000");
    await formPage.expectGrossEarnings("50,000");

    await formPage.cancel();
  });

  test("should close dialog after successful save", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Select a month that might not exist yet
    await formPage.selectMonth("March");

    // Select or create an employer if needed
    const employerSelect = formPage.employerSelect;
    const hasEmployer = await employerSelect.locator("input").inputValue();
    if (!hasEmployer) {
      await formPage.createNewEmployer(testEmployer);
    }

    // Fill minimum required data
    await formPage.basicSalaryInput.fill("50000");

    await formPage.save();

    // Dialog should close
    await formPage.expectDialogClosed();
  });

  test("should show success snackbar after save", async ({ page }) => {
    await historyPage.clickAddMonth();
    await formPage.selectMonth("February");

    // Ensure employer is selected
    const employerSelect = formPage.employerSelect;
    const hasEmployer = await employerSelect.locator("input").inputValue();
    if (!hasEmployer) {
      await formPage.createNewEmployer(testEmployer);
    }

    await formPage.basicSalaryInput.fill("45000");

    await formPage.save();

    // Should show success message
    await historyPage.waitForSnackbar("added");
  });

  test("should close dialog on cancel without saving", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Fill some data
    await formPage.basicSalaryInput.fill("100000");

    // Cancel
    await formPage.cancel();

    // Dialog should close
    await formPage.expectDialogClosed();

    // Data should not be saved (no new row with 100000)
    await expect(page.locator("text=₹1,00,000")).not.toBeVisible();
  });

  test("should add complete salary record with all fields", async ({
    page,
  }) => {
    // Switch to an empty FY or specific test FY
    await historyPage.selectFinancialYear("2021-22");
    await page.waitForTimeout(500);

    await historyPage.clickAddMonth();

    // Fill all fields including employer
    await formPage.fillForm({
      employer: testEmployer,
      month: "April",
      paidDays: 30,
      basicSalary: 60000,
      hra: 30000,
      conveyanceAllowance: 1600,
      medicalAllowance: 1250,
      specialAllowance: 20000,
      otherAllowances: 4000,
      epfDeduction: 7200,
      vpfDeduction: 3000,
      professionalTax: 200,
      tdsDeduction: 8000,
    });

    // Verify calculations before saving
    // 60000 + 30000 + 1600 + 1250 + 20000 + 4000 = 116850
    await formPage.expectGrossEarnings("1,16,850");

    await formPage.save();
    await historyPage.waitForSnackbar("added");

    // Verify row appears in table
    await historyPage.expectRowExists("Apr'21");
  });

  test("should show sync indicators on EPF field", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Verify the sync link icon appears on the EPF field
    await formPage.expectSyncIndicatorVisible("Provident Fund (EPF)");
  });

  test("should expand other deductions section", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Initially VPF field should not be visible
    await expect(formPage.vpfInput).not.toBeVisible();

    // Expand the other deductions section
    await formPage.expandOtherDeductions();

    // Now VPF field should be visible
    await expect(formPage.vpfInput).toBeVisible();

    // Fill VPF value and verify it's included in deductions
    await formPage.vpfInput.fill("5000");
    const deductionsText = await formPage.getTotalDeductions();
    expect(deductionsText).toContain("5,000");
  });

  test("should expand other allowances section", async ({ page }) => {
    await historyPage.clickAddMonth();

    // Initially Special Pay field should not be visible
    await expect(formPage.specialPayInput).not.toBeVisible();

    // Expand the other allowances section
    await formPage.expandOtherAllowances();

    // Now Special Pay field should be visible
    await expect(formPage.specialPayInput).toBeVisible();

    // Fill and verify it's included in gross earnings
    await formPage.basicSalaryInput.fill("50000");
    await formPage.specialPayInput.fill("10000");

    await formPage.expectGrossEarnings("60,000");
  });
});
