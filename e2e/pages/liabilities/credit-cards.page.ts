import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Credit Cards Page Object
 * Handles credit card management and tracking
 */
export class CreditCardsPage extends BasePage {
  readonly url = "/liabilities/credit-cards";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Credit Cards/i });
  }

  // Internal tabs (Overview / Card Details)
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get detailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Card Details" });
  }

  get addCardButton(): Locator {
    // Use first() to get the toolbar button (not the empty state button)
    return this.page.getByRole("button", { name: /Add Card|Add Credit Card/i }).first();
  }

  // Summary cards
  get totalOutstandingCard(): Locator {
    return this.getSummaryCardByTitle("Total Outstanding");
  }

  get totalLimitCard(): Locator {
    return this.getSummaryCardByTitle("Total Credit Limit");
  }

  get avgUtilizationCard(): Locator {
    // Updated to match new Overview tab which has "Credit Utilization Score" card
    return this.getSummaryCardByTitle("Utilization");
  }

  get creditUtilizationGauge(): Locator {
    return this.getSummaryCardByTitle("Credit Utilization Score");
  }

  get totalMinDueCard(): Locator {
    return this.getSummaryCardByTitle("Minimum Due");
  }

  // Card form dialog
  get cardFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Card|Edit.*Card|Credit Card/i });
  }

  // Form fields
  get cardNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Card Name/i });
  }

  get bankNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Bank Name|Issuer/i });
  }

  get cardNumberField(): Locator {
    return this.page.getByRole("textbox", { name: /Card Number|Last 4/i });
  }

  get creditLimitField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Credit Limit|Limit/i });
  }

  get outstandingField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Outstanding|Balance/i });
  }

  get minimumDueField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Minimum Due/i });
  }

  get dueDateField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Due Date/i });
  }

  get interestRateField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Interest Rate|APR/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.cardFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.cardFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Card|Confirm.*Delete/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the Overview tab (shows summary metrics, utilization gauge, upcoming payments)
   */
  async goToOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to the Card Details tab (shows credit card cards, CRUD operations)
   */
  async goToDetailsTab() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Form Actions
  // ============================================

  async openAddForm() {
    // Navigate to Details tab first (Add button is only on Details tab)
    await this.goToDetailsTab();
    await this.addCardButton.click();
    await this.cardFormDialog.waitFor({ state: "visible" });
  }

  async fillCardForm(data: {
    cardName?: string;
    bankName?: string;
    cardNumber?: string;
    creditLimit?: number;
    outstanding?: number;
    minimumDue?: number;
    dueDate?: number;
    interestRate?: number;
  }) {
    if (data.cardName) {
      await this.cardNameField.clear();
      await this.cardNameField.fill(data.cardName);
    }

    if (data.bankName) {
      await this.bankNameField.clear();
      await this.bankNameField.fill(data.bankName);
    }

    if (data.cardNumber) {
      await this.cardNumberField.clear();
      await this.cardNumberField.fill(data.cardNumber);
    }

    if (data.creditLimit !== undefined) {
      await this.creditLimitField.clear();
      await this.creditLimitField.fill(data.creditLimit.toString());
    }

    if (data.outstanding !== undefined) {
      await this.outstandingField.clear();
      await this.outstandingField.fill(data.outstanding.toString());
    }

    if (data.minimumDue !== undefined) {
      await this.minimumDueField.clear();
      await this.minimumDueField.fill(data.minimumDue.toString());
    }

    if (data.dueDate !== undefined) {
      await this.dueDateField.clear();
      await this.dueDateField.fill(data.dueDate.toString());
    }

    if (data.interestRate !== undefined) {
      await this.interestRateField.clear();
      await this.interestRateField.fill(data.interestRate.toString());
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

  async editCard(cardName: string) {
    await this.clickEditOnRow(cardName);
    await this.cardFormDialog.waitFor({ state: "visible" });
  }

  async deleteCard(cardName: string) {
    await this.clickDeleteOnRow(cardName);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDelete() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalOutstanding(): Promise<string> {
    return await this.getSummaryCardValue("Total Outstanding");
  }

  async getTotalLimit(): Promise<string> {
    return await this.getSummaryCardValue("Total Limit");
  }

  async getUtilization(): Promise<string> {
    return await this.getSummaryCardValue("Utilization");
  }

  async getCardCount(): Promise<number> {
    return await this.getTableRowCount();
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
    // Internal tabs should be visible
    await expect(this.overviewTab).toBeVisible();
    await expect(this.detailsTab).toBeVisible();
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectDetailsTabActive() {
    await expect(this.detailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.cardFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.cardFormDialog).not.toBeVisible();
  }

  async expectCardInTable(cardName: string) {
    await expect(this.getTableRowByText(cardName)).toBeVisible();
  }

  async expectCardNotInTable(cardName: string) {
    await expect(this.getTableRowByText(cardName)).not.toBeVisible();
  }
}
