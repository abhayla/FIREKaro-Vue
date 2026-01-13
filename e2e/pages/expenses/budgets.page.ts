import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Budgets Page Object
 * This page has two tabs: Overview and Budget Details
 */
export class BudgetsPage extends BasePage {
  readonly url = "/expenses/budgets";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Budgets/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: /Overview/i });
  }

  get budgetDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Budget Details/i });
  }

  // Month Navigation
  get monthSelector(): Locator {
    return this.page.locator(".v-text-field").filter({ has: this.page.locator("input[type='month']") });
  }

  get monthInput(): Locator {
    return this.page.locator("input[type='month']");
  }

  // ============================================
  // Overview Tab Locators (50/30/20 Summary)
  // ============================================

  // 50/30/20 Category Cards
  get needsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Needs|50%/i }).first();
  }

  get wantsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Wants|30%/i }).first();
  }

  get savingsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Savings|20%/i }).first();
  }

  // Progress bars
  get needsProgressBar(): Locator {
    return this.needsCard.locator(".v-progress-linear");
  }

  get wantsProgressBar(): Locator {
    return this.wantsCard.locator(".v-progress-linear");
  }

  get savingsProgressBar(): Locator {
    return this.savingsCard.locator(".v-progress-linear");
  }

  // Budget vs Actual Cards
  get budgetVsActualSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Budget vs Actual/i });
  }

  // Charts
  get budgetChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Budget|Trend/i }).locator("canvas").first();
  }

  // ============================================
  // Budget Details Tab Locators
  // ============================================

  get setBudgetButton(): Locator {
    return this.page.getByRole("button", { name: /Set Budget|Create Budget/i });
  }

  get copyFromPreviousButton(): Locator {
    return this.page.getByRole("button", { name: /Copy from Previous|Previous Month/i });
  }

  // Income field
  get incomeField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Monthly Income|Income/i });
  }

  // Budget form dialog
  get budgetFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Set Budget|Edit Budget|Create Budget/i });
  }

  // Form fields in dialog
  get dialogIncomeField(): Locator {
    return this.budgetFormDialog.getByRole("spinbutton", { name: /Monthly Income|Income/i });
  }

  get dialogNeedsField(): Locator {
    return this.budgetFormDialog.getByRole("spinbutton", { name: /Needs/i });
  }

  get dialogWantsField(): Locator {
    return this.budgetFormDialog.getByRole("spinbutton", { name: /Wants/i });
  }

  get dialogSavingsField(): Locator {
    return this.budgetFormDialog.getByRole("spinbutton", { name: /Savings/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.budgetFormDialog.getByRole("button", { name: /Save|Set/i });
  }

  get cancelButton(): Locator {
    return this.budgetFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Budget history table
  get budgetHistoryTable(): Locator {
    return this.page.locator(".v-data-table, .v-table").first();
  }

  // Category budget items
  getBudgetItemForCategory(category: string): Locator {
    return this.page.locator(".v-card, .v-list-item").filter({ hasText: category });
  }

  getBudgetProgressForCategory(category: string): Locator {
    return this.getBudgetItemForCategory(category).locator(".v-progress-linear");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async switchToOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  async switchToBudgetDetailsTab() {
    await this.budgetDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  async setMonth(month: string) {
    await this.monthInput.fill(month); // Format: YYYY-MM
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Form Actions
  // ============================================

  async openSetBudgetForm() {
    await this.switchToBudgetDetailsTab();
    await this.setBudgetButton.click();
    await this.budgetFormDialog.waitFor({ state: "visible" });
  }

  async fillBudgetForm(data: {
    income?: number;
    needs?: number;
    wants?: number;
    savings?: number;
  }) {
    if (data.income !== undefined) {
      await this.dialogIncomeField.clear();
      await this.dialogIncomeField.fill(data.income.toString());
    }

    if (data.needs !== undefined) {
      await this.dialogNeedsField.clear();
      await this.dialogNeedsField.fill(data.needs.toString());
    }

    if (data.wants !== undefined) {
      await this.dialogWantsField.clear();
      await this.dialogWantsField.fill(data.wants.toString());
    }

    if (data.savings !== undefined) {
      await this.dialogSavingsField.clear();
      await this.dialogSavingsField.fill(data.savings.toString());
    }
  }

  async setBudget(income: number) {
    await this.openSetBudgetForm();
    await this.fillBudgetForm({ income });
    await this.saveForm();
  }

  async saveForm() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelForm() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  async copyFromPreviousMonth() {
    await this.switchToBudgetDetailsTab();
    await this.copyFromPreviousButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getNeedsUsage(): Promise<string> {
    const value = this.needsCard.locator(".text-h5, .font-weight-bold").first();
    return await value.textContent() ?? "";
  }

  async getWantsUsage(): Promise<string> {
    const value = this.wantsCard.locator(".text-h5, .font-weight-bold").first();
    return await value.textContent() ?? "";
  }

  async getSavingsUsage(): Promise<string> {
    const value = this.savingsCard.locator(".text-h5, .font-weight-bold").first();
    return await value.textContent() ?? "";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectBudgetDetailsTabActive() {
    await expect(this.budgetDetailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.budgetFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.budgetFormDialog).not.toBeVisible();
  }

  async expect503020CardsVisible() {
    await this.switchToOverviewTab();
    await expect(this.needsCard).toBeVisible();
    await expect(this.wantsCard).toBeVisible();
    await expect(this.savingsCard).toBeVisible();
  }

  async expectProgressBarsVisible() {
    await this.switchToOverviewTab();
    await expect(this.needsProgressBar).toBeVisible();
    await expect(this.wantsProgressBar).toBeVisible();
    await expect(this.savingsProgressBar).toBeVisible();
  }

  async expectBudgetHistoryVisible() {
    await this.switchToBudgetDetailsTab();
    await expect(this.budgetHistoryTable).toBeVisible();
  }
}
