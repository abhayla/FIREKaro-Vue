import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Page Object for Salary Overview Tab (/income/salary)
 * Updated for new 2-tab structure (Overview + Salary Details)
 */
export class SalaryOverviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateTo() {
    await this.goto("/income/salary");
    await this.waitForPageLoad();
  }

  // Page elements
  get pageTitle(): Locator {
    return this.page.getByText("Salary", { exact: true }).first();
  }

  // Tab elements - use v-tab class instead of role
  get overviewTab(): Locator {
    return this.page.locator(".v-tab").filter({ hasText: "Overview" });
  }

  get salaryDetailsTab(): Locator {
    return this.page.locator(".v-tab").filter({ hasText: "Salary Details" });
  }

  // Summary metric cards - look for text content
  get fyGrossCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FY Gross/i });
  }

  get fyNetCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FY Net/i });
  }

  get tdsPaidCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /TDS Paid/i });
  }

  get epfVpfCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /EPF.*VPF/i });
  }

  // Data completion section
  get dataCompletionSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /DATA COMPLETION/i });
  }

  get dataCompletionChip(): Locator {
    return this.dataCompletionSection.locator(".v-chip");
  }

  get dataCompletionGrid(): Locator {
    // The month cells are contained within the data completion section
    return this.dataCompletionSection.locator("[class*='month'], [class*='cell']").or(
      this.dataCompletionSection.locator("text=Apr").locator("..")
    );
  }

  // Charts section
  get monthlySalaryTrendCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /MONTHLY SALARY TREND/i });
  }

  get salaryChart(): Locator {
    return this.monthlySalaryTrendCard.locator("canvas");
  }

  // YoY Comparison section
  get yoyComparisonCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /YEAR-ON-YEAR COMPARISON/i });
  }

  // Employer Breakdown section
  get employerBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /EMPLOYER BREAKDOWN/i });
  }

  // Deductions Breakdown section
  get deductionsBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /DEDUCTIONS BREAKDOWN/i });
  }

  // Empty state
  get emptyStateCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /No salary data/i });
  }

  get goToSalaryDetailsButton(): Locator {
    return this.page.getByRole("button", { name: /Go to Salary Details/i });
  }

  // FY Navigation
  get fySelector(): Locator {
    return this.page.locator(".v-select").first();
  }

  get prevFYButton(): Locator {
    return this.page.locator("button[title='Previous Financial Year']");
  }

  get nextFYButton(): Locator {
    return this.page.locator("button[title='Next Financial Year']");
  }

  // Actions
  async clickSalaryDetailsTab() {
    await this.salaryDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  async selectFinancialYear(fy: string) {
    await this.fySelector.click();
    await this.page.getByRole("option", { name: fy }).click();
    await this.page.waitForTimeout(500);
  }

  async goToPreviousFY() {
    await this.prevFYButton.click();
    await this.page.waitForTimeout(500);
  }

  async goToNextFY() {
    await this.nextFYButton.click();
    await this.page.waitForTimeout(500);
  }

  // Get values
  async getFYGrossValue(): Promise<string> {
    return (await this.fyGrossCard.locator(".text-h5, .text-h6, .metric-value").textContent()) || "";
  }

  async getFYNetValue(): Promise<string> {
    return (await this.fyNetCard.locator(".text-h5, .text-h6, .metric-value").textContent()) || "";
  }

  async getDataCompletionCount(): Promise<string> {
    return (await this.dataCompletionChip.textContent()) || "";
  }

  // Assertions
  async expectOverviewTabSelected() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectDataLoaded() {
    // Check that summary cards are visible
    await expect(this.fyGrossCard).toBeVisible();
    await expect(this.fyNetCard).toBeVisible();
  }

  async expectDataCompletionVisible() {
    await expect(this.dataCompletionSection).toBeVisible();
    await expect(this.dataCompletionChip).toBeVisible();
  }

  async expectChartsVisible() {
    await expect(this.monthlySalaryTrendCard).toBeVisible();
  }

  async expectYoYComparisonVisible() {
    await expect(this.yoyComparisonCard).toBeVisible();
  }

  async expectEmployerBreakdownVisible() {
    await expect(this.employerBreakdownCard).toBeVisible();
  }

  async expectDeductionsBreakdownVisible() {
    await expect(this.deductionsBreakdownCard).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyStateCard).toBeVisible();
    await expect(this.goToSalaryDetailsButton).toBeVisible();
  }

  async expectINRFormattedValues() {
    await expect(this.page.getByText(/₹[\d,]+/)).toBeVisible();
  }
}
