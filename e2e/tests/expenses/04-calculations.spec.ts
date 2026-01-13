import { test, expect } from "@playwright/test";
import { ExpensesOverviewPage, BudgetsPage, ExpenseTrackingPage } from "../../pages/expenses";

test.describe("Expenses Calculations", () => {
  test("should show total expenses on landing page", async ({ page }) => {
    const overview = new ExpensesOverviewPage(page);
    await overview.navigateTo();

    const totalExpenses = await overview.getTotalExpenses();
    expect(totalExpenses).toContain("₹");
  });

  test("should show budget usage on landing page", async ({ page }) => {
    const overview = new ExpensesOverviewPage(page);
    await overview.navigateTo();

    const budgetUsage = await overview.getBudgetUsage();
    // May show percentage or "--" if no budget set
    expect(budgetUsage.length).toBeGreaterThan(0);
  });

  test("should show recurring count on landing page", async ({ page }) => {
    const overview = new ExpensesOverviewPage(page);
    await overview.navigateTo();

    const recurringCount = await overview.getRecurringCount();
    expect(recurringCount.length).toBeGreaterThan(0);
  });

  test("should calculate 50/30/20 budget allocation", async ({ page }) => {
    const budgets = new BudgetsPage(page);
    await budgets.navigateTo();

    // Check that 50/30/20 cards are visible
    await budgets.expect503020CardsVisible();
  });

  test("should show needs usage in budgets", async ({ page }) => {
    const budgets = new BudgetsPage(page);
    await budgets.navigateTo();
    await budgets.switchToOverviewTab();

    const needsUsage = await budgets.getNeedsUsage();
    // Should show a value (percentage or amount)
    expect(needsUsage.length).toBeGreaterThan(0);
  });

  test("should show wants usage in budgets", async ({ page }) => {
    const budgets = new BudgetsPage(page);
    await budgets.navigateTo();
    await budgets.switchToOverviewTab();

    const wantsUsage = await budgets.getWantsUsage();
    expect(wantsUsage.length).toBeGreaterThan(0);
  });

  test("should show savings usage in budgets", async ({ page }) => {
    const budgets = new BudgetsPage(page);
    await budgets.navigateTo();
    await budgets.switchToOverviewTab();

    const savingsUsage = await budgets.getSavingsUsage();
    expect(savingsUsage.length).toBeGreaterThan(0);
  });

  test("should show total spent in Track Overview", async ({ page }) => {
    const tracking = new ExpenseTrackingPage(page);
    await tracking.navigateTo();
    await tracking.switchToOverviewTab();

    await expect(tracking.totalSpentCard).toBeVisible();
  });
});
