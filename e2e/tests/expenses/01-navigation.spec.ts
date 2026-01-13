import { test, expect } from "@playwright/test";
import {
  ExpensesOverviewPage,
  ExpenseTrackingPage,
  BudgetsPage,
  RecurringExpensesPage,
  ExpenseCategoriesPage,
  ExpenseReportsPage,
} from "../../pages/expenses";

test.describe("Expenses Navigation", () => {
  test.describe("Overview Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/expenses");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    });

    test("should load expenses overview page", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await expect(overview.pageTitle).toBeVisible();
      await expect(page).toHaveURL(/\/expenses$/);
    });

    test("should display summary cards", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.expectSummaryCardsVisible();
    });

    test("should display quick actions section", async ({ page }) => {
      const overview = new ExpensesOverviewPage(page);
      await overview.expectQuickActionsVisible();
    });

    test("should have section-level header tabs with correct order", async ({ page }) => {
      // Verify section-level navigation tabs in header (Overview, Track, Budgets, Categories, Reports)
      const headerTabs = page.locator(".v-tabs").first();
      await expect(headerTabs).toBeVisible();

      // Verify correct tab order: Overview, Track, Budgets, Categories, Reports
      const tabs = headerTabs.locator(".v-tab");
      await expect(tabs).toHaveCount(5);
      await expect(tabs.nth(0)).toContainText("Overview");
      await expect(tabs.nth(1)).toContainText("Track");
      await expect(tabs.nth(2)).toContainText("Budgets");
      await expect(tabs.nth(3)).toContainText("Categories");
      await expect(tabs.nth(4)).toContainText("Reports"); // Reports should be last
    });
  });

  test.describe("Track Section", () => {
    test("should load Track page with internal tabs", async ({ page }) => {
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
      await expect(page).toHaveURL(/\/expenses\/track$/);

      // Switch back to Overview tab
      await tracking.switchToOverviewTab();
      await tracking.expectOverviewTabActive();
      await expect(page).toHaveURL(/\/expenses\/track$/);
    });
  });

  test.describe("Budgets Section", () => {
    test("should load Budgets page with internal tabs", async ({ page }) => {
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
      await expect(page).toHaveURL(/\/expenses\/budgets$/);

      // Switch back to Overview tab
      await budgets.switchToOverviewTab();
      await budgets.expectOverviewTabActive();
    });
  });

  test.describe("Recurring Section", () => {
    test("should load Recurring page with internal tabs", async ({ page }) => {
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
      await expect(page).toHaveURL(/\/expenses\/recurring$/);

      // Switch back to Overview tab
      await recurring.switchToOverviewTab();
      await recurring.expectOverviewTabActive();
    });
  });

  test.describe("Categories Page", () => {
    test("should load Categories page with internal tabs", async ({ page }) => {
      await page.goto("/expenses/categories");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const categories = new ExpenseCategoriesPage(page);
      await categories.expectPageLoaded();
      await expect(categories.rulesTab).toBeVisible();
      await expect(categories.categoriesTab).toBeVisible();
    });

    test("should default to Rules tab", async ({ page }) => {
      await page.goto("/expenses/categories");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const categories = new ExpenseCategoriesPage(page);
      await categories.expectRulesTabActive();
    });

    test("should switch between Rules and Categories tabs", async ({ page }) => {
      await page.goto("/expenses/categories");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const categories = new ExpenseCategoriesPage(page);

      // Switch to Categories tab
      await categories.switchToCategoriesTab();
      await categories.expectCategoriesTabActive();
      await expect(page).toHaveURL(/\/expenses\/categories$/);

      // Switch back to Rules tab
      await categories.switchToRulesTab();
      await categories.expectRulesTabActive();
    });

    test("should show Create Rule button", async ({ page }) => {
      await page.goto("/expenses/categories");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const categories = new ExpenseCategoriesPage(page);
      await expect(categories.createRuleButton.or(categories.addRuleButton)).toBeVisible();
    });
  });

  test.describe("Reports Page", () => {
    test("should load Reports page", async ({ page }) => {
      await page.goto("/expenses/reports");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const reports = new ExpenseReportsPage(page);
      await reports.expectPageLoaded();
    });

    test("should show period selectors", async ({ page }) => {
      await page.goto("/expenses/reports");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const reports = new ExpenseReportsPage(page);
      await reports.expectPeriodSelectorsVisible();
    });

    test("should show summary cards", async ({ page }) => {
      await page.goto("/expenses/reports");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const reports = new ExpenseReportsPage(page);
      await reports.expectSummaryCardsVisible();
    });

    test("should show export button", async ({ page }) => {
      await page.goto("/expenses/reports");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      const reports = new ExpenseReportsPage(page);
      await reports.expectExportButtonVisible();
    });
  });

  test.describe("Header Tab Navigation", () => {
    test("should navigate via header tabs", async ({ page }) => {
      await page.goto("/expenses");
      await page.waitForLoadState("domcontentloaded");
      await page.locator(".v-card").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});

      // Click Track tab
      await page.locator(".v-tabs .v-tab").filter({ hasText: "Track" }).click();
      await expect(page).toHaveURL(/\/expenses\/track$/);

      // Click Categories tab
      await page.locator(".v-tabs .v-tab").filter({ hasText: "Categories" }).click();
      await expect(page).toHaveURL(/\/expenses\/categories$/);

      // Click Reports tab (should be last)
      await page.locator(".v-tabs .v-tab").filter({ hasText: "Reports" }).click();
      await expect(page).toHaveURL(/\/expenses\/reports$/);

      // Click Overview tab to go back
      await page.locator(".v-tabs .v-tab").filter({ hasText: "Overview" }).click();
      await expect(page).toHaveURL(/\/expenses$/);
    });
  });

  test.describe("Sidebar Navigation", () => {
    test("should show all 6 expense items in sidebar", async ({ page }) => {
      await page.goto("/expenses");
      await page.waitForLoadState("domcontentloaded");

      // Expand Expenses section if needed
      const expensesSection = page.locator(".v-list-group").filter({ hasText: /Expenses/i });
      await expensesSection.click().catch(() => {});
      await page.waitForTimeout(300);

      // Check all sidebar items
      const sidebarItems = [
        "Overview",
        "Track Expenses",
        "Budgets",
        "Recurring",
        "Categories",
        "Reports",
      ];

      for (const item of sidebarItems) {
        const sidebarLink = page.locator(".v-list-item").filter({ hasText: new RegExp(`^${item}$`, "i") });
        await expect(sidebarLink).toBeVisible();
      }
    });

    test("should navigate via sidebar to each section", async ({ page }) => {
      await page.goto("/expenses");
      await page.waitForLoadState("domcontentloaded");

      // Test navigation to Track
      await page.getByRole("link", { name: "Track Expenses" }).click();
      await expect(page).toHaveURL(/\/expenses\/track$/);

      // Test navigation to Categories
      await page.getByRole("link", { name: "Categories" }).click();
      await expect(page).toHaveURL(/\/expenses\/categories$/);

      // Test navigation to Reports
      await page.getByRole("link", { name: "Reports" }).click();
      await expect(page).toHaveURL(/\/expenses\/reports$/);
    });
  });
});
