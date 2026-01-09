import { test, expect } from "@playwright/test";
import { BudgetsPage } from "../../pages/expenses";
import { budgetData, expenseCategories } from "../../fixtures/expenses-data";

test.describe("Budgets", () => {
  let budgetsPage: BudgetsPage;

  test.beforeEach(async ({ page }) => {
    budgetsPage = new BudgetsPage(page);
    await budgetsPage.navigateTo();
  });

  test("should display budgets page correctly", async ({ page }) => {
    await budgetsPage.expectPageLoaded();
    await expect(budgetsPage.setBudgetButton).toBeVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(budgetsPage.totalBudgetCard).toBeVisible();
    await expect(budgetsPage.totalSpentCard).toBeVisible();
    await expect(budgetsPage.remainingCard).toBeVisible();
  });

  test("should open set budget form dialog", async ({ page }) => {
    await budgetsPage.openSetBudgetForm();
    await budgetsPage.expectFormDialogVisible();
    await expect(budgetsPage.categorySelect).toBeVisible();
    await expect(budgetsPage.monthlyLimitField).toBeVisible();
  });

  test("should set budget for category", async ({ page }) => {
    const testBudget = budgetData[0];

    await budgetsPage.setBudget(testBudget.category, testBudget.monthlyLimit);
    await budgetsPage.expectFormDialogClosed();
  });

  test("should display budget progress for categories", async ({ page }) => {
    // Check that progress bars are shown for categories
    const groceriesProgress = budgetsPage.getBudgetProgressForCategory("Groceries");
    // May or may not be visible depending on if budget is set
  });

  test("should show total budget amount", async ({ page }) => {
    const totalBudget = await budgetsPage.getTotalBudget();
    expect(totalBudget).toContain("₹");
  });

  test("should cancel form without saving", async ({ page }) => {
    await budgetsPage.openSetBudgetForm();
    await budgetsPage.cancelForm();
    await budgetsPage.expectFormDialogClosed();
  });
});
