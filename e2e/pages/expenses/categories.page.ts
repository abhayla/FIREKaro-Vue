import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expense Categories Page Object
 * Standalone page at /expenses/categories with Rules and Categories tabs
 */
export class ExpenseCategoriesPage extends BasePage {
  readonly url = "/expenses/categories";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Page Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Categories.*Rules|Categories/i });
  }

  // Tab Locators
  get rulesTab(): Locator {
    return this.page.getByRole("tab", { name: /Rules/i });
  }

  get categoriesTab(): Locator {
    return this.page.getByRole("tab", { name: /Categories/i });
  }

  // Create Rule Button (next to tabs)
  get createRuleButton(): Locator {
    return this.page.getByRole("button", { name: /Create Rule/i });
  }

  // ============================================
  // Rules Tab Locators
  // ============================================

  get addRuleButton(): Locator {
    return this.page.getByRole("button", { name: /Create.*Rule|Add Rule|First Rule/i });
  }

  get rulesList(): Locator {
    return this.page.locator(".v-list").filter({ hasText: /rule/i });
  }

  getRuleItem(ruleName: string): Locator {
    return this.page.locator(".v-list-item").filter({ hasText: ruleName });
  }

  get rulesCountChip(): Locator {
    return this.page.locator(".v-chip").filter({ hasText: /rules/i });
  }

  get noRulesMessage(): Locator {
    return this.page.getByText(/No Rules Yet/i);
  }

  // AI Suggestions section
  get aiSuggestionsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /suggested rules|Suggestions/i });
  }

  // Rule Editor Dialog
  get ruleEditorDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Rule|Edit Rule|Create Rule/i });
  }

  get ruleNameField(): Locator {
    return this.ruleEditorDialog.getByRole("textbox", { name: /Rule Name|Name/i });
  }

  get ruleTargetCategorySelect(): Locator {
    return this.ruleEditorDialog.locator(".v-select").filter({ hasText: /Target Category|Category/i });
  }

  get addConditionButton(): Locator {
    return this.ruleEditorDialog.getByRole("button", { name: /Add Condition/i });
  }

  get testRuleButton(): Locator {
    return this.ruleEditorDialog.getByRole("button", { name: /Test Rule|Test/i });
  }

  get saveRuleButton(): Locator {
    return this.ruleEditorDialog.getByRole("button", { name: /Save|Create/i });
  }

  get cancelRuleButton(): Locator {
    return this.ruleEditorDialog.getByRole("button", { name: /Cancel/i });
  }

  // ============================================
  // Categories Tab Locators
  // ============================================

  get budgetRuleExplanation(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /50\/30\/20/i });
  }

  get categoriesGrid(): Locator {
    return this.page.locator(".v-row").filter({ has: this.page.locator(".v-card") });
  }

  getCategoryCard(categoryName: string): Locator {
    return this.page.locator(".v-card").filter({ hasText: categoryName });
  }

  get categoryTypeChips(): Locator {
    return this.page.locator(".v-chip").filter({ hasText: /NEEDS|WANTS|SAVINGS/i });
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
    await this.switchToRulesTab();
    // Try Create Rule button first, then fallback to "Create Your First Rule"
    const createBtn = this.createRuleButton.or(this.addRuleButton);
    await createBtn.first().click();
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
        const conditionRows = this.ruleEditorDialog.locator("[class*='condition'], .condition-row");
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
    await this.switchToRulesTab();
    const ruleItem = this.getRuleItem(ruleName);
    await ruleItem.getByRole("button", { name: /Edit/i }).click();
    await this.ruleEditorDialog.waitFor({ state: "visible" });
  }

  async deleteRule(ruleName: string) {
    await this.switchToRulesTab();
    const ruleItem = this.getRuleItem(ruleName);
    await ruleItem.getByRole("button", { name: /Delete/i }).click();
    await this.page.waitForTimeout(300);
  }

  async toggleRule(ruleName: string) {
    await this.switchToRulesTab();
    const ruleItem = this.getRuleItem(ruleName);
    await ruleItem.locator(".v-switch, input[type='checkbox']").click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectRulesTabActive() {
    await expect(this.rulesTab).toHaveAttribute("aria-selected", "true");
  }

  async expectCategoriesTabActive() {
    await expect(this.categoriesTab).toHaveAttribute("aria-selected", "true");
  }

  async expectRuleDialogVisible() {
    await expect(this.ruleEditorDialog).toBeVisible();
  }

  async expectRuleDialogClosed() {
    await expect(this.ruleEditorDialog).not.toBeVisible();
  }

  async expectRuleInList(ruleName: string) {
    await this.switchToRulesTab();
    await expect(this.getRuleItem(ruleName)).toBeVisible();
  }

  async expectRuleNotInList(ruleName: string) {
    await this.switchToRulesTab();
    await expect(this.getRuleItem(ruleName)).not.toBeVisible();
  }

  async expectCategoryVisible(categoryName: string) {
    await this.switchToCategoriesTab();
    await expect(this.getCategoryCard(categoryName)).toBeVisible();
  }

  async expectBudgetRuleExplanationVisible() {
    await this.switchToCategoriesTab();
    await expect(this.budgetRuleExplanation).toBeVisible();
  }

  async expectAISuggestionsVisible() {
    await this.switchToRulesTab();
    await expect(this.aiSuggestionsSection).toBeVisible();
  }

  // Legacy methods for backwards compatibility
  async openCategoriesDialog() {
    // For backwards compatibility - now just navigates to the page
    await this.navigateTo();
  }

  async closeCategoriesDialog() {
    // No-op for standalone page
  }

  async expectDialogVisible() {
    // For backwards compatibility - now checks page loaded
    await this.expectPageLoaded();
  }

  async expectDialogClosed() {
    // No-op for standalone page
  }
}
