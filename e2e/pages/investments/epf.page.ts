import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * EPF Page Object
 * Handles Employee Provident Fund page with two-tab pattern
 */
export class EpfPage extends BasePage {
  readonly url = "/dashboard/investments/epf";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  get pageSubtitle(): Locator {
    return this.page.locator("text=/EPF|Employee Provident Fund/i");
  }

  // Tab navigation
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get detailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Item Details" });
  }

  // Financial Year Selector
  get fySelector(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /FY|2024|2025|2026/i });
  }

  // Summary cards (Overview tab)
  get totalBalanceCard(): Locator {
    return this.getSummaryCardByTitle("Total Balance");
  }

  get employeeShareCard(): Locator {
    return this.getSummaryCardByTitle("Employee Share");
  }

  get employerShareCard(): Locator {
    return this.getSummaryCardByTitle("Employer Share");
  }

  get section80CCard(): Locator {
    return this.page.locator(".v-card, .v-alert").filter({ hasText: /80C|Deduction/i });
  }

  // UAN display
  get uanDisplay(): Locator {
    return this.page.locator(".v-chip, text").filter({ hasText: /UAN/i });
  }

  // Interest rate display
  get interestRateDisplay(): Locator {
    return this.page.locator("text=/Interest Rate|8.25%/i");
  }

  // Projection chart
  get projectionChart(): Locator {
    return this.page.locator("canvas, .vue-chartjs");
  }

  // Monthly grid (Details tab)
  get monthlyGrid(): Locator {
    return this.page.locator(".investment-monthly-grid, table");
  }

  get editModeButton(): Locator {
    return this.page.getByRole("button", { name: /Edit/i });
  }

  get saveChangesButton(): Locator {
    return this.page.getByRole("button", { name: /Save/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async navigateToOverview() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  async navigateToDetails() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Actions
  // ============================================

  async selectFinancialYear(fy: string) {
    await this.fySelector.click();
    await this.page.getByRole("option", { name: fy }).click();
    await this.page.waitForTimeout(500);
  }

  async enterEditMode() {
    await this.editModeButton.click();
    await this.page.waitForTimeout(300);
  }

  async saveChanges() {
    await this.saveChangesButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelEdit() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalBalance(): Promise<string> {
    return await this.getSummaryCardValue("Total Balance");
  }

  async getEmployeeShare(): Promise<string> {
    return await this.getSummaryCardValue("Employee Share");
  }

  async getEmployerShare(): Promise<string> {
    return await this.getSummaryCardValue("Employer Share");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "EPF" })).toHaveAttribute("aria-selected", "true");
    await expect(this.overviewTab).toBeVisible();
    await expect(this.detailsTab).toBeVisible();
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectDetailsTabActive() {
    await expect(this.detailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectTotalBalanceVisible() {
    await expect(this.totalBalanceCard).toBeVisible();
  }

  async expectMonthlyGridVisible() {
    await expect(this.monthlyGrid).toBeVisible();
  }

  async expectProjectionChartVisible() {
    await expect(this.projectionChart).toBeVisible();
  }
}
