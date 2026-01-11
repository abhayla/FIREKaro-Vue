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
    await this.goto("/dashboard/salary");
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
    // Settings button has mdi-cog icon - look for icon class or aria-label
    return this.page.locator("button:has(.mdi-cog), button[aria-label*='Settings'], .v-btn--icon:has(.mdi-cog)").first();
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
  // monthIndex 0 = April, 1 = May, etc.
  getCellValue(rowLabel: string, monthIndex: number): Locator {
    return this.page
      .locator(`tr, .grid-row`)
      .filter({ hasText: rowLabel })
      .locator(`td, .grid-cell`)
      .nth(monthIndex + 1); // +1 to skip the label column
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
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Employer|Add New Employer/i });
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

  // ============================================
  // Additional Methods for Copy Action Tests
  // ============================================

  /**
   * Get the input value for a specific cell
   */
  async getCellInputValue(rowLabel: string, monthIndex: number): Promise<string> {
    const cell = this.getCellValue(rowLabel, monthIndex);
    const input = cell.locator("input");
    if (await input.isVisible()) {
      return await input.inputValue();
    }
    // If no input (view mode), get text content
    return (await cell.textContent())?.trim() || "";
  }

  /**
   * Check if a month column has data (non-empty/non-zero values)
   */
  async monthHasData(monthIndex: number): Promise<boolean> {
    // Check Basic Salary row for this month
    const cellText = await this.getCellInputValue("Basic", monthIndex);
    const value = parseFloat(cellText.replace(/[₹,KL]/g, "")) || 0;
    return value > 0;
  }

  /**
   * Get all checkbox states in Copy dialog
   */
  async getCopyDialogCheckboxStates(): Promise<Record<string, boolean>> {
    const dialog = this.copyDataDialog;
    const checkboxes = ["Employer", "Paid Days", "All Earnings", "All Deductions", "All Employer Contributions"];
    const states: Record<string, boolean> = {};

    for (const label of checkboxes) {
      const checkbox = dialog.getByLabel(label, { exact: false });
      if (await checkbox.isVisible()) {
        states[label] = await checkbox.isChecked();
      }
    }
    return states;
  }

  /**
   * Toggle a specific checkbox in Copy dialog
   */
  async toggleCopyDialogCheckbox(label: string) {
    const dialog = this.copyDataDialog;
    await dialog.getByLabel(label, { exact: false }).click();
    await this.page.waitForTimeout(100);
  }

  /**
   * Get the employer name for a specific month
   */
  async getEmployerForMonth(monthIndex: number): Promise<string> {
    const employerRow = this.page.locator("tr, .grid-row").filter({ hasText: /^Employer/i });
    const cell = employerRow.locator("td, .grid-cell").nth(monthIndex + 1); // +1 for label column
    // Use .first() to avoid strict mode violation when multiple elements match
    const selectText = cell.locator(".v-select__selection").first();
    if (await selectText.isVisible().catch(() => false)) {
      return (await selectText.textContent())?.trim() || "";
    }
    // Fallback to cell text content
    return (await cell.textContent())?.trim() || "";
  }

  /**
   * Import from Previous FY (for April)
   */
  async importFromPreviousFY() {
    await this.clickMonthHeader("Apr");
    await this.page.getByText(/Import from.*Prev FY/i).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Get Import dialog
   */
  get importDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Import from Previous/i });
  }

  /**
   * Confirm Import dialog
   */
  async confirmImportDialog() {
    await this.importDialog.getByRole("button", { name: /Import/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Employer Management Methods
  // ============================================

  /**
   * Open Add Employer dialog from main button
   */
  async openAddEmployerDialog() {
    await this.addEmployerButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill Add Employer dialog fields
   */
  async fillEmployerForm(data: {
    name: string;
    employeeId?: string;
    designation?: string;
    startDate?: string;
    endDate?: string;
    pan?: string;
    tan?: string;
    uan?: string;
    pfAccount?: string;
    npsPran?: string;
    isPrimary?: boolean;
  }) {
    const dialog = this.addEmployerDialog;

    // Required: Company Name
    await dialog.getByLabel(/Company.*Name|Employer.*Name/i).fill(data.name);

    // Optional fields
    if (data.employeeId) {
      await dialog.getByLabel(/Employee ID/i).fill(data.employeeId);
    }
    if (data.designation) {
      await dialog.getByLabel(/Designation/i).fill(data.designation);
    }
    if (data.startDate) {
      const startField = dialog.getByLabel(/Start Date/i);
      await startField.fill(data.startDate);
    }
    if (data.pan) {
      await dialog.getByLabel(/PAN.*Employer/i).fill(data.pan);
    }
    if (data.tan) {
      await dialog.getByLabel(/TAN/i).fill(data.tan);
    }
    if (data.uan) {
      await dialog.getByLabel(/UAN/i).fill(data.uan);
    }
    if (data.pfAccount) {
      await dialog.getByLabel(/PF Account/i).fill(data.pfAccount);
    }
    if (data.npsPran) {
      await dialog.getByLabel(/NPS.*PRAN/i).fill(data.npsPran);
    }
    if (data.isPrimary) {
      await dialog.getByLabel(/Primary.*Employer|Set as Primary/i).click();
    }
  }

  /**
   * Save employer in Add Employer dialog
   */
  async saveEmployer() {
    await this.addEmployerDialog.getByRole("button", { name: /Save|Add/i }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel Add Employer dialog
   */
  async cancelAddEmployer() {
    await this.addEmployerDialog.getByRole("button", { name: /Cancel/i }).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Open Manage Employers dialog from settings
   */
  async openManageEmployersDialog() {
    await this.openSettingsMenu();
    await this.page.getByText(/Manage Employers/i).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get employer card in Manage Employers dialog
   */
  getEmployerCard(employerName: string): Locator {
    return this.manageEmployersDialog.locator(".v-card").filter({ hasText: employerName });
  }

  /**
   * Edit employer in Manage Employers dialog
   */
  async editEmployer(employerName: string) {
    const card = this.getEmployerCard(employerName);
    await card.getByRole("button", { name: /Edit/i }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Delete employer in Manage Employers dialog
   */
  async deleteEmployer(employerName: string) {
    const card = this.getEmployerCard(employerName);
    await card.getByRole("button", { name: /Delete/i }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Set employer as primary in Manage Employers dialog
   */
  async setEmployerAsPrimary(employerName: string) {
    const card = this.getEmployerCard(employerName);
    await card.getByRole("button", { name: /Set as Primary/i }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Close Manage Employers dialog
   */
  async closeManageEmployersDialog() {
    await this.manageEmployersDialog.getByRole("button", { name: /Close/i }).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Quick add employer from dropdown in edit mode
   */
  async quickAddEmployerFromDropdown(monthIndex: number, employerName: string) {
    const dropdown = this.getEmployerDropdown(monthIndex);
    await dropdown.click();
    await this.page.waitForTimeout(200);
    await this.page.getByText(/Add New Employer/i).click();
    await this.page.waitForTimeout(300);

    // Fill quick add form
    const quickDialog = this.page.locator(".v-dialog").filter({ hasText: /Quick Add|Add.*Employer/i });
    await quickDialog.getByLabel(/Company.*Name|Employer.*Name/i).fill(employerName);
    await quickDialog.getByRole("button", { name: /Add|Save/i }).click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Data Verification Methods
  // ============================================

  /**
   * Get all salary data for a specific month
   */
  async getMonthData(monthIndex: number): Promise<{
    employer: string;
    paidDays: string;
    basic: string;
    hra: string;
    gross: string;
    epf: string;
    tds: string;
    net: string;
  }> {
    return {
      employer: await this.getEmployerForMonth(monthIndex),
      paidDays: await this.getCellInputValue("Paid Days", monthIndex),
      basic: await this.getCellInputValue("Basic", monthIndex),
      hra: await this.getCellInputValue("House Rent", monthIndex),
      gross: await this.getCellInputValue("Gross", monthIndex),
      epf: await this.getCellInputValue("EPF", monthIndex),
      tds: await this.getCellInputValue("TDS", monthIndex),
      net: await this.getCellInputValue("Net", monthIndex),
    };
  }

  /**
   * Verify that data was copied to a range of months
   */
  async verifyDataCopiedToMonths(
    sourceMonthIndex: number,
    targetMonthIndices: number[],
    fields: string[] = ["Basic", "HRA"]
  ): Promise<boolean> {
    for (const field of fields) {
      const sourceValue = await this.getCellInputValue(field, sourceMonthIndex);
      for (const targetIdx of targetMonthIndices) {
        const targetValue = await this.getCellInputValue(field, targetIdx);
        if (sourceValue !== targetValue) {
          return false;
        }
      }
    }
    return true;
  }
}
