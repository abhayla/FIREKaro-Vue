import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";
import type { RentalIncomeTestData } from "../../fixtures/income-data";

/**
 * Rental Income Page Object
 * Handles house property rental income
 */
export class RentalIncomePage extends BasePage {
  readonly url = "/income/rental";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Income/i });
  }

  get addPropertyButton(): Locator {
    return this.page.getByRole("button", { name: /Add Property|Add Rental/i }).first();
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
    return this.page.locator(".v-dialog").filter({ hasText: /Rental Income/i });
  }

  // Form fields
  get propertyNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Property Name/i });
  }

  get propertyTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Property Type/i });
  }

  get propertyAddressField(): Locator {
    // Property Address uses v-textarea
    return this.page.getByLabel(/Property Address/i);
  }

  get monthlyRentField(): Locator {
    return this.page.getByLabel(/Monthly Rent/i);
  }

  get annualRentField(): Locator {
    return this.page.getByLabel(/Annual Rent/i);
  }

  get vacancyMonthsSelect(): Locator {
    // Vacancy Months is a v-select, not a spinbutton
    return this.page.locator(".v-select").filter({ hasText: /Vacancy Months/i });
  }

  get municipalTaxField(): Locator {
    return this.page.getByLabel(/Municipal Tax|Property Tax/i);
  }

  get housingLoanInterestField(): Locator {
    return this.page.getByLabel(/Housing Loan Interest|Loan Interest|Section 24/i);
  }

  get isLetOutSwitch(): Locator {
    // isLetOut is a v-switch, not checkbox
    return this.page.locator(".v-switch").filter({ hasText: /let out|rented/i });
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
    return this.rentalFormDialog.getByRole("button", { name: /Add Property|Update Property/i });
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
      // Vacancy months is a v-select dropdown
      await this.vacancyMonthsSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.vacantMonths.toString(), exact: true }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.municipalTaxesPaid !== undefined) {
      await this.municipalTaxField.clear();
      await this.municipalTaxField.fill(data.municipalTaxesPaid.toString());
    }

    if (data.housingLoanInterest !== undefined) {
      await this.housingLoanInterestField.clear();
      await this.housingLoanInterestField.fill(data.housingLoanInterest.toString());
    }

    // isLetOut is a switch - default is "let out" (true)
    // Only toggle if explicitly set to false
    if (data.isLetOut === false) {
      const switchEl = this.isLetOutSwitch;
      if (await switchEl.isVisible()) {
        await switchEl.click();
      }
    }
  }

  async saveForm() {
    // Click save and wait for API response
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/rental-income") &&
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

  async cancelDeleteProperty() {
    await this.deleteDialog.getByRole("button", { name: /Cancel|No/i }).click();
    await this.page.waitForTimeout(300);
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
    // Wait for subtitle to be visible (rendered by SectionHeader)
    await expect(this.page.locator("p.text-body-2").filter({ hasText: "Rental" })).toBeVisible();
    // Check the page has loaded by looking for the tab structure (Overview tab is default)
    await expect(this.page.getByRole("tab", { name: "Overview" })).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.rentalFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.rentalFormDialog).not.toBeVisible();
  }

  async expectPropertyInTable(propertyName: string) {
    // Use .first() to handle cases where multiple rows match
    await expect(this.getTableRowByText(propertyName).first()).toBeVisible();
  }

  async expectPropertyNotInTable(propertyName: string) {
    await expect(this.getTableRowByText(propertyName).first()).not.toBeVisible();
  }

  async expectNetAnnualValue(expectedAmount: string) {
    await expect(this.netAnnualValueDisplay).toContainText(expectedAmount);
  }

  async expectDeleteDialogVisible() {
    await expect(this.deleteDialog).toBeVisible();
  }
}
