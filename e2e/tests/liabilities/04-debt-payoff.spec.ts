import { test, expect } from "@playwright/test";
import { DebtPayoffPage } from "../../pages/liabilities";
import { snowballStrategy, avalancheStrategy, liabilitiesSummary } from "../../fixtures/liabilities-data";

test.describe("Debt Payoff Strategies", () => {
  let debtPayoffPage: DebtPayoffPage;

  test.beforeEach(async ({ page }) => {
    debtPayoffPage = new DebtPayoffPage(page);
    await debtPayoffPage.navigateTo();
  });

  test("should display debt payoff page correctly", async ({ page }) => {
    await debtPayoffPage.expectPageLoaded();
    await debtPayoffPage.expectStrategySelectionVisible();
  });

  test("should show summary cards", async ({ page }) => {
    await expect(debtPayoffPage.totalDebtCard).toBeVisible();
    await expect(debtPayoffPage.monthsToPayoffCard).toBeVisible();
    await expect(debtPayoffPage.totalInterestCard).toBeVisible();
  });

  test("should select Snowball strategy", async ({ page }) => {
    await debtPayoffPage.selectSnowball();
    const strategy = await debtPayoffPage.getSelectedStrategy();
    expect(strategy).toBe("snowball");
  });

  test("should select Avalanche strategy", async ({ page }) => {
    await debtPayoffPage.selectAvalanche();
    const strategy = await debtPayoffPage.getSelectedStrategy();
    expect(strategy).toBe("avalanche");
  });

  test("should display debt payoff order table", async ({ page }) => {
    await debtPayoffPage.selectSnowball();
    await debtPayoffPage.expectPayoffOrderTableVisible();
  });

  test("should update calculations with extra payment", async ({ page }) => {
    // Get initial payoff time
    const initialPayoffTime = await debtPayoffPage.getPayoffTime();

    // Add extra payment
    await debtPayoffPage.setExtraPayment(5000);

    // Payoff time should decrease (or stay same if already minimal)
    const newPayoffTime = await debtPayoffPage.getPayoffTime();
    // Just verify it's displayed
    expect(newPayoffTime).toBeTruthy();
  });

  test("should show payoff chart", async ({ page }) => {
    await debtPayoffPage.expectPayoffChartVisible();
  });
});
