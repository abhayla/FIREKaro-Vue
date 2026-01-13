import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expense Reports Page Object
 * Standalone page at /expenses/reports with period selectors, charts, and exports
 */
export class ExpenseReportsPage extends BasePage {
  readonly url = "/expenses/reports";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expense Reports|Reports/i });
  }

  // Period Selectors
  get monthlyButton(): Locator {
    return this.page.getByRole("button", { name: /Monthly/i });
  }

  get quarterlyButton(): Locator {
    return this.page.getByRole("button", { name: /Quarterly/i });
  }

  get yearlyButton(): Locator {
    return this.page.getByRole("button", { name: /Yearly/i });
  }

  get customButton(): Locator {
    return this.page.getByRole("button", { name: /Custom/i });
  }

  // Month Navigation
  get previousMonthButton(): Locator {
    return this.page.getByRole("button", { name: /Previous/i });
  }

  get nextMonthButton(): Locator {
    return this.page.getByRole("button", { name: /Next/i });
  }

  get monthDisplay(): Locator {
    return this.page.locator("[class*='month'], .text-h6").filter({ hasText: /January|February|March|April|May|June|July|August|September|October|November|December/i });
  }

  // Export
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export/i });
  }

  get exportPDFOption(): Locator {
    return this.page.getByRole("menuitem", { name: /PDF/i });
  }

  get exportExcelOption(): Locator {
    return this.page.getByRole("menuitem", { name: /Excel/i });
  }

  get exportCSVOption(): Locator {
    return this.page.getByRole("menuitem", { name: /CSV/i });
  }

  get exportJSONOption(): Locator {
    return this.page.getByRole("menuitem", { name: /JSON/i });
  }

  // Summary Cards
  get totalExpensesCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Expenses/i });
  }

  get transactionsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Transactions/i });
  }

  get avgTransactionCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Avg.*Transaction/i });
  }

  get budgetUsageCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Budget Usage/i });
  }

  // Charts
  get categoryPieChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Spending by Category/i });
  }

  get trendChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Trend|Monthly/i });
  }

  // Lists
  get topExpensesList(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Top Expenses/i });
  }

  get paymentMethodsList(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Payment Methods/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async selectPeriod(period: "monthly" | "quarterly" | "yearly" | "custom") {
    const buttonMap = {
      monthly: this.monthlyButton,
      quarterly: this.quarterlyButton,
      yearly: this.yearlyButton,
      custom: this.customButton,
    };
    await buttonMap[period].click();
    await this.page.waitForTimeout(300);
  }

  async goToPreviousMonth() {
    await this.previousMonthButton.click();
    await this.page.waitForTimeout(300);
  }

  async goToNextMonth() {
    await this.nextMonthButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Export Actions
  // ============================================

  async openExportMenu() {
    await this.exportButton.click();
    await this.page.waitForTimeout(200);
  }

  async exportToPDF() {
    await this.openExportMenu();
    await this.exportPDFOption.click();
    await this.page.waitForTimeout(500);
  }

  async exportToExcel() {
    await this.openExportMenu();
    await this.exportExcelOption.click();
    await this.page.waitForTimeout(500);
  }

  async exportToCSV() {
    await this.openExportMenu();
    await this.exportCSVOption.click();
    await this.page.waitForTimeout(500);
  }

  async exportToJSON() {
    await this.openExportMenu();
    await this.exportJSONOption.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalExpensesCard).toBeVisible();
    await expect(this.transactionsCard).toBeVisible();
  }

  async expectChartsVisible() {
    await expect(this.categoryPieChart).toBeVisible();
    await expect(this.trendChart).toBeVisible();
  }

  async expectExportButtonVisible() {
    await expect(this.exportButton).toBeVisible();
  }

  async expectPeriodSelectorsVisible() {
    await expect(this.monthlyButton).toBeVisible();
    await expect(this.quarterlyButton).toBeVisible();
    await expect(this.yearlyButton).toBeVisible();
    await expect(this.customButton).toBeVisible();
  }
}
