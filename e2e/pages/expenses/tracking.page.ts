import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Expense Tracking Page Object
 * This page has two tabs: Overview and Expense Details
 */
export class ExpenseTrackingPage extends BasePage {
  readonly url = "/expenses/track";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Track Expenses|Expenses/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: /Overview/i });
  }

  get expenseDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Expense Details/i });
  }

  // Month Navigation
  get monthSelector(): Locator {
    return this.page.locator(".v-text-field").filter({ has: this.page.locator("input[type='month']") });
  }

  get monthInput(): Locator {
    return this.page.locator("input[type='month']");
  }

  // Categories Dialog (opened via gear icon)
  get categoriesDialogButton(): Locator {
    return this.page.getByRole("button", { name: /Categories|Rules|Settings/i });
  }

  get categoriesDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Categories|Rules/i });
  }

  // ============================================
  // Overview Tab Locators
  // ============================================

  // Summary Cards in Overview
  get totalSpentCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Spent/i });
  }

  get transactionCountCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Transactions/i });
  }

  get avgTransactionCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Avg Transaction/i });
  }

  get budgetUsedCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Budget Used/i });
  }

  // Charts
  get categoryChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Category Breakdown|by Category/i }).locator("canvas");
  }

  get trendChart(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Trend|Monthly/i }).locator("canvas");
  }

  // Export Section
  get exportSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Export/i });
  }

  get exportPDFButton(): Locator {
    return this.page.getByRole("button", { name: /PDF/i });
  }

  get exportExcelButton(): Locator {
    return this.page.getByRole("button", { name: /Excel/i });
  }

  get exportCSVButton(): Locator {
    return this.page.getByRole("button", { name: /CSV/i });
  }

  get exportJSONButton(): Locator {
    return this.page.getByRole("button", { name: /JSON/i });
  }

  // Recent Expenses List in Overview
  get recentExpensesList(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Recent Expenses/i });
  }

  // ============================================
  // Expense Details Tab Locators
  // ============================================

  get addExpenseButton(): Locator {
    return this.page.getByRole("button", { name: /Add Expense/i });
  }

  get scanReceiptButton(): Locator {
    return this.page.getByRole("button", { name: /Scan Receipt|Receipt/i });
  }

  get importCSVButton(): Locator {
    return this.page.getByRole("button", { name: /Import CSV|Import/i });
  }

  // Search & Filters
  get searchField(): Locator {
    return this.page.getByRole("textbox", { name: /Search/i });
  }

  get categoryFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Category/i }).first();
  }

  // Receipt Uploader Dialog
  get receiptUploaderDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Scan Receipt|Upload Receipt/i });
  }

  get receiptFileInput(): Locator {
    return this.page.locator("input[type='file']");
  }

  get extractDataButton(): Locator {
    return this.page.getByRole("button", { name: /Extract Data|Process/i });
  }

  get useExtractedDataButton(): Locator {
    return this.page.getByRole("button", { name: /Use This Data|Apply/i });
  }

  // Expense form dialog
  get expenseFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Expense|Edit Expense/i });
  }

  // Form fields
  get categorySelect(): Locator {
    return this.expenseFormDialog.locator(".v-select").filter({ hasText: /Category/i });
  }

  get subcategorySelect(): Locator {
    return this.expenseFormDialog.locator(".v-select").filter({ hasText: /Subcategory/i });
  }

  get descriptionField(): Locator {
    return this.expenseFormDialog.getByRole("textbox", { name: /Description/i });
  }

  get amountField(): Locator {
    return this.expenseFormDialog.getByRole("spinbutton", { name: /Amount/i });
  }

  get dateField(): Locator {
    return this.expenseFormDialog.locator("input[type='date']");
  }

  get paymentMethodSelect(): Locator {
    return this.expenseFormDialog.locator(".v-select").filter({ hasText: /Payment Method/i });
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

  async switchToOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  async switchToExpenseDetailsTab() {
    await this.expenseDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  async setMonth(month: string) {
    await this.monthInput.fill(month); // Format: YYYY-MM
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Categories Dialog Actions
  // ============================================

  async openCategoriesDialog() {
    await this.categoriesDialogButton.click();
    await this.categoriesDialog.waitFor({ state: "visible" });
  }

  async closeCategoriesDialog() {
    const closeBtn = this.categoriesDialog.getByRole("button", { name: /Close|Cancel/i });
    await closeBtn.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Form Actions
  // ============================================

  async openAddForm() {
    await this.switchToExpenseDetailsTab();
    await this.addExpenseButton.click();
    await this.expenseFormDialog.waitFor({ state: "visible" });
  }

  async openReceiptScanner() {
    await this.switchToExpenseDetailsTab();
    await this.scanReceiptButton.click();
    await this.receiptUploaderDialog.waitFor({ state: "visible" });
  }

  async closeReceiptScanner() {
    const closeBtn = this.receiptUploaderDialog.getByRole("button", { name: /Cancel|Close/i });
    await closeBtn.click();
    await this.page.waitForTimeout(300);
  }

  async fillExpenseForm(data: {
    category?: string;
    subcategory?: string;
    description?: string;
    amount?: number;
    date?: string;
    paymentMethod?: string;
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
      await this.dateField.fill(data.date);
    }

    if (data.paymentMethod) {
      await this.paymentMethodSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.paymentMethod }).click();
      await this.page.waitForTimeout(200);
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
  // Export Actions
  // ============================================

  async exportToPDF() {
    await this.switchToOverviewTab();
    await this.exportPDFButton.click();
    await this.page.waitForTimeout(500);
  }

  async exportToExcel() {
    await this.switchToOverviewTab();
    await this.exportExcelButton.click();
    await this.page.waitForTimeout(500);
  }

  async exportToCSV() {
    await this.switchToOverviewTab();
    await this.exportCSVButton.click();
    await this.page.waitForTimeout(500);
  }

  async exportToJSON() {
    await this.switchToOverviewTab();
    await this.exportJSONButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Table Actions
  // ============================================

  async editExpense(description: string) {
    await this.switchToExpenseDetailsTab();
    await this.clickEditOnRow(description);
    await this.expenseFormDialog.waitFor({ state: "visible" });
  }

  async deleteExpense(description: string) {
    await this.switchToExpenseDetailsTab();
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
    await expect(this.pageTitle).toBeVisible();
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectExpenseDetailsTabActive() {
    await expect(this.expenseDetailsTab).toHaveAttribute("aria-selected", "true");
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

  async expectReceiptDialogVisible() {
    await expect(this.receiptUploaderDialog).toBeVisible();
  }

  async expectReceiptDialogClosed() {
    await expect(this.receiptUploaderDialog).not.toBeVisible();
  }

  async expectCategoriesDialogVisible() {
    await expect(this.categoriesDialog).toBeVisible();
  }

  async expectCategoriesDialogClosed() {
    await expect(this.categoriesDialog).not.toBeVisible();
  }

  async expectChartsVisible() {
    await this.switchToOverviewTab();
    await expect(this.categoryChart).toBeVisible();
  }

  async expectExportButtonsVisible() {
    await this.switchToOverviewTab();
    await expect(this.exportPDFButton).toBeVisible();
    await expect(this.exportExcelButton).toBeVisible();
    await expect(this.exportCSVButton).toBeVisible();
  }

  async expectScanReceiptButtonVisible() {
    await this.switchToExpenseDetailsTab();
    await expect(this.scanReceiptButton).toBeVisible();
  }

  async expectImportCSVButtonVisible() {
    await this.switchToExpenseDetailsTab();
    await expect(this.importCSVButton).toBeVisible();
  }
}
