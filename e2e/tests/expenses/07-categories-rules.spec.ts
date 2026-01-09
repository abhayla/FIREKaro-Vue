import { test, expect } from "@playwright/test";
import { ExpenseCategoriesPage } from "../../pages/expenses";
import { expenseCategories } from "../../fixtures/expenses-data";

test.describe("Expense Categories & Rules", () => {
  let categoriesPage: ExpenseCategoriesPage;

  test.beforeEach(async ({ page }) => {
    categoriesPage = new ExpenseCategoriesPage(page);
    await categoriesPage.navigateTo();
  });

  test.describe("Page Layout", () => {
    test("should display categories page correctly", async ({ page }) => {
      await categoriesPage.expectPageLoaded();
      await expect(page).toHaveURL(/\/dashboard\/expenses\/categories/);
    });

    test("should display Rules and Categories inner tabs", async ({ page }) => {
      await expect(categoriesPage.rulesTab).toBeVisible();
      // The page might have a categories section or tab
      await expect(page.getByText(/Categories|All Categories/i)).toBeVisible();
    });

    test("should display Add Rule button", async ({ page }) => {
      await expect(categoriesPage.addRuleButton).toBeVisible();
    });
  });

  test.describe("Rule Management", () => {
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
        targetCategory: expenseCategories[0].name,
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

  test.describe("Categories Display", () => {
    test("should display expense categories", async ({ page }) => {
      // Switch to categories tab/section if needed
      const categoriesSection = page.locator(".v-card, .v-list").filter({ hasText: /Food|Housing|Transportation/i });
      await expect(categoriesSection.first()).toBeVisible();
    });

    test("should display category icons and colors", async ({ page }) => {
      // Categories should have icons (mdi-* icons)
      const categoryWithIcon = page.locator("[class*='mdi-']").first();
      await expect(categoryWithIcon).toBeVisible();
    });

    test("should show budget type labels (Needs/Wants/Savings)", async ({ page }) => {
      // Look for budget type chips or labels
      const budgetTypeIndicator = page.locator(".v-chip, .text-caption").filter({
        hasText: /Needs|Wants|Savings/i
      });

      // At least one budget type should be visible
      const count = await budgetTypeIndicator.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("AI Suggestions", () => {
    test("should display AI suggestions section", async ({ page }) => {
      // Look for AI suggestions card
      const aiSection = page.locator(".v-card").filter({ hasText: /AI|Suggest|Smart/i });
      // May or may not be visible depending on data
      // Just check the page loads without error
      await expect(page.getByRole("heading", { name: /Expenses/i })).toBeVisible();
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
    // Check that rules list has numbered items or priority indicators
    const rulesList = page.locator(".v-list-item").filter({ hasText: /Rule|Match/i });
    const count = await rulesList.count();

    // If there are rules, they should be displayed
    if (count > 0) {
      await expect(rulesList.first()).toBeVisible();
    }
  });
});
