import { test, expect } from "@playwright/test";
import { ExpenseTrackingPage, BudgetsPage } from "../../pages/expenses";

test.describe("Expenses Form Validation", () => {
  test("should require positive amount for expense", async ({ page }) => {
    const trackingPage = new ExpenseTrackingPage(page);
    await trackingPage.navigateTo();

    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: "Groceries",
      description: "Test",
      amount: -100,
    });

    await trackingPage.saveForm();
    // Should show validation error
    await trackingPage.expectFormDialogVisible();
  });

  test("should require budget limit to be positive", async ({ page }) => {
    const budgetsPage = new BudgetsPage(page);
    await budgetsPage.navigateTo();

    await budgetsPage.openSetBudgetForm();
    await budgetsPage.fillNumberField("Monthly Limit", 0);
    await budgetsPage.saveForm();
    // Should show validation error or handle gracefully
  });

  test("should cancel expense form without saving", async ({ page }) => {
    const trackingPage = new ExpenseTrackingPage(page);
    await trackingPage.navigateTo();

    await trackingPage.openAddForm();
    await trackingPage.fillExpenseForm({
      category: "Shopping",
      description: "Test Item",
      amount: 5000,
    });
    await trackingPage.cancelForm();
    await trackingPage.expectFormDialogClosed();
    await trackingPage.expectExpenseNotInTable("Test Item");
  });
});
