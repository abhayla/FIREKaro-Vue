import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Non-Salary Income Overview Page Object
 * Main overview page showing all income types
 */
export class NonSalaryOverviewPage extends BasePage {
  // Page URL
  readonly url = "/dashboard/non-salary-income";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Non-Salary Income/i });
  }

  get addIncomeButton(): Locator {
    return this.page.getByRole("button", { name: /Add Income/i });
  }

  // Income type cards on overview
  get businessIncomeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Business.*Profession/i });
  }

  get rentalIncomeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Rental Income/i });
  }

  get capitalGainsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Capital Gains/i });
  }

  get interestIncomeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Interest Income/i });
  }

  get dividendIncomeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Dividend Income/i });
  }

  get otherIncomeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Other Income/i });
  }

  // Summary values
  get totalIncomeValue(): Locator {
    return this.getSummaryCardByTitle("Total Non-Salary Income").locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get businessTab(): Locator {
    return this.page.getByRole("tab", { name: "Business" });
  }

  get rentalTab(): Locator {
    return this.page.getByRole("tab", { name: "Rental" });
  }

  get capitalGainsTab(): Locator {
    return this.page.getByRole("tab", { name: "Capital Gains" });
  }

  get interestTab(): Locator {
    return this.page.getByRole("tab", { name: "Interest" });
  }

  get dividendsTab(): Locator {
    return this.page.getByRole("tab", { name: "Dividends" });
  }

  get otherTab(): Locator {
    return this.page.getByRole("tab", { name: "Other" });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: "Reports" });
  }

  // Income type selection dialog
  get incomeTypeDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Income|Select.*Type/i });
  }

  // ============================================
  // Navigation Methods
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async clickBusinessTab() {
    await this.businessTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickRentalTab() {
    await this.rentalTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickCapitalGainsTab() {
    await this.capitalGainsTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickInterestTab() {
    await this.interestTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickDividendsTab() {
    await this.dividendsTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickOtherTab() {
    await this.otherTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickReportsTab() {
    await this.reportsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Actions
  // ============================================

  async clickAddIncome() {
    await this.addIncomeButton.click();
    await this.page.waitForTimeout(300);
  }

  async selectIncomeType(type: "business" | "rental" | "capital-gains" | "interest" | "dividends" | "other") {
    await this.clickAddIncome();
    await this.incomeTypeDialog.waitFor({ state: "visible" });

    const typeLabels: Record<string, string> = {
      business: "Business/Profession",
      rental: "Rental Income",
      "capital-gains": "Capital Gains",
      interest: "Interest Income",
      dividends: "Dividend Income",
      other: "Other Income",
    };

    await this.page.getByText(typeLabels[type]).click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getBusinessIncomeTotal(): Promise<string> {
    const valueElement = this.businessIncomeCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getRentalIncomeTotal(): Promise<string> {
    const valueElement = this.rentalIncomeCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getCapitalGainsTotal(): Promise<string> {
    const valueElement = this.capitalGainsCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getInterestIncomeTotal(): Promise<string> {
    const valueElement = this.interestIncomeCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getDividendIncomeTotal(): Promise<string> {
    const valueElement = this.dividendIncomeCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getOtherIncomeTotal(): Promise<string> {
    const valueElement = this.otherIncomeCard.locator(".text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "₹0";
  }

  async getTotalNonSalaryIncome(): Promise<string> {
    return (await this.totalIncomeValue.textContent()) || "₹0";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    // Wait for page title to be visible
    await expect(this.pageTitle).toBeVisible();
    // Also check the Add Income button is ready
    await expect(this.addIncomeButton).toBeVisible();
  }

  async expectBusinessCardVisible() {
    await expect(this.businessIncomeCard).toBeVisible();
  }

  async expectRentalCardVisible() {
    await expect(this.rentalIncomeCard).toBeVisible();
  }

  async expectCapitalGainsCardVisible() {
    await expect(this.capitalGainsCard).toBeVisible();
  }

  async expectInterestIncomeCardVisible() {
    await expect(this.interestIncomeCard).toBeVisible();
  }

  async expectDividendIncomeCardVisible() {
    await expect(this.dividendIncomeCard).toBeVisible();
  }

  async expectOtherIncomeCardVisible() {
    await expect(this.otherIncomeCard).toBeVisible();
  }

  async expectIncomeTypeDialogVisible() {
    await expect(this.incomeTypeDialog).toBeVisible();
  }

  async expectTotalIncome(expectedAmount: string) {
    await expect(this.totalIncomeValue).toContainText(expectedAmount);
  }
}
