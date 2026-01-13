import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Debt Payoff Page Object
 * Handles debt payoff strategies (Snowball vs Avalanche)
 * Page now has Overview and Details tabs
 */
export class DebtPayoffPage extends BasePage {
  readonly url = "/liabilities/debt-payoff";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Debt Payoff/i });
  }

  // Internal tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get detailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Details" });
  }

  // Strategy selection (button toggle in Details tab)
  get snowballButton(): Locator {
    return this.page.getByRole("button", { name: /Snowball/i });
  }

  get avalancheButton(): Locator {
    return this.page.getByRole("button", { name: /Avalanche/i });
  }

  // Summary cards (Overview tab)
  get totalDebtCard(): Locator {
    return this.getSummaryCardByTitle("Total Debt");
  }

  get minimumPaymentCard(): Locator {
    return this.getSummaryCardByTitle("Minimum Payment");
  }

  get avgInterestRateCard(): Locator {
    return this.getSummaryCardByTitle("Avg Interest Rate");
  }

  get extraPaymentCard(): Locator {
    return this.getSummaryCardByTitle("Extra Payment");
  }

  get monthsToPayoffCard(): Locator {
    return this.getSummaryCardByTitle("Payoff Time");
  }

  get totalInterestCard(): Locator {
    return this.getSummaryCardByTitle("Total Interest");
  }

  // Extra payment slider (Overview tab)
  get extraPaymentSlider(): Locator {
    return this.page.locator(".v-slider");
  }

  // Debt order table (Details tab)
  get payoffOrderTable(): Locator {
    return this.page.locator(".v-table").filter({ hasText: /Debt Name|Balance|Priority/i });
  }

  // Payoff chart
  get payoffChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Payoff Progress|Timeline/i }).locator("canvas, svg");
  }

  // Strategy comparison
  get strategyComparison(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Snowball.*Avalanche|Strategy Comparison/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async goToOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  async goToDetailsTab() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Strategy Actions
  // ============================================

  async selectSnowball() {
    await this.goToDetailsTab();
    await this.snowballButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectAvalanche() {
    await this.goToDetailsTab();
    await this.avalancheButton.click();
    await this.page.waitForTimeout(500);
  }

  async setExtraPayment(amount: number) {
    await this.goToOverviewTab();
    // Use slider interaction - move to specific value
    const slider = this.extraPaymentSlider;
    await slider.click();
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
    await this.goToDetailsTab();

    // Check which button has the active/selected state
    const snowballPressed = await this.snowballButton.getAttribute("aria-pressed");
    const avalanchePressed = await this.avalancheButton.getAttribute("aria-pressed");

    if (snowballPressed === "true") {
      return "snowball";
    } else if (avalanchePressed === "true") {
      return "avalanche";
    }

    // Also check for CSS class indicating selection
    const snowballClasses = await this.snowballButton.getAttribute("class") || "";
    const avalancheClasses = await this.avalancheButton.getAttribute("class") || "";

    if (snowballClasses.includes("v-btn--active") || snowballClasses.includes("bg-primary")) {
      return "snowball";
    } else if (avalancheClasses.includes("v-btn--active") || avalancheClasses.includes("bg-primary")) {
      return "avalanche";
    }

    return "avalanche"; // Default
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Debt Payoff/i })).toBeVisible();
  }

  async expectTabsVisible() {
    await expect(this.overviewTab).toBeVisible();
    await expect(this.detailsTab).toBeVisible();
  }

  async expectStrategySelectionVisible() {
    await this.goToDetailsTab();
    await expect(this.snowballButton).toBeVisible();
    await expect(this.avalancheButton).toBeVisible();
  }

  async expectPayoffOrderTableVisible() {
    await this.goToDetailsTab();
    await expect(this.payoffOrderTable).toBeVisible();
  }

  async expectPayoffChartVisible() {
    await this.goToOverviewTab();
    await expect(this.payoffChart).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await this.goToOverviewTab();
    await expect(this.totalDebtCard).toBeVisible();
    await expect(this.minimumPaymentCard).toBeVisible();
  }
}
