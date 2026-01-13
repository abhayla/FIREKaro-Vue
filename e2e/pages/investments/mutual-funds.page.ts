import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Mutual Funds Page Object
 * Handles mutual fund holdings, SIPs, and lumpsum investments
 */
export class MutualFundsPage extends BasePage {
  readonly url = "/investments/mutual-funds";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  get addMutualFundButton(): Locator {
    return this.page.getByRole("button", { name: /Add.*Fund|Add MF|Add Investment/i });
  }

  // Summary cards
  get totalValueCard(): Locator {
    return this.getSummaryCardByTitle("Total Value");
  }

  get totalInvestedCard(): Locator {
    return this.getSummaryCardByTitle("Total Invested");
  }

  get totalSIPCard(): Locator {
    return this.getSummaryCardByTitle("Monthly SIP");
  }

  get xirrCard(): Locator {
    return this.getSummaryCardByTitle("XIRR");
  }

  // Mutual fund form dialog
  get mfFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Fund|Edit.*Fund|Mutual Fund/i });
  }

  // Form fields
  get fundNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Fund Name|Scheme Name/i });
  }

  get fundCategorySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Category|Fund Type/i });
  }

  get investmentTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Investment Type|SIP.*Lumpsum/i });
  }

  get unitsField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Units/i });
  }

  get navField(): Locator {
    return this.page.getByRole("spinbutton", { name: /NAV|Current NAV/i });
  }

  get investedAmountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Invested Amount|Amount Invested/i });
  }

  get sipAmountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /SIP Amount|Monthly SIP/i });
  }

  get sipDateField(): Locator {
    return this.page.getByRole("spinbutton", { name: /SIP Date|Installment Date/i });
  }

  get startDateField(): Locator {
    return this.page.getByRole("textbox", { name: /Start Date|Investment Date/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.mfFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.mfFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Fund|Confirm.*Delete/i });
  }

  // Filter controls
  get categoryFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Filter.*Category/i });
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
    await this.addMutualFundButton.click();
    await this.mfFormDialog.waitFor({ state: "visible" });
  }

  async fillMutualFundForm(data: {
    fundName?: string;
    category?: string;
    investmentType?: "SIP" | "Lumpsum";
    units?: number;
    nav?: number;
    investedAmount?: number;
    sipAmount?: number;
  }) {
    if (data.fundName) {
      await this.fundNameField.clear();
      await this.fundNameField.fill(data.fundName);
    }

    if (data.category) {
      await this.fundCategorySelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.category }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.investmentType) {
      await this.investmentTypeSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.investmentType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.units !== undefined) {
      await this.unitsField.clear();
      await this.unitsField.fill(data.units.toString());
    }

    if (data.nav !== undefined) {
      await this.navField.clear();
      await this.navField.fill(data.nav.toString());
    }

    if (data.investedAmount !== undefined) {
      await this.investedAmountField.clear();
      await this.investedAmountField.fill(data.investedAmount.toString());
    }

    if (data.sipAmount !== undefined && await this.sipAmountField.isVisible()) {
      await this.sipAmountField.clear();
      await this.sipAmountField.fill(data.sipAmount.toString());
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

  async editFund(fundName: string) {
    await this.clickEditOnRow(fundName);
    await this.mfFormDialog.waitFor({ state: "visible" });
  }

  async deleteFund(fundName: string) {
    await this.clickDeleteOnRow(fundName);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDelete() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalValue(): Promise<string> {
    return await this.getSummaryCardValue("Total Value");
  }

  async getTotalInvested(): Promise<string> {
    return await this.getSummaryCardValue("Total Invested");
  }

  async getTotalSIP(): Promise<string> {
    return await this.getSummaryCardValue("Monthly SIP");
  }

  async getXIRR(): Promise<string> {
    return await this.getSummaryCardValue("XIRR");
  }

  async getFundCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    // Verify we're on the Mutual Funds page via URL
    await expect(this.page).toHaveURL(/\/investments\/mutual-funds$/);
  }

  async expectFormDialogVisible() {
    await expect(this.mfFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.mfFormDialog).not.toBeVisible();
  }

  async expectFundInTable(fundName: string) {
    await expect(this.getTableRowByText(fundName)).toBeVisible();
  }

  async expectFundNotInTable(fundName: string) {
    await expect(this.getTableRowByText(fundName)).not.toBeVisible();
  }
}
