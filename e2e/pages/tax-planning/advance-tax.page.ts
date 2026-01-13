import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Advance Tax Page Object
 * Now inside Tax Details tab accordion - Advance Tax section
 */
export class AdvanceTaxPage extends BasePage {
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

  get advanceTaxSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Advance Tax/i });
  }

  get advanceTaxHeader(): Locator {
    return this.advanceTaxSection.locator(".v-expansion-panel-title");
  }

  get advanceTaxContent(): Locator {
    return this.advanceTaxSection.locator(".v-expansion-panel-text");
  }

  // ============================================
  // Page Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Tax Planning/i });
  }

  // Summary cards
  get netTaxLiabilityCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Net Tax Liability/i });
  }

  get totalPaidCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Paid/i });
  }

  get remainingCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Remaining/i });
  }

  get interestCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Interest.*234/i });
  }

  // Timeline
  get quarterlyTimeline(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Quarterly Schedule/i });
  }

  get q1Timeline(): Locator {
    return this.page.locator(".timeline-item").filter({ hasText: /Q1/i });
  }

  get q2Timeline(): Locator {
    return this.page.locator(".timeline-item").filter({ hasText: /Q2/i });
  }

  get q3Timeline(): Locator {
    return this.page.locator(".timeline-item").filter({ hasText: /Q3/i });
  }

  get q4Timeline(): Locator {
    return this.page.locator(".timeline-item").filter({ hasText: /Q4/i });
  }

  // Interest calculator
  get interestCalculator(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Interest Calculator/i });
  }

  get interest234BDisplay(): Locator {
    return this.page.locator("text=Section 234B").locator("..").locator(".text-currency");
  }

  get interest234CDisplay(): Locator {
    return this.page.locator("text=Section 234C").locator("..").locator(".text-currency");
  }

  // Payment history
  get paymentHistoryTable(): Locator {
    return this.page.locator(".v-data-table");
  }

  get addPaymentButton(): Locator {
    return this.page.getByRole("button", { name: /Add Payment/i });
  }

  // Payment form dialog
  get paymentDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Payment|Edit Payment/i });
  }

  get paymentDateInput(): Locator {
    return this.paymentDialog.locator('input[type="date"]');
  }

  get paymentAmountInput(): Locator {
    return this.paymentDialog.locator('input[type="number"]').first();
  }

  get quarterSelect(): Locator {
    return this.paymentDialog.locator(".v-select").filter({ hasText: /Quarter/i });
  }

  get challanNumberInput(): Locator {
    return this.paymentDialog.locator('input').filter({ hasText: /Challan/i });
  }

  get bsrCodeInput(): Locator {
    return this.paymentDialog.locator('input').filter({ hasText: /BSR/i });
  }

  get savePaymentButton(): Locator {
    return this.paymentDialog.getByRole("button", { name: /Save/i });
  }

  get cancelPaymentButton(): Locator {
    return this.paymentDialog.getByRole("button", { name: /Cancel/i });
  }

  // Create estimate button (when no estimate exists)
  get createEstimateButton(): Locator {
    return this.page.getByRole("button", { name: /Create Estimate/i });
  }

  get recalculateButton(): Locator {
    return this.page.getByRole("button", { name: /Recalculate/i });
  }

  // No data state
  get noEstimateMessage(): Locator {
    return this.page.locator("text=No Advance Tax Estimate");
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
    // Expand Advance Tax accordion section
    await this.expandAdvanceTax();
  }

  async expandAdvanceTax() {
    // Click on the Advance Tax accordion header
    const advanceTaxHeader = this.page.getByRole("button", { name: /Advance Tax.*quarterly/i });
    const isExpanded = await advanceTaxHeader.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await advanceTaxHeader.click();
      await this.page.waitForTimeout(500);
    }
  }

  // ============================================
  // Actions
  // ============================================

  async createEstimate() {
    await this.createEstimateButton.click();
    await this.page.waitForTimeout(500);
  }

  async recalculate() {
    await this.recalculateButton.click();
    await this.page.waitForTimeout(500);
  }

  async openAddPaymentDialog() {
    await this.addPaymentButton.click();
    await expect(this.paymentDialog).toBeVisible();
  }

  async fillPaymentForm(data: {
    date: string;
    amount: number;
    quarter: number;
    challanNumber: string;
    bsrCode: string;
  }) {
    await this.paymentDateInput.fill(data.date);
    await this.paymentAmountInput.fill(data.amount.toString());

    // Select quarter
    await this.quarterSelect.click();
    await this.page.getByRole("option", { name: new RegExp(`Q${data.quarter}`) }).click();

    // Fill challan details
    await this.paymentDialog.locator('input[label*="Challan"]').fill(data.challanNumber);
    await this.paymentDialog.locator('input[label*="BSR"]').fill(data.bsrCode);
  }

  async savePayment() {
    await this.savePaymentButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelPayment() {
    await this.cancelPaymentButton.click();
  }

  async deletePayment(rowIndex: number) {
    const deleteButton = this.paymentHistoryTable
      .locator("tbody tr")
      .nth(rowIndex)
      .getByRole("button", { name: /delete/i });
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.getByRole("button", { name: /Delete/i }).last();
    await confirmButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getNetTaxLiability(): Promise<string> {
    const value = this.netTaxLiabilityCard.locator(".text-h5, .text-currency").first();
    return (await value.textContent()) || "₹0";
  }

  async getTotalPaid(): Promise<string> {
    const value = this.totalPaidCard.locator(".text-h5, .text-currency").first();
    return (await value.textContent()) || "₹0";
  }

  async getRemaining(): Promise<string> {
    const value = this.remainingCard.locator(".text-h5, .text-currency").first();
    return (await value.textContent()) || "₹0";
  }

  async getTotalInterest(): Promise<string> {
    const value = this.interestCard.locator(".text-h5, .text-currency").first();
    return (await value.textContent()) || "₹0";
  }

  async getPaymentCount(): Promise<number> {
    const rows = this.paymentHistoryTable.locator("tbody tr");
    return await rows.count();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    // Tax Details tab should be active and Advance Tax section expanded
    await expect(this.taxDetailsTab).toHaveAttribute("aria-selected", "true");
    await expect(this.advanceTaxContent).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.netTaxLiabilityCard).toBeVisible();
    await expect(this.totalPaidCard).toBeVisible();
    await expect(this.remainingCard).toBeVisible();
    await expect(this.interestCard).toBeVisible();
  }

  async expectTimelineVisible() {
    await expect(this.quarterlyTimeline).toBeVisible();
  }

  async expectInterestCalculatorVisible() {
    await expect(this.interestCalculator).toBeVisible();
  }

  async expectPaymentHistoryVisible() {
    await expect(this.paymentHistoryTable).toBeVisible();
  }

  async expectNoEstimate() {
    await expect(this.noEstimateMessage).toBeVisible();
    await expect(this.createEstimateButton).toBeVisible();
  }

  async expectEstimateExists() {
    await expect(this.netTaxLiabilityCard).toBeVisible();
    await expect(this.quarterlyTimeline).toBeVisible();
  }

  async expectPaymentDialogVisible() {
    await expect(this.paymentDialog).toBeVisible();
  }

  async expectPaymentDialogClosed() {
    await expect(this.paymentDialog).not.toBeVisible();
  }
}
