import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Planning Overview Page Object
 * Overview tab showing summary cards, recommendations, regime comparison, and charts
 */
export class TaxPlanningOverviewPage extends BasePage {
  readonly url = "/tax-planning";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Tab Locators (2-tab structure)
  // ============================================

  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get taxDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Tax Details/i });
  }

  // ============================================
  // Page Header Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Financial Year Navigation
  get fySelector(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /FY|Financial Year|20\d{2}/i });
  }

  get fyPrevButton(): Locator {
    return this.page.locator("button[title*='Previous']").or(
      this.page.getByRole("button", { name: /chevron-left/i })
    );
  }

  get fyNextButton(): Locator {
    return this.page.locator("button[title*='Next']").or(
      this.page.getByRole("button", { name: /chevron-right/i })
    );
  }

  // ============================================
  // Summary Cards Locators
  // ============================================

  get summaryCardsSection(): Locator {
    return this.page.locator(".summary-metric-cards, .tax-summary-cards").first();
  }

  get grossIncomeCard(): Locator {
    return this.getSummaryCardByTitle("Gross Total Income");
  }

  get taxPayableCard(): Locator {
    return this.getSummaryCardByTitle("Tax Payable");
  }

  get tdsCard(): Locator {
    return this.getSummaryCardByTitle("TDS Deducted");
  }

  get netDueRefundCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Due|Refund Expected/i });
  }

  // ============================================
  // Data Completion Tracker Locators
  // ============================================

  get dataCompletionCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Data Completion/i });
  }

  get completionProgressBar(): Locator {
    return this.dataCompletionCard.locator(".v-progress-linear");
  }

  get completionItems(): Locator {
    return this.dataCompletionCard.locator(".completion-item");
  }

  // ============================================
  // Recommendations Locators
  // ============================================

  get recommendationsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /TOP RECOMMENDATIONS/i });
  }

  get recommendationItems(): Locator {
    return this.recommendationsCard.locator(".recommendation-item");
  }

  get viewAllRecommendationsButton(): Locator {
    return this.recommendationsCard.getByRole("button", { name: /View All/i });
  }

  // ============================================
  // Regime Comparison Locators
  // ============================================

  get regimeComparisonCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /REGIME COMPARISON/i });
  }

  get oldRegimeBox(): Locator {
    return this.regimeComparisonCard.locator(".regime-box").filter({ hasText: /Old Regime/i });
  }

  get newRegimeBox(): Locator {
    return this.regimeComparisonCard.locator(".regime-box").filter({ hasText: /New Regime/i });
  }

  get betterRegimeAlert(): Locator {
    return this.regimeComparisonCard.locator(".v-alert");
  }

  get viewDetailedBreakdownButton(): Locator {
    return this.regimeComparisonCard.getByRole("button", { name: /View Detailed Breakdown/i });
  }

  // ============================================
  // Income Chart Locators
  // ============================================

  get incomeBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Income Breakdown|Income by Source/i });
  }

  get incomeChart(): Locator {
    return this.incomeBreakdownCard.locator("canvas");
  }

  // ============================================
  // ITR & Advance Tax Locators
  // ============================================

  get itrFormCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Recommended ITR Form/i });
  }

  get advanceTaxAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /Advance Tax Due/i });
  }

  get noAdvanceTaxAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /No Advance Tax Due/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async clickOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickTaxDetailsTab() {
    await this.taxDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  async selectPreviousFY() {
    await this.fyPrevButton.click();
    await this.page.waitForTimeout(500);
  }

  async selectNextFY() {
    await this.fyNextButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getGrossIncome(): Promise<string> {
    return await this.getSummaryCardValue("Gross Total Income");
  }

  async getTaxPayable(): Promise<string> {
    return await this.getSummaryCardValue("Tax Payable");
  }

  async getTDS(): Promise<string> {
    return await this.getSummaryCardValue("TDS Deducted");
  }

  async getCompletionPercentage(): Promise<number> {
    const chipText = await this.dataCompletionCard.locator(".v-chip").textContent();
    const match = chipText?.match(/(\d+)\/(\d+)/);
    if (match) {
      return Math.round((parseInt(match[1]) / parseInt(match[2])) * 100);
    }
    return 0;
  }

  async getRecommendationCount(): Promise<number> {
    return await this.recommendationItems.count();
  }

  async getBetterRegime(): Promise<string> {
    const alertText = await this.betterRegimeAlert.textContent();
    if (alertText?.includes("New Regime")) return "NEW";
    if (alertText?.includes("Old Regime")) return "OLD";
    return "";
  }

  async getITRForm(): Promise<string> {
    const formText = await this.itrFormCard.locator(".text-h6").textContent();
    return formText?.trim() || "";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectTwoTabsVisible() {
    await expect(this.overviewTab).toBeVisible();
    await expect(this.taxDetailsTab).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    // At least some summary cards should be visible
    const cards = this.page.locator(".summary-metric-cards .v-card, .metric-card");
    await expect(cards.first()).toBeVisible();
  }

  async expectDataCompletionVisible() {
    await expect(this.dataCompletionCard).toBeVisible();
    await expect(this.completionProgressBar).toBeVisible();
  }

  async expectRecommendationsVisible() {
    await expect(this.recommendationsCard).toBeVisible();
  }

  async expectRegimeComparisonVisible() {
    await expect(this.regimeComparisonCard).toBeVisible();
  }

  async expectIncomeChartVisible() {
    await expect(this.incomeBreakdownCard).toBeVisible();
  }

  async expectITRFormVisible() {
    await expect(this.itrFormCard).toBeVisible();
  }

  async expectFYNavigationVisible() {
    await expect(this.fySelector).toBeVisible();
  }
}
