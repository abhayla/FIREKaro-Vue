import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Portfolio Page Object
 * Handles overall portfolio management and asset allocation
 */
export class PortfolioPage extends BasePage {
  readonly url = "/investments/portfolio";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Locators
  // ============================================

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Investments|Portfolio/i });
  }

  // Portfolio value summary
  get portfolioValueCard(): Locator {
    return this.getSummaryCardByTitle("Portfolio Value");
  }

  get dayChangeCard(): Locator {
    return this.getSummaryCardByTitle("Day Change");
  }

  get totalGainCard(): Locator {
    return this.getSummaryCardByTitle("Total Gain");
  }

  // Asset allocation section
  get allocationSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Asset Allocation|Allocation/i });
  }

  get allocationChart(): Locator {
    return this.allocationSection.locator("canvas, svg");
  }

  // Allocation breakdown
  get equityAllocation(): Locator {
    return this.page.locator(".v-list-item, .allocation-item").filter({ hasText: /Equity|Stocks/i });
  }

  get debtAllocation(): Locator {
    return this.page.locator(".v-list-item, .allocation-item").filter({ hasText: /Debt|Fixed Income/i });
  }

  get goldAllocation(): Locator {
    return this.page.locator(".v-list-item, .allocation-item").filter({ hasText: /Gold/i });
  }

  get realEstateAllocation(): Locator {
    return this.page.locator(".v-list-item, .allocation-item").filter({ hasText: /Real Estate|Property/i });
  }

  // Target allocation settings
  get targetAllocationButton(): Locator {
    return this.page.getByRole("button", { name: /Set Target|Edit Target/i });
  }

  get targetAllocationDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Target Allocation/i });
  }

  // Target allocation fields
  get targetEquityField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Equity.*%|Target Equity/i });
  }

  get targetDebtField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Debt.*%|Target Debt/i });
  }

  get targetGoldField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Gold.*%|Target Gold/i });
  }

  get targetRealEstateField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Real Estate.*%|Target Property/i });
  }

  // Rebalancing section
  get rebalanceSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Rebalance|Rebalancing/i });
  }

  get rebalanceButton(): Locator {
    return this.page.getByRole("button", { name: /Rebalance|View Rebalance/i });
  }

  // Holdings list
  get holdingsList(): Locator {
    return this.page.locator(".v-data-table, .holdings-list");
  }

  // Form buttons
  get saveButton(): Locator {
    return this.targetAllocationDialog.getByRole("button", { name: /Save|Update/i });
  }

  get cancelButton(): Locator {
    return this.targetAllocationDialog.getByRole("button", { name: /Cancel/i });
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

  async openTargetAllocationDialog() {
    await this.targetAllocationButton.click();
    await this.targetAllocationDialog.waitFor({ state: "visible" });
  }

  async setTargetAllocation(allocation: {
    equity?: number;
    debt?: number;
    gold?: number;
    realEstate?: number;
  }) {
    await this.openTargetAllocationDialog();

    if (allocation.equity !== undefined) {
      await this.targetEquityField.clear();
      await this.targetEquityField.fill(allocation.equity.toString());
    }

    if (allocation.debt !== undefined) {
      await this.targetDebtField.clear();
      await this.targetDebtField.fill(allocation.debt.toString());
    }

    if (allocation.gold !== undefined) {
      await this.targetGoldField.clear();
      await this.targetGoldField.fill(allocation.gold.toString());
    }

    if (allocation.realEstate !== undefined) {
      await this.targetRealEstateField.clear();
      await this.targetRealEstateField.fill(allocation.realEstate.toString());
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

  async getPortfolioValue(): Promise<string> {
    return await this.getSummaryCardValue("Portfolio Value");
  }

  async getDayChange(): Promise<string> {
    return await this.getSummaryCardValue("Day Change");
  }

  async getTotalGain(): Promise<string> {
    return await this.getSummaryCardValue("Total Gain");
  }

  async getEquityPercentage(): Promise<string> {
    const percentText = await this.equityAllocation.locator("text=/%/").textContent();
    return percentText || "0%";
  }

  async getDebtPercentage(): Promise<string> {
    const percentText = await this.debtAllocation.locator("text=/%/").textContent();
    return percentText || "0%";
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectAllocationChartVisible() {
    await expect(this.allocationChart).toBeVisible();
  }

  async expectAllocationSectionVisible() {
    await expect(this.allocationSection).toBeVisible();
  }

  async expectTargetDialogVisible() {
    await expect(this.targetAllocationDialog).toBeVisible();
  }

  async expectTargetDialogClosed() {
    await expect(this.targetAllocationDialog).not.toBeVisible();
  }

  async expectRebalanceSectionVisible() {
    await expect(this.rebalanceSection).toBeVisible();
  }
}
