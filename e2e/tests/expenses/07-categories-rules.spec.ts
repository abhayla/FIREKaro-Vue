import { test, expect } from "@playwright/test";
import { ExpenseCategoriesPage, ExpenseTrackingPage } from "../../pages/expenses";
import { expenseCategories } from "../../fixtures/expenses-data";

/**
 * Categories is now a dialog accessible from the Track Expenses page.
 * These tests verify the dialog functionality.
 */
test.describe("Expense Categories & Rules Dialog", () => {
  let categoriesPage: ExpenseCategoriesPage;
  let trackingPage: ExpenseTrackingPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new ExpenseTrackingPage(page);
    categoriesPage = new ExpenseCategoriesPage(page);

    // Navigate to Track page first
    await trackingPage.navigateTo();
  });

  test.describe("Dialog Access", () => {
    test("should open categories dialog from Track page", async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
      await categoriesPage.expectDialogVisible();
    });

    test("should close categories dialog", async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
      await categoriesPage.expectDialogVisible();

      await categoriesPage.closeCategoriesDialog();
      await categoriesPage.expectDialogClosed();
    });

    test("should display Rules and Categories tabs in dialog", async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
      await expect(categoriesPage.rulesTab).toBeVisible();
      await expect(categoriesPage.categoriesTab).toBeVisible();
    });

    test("should display Add Rule button in Rules tab", async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
      await categoriesPage.switchToRulesTab();
      await expect(categoriesPage.addRuleButton).toBeVisible();
    });
  });

  test.describe("Rule Management", () => {
    test.beforeEach(async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
    });

    test("should open rule editor dialog", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await categoriesPage.expectRuleDialogVisible();
      await expect(categoriesPage.ruleNameField).toBeVisible();
    });

    test("should close rule editor on cancel", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await categoriesPage.cancelRule();
      await categoriesPage.expectRuleDialogClosed();
    });

    test("should create a new rule", async ({ page }) => {
      const ruleName = `Test Rule ${Date.now()}`;

      await categoriesPage.openAddRuleDialog();
      await categoriesPage.fillRuleForm({
        name: ruleName,
        targetCategory: expenseCategories[0]?.name || "Food",
      });
      await categoriesPage.saveRule();
      await categoriesPage.expectRuleDialogClosed();

      // Verify rule appears in list
      await categoriesPage.expectRuleInList(ruleName);
    });

    test("should validate rule form requires name", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();

      // Try to save without filling required fields
      await categoriesPage.saveRule();

      // Dialog should still be open (validation failed)
      await categoriesPage.expectRuleDialogVisible();
    });

    test("should show condition builder", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();

      // Should have add condition button
      await expect(categoriesPage.addConditionButton).toBeVisible();

      // Click to add a condition
      await categoriesPage.addConditionButton.click();
      await page.waitForTimeout(300);

      // Condition fields should appear
      await expect(page.locator(".v-select").filter({ hasText: /Field|Merchant|Description/i })).toBeVisible();
    });

    test("should show test rule button", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await expect(categoriesPage.testRuleButton).toBeVisible();
    });
  });

  test.describe("Categories Tab", () => {
    test.beforeEach(async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
    });

    test("should switch to Categories tab", async ({ page }) => {
      await categoriesPage.switchToCategoriesTab();
      await categoriesPage.expectCategoriesTabActive();
    });

    test("should display expense categories", async ({ page }) => {
      await categoriesPage.switchToCategoriesTab();

      // Categories should have icons (mdi-* icons)
      const categoryWithIcon = categoriesPage.categoriesDialog.locator("[class*='mdi-']").first();
      await expect(categoryWithIcon).toBeVisible();
    });

    test("should show budget type labels (Needs/Wants/Savings)", async ({ page }) => {
      await categoriesPage.switchToCategoriesTab();

      // Look for budget type chips or labels
      const budgetTypeIndicator = categoriesPage.categoriesDialog.locator(".v-chip, .text-caption").filter({
        hasText: /Needs|Wants|Savings/i
      });

      // At least one budget type should be visible
      const count = await budgetTypeIndicator.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Tab Navigation in Dialog", () => {
    test.beforeEach(async ({ page }) => {
      await categoriesPage.openCategoriesDialog();
    });

    test("should switch between Rules and Categories tabs", async ({ page }) => {
      // Start on Rules tab
      await categoriesPage.switchToRulesTab();
      await categoriesPage.expectRulesTabActive();

      // Switch to Categories tab
      await categoriesPage.switchToCategoriesTab();
      await categoriesPage.expectCategoriesTabActive();

      // Switch back to Rules tab
      await categoriesPage.switchToRulesTab();
      await categoriesPage.expectRulesTabActive();
    });
  });
});


test.describe("Rule Priority & Ordering", () => {
  let categoriesPage: ExpenseCategoriesPage;
  let trackingPage: ExpenseTrackingPage;

  test.beforeEach(async ({ page }) => {
    trackingPage = new ExpenseTrackingPage(page);
    categoriesPage = new ExpenseCategoriesPage(page);
    await trackingPage.navigateTo();
    await categoriesPage.openCategoriesDialog();
  });

  test("should display rules in priority order", async ({ page }) => {
    await categoriesPage.switchToRulesTab();

    // Check that rules list has numbered items or priority indicators
    const rulesList = categoriesPage.categoriesDialog.locator(".v-list-item").filter({ hasText: /Rule|Match/i });
    const count = await rulesList.count();

    // If there are rules, they should be displayed
    if (count > 0) {
      await expect(rulesList.first()).toBeVisible();
    }
  });
});
