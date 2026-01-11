import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import type { BusinessIncomeTestData } from "../../fixtures/income-data";

/**
 * Business Income Page Object
 * Handles business/profession income (44AD/44ADA)
 */
export class BusinessIncomePage extends BasePage {
  readonly url = "/income/business";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Income/i });
  }

  get addBusinessButton(): Locator {
    return this.page.getByRole("button", { name: /Add Business|Add Income/i }).first();
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
    return this.page.locator(".v-dialog").filter({ hasText: /Business\/Profession Income/i });
  }

  // Form fields
  get businessNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Business.*Firm.*Name/i });
  }

  get businessTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Business Type/i });
  }

  get taxationMethodSelect(): Locator {
    // Taxation Method uses radio buttons, not a select
    return this.page.locator("text=Taxation Method").locator("..");
  }

  get grossReceiptsField(): Locator {
    return this.page.getByLabel(/Gross Receipts/i);
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
    return this.businessFormDialog.getByRole("button", { name: /Add Business|Update Business/i });
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

  // Tab locators
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get businessDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Business Details" });
  }

  async switchToDetailsTab() {
    await this.businessDetailsTab.click();
    await this.page.waitForTimeout(300);
    // Wait for Add button to be visible
    await this.addBusinessButton.waitFor({ state: "visible", timeout: 10000 });
  }

  async switchToOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Form Actions
  // ============================================

  async openAddForm() {
    // First ensure we're on the Business Details tab where Add button is
    const isAddButtonVisible = await this.addBusinessButton.isVisible().catch(() => false);
    if (!isAddButtonVisible) {
      await this.switchToDetailsTab();
    }
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
      // Taxation method is a radio button group
      const methodLabel = this.getTaxationMethodLabel(data.taxationMethod);
      await this.page.getByRole("radio", { name: new RegExp(methodLabel, "i") }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.grossReceipts !== undefined) {
      await this.grossReceiptsField.clear();
      await this.grossReceiptsField.fill(data.grossReceipts.toString());
    }

    // Note: Digital payment percentage is a slider, not a text field
    // The slider sets the percentage directly, calculation is done by the form

    if (data.gstRegistered) {
      const checkbox = this.page.getByLabel(/GST Registered/i);
      if (await checkbox.isVisible()) {
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
          await checkbox.click();
        }
        if (data.gstNumber) {
          await this.gstNumberField.fill(data.gstNumber);
        }
      }
    }
  }

  async saveForm() {
    // Click save and wait for API response
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/business-income") && response.request().method() === "POST",
      { timeout: 10000 }
    );
    await this.saveButton.click();
    try {
      const response = await responsePromise;
      const status = response.status();
      if (status >= 400) {
        console.log(`API returned ${status}: ${await response.text()}`);
      }
    } catch (e) {
      // If no POST happens (e.g., validation error), wait a bit
      await this.page.waitForTimeout(500);
    }
    // Wait for dialog to close and table to refresh
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
      commission_agent: "Commission Agent",
    };
    return labels[type] || type;
  }

  private getTaxationMethodLabel(method: string): string {
    // Use exact match patterns to avoid 44AD matching 44ADA
    const labels: Record<string, string> = {
      "44AD": "Section 44AD Business",
      "44ADA": "Section 44ADA Profession",
      regular: "Regular Books",
      regular_books: "Regular Books",
    };
    return labels[method] || method;
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    // Wait for subtitle to be visible (rendered by SectionHeader)
    await expect(this.page.locator("p.text-body-2").filter({ hasText: "Business & Professional" })).toBeVisible();
    // Check the page has loaded by looking for the tab structure (Overview tab is default)
    await expect(this.page.getByRole("tab", { name: "Overview" })).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.businessFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.businessFormDialog).not.toBeVisible();
  }

  async expectBusinessInTable(businessName: string) {
    // Use first() to handle cases where multiple rows match (from parallel test runs)
    await expect(this.getTableRowByText(businessName).first()).toBeVisible();
  }

  async expectBusinessNotInTable(businessName: string) {
    await expect(this.getTableRowByText(businessName).first()).not.toBeVisible();
  }

  async expectDeemedProfit(expectedAmount: string) {
    await expect(this.deemedProfitDisplay).toContainText(expectedAmount);
  }

  async expectDeleteDialogVisible() {
    await expect(this.deleteDialog).toBeVisible();
  }
}
