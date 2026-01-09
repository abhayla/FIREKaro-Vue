import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Investments Overview Page Object
 * Main overview showing portfolio summary and allocation
 */
export class InvestmentsOverviewPage extends BasePage {
  readonly url = "/dashboard/investments";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get portfolioTab(): Locator {
    return this.page.getByRole("tab", { name: /Portfolio/i });
  }

  get stocksTab(): Locator {
    return this.page.getByRole("tab", { name: /Stocks|Equity/i });
  }

  get mutualFundsTab(): Locator {
    return this.page.getByRole("tab", { name: /Mutual Funds|MF/i });
  }

  get epfPpfTab(): Locator {
    return this.page.getByRole("tab", { name: /EPF.*PPF|Provident/i });
  }

  get npsTab(): Locator {
    return this.page.getByRole("tab", { name: /NPS/i });
  }

  get propertyTab(): Locator {
    return this.page.getByRole("tab", { name: /Property|Real Estate/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Reports/i });
  }

  // Summary cards
  get totalPortfolioValueCard(): Locator {
    return this.getSummaryCardByTitle("Total Portfolio");
  }

  get totalInvestedCard(): Locator {
    return this.getSummaryCardByTitle("Total Invested");
  }

  get totalReturnsCard(): Locator {
    return this.getSummaryCardByTitle("Total Returns");
  }

  get xirrCard(): Locator {
    return this.getSummaryCardByTitle("XIRR");
  }

  // Asset allocation
  get assetAllocationSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Asset Allocation|Allocation/i });
  }

  get allocationChart(): Locator {
    return this.assetAllocationSection.locator("canvas, svg");
  }

  // Asset type cards
  get stocksCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Stocks|Direct Equity/i });
  }

  get mutualFundsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Mutual Funds/i });
  }

  get epfPpfCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /EPF.*PPF|Provident Fund/i });
  }

  get npsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /NPS|National Pension/i });
  }

  get propertyCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Property|Real Estate/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async clickStocksTab() {
    await this.stocksTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickMutualFundsTab() {
    await this.mutualFundsTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickEpfPpfTab() {
    await this.epfPpfTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickNpsTab() {
    await this.npsTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickPropertyTab() {
    await this.propertyTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickReportsTab() {
    await this.reportsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalPortfolioValue(): Promise<string> {
    return await this.getSummaryCardValue("Total Portfolio");
  }

  async getTotalInvested(): Promise<string> {
    return await this.getSummaryCardValue("Total Invested");
  }

  async getTotalReturns(): Promise<string> {
    return await this.getSummaryCardValue("Total Returns");
  }

  async getXIRR(): Promise<string> {
    return await this.getSummaryCardValue("XIRR");
  }

  async getStocksValue(): Promise<string> {
    const valueElement = this.stocksCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getMutualFundsValue(): Promise<string> {
    const valueElement = this.mutualFundsCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getEpfPpfValue(): Promise<string> {
    const valueElement = this.epfPpfCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getNpsValue(): Promise<string> {
    const valueElement = this.npsCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalPortfolioValueCard).toBeVisible();
    await expect(this.totalInvestedCard).toBeVisible();
  }

  async expectAllocationChartVisible() {
    await expect(this.allocationChart).toBeVisible();
  }

  async expectAssetCardsVisible() {
    await expect(this.stocksCard).toBeVisible();
    await expect(this.mutualFundsCard).toBeVisible();
  }

  async expectTotalPortfolioValue(expectedAmount: string) {
    await expect(this.totalPortfolioValueCard.locator(".text-h4, .text-h5, .text-currency")).toContainText(expectedAmount);
  }
}
