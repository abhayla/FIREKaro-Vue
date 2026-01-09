import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import type { OtherIncomeTestData } from "../../fixtures/non-salary-income-data";

/**
 * Other Income Page Object
 * Handles interest, dividends, gifts, and other miscellaneous income
 */
export class OtherIncomePage extends BasePage {
  readonly url = "/dashboard/non-salary-income/other";

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
    return this.page.getByRole("button", { name: /Add Income|Add Other/i });
  }

  // Summary cards
  get totalInterestCard(): Locator {
    return this.getSummaryCardByTitle("Interest Income");
  }

  get totalDividendsCard(): Locator {
    return this.getSummaryCardByTitle("Dividend Income");
  }

  get totalOtherIncomeCard(): Locator {
    return this.getSummaryCardByTitle("Total Other Income");
  }

  get tdsDeductedCard(): Locator {
    return this.getSummaryCardByTitle("TDS Deducted");
  }

  // Other income form dialog
  get otherIncomeFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Other Income/i });
  }

  // Form fields
  get incomeTypeSelect(): Locator {
    // Form uses "Income Category", not "Income Type"
    return this.page.locator(".v-select").filter({ hasText: /Income Category/i });
  }

  get descriptionField(): Locator {
    return this.page.getByLabel("Description");
  }

  get amountField(): Locator {
    return this.page.getByLabel("Gross Amount");
  }

  get tdsDeductedField(): Locator {
    return this.page.getByLabel("TDS Deducted");
  }

  get frequencySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Frequency/i });
  }

  get payerNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Payer.*Name|Deductor/i });
  }

  get payerPANField(): Locator {
    return this.page.getByRole("textbox", { name: /PAN|Payer PAN/i });
  }

  get tanField(): Locator {
    return this.page.getByRole("textbox", { name: /TAN/i });
  }

  get taxableCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /Taxable|Include.*Tax/i });
  }

  // Interest-specific fields
  get bankNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Bank Name/i });
  }

  get accountTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Account Type/i });
  }

  // Dividend-specific fields
  get companyNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Company Name/i });
  }

  get dividendTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Dividend Type/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.otherIncomeFormDialog.getByRole("button", { name: /Add Income|Update Income/i });
  }

  get cancelButton(): Locator {
    return this.otherIncomeFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Income|Confirm.*Delete/i });
  }

  // Filter controls
  get incomeTypeFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Filter.*Type/i });
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
    await this.addIncomeButton.click();
    await this.otherIncomeFormDialog.waitFor({ state: "visible" });
  }

  async fillOtherIncomeForm(data: Partial<OtherIncomeTestData>) {
    if (data.incomeType) {
      await this.incomeTypeSelect.click();
      await this.page.waitForTimeout(200);
      const typeLabel = this.getIncomeTypeLabel(data.incomeType);
      await this.page.getByRole("option", { name: typeLabel }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.description) {
      await this.descriptionField.clear();
      await this.descriptionField.fill(data.description);
    }

    if (data.amount !== undefined) {
      await this.amountField.clear();
      await this.amountField.fill(data.amount.toString());
    }

    if (data.tdsDeducted !== undefined) {
      await this.tdsDeductedField.clear();
      await this.tdsDeductedField.fill(data.tdsDeducted.toString());
    }

    if (data.frequency) {
      await this.frequencySelect.click();
      await this.page.waitForTimeout(200);
      const freqLabel = this.getFrequencyLabel(data.frequency);
      await this.page.getByRole("option", { name: freqLabel }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.payerName) {
      await this.payerNameField.clear();
      await this.payerNameField.fill(data.payerName);
    }

    if (data.payerPAN) {
      await this.payerPANField.clear();
      await this.payerPANField.fill(data.payerPAN);
    }

    if (data.isTaxable !== undefined) {
      const isChecked = await this.taxableCheckbox.isChecked();
      if (isChecked !== data.isTaxable) {
        await this.taxableCheckbox.click();
      }
    }
  }

  async saveForm() {
    // Click save and wait for API response
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/other-income") &&
                    (response.request().method() === "POST" || response.request().method() === "PUT"),
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
      // If no POST/PUT happens (e.g., validation error), wait a bit
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

  async editIncome(description: string) {
    await this.clickEditOnRow(description);
    await this.otherIncomeFormDialog.waitFor({ state: "visible" });
  }

  async deleteIncome(description: string) {
    await this.clickDeleteOnRow(description);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDeleteIncome() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Filter Actions
  // ============================================

  async filterByIncomeType(type: string) {
    await this.incomeTypeFilter.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: type }).click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalInterest(): Promise<string> {
    return await this.getSummaryCardValue("Interest Income");
  }

  async getTotalDividends(): Promise<string> {
    return await this.getSummaryCardValue("Dividend Income");
  }

  async getTotalOtherIncome(): Promise<string> {
    return await this.getSummaryCardValue("Total Other Income");
  }

  async getTotalTDSDeducted(): Promise<string> {
    return await this.getSummaryCardValue("TDS Deducted");
  }

  async getIncomeCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  // ============================================
  // Helpers
  // ============================================

  private getIncomeTypeLabel(type: string): string {
    // Match the actual category titles from OtherIncomeForm.vue
    const labels: Record<string, string> = {
      interest: "Interest Income",
      savings_interest: "Interest Income",
      fd_interest: "Interest Income",
      rd_interest: "Interest Income",
      dividend: "Dividend Income",
      commission: "Commission",
      royalty: "Royalty",
      pension: "Pension",
      gift: "Gift",
      agricultural: "Agricultural Income",
      exempt: "Other",
      lottery: "Other",
      other: "Other",
    };
    return labels[type] || type;
  }

  private getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      one_time: "One Time",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annual: "Annual",
    };
    return labels[frequency] || frequency;
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    // Wait for subtitle to be visible (rendered by SectionHeader)
    await expect(this.page.locator("p.text-body-2").filter({ hasText: "Other Income Sources" })).toBeVisible();
    // Also check the Add button is ready
    await expect(this.addIncomeButton).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.otherIncomeFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.otherIncomeFormDialog).not.toBeVisible();
  }

  async expectIncomeInTable(description: string) {
    await expect(this.getTableRowByText(description)).toBeVisible();
  }

  async expectIncomeNotInTable(description: string) {
    await expect(this.getTableRowByText(description)).not.toBeVisible();
  }

  async expectTotalOtherIncome(expectedAmount: string) {
    await expect(this.totalOtherIncomeCard.locator(".text-h4, .text-h5, .text-currency")).toContainText(expectedAmount);
  }

  async expectTDSDeducted(expectedAmount: string) {
    await expect(this.tdsDeductedCard.locator(".text-h4, .text-h5, .text-currency")).toContainText(expectedAmount);
  }
}
