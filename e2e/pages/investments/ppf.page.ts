import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * PPF Page Object
 * Handles Public Provident Fund page with two-tab pattern
 */
export class PpfPage extends BasePage {
  readonly url = "/investments/ppf";

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
    return this.page.locator("text=/PPF|Public Provident Fund/i");
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
  get currentBalanceCard(): Locator {
    return this.getSummaryCardByTitle("Current Balance");
  }

  get interestEarnedCard(): Locator {
    return this.getSummaryCardByTitle("Interest Earned");
  }

  get maturityValueCard(): Locator {
    return this.getSummaryCardByTitle("Maturity Value");
  }

  get fyContributionCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FY.*Contribution|This Year/i });
  }

  // Interest rate display
  get interestRateDisplay(): Locator {
    return this.page.locator("text=/Interest Rate|7.1%/i");
  }

  // Maturity date display
  get maturityDateDisplay(): Locator {
    return this.page.locator("text=/Maturity|Matures/i");
  }

  // Account details
  get accountNumberDisplay(): Locator {
    return this.page.locator(".v-chip, text").filter({ hasText: /Account|PPF/i });
  }

  // Contribution status
  get contributionStatusChip(): Locator {
    return this.page.locator(".v-chip").filter({ hasText: /₹.*of.*₹1.5L|Limit/i });
  }

  // Projection chart
  get projectionChart(): Locator {
    return this.page.locator("canvas, .vue-chartjs");
  }

  // Year-wise history table (Details tab)
  get contributionGrid(): Locator {
    // PPF uses v-table for year-wise history
    return this.page.locator(".v-table, table");
  }

  get addContributionButton(): Locator {
    // PPF button says "Add Deposit" not "Add Contribution"
    return this.page.getByRole("button", { name: /Add.*Deposit|Add.*Contribution/i });
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

  // Add contribution dialog
  get addContributionDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Contribution|PPF/i });
  }

  get contributionAmountField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Amount|Contribution/i });
  }

  get contributionDateField(): Locator {
    return this.page.getByLabel(/Date/i);
  }

  // Data Completion Grid (Overview tab)
  get dataCompletionGrid(): Locator {
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
    return this.page.getByRole("button", { name: /^Copy$/i });
  }

  get copyMenu(): Locator {
    return this.page.locator(".v-list").filter({ hasText: /Copy to remaining|Import from previous/i });
  }

  get copyDialog(): Locator {
    // Dialog titles: "Copy PPF to Remaining Months", "Import PPF from Previous Year", "Clear PPF Data"
    return this.page.locator(".v-dialog").filter({ hasText: /Copy PPF|Import PPF|Clear PPF/i });
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
    // Wait for PPF Overview content to load
    await this.page.locator(".v-card").filter({ hasText: /Current Balance|Monthly Contribution/i })
      .first()
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {});
  }

  async navigateToOverview() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(500);
    await this.page.locator(".v-card").filter({ hasText: /Current Balance|Monthly Contribution/i })
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => {});
  }

  async navigateToDetails() {
    await this.detailsTab.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Actions
  // ============================================

  async selectFinancialYear(fy: string) {
    await this.fySelector.click();
    await this.page.getByRole("option", { name: fy }).click();
    await this.page.waitForTimeout(500);
  }

  async openAddContributionDialog() {
    await this.addContributionButton.click();
    await this.addContributionDialog.waitFor({ state: "visible" });
  }

  async addContribution(amount: number, date?: string) {
    await this.openAddContributionDialog();
    await this.contributionAmountField.fill(amount.toString());
    if (date) {
      await this.contributionDateField.fill(date);
    }
    await this.page.getByRole("button", { name: /Save|Add/i }).click();
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

  async getCurrentBalance(): Promise<string> {
    return await this.getSummaryCardValue("Current Balance");
  }

  async getInterestEarned(): Promise<string> {
    return await this.getSummaryCardValue("Interest Earned");
  }

  async getMaturityValue(): Promise<string> {
    return await this.getSummaryCardValue("Maturity Value");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "PPF" })).toHaveAttribute("aria-selected", "true");
    await expect(this.overviewTab).toBeVisible();
    await expect(this.detailsTab).toBeVisible();
  }

  async expectOverviewTabActive() {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectDetailsTabActive() {
    await expect(this.detailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectCurrentBalanceVisible() {
    await expect(this.currentBalanceCard).toBeVisible();
  }

  async expectContributionGridVisible() {
    await expect(this.contributionGrid).toBeVisible();
  }

  async expectProjectionChartVisible() {
    await expect(this.projectionChart).toBeVisible();
  }

  async expectAddContributionDialogVisible() {
    await expect(this.addContributionDialog).toBeVisible();
  }

  async expectAddContributionDialogClosed() {
    await expect(this.addContributionDialog).not.toBeVisible();
  }

  async expectFinancialYearSelected(fy: string) {
    await expect(this.fySelector).toContainText(fy);
  }

  async expectSummaryCardsVisible() {
    await expect(this.currentBalanceCard).toBeVisible();
  }

  // Additional actions for contribution management
  async saveContribution() {
    const saveBtn = this.addContributionDialog.getByRole("button", { name: /Save|Add|Submit/i });
    await saveBtn.click();
    await this.page.waitForTimeout(500);
  }

  async cancelAddContribution() {
    const cancelBtn = this.addContributionDialog.getByRole("button", { name: /Cancel|Close/i });
    await cancelBtn.click();
    await this.page.waitForTimeout(300);
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
