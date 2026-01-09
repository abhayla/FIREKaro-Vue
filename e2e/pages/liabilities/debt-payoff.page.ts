import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Debt Payoff Page Object
 * Handles debt payoff strategies (Snowball vs Avalanche)
 */
export class DebtPayoffPage extends BasePage {
  readonly url = "/dashboard/liabilities/debt-payoff";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Liabilities|Debt Payoff/i });
  }

  // Strategy selection
  get snowballOption(): Locator {
    return this.page.getByRole("radio", { name: /Snowball/i });
  }

  get avalancheOption(): Locator {
    return this.page.getByRole("radio", { name: /Avalanche/i });
  }

  get strategyCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Strategy|Payoff Method/i });
  }

  // Summary cards
  get totalDebtCard(): Locator {
    return this.getSummaryCardByTitle("Total Debt");
  }

  get monthsToPayoffCard(): Locator {
    return this.getSummaryCardByTitle("Payoff Time");
  }

  get totalInterestCard(): Locator {
    return this.getSummaryCardByTitle("Total Interest");
  }

  get savingsCard(): Locator {
    return this.getSummaryCardByTitle("Interest Savings");
  }

  // Extra payment input
  get extraPaymentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Extra Payment|Additional/i });
  }

  get applyExtraPaymentButton(): Locator {
    return this.page.getByRole("button", { name: /Apply|Calculate/i });
  }

  // Debt order table
  get payoffOrderTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Order|Priority/i });
  }

  // Payoff chart
  get payoffChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Chart|Timeline/i }).locator("canvas, svg");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Strategy Actions
  // ============================================

  async selectSnowball() {
    await this.snowballOption.click();
    await this.page.waitForTimeout(500);
  }

  async selectAvalanche() {
    await this.avalancheOption.click();
    await this.page.waitForTimeout(500);
  }

  async setExtraPayment(amount: number) {
    await this.extraPaymentField.clear();
    await this.extraPaymentField.fill(amount.toString());
    await this.applyExtraPaymentButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalDebt(): Promise<string> {
    return await this.getSummaryCardValue("Total Debt");
  }

  async getPayoffTime(): Promise<string> {
    return await this.getSummaryCardValue("Payoff Time");
  }

  async getTotalInterest(): Promise<string> {
    return await this.getSummaryCardValue("Total Interest");
  }

  async getSelectedStrategy(): Promise<string> {
    if (await this.snowballOption.isChecked()) {
      return "snowball";
    } else if (await this.avalancheOption.isChecked()) {
      return "avalanche";
    }
    return "none";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Liabilities|Debt Payoff/i })).toBeVisible();
  }

  async expectStrategySelectionVisible() {
    await expect(this.snowballOption).toBeVisible();
    await expect(this.avalancheOption).toBeVisible();
  }

  async expectPayoffOrderTableVisible() {
    await expect(this.payoffOrderTable).toBeVisible();
  }

  async expectPayoffChartVisible() {
    await expect(this.payoffChart).toBeVisible();
  }
}
