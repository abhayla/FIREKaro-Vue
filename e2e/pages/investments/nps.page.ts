import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * NPS Page Object
 * Handles National Pension System investments
 */
export class NpsPage extends BasePage {
  readonly url = "/investments/nps";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments/i });
  }

  // Summary cards
  get totalBalanceCard(): Locator {
    return this.getSummaryCardByTitle("Total Balance");
  }

  get totalContributionCard(): Locator {
    return this.getSummaryCardByTitle("Total Contribution");
  }

  get returnsCard(): Locator {
    return this.getSummaryCardByTitle("Returns");
  }

  get tax80CCDCard(): Locator {
    return this.getSummaryCardByTitle("80CCD(1B)");
  }

  // NPS Account details card
  get accountDetailsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /NPS Account|Account Details/i });
  }

  get pranNumberDisplay(): Locator {
    return this.accountDetailsCard.locator("text=/PRAN/i").locator("~ .text-body-1, + .text-body-1");
  }

  get accountTypeDisplay(): Locator {
    return this.accountDetailsCard.locator("text=/Account Type|Tier/i").locator("~ .text-body-1, + .text-body-1");
  }

  // Asset allocation section
  get allocationSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Asset Allocation|Allocation/i });
  }

  get equityAllocationDisplay(): Locator {
    return this.allocationSection.locator("text=/Equity|Class E/i").locator("~ .text-body-1, + .text-body-1");
  }

  get corporateBondAllocationDisplay(): Locator {
    return this.allocationSection.locator("text=/Corporate Bond|Class C/i").locator("~ .text-body-1, + .text-body-1");
  }

  get governmentBondAllocationDisplay(): Locator {
    return this.allocationSection.locator("text=/Government|Class G/i").locator("~ .text-body-1, + .text-body-1");
  }

  // Edit button
  get editButton(): Locator {
    return this.page.getByRole("button", { name: /Edit|Update/i });
  }

  // Form dialog
  get npsFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /NPS|National Pension/i });
  }

  // Form fields
  get pranField(): Locator {
    return this.page.getByRole("textbox", { name: /PRAN|Account Number/i });
  }

  get currentBalanceField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Current Balance|Balance/i });
  }

  get annualContributionField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Annual Contribution|Yearly/i });
  }

  get equityPercentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Equity.*%|Class E/i });
  }

  get corporateBondPercentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Corporate.*%|Class C/i });
  }

  get govBondPercentField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Government.*%|Class G/i });
  }

  // Form buttons
  get saveButton(): Locator {
    return this.npsFormDialog.getByRole("button", { name: /Save|Update/i });
  }

  get cancelButton(): Locator {
    return this.npsFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Projection section
  get projectionSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Projection|Calculator/i });
  }

  get projectedCorpusDisplay(): Locator {
    return this.projectionSection.locator(".text-h4, .text-h5, .text-currency").first();
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

  async openEditForm() {
    await this.editButton.click();
    await this.npsFormDialog.waitFor({ state: "visible" });
  }

  async updateNpsDetails(data: {
    pran?: string;
    currentBalance?: number;
    annualContribution?: number;
    equityPercent?: number;
    corporateBondPercent?: number;
    govBondPercent?: number;
  }) {
    await this.openEditForm();

    if (data.pran) {
      await this.pranField.clear();
      await this.pranField.fill(data.pran);
    }

    if (data.currentBalance !== undefined) {
      await this.currentBalanceField.clear();
      await this.currentBalanceField.fill(data.currentBalance.toString());
    }

    if (data.annualContribution !== undefined) {
      await this.annualContributionField.clear();
      await this.annualContributionField.fill(data.annualContribution.toString());
    }

    if (data.equityPercent !== undefined) {
      await this.equityPercentField.clear();
      await this.equityPercentField.fill(data.equityPercent.toString());
    }

    if (data.corporateBondPercent !== undefined) {
      await this.corporateBondPercentField.clear();
      await this.corporateBondPercentField.fill(data.corporateBondPercent.toString());
    }

    if (data.govBondPercent !== undefined) {
      await this.govBondPercentField.clear();
      await this.govBondPercentField.fill(data.govBondPercent.toString());
    }

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
  // Getters
  // ============================================

  async getTotalBalance(): Promise<string> {
    return await this.getSummaryCardValue("Total Balance");
  }

  async getTotalContribution(): Promise<string> {
    return await this.getSummaryCardValue("Total Contribution");
  }

  async getReturns(): Promise<string> {
    return await this.getSummaryCardValue("Returns");
  }

  async get80CCDBenefit(): Promise<string> {
    return await this.getSummaryCardValue("80CCD(1B)");
  }

  async getProjectedCorpus(): Promise<string> {
    return (await this.projectedCorpusDisplay.textContent()) || "₹0";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Investments/i })).toBeVisible();
    await expect(this.page.getByRole("tab", { name: /NPS/i })).toHaveAttribute("aria-selected", "true");
  }

  async expectAccountDetailsVisible() {
    await expect(this.accountDetailsCard).toBeVisible();
  }

  async expectAllocationSectionVisible() {
    await expect(this.allocationSection).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.npsFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.npsFormDialog).not.toBeVisible();
  }

  async expectTotalBalance(expectedAmount: string) {
    await expect(this.totalBalanceCard.locator(".text-h4, .text-h5, .text-currency")).toContainText(expectedAmount);
  }
}
