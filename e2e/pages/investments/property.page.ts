import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Property Investments Page Object
 * Handles real estate investments
 */
export class PropertyPage extends BasePage {
  readonly url = "/investments/property";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  get addPropertyButton(): Locator {
    return this.page.getByRole("button", { name: /Add Property|Add Real Estate/i });
  }

  // Summary cards
  get totalValueCard(): Locator {
    return this.getSummaryCardByTitle("Total Value");
  }

  get totalInvestedCard(): Locator {
    return this.getSummaryCardByTitle("Total Invested");
  }

  get appreciationCard(): Locator {
    return this.getSummaryCardByTitle("Appreciation");
  }

  get propertyCountCard(): Locator {
    return this.getSummaryCardByTitle("Properties");
  }

  // Property form dialog
  get propertyFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Property|Edit Property|Property Details/i });
  }

  // Form fields
  get propertyNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Property Name/i });
  }

  get propertyTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Property Type/i });
  }

  get addressField(): Locator {
    return this.page.getByRole("textbox", { name: /Address|Location/i });
  }

  get purchasePriceField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Purchase Price|Cost/i });
  }

  get currentValueField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Current Value|Market Value/i });
  }

  get purchaseDateField(): Locator {
    return this.page.getByRole("textbox", { name: /Purchase Date/i });
  }

  get areaField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Area|Sq.*Ft/i });
  }

  get linkedLoanSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Linked Loan|Home Loan/i });
  }

  get isRentedCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /Rented|Let Out/i });
  }

  get monthlyRentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Monthly Rent/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.propertyFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.propertyFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Property|Confirm.*Delete/i });
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
    await this.addPropertyButton.click();
    await this.propertyFormDialog.waitFor({ state: "visible" });
  }

  async fillPropertyForm(data: {
    propertyName?: string;
    propertyType?: string;
    address?: string;
    purchasePrice?: number;
    currentValue?: number;
    purchaseDate?: string;
    area?: number;
    isRented?: boolean;
    monthlyRent?: number;
  }) {
    if (data.propertyName) {
      await this.propertyNameField.clear();
      await this.propertyNameField.fill(data.propertyName);
    }

    if (data.propertyType) {
      await this.propertyTypeSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.propertyType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.address) {
      await this.addressField.clear();
      await this.addressField.fill(data.address);
    }

    if (data.purchasePrice !== undefined) {
      await this.purchasePriceField.clear();
      await this.purchasePriceField.fill(data.purchasePrice.toString());
    }

    if (data.currentValue !== undefined) {
      await this.currentValueField.clear();
      await this.currentValueField.fill(data.currentValue.toString());
    }

    if (data.purchaseDate) {
      await this.purchaseDateField.clear();
      await this.purchaseDateField.fill(data.purchaseDate);
    }

    if (data.area !== undefined) {
      await this.areaField.clear();
      await this.areaField.fill(data.area.toString());
    }

    if (data.isRented !== undefined) {
      const isChecked = await this.isRentedCheckbox.isChecked();
      if (isChecked !== data.isRented) {
        await this.isRentedCheckbox.click();
      }

      if (data.isRented && data.monthlyRent !== undefined) {
        await this.monthlyRentField.clear();
        await this.monthlyRentField.fill(data.monthlyRent.toString());
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

  async editProperty(propertyName: string) {
    await this.clickEditOnRow(propertyName);
    await this.propertyFormDialog.waitFor({ state: "visible" });
  }

  async deleteProperty(propertyName: string) {
    await this.clickDeleteOnRow(propertyName);
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

  async getAppreciation(): Promise<string> {
    return await this.getSummaryCardValue("Appreciation");
  }

  async getPropertyCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /Property|Real Estate/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.propertyFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.propertyFormDialog).not.toBeVisible();
  }

  async expectPropertyInTable(propertyName: string) {
    await expect(this.getTableRowByText(propertyName)).toBeVisible();
  }

  async expectPropertyNotInTable(propertyName: string) {
    await expect(this.getTableRowByText(propertyName)).not.toBeVisible();
  }
}
