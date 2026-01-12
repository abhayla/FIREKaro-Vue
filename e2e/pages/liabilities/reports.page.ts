import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Liabilities Reports Page Object
 * Handles debt reports with 4 report type tabs:
 * - Debt Summary
 * - Payment History
 * - Interest Analysis
 * - Tax Benefits
 */
export class LiabilitiesReportsPage extends BasePage {
  readonly url = "/liabilities/reports";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Reports/i });
  }

  // Report type tabs
  get debtSummaryTab(): Locator {
    return this.page.getByRole("tab", { name: "Debt Summary" });
  }

  get paymentHistoryTab(): Locator {
    return this.page.getByRole("tab", { name: "Payment History" });
  }

  get interestAnalysisTab(): Locator {
    return this.page.getByRole("tab", { name: "Interest Analysis" });
  }

  get taxBenefitsTab(): Locator {
    return this.page.getByRole("tab", { name: "Tax Benefits" });
  }

  // Legacy aliases for backward compatibility
  get amortizationReportOption(): Locator {
    return this.interestAnalysisTab;
  }

  get debtSummaryReportOption(): Locator {
    return this.debtSummaryTab;
  }

  get paymentHistoryOption(): Locator {
    return this.paymentHistoryTab;
  }

  // Loan selector for amortization
  get loanSelector(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Select Loan/i });
  }

  // Amortization schedule table
  get amortizationTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Month|EMI|Principal|Interest/i });
  }

  // Summary charts
  get debtBreakdownChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Breakdown/i }).locator("canvas, svg");
  }

  get paymentHistoryChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /History/i }).locator("canvas, svg");
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

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Report Actions
  // ============================================

  async selectAmortizationReport() {
    await this.amortizationReportOption.click();
    await this.page.waitForTimeout(300);
  }

  async selectDebtSummaryReport() {
    await this.debtSummaryReportOption.click();
    await this.page.waitForTimeout(300);
  }

  async selectPaymentHistoryReport() {
    await this.paymentHistoryOption.click();
    await this.page.waitForTimeout(300);
  }

  async selectLoanForAmortization(loanName: string) {
    await this.loanSelector.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: loanName }).click();
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
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    // Verify at least one of the report tabs is visible
    await expect(this.debtSummaryTab).toBeVisible();
  }

  async expectTabsVisible() {
    await expect(this.debtSummaryTab).toBeVisible();
    await expect(this.paymentHistoryTab).toBeVisible();
    await expect(this.interestAnalysisTab).toBeVisible();
    await expect(this.taxBenefitsTab).toBeVisible();
  }

  async goToDebtSummary() {
    await this.debtSummaryTab.click();
    await this.page.waitForTimeout(300);
  }

  async goToPaymentHistory() {
    await this.paymentHistoryTab.click();
    await this.page.waitForTimeout(300);
  }

  async goToInterestAnalysis() {
    await this.interestAnalysisTab.click();
    await this.page.waitForTimeout(300);
  }

  async goToTaxBenefits() {
    await this.taxBenefitsTab.click();
    await this.page.waitForTimeout(300);
  }

  async expectAmortizationTableVisible() {
    await expect(this.amortizationTable).toBeVisible();
  }

  async expectDebtBreakdownChartVisible() {
    await expect(this.debtBreakdownChart).toBeVisible();
  }

  async expectExportButtonVisible() {
    await expect(this.exportButton).toBeVisible();
  }
}
