import { test, expect } from "@playwright/test";
import { ExpenseTrackingPage } from "../../pages/expenses";
import { monthlyExpensesData, expenseCategories } from "../../fixtures/expenses-data";

test.describe("Expense Tracking", () => {
  let trackingPage: ExpenseTrackingPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new ExpenseTrackingPage(page);
    await trackingPage.navigateTo();
  });

  test("should display expense tracking page correctly", async ({ page }) => {
    await trackingPage.expectPageLoaded();
    await expect(trackingPage.addExpenseButton).toBeVisible();
  });

  test("should open add expense form dialog", async ({ page }) => {
    await trackingPage.openAddForm();
    await trackingPage.expectFormDialogVisible();
    await expect(trackingPage.categorySelect).toBeVisible();
    await expect(trackingPage.amountField).toBeVisible();
  });

  test("should add expense", async ({ page }) => {
    const testExpense = monthlyExpensesData[0];

    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: testExpense.category,
      description: testExpense.description,
      amount: testExpense.amount,
      paymentMethod: "UPI",
    });

    await trackingPage.saveForm();
    await trackingPage.expectFormDialogClosed();
    await trackingPage.expectExpenseInTable(testExpense.description);
  });

  test("should add recurring expense", async ({ page }) => {
    const recurringExpense = monthlyExpensesData.find((e) => e.isRecurring)!;

    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: recurringExpense.category,
      description: recurringExpense.description,
      amount: recurringExpense.amount,
      isRecurring: true,
    });

    await trackingPage.saveForm();
    await trackingPage.expectFormDialogClosed();
  });

  test("should edit expense", async ({ page }) => {
    const testExpense = monthlyExpensesData[0];

    // First add the expense
    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: testExpense.category,
      description: testExpense.description,
      amount: testExpense.amount,
    });
    await trackingPage.saveForm();

    // Now edit it
    await trackingPage.editExpense(testExpense.description);
    await trackingPage.expectFormDialogVisible();

    await trackingPage.fillExpenseForm({
      amount: testExpense.amount + 500,
    });
    await trackingPage.saveForm();
    await trackingPage.expectFormDialogClosed();
  });

  test("should delete expense", async ({ page }) => {
    const testExpense = monthlyExpensesData[0];

    // First add the expense
    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: testExpense.category,
      description: testExpense.description,
      amount: testExpense.amount,
    });
    await trackingPage.saveForm();

    // Now delete it
    await trackingPage.deleteExpense(testExpense.description);
    await trackingPage.confirmDelete();
    await trackingPage.expectExpenseNotInTable(testExpense.description);
  });

  test("should cancel form without saving", async ({ page }) => {
    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: "Groceries",
      description: "Test Expense",
      amount: 1000,
    });
    await trackingPage.cancelForm();
    await trackingPage.expectFormDialogClosed();
    await trackingPage.expectExpenseNotInTable("Test Expense");
  });
});
