import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import type { CapitalGainsTestData } from "../../fixtures/non-salary-income-data";

/**
 * Capital Gains Page Object
 * Handles STCG/LTCG from stocks, mutual funds, property
 */
export class CapitalGainsPage extends BasePage {
  readonly url = "/dashboard/non-salary-income/capital-gains";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Non-Salary Income/i });
  }

  get addTransactionButton(): Locator {
    return this.page.getByRole("button", { name: /Add Transaction|Add Capital Gain/i });
  }

  // Summary cards
  get totalSTCGCard(): Locator {
    return this.getSummaryCardByTitle("Short Term Gains");
  }

  get totalLTCGCard(): Locator {
    return this.getSummaryCardByTitle("Long Term Gains");
  }

  get totalTaxableGainsCard(): Locator {
    return this.getSummaryCardByTitle("Taxable Gains");
  }

  get transactionCountCard(): Locator {
    return this.getSummaryCardByTitle("Transactions");
  }

  // Capital gains form dialog
  get capitalGainsFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Capital Gain Transaction/i });
  }

  // Form fields
  get assetTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Asset Type/i });
  }

  get assetNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Asset Name|Security Name/i });
  }

  get purchaseDateField(): Locator {
    return this.page.getByRole("textbox", { name: /Purchase Date|Buy Date/i });
  }

  get saleDateField(): Locator {
    return this.page.getByRole("textbox", { name: /Sale Date|Sell Date/i });
  }

  get purchasePriceField(): Locator {
    // Use exact match to avoid matching "Improvement Cost"
    return this.page.getByLabel("Purchase Price");
  }

  get salePriceField(): Locator {
    return this.page.getByLabel("Sale Price");
  }

  get quantityField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Quantity|Units/i });
  }

  get expensesField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Expenses|Brokerage|STT/i });
  }

  get indexedCostCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /Apply Indexation|Indexed Cost/i });
  }

  get indexedCostField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Indexed Cost|CII Adjusted/i });
  }

  // Calculated fields (read-only)
  get holdingPeriodDisplay(): Locator {
    return this.capitalGainsFormDialog.locator("text=/Holding Period/i").locator("~ .text-body-1, ~ .v-chip");
  }

  get gainTypeDisplay(): Locator {
    return this.capitalGainsFormDialog.locator("text=/Gain Type|STCG|LTCG/i").locator("~ .text-body-1, ~ .v-chip");
  }

  get capitalGainDisplay(): Locator {
    return this.capitalGainsFormDialog.locator("text=/Capital Gain|Gain.*Loss/i").locator("~ .text-currency, ~ .v-chip");
  }

  get taxLiabilityDisplay(): Locator {
    return this.capitalGainsFormDialog.locator("text=/Tax.*Liability|Tax Amount/i").locator("~ .text-currency, ~ .v-chip");
  }

  // Form buttons
  get saveButton(): Locator {
    return this.capitalGainsFormDialog.getByRole("button", { name: /Add Transaction|Update Transaction/i });
  }

  get cancelButton(): Locator {
    return this.capitalGainsFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Transaction|Confirm.*Delete/i });
  }

  // Filter controls
  get assetTypeFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Filter.*Type|Asset Filter/i });
  }

  get gainTypeFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Gain Type|STCG.*LTCG/i });
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
    await this.addTransactionButton.click();
    await this.capitalGainsFormDialog.waitFor({ state: "visible" });
  }

  async fillCapitalGainsForm(data: Partial<CapitalGainsTestData>) {
    if (data.assetType) {
      await this.assetTypeSelect.click();
      await this.page.waitForTimeout(200);
      const typeLabel = this.getAssetTypeLabel(data.assetType);
      await this.page.getByRole("option", { name: typeLabel }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.assetName) {
      await this.assetNameField.clear();
      await this.assetNameField.fill(data.assetName);
    }

    if (data.purchaseDate) {
      await this.purchaseDateField.clear();
      await this.purchaseDateField.fill(data.purchaseDate);
    }

    if (data.saleDate) {
      await this.saleDateField.clear();
      await this.saleDateField.fill(data.saleDate);
    }

    if (data.purchasePrice !== undefined) {
      await this.purchasePriceField.clear();
      await this.purchasePriceField.fill(data.purchasePrice.toString());
    }

    if (data.salePrice !== undefined) {
      await this.salePriceField.clear();
      await this.salePriceField.fill(data.salePrice.toString());
    }

    if (data.quantity !== undefined) {
      await this.quantityField.clear();
      await this.quantityField.fill(data.quantity.toString());
    }

    if (data.expenses !== undefined) {
      await this.expensesField.clear();
      await this.expensesField.fill(data.expenses.toString());
    }

    // Wait for calculations
    await this.page.waitForTimeout(300);
  }

  async saveForm() {
    // Click save and wait for API response
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/capital-gains") &&
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

  async editTransaction(assetName: string) {
    await this.clickEditOnRow(assetName);
    await this.capitalGainsFormDialog.waitFor({ state: "visible" });
  }

  async deleteTransaction(assetName: string) {
    await this.clickDeleteOnRow(assetName);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDeleteTransaction() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Filter Actions
  // ============================================

  async filterByAssetType(type: string) {
    await this.assetTypeFilter.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: type }).click();
    await this.page.waitForTimeout(300);
  }

  async filterByGainType(type: "STCG" | "LTCG" | "All") {
    await this.gainTypeFilter.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: type }).click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalSTCG(): Promise<string> {
    return await this.getSummaryCardValue("Short Term Gains");
  }

  async getTotalLTCG(): Promise<string> {
    return await this.getSummaryCardValue("Long Term Gains");
  }

  async getTotalTaxableGains(): Promise<string> {
    return await this.getSummaryCardValue("Taxable Gains");
  }

  async getTransactionCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  async getCapitalGainFromForm(): Promise<string> {
    return (await this.capitalGainDisplay.textContent()) || "₹0";
  }

  async getGainTypeFromForm(): Promise<string> {
    return (await this.gainTypeDisplay.textContent()) || "";
  }

  // ============================================
  // Helpers
  // ============================================

  private getAssetTypeLabel(type: string): string {
    // Match the actual form options from CapitalGainsCalculator.vue
    const labels: Record<string, string> = {
      equity: "Equity/Stocks/Equity MF",
      listed_equity: "Equity/Stocks/Equity MF",
      equity_mf: "Equity/Stocks/Equity MF",
      debt_mf: "Debt Mutual Fund",
      property: "Property/Real Estate",
      gold: "Gold/Silver",
      crypto: "Cryptocurrency",
      unlisted_equity: "Equity/Stocks/Equity MF",
      other: "Other Assets",
    };
    return labels[type] || type;
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    // Wait for subtitle to be visible (rendered by SectionHeader)
    await expect(this.page.locator("p.text-body-2").filter({ hasText: "Capital Gains" })).toBeVisible();
    // Also check the Add button is ready
    await expect(this.addTransactionButton).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.capitalGainsFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.capitalGainsFormDialog).not.toBeVisible();
  }

  async expectTransactionInTable(assetName: string) {
    await expect(this.getTableRowByText(assetName)).toBeVisible();
  }

  async expectTransactionNotInTable(assetName: string) {
    await expect(this.getTableRowByText(assetName)).not.toBeVisible();
  }

  async expectGainType(expectedType: "STCG" | "LTCG") {
    await expect(this.gainTypeDisplay).toContainText(expectedType);
  }

  async expectCapitalGain(expectedAmount: string) {
    await expect(this.capitalGainDisplay).toContainText(expectedAmount);
  }
}
