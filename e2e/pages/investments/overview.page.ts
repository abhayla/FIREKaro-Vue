import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Investments Overview Page Object
 * Main overview showing portfolio summary and allocation
 */
export class InvestmentsOverviewPage extends BasePage {
  readonly url = "/investments";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  // Sidebar navigation - first-level navigation is now in sidebar
  get sidebar(): Locator {
    return this.page.locator(".v-navigation-drawer");
  }

  getSidebarLink(name: string): Locator {
    return this.sidebar.getByRole("link", { name });
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

  // Navigation via sidebar links
  async navigateToStocks() {
    await this.goto("/investments/stocks");
    await this.waitForPageLoad();
  }

  async navigateToMutualFunds() {
    await this.goto("/investments/mutual-funds");
    await this.waitForPageLoad();
  }

  async navigateToEpf() {
    await this.goto("/investments/epf");
    await this.waitForPageLoad();
  }

  async navigateToPpf() {
    await this.goto("/investments/ppf");
    await this.waitForPageLoad();
  }

  async navigateToNps() {
    await this.goto("/investments/nps");
    await this.waitForPageLoad();
  }

  async navigateToProperty() {
    await this.goto("/investments/property");
    await this.waitForPageLoad();
  }

  async navigateToReports() {
    await this.goto("/investments/reports");
    await this.waitForPageLoad();
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
    // Verify we're on the Portfolio page via URL
    await expect(this.page).toHaveURL(/\/investments$/);
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
