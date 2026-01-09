import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Budgets Page Object
 */
export class BudgetsPage extends BasePage {
  readonly url = "/dashboard/expenses/budgets";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expenses|Budgets/i });
  }

  get setBudgetButton(): Locator {
    return this.page.getByRole("button", { name: /Set Budget|Add Budget/i });
  }

  // Summary cards
  get totalBudgetCard(): Locator {
    return this.getSummaryCardByTitle("Total Budget");
  }

  get totalSpentCard(): Locator {
    return this.getSummaryCardByTitle("Total Spent");
  }

  get remainingCard(): Locator {
    return this.getSummaryCardByTitle("Remaining");
  }

  // Budget form dialog
  get budgetFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Set Budget|Edit Budget/i });
  }

  // Form fields
  get categorySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Category/i });
  }

  get monthlyLimitField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Monthly Limit|Budget Amount/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.budgetFormDialog.getByRole("button", { name: /Save|Set/i });
  }

  get cancelButton(): Locator {
    return this.budgetFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Budget progress bars
  getBudgetProgressForCategory(category: string): Locator {
    return this.page.locator(".v-card").filter({ hasText: category }).locator(".v-progress-linear");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Form Actions
  // ============================================

  async openSetBudgetForm() {
    await this.setBudgetButton.click();
    await this.budgetFormDialog.waitFor({ state: "visible" });
  }

  async setBudget(category: string, limit: number) {
    await this.openSetBudgetForm();
    await this.categorySelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: category }).click();
    await this.page.waitForTimeout(200);

    await this.monthlyLimitField.clear();
    await this.monthlyLimitField.fill(limit.toString());

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

  // ============================================
  // Getters
  // ============================================

  async getTotalBudget(): Promise<string> {
    return await this.getSummaryCardValue("Total Budget");
  }

  async getTotalSpent(): Promise<string> {
    return await this.getSummaryCardValue("Total Spent");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Expenses|Budgets/i })).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.budgetFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.budgetFormDialog).not.toBeVisible();
  }
}
