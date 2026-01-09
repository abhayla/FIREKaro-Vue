import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Scenarios Page Object
 * Handles what-if tax scenario management
 */
export class ScenariosPage extends BasePage {
  readonly url = "/dashboard/tax-planning/scenarios";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  get scenariosTab(): Locator {
    return this.page.getByRole("tab", { name: /Scenarios/i });
  }

  // Baseline card
  get baselineCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /BASELINE/i });
  }

  get createBaselineButton(): Locator {
    return this.page.getByRole("button", { name: /Create Baseline/i });
  }

  get refreshBaselineButton(): Locator {
    return this.baselineCard.getByRole("button", { name: /Refresh/i });
  }

  // Scenario cards
  get scenarioCards(): Locator {
    return this.page.locator(".scenario-card");
  }

  get newScenarioButton(): Locator {
    return this.page.getByRole("button", { name: /New Scenario/i });
  }

  get compareButton(): Locator {
    return this.page.getByRole("button", { name: /Compare/i });
  }

  // Smart suggestions
  get smartSuggestionsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Smart Suggestions/i });
  }

  get suggestionCards(): Locator {
    return this.smartSuggestionsCard.locator(".suggestion-card, .v-card");
  }

  // Scenario editor dialog
  get scenarioEditorDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Create.*Scenario|Edit Scenario/i });
  }

  get scenarioNameInput(): Locator {
    return this.scenarioEditorDialog.locator('input').first();
  }

  get scenarioDescriptionInput(): Locator {
    return this.scenarioEditorDialog.locator("textarea");
  }

  get regimeSelect(): Locator {
    return this.scenarioEditorDialog.locator(".v-select").filter({ hasText: /Regime/i });
  }

  get section80CInput(): Locator {
    return this.scenarioEditorDialog.locator('input[type="number"]').filter({ hasText: /80C/i });
  }

  get saveScenarioButton(): Locator {
    return this.scenarioEditorDialog.getByRole("button", { name: /Create|Update/i });
  }

  get cancelScenarioButton(): Locator {
    return this.scenarioEditorDialog.getByRole("button", { name: /Cancel/i });
  }

  // Comparison dialog
  get comparisonDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Compare Scenarios/i });
  }

  get comparisonTable(): Locator {
    return this.comparisonDialog.locator(".v-table");
  }

  get closeComparisonButton(): Locator {
    return this.comparisonDialog.getByRole("button", { name: /Close/i });
  }

  // No baseline state
  get noBaselineMessage(): Locator {
    return this.page.locator("text=No Baseline Scenario");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Actions
  // ============================================

  async createBaseline() {
    await this.createBaselineButton.click();
    await this.page.waitForTimeout(500);
  }

  async refreshBaseline() {
    await this.refreshBaselineButton.click();
    await this.page.waitForTimeout(500);
  }

  async openNewScenarioDialog() {
    await this.newScenarioButton.click();
    await expect(this.scenarioEditorDialog).toBeVisible();
  }

  async fillScenarioForm(data: {
    name: string;
    description?: string;
    regime?: "OLD" | "NEW";
  }) {
    await this.scenarioNameInput.fill(data.name);

    if (data.description) {
      await this.scenarioDescriptionInput.fill(data.description);
    }

    if (data.regime) {
      await this.regimeSelect.click();
      const regimeName = data.regime === "NEW" ? "New Regime" : "Old Regime";
      await this.page.getByRole("option", { name: regimeName }).click();
    }
  }

  async saveScenario() {
    await this.saveScenarioButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelScenario() {
    await this.cancelScenarioButton.click();
  }

  async selectScenarioForComparison(scenarioName: string) {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    await card.locator(".v-checkbox").click();
  }

  async openComparison() {
    await this.compareButton.click();
    await expect(this.comparisonDialog).toBeVisible();
  }

  async closeComparison() {
    await this.closeComparisonButton.click();
  }

  async editScenario(scenarioName: string) {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    await card.getByRole("button", { name: /Edit/i }).click();
    await expect(this.scenarioEditorDialog).toBeVisible();
  }

  async deleteScenario(scenarioName: string) {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    await card.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion
    const confirmButton = this.page.getByRole("button", { name: /Delete/i }).last();
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  async applySuggestion(suggestionName: string) {
    const suggestion = this.smartSuggestionsCard.locator(".v-card").filter({ hasText: suggestionName });
    await suggestion.getByRole("button", { name: /Create Scenario/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getScenarioCount(): Promise<number> {
    return await this.scenarioCards.count();
  }

  async getSuggestionCount(): Promise<number> {
    return await this.suggestionCards.count();
  }

  async getBaselineRegime(): Promise<string> {
    const chip = this.baselineCard.locator(".v-chip").filter({ hasText: /Regime/i });
    return (await chip.textContent()) || "";
  }

  async getBaselineTax(): Promise<string> {
    const value = this.baselineCard.locator(".text-currency").filter({ hasText: /₹/ }).last();
    return (await value.textContent()) || "₹0";
  }

  async getScenarioTax(scenarioName: string): Promise<string> {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    const value = card.locator(".text-currency").filter({ hasText: /₹/ }).first();
    return (await value.textContent()) || "₹0";
  }

  async getScenarioSavings(scenarioName: string): Promise<string> {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    const savings = card.locator(".v-chip").filter({ hasText: /Save/i });
    return (await savings.textContent()) || "";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    // Wait for tabs to update their state after route change
    await this.page.waitForTimeout(300);
    await expect(this.scenariosTab).toHaveAttribute("aria-selected", "true", { timeout: 5000 });
  }

  async expectBaselineVisible() {
    await expect(this.baselineCard).toBeVisible();
  }

  async expectNoBaseline() {
    await expect(this.noBaselineMessage).toBeVisible();
    await expect(this.createBaselineButton).toBeVisible();
  }

  async expectSmartSuggestionsVisible() {
    await expect(this.smartSuggestionsCard).toBeVisible();
  }

  async expectScenarioEditorVisible() {
    await expect(this.scenarioEditorDialog).toBeVisible();
  }

  async expectScenarioEditorClosed() {
    await expect(this.scenarioEditorDialog).not.toBeVisible();
  }

  async expectComparisonVisible() {
    await expect(this.comparisonDialog).toBeVisible();
    await expect(this.comparisonTable).toBeVisible();
  }

  async expectComparisonClosed() {
    await expect(this.comparisonDialog).not.toBeVisible();
  }

  async expectScenarioExists(scenarioName: string) {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    await expect(card).toBeVisible();
  }

  async expectScenarioNotExists(scenarioName: string) {
    const card = this.page.locator(".scenario-card").filter({ hasText: scenarioName });
    await expect(card).not.toBeVisible();
  }
}
