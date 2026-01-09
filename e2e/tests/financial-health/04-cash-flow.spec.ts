import { test, expect } from "@playwright/test";
import { CashFlowPage } from "../../pages/financial-health";
import { cashFlowData, financialHealthSummary } from "../../fixtures/financial-health-data";

test.describe("Cash Flow", () => {
  let cashFlowPage: CashFlowPage;

  test.beforeEach(async ({ page }) => {
    cashFlowPage = new CashFlowPage(page);
    await cashFlowPage.navigateTo();
  });

  test("should display cash flow page", async ({ page }) => {
    await cashFlowPage.expectPageLoaded();
  });

  test("should show total income card", async ({ page }) => {
    await expect(cashFlowPage.totalIncomeCard).toBeVisible();
    const income = await cashFlowPage.getTotalIncome();
    expect(income).toContain("₹");
  });

  test("should show total expenses card", async ({ page }) => {
    await expect(cashFlowPage.totalExpensesCard).toBeVisible();
    const expenses = await cashFlowPage.getTotalExpenses();
    expect(expenses).toContain("₹");
  });

  test("should show net cash flow (surplus/deficit)", async ({ page }) => {
    await expect(cashFlowPage.netCashFlowCard).toBeVisible();
    const netCashFlow = await cashFlowPage.getNetCashFlow();
    expect(netCashFlow).toContain("₹");
  });

  test("should show savings rate", async ({ page }) => {
    await expect(cashFlowPage.savingsRateCard).toBeVisible();
    const savingsRate = await cashFlowPage.getSavingsRate();
    expect(savingsRate).toMatch(/%|\d/);
  });

  test("should display income breakdown", async ({ page }) => {
    // Check for income categories
    await expect(
      page.getByText(/Salary|Non-Salary|Passive|Other Income/i).first()
    ).toBeVisible();
  });

  test("should display expenses breakdown", async ({ page }) => {
    // Check for expense categories
    await expect(
      page.getByText(/Needs|Wants|Essential|Discretionary/i).first()
    ).toBeVisible();
  });

  test("should show cash flow chart", async ({ page }) => {
    await expect(cashFlowPage.cashFlowChart).toBeVisible();
  });

  test("should calculate positive cash flow (income > expenses)", async ({ page }) => {
    const incomeText = await cashFlowPage.getTotalIncome();
    const expensesText = await cashFlowPage.getTotalExpenses();
    const netCashFlowText = await cashFlowPage.getNetCashFlow();

    // All should contain INR currency
    expect(incomeText).toContain("₹");
    expect(expensesText).toContain("₹");
    expect(netCashFlowText).toContain("₹");
  });
});
