/**
 * Insurance Page Objects
 * Updated for tab-based structure (January 2026)
 *
 * New structure:
 * - Single page: /dashboard/insurance
 * - Main tabs: Overview | Item Details | Calculator | Reports
 * - Sub-tabs in Item Details: Life | Health | Motor | Home | Travel
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

export type InsuranceType = "life" | "health" | "motor" | "home" | "travel";
export type MainTab = "overview" | "details" | "calculator" | "reports";

/**
 * Main Insurance Page - handles all tab navigation
 */
export class InsurancePage extends BasePage {
  readonly url = "/insurance";

  constructor(page: Page) {
    super(page);
  }

  // Page header
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: "Insurance", exact: true, level: 1 });
  }

  // Main tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get itemDetailsTab(): Locator {
    return this.page.getByRole("tab", { name: "Item Details" });
  }

  get calculatorTab(): Locator {
    return this.page.getByRole("tab", { name: "Calculator" });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: "Reports" });
  }

  // Sub-tabs (within Item Details)
  get lifeSubTab(): Locator {
    return this.page.getByRole("tab", { name: /Life/i });
  }

  get healthSubTab(): Locator {
    return this.page.getByRole("tab", { name: /Health/i });
  }

  get motorSubTab(): Locator {
    return this.page.getByRole("tab", { name: /Motor/i });
  }

  get homeSubTab(): Locator {
    return this.page.getByRole("tab", { name: /Home/i });
  }

  get travelSubTab(): Locator {
    return this.page.getByRole("tab", { name: /Travel/i });
  }

  // Summary cards on Overview tab
  get lifeCoverageCard(): Locator {
    return this.getSummaryCardByTitle("Life Coverage");
  }

  get healthCoverageCard(): Locator {
    return this.getSummaryCardByTitle("Health Coverage");
  }

  get annualPremiumCard(): Locator {
    return this.getSummaryCardByTitle("Annual Premium");
  }

  get activePoliciesCard(): Locator {
    return this.getSummaryCardByTitle("Active Policies");
  }

  // Add Policy button (appears in multiple tabs)
  get addPolicyButton(): Locator {
    return this.page
      .getByRole("button", {
        name: /Add.*Policy|Add Life|Add Health|Add New|First Policy/i,
      })
      .first();
  }

  // Policy form dialog
  get policyFormDialog(): Locator {
    return this.page.locator(".v-dialog--active, .v-dialog:visible").first();
  }

  // Form fields - matching InsurancePolicyForm.vue
  get policyTypeButtonGroup(): Locator {
    return this.page.locator(".v-dialog").locator(".v-btn-toggle").first();
  }

  get providerField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Insurance Provider/i);
  }

  get policyNumberField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Policy Number/i);
  }

  get policyNameField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Policy Name/i);
  }

  get sumAssuredField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Sum Assured/i);
  }

  get premiumField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Premium Amount/i);
  }

  get paymentFrequencyField(): Locator {
    return this.page
      .locator(".v-dialog")
      .locator(".v-select")
      .filter({ hasText: /Payment Frequency/i });
  }

  get taxBenefitField(): Locator {
    return this.page
      .locator(".v-dialog")
      .locator(".v-select")
      .filter({ hasText: /Tax Benefit/i });
  }

  get startDateField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Start Date/i);
  }

  get endDateField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/End Date/i);
  }

  get saveButton(): Locator {
    return this.page
      .locator(".v-dialog")
      .getByRole("button", { name: /Add Policy|Update Policy/i });
  }

  get cancelButton(): Locator {
    return this.page
      .locator(".v-dialog")
      .getByRole("button", { name: /Cancel/i });
  }

  // Calculator elements
  get hlvCalculator(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /HLV Calculator/i });
  }

  get openFullCalculatorButton(): Locator {
    return this.page.getByRole("button", {
      name: /Open Full Calculator|Open.*Calculator/i,
    });
  }

  // Reports elements
  get coverageReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Coverage/i });
  }

  get premiumReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Premium/i });
  }

  get taxReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Tax/i });
  }

  get renewalsReportTab(): Locator {
    return this.page.getByRole("tab", { name: /Renewal/i });
  }

  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export|Download|CSV/i });
  }

  // Navigation methods
  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async goToMainTab(tab: MainTab) {
    const tabLocator = {
      overview: this.overviewTab,
      details: this.itemDetailsTab,
      calculator: this.calculatorTab,
      reports: this.reportsTab,
    }[tab];

    await tabLocator.click();
    await this.page.waitForTimeout(300); // Wait for tab transition
  }

  async goToItemDetails(type?: InsuranceType) {
    await this.goToMainTab("details");
    if (type) {
      await this.goToSubTab(type);
    }
  }

  async goToSubTab(type: InsuranceType) {
    const subTabLocator = {
      life: this.lifeSubTab,
      health: this.healthSubTab,
      motor: this.motorSubTab,
      home: this.homeSubTab,
      travel: this.travelSubTab,
    }[type];

    await subTabLocator.click();
    await this.page.waitForTimeout(300); // Wait for sub-tab transition
  }

  async goToCalculator() {
    await this.goToMainTab("calculator");
  }

  async goToReports() {
    await this.goToMainTab("reports");
  }

  // Summary card helpers
  async getLifeCoverage(): Promise<string> {
    return await this.getSummaryCardValue("Life Coverage");
  }

  async getHealthCoverage(): Promise<string> {
    return await this.getSummaryCardValue("Health Coverage");
  }

  async getAnnualPremium(): Promise<string> {
    return await this.getSummaryCardValue("Annual Premium");
  }

  async getTotalCoverage(): Promise<string> {
    return await this.getLifeCoverage();
  }

  // Policy form methods
  async openAddForm() {
    await this.addPolicyButton.click();
    await this.page
      .locator(".v-dialog")
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(300);
  }

  async selectPolicyType(
    type: "Life" | "Health" | "Motor" | "Home" | "Travel"
  ) {
    await this.policyTypeButtonGroup.getByRole("button", { name: type }).click();
  }

  async fillPolicyForm(data: {
    type?: "Life" | "Health" | "Motor" | "Home" | "Travel";
    provider?: string;
    policyNumber?: string;
    policyName?: string;
    sumAssured?: number;
    premium?: number;
    paymentFrequency?: string;
    startDate?: string;
    endDate?: string;
  }) {
    if (data.type) {
      await this.selectPolicyType(data.type);
      await this.page.waitForTimeout(200);
    }

    if (data.provider) {
      await this.providerField.click();
      await this.page.waitForTimeout(300);
      const providerOption = this.page.getByRole("option", {
        name: data.provider,
      });
      await providerOption
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});
      await providerOption.click();
      await this.page.waitForTimeout(300);
    }

    if (data.policyNumber) {
      await this.policyNumberField.fill(data.policyNumber);
    }
    if (data.policyName) {
      await this.policyNameField.fill(data.policyName);
    }
    if (data.sumAssured !== undefined) {
      await this.sumAssuredField.fill(data.sumAssured.toString());
    }
    if (data.premium !== undefined) {
      await this.premiumField.fill(data.premium.toString());
    }

    if (data.paymentFrequency) {
      await this.paymentFrequencyField.click();
      await this.page.waitForTimeout(300);
      const freqOption = this.page.getByRole("option", {
        name: data.paymentFrequency,
      });
      await freqOption
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {});
      await freqOption.click();
      await this.page.waitForTimeout(200);
    }

    if (data.startDate) {
      await this.startDateField.fill(data.startDate);
    }
    if (data.endDate) {
      await this.endDateField.fill(data.endDate);
    }
  }

  async saveForm() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  // Report methods
  async selectReportTab(
    tabName: "Coverage" | "Premium" | "Tax" | "Renewals"
  ) {
    await this.page
      .getByRole("tab", { name: new RegExp(tabName, "i") })
      .click();
    await this.page.waitForTimeout(300);
  }

  // Expectations
  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectOnMainTab(tab: MainTab) {
    const tabLocator = {
      overview: this.overviewTab,
      details: this.itemDetailsTab,
      calculator: this.calculatorTab,
      reports: this.reportsTab,
    }[tab];

    await expect(tabLocator).toHaveAttribute("aria-selected", "true");
  }

  async expectOnSubTab(type: InsuranceType) {
    const subTabLocator = {
      life: this.lifeSubTab,
      health: this.healthSubTab,
      motor: this.motorSubTab,
      home: this.homeSubTab,
      travel: this.travelSubTab,
    }[type];

    await expect(subTabLocator).toHaveAttribute("aria-selected", "true");
  }

  async expectHasSummaryCards() {
    await expect(this.page.locator(".v-card").first()).toBeVisible();
  }

  async expectFormDialogVisible() {
    await expect(this.policyFormDialog).toBeVisible();
  }

  async expectFormDialogClosed() {
    await expect(this.policyFormDialog).not.toBeVisible();
  }

  async expectPolicyInList(policyName: string) {
    await expect(this.page.getByText(policyName)).toBeVisible();
  }

  async expectEmptyState() {
    await expect(
      this.page.getByText(/No.*policies|No policies found/i)
    ).toBeVisible();
  }

  async expectHasChartOrTable() {
    const reportContent = this.page
      .locator("canvas, svg, .v-data-table, .v-table, .v-btn-toggle")
      .first();
    await expect(reportContent).toBeVisible();
  }

  async expectCalculatorVisible() {
    // Look for the specific v-alert header on the Calculator tab
    await expect(
      this.page.locator('.v-alert').getByText(/Human Life Value.*Calculator/i)
    ).toBeVisible();
  }
}

// Legacy exports for backwards compatibility - all redirect to InsurancePage
export class InsuranceOverviewPage extends InsurancePage {
  constructor(page: Page) {
    super(page);
  }
}

export class LifeInsurancePage extends InsurancePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateTo() {
    await super.navigateTo();
    await this.goToItemDetails("life");
  }
}

export class HealthInsurancePage extends InsurancePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateTo() {
    await super.navigateTo();
    await this.goToItemDetails("health");
  }
}

export class InsuranceReportsPage extends InsurancePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateTo() {
    await super.navigateTo();
    await this.goToReports();
  }
}

export class InsuranceCalculatorPage extends InsurancePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateTo() {
    await super.navigateTo();
    await this.goToCalculator();
  }

  async expectWizardVisible() {
    await this.expectCalculatorVisible();
  }
}
