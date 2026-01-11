import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

/**
 * Tax Details Tab Page Object
 * Accordion container with 5 sections: Calculator, Deductions, Scenarios, Advance Tax, Reports
 */
export class TaxDetailsPage extends BasePage {
  readonly url = "/tax-planning";

  constructor(page: Page) {
    super(page);
  }

  // ============================================
  // Tab Locators
  // ============================================

  get taxDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: /Tax Details/i });
  }

  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  // ============================================
  // Accordion Section Locators
  // ============================================

  get calculatorSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Calculator/i });
  }

  get deductionsSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Deductions/i });
  }

  get scenariosSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Scenarios/i });
  }

  get advanceTaxSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Advance Tax/i });
  }

  get reportsSection(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Reports/i });
  }

  // Accordion headers (clickable)
  get calculatorHeader(): Locator {
    return this.calculatorSection.locator(".v-expansion-panel-title");
  }

  get deductionsHeader(): Locator {
    return this.deductionsSection.locator(".v-expansion-panel-title");
  }

  get scenariosHeader(): Locator {
    return this.scenariosSection.locator(".v-expansion-panel-title");
  }

  get advanceTaxHeader(): Locator {
    return this.advanceTaxSection.locator(".v-expansion-panel-title");
  }

  get reportsHeader(): Locator {
    return this.reportsSection.locator(".v-expansion-panel-title");
  }

  // Expand/Collapse All buttons
  get expandAllButton(): Locator {
    return this.page.getByRole("button", { name: /Expand All/i });
  }

  get collapseAllButton(): Locator {
    return this.page.getByRole("button", { name: /Collapse All/i });
  }

  // ============================================
  // Navigation
  // ============================================

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
    await this.clickTaxDetailsTab();
  }

  async clickTaxDetailsTab() {
    await this.taxDetailsTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickOverviewTab() {
    await this.overviewTab.click();
    await this.page.waitForTimeout(300);
  }

  // ============================================
  // Accordion Actions
  // ============================================

  async expandCalculator() {
    const isExpanded = await this.calculatorSection.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await this.calculatorHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandDeductions() {
    const isExpanded = await this.deductionsSection.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await this.deductionsHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandScenarios() {
    const isExpanded = await this.scenariosSection.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await this.scenariosHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandAdvanceTax() {
    const isExpanded = await this.advanceTaxSection.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await this.advanceTaxHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandReports() {
    const isExpanded = await this.reportsSection.getAttribute("aria-expanded");
    if (isExpanded !== "true") {
      await this.reportsHeader.click();
      await this.page.waitForTimeout(300);
    }
  }

  async expandAll() {
    const expandBtn = this.expandAllButton;
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async collapseAll() {
    const collapseBtn = this.collapseAllButton;
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  // ============================================
  // Assertions
  // ============================================

  async expectPageLoaded() {
    await expect(this.taxDetailsTab).toBeVisible();
  }

  async expectTaxDetailsTabActive() {
    await expect(this.taxDetailsTab).toHaveAttribute("aria-selected", "true");
  }

  async expectAllSectionsVisible() {
    await expect(this.calculatorSection).toBeVisible();
    await expect(this.deductionsSection).toBeVisible();
    await expect(this.scenariosSection).toBeVisible();
    await expect(this.advanceTaxSection).toBeVisible();
    await expect(this.reportsSection).toBeVisible();
  }

  async expectCalculatorExpanded() {
    await expect(this.calculatorSection.locator(".v-expansion-panel-text")).toBeVisible();
  }

  async expectDeductionsExpanded() {
    await expect(this.deductionsSection.locator(".v-expansion-panel-text")).toBeVisible();
  }

  async expectScenariosExpanded() {
    await expect(this.scenariosSection.locator(".v-expansion-panel-text")).toBeVisible();
  }

  async expectAdvanceTaxExpanded() {
    await expect(this.advanceTaxSection.locator(".v-expansion-panel-text")).toBeVisible();
  }

  async expectReportsExpanded() {
    await expect(this.reportsSection.locator(".v-expansion-panel-text")).toBeVisible();
  }
}
