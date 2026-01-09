import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expense Tracking Page Object
 */
export class ExpenseTrackingPage extends BasePage {
  readonly url = "/dashboard/expenses/track";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Expenses/i });
  }

  get addExpenseButton(): Locator {
    return this.page.getByRole("button", { name: /Add Expense|Add/i });
  }

  // Expense form dialog
  get expenseFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Expense|Edit Expense/i });
  }

  // Form fields
  get categorySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Category/i });
  }

  get subcategorySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Subcategory/i });
  }

  get descriptionField(): Locator {
    return this.page.getByRole("textbox", { name: /Description/i });
  }

  get amountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Amount/i });
  }

  get dateField(): Locator {
    return this.page.getByRole("textbox", { name: /Date/i });
  }

  get paymentMethodSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Payment Method/i });
  }

  get isRecurringCheckbox(): Locator {
    return this.page.getByRole("checkbox", { name: /Recurring/i });
  }

  get recurringFrequencySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Frequency/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.expenseFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  get cancelButton(): Locator {
    return this.expenseFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Expense|Confirm.*Delete/i });
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
    await this.addExpenseButton.click();
    await this.expenseFormDialog.waitFor({ state: "visible" });
  }

  async fillExpenseForm(data: {
    category?: string;
    subcategory?: string;
    description?: string;
    amount?: number;
    date?: string;
    paymentMethod?: string;
    isRecurring?: boolean;
    frequency?: string;
  }) {
    if (data.category) {
      await this.categorySelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.category }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.subcategory) {
      await this.subcategorySelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.subcategory }).click();
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

    if (data.date) {
      await this.dateField.clear();
      await this.dateField.fill(data.date);
    }

    if (data.paymentMethod) {
      await this.paymentMethodSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.paymentMethod }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.isRecurring !== undefined) {
      const isChecked = await this.isRecurringCheckbox.isChecked();
      if (isChecked !== data.isRecurring) {
        await this.isRecurringCheckbox.click();
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

  async editExpense(description: string) {
    await this.clickEditOnRow(description);
    await this.expenseFormDialog.waitFor({ state: "visible" });
  }

  async deleteExpense(description: string) {
    await this.clickDeleteOnRow(description);
    await this.deleteDialog.waitFor({ state: "visible" });
  }

  async confirmDelete() {
    await this.deleteDialog.getByRole("button", { name: /Delete|Confirm|Yes/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Expenses/i })).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.expenseFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.expenseFormDialog).not.toBeVisible();
  }

  async expectExpenseInTable(description: string) {
    await expect(this.getTableRowByText(description)).toBeVisible();
  }

  async expectExpenseNotInTable(description: string) {
    await expect(this.getTableRowByText(description)).not.toBeVisible();
  }
}
