import { test, expect } from "@playwright/test";
import { BudgetsPage } from "../../pages/expenses";

test.describe("Budgets", () => {
  let budgetsPage: BudgetsPage;

  test.beforeEach(async ({ page }) => {
    budgetsPage = new BudgetsPage(page);
    await budgetsPage.navigateTo();
  });

  test.describe("Overview Tab", () => {
    test("should display budgets page correctly", async ({ page }) => {
      await budgetsPage.expectPageLoaded();
      await budgetsPage.expectOverviewTabActive();
    });

    test("should show 50/30/20 category cards", async ({ page }) => {
      await budgetsPage.switchToOverviewTab();
      await budgetsPage.expect503020CardsVisible();
    });

    test("should display needs card (50%)", async ({ page }) => {
      await budgetsPage.switchToOverviewTab();
      await expect(budgetsPage.needsCard).toBeVisible();
    });

    test("should display wants card (30%)", async ({ page }) => {
      await budgetsPage.switchToOverviewTab();
      await expect(budgetsPage.wantsCard).toBeVisible();
    });

    test("should display savings card (20%)", async ({ page }) => {
      await budgetsPage.switchToOverviewTab();
      await expect(budgetsPage.savingsCard).toBeVisible();
    });
  });

  test.describe("Budget Details Tab", () => {
    test("should display set budget button", async ({ page }) => {
      await budgetsPage.switchToBudgetDetailsTab();
      await expect(budgetsPage.setBudgetButton).toBeVisible();
    });

    test("should open set budget form dialog", async ({ page }) => {
      await budgetsPage.openSetBudgetForm();
      await budgetsPage.expectFormDialogVisible();
    });

    test("should set budget with income", async ({ page }) => {
      await budgetsPage.setBudget(100000);
      await budgetsPage.expectFormDialogClosed();
    });

    test("should cancel form without saving", async ({ page }) => {
      await budgetsPage.openSetBudgetForm();
      await budgetsPage.cancelForm();
      await budgetsPage.expectFormDialogClosed();
    });
  });

  test.describe("Tab Navigation", () => {
    test("should switch between tabs", async ({ page }) => {
      // Start on Overview tab
      await budgetsPage.expectOverviewTabActive();

      // Switch to Budget Details tab
      await budgetsPage.switchToBudgetDetailsTab();
      await budgetsPage.expectBudgetDetailsTabActive();

      // Switch back to Overview tab
      await budgetsPage.switchToOverviewTab();
      await budgetsPage.expectOverviewTabActive();
    });

    test("URL should not change when switching tabs", async ({ page }) => {
      const initialUrl = page.url();

      await budgetsPage.switchToBudgetDetailsTab();
      expect(page.url()).toBe(initialUrl);

      await budgetsPage.switchToOverviewTab();
      expect(page.url()).toBe(initialUrl);
    });
  });

  test.describe("Month Navigation", () => {
    test("should have month selector", async ({ page }) => {
      await expect(budgetsPage.monthInput).toBeVisible();
    });

    test("should change month", async ({ page }) => {
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const monthString = previousMonth.toISOString().substring(0, 7); // YYYY-MM format

      await budgetsPage.setMonth(monthString);
      await page.waitForTimeout(500);

      // Verify the month input has the new value
      const inputValue = await budgetsPage.monthInput.inputValue();
      expect(inputValue).toBe(monthString);
    });
  });
});
