import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Investment Reports Page Object
 * Handles investment reports, charts, and export
 */
export class InvestmentReportsPage extends BasePage {
  readonly url = "/investments/reports";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  // Summary section
  get portfolioSummarySection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Portfolio Summary/i });
  }

  get totalPortfolioDisplay(): Locator {
    return this.portfolioSummarySection.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Charts
  get assetAllocationChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Asset Allocation/i }).locator("canvas, svg");
  }

  get performanceChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Performance|Growth/i }).locator("canvas, svg");
  }

  get monthlyInvestmentChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly.*Investment/i }).locator("canvas, svg");
  }

  // Performance metrics
  get xirrDisplay(): Locator {
    return this.page.locator("text=/XIRR/i").locator("~ .text-h5, + .text-h5");
  }

  get cagrDisplay(): Locator {
    return this.page.locator("text=/CAGR/i").locator("~ .text-h5, + .text-h5");
  }

  get absoluteReturnsDisplay(): Locator {
    return this.page.locator("text=/Absolute Return/i").locator("~ .text-h5, + .text-h5");
  }

  // Asset breakdown table
  get assetBreakdownTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Asset Type|Category/i });
  }

  // Top holdings table
  get topHoldingsTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Top Holdings/i });
  }

  // Export controls
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export|Download/i });
  }

  get exportPDFOption(): Locator {
    return this.page.getByRole("menuitem", { name: /PDF/i });
  }

  get exportExcelOption(): Locator {
    return this.page.getByRole("menuitem", { name: /Excel|XLSX/i });
  }

  // Period filter
  get periodSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Period|Duration/i });
  }

  // ============================================
  // Report Type Tabs (New Feature)
  // ============================================

  get reportTypeTabs(): Locator {
    return this.page.locator(".v-btn-toggle, .v-tabs").filter({ hasText: /Portfolio|Performance|SIP|Compounding|Journey/i });
  }

  get portfolioReportTab(): Locator {
    return this.page.getByRole("button", { name: /Portfolio/i });
  }

  get performanceReportTab(): Locator {
    return this.page.getByRole("button", { name: /Performance/i });
  }

  get sipReportTab(): Locator {
    return this.page.getByRole("button", { name: /SIP/i });
  }

  get compoundingReportTab(): Locator {
    return this.page.getByRole("button", { name: /Compounding/i });
  }

  get journeyReportTab(): Locator {
    return this.page.getByRole("button", { name: /Journey/i });
  }

  // ============================================
  // SIP Progression Section (New Feature)
  // ============================================

  get sipProgressionSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /SIP Progression|SIP History|Monthly SIP/i });
  }

  get sipProgressionChart(): Locator {
    return this.sipProgressionSection.locator("canvas");
  }

  get currentSIPDisplay(): Locator {
    return this.sipProgressionSection.locator(".text-h4, .text-h5").filter({ hasText: /₹|Current/i });
  }

  get sipGrowthPercentage(): Locator {
    return this.sipProgressionSection.locator(".text-success, .text-error, .v-chip").filter({ hasText: /%/i });
  }

  get sipYearlyBreakdown(): Locator {
    return this.sipProgressionSection.locator(".v-list, .v-table");
  }

  // ============================================
  // Compounding Visualization Section (New Feature)
  // ============================================

  get compoundingSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Compounding|Contributions.*Returns|Returns.*Contributions/i });
  }

  get compoundingChart(): Locator {
    return this.compoundingSection.locator("canvas");
  }

  get totalContributionsDisplay(): Locator {
    return this.compoundingSection.locator(".v-card, .text-h5, .text-h6").filter({ hasText: /Contributions|Invested/i });
  }

  get totalReturnsDisplay(): Locator {
    return this.compoundingSection.locator(".v-card, .text-h5, .text-h6").filter({ hasText: /Returns/i });
  }

  get crossoverYearDisplay(): Locator {
    return this.compoundingSection.locator(".v-chip, .v-alert, .text-body").filter({ hasText: /Crossover|crossover/i });
  }

  get returnsMultiplierDisplay(): Locator {
    return this.compoundingSection.locator(".text-h4, .text-h5").filter({ hasText: /%/i });
  }

  get compoundingStatusAlert(): Locator {
    return this.compoundingSection.locator(".v-alert");
  }

  // ============================================
  // Portfolio Journey Section (New Feature)
  // ============================================

  get journeySection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Portfolio Journey|Journey|Historical/i });
  }

  get journeyChart(): Locator {
    return this.journeySection.locator("canvas");
  }

  get startValueDisplay(): Locator {
    return this.journeySection.locator(".text-h6, .text-body").filter({ hasText: /Started|Start/i });
  }

  get currentValueDisplay(): Locator {
    return this.journeySection.locator(".text-h6, .text-body").filter({ hasText: /Current/i });
  }

  get totalGrowthDisplay(): Locator {
    return this.journeySection.locator(".text-h6, .text-body").filter({ hasText: /Growth/i });
  }

  get cagrJourneyDisplay(): Locator {
    return this.journeySection.locator(".text-h6, .text-body").filter({ hasText: /CAGR/i });
  }

  get addSnapshotButton(): Locator {
    return this.journeySection.getByRole("button", { name: /Add Snapshot|Add/i });
  }

  get snapshotDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Snapshot|Add.*Snapshot/i });
  }

  get snapshotDateInput(): Locator {
    return this.snapshotDialog.locator('input[type="date"]');
  }

  get snapshotValueInput(): Locator {
    return this.snapshotDialog.getByLabel(/Value|Portfolio Value/i);
  }

  get snapshotNotesInput(): Locator {
    return this.snapshotDialog.getByLabel(/Notes/i);
  }

  get snapshotSaveButton(): Locator {
    return this.snapshotDialog.getByRole("button", { name: /Save|Add/i });
  }

  get snapshotsList(): Locator {
    return this.journeySection.locator(".v-list, .v-expansion-panel");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Report Tab Navigation
  // ============================================

  async selectReportType(type: "portfolio" | "performance" | "sip" | "compounding" | "journey") {
    const tabMap = {
      portfolio: this.portfolioReportTab,
      performance: this.performanceReportTab,
      sip: this.sipReportTab,
      compounding: this.compoundingReportTab,
      journey: this.journeyReportTab
    };
    await tabMap[type].click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Filter Actions
  // ============================================

  async selectPeriod(period: "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "All") {
    await this.periodSelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: period }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Export Actions
  // ============================================

  async exportToPDF() {
    await this.exportButton.click();
    await this.page.waitForTimeout(200);
    await this.exportPDFOption.click();
    await this.page.waitForTimeout(500);
  }

  async exportToExcel() {
    await this.exportButton.click();
    await this.page.waitForTimeout(200);
    await this.exportExcelOption.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Portfolio Journey Actions
  // ============================================

  async openAddSnapshotDialog(): Promise<void> {
    await this.addSnapshotButton.click();
    await expect(this.snapshotDialog).toBeVisible();
  }

  async addSnapshot(date: string, value: number, notes?: string): Promise<void> {
    await this.openAddSnapshotDialog();
    await this.snapshotDateInput.fill(date);
    await this.snapshotValueInput.fill(value.toString());
    if (notes) {
      await this.snapshotNotesInput.fill(notes);
    }
    await this.snapshotSaveButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalPortfolio(): Promise<string> {
    return (await this.totalPortfolioDisplay.textContent()) || "₹0";
  }

  async getXIRR(): Promise<string> {
    return (await this.xirrDisplay.textContent()) || "0%";
  }

  async getCAGR(): Promise<string> {
    return (await this.cagrDisplay.textContent()) || "0%";
  }

  async getAbsoluteReturns(): Promise<string> {
    return (await this.absoluteReturnsDisplay.textContent()) || "₹0";
  }

  async getCurrentSIP(): Promise<string> {
    return (await this.currentSIPDisplay.textContent()) || "₹0";
  }

  async getSIPGrowth(): Promise<string> {
    return (await this.sipGrowthPercentage.textContent()) || "0%";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Reports/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectSummaryVisible() {
    await expect(this.portfolioSummarySection).toBeVisible();
  }

  async expectAllocationChartVisible() {
    await expect(this.assetAllocationChart).toBeVisible();
  }

  async expectPerformanceChartVisible() {
    await expect(this.performanceChart).toBeVisible();
  }

  async expectExportButtonVisible() {
    await expect(this.exportButton).toBeVisible();
  }

  async expectAssetBreakdownVisible() {
    await expect(this.assetBreakdownTable).toBeVisible();
  }

  // New feature assertions

  async expectSIPProgressionSectionVisible(): Promise<void> {
    await expect(this.sipProgressionSection).toBeVisible();
  }

  async expectSIPChartVisible(): Promise<void> {
    await expect(this.sipProgressionChart).toBeVisible();
  }

  async expectCompoundingSectionVisible(): Promise<void> {
    await expect(this.compoundingSection).toBeVisible();
  }

  async expectCompoundingChartVisible(): Promise<void> {
    await expect(this.compoundingChart).toBeVisible();
  }

  async expectJourneySectionVisible(): Promise<void> {
    await expect(this.journeySection).toBeVisible();
  }

  async expectJourneyChartVisible(): Promise<void> {
    await expect(this.journeyChart).toBeVisible();
  }

  async expectCrossoverYearVisible(): Promise<void> {
    await expect(this.crossoverYearDisplay).toBeVisible();
  }
}
