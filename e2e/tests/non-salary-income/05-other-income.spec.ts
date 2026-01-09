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

  test("should add commission income", async ({ page }) => {
    const uniqueDesc = `Commission Income ${Date.now()}`;

    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "commission",
      description: uniqueDesc,
      amount: 50000,
      tdsDeducted: 5000,
    });

    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
    await otherIncomePage.expectIncomeInTable(uniqueDesc);
  });

  test("should add royalty income", async ({ page }) => {
    const uniqueDesc = `Royalty Income ${Date.now()}`;

    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "royalty",
      description: uniqueDesc,
      amount: 100000,
      tdsDeducted: 10000,
    });

    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
    await otherIncomePage.expectIncomeInTable(uniqueDesc);
  });

  test("should add gift income", async ({ page }) => {
    const uniqueDesc = `Gift from Friend ${Date.now()}`;

    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "gift",
      description: uniqueDesc,
      amount: 75000,
    });

    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
    await otherIncomePage.expectIncomeInTable(uniqueDesc);
  });

  test("should edit existing other income", async ({ page }) => {
    const uniqueDesc = `Edit Test Income ${Date.now()}`;

    // First add the income
    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "commission",
      description: uniqueDesc,
      amount: 30000,
    });
    await otherIncomePage.saveForm();
    await otherIncomePage.expectIncomeInTable(uniqueDesc);

    // Now edit it
    await otherIncomePage.editIncome(uniqueDesc);
    await otherIncomePage.expectFormDialogVisible();

    await otherIncomePage.fillOtherIncomeForm({
      amount: 40000,
    });
    await otherIncomePage.saveForm();
    await otherIncomePage.expectFormDialogClosed();
  });

  test("should delete other income", async ({ page }) => {
    const uniqueDesc = `Delete Test Income ${Date.now()}`;

    // First add the income
    await otherIncomePage.openAddForm();
    await otherIncomePage.fillOtherIncomeForm({
      incomeType: "commission",
      description: uniqueDesc,
      amount: 25000,
    });
    await otherIncomePage.saveForm();
    await otherIncomePage.expectIncomeInTable(uniqueDesc);

    // Now delete it
    await otherIncomePage.deleteIncome(uniqueDesc);
    await otherIncomePage.confirmDeleteIncome();
    await otherIncomePage.expectIncomeNotInTable(uniqueDesc);
  });
});
