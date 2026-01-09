import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Planning Overview Page Object
 * Main overview showing regime comparison and tax summary
 */
export class TaxPlanningOverviewPage extends BasePage {
  readonly url = "/dashboard/tax-planning";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get calculatorTab(): Locator {
    return this.page.getByRole("tab", { name: /Calculator/i });
  }

  get deductionsTab(): Locator {
    return this.page.getByRole("tab", { name: /Deductions/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Reports/i });
  }

  // Summary cards
  get totalIncomeCard(): Locator {
    return this.getSummaryCardByTitle("Total Income");
  }

  get totalDeductionsCard(): Locator {
    return this.getSummaryCardByTitle("Total Deductions");
  }

  get taxableIncomeCard(): Locator {
    return this.getSummaryCardByTitle("Taxable Income");
  }

  get estimatedTaxCard(): Locator {
    return this.getSummaryCardByTitle("Estimated Tax");
  }

  // Regime cards
  get oldRegimeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Old Regime/i });
  }

  get newRegimeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /New Regime/i });
  }

  get recommendedRegimeChip(): Locator {
    return this.page.locator(".v-chip").filter({ hasText: /Recommended|Better|Optimal/i });
  }

  // Tax breakdown
  get taxBreakdownSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Breakdown|Calculation/i });
  }

  // ITR type recommendation
  get itrTypeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /ITR.*Form|Recommended ITR/i });
  }

  // Financial year selector
  get fySelector(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Financial Year|FY/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async clickCalculatorTab() {
    await this.calculatorTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickDeductionsTab() {
    await this.deductionsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalIncome(): Promise<string> {
    return await this.getSummaryCardValue("Total Income");
  }

  async getTotalDeductions(): Promise<string> {
    return await this.getSummaryCardValue("Total Deductions");
  }

  async getTaxableIncome(): Promise<string> {
    return await this.getSummaryCardValue("Taxable Income");
  }

  async getEstimatedTax(): Promise<string> {
    return await this.getSummaryCardValue("Estimated Tax");
  }

  async getOldRegimeTax(): Promise<string> {
    const taxElement = this.oldRegimeCard.locator(".text-h4, .text-h5, .text-currency").first();
    return (await taxElement.textContent()) || "₹0";
  }

  async getNewRegimeTax(): Promise<string> {
    const taxElement = this.newRegimeCard.locator(".text-h4, .text-h5, .text-currency").first();
    return (await taxElement.textContent()) || "₹0";
  }

  async getRecommendedRegime(): Promise<string> {
    const parentCard = this.page.locator(".v-card").filter({ has: this.recommendedRegimeChip });
    const text = await parentCard.textContent();
    if (text?.includes("Old Regime")) return "Old";
    if (text?.includes("New Regime")) return "New";
    return "";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectRegimeCardsVisible() {
    await expect(this.oldRegimeCard).toBeVisible();
    await expect(this.newRegimeCard).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalIncomeCard).toBeVisible();
    await expect(this.taxableIncomeCard).toBeVisible();
    await expect(this.estimatedTaxCard).toBeVisible();
  }

  async expectRecommendedRegimeShown() {
    await expect(this.recommendedRegimeChip).toBeVisible();
  }

  async expectTotalIncome(expectedAmount: string) {
    await expect(this.totalIncomeCard.locator(".text-h4, .text-h5, .text-currency")).toContainText(expectedAmount);
  }

  async expectEstimatedTax(expectedAmount: string) {
    await expect(this.estimatedTaxCard.locator(".text-h4, .text-h5, .text-currency")).toContainText(expectedAmount);
  }
}
