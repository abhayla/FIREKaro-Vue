import { test, expect } from "@playwright/test";
import { OtherIncomePage } from "../../pages/non-salary-income";
import { otherIncomeData, nonSalaryIncomeSummary, getOtherIncomeByCategory } from "../../fixtures/non-salary-income-data";

test.describe("Other Income (Interest, Dividends)", () => {
  let otherIncomePage: OtherIncomePage;

  test.beforeEach(async ({ page }) => {
    otherIncomePage = new OtherIncomePage(page);
    await otherIncomePage.navigateTo();
  });

  test("should display other income page correctly", async ({ page }) => {
    await otherIncomePage.expectPageLoaded();
    await expect(otherIncomePage.addIncomeButton).toBeVisible();
  });

  test("should open add income form dialog", async ({ page }) => {
    await otherIncomePage.openAddForm();
    await otherIncomePage.expectFormDialogVisible();
    await expect(otherIncomePage.incomeTypeSelect).toBeVisible();
    await expect(otherIncomePage.descriptionField).toBeVisible();
    await expect(otherIncomePage.amountField).toBeVisible();
    await expect(otherIncomePage.tdsDeductedField).toBeVisible();
  });

  test("should add FD interest income with TDS", async ({ page }) => {
    const testData = otherIncomeData[0]; // HDFC Bank FD Interest

    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "fd_interest",
      description: testData.description,
      amount: testData.grossAmount,
      tdsDeducted: testData.tdsDeducted,
    });

    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
    await otherIncomePage.expectIncomeInTable(testData.description);
  });

  test("should add savings account interest (80TTA eligible)", async ({ page }) => {
    const testData = otherIncomeData[1]; // Savings Account Interest

    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "savings_interest",
      description: testData.description,
      amount: testData.grossAmount,
      tdsDeducted: testData.tdsDeducted,
    });

    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
    await otherIncomePage.expectIncomeInTable(testData.description);
  });

  test("should add dividend income", async ({ page }) => {
    const testData = otherIncomeData[3]; // Stock Dividends

    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "dividend",
      description: testData.description,
      amount: testData.grossAmount,
      tdsDeducted: testData.tdsDeducted,
    });

    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
    await otherIncomePage.expectIncomeInTable(testData.description);
  });

  test("should edit existing other income", async ({ page }) => {
    const testData = otherIncomeData[0];

    // First add the income
    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "fd_interest",
      description: testData.description,
      amount: testData.grossAmount,
    });
    await otherIncomePage.saveForm();

    // Now edit it
    await otherIncomePage.editIncome(testData.description);
    await otherIncomePage.expectFormDialogVisible();

    const updatedAmount = testData.grossAmount + 10000;
    await otherIncomePage.fillOtherIncomeForm({
      amount: updatedAmount,
    });
    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
  });

  test("should delete other income", async ({ page }) => {
    const testData = otherIncomeData[0];

    // First add the income
    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "fd_interest",
      description: testData.description,
      amount: testData.grossAmount,
    });
    await otherIncomePage.saveForm();

    // Now delete it
    await otherIncomePage.deleteIncome(testData.description);
    await otherIncomePage.confirmDeleteIncome();
    await otherIncomePage.expectIncomeNotInTable(testData.description);
  });
});
