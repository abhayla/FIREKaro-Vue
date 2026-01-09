import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Deductions Page Object
 * Handles 80C, 80D, HRA and other deductions
 */
export class TaxDeductionsPage extends BasePage {
  readonly url = "/dashboard/tax-planning/deductions";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Section 80C card
  get section80CCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Section 80C/i });
  }

  get section80CTotal(): Locator {
    return this.section80CCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  get section80CLimit(): Locator {
    return this.section80CCard.locator("text=/Limit.*1.5L|₹1,50,000/i");
  }

  get section80CProgress(): Locator {
    return this.section80CCard.locator(".v-progress-linear");
  }

  // Section 80D card
  get section80DCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Section 80D|Health Insurance/i });
  }

  get section80DTotal(): Locator {
    return this.section80DCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Section 80CCD(1B) card - NPS
  get section80CCD1BCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /80CCD.*1B|NPS Additional/i });
  }

  get section80CCD1BTotal(): Locator {
    return this.section80CCD1BCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // HRA Exemption card
  get hraExemptionCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /HRA Exemption/i });
  }

  get hraExemptionTotal(): Locator {
    return this.hraExemptionCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Section 24 (Home Loan Interest) card
  get section24Card(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Section 24|Home Loan Interest/i });
  }

  get section24Total(): Locator {
    return this.section24Card.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Section 80TTA card
  get section80TTACard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /80TTA|Savings Interest/i });
  }

  // Total deductions summary
  get totalDeductionsCard(): Locator {
    return this.getSummaryCardByTitle("Total Deductions");
  }

  get totalDeductionsValue(): Locator {
    return this.totalDeductionsCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Deduction breakdown table
  get deductionBreakdownTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Deduction|Section|Amount/i });
  }

  // Add deduction button
  get addDeductionButton(): Locator {
    return this.page.getByRole("button", { name: /Add Deduction/i });
  }

  // Deduction form dialog
  get deductionFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Deduction|Edit Deduction/i });
  }

  // Form fields
  get deductionTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Deduction Type|Section/i });
  }

  get deductionAmountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Amount/i });
  }

  get deductionDescriptionField(): Locator {
    return this.page.getByRole("textbox", { name: /Description|Details/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.deductionFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.deductionFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  // ============================================
  // Form Actions
  // ============================================

  async openAddDeductionForm() {
    await this.addDeductionButton.click();
    await this.deductionFormDialog.waitFor({ state: "visible" });
  }

  async addDeduction(type: string, amount: number, description?: string) {
    await this.openAddDeductionForm();

    await this.deductionTypeSelect.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: type }).click();
    await this.page.waitForTimeout(200);

    await this.deductionAmountField.clear();
    await this.deductionAmountField.fill(amount.toString());

    if (description) {
      await this.deductionDescriptionField.clear();
      await this.deductionDescriptionField.fill(description);
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelAddDeduction() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getSection80CTotal(): Promise<string> {
    return (await this.section80CTotal.textContent()) || "₹0";
  }

  async getSection80DTotal(): Promise<string> {
    return (await this.section80DTotal.textContent()) || "₹0";
  }

  async getSection80CCD1BTotal(): Promise<string> {
    return (await this.section80CCD1BTotal.textContent()) || "₹0";
  }

  async getHRAExemption(): Promise<string> {
    return (await this.hraExemptionTotal.textContent()) || "₹0";
  }

  async getSection24Total(): Promise<string> {
    return (await this.section24Total.textContent()) || "₹0";
  }

  async getTotalDeductions(): Promise<string> {
    return (await this.totalDeductionsValue.textContent()) || "₹0";
  }

  async getSection80CProgress(): Promise<number> {
    const progressBar = this.section80CProgress;
    const value = await progressBar.getAttribute("aria-valuenow");
    return parseFloat(value || "0");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Tax Planning/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Deductions/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectSection80CVisible() {
    await expect(this.section80CCard).toBeVisible();
  }

  async expectSection80DVisible() {
    await expect(this.section80DCard).toBeVisible();
  }

  async expectTotalDeductionsVisible() {
    await expect(this.totalDeductionsCard).toBeVisible();
  }

  async expectSection80CTotal(expectedAmount: string) {
    await expect(this.section80CTotal).toContainText(expectedAmount);
  }

  async expectSection80DTotal(expectedAmount: string) {
    await expect(this.section80DTotal).toContainText(expectedAmount);
  }

  async expectTotalDeductions(expectedAmount: string) {
    await expect(this.totalDeductionsValue).toContainText(expectedAmount);
  }

  async expectDeductionFormVisible() {
    await expect(this.deductionFormDialog).toBeVisible();
  }

  async expectDeductionFormClosed() {
    await expect(this.deductionFormDialog).not.toBeVisible();
  }

  async expect80CWithinLimit() {
    const progress = await this.getSection80CProgress();
    expect(progress).toBeLessThanOrEqual(100);
  }
}
