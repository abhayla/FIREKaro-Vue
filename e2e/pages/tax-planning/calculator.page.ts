import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Calculator Page Object
 * Located in Tax Details tab → Calculator accordion section
 *
 * UI Structure:
 * - Mode toggle: From Data / Manual
 * - Regime selector: Old / New buttons
 * - Gross Income input (disabled in From Data mode)
 * - Quick Select chips: ₹5L, ₹10L, ₹15L, ₹20L, ₹30L, ₹50L
 * - Deductions section (visible for Old regime or Manual mode)
 * - Results: Tax Breakdown Table + Regime Comparison Card
 */
export class TaxCalculatorPage extends BasePage {
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

  get calculatorSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ has: this.page.locator(".text-subtitle-1", { hasText: "Tax Calculator" }) });
  }

  get calculatorHeader(): Locator {
    return this.calculatorSection.locator(".v-expansion-panel-title");
  }

  get calculatorContent(): Locator {
    return this.calculatorSection.locator(".v-expansion-panel-text");
  }

  // ============================================
  // Mode Toggle (From Data / Manual)
  // ============================================

  get fromDataButton(): Locator {
    return this.page.getByRole("button", { name: /From Data/i });
  }

  get manualButton(): Locator {
    return this.page.getByRole("button", { name: /Manual/i });
  }

  get resetButton(): Locator {
    return this.page.getByRole("button", { name: /Reset/i });
  }

  // ============================================
  // Regime Toggle (Old / New)
  // ============================================

  get oldRegimeButton(): Locator {
    return this.page.getByRole("button", { name: /^Old$/i });
  }

  get newRegimeButton(): Locator {
    return this.page.getByRole("button", { name: /^New$/i });
  }

  // ============================================
  // Input Fields
  // ============================================

  get grossIncomeField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Gross Total Income/i });
  }

  get quickSelectChips(): Locator {
    return this.page.locator(".v-chip-group .v-chip");
  }

  // Deduction fields (visible in Old regime or Manual mode)
  get section80CField(): Locator {
    return this.page.locator(".v-text-field").filter({ hasText: /Section 80C/ }).locator("input");
  }

  get section80DField(): Locator {
    return this.page.locator(".v-text-field").filter({ hasText: /Section 80D/ }).locator("input");
  }

  get section80CCD1BField(): Locator {
    return this.page.locator(".v-text-field").filter({ hasText: /80CCD.*1B|NPS/ }).locator("input");
  }

  get homeLoanInterestField(): Locator {
    return this.page.locator(".v-text-field").filter({ hasText: /Section 24|Home Loan/ }).locator("input");
  }

  get otherDeductionsField(): Locator {
    return this.page.locator(".v-text-field").filter({ hasText: /Other Deductions/ }).locator("input");
  }

  get totalDeductionsChip(): Locator {
    return this.page.locator(".v-chip").filter({ hasText: /Total:/i });
  }

  // ============================================
  // Results Section
  // ============================================

  get taxBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Calculation Breakdown/i });
  }

  get noCalculationDataMessage(): Locator {
    return this.page.locator("text=/No tax calculation data available/i");
  }

  get regimeComparisonCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Regime Comparison/i }).last();
  }

  get noComparisonDataMessage(): Locator {
    return this.page.locator("text=/No comparison data available/i");
  }

  // Tax values in breakdown - look for currency values
  get taxableIncomeDisplay(): Locator {
    return this.taxBreakdownCard.locator("text=/Taxable Income/i").locator("xpath=following-sibling::*[contains(@class, 'text-currency')]");
  }

  get totalTaxDisplay(): Locator {
    return this.taxBreakdownCard.locator("text=/Total Tax|Tax Payable/i").locator("xpath=following-sibling::*[contains(@class, 'text-currency')]");
  }

  get cessDisplay(): Locator {
    return this.taxBreakdownCard.locator("text=/Cess/i").locator("xpath=following-sibling::*[contains(@class, 'text-currency')]");
  }

  get effectiveTaxRateDisplay(): Locator {
    return this.taxBreakdownCard.locator("text=/Effective.*Rate/i");
  }

  // Slab breakdown table
  get slabBreakdownTable(): Locator {
    return this.taxBreakdownCard.locator("table, .v-data-table");
  }

  // New Regime notice
  get newRegimeNotice(): Locator {
    return this.page.locator(".v-alert").filter({ hasText: /New regime offers lower rates/i });
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
    // Calculator section should be expanded by default
    await this.expandCalculator();
  }

  async expandCalculator() {
    // Check if already expanded
    const content = this.calculatorContent;
    const isVisible = await content.isVisible().catch(() => false);
    if (!isVisible) {
      await this.calculatorHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ============================================
  // Mode Actions
  // ============================================

  async switchToManualMode() {
    await this.manualButton.click();
    await this.page.waitForTimeout(200);
  }

  async switchToFromDataMode() {
    await this.fromDataButton.click();
    await this.page.waitForTimeout(200);
  }

  async reset() {
    await this.resetButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Regime Actions
  // ============================================

  async selectRegime(regime: "Old" | "New") {
    if (regime === "Old") {
      await this.oldRegimeButton.click();
    } else {
      await this.newRegimeButton.click();
    }
    await this.page.waitForTimeout(200);
  }

  // ============================================
  // Input Actions
  // ============================================

  async enterGrossIncome(amount: number) {
    // First switch to manual mode if not already
    const isDisabled = await this.grossIncomeField.isDisabled();
    if (isDisabled) {
      await this.switchToManualMode();
    }
    await this.grossIncomeField.clear();
    await this.grossIncomeField.fill(amount.toString());
    await this.page.waitForTimeout(300); // Wait for recalculation
  }

  async selectQuickIncome(label: string) {
    const chip = this.quickSelectChips.filter({ hasText: label });
    await chip.click();
    await this.page.waitForTimeout(300);
  }

  async enterDeductions(deductions: {
    section80C?: number;
    section80D?: number;
    section80CCD1B?: number;
    homeLoanInterest?: number;
    other?: number;
  }) {
    // Switch to Old regime to show deduction fields
    await this.selectRegime("Old");
    await this.page.waitForTimeout(200);

    if (deductions.section80C !== undefined) {
      await this.section80CField.clear();
      await this.section80CField.fill(deductions.section80C.toString());
    }
    if (deductions.section80D !== undefined) {
      await this.section80DField.clear();
      await this.section80DField.fill(deductions.section80D.toString());
    }
    if (deductions.section80CCD1B !== undefined) {
      await this.section80CCD1BField.clear();
      await this.section80CCD1BField.fill(deductions.section80CCD1B.toString());
    }
    if (deductions.homeLoanInterest !== undefined) {
      await this.homeLoanInterestField.clear();
      await this.homeLoanInterestField.fill(deductions.homeLoanInterest.toString());
    }
    if (deductions.other !== undefined) {
      await this.otherDeductionsField.clear();
      await this.otherDeductionsField.fill(deductions.other.toString());
    }
    await this.page.waitForTimeout(300);
  }

  // No explicit calculate needed - calculator auto-calculates
  async calculate() {
    // Calculator auto-calculates, but we wait for update
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalTax(): Promise<string> {
    // Try to get from breakdown card
    const text = await this.taxBreakdownCard.locator(".text-currency").first().textContent().catch(() => "₹0");
    return text || "₹0";
  }

  async getTaxableIncome(): Promise<string> {
    const text = await this.taxableIncomeDisplay.textContent().catch(() => "₹0");
    return text || "₹0";
  }

  async getCess(): Promise<string> {
    const text = await this.cessDisplay.textContent().catch(() => "₹0");
    return text || "₹0";
  }

  async getEffectiveTaxRate(): Promise<string> {
    const text = await this.effectiveTaxRateDisplay.textContent().catch(() => "0%");
    return text || "0%";
  }

  parseINR(text: string): number {
    const cleaned = text.replace(/[₹,\s]/g, "");
    return parseFloat(cleaned) || 0;
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Tax Planning/i })).toBeVisible();
    await expect(this.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(this.calculatorContent).toBeVisible();
  }

  async expectResultsVisible() {
    await expect(this.taxBreakdownCard).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.noCalculationDataMessage).toBeVisible();
  }

  async expectSlabBreakdownVisible() {
    await expect(this.slabBreakdownTable).toBeVisible();
  }

  async expectCessApplied() {
    await expect(this.cessDisplay).toBeVisible();
  }

  async expectTotalTax(expectedAmount: string) {
    const taxText = await this.getTotalTax();
    expect(taxText).toContain(expectedAmount);
  }

  async expectTaxableIncome(expectedAmount: string) {
    const incomeText = await this.getTaxableIncome();
    expect(incomeText).toContain(expectedAmount);
  }

  // Legacy aliases for backward compatibility
  get calculateButton(): Locator {
    // Calculator auto-calculates, but return a dummy locator for tests
    return this.quickSelectChips.first();
  }

  get resultsSection(): Locator {
    return this.taxBreakdownCard;
  }

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }
}
