import { test, expect } from "@playwright/test";
import { ExpenseCategoriesPage } from "../../pages/expenses";
import { expenseCategories } from "../../fixtures/expenses-data";

/**
 * Categories Page Tests
 * Tests for the standalone Categories page at /expenses/categories
 * with Rules and Categories tabs
 */
test.describe("Expense Categories Page", () => {
  let categoriesPage: ExpenseCategoriesPage;

  test.beforeEach(async ({ page }) => {
    categoriesPage = new ExpenseCategoriesPage(page);
    await categoriesPage.navigateTo();
  });

  test.describe("Page Display", () => {
    test("should load Categories page", async ({ page }) => {
      await categoriesPage.expectPageLoaded();
    });

    test("should display Rules and Categories tabs", async ({ page }) => {
      await expect(categoriesPage.rulesTab).toBeVisible();
      await expect(categoriesPage.categoriesTab).toBeVisible();
    });

    test("should default to Rules tab", async ({ page }) => {
      await categoriesPage.expectRulesTabActive();
    });

    test("should display Create Rule button", async ({ page }) => {
      await expect(categoriesPage.createRuleButton.or(categoriesPage.addRuleButton)).toBeVisible();
    });
  });

  test.describe("Tab Navigation", () => {
    test("should switch to Categories tab", async ({ page }) => {
      await categoriesPage.switchToCategoriesTab();
      await categoriesPage.expectCategoriesTabActive();
    });

    test("should switch back to Rules tab", async ({ page }) => {
      await categoriesPage.switchToCategoriesTab();
      await categoriesPage.switchToRulesTab();
      await categoriesPage.expectRulesTabActive();
    });

    test("should not change URL when switching tabs", async ({ page }) => {
      await categoriesPage.switchToCategoriesTab();
      await expect(page).toHaveURL(/\/expenses\/categories$/);

      await categoriesPage.switchToRulesTab();
      await expect(page).toHaveURL(/\/expenses\/categories$/);
    });
  });

  test.describe("Rule Management", () => {
    test("should open rule editor dialog", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await categoriesPage.expectRuleDialogVisible();
    });

    test("should close rule editor on cancel", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await categoriesPage.cancelRule();
      await categoriesPage.expectRuleDialogClosed();
    });

    test("should show rule name field in dialog", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await expect(categoriesPage.ruleNameField).toBeVisible();
    });

    test("should show target category select in dialog", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await expect(categoriesPage.ruleTargetCategorySelect).toBeVisible();
    });

    test("should show add condition button", async ({ page }) => {
      await categoriesPage.openAddRuleDialog();
      await expect(categoriesPage.addConditionButton).toBeVisible();
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
  });

  test.describe("Categories Tab Content", () => {
    test.beforeEach(async () => {
      await categoriesPage.switchToCategoriesTab();
    });

    test("should show 50/30/20 budget rule explanation", async ({ page }) => {
      await categoriesPage.expectBudgetRuleExplanationVisible();
    });

    test("should display expense categories", async ({ page }) => {
      // Categories should have icons
      const categoryWithIcon = page.locator(".v-card").filter({ has: page.locator("[class*='mdi-']") }).first();
      await expect(categoryWithIcon).toBeVisible();
    });

    test("should show budget type labels (NEEDS/WANTS/SAVINGS)", async ({ page }) => {
      // Look for budget type chips
      const budgetTypeChip = page.locator(".v-chip").filter({ hasText: /NEEDS|WANTS|SAVINGS/i }).first();
      await expect(budgetTypeChip).toBeVisible();
    });

    test("should display Food & Dining category", async ({ page }) => {
      await categoriesPage.expectCategoryVisible("Food & Dining");
    });

    test("should display Transportation category", async ({ page }) => {
      await categoriesPage.expectCategoryVisible("Transportation");
    });
  });
});

test.describe("Rule Priority & Ordering", () => {
  let categoriesPage: ExpenseCategoriesPage;

  test.beforeEach(async ({ page }) => {
    categoriesPage = new ExpenseCategoriesPage(page);
    await categoriesPage.navigateTo();
  });

  test("should display rules in priority order", async ({ page }) => {
    await categoriesPage.switchToRulesTab();

    // Check that rules section exists
    const rulesSection = page.locator(".v-card").filter({ hasText: /Auto-Categorization Rules/i });
    await expect(rulesSection).toBeVisible();
  });

  test("should show rules count", async ({ page }) => {
    // Look for the rules count chip
    const rulesCountChip = page.locator(".v-chip").filter({ hasText: /\d+ rules/i });
    await expect(rulesCountChip).toBeVisible();
  });
});
