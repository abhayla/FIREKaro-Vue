import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * ESOP Page Object
 * Handles ESOP/RSU grant management with two-tab pattern (Overview + Item Details)
 */
export class ESOPPage extends BasePage {
  readonly url = "/investments/esop";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  get pageSubtitle(): Locator {
    return this.page.getByText(/ESOPs.*RSUs/i);
  }

  // Tab navigation (Overview / Item Details)
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: /Overview/i });
  }

  get detailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Item Details/i });
  }

  // Financial year selector
  get financialYearSelector(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /FY|20\d{2}/i });
  }

  // Summary cards (Overview tab)
  get totalValueCard(): Locator {
    return this.getSummaryCardByTitle("Total Value");
  }

  get vestedValueCard(): Locator {
    return this.getSummaryCardByTitle("Vested Value");
  }

  get exercisableCard(): Locator {
    return this.getSummaryCardByTitle("Exercisable");
  }

  get unvestedCard(): Locator {
    return this.getSummaryCardByTitle("Unvested");
  }

  // Buttons
  get addGrantButton(): Locator {
    return this.page.getByRole("button", { name: /Add Grant/i });
  }

  get viewDetailsButton(): Locator {
    return this.page.getByRole("button", { name: /View Details|View All Grants/i });
  }

  // Charts
  get grantTypeChart(): Locator {
    return this.page.locator("canvas").first();
  }

  get vestingStatusChart(): Locator {
    return this.page.locator("canvas").nth(1);
  }

  // Grant list (Quick View section)
  get grantsList(): Locator {
    return this.page.locator(".v-list").filter({ has: this.page.locator(".v-avatar") });
  }

  // Summary section
  get totalGrantsCount(): Locator {
    return this.page.locator(".text-h4").filter({ hasText: /^\d+$/ }).first();
  }

  get activeGrantsCount(): Locator {
    return this.page.locator(".text-success.text-h4");
  }

  get companiesCount(): Locator {
    return this.page.locator(".text-primary.text-h4");
  }

  // Tax rules section
  get taxRulesSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /ESOP Tax Rules/i });
  }

  // Add Grant Dialog
  get addGrantDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add ESOP|Add Grant/i });
  }

  // Exercise Dialog
  get exerciseDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Exercise Options/i });
  }

  get exerciseUnitsField(): Locator {
    return this.exerciseDialog.getByRole("spinbutton", { name: /Units to Exercise/i });
  }

  get exerciseButton(): Locator {
    return this.exerciseDialog.getByRole("button", { name: /Exercise/i });
  }

  get cancelExerciseButton(): Locator {
    return this.exerciseDialog.getByRole("button", { name: /Cancel/i });
  }

  // Item Details tab - data table
  get grantsTable(): Locator {
    return this.page.locator(".v-data-table, .v-table");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async navigateToOverview() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  async navigateToDetails() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Actions
  // ============================================

  async selectFinancialYear(year: string) {
    await this.financialYearSelector.click();
    await this.page.getByRole("option", { name: new RegExp(year, "i") }).click();
    await this.page.waitForTimeout(300);
  }

  async openAddGrantDialog() {
    await this.addGrantButton.click();
    await this.addGrantDialog.waitFor({ state: "visible" });
  }

  async closeAddGrantDialog() {
    await this.addGrantDialog.getByRole("button", { name: /Close|Cancel/i }).click();
    await this.page.waitForTimeout(300);
  }

  async clickViewAllGrants() {
    await this.viewDetailsButton.click();
    await this.page.waitForTimeout(300);
  }

  async openExerciseDialog(grantCompany: string) {
    // Click on exercise button for a specific grant
    const grantRow = this.page.locator(".v-list-item, tr").filter({ hasText: grantCompany });
    const exerciseBtn = grantRow.getByRole("button", { name: /Exercise/i });

    if (await exerciseBtn.isVisible()) {
      await exerciseBtn.click();
      await this.exerciseDialog.waitFor({ state: "visible" });
    }
  }

  async exerciseGrant(units: number) {
    await this.exerciseUnitsField.clear();
    await this.exerciseUnitsField.fill(units.toString());
    await this.exerciseButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelExercise() {
    await this.cancelExerciseButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalValue(): Promise<string> {
    return await this.getSummaryCardValue("Total Value");
  }

  async getVestedValue(): Promise<string> {
    return await this.getSummaryCardValue("Vested Value");
  }

  async getExercisableValue(): Promise<string> {
    return await this.getSummaryCardValue("Exercisable");
  }

  async getUnvestedValue(): Promise<string> {
    return await this.getSummaryCardValue("Unvested");
  }

  async getTotalGrantsNumber(): Promise<number> {
    const text = await this.page
      .locator(".text-h4")
      .filter({ hasText: /^\d+$/ })
      .first()
      .textContent();
    return parseInt(text || "0", 10);
  }

  async getActiveGrantsNumber(): Promise<number> {
    const text = await this.activeGrantsCount.textContent();
    return parseInt(text || "0", 10);
  }

  async getGrantCount(): Promise<number> {
    // Count grants in the quick view list
    const listItems = this.page.locator(".v-list-item").filter({ has: this.page.locator(".v-avatar") });
    return await listItems.count();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /ESOPs/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectDetailsTabActive() {
    await expect(this.detailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalValueCard).toBeVisible();
    await expect(this.vestedValueCard).toBeVisible();
    await expect(this.exercisableCard).toBeVisible();
    await expect(this.unvestedCard).toBeVisible();
  }

  async expectChartsVisible() {
    await expect(this.grantTypeChart).toBeVisible();
    await expect(this.vestingStatusChart).toBeVisible();
  }

  async expectTaxRulesSectionVisible() {
    await expect(this.taxRulesSection).toBeVisible();
    await expect(this.page.getByText(/At Vesting/i)).toBeVisible();
    await expect(this.page.getByText(/Listed.*LTCG/i)).toBeVisible();
    await expect(this.page.getByText(/Unlisted.*LTCG/i)).toBeVisible();
    await expect(this.page.getByText(/Startup Benefit/i)).toBeVisible();
  }

  async expectAddGrantDialogVisible() {
    await expect(this.addGrantDialog).toBeVisible();
  }

  async expectAddGrantDialogClosed() {
    await expect(this.addGrantDialog).not.toBeVisible();
  }

  async expectExerciseDialogVisible() {
    await expect(this.exerciseDialog).toBeVisible();
  }

  async expectExerciseDialogClosed() {
    await expect(this.exerciseDialog).not.toBeVisible();
  }

  async expectGrantInList(companyName: string) {
    const grant = this.page.locator(".v-list-item").filter({ hasText: companyName });
    await expect(grant).toBeVisible();
  }

  async expectGrantNotInList(companyName: string) {
    const grant = this.page.locator(".v-list-item").filter({ hasText: companyName });
    await expect(grant).not.toBeVisible();
  }

  async expectGrantTypeBadge(type: string) {
    await expect(this.page.locator(".v-avatar, .v-chip").filter({ hasText: new RegExp(type.charAt(0), "i") })).toBeVisible();
  }

  async expectFinancialYearSelected(year: string) {
    await expect(this.financialYearSelector).toContainText(year);
  }
}
