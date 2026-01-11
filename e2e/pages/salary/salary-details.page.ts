import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Page Object for Salary Details Tab
 * Replaces the old SalaryHistoryPage - now uses inline grid view with edit mode
 */
export class SalaryDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateTo() {
    await this.goto("/income/salary");
    await this.waitForPageLoad();
    // Click on Salary Details tab - use v-tab class instead of role
    const detailsTab = this.page.locator(".v-tab").filter({ hasText: "Salary Details" });
    await detailsTab.click();
    await this.page.waitForTimeout(500);
  }

  // Page elements
  get salaryDetailsTab(): Locator {
    return this.page.locator(".v-tab").filter({ hasText: "Salary Details" });
  }

  get editModeButton(): Locator {
    return this.page.getByRole("button", { name: /Edit Mode/i });
  }

  get saveModeButton(): Locator {
    return this.page.getByRole("button", { name: /Save/i });
  }

  get cancelModeButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel/i });
  }

  get settingsButton(): Locator {
    // Settings button has a cog icon - look for the icon text or class
    return this.page.locator("button").filter({ hasText: /󰒓/ }).or(
      this.page.locator("button:has(.mdi-cog)")
    );
  }

  get exportButton(): Locator {
    return this.page.locator("button").filter({ hasText: /󰁔|Export/i }).or(
      this.page.locator("button:has(.mdi-download)")
    );
  }

  get importFromPrevFYButton(): Locator {
    return this.page.getByRole("button", { name: /Import from/i });
  }

  get addEmployerButton(): Locator {
    return this.page.getByRole("button", { name: /Add Employer/i });
  }

  get addRowButton(): Locator {
    return this.page.getByRole("button", { name: /Add Row/i });
  }

  // Salary Grid
  get salaryGrid(): Locator {
    return this.page.locator(".salary-grid, table").first();
  }

  get gridRows(): Locator {
    return this.salaryGrid.locator("tbody tr, .grid-row");
  }

  // Month column headers (clickable in edit mode)
  getMonthHeader(month: string): Locator {
    return this.page.locator(`th, .month-header`).filter({ hasText: month });
  }

  // Get cell value for a specific row and month
  getCellValue(rowLabel: string, monthIndex: number): Locator {
    return this.page
      .locator(`tr, .grid-row`)
      .filter({ hasText: rowLabel })
      .locator(`td, .grid-cell`)
      .nth(monthIndex);
  }

  // Employer dropdown per month (in edit mode)
  getEmployerDropdown(monthIndex: number): Locator {
    return this.page
      .locator(`tr, .grid-row`)
      .filter({ hasText: /Employer/i })
      .locator(`.v-select, select`)
      .nth(monthIndex);
  }

  // Column header menu (in edit mode)
  get columnHeaderMenu(): Locator {
    return this.page.locator(".v-menu__content, .v-list");
  }

  get copyToRemainingOption(): Locator {
    return this.page.getByText(/Copy to remaining months/i);
  }

  get copyFromPrevOption(): Locator {
    return this.page.getByText(/Copy from/i);
  }

  get clearMonthOption(): Locator {
    return this.page.getByText(/Clear this month/i);
  }

  // Copy Data Dialog
  get copyDataDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Import|Copy|Clear/i });
  }

  // Manage Employers Dialog
  get manageEmployersDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Manage Employers/i });
  }

  // Add Employer Dialog
  get addEmployerDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Employer/i });
  }

  // Summary rows
  get grossEarningsRow(): Locator {
    return this.page.locator("tr, .grid-row").filter({ hasText: /Gross.*Earnings|Gross \(A\)/i });
  }

  get totalDeductionsRow(): Locator {
    return this.page.locator("tr, .grid-row").filter({ hasText: /Total.*Ded|Ded \(B\)/i });
  }

  get netSalaryRow(): Locator {
    return this.page.locator("tr, .grid-row").filter({ hasText: /Net.*Salary|Net \(A-B\)/i });
  }

  // Actions
  async enterEditMode() {
    await this.editModeButton.click();
    await this.page.waitForTimeout(300);
  }

  async saveChanges() {
    await this.saveModeButton.click();
    await this.page.waitForTimeout(500);
  }

  async cancelEdit() {
    await this.cancelModeButton.click();
    await this.page.waitForTimeout(300);
  }

  async clickMonthHeader(month: string) {
    const header = this.getMonthHeader(month);
    await header.locator("button, .month-header-btn").click();
    await this.page.waitForTimeout(200);
  }

  async openSettingsMenu() {
    await this.settingsButton.click();
    await this.page.waitForTimeout(200);
  }

  async selectEmployerForMonth(monthIndex: number, employerName: string) {
    const dropdown = this.getEmployerDropdown(monthIndex);
    await dropdown.click();
    await this.page.getByRole("option", { name: employerName }).click();
    await this.page.waitForTimeout(200);
  }

  async fillCellValue(rowLabel: string, monthIndex: number, value: string) {
    const cell = this.getCellValue(rowLabel, monthIndex);
    const input = cell.locator("input");
    await input.fill(value);
    await this.page.waitForTimeout(100);
  }

  async copyToRemainingMonths(sourceMonth: string) {
    await this.clickMonthHeader(sourceMonth);
    await this.copyToRemainingOption.click();
    await this.page.waitForTimeout(200);
  }

  async copyFromPreviousMonth(targetMonth: string) {
    await this.clickMonthHeader(targetMonth);
    await this.copyFromPrevOption.click();
    await this.page.waitForTimeout(200);
  }

  async clearMonth(month: string) {
    await this.clickMonthHeader(month);
    await this.clearMonthOption.click();
    await this.page.waitForTimeout(200);
  }

  // Dialog actions
  async confirmCopyDialog() {
    await this.copyDataDialog.getByRole("button", { name: /Copy|Import|Clear/i }).click();
    await this.page.waitForTimeout(500);
  }

  async cancelCopyDialog() {
    await this.copyDataDialog.getByRole("button", { name: /Cancel/i }).click();
    await this.page.waitForTimeout(200);
  }

  // Assertions
  async expectEditModeActive() {
    await expect(this.saveModeButton).toBeVisible();
    await expect(this.cancelModeButton).toBeVisible();
  }

  async expectViewModeActive() {
    await expect(this.editModeButton).toBeVisible();
  }

  async expectMonthColumnsVisible() {
    const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    for (const month of months.slice(0, 3)) {
      await expect(this.page.getByText(month).first()).toBeVisible();
    }
  }

  async expectTotalColumnVisible() {
    await expect(this.page.getByText("Total").first()).toBeVisible();
  }

  async expectSectionVisible(section: "EARNINGS" | "DEDUCTIONS" | "EMPLOYER CONTRIBUTIONS") {
    await expect(this.page.getByText(section)).toBeVisible();
  }

  async expectRowVisible(rowLabel: string) {
    await expect(this.page.getByText(rowLabel).first()).toBeVisible();
  }

  async expectCopyDialogOpen() {
    await expect(this.copyDataDialog).toBeVisible();
  }

  async expectCopyDialogClosed() {
    await expect(this.copyDataDialog).not.toBeVisible();
  }

  async expectManageEmployersDialogOpen() {
    await expect(this.manageEmployersDialog).toBeVisible();
  }

  async expectAddEmployerDialogOpen() {
    await expect(this.addEmployerDialog).toBeVisible();
  }
}
