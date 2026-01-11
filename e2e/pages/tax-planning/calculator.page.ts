import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Calculator Page Object
 * Now inside Tax Details tab accordion - Calculator section
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
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Calculator/i });
  }

  get calculatorHeader(): Locator {
    return this.calculatorSection.locator(".v-expansion-panel-title");
  }

  get calculatorContent(): Locator {
    return this.calculatorSection.locator(".v-expansion-panel-text");
  }

  // ============================================
  // Page Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Input fields
  get grossIncomeField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Gross Income|Total Income/i });
  }

  get basicSalaryField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Basic Salary/i });
  }

  get hraReceivedField(): Locator {
    return this.page.getByRole("spinbutton", { name: /HRA Received/i });
  }

  get rentPaidField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Rent Paid/i });
  }

  get section80CField(): Locator {
    return this.page.getByRole("spinbutton", { name: /80C|Section 80C/i });
  }

  get section80DField(): Locator {
    return this.page.getByRole("spinbutton", { name: /80D|Health Insurance/i });
  }

  get section80CCD1BField(): Locator {
    return this.page.getByRole("spinbutton", { name: /80CCD.*1B|NPS Additional/i });
  }

  get homeLoanInterestField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Home Loan Interest|Section 24/i });
  }

  // Regime selection
  get regimeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Tax Regime/i });
  }

  get oldRegimeOption(): Locator {
    return this.page.getByRole("option", { name: /Old Regime/i });
  }

  get newRegimeOption(): Locator {
    return this.page.getByRole("option", { name: /New Regime/i });
  }

  // Age selection
  get ageGroupSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Age Group/i });
  }

  // Calculate button
  get calculateButton(): Locator {
    return this.page.getByRole("button", { name: /Calculate|Compute/i });
  }

  get resetButton(): Locator {
    return this.page.getByRole("button", { name: /Reset|Clear/i });
  }

  // Results section
  get resultsSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Result|Tax Calculation|Summary/i });
  }

  get totalIncomeDisplay(): Locator {
    return this.resultsSection.locator("text=/Total Income|Gross Income/i").locator("~ .text-currency, + .text-currency");
  }

  get totalDeductionsDisplay(): Locator {
    return this.resultsSection.locator("text=/Total Deductions/i").locator("~ .text-currency, + .text-currency");
  }

  get taxableIncomeDisplay(): Locator {
    return this.resultsSection.locator("text=/Taxable Income/i").locator("~ .text-currency, + .text-currency");
  }

  get baseTaxDisplay(): Locator {
    return this.resultsSection.locator("text=/Base Tax|Income Tax/i").locator("~ .text-currency, + .text-currency");
  }

  get surchargeDisplay(): Locator {
    return this.resultsSection.locator("text=/Surcharge/i").locator("~ .text-currency, + .text-currency");
  }

  get cessDisplay(): Locator {
    return this.resultsSection.locator("text=/Cess|Health.*Education/i").locator("~ .text-currency, + .text-currency");
  }

  get totalTaxDisplay(): Locator {
    return this.resultsSection.locator("text=/Total Tax|Tax Payable/i").locator("~ .text-currency, + .text-currency");
  }

  get effectiveTaxRateDisplay(): Locator {
    return this.resultsSection.locator("text=/Effective.*Rate|Tax Rate/i").locator("~ .text-body-1, + .text-body-1");
  }

  // Slab breakdown table
  get slabBreakdownTable(): Locator {
    return this.page.locator(".v-data-table, table").filter({ hasText: /Slab|Tax Rate/i });
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
    // Expand Calculator accordion section
    await this.expandCalculator();
  }

  async expandCalculator() {
    const isExpanded = await this.calculatorSection.getAttribute("class");
    if (!isExpanded?.includes("v-expansion-panel--active")) {
      await this.calculatorHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ============================================
  // Form Actions
  // ============================================

  async enterGrossIncome(amount: number) {
    await this.grossIncomeField.clear();
    await this.grossIncomeField.fill(amount.toString());
  }

  async enterDeductions(deductions: {
    section80C?: number;
    section80D?: number;
    section80CCD1B?: number;
    homeLoanInterest?: number;
  }) {
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
  }

  async selectRegime(regime: "Old" | "New") {
    await this.regimeSelect.click();
    await this.page.waitForTimeout(200);
    if (regime === "Old") {
      await this.oldRegimeOption.click();
    } else {
      await this.newRegimeOption.click();
    }
    await this.page.waitForTimeout(200);
  }

  async selectAgeGroup(ageGroup: "Below 60" | "60-80" | "Above 80") {
    await this.ageGroupSelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: ageGroup }).click();
    await this.page.waitForTimeout(200);
  }

  async calculate() {
    await this.calculateButton.click();
    await this.page.waitForTimeout(500);
  }

  async reset() {
    await this.resetButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalTax(): Promise<string> {
    return (await this.totalTaxDisplay.textContent()) || "₹0";
  }

  async getTaxableIncome(): Promise<string> {
    return (await this.taxableIncomeDisplay.textContent()) || "₹0";
  }

  async getBaseTax(): Promise<string> {
    return (await this.baseTaxDisplay.textContent()) || "₹0";
  }

  async getCess(): Promise<string> {
    return (await this.cessDisplay.textContent()) || "₹0";
  }

  async getEffectiveTaxRate(): Promise<string> {
    return (await this.effectiveTaxRateDisplay.textContent()) || "0%";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Tax Planning/i })).toBeVisible();
    // Tax Details tab should be active and Calculator section expanded
    await expect(this.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(this.calculatorContent).toBeVisible();
  }

  async expectResultsVisible() {
    await expect(this.resultsSection).toBeVisible();
    await expect(this.totalTaxDisplay).toBeVisible();
  }

  async expectTotalTax(expectedAmount: string) {
    await expect(this.totalTaxDisplay).toContainText(expectedAmount);
  }

  async expectTaxableIncome(expectedAmount: string) {
    await expect(this.taxableIncomeDisplay).toContainText(expectedAmount);
  }

  async expectSlabBreakdownVisible() {
    await expect(this.slabBreakdownTable).toBeVisible();
  }

  async expectCessApplied() {
    await expect(this.cessDisplay).toBeVisible();
    const cess = await this.getCess();
    expect(cess).not.toBe("₹0");
  }
}
