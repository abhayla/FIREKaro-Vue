import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Reports Page Object
 * Now inside Tax Details tab accordion - Reports section
 */
export class ReportsPage extends BasePage {
  readonly url = "/tax-planning";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Tab and Accordion Locators
  // ============================================

  get taxDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Tax Details/i });
  }

  get reportsSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Reports/i });
  }

  get reportsHeader(): Locator {
    return this.reportsSection.locator(".v-expansion-panel-title");
  }

  get reportsContent(): Locator {
    return this.reportsSection.locator(".v-expansion-panel-text");
  }

  // ============================================
  // Page Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Financial Year Selector
  get financialYearSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Financial Year/i });
  }

  // Export Buttons
  get exportPDFButton(): Locator {
    return this.page.getByRole("button", { name: /PDF/i });
  }

  get exportExcelButton(): Locator {
    return this.page.getByRole("button", { name: /Excel/i });
  }

  // Report Tabs
  get summaryReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Tax Summary/i });
  }

  get comparisonReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Regime Comparison/i });
  }

  get deductionsReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Deduction Utilization/i });
  }

  get advanceTaxReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Advance Tax/i });
  }

  // Summary Tab Content
  get summaryCards(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Gross Total Income|Tax Payable/i });
  }

  get taxDistributionChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Distribution/i });
  }

  get taxSummaryTable(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Summary/i }).locator(".v-table");
  }

  // Comparison Tab Content
  get regimeComparisonChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Old vs New Regime/i });
  }

  get detailedComparisonTable(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Detailed Comparison/i });
  }

  get savingsAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /saves you/i });
  }

  // Deductions Tab Content
  get deductionUtilizationChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Deduction Utilization/i });
  }

  get sectionWiseSummary(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Section-wise Summary/i });
  }

  // Advance Tax Tab Content
  get advanceTaxScheduleCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Advance Tax Schedule/i });
  }

  get advanceTaxScheduleTable(): Locator {
    return this.advanceTaxScheduleCard.locator(".v-table");
  }

  get interestAlert(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /Interest/i });
  }

  // ITR Form Reference
  get itrFormReference(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /ITR Form Reference/i });
  }

  get itrFormCards(): Locator {
    return this.itrFormReference.locator(".v-chip").filter({ hasText: /ITR-/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
    // Switch to Tax Details tab
    await this.taxDetailsTab.click();
    await this.page.waitForTimeout(300);
    // Expand Reports accordion section
    await this.expandReports();
  }

  async expandReports() {
    const isExpanded = await this.reportsSection.getAttribute("class");
    if (!isExpanded?.includes("v-expansion-panel--active")) {
      await this.reportsHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ============================================
  // Actions
  // ============================================

  async selectFinancialYear(year: string) {
    await this.financialYearSelect.click();
    await this.page.getByRole("option", { name: year }).click();
    await this.page.waitForTimeout(300);
  }

  async exportToPDF() {
    await this.exportPDFButton.click();
    // Wait for potential download or loading state
    await this.page.waitForTimeout(1000);
  }

  async exportToExcel() {
    await this.exportExcelButton.click();
    // Wait for potential download or loading state
    await this.page.waitForTimeout(1000);
  }

  async switchToSummaryTab() {
    await this.summaryReportTab.click();
  }

  async switchToComparisonTab() {
    await this.comparisonReportTab.click();
  }

  async switchToDeductionsTab() {
    await this.deductionsReportTab.click();
  }

  async switchToAdvanceTaxTab() {
    await this.advanceTaxReportTab.click();
  }

  // ============================================
  // Getters
  // ============================================

  async getGrossIncome(): Promise<string> {
    const card = this.page.locator(".v-card").filter({ hasText: /Gross Total Income/i });
    const value = card.locator(".text-currency");
    return (await value.textContent()) || "₹0";
  }

  async getTaxPayable(): Promise<string> {
    const card = this.page.locator(".v-card").filter({ hasText: /Tax Payable/i });
    const value = card.locator(".text-currency");
    return (await value.textContent()) || "₹0";
  }

  async getEffectiveRate(): Promise<string> {
    const card = this.page.locator(".v-card").filter({ hasText: /Effective Rate/i });
    const value = card.locator(".text-h6");
    return (await value.textContent()) || "0%";
  }

  async getTaxSavings(): Promise<string> {
    const card = this.page.locator(".v-card").filter({ hasText: /Tax Savings/i });
    const value = card.locator(".text-currency");
    return (await value.textContent()) || "₹0";
  }

  async getBetterRegime(): Promise<string> {
    const alert = this.savingsAlert;
    const text = await alert.textContent();
    if (text?.includes("New Regime")) return "NEW";
    if (text?.includes("Old Regime")) return "OLD";
    return "";
  }

  async getDeductionUtilization(section: string): Promise<string> {
    const item = this.sectionWiseSummary.locator(".v-list-item").filter({ hasText: section });
    const chip = item.locator(".v-chip");
    return (await chip.textContent()) || "0%";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    // Tax Details tab should be active and Reports section expanded
    await expect(this.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(this.reportsContent).toBeVisible();
  }

  async expectExportButtonsVisible() {
    await expect(this.exportPDFButton).toBeVisible();
    await expect(this.exportExcelButton).toBeVisible();
  }

  async expectReportTabsVisible() {
    await expect(this.summaryReportTab).toBeVisible();
    await expect(this.comparisonReportTab).toBeVisible();
    await expect(this.deductionsReportTab).toBeVisible();
    await expect(this.advanceTaxReportTab).toBeVisible();
  }

  async expectSummaryTabContent() {
    await expect(this.taxDistributionChart).toBeVisible();
  }

  async expectComparisonTabContent() {
    await expect(this.regimeComparisonChart).toBeVisible();
    await expect(this.detailedComparisonTable).toBeVisible();
  }

  async expectDeductionsTabContent() {
    await expect(this.deductionUtilizationChart).toBeVisible();
    await expect(this.sectionWiseSummary).toBeVisible();
  }

  async expectAdvanceTaxTabContent() {
    await expect(this.advanceTaxScheduleCard).toBeVisible();
  }

  async expectITRFormReference() {
    await expect(this.itrFormReference).toBeVisible();
  }
}
