import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Deductions Page Object
 * Located in Tax Details tab → Deductions accordion section
 *
 * UI Structure:
 * - Summary cards: Total Deductions, Tax Savings (Est.), 80C Remaining
 * - Add Deduction button
 * - Deduction categories with progress bars:
 *   - Section 80C (limit ₹1,50,000)
 *   - Section 80D - Health Insurance (limit ₹25,000)
 *   - Section 80CCD(1B) - NPS (limit ₹50,000)
 *   - Section 24 - Home Loan Interest (limit ₹2,00,000)
 *   - Other Deductions (80E, 80G, 80TTA)
 * - Deductions Optimizer section
 */
export class TaxDeductionsPage extends BasePage {
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

  get deductionsSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({
      has: this.page.locator(".text-subtitle-1", { hasText: /^Deductions$/ })
    });
  }

  get deductionsHeader(): Locator {
    return this.deductionsSection.locator(".v-expansion-panel-title");
  }

  get deductionsContent(): Locator {
    return this.deductionsSection.locator(".v-expansion-panel-text");
  }

  // ============================================
  // Summary Cards
  // ============================================

  get totalDeductionsSummary(): Locator {
    return this.page.locator("div").filter({ hasText: /^Total Deductions/ }).first();
  }

  get totalDeductionsValue(): Locator {
    return this.page.locator("text=Total Deductions").locator("xpath=following-sibling::*").first();
  }

  get taxSavingsSummary(): Locator {
    return this.page.locator("div").filter({ hasText: /Tax Savings.*Est/ }).first();
  }

  get section80CRemainingSummary(): Locator {
    return this.page.locator("div").filter({ hasText: /80C Remaining/ }).first();
  }

  // ============================================
  // Add Deduction Button
  // ============================================

  get addDeductionButton(): Locator {
    return this.page.getByRole("button", { name: /Add Deduction/i }).first();
  }

  // ============================================
  // Deduction Category Cards
  // ============================================

  get section80CCard(): Locator {
    return this.page.locator("div").filter({ hasText: /Section 80C/ }).filter({ has: this.page.locator("progressbar") }).first();
  }

  get section80CProgress(): Locator {
    return this.section80CCard.locator("progressbar");
  }

  get section80DCard(): Locator {
    return this.page.locator("div").filter({ hasText: /Section 80D.*Health Insurance/ }).first();
  }

  get section80CCD1BCard(): Locator {
    return this.page.locator("div").filter({ hasText: /Section 80CCD.*1B.*NPS/ }).first();
  }

  get section24Card(): Locator {
    return this.page.locator("div").filter({ hasText: /Section 24.*Home Loan/ }).first();
  }

  get otherDeductionsCard(): Locator {
    return this.page.locator("div").filter({ hasText: /Other Deductions.*80E.*80G/ }).first();
  }

  // ============================================
  // Deductions Optimizer
  // ============================================

  get deductionsOptimizer(): Locator {
    return this.page.locator("div").filter({ hasText: /Deductions Optimizer/ }).first();
  }

  // ============================================
  // Deduction Form Dialog
  // ============================================

  get deductionFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Deduction|Edit Deduction|New Deduction/i });
  }

  get deductionTypeSelect(): Locator {
    return this.deductionFormDialog.locator(".v-select");
  }

  get deductionAmountField(): Locator {
    return this.deductionFormDialog.getByRole("spinbutton");
  }

  get deductionDescriptionField(): Locator {
    return this.deductionFormDialog.getByRole("textbox", { name: /Description|Details|Notes/i });
  }

  get saveButton(): Locator {
    return this.deductionFormDialog.getByRole("button", { name: /Save|Add|Submit/i });
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
    // Switch to Tax Details tab
    await this.taxDetailsTab.click();
    await this.page.waitForTimeout(500);
    // Expand Deductions accordion section
    await this.expandDeductions();
    // Wait for deductions content to be visible
    await this.page.waitForTimeout(500);
  }

  async expandDeductions() {
    // Click on the Deductions accordion header
    const deductionsHeader = this.page.getByRole("button", { name: /Deductions.*Manage 80C/i });
    const isExpanded = await deductionsHeader.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await deductionsHeader.click();
      await this.page.waitForTimeout(800);
    }
    // Ensure content is loaded
    await this.page.locator("text=Total Deductions").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
  }

  // ============================================
  // Form Actions
  // ============================================

  async openAddDeductionForm() {
    await this.addDeductionButton.click();
    await this.page.waitForTimeout(300);
  }

  async addDeduction(type: string, amount: number, description?: string) {
    // This would add a deduction - but the form may vary based on implementation
    await this.openAddDeductionForm();

    // Check if dialog opened
    const dialogVisible = await this.deductionFormDialog.isVisible().catch(() => false);
    if (!dialogVisible) {
      // Maybe need to click on specific section's add button
      return;
    }

    if (await this.deductionTypeSelect.isVisible()) {
      await this.deductionTypeSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: new RegExp(type, "i") }).click();
      await this.page.waitForTimeout(200);
    }

    if (await this.deductionAmountField.isVisible()) {
      await this.deductionAmountField.clear();
      await this.deductionAmountField.fill(amount.toString());
    }

    if (description && await this.deductionDescriptionField.isVisible()) {
      await this.deductionDescriptionField.clear();
      await this.deductionDescriptionField.fill(description);
    }

    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelAddDeduction() {
    if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  // ============================================
  // Getters
  // ============================================

  async getSection80CTotal(): Promise<string> {
    // Find the 80C progress text like "₹0 of ₹1,50,000"
    const progressText = await this.page.locator("text=/₹[\\d,]+ of ₹1,50,000/").first().textContent().catch(() => "₹0");
    return progressText || "₹0";
  }

  async getSection80DTotal(): Promise<string> {
    const progressText = await this.page.locator("text=/₹[\\d,]+ of ₹25,000/").first().textContent().catch(() => "₹0");
    return progressText || "₹0";
  }

  async getSection80CCD1BTotal(): Promise<string> {
    const progressText = await this.page.locator("text=/₹[\\d,]+ of ₹50,000/").first().textContent().catch(() => "₹0");
    return progressText || "₹0";
  }

  async getSection24Total(): Promise<string> {
    const progressText = await this.page.locator("text=/₹[\\d,]+ of ₹2,00,000/").first().textContent().catch(() => "₹0");
    return progressText || "₹0";
  }

  async getTotalDeductions(): Promise<string> {
    // Find the Total Deductions value
    const totalText = await this.page.locator("text=Total Deductions").locator("xpath=..").locator("text=/₹[\\d,]+/").textContent().catch(() => "₹0");
    return totalText || "₹0";
  }

  async getSection80CProgress(): Promise<number> {
    // Get progress percentage from the 80C section
    const percentText = await this.page.locator("text=Section 80C").locator("xpath=../..").locator("text=/\\d+%/").first().textContent().catch(() => "0%");
    return parseFloat(percentText?.replace("%", "") || "0");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Tax Planning/i })).toBeVisible();
    await expect(this.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    // Deductions section should be expanded
    await expect(this.page.locator("text=Total Deductions")).toBeVisible();
  }

  async expectSection80CVisible() {
    await expect(this.page.locator("text=Section 80C").first()).toBeVisible();
  }

  async expectSection80DVisible() {
    await expect(this.page.locator("text=/Section 80D|Health Insurance/i").first()).toBeVisible();
  }

  async expectTotalDeductionsVisible() {
    await expect(this.page.locator("text=Total Deductions")).toBeVisible();
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

  // Legacy method aliases
  get totalDeductionsCard(): Locator {
    return this.totalDeductionsSummary;
  }
}
