import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Regime Comparison Page Object
 * Handles Old vs New regime comparison on Overview tab and Tax Calculator
 *
 * Structure:
 * - Overview Tab: Shows REGIME COMPARISON card with side-by-side Old/New regime boxes
 * - Tax Details Tab > Calculator: Has regime toggle buttons (Old/New) and detailed inputs
 */
export class RegimeComparisonPage extends BasePage {
  readonly url = "/tax-planning";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Tab Locators
  // ============================================

  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get taxDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Tax Details/i });
  }

  // ============================================
  // Overview Tab - Regime Comparison Card
  // ============================================

  get regimeComparisonCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /REGIME COMPARISON/i });
  }

  get regimeComparisonTitle(): Locator {
    return this.page.locator(".v-card-title").filter({ hasText: /REGIME COMPARISON/i });
  }

  get oldRegimeBox(): Locator {
    return this.page.locator(".regime-box").filter({ hasText: /Old Regime/i });
  }

  get newRegimeBox(): Locator {
    return this.page.locator(".regime-box").filter({ hasText: /New Regime/i });
  }

  get betterRegimeBanner(): Locator {
    return this.regimeComparisonCard.locator(".v-alert").filter({ hasText: /is better for you/i });
  }

  get savingsText(): Locator {
    return this.betterRegimeBanner.locator("text=/Save ₹/i");
  }

  get viewDetailedBreakdownButton(): Locator {
    return this.regimeComparisonCard.getByRole("button", { name: /View Detailed Breakdown/i });
  }

  get emptyStateMessage(): Locator {
    return this.regimeComparisonCard.locator("text=/Add income data to see regime comparison/i");
  }

  // ============================================
  // Tax Details Tab - Calculator Regime Selector
  // ============================================

  get calculatorSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ has: this.page.locator(".text-subtitle-1", { hasText: "Tax Calculator" }) });
  }

  get fromDataButton(): Locator {
    return this.page.getByRole("button", { name: /From Data/i });
  }

  get manualButton(): Locator {
    return this.page.getByRole("button", { name: /Manual/i });
  }

  get resetButton(): Locator {
    return this.page.getByRole("button", { name: /Reset/i });
  }

  get oldRegimeToggle(): Locator {
    return this.page.getByRole("button", { name: /^Old$/i });
  }

  get newRegimeToggle(): Locator {
    return this.page.getByRole("button", { name: /^New$/i });
  }

  get grossIncomeInput(): Locator {
    return this.page.getByRole("spinbutton", { name: /Gross Total Income/i });
  }

  get quickSelectChips(): Locator {
    return this.page.locator(".v-chip-group .v-chip");
  }

  // Calculator - Deduction Inputs (visible in Old regime / Manual mode)
  get section80CInput(): Locator {
    return this.page.locator("input").filter({ has: this.page.locator("label:has-text('Section 80C')") });
  }

  get section80DInput(): Locator {
    return this.page.locator("input").filter({ has: this.page.locator("label:has-text('Section 80D')") });
  }

  // Calculator Results
  get taxBreakdownCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Tax Calculation Breakdown/i });
  }

  get regimeComparisonResultCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Regime Comparison/i }).last();
  }

  get noCalculationDataMessage(): Locator {
    return this.page.locator("text=/No tax calculation data available/i");
  }

  get noComparisonDataMessage(): Locator {
    return this.page.locator("text=/No comparison data available/i");
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async navigateToCalculator() {
    await this.goto(this.url);
    await this.waitForPageLoad();
    await this.taxDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Actions
  // ============================================

  async selectOldRegime() {
    await this.oldRegimeToggle.click();
    await this.page.waitForTimeout(200);
  }

  async selectNewRegime() {
    await this.newRegimeToggle.click();
    await this.page.waitForTimeout(200);
  }

  async switchToManualMode() {
    await this.manualButton.click();
    await this.page.waitForTimeout(200);
  }

  async switchToFromDataMode() {
    await this.fromDataButton.click();
    await this.page.waitForTimeout(200);
  }

  async selectQuickIncome(amount: string) {
    const chip = this.quickSelectChips.filter({ hasText: amount });
    await chip.click();
    await this.page.waitForTimeout(200);
  }

  async setGrossIncome(amount: number) {
    await this.grossIncomeInput.fill(amount.toString());
    await this.page.waitForTimeout(200);
  }

  // ============================================
  // Getters
  // ============================================

  async getOldRegimeTaxAmount(): Promise<string> {
    const text = await this.oldRegimeBox.locator(".text-currency").textContent();
    return text || "₹0";
  }

  async getNewRegimeTaxAmount(): Promise<string> {
    const text = await this.newRegimeBox.locator(".text-currency").textContent();
    return text || "₹0";
  }

  async getSavingsAmount(): Promise<string> {
    const text = await this.savingsText.textContent();
    return text || "₹0";
  }

  async getRecommendedRegime(): Promise<"Old" | "New" | null> {
    const bannerText = await this.betterRegimeBanner.textContent().catch(() => "");
    if (bannerText.includes("New Regime")) return "New";
    if (bannerText.includes("Old Regime")) return "Old";
    return null;
  }

  async getOldRegimeDeductionsTotal(): Promise<string> {
    // Deductions total is in the calculator section when expanded
    const deductionsChip = this.page.locator(".v-chip").filter({ hasText: /Total:/i });
    const text = await deductionsChip.textContent().catch(() => "₹0");
    return text || "₹0";
  }

  parseINR(text: string): number {
    const cleaned = text.replace(/[₹,\s]/g, "");
    return parseFloat(cleaned) || 0;
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Tax Planning/i })).toBeVisible();
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectRegimeComparisonCardVisible() {
    await expect(this.regimeComparisonTitle).toBeVisible();
  }

  async expectBothRegimesVisible() {
    // Check if comparison data is loaded (regime boxes visible)
    await expect(this.oldRegimeBox).toBeVisible();
    await expect(this.newRegimeBox).toBeVisible();
  }

  async expectEmptyState() {
    await expect(this.emptyStateMessage).toBeVisible();
  }

  async expectSavingsDisplayed() {
    await expect(this.savingsText).toBeVisible();
  }

  async expectRecommendationShown() {
    await expect(this.betterRegimeBanner).toBeVisible();
  }

  async expectCalculatorSectionVisible() {
    await expect(this.calculatorSection).toBeVisible();
  }

  async expectRegimeToggleVisible() {
    await expect(this.oldRegimeToggle).toBeVisible();
    await expect(this.newRegimeToggle).toBeVisible();
  }

  async expectQuickSelectVisible() {
    await expect(this.quickSelectChips.first()).toBeVisible();
  }

  // Legacy support
  get showDetailedBreakdownToggle(): Locator {
    return this.page.getByRole("switch", { name: /Detailed|Breakdown/i });
  }

  async toggleDetailedBreakdown() {
    if (await this.showDetailedBreakdownToggle.isVisible()) {
      await this.showDetailedBreakdownToggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expectDeductionBreakdownVisible() {
    // In new UI, deduction breakdown is in calculator section
    await expect(this.page.locator("text=/Section 80C|Deductions/i")).toBeVisible();
  }

  // Aliases for backward compatibility
  get oldRegimeSection(): Locator {
    return this.oldRegimeBox;
  }

  get newRegimeSection(): Locator {
    return this.newRegimeBox;
  }

  get oldRegimeTax(): Locator {
    return this.oldRegimeBox.locator(".text-currency");
  }

  get newRegimeTax(): Locator {
    return this.newRegimeBox.locator(".text-currency");
  }

  get savingsDisplay(): Locator {
    return this.savingsText;
  }

  get recommendedRegimeBadge(): Locator {
    return this.betterRegimeBanner;
  }

  get deductionBreakdownTable(): Locator {
    return this.page.locator(".v-data-table").filter({ hasText: /Deduction|Section/i });
  }
}
