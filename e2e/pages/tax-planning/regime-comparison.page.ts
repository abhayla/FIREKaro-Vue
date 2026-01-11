import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Regime Comparison Page Object
 * Handles Old vs New regime comparison
 */
export class RegimeComparisonPage extends BasePage {
  // Regime comparison is shown on the Overview page, not a separate page
  readonly url = "/tax-planning";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Old Regime Section
  get oldRegimeSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Old Regime/i }).first();
  }

  get oldRegimeGrossIncome(): Locator {
    return this.oldRegimeSection.locator("text=/Gross Income/i").locator("~ .text-currency, + .text-currency");
  }

  get oldRegimeDeductions(): Locator {
    return this.oldRegimeSection.locator("text=/Total Deductions/i").locator("~ .text-currency, + .text-currency");
  }

  get oldRegimeTaxableIncome(): Locator {
    return this.oldRegimeSection.locator("text=/Taxable Income/i").locator("~ .text-currency, + .text-currency");
  }

  get oldRegimeTax(): Locator {
    return this.oldRegimeSection.locator("text=/Tax Payable|Total Tax/i").locator("~ .text-currency, + .text-currency");
  }

  // New Regime Section
  get newRegimeSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /New Regime/i }).first();
  }

  get newRegimeGrossIncome(): Locator {
    return this.newRegimeSection.locator("text=/Gross Income/i").locator("~ .text-currency, + .text-currency");
  }

  get newRegimeStandardDeduction(): Locator {
    return this.newRegimeSection.locator("text=/Standard Deduction/i").locator("~ .text-currency, + .text-currency");
  }

  get newRegimeTaxableIncome(): Locator {
    return this.newRegimeSection.locator("text=/Taxable Income/i").locator("~ .text-currency, + .text-currency");
  }

  get newRegimeTax(): Locator {
    return this.newRegimeSection.locator("text=/Tax Payable|Total Tax/i").locator("~ .text-currency, + .text-currency");
  }

  // Comparison summary
  get savingsDisplay(): Locator {
    return this.page.locator("text=/You.*Save|Tax Savings|Savings/i").locator("~ .text-currency, + .text-currency");
  }

  get recommendedRegimeBadge(): Locator {
    return this.page.locator(".v-chip, .v-badge").filter({ hasText: /Recommended|Better|Choose/i });
  }

  // Deduction breakdown table
  get deductionBreakdownTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Deduction|Section/i });
  }

  // Slab breakdown
  get oldRegimeSlabTable(): Locator {
    return this.oldRegimeSection.locator(".v-data-table, table");
  }

  get newRegimeSlabTable(): Locator {
    return this.newRegimeSection.locator(".v-data-table, table");
  }

  // Toggle switches
  get showDetailedBreakdownToggle(): Locator {
    return this.page.getByRole("switch", { name: /Detailed|Breakdown/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Actions
  // ============================================

  async toggleDetailedBreakdown() {
    await this.showDetailedBreakdownToggle.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getOldRegimeTaxAmount(): Promise<string> {
    return (await this.oldRegimeTax.textContent()) || "₹0";
  }

  async getNewRegimeTaxAmount(): Promise<string> {
    return (await this.newRegimeTax.textContent()) || "₹0";
  }

  async getSavingsAmount(): Promise<string> {
    return (await this.savingsDisplay.textContent()) || "₹0";
  }

  async getRecommendedRegime(): Promise<"Old" | "New" | null> {
    const badgeText = await this.recommendedRegimeBadge.textContent();
    const oldRegimeSelected = await this.oldRegimeSection.locator(".v-chip").filter({ hasText: /Recommended/i }).count();
    const newRegimeSelected = await this.newRegimeSection.locator(".v-chip").filter({ hasText: /Recommended/i }).count();

    if (oldRegimeSelected > 0) return "Old";
    if (newRegimeSelected > 0) return "New";
    return null;
  }

  async getOldRegimeDeductionsTotal(): Promise<string> {
    return (await this.oldRegimeDeductions.textContent()) || "₹0";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Tax Planning/i })).toBeVisible();
    // Regime comparison is on the Overview tab
    await expect(this.page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  }

  async expectBothRegimesVisible() {
    await expect(this.oldRegimeSection).toBeVisible();
    await expect(this.newRegimeSection).toBeVisible();
  }

  async expectSavingsDisplayed() {
    await expect(this.savingsDisplay).toBeVisible();
  }

  async expectRecommendationShown() {
    await expect(this.recommendedRegimeBadge).toBeVisible();
  }

  async expectOldRegimeTax(expectedAmount: string) {
    await expect(this.oldRegimeTax).toContainText(expectedAmount);
  }

  async expectNewRegimeTax(expectedAmount: string) {
    await expect(this.newRegimeTax).toContainText(expectedAmount);
  }

  async expectDeductionBreakdownVisible() {
    await expect(this.deductionBreakdownTable).toBeVisible();
  }
}
