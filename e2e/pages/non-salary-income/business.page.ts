import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import type { BusinessIncomeTestData } from "../../fixtures/non-salary-income-data";

/**
 * Business Income Page Object
 * Handles business/profession income (44AD/44ADA)
 */
export class BusinessIncomePage extends BasePage {
  readonly url = "/dashboard/non-salary-income/business";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Non-Salary Income/i });
  }

  get addBusinessButton(): Locator {
    return this.page.getByRole("button", { name: /Add Business|Add Income/i });
  }

  // Summary cards
  get totalGrossReceiptsCard(): Locator {
    return this.getSummaryCardByTitle("Total Gross Receipts");
  }

  get totalDeemedProfitCard(): Locator {
    return this.getSummaryCardByTitle("Total Taxable Profit");
  }

  get businessCountCard(): Locator {
    return this.getSummaryCardByTitle("Business Count");
  }

  // Business form dialog
  get businessFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Business.*Income|Add Business|Edit Business/i });
  }

  // Form fields
  get businessNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Business Name/i });
  }

  get businessTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Business Type/i });
  }

  get taxationMethodSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Taxation Method/i });
  }

  get grossReceiptsField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Gross Receipts/i });
  }

  get digitalPaymentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Digital.*Payment|Bank.*Receipts/i });
  }

  get cashReceiptsField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Cash.*Receipts/i });
  }

  get gstRegisteredCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /GST Registered/i });
  }

  get gstNumberField(): Locator {
    return this.page.getByRole("textbox", { name: /GST Number|GSTIN/i });
  }

  // Calculated fields (read-only display)
  get deemedProfitDisplay(): Locator {
    return this.businessFormDialog.locator("text=/Deemed Profit|Taxable Profit/i").locator("~ .text-currency, ~ .v-chip");
  }

  get profitRateDisplay(): Locator {
    return this.businessFormDialog.locator("text=/Profit Rate/i").locator("~ .text-body-1, ~ .v-chip");
  }

  // Form buttons
  get saveButton(): Locator {
    return this.businessFormDialog.getByRole("button", { name: /Save|Add|Submit/i });
  }

  get cancelButton(): Locator {
    return this.businessFormDialog.getByRole("button", { name: /Cancel/i });
  }

  get closeButton(): Locator {
    return this.businessFormDialog.getByRole("button", { name: /Close/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Business|Confirm.*Delete/i });
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

  async openAddForm() {
    await this.addBusinessButton.click();
    await this.businessFormDialog.waitFor({ state: "visible" });
  }

  async fillBusinessForm(data: Partial<BusinessIncomeTestData>) {
    if (data.businessName) {
      await this.businessNameField.clear();
      await this.businessNameField.fill(data.businessName);
    }

    if (data.businessType) {
      await this.businessTypeSelect.click();
      await this.page.waitForTimeout(200);
      const typeLabel = this.getBusinessTypeLabel(data.businessType);
      await this.page.getByRole("option", { name: typeLabel }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.taxationMethod) {
      await this.taxationMethodSelect.click();
      await this.page.waitForTimeout(200);
      const methodLabel = this.getTaxationMethodLabel(data.taxationMethod);
      await this.page.getByRole("option", { name: methodLabel }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.grossReceipts !== undefined) {
      await this.grossReceiptsField.clear();
      await this.grossReceiptsField.fill(data.grossReceipts.toString());
    }

    if (data.digitalPaymentPercentage !== undefined) {
      // Calculate digital payment amount from percentage
      const digitalAmount = Math.round((data.grossReceipts || 0) * (data.digitalPaymentPercentage / 100));
      if (await this.digitalPaymentField.isVisible()) {
        await this.digitalPaymentField.clear();
        await this.digitalPaymentField.fill(digitalAmount.toString());
      }
    }

    if (data.gstRegistered) {
      const isChecked = await this.gstRegisteredCheckbox.isChecked();
      if (!isChecked) {
        await this.gstRegisteredCheckbox.click();
      }
      if (data.gstNumber) {
        await this.gstNumberField.fill(data.gstNumber);
      }
    }
  }

  async saveForm() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelForm() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Table Actions
  // ============================================

  async editBusiness(businessName: string) {
    await this.clickEditOnRow(businessName);
    await this.businessFormDialog.waitFor({ state: "visible" });
  }

  async deleteBusiness(businessName: string) {
    await this.clickDeleteOnRow(businessName);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDeleteBusiness() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  async cancelDeleteBusiness() {
    await this.deleteDialog.getByRole("button", { name: /Cancel|No/i }).click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalGrossReceipts(): Promise<string> {
    return await this.getSummaryCardValue("Total Gross Receipts");
  }

  async getTotalDeemedProfit(): Promise<string> {
    return await this.getSummaryCardValue("Total Taxable Profit");
  }

  async getBusinessCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  async getDeemedProfitFromForm(): Promise<string> {
    return (await this.deemedProfitDisplay.textContent()) || "₹0";
  }

  // ============================================
  // Helpers
  // ============================================

  private getBusinessTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      proprietorship: "Proprietorship",
      partnership: "Partnership",
      freelance: "Freelance",
      trading: "Trading",
      commission_agent: "Commission Agent",
    };
    return labels[type] || type;
  }

  private getTaxationMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      "44AD": "Section 44AD",
      "44ADA": "Section 44ADA",
      regular: "Regular Books",
      regular_books: "Regular Books",
    };
    return labels[method] || method;
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "Business" })).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.businessFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.businessFormDialog).not.toBeVisible();
  }

  async expectBusinessInTable(businessName: string) {
    await expect(this.getTableRowByText(businessName)).toBeVisible();
  }

  async expectBusinessNotInTable(businessName: string) {
    await expect(this.getTableRowByText(businessName)).not.toBeVisible();
  }

  async expectDeemedProfit(expectedAmount: string) {
    await expect(this.deemedProfitDisplay).toContainText(expectedAmount);
  }

  async expectDeleteDialogVisible() {
    await expect(this.deleteDialog).toBeVisible();
  }
}
