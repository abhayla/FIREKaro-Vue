import { test, expect } from "@playwright/test";
import { RecurringExpensesPage } from "../../pages/expenses";

/**
 * Tests for the new Recurring Expenses section.
 * This section manages subscriptions, bills, and regular payments.
 */
test.describe("Recurring Expenses", () => {
  let recurringPage: RecurringExpensesPage;

  test.beforeEach(async ({ page }) => {
    recurringPage = new RecurringExpensesPage(page);
    await recurringPage.navigateTo();
  });

  test.describe("Page Layout", () => {
    test("should display recurring page correctly", async ({ page }) => {
      await recurringPage.expectPageLoaded();
    });

    test("should display Overview and Recurring Details tabs", async ({ page }) => {
      await expect(recurringPage.overviewTab).toBeVisible();
      await expect(recurringPage.recurringDetailsTab).toBeVisible();
    });

    test("should default to Overview tab", async ({ page }) => {
      await recurringPage.expectOverviewTabActive();
    });
  });

  test.describe("Overview Tab", () => {
    test("should display summary cards", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await recurringPage.expectSummaryCardsVisible();
    });

    test("should display Active count card", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await expect(recurringPage.activeCard).toBeVisible();
    });

    test("should display Paused count card", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await expect(recurringPage.pausedCard).toBeVisible();
    });

    test("should display Monthly Total card", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await expect(recurringPage.monthlyTotalCard).toBeVisible();
    });

    test("should display Upcoming card", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await expect(recurringPage.upcomingCard).toBeVisible();
    });

    test("should display Due This Week section", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await recurringPage.expectDueThisWeekVisible();
    });

    test("should display By Frequency section", async ({ page }) => {
      await recurringPage.switchToOverviewTab();
      await recurringPage.expectByFrequencyVisible();
    });
  });

  test.describe("Recurring Details Tab", () => {
    test("should display Add Recurring button", async ({ page }) => {
      await recurringPage.switchToRecurringDetailsTab();
      await expect(recurringPage.addRecurringButton).toBeVisible();
    });

    test("should display status filter buttons", async ({ page }) => {
      await recurringPage.switchToRecurringDetailsTab();
      await expect(recurringPage.allStatusButton).toBeVisible();
      await expect(recurringPage.activeStatusButton).toBeVisible();
      await expect(recurringPage.pausedStatusButton).toBeVisible();
    });

    test("should display search field", async ({ page }) => {
      await recurringPage.switchToRecurringDetailsTab();
      await expect(recurringPage.searchField).toBeVisible();
    });

    test("should display frequency filter", async ({ page }) => {
      await recurringPage.switchToRecurringDetailsTab();
      await expect(recurringPage.frequencyFilter).toBeVisible();
    });
  });

  test.describe("Recurring Form", () => {
    test("should open add recurring form dialog", async ({ page }) => {
      await recurringPage.openAddForm();
      await recurringPage.expectFormDialogVisible();
    });

    test("should display form fields", async ({ page }) => {
      await recurringPage.openAddForm();
      await expect(recurringPage.descriptionField).toBeVisible();
      await expect(recurringPage.amountField).toBeVisible();
      await expect(recurringPage.categorySelect).toBeVisible();
    });

    test("should display frequency options", async ({ page }) => {
      await recurringPage.openAddForm();
      await expect(recurringPage.weeklyButton).toBeVisible();
      await expect(recurringPage.monthlyButton).toBeVisible();
      await expect(recurringPage.quarterlyButton).toBeVisible();
      await expect(recurringPage.yearlyButton).toBeVisible();
    });

    test("should display start date field", async ({ page }) => {
      await recurringPage.openAddForm();
      await expect(recurringPage.startDateField).toBeVisible();
    });

    test("should display end condition select", async ({ page }) => {
      await recurringPage.openAddForm();
      await expect(recurringPage.endConditionSelect).toBeVisible();
    });

    test("should close form on cancel", async ({ page }) => {
      await recurringPage.openAddForm();
      await recurringPage.cancelForm();
      await recurringPage.expectFormDialogClosed();
    });
  });

  test.describe("CRUD Operations", () => {
    test("should create a recurring expense", async ({ page }) => {
      const description = `Test Recurring ${Date.now()}`;

      await recurringPage.openAddForm();
      await recurringPage.fillRecurringForm({
        description,
        amount: 500,
        category: "Utilities",
        frequency: "MONTHLY",
      });
      await recurringPage.saveForm();
      await recurringPage.expectFormDialogClosed();

      // Verify recurring appears in list
      await recurringPage.expectRecurringInList(description);
    });

    test("should create weekly recurring expense", async ({ page }) => {
      const description = `Weekly Test ${Date.now()}`;

      await recurringPage.openAddForm();
      await recurringPage.fillRecurringForm({
        description,
        amount: 100,
        category: "Food",
        frequency: "WEEKLY",
      });
      await recurringPage.saveForm();
      await recurringPage.expectFormDialogClosed();

      await recurringPage.expectRecurringInList(description);
    });

    test("should create recurring with end date", async ({ page }) => {
      const description = `Limited Recurring ${Date.now()}`;
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await recurringPage.openAddForm();
      await recurringPage.fillRecurringForm({
        description,
        amount: 1000,
        category: "Entertainment",
        frequency: "MONTHLY",
        endCondition: "On specific date",
        endDate: endDate.toISOString().split("T")[0],
      });
      await recurringPage.saveForm();
      await recurringPage.expectFormDialogClosed();

      await recurringPage.expectRecurringInList(description);
    });

    test("should delete a recurring expense", async ({ page }) => {
      const description = `Delete Test ${Date.now()}`;

      // Create first
      await recurringPage.openAddForm();
      await recurringPage.fillRecurringForm({
        description,
        amount: 250,
        category: "Shopping",
        frequency: "MONTHLY",
      });
      await recurringPage.saveForm();
      await recurringPage.expectRecurringInList(description);

      // Now delete
      await recurringPage.deleteRecurring(description);
      await recurringPage.expectRecurringNotInList(description);
    });
  });

  test.describe("Filter Operations", () => {
    test("should filter by active status", async ({ page }) => {
      await recurringPage.filterByActive();
      await expect(recurringPage.activeStatusButton).toHaveClass(/v-btn--active/);
    });

    test("should filter by paused status", async ({ page }) => {
      await recurringPage.filterByPaused();
      await expect(recurringPage.pausedStatusButton).toHaveClass(/v-btn--active/);
    });

    test("should filter by all status", async ({ page }) => {
      await recurringPage.filterByAll();
      await expect(recurringPage.allStatusButton).toHaveClass(/v-btn--active/);
    });

    test("should search recurring expenses", async ({ page }) => {
      await recurringPage.search("Netflix");
      // Search should filter the list
      await page.waitForTimeout(500);
    });
  });

  test.describe("Tab Navigation", () => {
    test("should switch between tabs", async ({ page }) => {
      // Start on Overview tab
      await recurringPage.expectOverviewTabActive();

      // Switch to Recurring Details tab
      await recurringPage.switchToRecurringDetailsTab();
      await recurringPage.expectRecurringDetailsTabActive();

      // Switch back to Overview tab
      await recurringPage.switchToOverviewTab();
      await recurringPage.expectOverviewTabActive();
    });

    test("URL should not change when switching tabs", async ({ page }) => {
      const initialUrl = page.url();

      await recurringPage.switchToRecurringDetailsTab();
      expect(page.url()).toBe(initialUrl);

      await recurringPage.switchToOverviewTab();
      expect(page.url()).toBe(initialUrl);
    });
  });
});

test.describe("Recurring Actions", () => {
  let recurringPage: RecurringExpensesPage;
  const testDescription = `Action Test ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    recurringPage = new RecurringExpensesPage(page);
    await recurringPage.navigateTo();

    // Create a test recurring expense for action tests
    await recurringPage.openAddForm();
    await recurringPage.fillRecurringForm({
      description: testDescription,
      amount: 300,
      category: "Utilities",
      frequency: "MONTHLY",
    });
    await recurringPage.saveForm();
  });

  test("should pause a recurring expense", async ({ page }) => {
    await recurringPage.pauseRecurring(testDescription);
    // After pause, the item should show paused status
    await page.waitForTimeout(500);
    // Check for paused chip/indicator
    const item = recurringPage.getRecurringItem(testDescription);
    await expect(item.locator(".v-chip").filter({ hasText: /Paused/i })).toBeVisible();
  });

  test("should resume a paused recurring expense", async ({ page }) => {
    // First pause it
    await recurringPage.pauseRecurring(testDescription);
    await page.waitForTimeout(500);

    // Then resume it
    await recurringPage.resumeRecurring(testDescription);
    await page.waitForTimeout(500);

    // Paused chip should no longer be visible
    const item = recurringPage.getRecurringItem(testDescription);
    await expect(item.locator(".v-chip").filter({ hasText: /Paused/i })).not.toBeVisible();
  });
});
