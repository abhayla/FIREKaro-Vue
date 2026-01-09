/**
 * Protection (Insurance) Page Objects
 * Updated to match backend API schema (January 2026)
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

export class ProtectionOverviewPage extends BasePage {
  readonly url = "/dashboard/protection";

  constructor(page: Page) {
    super(page);
  }

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Protection|Insurance/i });
  }

  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: "Overview" });
  }

  get lifeTab(): Locator {
    return this.page.getByRole("tab", { name: /Life/i });
  }

  get healthTab(): Locator {
    return this.page.getByRole("tab", { name: /Health/i });
  }

  get otherTab(): Locator {
    return this.page.getByRole("tab", { name: /Other/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Reports/i });
  }

  get calculatorTab(): Locator {
    return this.page.getByRole("tab", { name: /Calculator/i });
  }

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

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async getLifeCoverage(): Promise<string> {
    // Overview page shows "Life Coverage" card from InsuranceSummaryCard component
    return await this.getSummaryCardValue("Life Coverage");
  }

  async getHealthCoverage(): Promise<string> {
    return await this.getSummaryCardValue("Health Coverage");
  }

  async getAnnualPremium(): Promise<string> {
    return await this.getSummaryCardValue("Annual Premium");
  }

  // Alias for backwards compatibility - uses Life Coverage
  async getTotalCoverage(): Promise<string> {
    return await this.getLifeCoverage();
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectHasSummaryCards() {
    // Check that summary cards exist (may show 0 if no policies)
    await expect(this.page.locator('.v-card').first()).toBeVisible();
  }
}

export class LifeInsurancePage extends BasePage {
  readonly url = "/dashboard/protection/life";

  constructor(page: Page) {
    super(page);
  }

  get addPolicyButton(): Locator {
    // Match "Add Life Policy" or "Add Your First Policy" buttons on life.vue page
    return this.page.getByRole("button", { name: /Add.*Policy|Add Life|Add New|First Policy/i }).first();
  }

  get policyFormDialog(): Locator {
    // Match any visible v-dialog with insurance form content
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
    return this.page.locator(".v-dialog").locator('.v-select').filter({ hasText: /Payment Frequency/i });
  }

  get taxBenefitField(): Locator {
    return this.page.locator(".v-dialog").locator('.v-select').filter({ hasText: /Tax Benefit/i });
  }

  get startDateField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Start Date/i);
  }

  get endDateField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/End Date/i);
  }

  get saveButton(): Locator {
    return this.page.locator(".v-dialog").getByRole("button", { name: /Add Policy|Update Policy/i });
  }

  get cancelButton(): Locator {
    return this.page.locator(".v-dialog").getByRole("button", { name: /Cancel/i });
  }

  get deleteDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Delete.*Policy|Confirm/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async openAddForm() {
    await this.addPolicyButton.click();
    // Wait for dialog to appear
    await this.page.locator(".v-dialog").first().waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(300); // Wait for dialog animation
  }

  async selectPolicyType(type: 'Life' | 'Health' | 'Motor' | 'Home' | 'Travel') {
    await this.policyTypeButtonGroup.getByRole("button", { name: type }).click();
  }

  async fillPolicyForm(data: {
    type?: 'Life' | 'Health' | 'Motor' | 'Home' | 'Travel';
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
      // Click to open autocomplete, wait for it to open, then select
      await this.providerField.click();
      await this.page.waitForTimeout(300);
      const providerOption = this.page.getByRole("option", { name: data.provider });
      await providerOption.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      await providerOption.click();
      // Wait for dropdown to close
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
      // Click to open dropdown, wait for options to appear
      await this.paymentFrequencyField.click();
      await this.page.waitForTimeout(300);
      const freqOption = this.page.getByRole("option", { name: data.paymentFrequency });
      await freqOption.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
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

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection|Insurance/i })).toBeVisible();
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
    await expect(this.page.getByText(/No.*policies|No policies found/i)).toBeVisible();
  }
}

export class HealthInsurancePage extends BasePage {
  readonly url = "/dashboard/protection/health";

  constructor(page: Page) {
    super(page);
  }

  get addPolicyButton(): Locator {
    // Match "Add Health Policy" or "Add Your First Policy" buttons on health.vue page
    return this.page.getByRole("button", { name: /Add.*Policy|Add Health|Add New|First Policy/i }).first();
  }

  get policyFormDialog(): Locator {
    // Match any visible v-dialog with insurance form content
    return this.page.locator(".v-dialog--active, .v-dialog:visible").first();
  }

  // Form fields - same structure as LifeInsurancePage
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

  // Health-specific fields
  get coverageTypeField(): Locator {
    return this.page.locator(".v-dialog").locator('.v-select').filter({ hasText: /Coverage Type/i });
  }

  get roomRentField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Room Rent/i);
  }

  get coPaymentField(): Locator {
    return this.page.locator(".v-dialog").getByLabel(/Co-payment/i);
  }

  get saveButton(): Locator {
    return this.page.locator(".v-dialog").getByRole("button", { name: /Add Policy|Update Policy/i });
  }

  get cancelButton(): Locator {
    return this.page.locator(".v-dialog").getByRole("button", { name: /Cancel/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async openAddForm() {
    await this.addPolicyButton.click();
    // Wait for dialog to appear
    await this.page.locator(".v-dialog").first().waitFor({ state: "visible", timeout: 5000 });
    await this.page.waitForTimeout(300); // Wait for dialog animation
  }

  async selectPolicyType(type: 'Life' | 'Health' | 'Motor' | 'Home' | 'Travel') {
    await this.policyTypeButtonGroup.getByRole("button", { name: type }).click();
  }

  async fillPolicyForm(data: {
    type?: 'Life' | 'Health' | 'Motor' | 'Home' | 'Travel';
    provider?: string;
    policyNumber?: string;
    policyName?: string;
    sumAssured?: number;
    premium?: number;
    coverageType?: string;
    roomRent?: number;
    coPayment?: number;
    startDate?: string;
    endDate?: string;
  }) {
    if (data.type) {
      await this.selectPolicyType(data.type);
      await this.page.waitForTimeout(200);
    }

    if (data.provider) {
      // Click to open autocomplete, wait for it to open, then select
      await this.providerField.click();
      await this.page.waitForTimeout(300);
      const providerOption = this.page.getByRole("option", { name: data.provider });
      await providerOption.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      await providerOption.click();
      // Wait for dropdown to close
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

    if (data.coverageType) {
      // Click to open dropdown, wait for options to appear
      await this.coverageTypeField.click();
      await this.page.waitForTimeout(300);
      const coverageOption = this.page.getByRole("option", { name: data.coverageType });
      await coverageOption.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
      await coverageOption.click();
      await this.page.waitForTimeout(200);
    }

    if (data.startDate) {
      await this.policyFormDialog.getByLabel(/Start Date/i).fill(data.startDate);
    }
    if (data.endDate) {
      await this.policyFormDialog.getByLabel(/End Date/i).fill(data.endDate);
    }
  }

  async saveForm() {
    await this.saveButton.click();
    await this.page.waitForTimeout(500);
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection|Insurance/i })).toBeVisible();
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
    await expect(this.page.getByText(/No.*policies|No policies found/i)).toBeVisible();
  }
}

export class ProtectionReportsPage extends BasePage {
  readonly url = "/dashboard/protection/reports";

  constructor(page: Page) {
    super(page);
  }

  get coverageChart(): Locator {
    return this.page.locator("canvas, svg").first();
  }

  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export|Download|CSV/i });
  }

  get reportTabs(): Locator {
    return this.page.locator(".v-tabs");
  }

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

  async navigateTo() {
    await this.goto(this.url);
    // Wait for heading or report controls to be visible
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.getByRole("heading", { name: /Protection/i }).waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  async selectReportTab(tabName: 'Coverage' | 'Premium' | 'Tax' | 'Renewals') {
    await this.page.getByRole("tab", { name: new RegExp(tabName, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection/i })).toBeVisible();
  }

  async expectHasChartOrTable() {
    // Reports page should have either a chart, a data table, or report selector buttons
    const reportContent = this.page.locator("canvas, svg, .v-data-table, .v-table, .v-btn-toggle").first();
    await expect(reportContent).toBeVisible();
  }
}

export class ProtectionCalculatorPage extends BasePage {
  readonly url = "/dashboard/protection/calculator";

  constructor(page: Page) {
    super(page);
  }

  get wizardStepper(): Locator {
    return this.page.locator(".v-stepper");
  }

  get nextButton(): Locator {
    return this.page.getByRole("button", { name: /Next|Continue/i });
  }

  get backButton(): Locator {
    return this.page.getByRole("button", { name: /Back|Previous/i });
  }

  get calculateButton(): Locator {
    // Match "Open Full Calculator" button on calculator.vue page
    return this.page.getByRole("button", { name: /Calculate|Get Results|Open.*Calculator/i });
  }

  get resultsSection(): Locator {
    return this.page.locator('[data-testid="hlv-results"], .v-card').filter({ hasText: /Recommended|Coverage|Gap/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    // Wait for heading to be visible
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.getByRole("heading", { name: /Protection/i }).waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection/i })).toBeVisible();
  }

  async expectWizardVisible() {
    await expect(this.wizardStepper).toBeVisible();
  }
}
