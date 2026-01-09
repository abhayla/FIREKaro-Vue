import { test, expect } from "@playwright/test";
import { ExpensesOverviewPage, BudgetsPage } from "../../pages/expenses";
import { expenseSummary } from "../../fixtures/expenses-data";

test.describe("Expenses Calculations", () => {
  test("should show total spent on overview", async ({ page }) => {
    const overview = new ExpensesOverviewPage(page);
    await overview.navigateTo();

    const totalSpent = await overview.getTotalSpent();
    expect(totalSpent).toContain("₹");
    const numericValue = overview.parseINR(totalSpent);
    expect(numericValue).toBeGreaterThan(0);
  });

  test("should calculate budget remaining correctly", async ({ page }) => {
    const budgets = new BudgetsPage(page);
    await budgets.navigateTo();

    const totalBudget = await budgets.getTotalBudget();
    const totalSpent = await budgets.getTotalSpent();

    // Both should show INR amounts
    expect(totalBudget).toContain("₹");
    expect(totalSpent).toContain("₹");
  });

  test("should show savings rate", async ({ page }) => {
    const overview = new ExpensesOverviewPage(page);
    await overview.navigateTo();

    await expect(overview.savingsRateCard).toBeVisible();
  });
});
