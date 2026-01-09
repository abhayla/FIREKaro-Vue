import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expense Categories & Rules Page Object
 */
export class ExpenseCategoriesPage extends BasePage {
  readonly url = "/dashboard/expenses/categories";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expenses/i });
  }

  // Tabs within the categories page
  get rulesTab(): Locator {
    return this.page.getByRole("tab", { name: /Rules/i });
  }

  get categoriesTab(): Locator {
    return this.page.locator(".v-tabs").getByRole("tab", { name: /Categories/i });
  }

  // Rules section
  get addRuleButton(): Locator {
    return this.page.getByRole("button", { name: /Add Rule|New Rule|Create Rule/i });
  }

  get rulesList(): Locator {
    return this.page.locator(".v-list").filter({ hasText: /Rule|rule/i });
  }

  getRuleItem(ruleName: string): Locator {
    return this.page.locator(".v-list-item").filter({ hasText: ruleName });
  }

  // Rule Editor Dialog
  get ruleEditorDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Rule|Edit Rule|Create Rule/i });
  }

  get ruleNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Rule Name|Name/i });
  }

  get ruleTargetCategorySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Target Category|Category/i });
  }

  get addConditionButton(): Locator {
    return this.page.getByRole("button", { name: /Add Condition/i });
  }

  get testRuleButton(): Locator {
    return this.page.getByRole("button", { name: /Test Rule|Test/i });
  }

  get saveRuleButton(): Locator {
    return this.ruleEditorDialog.getByRole("button", { name: /Save|Create/i });
  }

  get cancelRuleButton(): Locator {
    return this.ruleEditorDialog.getByRole("button", { name: /Cancel/i });
  }

  // AI Suggestions section
  get aiSuggestionsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /AI Suggested|Suggestions/i });
  }

  get refreshSuggestionsButton(): Locator {
    return this.page.getByRole("button", { name: /Refresh|Get Suggestions/i });
  }

  // Categories list
  get categoriesList(): Locator {
    return this.page.locator(".v-list, .v-row").filter({ has: this.page.locator("[class*='mdi-']") });
  }

  getCategoryItem(categoryName: string): Locator {
    return this.page.locator(".v-card, .v-list-item").filter({ hasText: categoryName });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async switchToRulesTab() {
    await this.rulesTab.click();
    await this.page.waitForTimeout(300);
  }

  async switchToCategoriesTab() {
    await this.categoriesTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Rule Actions
  // ============================================

  async openAddRuleDialog() {
    await this.addRuleButton.click();
    await this.ruleEditorDialog.waitFor({ state: "visible" });
  }

  async fillRuleForm(data: {
    name?: string;
    targetCategory?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: string;
    }>;
  }) {
    if (data.name) {
      await this.ruleNameField.clear();
      await this.ruleNameField.fill(data.name);
    }

    if (data.targetCategory) {
      await this.ruleTargetCategorySelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.targetCategory }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.conditions) {
      for (const condition of data.conditions) {
        await this.addConditionButton.click();
        await this.page.waitForTimeout(200);

        // Fill condition fields (last added condition row)
        const conditionRows = this.page.locator("[class*='condition'], .condition-row");
        const lastRow = conditionRows.last();

        // Select field
        const fieldSelect = lastRow.locator(".v-select").first();
        await fieldSelect.click();
        await this.page.waitForTimeout(200);
        await this.page.getByRole("option", { name: condition.field }).click();
        await this.page.waitForTimeout(200);

        // Select operator
        const operatorSelect = lastRow.locator(".v-select").nth(1);
        await operatorSelect.click();
        await this.page.waitForTimeout(200);
        await this.page.getByRole("option", { name: condition.operator }).click();
        await this.page.waitForTimeout(200);

        // Fill value
        const valueField = lastRow.locator("input").last();
        await valueField.fill(condition.value);
      }
    }
  }

  async saveRule() {
    await this.saveRuleButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelRule() {
    await this.cancelRuleButton.click();
    await this.page.waitForTimeout(300);
  }

  async editRule(ruleName: string) {
    const ruleItem = this.getRuleItem(ruleName);
    await ruleItem.getByRole("button", { name: /Edit/i }).click();
    await this.ruleEditorDialog.waitFor({ state: "visible" });
  }

  async deleteRule(ruleName: string) {
    const ruleItem = this.getRuleItem(ruleName);
    await ruleItem.getByRole("button", { name: /Delete/i }).click();
    await this.page.waitForTimeout(300);
  }

  async toggleRule(ruleName: string) {
    const ruleItem = this.getRuleItem(ruleName);
    await ruleItem.locator(".v-switch, input[type='checkbox']").click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Expenses/i })).toBeVisible();
  }

  async expectRuleDialogVisible() {
    await expect(this.ruleEditorDialog).toBeVisible();
  }

  async expectRuleDialogClosed() {
    await expect(this.ruleEditorDialog).not.toBeVisible();
  }

  async expectRuleInList(ruleName: string) {
    await expect(this.getRuleItem(ruleName)).toBeVisible();
  }

  async expectRuleNotInList(ruleName: string) {
    await expect(this.getRuleItem(ruleName)).not.toBeVisible();
  }

  async expectCategoryVisible(categoryName: string) {
    await expect(this.getCategoryItem(categoryName)).toBeVisible();
  }

  async expectAISuggestionsVisible() {
    await expect(this.aiSuggestionsSection).toBeVisible();
  }
}
