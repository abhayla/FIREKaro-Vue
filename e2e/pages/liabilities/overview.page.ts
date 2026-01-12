import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Liabilities Overview Page Object
 * Main dashboard showing debt summary and breakdown
 * Note: This is the index page (/liabilities) - no section-level tabs
 * Navigation between pages happens via sidebar, not tabs
 */
export class LiabilitiesOverviewPage extends BasePage {
  readonly url = "/liabilities";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Liabilities/i });
  }

  // Summary cards
  get totalDebtCard(): Locator {
    return this.getSummaryCardByTitle("Total Debt");
  }

  get monthlyPaymentCard(): Locator {
    return this.getSummaryCardByTitle("Monthly Payment");
  }

  get loanOutstandingCard(): Locator {
    return this.getSummaryCardByTitle("Loan Outstanding");
  }

  get creditCardDebtCard(): Locator {
    return this.getSummaryCardByTitle("Credit Card Debt");
  }

  // DTI Gauge
  get dtiGauge(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /DTI|Debt.to.Income/i });
  }

  // Upcoming payments section
  get upcomingPaymentsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Upcoming|Due|Payment/i });
  }

  // Debt breakdown sections
  get loansBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Loans|Home Loan|Car Loan/i });
  }

  get creditCardsBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Credit Cards/i });
  }

  // Quick action buttons
  get addLoanButton(): Locator {
    return this.page.getByRole("button", { name: /Add Loan/i });
  }

  get addCreditCardButton(): Locator {
    return this.page.getByRole("button", { name: /Add Credit Card|Add Card/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalDebt(): Promise<string> {
    return await this.getSummaryCardValue("Total Debt");
  }

  async getMonthlyPayment(): Promise<string> {
    return await this.getSummaryCardValue("Monthly Payment");
  }

  async getLoanOutstanding(): Promise<string> {
    return await this.getSummaryCardValue("Loan Outstanding");
  }

  async getCreditCardDebt(): Promise<string> {
    return await this.getSummaryCardValue("Credit Card Debt");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalDebtCard).toBeVisible();
    await expect(this.monthlyPaymentCard).toBeVisible();
  }

  async expectDTIGaugeVisible() {
    await expect(this.dtiGauge).toBeVisible();
  }
}
