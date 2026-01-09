import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import type { RentalIncomeTestData } from "../../fixtures/non-salary-income-data";

/**
 * Rental Income Page Object
 * Handles house property rental income
 */
export class RentalIncomePage extends BasePage {
  readonly url = "/dashboard/non-salary-income/rental";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Non-Salary Income/i });
  }

  get addPropertyButton(): Locator {
    return this.page.getByRole("button", { name: /Add Property|Add Rental/i });
  }

  // Summary cards
  get totalAnnualRentCard(): Locator {
    return this.getSummaryCardByTitle("Total Annual Rent");
  }

  get totalNetAnnualValueCard(): Locator {
    return this.getSummaryCardByTitle("Net Annual Value");
  }

  get propertyCountCard(): Locator {
    return this.getSummaryCardByTitle("Properties");
  }

  // Rental form dialog
  get rentalFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Rental.*Income|Add Property|Edit Property|House Property/i });
  }

  // Form fields
  get propertyNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Property Name/i });
  }

  get propertyTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Property Type/i });
  }

  get propertyAddressField(): Locator {
    return this.page.getByRole("textbox", { name: /Address/i });
  }

  get monthlyRentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Monthly Rent/i });
  }

  get annualRentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Annual Rent/i });
  }

  get vacantMonthsField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Vacant Months/i });
  }

  get municipalTaxField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Municipal Tax|Property Tax/i });
  }

  get housingLoanInterestField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Housing Loan Interest|Loan Interest|Section 24/i });
  }

  get isLetOutCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /Let Out|Rented/i });
  }

  // Calculated fields
  get grossAnnualValueDisplay(): Locator {
    return this.rentalFormDialog.locator("text=/Gross Annual Value|GAV/i").locator("~ .text-currency, ~ .v-chip");
  }

  get netAnnualValueDisplay(): Locator {
    return this.rentalFormDialog.locator("text=/Net Annual Value|NAV/i").locator("~ .text-currency, ~ .v-chip");
  }

  get standardDeductionDisplay(): Locator {
    return this.rentalFormDialog.locator("text=/Standard Deduction|30%/i").locator("~ .text-currency, ~ .v-chip");
  }

  // Form buttons
  get saveButton(): Locator {
    return this.rentalFormDialog.getByRole("button", { name: /Save|Add|Submit/i });
  }

  get cancelButton(): Locator {
    return this.rentalFormDialog.getByRole("button", { name: /Cancel/i });
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
    await this.rentalFormDialog.waitFor({ state: "visible" });
  }

  async fillRentalForm(data: Partial<RentalIncomeTestData>) {
    if (data.propertyName) {
      await this.propertyNameField.clear();
      await this.propertyNameField.fill(data.propertyName);
    }

    if (data.propertyType) {
      await this.propertyTypeSelect.click();
      await this.page.waitForTimeout(200);
      const typeLabel = data.propertyType === "residential" ? "Residential" : "Commercial";
      await this.page.getByRole("option", { name: typeLabel }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.propertyAddress) {
      await this.propertyAddressField.clear();
      await this.propertyAddressField.fill(data.propertyAddress);
    }

    if (data.monthlyRent !== undefined) {
      await this.monthlyRentField.clear();
      await this.monthlyRentField.fill(data.monthlyRent.toString());
      // Wait for annual rent to auto-calculate
      await this.page.waitForTimeout(300);
    }

    if (data.vacantMonths !== undefined) {
      await this.vacantMonthsField.clear();
      await this.vacantMonthsField.fill(data.vacantMonths.toString());
    }

    if (data.municipalTaxesPaid !== undefined) {
      await this.municipalTaxField.clear();
      await this.municipalTaxField.fill(data.municipalTaxesPaid.toString());
    }

    if (data.housingLoanInterest !== undefined) {
      await this.housingLoanInterestField.clear();
      await this.housingLoanInterestField.fill(data.housingLoanInterest.toString());
    }

    if (data.isLetOut !== undefined) {
      const isChecked = await this.isLetOutCheckbox.isChecked();
      if (isChecked !== data.isLetOut) {
        await this.isLetOutCheckbox.click();
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
    await this.rentalFormDialog.waitFor({ state: "visible" });
  }

  async deleteProperty(propertyName: string) {
    await this.clickDeleteOnRow(propertyName);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDeleteProperty() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalAnnualRent(): Promise<string> {
    return await this.getSummaryCardValue("Total Annual Rent");
  }

  async getNetAnnualValue(): Promise<string> {
    return await this.getSummaryCardValue("Net Annual Value");
  }

  async getPropertyCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  async getGrossAnnualValueFromForm(): Promise<string> {
    return (await this.grossAnnualValueDisplay.textContent()) || "₹0";
  }

  async getNetAnnualValueFromForm(): Promise<string> {
    return (await this.netAnnualValueDisplay.textContent()) || "₹0";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "Rental" })).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.rentalFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.rentalFormDialog).not.toBeVisible();
  }

  async expectPropertyInTable(propertyName: string) {
    await expect(this.getTableRowByText(propertyName)).toBeVisible();
  }

  async expectPropertyNotInTable(propertyName: string) {
    await expect(this.getTableRowByText(propertyName)).not.toBeVisible();
  }

  async expectNetAnnualValue(expectedAmount: string) {
    await expect(this.netAnnualValueDisplay).toContainText(expectedAmount);
  }
}
