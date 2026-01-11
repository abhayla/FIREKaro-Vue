import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expense Categories & Rules Page Object
 * NOTE: Categories is now a dialog accessible from the Track Expenses page,
 * not a standalone page. Use ExpenseTrackingPage to open the dialog.
 *
 * This page object provides helpers for interacting with the Categories dialog.
 */
export class ExpenseCategoriesPage extends BasePage {
  // Categories is now a dialog accessible from the Track page
  readonly url = "/expenses/track";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Dialog Locators
  // ============================================

  get categoriesDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Categories|Rules/i });
  }

  get dialogTitle(): Locator {
    return this.categoriesDialog.locator(".v-card-title, .v-toolbar-title");
  }

  // Tabs within the categories dialog
  get rulesTab(): Locator {
    return this.categoriesDialog.getByRole("tab", { name: /Rules/i });
  }

  get categoriesTab(): Locator {
    return this.categoriesDialog.getByRole("tab", { name: /Categories/i });
  }

  // Close button
  get closeButton(): Locator {
    return this.categoriesDialog.getByRole("button", { name: /Close|Cancel/i });
  }

  // ============================================
  // Rules Tab Locators
  // ============================================

  get addRuleButton(): Locator {
    return this.categoriesDialog.getByRole("button", { name: /Add Rule|New Rule|Create Rule/i });
  }

  get rulesList(): Locator {
    return this.categoriesDialog.locator(".v-list").filter({ hasText: /Rule|rule/i });
  }

  getRuleItem(ruleName: string): Locator {
    return this.categoriesDialog.locator(".v-list-item").filter({ hasText: ruleName });
  }

  // Rule Editor Dialog (nested dialog)
  get ruleEditorDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Rule|Edit Rule|Create Rule/i }).last();
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

  // AI Suggestions section
  get aiSuggestionsSection(): Locator {
    return this.categoriesDialog.locator(".v-card").filter({ hasText: /AI Suggested|Suggestions/i });
  }

  get refreshSuggestionsButton(): Locator {
    return this.categoriesDialog.getByRole("button", { name: /Refresh|Get Suggestions/i });
  }

  // ============================================
  // Categories Tab Locators
  // ============================================

  get categoriesList(): Locator {
    return this.categoriesDialog.locator(".v-list, .v-row").filter({ has: this.page.locator("[class*='mdi-']") });
  }

  getCategoryItem(categoryName: string): Locator {
    return this.categoriesDialog.locator(".v-card, .v-list-item").filter({ hasText: categoryName });
  }

  // ============================================
  // Navigation
  // ============================================

  /**
   * Navigate to Track page and open the Categories dialog
   */
  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
    await this.openCategoriesDialog();
  }

  /**
   * Open the Categories dialog from the Track page
   */
  async openCategoriesDialog() {
    // Look for the categories/settings button in the header
    const categoriesButton = this.page.getByRole("button", { name: /Categories|Rules|Settings/i });
    await categoriesButton.click();
    await this.categoriesDialog.waitFor({ state: "visible" });
  }

  /**
   * Close the Categories dialog
   */
  async closeCategoriesDialog() {
    await this.closeButton.click();
    await this.page.waitForTimeout(300);
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

  async expectDialogVisible() {
    await expect(this.categoriesDialog).toBeVisible();
  }

  async expectDialogClosed() {
    await expect(this.categoriesDialog).not.toBeVisible();
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
    await expect(this.getCategoryItem(categoryName)).toBeVisible();
  }

  async expectAISuggestionsVisible() {
    await this.switchToRulesTab();
    await expect(this.aiSuggestionsSection).toBeVisible();
  }

  async expectRulesTabActive() {
    await expect(this.rulesTab).toHaveAttribute("aria-selected", "true");
  }

  async expectCategoriesTabActive() {
    await expect(this.categoriesTab).toHaveAttribute("aria-selected", "true");
  }
}
