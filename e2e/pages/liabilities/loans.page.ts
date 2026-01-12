import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Loans Page Object
 * Handles home, car, personal, and other loans
 */
export class LoansPage extends BasePage {
  readonly url = "/liabilities/loans";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Loans/i });
  }

  // Internal tabs (Overview / Loan Details)
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get detailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Loan Details" });
  }

  get addLoanButton(): Locator {
    // Use first() to get the toolbar button (not the empty state button)
    return this.page.getByRole("button", { name: /Add Loan/i }).first();
  }

  // Summary cards
  get totalOutstandingCard(): Locator {
    return this.getSummaryCardByTitle("Total Outstanding");
  }

  get totalEMICard(): Locator {
    return this.getSummaryCardByTitle("Monthly EMI");
  }

  get loansCountCard(): Locator {
    return this.getSummaryCardByTitle("Active Loans");
  }

  // Loan form dialog
  get loanFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Loan|Edit Loan|Loan Details/i });
  }

  // Form fields
  get loanTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Loan Type/i });
  }

  get lenderNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Lender|Bank Name/i });
  }

  get accountNumberField(): Locator {
    return this.page.getByRole("textbox", { name: /Account Number|Loan Account/i });
  }

  get principalAmountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Principal|Loan Amount/i });
  }

  get outstandingField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Outstanding|Balance/i });
  }

  get interestRateField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Interest Rate/i });
  }

  get tenureField(): Locator {
    // Use "Total Tenure" specifically to avoid matching "Remaining Tenure" as well
    return this.page.getByRole("spinbutton", { name: /Total Tenure/i });
  }

  get emiAmountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /EMI Amount/i });
  }

  get emiDateField(): Locator {
    return this.page.getByRole("spinbutton", { name: /EMI Date/i });
  }

  get startDateField(): Locator {
    return this.page.getByRole("textbox", { name: /Start Date|Disbursement/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.loanFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.loanFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Loan|Confirm.*Delete/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  /**
   * Navigate to the Overview tab (shows summary metrics, distribution, upcoming EMIs)
   */
  async goToOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate to the Loan Details tab (shows loan cards, CRUD operations)
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
    await this.addLoanButton.click();
    await this.loanFormDialog.waitFor({ state: "visible" });
  }

  async fillLoanForm(data: {
    loanType?: string;
    lenderName?: string;
    accountNumber?: string;
    principalAmount?: number;
    outstanding?: number;
    interestRate?: number;
    tenure?: number;
    emiAmount?: number;
    emiDate?: number;
    startDate?: string;
  }) {
    if (data.loanType) {
      await this.loanTypeSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.loanType }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.lenderName) {
      await this.lenderNameField.clear();
      await this.lenderNameField.fill(data.lenderName);
    }

    if (data.accountNumber) {
      await this.accountNumberField.clear();
      await this.accountNumberField.fill(data.accountNumber);
    }

    if (data.principalAmount !== undefined) {
      await this.principalAmountField.clear();
      await this.principalAmountField.fill(data.principalAmount.toString());
    }

    if (data.outstanding !== undefined) {
      await this.outstandingField.clear();
      await this.outstandingField.fill(data.outstanding.toString());
    }

    if (data.interestRate !== undefined) {
      await this.interestRateField.clear();
      await this.interestRateField.fill(data.interestRate.toString());
    }

    if (data.tenure !== undefined) {
      await this.tenureField.clear();
      await this.tenureField.fill(data.tenure.toString());
    }

    if (data.emiAmount !== undefined) {
      await this.emiAmountField.clear();
      await this.emiAmountField.fill(data.emiAmount.toString());
    }

    if (data.emiDate !== undefined) {
      await this.emiDateField.clear();
      await this.emiDateField.fill(data.emiDate.toString());
    }

    if (data.startDate) {
      await this.startDateField.clear();
      await this.startDateField.fill(data.startDate);
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

  async editLoan(lenderName: string) {
    await this.clickEditOnRow(lenderName);
    await this.loanFormDialog.waitFor({ state: "visible" });
  }

  async deleteLoan(lenderName: string) {
    await this.clickDeleteOnRow(lenderName);
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

  async getTotalEMI(): Promise<string> {
    return await this.getSummaryCardValue("Monthly EMI");
  }

  async getLoanCount(): Promise<number> {
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
    await expect(this.loanFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.loanFormDialog).not.toBeVisible();
  }

  async expectLoanInTable(lenderName: string) {
    await expect(this.getTableRowByText(lenderName)).toBeVisible();
  }

  async expectLoanNotInTable(lenderName: string) {
    await expect(this.getTableRowByText(lenderName)).not.toBeVisible();
  }
}
