import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Liabilities Overview Page Object
 * Main overview showing debt summary and breakdown
 */
export class LiabilitiesOverviewPage extends BasePage {
  readonly url = "/dashboard/liabilities";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Liabilities/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get loansTab(): Locator {
    return this.page.getByRole("tab", { name: /Loans/i });
  }

  get creditCardsTab(): Locator {
    return this.page.getByRole("tab", { name: /Credit Cards|Cards/i });
  }

  get debtPayoffTab(): Locator {
    return this.page.getByRole("tab", { name: /Debt Payoff|Payoff/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Reports/i });
  }

  // Summary cards
  get totalDebtCard(): Locator {
    return this.getSummaryCardByTitle("Total Debt");
  }

  get monthlyEMICard(): Locator {
    return this.getSummaryCardByTitle("Monthly EMI");
  }

  get dtiRatioCard(): Locator {
    return this.getSummaryCardByTitle("DTI Ratio");
  }

  get upcomingPaymentsCard(): Locator {
    return this.getSummaryCardByTitle("Upcoming Payments");
  }

  // Debt breakdown
  get loansBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Loans|Home Loan|Car Loan/i });
  }

  get creditCardsBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Credit Cards/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async clickLoansTab() {
    await this.loansTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickCreditCardsTab() {
    await this.creditCardsTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickDebtPayoffTab() {
    await this.debtPayoffTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickReportsTab() {
    await this.reportsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalDebt(): Promise<string> {
    return await this.getSummaryCardValue("Total Debt");
  }

  async getMonthlyEMI(): Promise<string> {
    return await this.getSummaryCardValue("Monthly EMI");
  }

  async getDTIRatio(): Promise<string> {
    return await this.getSummaryCardValue("DTI Ratio");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalDebtCard).toBeVisible();
    await expect(this.monthlyEMICard).toBeVisible();
  }
}
