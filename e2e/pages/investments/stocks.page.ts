import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Stocks Page Object
 * Handles direct equity/stock holdings
 */
export class StocksPage extends BasePage {
  readonly url = "/dashboard/investments/stocks";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  get addStockButton(): Locator {
    return this.page.getByRole("button", { name: /Add Stock|Add Holding/i });
  }

  // Summary cards
  get totalValueCard(): Locator {
    return this.getSummaryCardByTitle("Total Value");
  }

  get totalInvestedCard(): Locator {
    return this.getSummaryCardByTitle("Total Invested");
  }

  get dayChangeCard(): Locator {
    return this.getSummaryCardByTitle("Day Change");
  }

  get totalPnLCard(): Locator {
    return this.getSummaryCardByTitle("P&L");
  }

  // Stock form dialog
  get stockFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Stock|Edit Stock|Stock Details/i });
  }

  // Form fields
  get stockSymbolField(): Locator {
    return this.page.getByRole("textbox", { name: /Symbol|Ticker/i });
  }

  get stockNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Stock Name|Company/i });
  }

  get quantityField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Quantity|Shares/i });
  }

  get buyPriceField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Buy Price|Average Price/i });
  }

  get buyDateField(): Locator {
    return this.page.getByRole("textbox", { name: /Buy Date|Purchase Date/i });
  }

  get currentPriceField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Current Price|CMP/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.stockFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.stockFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Stock|Confirm.*Delete/i });
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
    await this.addStockButton.click();
    await this.stockFormDialog.waitFor({ state: "visible" });
  }

  async fillStockForm(data: {
    symbol?: string;
    name?: string;
    quantity?: number;
    buyPrice?: number;
    buyDate?: string;
  }) {
    if (data.symbol) {
      await this.stockSymbolField.clear();
      await this.stockSymbolField.fill(data.symbol);
    }

    if (data.name) {
      await this.stockNameField.clear();
      await this.stockNameField.fill(data.name);
    }

    if (data.quantity !== undefined) {
      await this.quantityField.clear();
      await this.quantityField.fill(data.quantity.toString());
    }

    if (data.buyPrice !== undefined) {
      await this.buyPriceField.clear();
      await this.buyPriceField.fill(data.buyPrice.toString());
    }

    if (data.buyDate) {
      await this.buyDateField.clear();
      await this.buyDateField.fill(data.buyDate);
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

  async editStock(stockName: string) {
    await this.clickEditOnRow(stockName);
    await this.stockFormDialog.waitFor({ state: "visible" });
  }

  async deleteStock(stockName: string) {
    await this.clickDeleteOnRow(stockName);
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

  async getDayChange(): Promise<string> {
    return await this.getSummaryCardValue("Day Change");
  }

  async getStockCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Stocks|Equity/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.stockFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.stockFormDialog).not.toBeVisible();
  }

  async expectStockInTable(stockName: string) {
    await expect(this.getTableRowByText(stockName)).toBeVisible();
  }

  async expectStockNotInTable(stockName: string) {
    await expect(this.getTableRowByText(stockName)).not.toBeVisible();
  }
}
