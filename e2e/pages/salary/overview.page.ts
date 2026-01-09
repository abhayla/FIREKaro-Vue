import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Page Object for Salary Overview page (/dashboard/salary)
 * Updated for new employer cards and summary metric cards layout
 */
export class SalaryOverviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateTo() {
    await this.goto("/dashboard/salary");
    await this.waitForPageLoad();
  }

  // Page elements
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: "Salary" });
  }

  // Summary metric cards container
  get summaryMetricsContainer(): Locator {
    return this.page.locator(".summary-metric-cards, [data-testid='summary-metrics']");
  }

  // Individual summary cards - look for text content
  get monthlyGrossCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly Gross/i });
  }

  get monthlyNetCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly Net/i });
  }

  get annualGrossCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Annual Gross/i });
  }

  get tdsYtdCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /TDS/i });
  }

  // Employer cards section
  get employerCardsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Salary Sources/i });
  }

  get employerCards(): Locator {
    return this.page.locator("[data-testid='employer-card']");
  }

  get addEmployerButton(): Locator {
    return this.employerCardsSection.getByRole("button", { name: /Add Employer/i });
  }

  // Data completion progress card
  get dataCompletionCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Data Completion/i });
  }

  get dataCompletionProgressBar(): Locator {
    return this.dataCompletionCard.locator(".v-progress-linear");
  }

  // Salary chart section
  get salaryChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Salary Trend|chart/i }).first();
  }

  // YoY comparison card
  get comparisonCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Comparison|YoY|Year.*over/i });
  }

  // Quick actions section
  get quickActionsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Quick Actions/i });
  }

  get addSalaryEntryButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /Add Salary Entry/i });
  }

  get viewBreakdownButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /View Breakdown/i });
  }

  get generateReportButton(): Locator {
    return this.quickActionsSection.getByRole("button", { name: /Generate Report/i });
  }

  // Monthly grid dialog
  get monthlyGridDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Monthly Breakdown/i });
  }

  // Quick action buttons (legacy)
  get viewHistoryButton(): Locator {
    return this.page.getByRole("button", { name: /view.*history/i });
  }

  get addSalaryButton(): Locator {
    return this.page.getByRole("button", { name: /add.*(?:salary|month|employer)/i });
  }

  // Tabs
  async clickHistoryTab() {
    await this.clickTab("Salary History");
  }

  async clickCurrentTab() {
    await this.clickTab("Current Salary");
  }

  async clickReportsTab() {
    await this.clickTab("Reports");
  }

  // Get card values
  async getMonthlyGross(): Promise<string> {
    return (
      (await this.monthlyGrossCard.locator(".text-h5, .text-h6, .text-h4").textContent()) ||
      ""
    );
  }

  async getMonthlyNet(): Promise<string> {
    return (
      (await this.monthlyNetCard.locator(".text-h5, .text-h6, .text-h4").textContent()) ||
      ""
    );
  }

  // Employer card actions
  async getEmployerCardCount(): Promise<number> {
    const cards = this.page.locator("[data-testid='employer-card']");
    const count = await cards.count();
    // If no data-testid cards, check for EmployerCard components in employer section
    if (count === 0) {
      return await this.employerCardsSection.locator(".v-card .v-card").count();
    }
    return count;
  }

  async clickViewBreakdownOnEmployer(employerName: string) {
    const employerCard = this.page.locator(".v-card").filter({ hasText: employerName });
    await employerCard.getByRole("button", { name: /View.*Breakdown|Breakdown/i }).click();
    await this.page.waitForTimeout(500);
  }

  // Data completion
  async getDataCompletionPercent(): Promise<number> {
    const chipText = await this.dataCompletionCard.locator(".v-chip").textContent();
    const match = chipText?.match(/(\d+)\/12/);
    return match ? Math.round((parseInt(match[1]) / 12) * 100) : 0;
  }

  // Assertions
  async expectOverviewTabSelected() {
    await expect(
      this.page.getByRole("tab", { name: "Overview" })
    ).toHaveAttribute("aria-selected", "true");
  }

  async expectDataLoaded() {
    // Check that summary cards are visible (using text content)
    await expect(this.page.getByText(/Monthly Gross|Monthly Net/i)).toBeVisible();
  }

  async expectEmployerCardsVisible() {
    await expect(this.employerCardsSection).toBeVisible();
  }

  async expectMonthlyGridDialogOpen() {
    await expect(this.monthlyGridDialog).toBeVisible();
  }

  async expectMonthlyGridDialogClosed() {
    await expect(this.monthlyGridDialog).not.toBeVisible();
  }
}
