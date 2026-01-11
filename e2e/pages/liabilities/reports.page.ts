import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Liabilities Reports Page Object
 * Handles debt reports, amortization schedules, and exports
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
    return this.page.getByRole("heading", { name: /Liabilities/i });
  }

  // Report type selection
  get amortizationReportOption(): Locator {
    return this.page.getByRole("tab", { name: /Amortization/i });
  }

  get debtSummaryReportOption(): Locator {
    return this.page.getByRole("tab", { name: /Summary|Overview/i });
  }

  get paymentHistoryOption(): Locator {
    return this.page.getByRole("tab", { name: /Payment History/i });
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
    await expect(this.page.getByRole("heading", { name: /Liabilities/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Reports/i })).toHaveAttribute("aria-selected", "true");
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
