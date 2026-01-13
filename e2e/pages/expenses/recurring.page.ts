import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Recurring Expenses Page Object
 * This page has two tabs: Overview and Recurring Details
 */
export class RecurringExpensesPage extends BasePage {
  readonly url = "/expenses/recurring";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Recurring Expenses|Recurring/i });
  }

  // Tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: /Overview/i });
  }

  get recurringDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Recurring Details/i });
  }

  // ============================================
  // Overview Tab Locators
  // ============================================

  // Summary Cards
  get activeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Active/i }).first();
  }

  get pausedCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Paused/i }).first();
  }

  get monthlyTotalCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly Total/i });
  }

  get upcomingCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Upcoming/i }).first();
  }

  // Due This Week Section
  get dueThisWeekSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Due This Week/i });
  }

  get dueThisWeekList(): Locator {
    return this.dueThisWeekSection.locator(".v-list");
  }

  // By Frequency Section
  get byFrequencySection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /By Frequency/i });
  }

  // Active/Paused Lists
  get activeRecurringSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Active Recurring/i });
  }

  get pausedRecurringSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Paused/i }).last();
  }

  // ============================================
  // Recurring Details Tab Locators
  // ============================================

  get addRecurringButton(): Locator {
    return this.page.getByRole("button", { name: /Add Recurring Expense|Add Recurring/i });
  }

  // Filters
  get searchField(): Locator {
    return this.page.getByRole("textbox", { name: /Search/i });
  }

  get statusFilter(): Locator {
    return this.page.locator(".v-btn-toggle").first();
  }

  get allStatusButton(): Locator {
    return this.page.getByRole("button", { name: /^All$/i });
  }

  get activeStatusButton(): Locator {
    return this.page.getByRole("button", { name: /Active/i });
  }

  get pausedStatusButton(): Locator {
    return this.page.getByRole("button", { name: /Paused/i });
  }

  get frequencyFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Frequency/i });
  }

  // Recurring items list
  get recurringList(): Locator {
    return this.page.locator(".v-list").first();
  }

  getRecurringItem(description: string): Locator {
    return this.page.locator(".v-list-item").filter({ hasText: description });
  }

  // Recurring form dialog
  get recurringFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Recurring Expense|Edit Recurring Expense/i });
  }

  // Form fields
  get descriptionField(): Locator {
    return this.recurringFormDialog.getByRole("textbox", { name: /Description/i });
  }

  get amountField(): Locator {
    return this.recurringFormDialog.getByRole("spinbutton", { name: /Amount/i });
  }

  get categorySelect(): Locator {
    return this.recurringFormDialog.locator(".v-select").filter({ hasText: /Category/i });
  }

  get subcategoryField(): Locator {
    return this.recurringFormDialog.getByRole("textbox", { name: /Subcategory/i });
  }

  get merchantField(): Locator {
    return this.recurringFormDialog.getByRole("textbox", { name: /Merchant/i });
  }

  // Frequency selection
  get frequencyToggle(): Locator {
    return this.recurringFormDialog.locator(".v-btn-toggle");
  }

  get weeklyButton(): Locator {
    return this.recurringFormDialog.getByRole("button", { name: /Weekly/i });
  }

  get monthlyButton(): Locator {
    return this.recurringFormDialog.getByRole("button", { name: /Monthly/i });
  }

  get quarterlyButton(): Locator {
    return this.recurringFormDialog.getByRole("button", { name: /Quarterly/i });
  }

  get yearlyButton(): Locator {
    return this.recurringFormDialog.getByRole("button", { name: /Yearly/i });
  }

  // Start/End settings
  get startDateField(): Locator {
    return this.recurringFormDialog.locator("input[type='date']").first();
  }

  get endConditionSelect(): Locator {
    return this.recurringFormDialog.locator(".v-select").filter({ hasText: /End Condition/i });
  }

  get endAfterCountField(): Locator {
    return this.recurringFormDialog.getByRole("spinbutton", { name: /Number of Occurrences/i });
  }

  get endDateField(): Locator {
    return this.recurringFormDialog.locator("input[type='date']").last();
  }

  // Additional fields
  get paymentMethodSelect(): Locator {
    return this.recurringFormDialog.locator(".v-select").filter({ hasText: /Payment Method/i });
  }

  get notesField(): Locator {
    return this.recurringFormDialog.getByRole("textbox", { name: /Notes/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.recurringFormDialog.getByRole("button", { name: /Create|Update|Save/i });
  }

  get cancelButton(): Locator {
    return this.recurringFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Delete confirmation dialog
  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete Recurring Expense/i });
  }

  get deleteGeneratedCheckbox(): Locator {
    return this.deleteDialog.locator(".v-checkbox, input[type='checkbox']");
  }

  get confirmDeleteButton(): Locator {
    return this.deleteDialog.getByRole("button", { name: /Delete/i });
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

  async switchToRecurringDetailsTab() {
    await this.recurringDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Filter Actions
  // ============================================

  async filterByActive() {
    await this.switchToRecurringDetailsTab();
    await this.activeStatusButton.click();
    await this.page.waitForTimeout(300);
  }

  async filterByPaused() {
    await this.switchToRecurringDetailsTab();
    await this.pausedStatusButton.click();
    await this.page.waitForTimeout(300);
  }

  async filterByAll() {
    await this.switchToRecurringDetailsTab();
    await this.allStatusButton.click();
    await this.page.waitForTimeout(300);
  }

  async filterByFrequency(frequency: string) {
    await this.switchToRecurringDetailsTab();
    await this.frequencyFilter.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: frequency }).click();
    await this.page.waitForTimeout(300);
  }

  async search(query: string) {
    await this.switchToRecurringDetailsTab();
    await this.searchField.fill(query);
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Form Actions
  // ============================================

  async openAddForm() {
    await this.switchToRecurringDetailsTab();
    await this.addRecurringButton.click();
    await this.recurringFormDialog.waitFor({ state: "visible" });
  }

  async fillRecurringForm(data: {
    description?: string;
    amount?: number;
    category?: string;
    subcategory?: string;
    merchant?: string;
    frequency?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    startDate?: string;
    endCondition?: string;
    endAfterCount?: number;
    endDate?: string;
    paymentMethod?: string;
    notes?: string;
  }) {
    if (data.description) {
      await this.descriptionField.clear();
      await this.descriptionField.fill(data.description);
    }

    if (data.amount !== undefined) {
      await this.amountField.clear();
      await this.amountField.fill(data.amount.toString());
    }

    if (data.category) {
      await this.categorySelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.category }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.subcategory) {
      await this.subcategoryField.clear();
      await this.subcategoryField.fill(data.subcategory);
    }

    if (data.merchant) {
      await this.merchantField.clear();
      await this.merchantField.fill(data.merchant);
    }

    if (data.frequency) {
      switch (data.frequency) {
        case "WEEKLY":
          await this.weeklyButton.click();
          break;
        case "MONTHLY":
          await this.monthlyButton.click();
          break;
        case "QUARTERLY":
          await this.quarterlyButton.click();
          break;
        case "YEARLY":
          await this.yearlyButton.click();
          break;
      }
      await this.page.waitForTimeout(200);
    }

    if (data.startDate) {
      await this.startDateField.fill(data.startDate);
    }

    if (data.endCondition) {
      await this.endConditionSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.endCondition }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.endAfterCount !== undefined) {
      await this.endAfterCountField.clear();
      await this.endAfterCountField.fill(data.endAfterCount.toString());
    }

    if (data.endDate) {
      await this.endDateField.fill(data.endDate);
    }

    if (data.paymentMethod) {
      await this.paymentMethodSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.paymentMethod }).click();
      await this.page.waitForTimeout(200);
    }

    if (data.notes) {
      await this.notesField.clear();
      await this.notesField.fill(data.notes);
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
  // Item Actions
  // ============================================

  async openItemMenu(description: string) {
    const item = this.getRecurringItem(description);
    await item.getByRole("button", { name: /dots|menu/i }).click();
    await this.page.waitForTimeout(200);
  }

  async editRecurring(description: string) {
    await this.switchToRecurringDetailsTab();
    await this.openItemMenu(description);
    await this.page.getByRole("listitem").filter({ hasText: /Edit/i }).click();
    await this.recurringFormDialog.waitFor({ state: "visible" });
  }

  async pauseRecurring(description: string) {
    await this.switchToRecurringDetailsTab();
    await this.openItemMenu(description);
    await this.page.getByRole("listitem").filter({ hasText: /Pause/i }).click();
    await this.page.waitForTimeout(500);
  }

  async resumeRecurring(description: string) {
    await this.switchToRecurringDetailsTab();
    await this.openItemMenu(description);
    await this.page.getByRole("listitem").filter({ hasText: /Resume/i }).click();
    await this.page.waitForTimeout(500);
  }

  async skipNext(description: string) {
    await this.switchToRecurringDetailsTab();
    await this.openItemMenu(description);
    await this.page.getByRole("listitem").filter({ hasText: /Skip Next/i }).click();
    await this.page.waitForTimeout(500);
  }

  async generateNow(description: string) {
    await this.switchToRecurringDetailsTab();
    await this.openItemMenu(description);
    await this.page.getByRole("listitem").filter({ hasText: /Generate Now/i }).click();
    await this.page.waitForTimeout(500);
  }

  async deleteRecurring(description: string, deleteGenerated = false) {
    await this.switchToRecurringDetailsTab();
    await this.openItemMenu(description);
    await this.page.getByRole("listitem").filter({ hasText: /Delete/i }).click();
    await this.deleteDialog.waitFor({ state: "visible" });

    if (deleteGenerated) {
      await this.deleteGeneratedCheckbox.click();
    }

    await this.confirmDeleteButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getActiveCount(): Promise<string> {
    const value = this.activeCard.locator(".text-h5").first();
    return await value.textContent() ?? "";
  }

  async getPausedCount(): Promise<string> {
    const value = this.pausedCard.locator(".text-h5").first();
    return await value.textContent() ?? "";
  }

  async getMonthlyTotal(): Promise<string> {
    const value = this.monthlyTotalCard.locator(".text-h5").first();
    return await value.textContent() ?? "";
  }

  async getItemCount(): Promise<number> {
    await this.switchToRecurringDetailsTab();
    const countChip = this.page.locator(".v-chip").filter({ hasText: /items/i });
    const text = await countChip.textContent() ?? "0";
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
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

  async expectRecurringDetailsTabActive() {
    await expect(this.recurringDetailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectFormDialogVisible() {
    await expect(this.recurringFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.recurringFormDialog).not.toBeVisible();
  }

  async expectDeleteDialogVisible() {
    await expect(this.deleteDialog).toBeVisible();
  }

  async expectRecurringInList(description: string) {
    await this.switchToRecurringDetailsTab();
    await expect(this.getRecurringItem(description)).toBeVisible();
  }

  async expectRecurringNotInList(description: string) {
    await this.switchToRecurringDetailsTab();
    await expect(this.getRecurringItem(description)).not.toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await this.switchToOverviewTab();
    await expect(this.activeCard).toBeVisible();
    await expect(this.pausedCard).toBeVisible();
    await expect(this.monthlyTotalCard).toBeVisible();
    await expect(this.upcomingCard).toBeVisible();
  }

  async expectDueThisWeekVisible() {
    await this.switchToOverviewTab();
    await expect(this.dueThisWeekSection).toBeVisible();
  }

  async expectByFrequencyVisible() {
    await this.switchToOverviewTab();
    await expect(this.byFrequencySection).toBeVisible();
  }
}
