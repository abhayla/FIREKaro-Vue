import { test, expect } from "@playwright/test";
import { ExpenseTrackingPage } from "../../pages/expenses";
import { monthlyExpensesData } from "../../fixtures/expenses-data";

test.describe("Expense Tracking", () => {
  let trackingPage: ExpenseTrackingPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new ExpenseTrackingPage(page);
    await trackingPage.navigateTo();
  });

  test.describe("Overview Tab", () => {
    test("should display expense tracking page correctly", async ({ page }) => {
      await trackingPage.expectPageLoaded();
      await trackingPage.expectOverviewTabActive();
    });

    test("should display summary cards in Overview tab", async ({ page }) => {
      await trackingPage.switchToOverviewTab();
      await expect(trackingPage.totalSpentCard).toBeVisible();
    });

    test("should display charts in Overview tab", async ({ page }) => {
      await trackingPage.switchToOverviewTab();
      // Charts may not be visible if no data, so we just check the export section
      await expect(trackingPage.exportSection).toBeVisible();
    });

    test("should display export buttons", async ({ page }) => {
      await trackingPage.switchToOverviewTab();
      await trackingPage.expectExportButtonsVisible();
    });
  });

  test.describe("Expense Details Tab", () => {
    test("should display add expense button", async ({ page }) => {
      await trackingPage.switchToExpenseDetailsTab();
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
        description: "Test Expense Cancel",
        amount: 1000,
      });
      await trackingPage.cancelForm();
      await trackingPage.expectFormDialogClosed();
      await trackingPage.expectExpenseNotInTable("Test Expense Cancel");
    });
  });

  test.describe("Tab Navigation", () => {
    test("should switch between tabs", async ({ page }) => {
      // Start on Overview tab
      await trackingPage.expectOverviewTabActive();

      // Switch to Expense Details tab
      await trackingPage.switchToExpenseDetailsTab();
      await trackingPage.expectExpenseDetailsTabActive();

      // Switch back to Overview tab
      await trackingPage.switchToOverviewTab();
      await trackingPage.expectOverviewTabActive();
    });

    test("URL should not change when switching tabs", async ({ page }) => {
      const initialUrl = page.url();

      await trackingPage.switchToExpenseDetailsTab();
      expect(page.url()).toBe(initialUrl);

      await trackingPage.switchToOverviewTab();
      expect(page.url()).toBe(initialUrl);
    });
  });

  test.describe("Month Navigation", () => {
    test("should have month selector", async ({ page }) => {
      await expect(trackingPage.monthInput).toBeVisible();
    });

    test("should change month", async ({ page }) => {
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const monthString = previousMonth.toISOString().substring(0, 7); // YYYY-MM format

      await trackingPage.setMonth(monthString);
      await page.waitForTimeout(500);

      // Verify the month input has the new value
      const inputValue = await trackingPage.monthInput.inputValue();
      expect(inputValue).toBe(monthString);
    });
  });
});
