import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * EPF Page Object
 * Handles Employee Provident Fund page with two-tab pattern
 */
export class EpfPage extends BasePage {
  readonly url = "/investments/epf";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  get pageSubtitle(): Locator {
    return this.page.locator("text=/EPF|Employee Provident Fund/i");
  }

  // Tab navigation
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get detailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Item Details" });
  }

  // Financial Year Selector
  get fySelector(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /FY|2024|2025|2026/i });
  }

  // Summary cards (Overview tab)
  get totalBalanceCard(): Locator {
    return this.getSummaryCardByTitle("Current Balance");
  }

  get monthlyContributionCard(): Locator {
    return this.getSummaryCardByTitle("Monthly Contribution");
  }

  get interestRateCard(): Locator {
    return this.getSummaryCardByTitle("Interest Rate");
  }

  get projectedAtRetirementCard(): Locator {
    return this.getSummaryCardByTitle("Projected at 60");
  }

  get section80CCard(): Locator {
    return this.page.locator(".v-card, .v-alert").filter({ hasText: /80C|Deduction/i });
  }

  // UAN display
  get uanDisplay(): Locator {
    return this.page.locator(".v-chip, text").filter({ hasText: /UAN/i });
  }

  // Interest rate display
  get interestRateDisplay(): Locator {
    return this.page.locator("text=/Interest Rate|8.25%/i");
  }

  // Projection chart
  get projectionChart(): Locator {
    return this.page.locator("canvas, .vue-chartjs");
  }

  // Monthly grid (Details tab)
  get monthlyGrid(): Locator {
    return this.page.locator(".investment-monthly-grid, table");
  }

  get editModeButton(): Locator {
    return this.page.getByRole("button", { name: /Edit/i });
  }

  get saveChangesButton(): Locator {
    return this.page.getByRole("button", { name: /Save/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel/i });
  }

  // Data Completion Grid (Overview tab)
  get dataCompletionGrid(): Locator {
    // The DataCompletionGrid component has .completion-grid class inside a .v-card
    return this.page.locator(".v-card").filter({ has: this.page.locator(".completion-grid") });
  }

  get dataCompletionChip(): Locator {
    return this.page.locator(".v-chip").filter({ hasText: /\d+\/12 months|Complete!/i });
  }

  get dataCompletionProgress(): Locator {
    return this.dataCompletionGrid.locator(".v-progress-linear");
  }

  get completionMonthLabels(): Locator {
    return this.dataCompletionGrid.locator(".month-label");
  }

  // Copy Data Dialog (Details tab)
  get copyMenuButton(): Locator {
    // The menu button has "Copy" text with prepend icon
    return this.page.getByRole("button", { name: /^Copy$/i });
  }

  get copyMenu(): Locator {
    return this.page.locator(".v-list").filter({ hasText: /Copy to remaining|Import from previous/i });
  }

  get copyDialog(): Locator {
    // Dialog titles: "Copy EPF to Remaining Months", "Import EPF from Previous Year", "Clear EPF Data"
    return this.page.locator(".v-dialog").filter({ hasText: /Copy EPF|Import EPF|Clear EPF/i });
  }

  get copyToRemainingOption(): Locator {
    return this.page.locator(".v-list-item").filter({ hasText: /Copy to remaining/i });
  }

  get importFromPrevFYOption(): Locator {
    return this.page.locator(".v-list-item").filter({ hasText: /Import from previous/i });
  }

  get clearMonthsOption(): Locator {
    return this.page.locator(".v-list-item").filter({ hasText: /Clear selected/i });
  }

  get copyConfirmButton(): Locator {
    return this.copyDialog.getByRole("button", { name: /Copy|Import|Clear/i }).last();
  }

  get copyCancelButton(): Locator {
    return this.copyDialog.getByRole("button", { name: /Cancel/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
    // Wait for EPF Overview content to load (not skeleton)
    await this.page.locator(".v-card").filter({ hasText: /Current Balance|Monthly Contribution/i })
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {});
  }

  async navigateToOverview() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(500);
    // Wait for overview content
    await this.page.locator(".v-card").filter({ hasText: /Current Balance|Monthly Contribution/i })
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
  }

  async navigateToDetails() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Actions
  // ============================================

  async selectFinancialYear(fy: string) {
    await this.fySelector.click();
    await this.page.getByRole("option", { name: fy }).click();
    await this.page.waitForTimeout(500);
  }

  async enterEditMode() {
    await this.editModeButton.click();
    await this.page.waitForTimeout(300);
  }

  async saveChanges() {
    await this.saveChangesButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelEdit() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  async openCopyMenu() {
    await this.copyMenuButton.click();
    await this.page.waitForTimeout(200);
  }

  async openCopyToRemainingDialog() {
    await this.openCopyMenu();
    await this.copyToRemainingOption.click();
    await this.page.waitForTimeout(300);
  }

  async openImportFromPrevFYDialog() {
    await this.openCopyMenu();
    await this.importFromPrevFYOption.click();
    await this.page.waitForTimeout(300);
  }

  async closeCopyDialog() {
    await this.copyCancelButton.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Getters
  // ============================================

  async getTotalBalance(): Promise<string> {
    return await this.getSummaryCardValue("Current Balance");
  }

  async getMonthlyContribution(): Promise<string> {
    return await this.getSummaryCardValue("Monthly Contribution");
  }

  async getProjectedAtRetirement(): Promise<string> {
    return await this.getSummaryCardValue("Projected at 60");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "EPF" })).toHaveAttribute("aria-selected", "true");
    await expect(this.overviewTab).toBeVisible();
    await expect(this.detailsTab).toBeVisible();
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectDetailsTabActive() {
    await expect(this.detailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectTotalBalanceVisible() {
    await expect(this.totalBalanceCard).toBeVisible();
  }

  async expectMonthlyGridVisible() {
    await expect(this.monthlyGrid).toBeVisible();
  }

  async expectProjectionChartVisible() {
    await expect(this.projectionChart).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.totalBalanceCard).toBeVisible();
  }

  async expectFinancialYearSelected(fy: string) {
    await expect(this.fySelector).toContainText(fy);
  }

  async expectEditModeActive() {
    // In edit mode, save button should be visible and edit button hidden
    await expect(this.saveChangesButton).toBeVisible();
  }

  async expectEditModeInactive() {
    // Not in edit mode, edit button should be visible
    await expect(this.editModeButton).toBeVisible();
  }

  async expectDataCompletionGridVisible() {
    await expect(this.dataCompletionGrid).toBeVisible();
  }

  async expectDataCompletionChipVisible() {
    await expect(this.dataCompletionChip).toBeVisible();
  }

  async expectCopyMenuButtonVisible() {
    await expect(this.copyMenuButton).toBeVisible();
  }

  async expectCopyDialogVisible() {
    await expect(this.copyDialog).toBeVisible();
  }

  async expectCopyDialogHidden() {
    await expect(this.copyDialog).not.toBeVisible();
  }
}
