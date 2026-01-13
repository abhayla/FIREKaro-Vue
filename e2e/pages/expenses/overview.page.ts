import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expenses Landing Page Object
 * This is the main expenses landing page with summary cards, smart alerts, and quick navigation
 */
export class ExpensesOverviewPage extends BasePage {
  readonly url = "/expenses";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expenses/i });
  }

  // Summary Cards
  get totalExpensesCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Expenses/i });
  }

  get budgetUsageCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Budget Usage/i });
  }

  get recurringCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Recurring/i }).first();
  }

  get topCategoryCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Top Category/i });
  }

  // Smart Alerts
  get smartAlerts(): Locator {
    return this.page.locator(".v-alert");
  }

  get budgetExceededAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /Budget Exceeded|Budget Critical/i });
  }

  get noBudgetAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /No Budget Set/i });
  }

  get recurringDueAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /Recurring Due/i });
  }

  // Quick Navigation Cards
  get quickNavSection(): Locator {
    return this.page.locator(".v-row").filter({ hasText: /Quick Navigation/i });
  }

  get trackNavCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Track Expenses/i });
  }

  get budgetsNavCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Budgets/i }).filter({ hasText: /50\/30\/20/i });
  }

  get recurringNavCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Recurring/i }).filter({ hasText: /Subscriptions/i });
  }

  // Quick Actions
  get quickActionsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Quick Actions/i });
  }

  get addExpenseButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /Add Expense/i });
  }

  get setBudgetButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /Set Budget/i });
  }

  get addRecurringButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /Add Recurring/i });
  }

  get importCSVButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /Import CSV/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async navigateToTrack() {
    await this.trackNavCard.click();
    await this.page.waitForURL(/\/expenses\/track/);
  }

  async navigateToBudgets() {
    await this.budgetsNavCard.click();
    await this.page.waitForURL(/\/expenses\/budgets/);
  }

  async navigateToRecurring() {
    await this.recurringNavCard.click();
    await this.page.waitForURL(/\/expenses\/recurring/);
  }

  // ============================================
  // Quick Action Navigation
  // ============================================

  async clickAddExpense() {
    await this.addExpenseButton.click();
    await this.page.waitForURL(/\/expenses\/track/);
  }

  async clickSetBudget() {
    await this.setBudgetButton.click();
    await this.page.waitForURL(/\/expenses\/budgets/);
  }

  async clickAddRecurring() {
    await this.addRecurringButton.click();
    await this.page.waitForURL(/\/expenses\/recurring/);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalExpenses(): Promise<string> {
    const card = this.totalExpensesCard;
    const value = card.locator(".text-h5, .text-h6").first();
    return await value.textContent() ?? "";
  }

  async getBudgetUsage(): Promise<string> {
    const card = this.budgetUsageCard;
    const value = card.locator(".text-h5").first();
    return await value.textContent() ?? "";
  }

  async getRecurringCount(): Promise<string> {
    const card = this.recurringCard;
    const value = card.locator(".text-h5").first();
    return await value.textContent() ?? "";
  }

  async getAlertCount(): Promise<number> {
    return await this.smartAlerts.count();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    // Check for summary cards (landing page specific)
    await expect(this.totalExpensesCard).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalExpensesCard).toBeVisible();
    await expect(this.budgetUsageCard).toBeVisible();
    await expect(this.recurringCard).toBeVisible();
    await expect(this.topCategoryCard).toBeVisible();
  }

  async expectQuickNavVisible() {
    await expect(this.trackNavCard).toBeVisible();
    await expect(this.budgetsNavCard).toBeVisible();
    await expect(this.recurringNavCard).toBeVisible();
  }

  async expectQuickActionsVisible() {
    await expect(this.quickActionsSection).toBeVisible();
    await expect(this.addExpenseButton).toBeVisible();
    await expect(this.setBudgetButton).toBeVisible();
    await expect(this.addRecurringButton).toBeVisible();
  }

  async expectBudgetAlertVisible() {
    await expect(this.budgetExceededAlert.or(this.noBudgetAlert)).toBeVisible();
  }
}
