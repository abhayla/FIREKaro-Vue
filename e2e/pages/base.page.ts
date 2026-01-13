import { Page, Locator, expect } from "@playwright/test";

/**
 * Dashboard section routes for navigation
 */
export const DASHBOARD_SECTIONS = {
  salary: "/dashboard/salary",
  "non-salary-income": "/dashboard/non-salary-income",
  "tax-planning": "/tax-planning",
  expenses: "/dashboard/expenses",
  investments: "/investments",
  liabilities: "/dashboard/liabilities",
  insurance: "/dashboard/insurance",
  "financial-health": "/financial-health",
  "fire-goals": "/dashboard/fire-goals",
} as const;

export type DashboardSection = keyof typeof DASHBOARD_SECTIONS;

/**
 * Base Page Object with common methods for all pages
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    // Smart wait: domcontentloaded is faster than networkidle
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for first card to appear (indicates data loaded)
    await this.page.locator(".v-card").first().waitFor({
      state: "visible",
      timeout: 10000
    }).catch(() => {
      // If no cards, wait a bit for page to settle
      return this.page.waitForTimeout(500);
    });
  }

  // Common selectors
  get sidebar(): Locator {
    return this.page.locator("nav");
  }

  get mainContent(): Locator {
    return this.page.locator("main");
  }

  // Snackbar/Toast messages
  get snackbar(): Locator {
    return this.page.locator(".v-snackbar");
  }

  async getSnackbarMessage(): Promise<string> {
    await this.snackbar.waitFor({ state: "visible" });
    return (await this.snackbar.locator("[role='status']").textContent()) || "";
  }

  async waitForSnackbar(expectedText?: string) {
    await this.snackbar.waitFor({ state: "visible" });
    if (expectedText) {
      await expect(this.snackbar).toContainText(expectedText);
    }
  }

  async closeSnackbar() {
    const closeBtn = this.snackbar.getByRole("button", { name: "Close" });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  // Dialog helpers
  get dialog(): Locator {
    return this.page.locator(".v-dialog");
  }

  async isDialogOpen(): Promise<boolean> {
    return await this.dialog.isVisible();
  }

  async closeDialog() {
    const closeBtn = this.dialog.getByRole("button", { name: /close/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  }

  // Financial Year selector (common across salary pages)
  get fySelector(): Locator {
    return this.page
      .locator(".v-select")
      .filter({ has: this.page.locator('text="Financial Year"') });
  }

  async selectFinancialYear(fy: string) {
    await this.fySelector.click();
    // Wait for dropdown to open
    await this.page.waitForTimeout(300);
    // Click the option with the full FY name
    await this.page.getByRole("option", { name: fy }).click();
    await this.page.waitForTimeout(1000); // Wait for data to load
  }

  async getSelectedFinancialYear(): Promise<string> {
    const input = this.page.locator(".v-select__selection").first();
    return (await input.textContent()) || "";
  }

  // Tab navigation
  async clickTab(tabName: string) {
    await this.page.getByRole("tab", { name: tabName }).click();
    await this.page.waitForTimeout(300);
  }

  async isTabSelected(tabName: string): Promise<boolean> {
    const tab = this.page.getByRole("tab", { name: tabName });
    return (await tab.getAttribute("aria-selected")) === "true";
  }

  // Sidebar navigation
  async navigateToSection(sectionName: string) {
    await this.sidebar.getByText(sectionName, { exact: true }).click();
  }

  // Format helpers for assertions
  formatINR(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatINRLakhs(amount: number): string {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return this.formatINR(amount);
  }

  // Wait helpers
  async waitForTableLoad() {
    // Wait for loading indicator to disappear
    await this.page
      .locator(".v-data-table__progress")
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  // Screenshot helper
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `e2e-screenshots/${name}.png`,
      fullPage: false,
    });
  }

  // ============================================
  // Dashboard Section Navigation
  // ============================================

  /**
   * Navigate to a specific dashboard section
   */
  async navigateToDashboardSection(section: DashboardSection) {
    await this.page.goto(DASHBOARD_SECTIONS[section]);
    await this.waitForPageLoad();
  }

  /**
   * Get current section from URL
   */
  getCurrentSection(): DashboardSection | null {
    const url = this.page.url();
    for (const [key, path] of Object.entries(DASHBOARD_SECTIONS)) {
      if (url.includes(path)) {
        return key as DashboardSection;
      }
    }
    return null;
  }

  // ============================================
  // Confirmation Dialog Helpers
  // ============================================

  /**
   * Get the confirmation dialog (used for delete confirmations)
   */
  get confirmationDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /confirm|delete|remove/i });
  }

  /**
   * Confirm a delete/remove action in the confirmation dialog
   */
  async confirmDelete() {
    const confirmBtn = this.confirmationDialog.getByRole("button", { name: /delete|confirm|yes/i });
    await confirmBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel a delete/remove action in the confirmation dialog
   */
  async cancelDelete() {
    const cancelBtn = this.confirmationDialog.getByRole("button", { name: /cancel|no/i });
    await cancelBtn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if confirmation dialog is visible
   */
  async isConfirmationDialogVisible(): Promise<boolean> {
    return await this.confirmationDialog.isVisible();
  }

  // ============================================
  // Summary Card Helpers
  // ============================================

  /**
   * Get all summary cards on the page
   */
  getSummaryCards(): Locator {
    return this.page.locator(".v-card").filter({ has: this.page.locator(".text-h4, .text-h5, .text-h6") });
  }

  /**
   * Get a specific summary card by title text (case-insensitive)
   */
  getSummaryCardByTitle(title: string): Locator {
    return this.page.locator(".v-card").filter({ hasText: new RegExp(title, 'i') });
  }

  /**
   * Get a specific summary card by data-testid attribute
   */
  getSummaryCardByTestId(testId: string): Locator {
    return this.page.locator(`[data-testid="${testId}"]`);
  }

  /**
   * Get the value displayed in a summary card
   */
  async getSummaryCardValue(title: string): Promise<string> {
    const card = this.getSummaryCardByTitle(title);
    const valueElement = card.locator(".text-h4, .text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "";
  }

  /**
   * Get the value displayed in a summary card by data-testid
   */
  async getSummaryCardValueByTestId(testId: string): Promise<string> {
    const card = this.getSummaryCardByTestId(testId);
    const valueElement = card.locator(".text-h4, .text-h5, .text-h6, .text-currency").first();
    return (await valueElement.textContent()) || "";
  }

  /**
   * Select an option from a Vuetify v-select dropdown
   */
  async selectOption(selectLocator: Locator, optionText: string): Promise<void> {
    await selectLocator.click();
    await this.page.waitForTimeout(300);
    await this.page.getByRole("option", { name: new RegExp(optionText, 'i') }).click();
    await this.page.waitForTimeout(200);
  }

  // ============================================
  // Data Table Helpers
  // ============================================

  /**
   * Get the main data table on the page
   */
  get dataTable(): Locator {
    return this.page.locator(".v-data-table");
  }

  /**
   * Get all rows in the data table
   */
  getTableRows(): Locator {
    return this.dataTable.locator("tbody tr");
  }

  /**
   * Get row count in the data table
   */
  async getTableRowCount(): Promise<number> {
    return await this.getTableRows().count();
  }

  /**
   * Get a specific row by text content
   */
  getTableRowByText(text: string): Locator {
    return this.dataTable.locator(`tbody tr:has-text("${text}")`);
  }

  /**
   * Click edit button on a specific row
   */
  async clickEditOnRow(rowText: string) {
    // Use .first() to handle multiple rows with same text (from parallel test runs)
    const row = this.getTableRowByText(rowText).first();
    await row.getByRole("button").first().click(); // Usually first button is edit
    await this.page.waitForTimeout(300);
  }

  /**
   * Click delete button on a specific row
   */
  async clickDeleteOnRow(rowText: string) {
    // Use .first() to handle multiple rows with same text (from parallel test runs)
    const row = this.getTableRowByText(rowText).first();
    await row.getByRole("button").nth(1).click(); // Usually second button is delete
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if table shows empty state
   */
  async isTableEmpty(): Promise<boolean> {
    const emptyState = this.dataTable.locator("text=No data available");
    return await emptyState.isVisible();
  }

  // ============================================
  // Form Helpers
  // ============================================

  /**
   * Fill a text field by label
   */
  async fillTextField(label: string, value: string) {
    const field = this.page.getByRole("textbox", { name: label });
    await field.clear();
    await field.fill(value);
  }

  /**
   * Fill a number field by label
   */
  async fillNumberField(label: string, value: number) {
    const field = this.page.getByRole("spinbutton", { name: label });
    await field.clear();
    await field.fill(value.toString());
  }

  /**
   * Select an option from a dropdown by label
   */
  async selectDropdownOption(dropdownLabel: string, optionText: string) {
    const dropdown = this.page.locator(".v-select").filter({ hasText: dropdownLabel });
    await dropdown.click();
    await this.page.waitForTimeout(200);
    await this.page.getByRole("option", { name: optionText }).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Toggle a checkbox by label
   */
  async toggleCheckbox(label: string) {
    const checkbox = this.page.getByRole("checkbox", { name: label });
    await checkbox.click();
  }

  /**
   * Get validation error message for a field
   */
  async getFieldError(fieldLabel: string): Promise<string | null> {
    const fieldContainer = this.page.locator(".v-input").filter({ hasText: fieldLabel });
    const errorMessage = fieldContainer.locator(".v-messages__message");
    if (await errorMessage.isVisible()) {
      return await errorMessage.textContent();
    }
    return null;
  }

  /**
   * Check if form has validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    const errors = this.page.locator(".v-messages__message.text-error, .v-input--error");
    return (await errors.count()) > 0;
  }

  // ============================================
  // Button Helpers
  // ============================================

  /**
   * Click a button by its text
   */
  async clickButton(buttonText: string) {
    await this.page.getByRole("button", { name: buttonText }).click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Click the primary/save button in a form
   */
  async clickSaveButton() {
    const saveBtn = this.page.getByRole("button", { name: /save|submit|add|create/i });
    await saveBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click the cancel button in a form
   */
  async clickCancelButton() {
    const cancelBtn = this.page.getByRole("button", { name: /cancel/i });
    await cancelBtn.click();
    await this.page.waitForTimeout(200);
  }

  // ============================================
  // Wait Helpers
  // ============================================

  /**
   * Wait for API response to complete
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    await this.page.waitForResponse(
      response => response.url().match(urlPattern) !== null && response.status() === 200
    );
  }

  /**
   * Wait for loading overlay to disappear
   */
  async waitForLoadingComplete() {
    await this.page.locator(".v-overlay--active").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    await this.page.locator("[role='progressbar']").waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.locator(selector).waitFor({ state: "visible", timeout });
  }

  // ============================================
  // Assertion Helpers
  // ============================================

  /**
   * Assert that a success snackbar appears
   */
  async expectSuccessMessage(message?: string) {
    await this.snackbar.waitFor({ state: "visible" });
    if (message) {
      await expect(this.snackbar).toContainText(message);
    }
    // Success snackbars usually have green color
    await expect(this.snackbar.locator(".v-snackbar__wrapper")).toHaveClass(/bg-success|bg-green/);
  }

  /**
   * Assert that an error snackbar appears
   */
  async expectErrorMessage(message?: string) {
    await this.snackbar.waitFor({ state: "visible" });
    if (message) {
      await expect(this.snackbar).toContainText(message);
    }
    await expect(this.snackbar.locator(".v-snackbar__wrapper")).toHaveClass(/bg-error|bg-red/);
  }

  /**
   * Assert page URL contains a path
   */
  async expectUrlContains(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Assert page title
   */
  async expectPageTitle(title: string) {
    await expect(this.page.getByRole("heading", { level: 1 })).toContainText(title);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Parse INR formatted string to number
   */
  parseINR(formatted: string): number {
    // Remove currency symbol, commas, and whitespace
    const cleaned = formatted.replace(/[₹,\s]/g, "");
    return parseFloat(cleaned) || 0;
  }

  /**
   * Generate a unique test ID
   */
  generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  getCurrentDate(): string {
    return new Date().toISOString().split("T")[0];
  }

  /**
   * Get current financial year (e.g., "2025-26")
   */
  getCurrentFinancialYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    // FY starts in April
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }

  // ============================================
  // Family View Helpers
  // ============================================

  /**
   * Get the family toggle button in the app bar
   */
  get familyToggleButton(): Locator {
    return this.page.locator("header").getByRole("button").filter({
      has: this.page.locator("i.mdi-account, i.mdi-account-group"),
    });
  }

  /**
   * Get the family view menu
   */
  get familyViewMenu(): Locator {
    return this.page.locator(".v-menu__content, .v-overlay__content").filter({
      hasText: /View Mode|Personal|Family/i,
    });
  }

  /**
   * Check if family view is currently active
   */
  async isFamilyViewActive(): Promise<boolean> {
    const icon = this.familyToggleButton.locator("i");
    const iconClass = await icon.getAttribute("class");
    return iconClass?.includes("mdi-account-group") ?? false;
  }

  /**
   * Open the family view menu
   */
  async openFamilyViewMenu() {
    await this.familyToggleButton.click();
    await this.familyViewMenu.waitFor({ state: "visible" });
  }

  /**
   * Toggle to family view mode
   */
  async enableFamilyView() {
    const isActive = await this.isFamilyViewActive();
    if (!isActive) {
      await this.openFamilyViewMenu();
      await this.page.getByRole("button", { name: /Family/i }).click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Toggle to personal view mode
   */
  async disableFamilyView() {
    const isActive = await this.isFamilyViewActive();
    if (isActive) {
      await this.openFamilyViewMenu();
      await this.page.getByRole("button", { name: /Personal/i }).click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select a specific family member in family view
   */
  async selectFamilyMember(memberName: string) {
    await this.openFamilyViewMenu();
    // First ensure family view is enabled
    const familyBtn = this.familyViewMenu.getByRole("button", { name: /Family/i });
    if (await familyBtn.isVisible()) {
      await familyBtn.click();
      await this.page.waitForTimeout(300);
    }
    // Then select the member from dropdown
    const memberSelector = this.familyViewMenu.locator(".v-select");
    if (await memberSelector.isVisible()) {
      await memberSelector.click();
      await this.page.getByRole("option", { name: new RegExp(memberName, "i") }).click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select "All Members" in family view
   */
  async selectAllFamilyMembers() {
    await this.selectFamilyMember("All Members");
  }

  /**
   * Get currently selected family member name
   */
  async getSelectedFamilyMemberName(): Promise<string | null> {
    const isActive = await this.isFamilyViewActive();
    if (!isActive) return null;

    await this.openFamilyViewMenu();
    const selector = this.familyViewMenu.locator(".v-select__selection");
    const text = await selector.textContent();
    // Close the menu
    await this.page.keyboard.press("Escape");
    return text;
  }

  /**
   * Assert family view is enabled
   */
  async expectFamilyViewEnabled() {
    const isActive = await this.isFamilyViewActive();
    expect(isActive).toBeTruthy();
  }

  /**
   * Assert family view is disabled (personal view)
   */
  async expectFamilyViewDisabled() {
    const isActive = await this.isFamilyViewActive();
    expect(isActive).toBeFalsy();
  }
}
