import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Non-Salary Income Reports Page Object
 * Handles summary reports, charts, and export functionality
 */
export class NonSalaryReportsPage extends BasePage {
  readonly url = "/dashboard/non-salary-income/reports";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Non-Salary Income/i });
  }

  // Summary section
  get incomeSummarySection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Income Summary|Total Summary/i });
  }

  get totalNonSalaryIncomeDisplay(): Locator {
    return this.getSummaryCardByTitle("Total Non-Salary Income").locator(".text-h4, .text-h5, .text-currency").first();
  }

  get businessIncomeDisplay(): Locator {
    return this.page.locator("text=/Business.*Profession/i").locator("~ .text-currency, + .text-currency");
  }

  get rentalIncomeDisplay(): Locator {
    return this.page.locator("text=/Rental Income|House Property/i").locator("~ .text-currency, + .text-currency");
  }

  get capitalGainsDisplay(): Locator {
    return this.page.locator("text=/Capital Gains/i").locator("~ .text-currency, + .text-currency");
  }

  get otherIncomeDisplay(): Locator {
    return this.page.locator("text=/Other Income/i").locator("~ .text-currency, + .text-currency");
  }

  // TDS summary
  get tdsSummarySection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /TDS Summary|Tax Deducted/i });
  }

  get totalTDSDisplay(): Locator {
    return this.getSummaryCardByTitle("Total TDS").locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Charts
  get incomeBreakdownChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Income Breakdown|Distribution/i }).locator("canvas, svg");
  }

  get monthlyTrendChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly Trend|Trend/i }).locator("canvas, svg");
  }

  get sourceWiseChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Source.*Wise|By Source/i }).locator("canvas, svg");
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

  get exportCSVOption(): Locator {
    return this.page.getByRole("menuitem", { name: /CSV/i });
  }

  // Print button
  get printButton(): Locator {
    return this.page.getByRole("button", { name: /Print/i });
  }

  // Financial year filter
  get fyFilterSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Financial Year|FY/i });
  }

  // Period filter
  get periodFilterSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Period|Duration/i });
  }

  // Detailed breakdown table
  get breakdownTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Income Type|Source/i });
  }

  // Tax implications section
  get taxImplicationsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Implication|Tax Summary/i });
  }

  get taxableIncomeDisplay(): Locator {
    return this.page.locator("text=/Taxable.*Income/i").locator("~ .text-currency, + .text-currency");
  }

  get exemptIncomeDisplay(): Locator {
    return this.page.locator("text=/Exempt.*Income/i").locator("~ .text-currency, + .text-currency");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Filter Actions
  // ============================================

  async selectFinancialYear(fy: string) {
    await this.fyFilterSelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: fy }).click();
    await this.page.waitForTimeout(500); // Wait for data reload
  }

  async selectPeriod(period: "Monthly" | "Quarterly" | "Annual") {
    await this.periodFilterSelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: period }).click();
    await this.page.waitForTimeout(300);
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

  async exportToCSV() {
    await this.exportButton.click();
    await this.page.waitForTimeout(200);
    await this.exportCSVOption.click();
    await this.page.waitForTimeout(500);
  }

  async printReport() {
    await this.printButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalNonSalaryIncome(): Promise<string> {
    return (await this.totalNonSalaryIncomeDisplay.textContent()) || "₹0";
  }

  async getBusinessIncome(): Promise<string> {
    return (await this.businessIncomeDisplay.textContent()) || "₹0";
  }

  async getRentalIncome(): Promise<string> {
    return (await this.rentalIncomeDisplay.textContent()) || "₹0";
  }

  async getCapitalGains(): Promise<string> {
    return (await this.capitalGainsDisplay.textContent()) || "₹0";
  }

  async getOtherIncome(): Promise<string> {
    return (await this.otherIncomeDisplay.textContent()) || "₹0";
  }

  async getTotalTDS(): Promise<string> {
    return (await this.totalTDSDisplay.textContent()) || "₹0";
  }

  async getTaxableIncome(): Promise<string> {
    return (await this.taxableIncomeDisplay.textContent()) || "₹0";
  }

  async getExemptIncome(): Promise<string> {
    return (await this.exemptIncomeDisplay.textContent()) || "₹0";
  }

  // ============================================
  // Chart Interactions
  // ============================================

  async isIncomeBreakdownChartVisible(): Promise<boolean> {
    return await this.incomeBreakdownChart.isVisible();
  }

  async isMonthlyTrendChartVisible(): Promise<boolean> {
    return await this.monthlyTrendChart.isVisible();
  }

  async isSourceWiseChartVisible(): Promise<boolean> {
    return await this.sourceWiseChart.isVisible();
  }

  // ============================================
  // Breakdown Table
  // ============================================

  async getBreakdownRowCount(): Promise<number> {
    return await this.breakdownTable.locator("tbody tr").count();
  }

  async getBreakdownRowByType(incomeType: string): Promise<Locator> {
    return this.breakdownTable.locator(`tbody tr:has-text("${incomeType}")`);
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "Reports" })).toHaveAttribute("aria-selected", "true");
  }

  async expectSummaryVisible() {
    await expect(this.incomeSummarySection).toBeVisible();
  }

  async expectChartsVisible() {
    await expect(this.incomeBreakdownChart).toBeVisible();
  }

  async expectTDSSummaryVisible() {
    await expect(this.tdsSummarySection).toBeVisible();
  }

  async expectExportButtonVisible() {
    await expect(this.exportButton).toBeVisible();
  }

  async expectTotalNonSalaryIncome(expectedAmount: string) {
    await expect(this.totalNonSalaryIncomeDisplay).toContainText(expectedAmount);
  }

  async expectTotalTDS(expectedAmount: string) {
    await expect(this.totalTDSDisplay).toContainText(expectedAmount);
  }

  async expectBreakdownTableVisible() {
    await expect(this.breakdownTable).toBeVisible();
  }

  async expectTaxImplicationsVisible() {
    await expect(this.taxImplicationsSection).toBeVisible();
  }
}
