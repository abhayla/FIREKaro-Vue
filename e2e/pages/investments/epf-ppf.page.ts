import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * EPF/PPF Page Object
 * Handles Employee Provident Fund and Public Provident Fund
 */
export class EpfPpfPage extends BasePage {
  readonly url = "/dashboard/investments/epf-ppf";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  // EPF Section
  get epfCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /EPF|Employee Provident/i });
  }

  get epfBalanceDisplay(): Locator {
    return this.epfCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  get epfContributionField(): Locator {
    return this.page.getByRole("spinbutton", { name: /EPF.*Contribution|Employee Contribution/i });
  }

  get employerContributionField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Employer.*Contribution/i });
  }

  get epfInterestRateDisplay(): Locator {
    return this.epfCard.locator("text=/Interest Rate|8.25%/i");
  }

  // PPF Section
  get ppfCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /PPF|Public Provident/i });
  }

  get ppfBalanceDisplay(): Locator {
    return this.ppfCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  get ppfContributionField(): Locator {
    return this.page.getByRole("spinbutton", { name: /PPF.*Contribution|Annual Contribution/i });
  }

  get ppfInterestRateDisplay(): Locator {
    return this.ppfCard.locator("text=/Interest Rate|7.1%/i");
  }

  get ppfMaturityDateDisplay(): Locator {
    return this.ppfCard.locator("text=/Maturity|Matures/i");
  }

  // VPF Section
  get vpfCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /VPF|Voluntary/i });
  }

  get vpfBalanceDisplay(): Locator {
    return this.vpfCard.locator(".text-h4, .text-h5, .text-currency").first();
  }

  // Summary cards
  get totalBalanceCard(): Locator {
    return this.getSummaryCardByTitle("Total Balance");
  }

  get annualContributionCard(): Locator {
    return this.getSummaryCardByTitle("Annual Contribution");
  }

  get projectedMaturityCard(): Locator {
    return this.getSummaryCardByTitle("Projected Maturity");
  }

  // Edit buttons
  get editEpfButton(): Locator {
    return this.epfCard.getByRole("button", { name: /Edit|Update/i });
  }

  get editPpfButton(): Locator {
    return this.ppfCard.getByRole("button", { name: /Edit|Update/i });
  }

  // Form dialog
  get providentFundFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /EPF|PPF|Provident Fund/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.providentFundFormDialog.getByRole("button", { name: /Save|Update/i });
  }

  get cancelButton(): Locator {
    return this.providentFundFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Projection calculator
  get projectionSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Projection|Calculator/i });
  }

  get retirementAgeField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Retirement Age|Target Age/i });
  }

  get calculateProjectionButton(): Locator {
    return this.page.getByRole("button", { name: /Calculate|Project/i });
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

  async editEpf() {
    await this.editEpfButton.click();
    await this.providentFundFormDialog.waitFor({ state: "visible" });
  }

  async editPpf() {
    await this.editPpfButton.click();
    await this.providentFundFormDialog.waitFor({ state: "visible" });
  }

  async updateEpfContribution(employeeContribution: number, employerContribution?: number) {
    await this.editEpf();

    await this.epfContributionField.clear();
    await this.epfContributionField.fill(employeeContribution.toString());

    if (employerContribution !== undefined && await this.employerContributionField.isVisible()) {
      await this.employerContributionField.clear();
      await this.employerContributionField.fill(employerContribution.toString());
    }

    await this.saveForm();
  }

  async updatePpfContribution(annualContribution: number) {
    await this.editPpf();

    await this.ppfContributionField.clear();
    await this.ppfContributionField.fill(annualContribution.toString());

    await this.saveForm();
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
  // Projection Actions
  // ============================================

  async calculateProjection(retirementAge: number) {
    await this.retirementAgeField.clear();
    await this.retirementAgeField.fill(retirementAge.toString());
    await this.calculateProjectionButton.click();
    await this.page.waitForTimeout(500);
  }

  // ============================================
  // Getters
  // ============================================

  async getEpfBalance(): Promise<string> {
    return (await this.epfBalanceDisplay.textContent()) || "₹0";
  }

  async getPpfBalance(): Promise<string> {
    return (await this.ppfBalanceDisplay.textContent()) || "₹0";
  }

  async getVpfBalance(): Promise<string> {
    return (await this.vpfBalanceDisplay.textContent()) || "₹0";
  }

  async getTotalBalance(): Promise<string> {
    return await this.getSummaryCardValue("Total Balance");
  }

  async getProjectedMaturity(): Promise<string> {
    return await this.getSummaryCardValue("Projected Maturity");
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /EPF.*PPF|Provident/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectEpfCardVisible() {
    await expect(this.epfCard).toBeVisible();
  }

  async expectPpfCardVisible() {
    await expect(this.ppfCard).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.providentFundFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.providentFundFormDialog).not.toBeVisible();
  }

  async expectEpfBalance(expectedAmount: string) {
    await expect(this.epfBalanceDisplay).toContainText(expectedAmount);
  }

  async expectPpfBalance(expectedAmount: string) {
    await expect(this.ppfBalanceDisplay).toContainText(expectedAmount);
  }
}
