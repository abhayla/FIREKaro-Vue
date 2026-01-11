import { test, expect } from "@playwright/test";
import {
  ExpensesOverviewPage,
  ExpenseTrackingPage,
  BudgetsPage,
  RecurringExpensesPage,
  ExpenseCategoriesPage,
} from "../../pages/expenses";

test.describe("Expenses Navigation", () => {
  test.describe("Landing Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/expenses");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    });

    test("should load expenses landing page", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await expect(overview.pageTitle).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/expenses$/);
    });

    test("should display summary cards", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.expectSummaryCardsVisible();
    });

    test("should display quick navigation cards", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.expectQuickNavVisible();
    });

    test("should display quick actions section", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.expectQuickActionsVisible();
    });

    test("should navigate to Track via quick nav card", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.navigateToTrack();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/track/);
    });

    test("should navigate to Budgets via quick nav card", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.navigateToBudgets();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/budgets/);
    });

    test("should navigate to Recurring via quick nav card", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.navigateToRecurring();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/recurring/);
    });
  });

  test.describe("Track Section", () => {
    test("should load Track page with tabs", async ({ page }) => {
      await page.goto("/expenses/track");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const tracking = new ExpenseTrackingPage(page);
      await tracking.expectPageLoaded();
      await expect(tracking.overviewTab).toBeVisible();
      await expect(tracking.expenseDetailsTab).toBeVisible();
    });

    test("should default to Overview tab", async ({ page }) => {
      await page.goto("/expenses/track");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const tracking = new ExpenseTrackingPage(page);
      await tracking.expectOverviewTabActive();
    });

    test("should switch between tabs without URL change", async ({ page }) => {
      await page.goto("/expenses/track");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const tracking = new ExpenseTrackingPage(page);

      // Switch to Expense Details tab
      await tracking.switchToExpenseDetailsTab();
      await tracking.expectExpenseDetailsTabActive();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/track$/);

      // Switch back to Overview tab
      await tracking.switchToOverviewTab();
      await tracking.expectOverviewTabActive();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/track$/);
    });
  });

  test.describe("Budgets Section", () => {
    test("should load Budgets page with tabs", async ({ page }) => {
      await page.goto("/expenses/budgets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const budgets = new BudgetsPage(page);
      await budgets.expectPageLoaded();
      await expect(budgets.overviewTab).toBeVisible();
      await expect(budgets.budgetDetailsTab).toBeVisible();
    });

    test("should default to Overview tab", async ({ page }) => {
      await page.goto("/expenses/budgets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const budgets = new BudgetsPage(page);
      await budgets.expectOverviewTabActive();
    });

    test("should switch between tabs without URL change", async ({ page }) => {
      await page.goto("/expenses/budgets");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const budgets = new BudgetsPage(page);

      // Switch to Budget Details tab
      await budgets.switchToBudgetDetailsTab();
      await budgets.expectBudgetDetailsTabActive();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/budgets$/);

      // Switch back to Overview tab
      await budgets.switchToOverviewTab();
      await budgets.expectOverviewTabActive();
    });
  });

  test.describe("Recurring Section", () => {
    test("should load Recurring page with tabs", async ({ page }) => {
      await page.goto("/expenses/recurring");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const recurring = new RecurringExpensesPage(page);
      await recurring.expectPageLoaded();
      await expect(recurring.overviewTab).toBeVisible();
      await expect(recurring.recurringDetailsTab).toBeVisible();
    });

    test("should default to Overview tab", async ({ page }) => {
      await page.goto("/expenses/recurring");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const recurring = new RecurringExpensesPage(page);
      await recurring.expectOverviewTabActive();
    });

    test("should switch between tabs without URL change", async ({ page }) => {
      await page.goto("/expenses/recurring");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const recurring = new RecurringExpensesPage(page);

      // Switch to Recurring Details tab
      await recurring.switchToRecurringDetailsTab();
      await recurring.expectRecurringDetailsTabActive();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/recurring$/);

      // Switch back to Overview tab
      await recurring.switchToOverviewTab();
      await recurring.expectOverviewTabActive();
    });
  });

  test.describe("Categories Dialog", () => {
    test("should open categories dialog from Track page", async ({ page }) => {
      await page.goto("/expenses/track");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const categories = new ExpenseCategoriesPage(page);
      await categories.openCategoriesDialog();
      await categories.expectDialogVisible();
    });

    test("should close categories dialog", async ({ page }) => {
      await page.goto("/expenses/track");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const categories = new ExpenseCategoriesPage(page);
      await categories.openCategoriesDialog();
      await categories.expectDialogVisible();

      await categories.closeCategoriesDialog();
      await categories.expectDialogClosed();
    });
  });
});
