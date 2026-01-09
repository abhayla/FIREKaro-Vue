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

  get totalCoverageCard(): Locator {
    return this.getSummaryCardByTitle("Total Coverage");
  }

  get annualPremiumCard(): Locator {
    return this.getSummaryCardByTitle("Annual Premium");
  }

  get lifeCoverageCard(): Locator {
    return this.getSummaryCardByTitle("Life Coverage");
  }

  get healthCoverageCard(): Locator {
    return this.getSummaryCardByTitle("Health Coverage");
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async getTotalCoverage(): Promise<string> {
    return await this.getSummaryCardValue("Total Coverage");
  }

  async getAnnualPremium(): Promise<string> {
    return await this.getSummaryCardValue("Annual Premium");
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
    return this.page.getByRole("button", { name: /Add Policy|Add Life|Add New/i });
  }

  get policyFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Policy|Edit.*Policy|New Policy/i });
  }

  // Form fields - matching InsurancePolicyForm.vue
  get policyTypeButtonGroup(): Locator {
    return this.policyFormDialog.locator(".v-btn-toggle");
  }

  get providerField(): Locator {
    return this.policyFormDialog.locator('.v-autocomplete').filter({ hasText: /Provider/i });
  }

  get policyNumberField(): Locator {
    return this.policyFormDialog.getByLabel(/Policy Number/i);
  }

  get policyNameField(): Locator {
    return this.policyFormDialog.getByLabel(/Policy Name/i);
  }

  get sumAssuredField(): Locator {
    return this.policyFormDialog.getByLabel(/Sum Assured/i);
  }

  get premiumField(): Locator {
    return this.policyFormDialog.getByLabel(/Premium Amount/i);
  }

  get paymentFrequencyField(): Locator {
    return this.policyFormDialog.locator('.v-select').filter({ hasText: /Payment Frequency/i });
  }

  get taxBenefitField(): Locator {
    return this.policyFormDialog.locator('.v-select').filter({ hasText: /Tax Benefit/i });
  }

  get startDateField(): Locator {
    return this.policyFormDialog.getByLabel(/Start Date/i);
  }

  get endDateField(): Locator {
    return this.policyFormDialog.getByLabel(/End Date/i);
  }

  get saveButton(): Locator {
    return this.policyFormDialog.getByRole("button", { name: /Add Policy|Update Policy/i });
  }

  get cancelButton(): Locator {
    return this.policyFormDialog.getByRole("button", { name: /Cancel/i });
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
    await this.policyFormDialog.waitFor({ state: "visible" });
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
    }
    if (data.provider) {
      await this.providerField.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.provider }).click();
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
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.paymentFrequency }).click();
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
    return this.page.getByRole("button", { name: /Add Policy|Add Health|Add New/i });
  }

  get policyFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Policy|Edit.*Policy|New Policy/i });
  }

  // Form fields - same structure as LifeInsurancePage
  get policyTypeButtonGroup(): Locator {
    return this.policyFormDialog.locator(".v-btn-toggle");
  }

  get providerField(): Locator {
    return this.policyFormDialog.locator('.v-autocomplete').filter({ hasText: /Provider/i });
  }

  get policyNumberField(): Locator {
    return this.policyFormDialog.getByLabel(/Policy Number/i);
  }

  get policyNameField(): Locator {
    return this.policyFormDialog.getByLabel(/Policy Name/i);
  }

  get sumAssuredField(): Locator {
    return this.policyFormDialog.getByLabel(/Sum Assured/i);
  }

  get premiumField(): Locator {
    return this.policyFormDialog.getByLabel(/Premium Amount/i);
  }

  // Health-specific fields
  get coverageTypeField(): Locator {
    return this.policyFormDialog.locator('.v-select').filter({ hasText: /Coverage Type/i });
  }

  get roomRentField(): Locator {
    return this.policyFormDialog.getByLabel(/Room Rent/i);
  }

  get coPaymentField(): Locator {
    return this.policyFormDialog.getByLabel(/Co-payment/i);
  }

  get saveButton(): Locator {
    return this.policyFormDialog.getByRole("button", { name: /Add Policy|Update Policy/i });
  }

  get cancelButton(): Locator {
    return this.policyFormDialog.getByRole("button", { name: /Cancel/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async openAddForm() {
    await this.addPolicyButton.click();
    await this.policyFormDialog.waitFor({ state: "visible" });
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
    }
    if (data.provider) {
      await this.providerField.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.provider }).click();
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
      await this.coverageTypeField.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.coverageType }).click();
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
    await this.waitForPageLoad();
  }

  async selectReportTab(tabName: 'Coverage' | 'Premium' | 'Tax' | 'Renewals') {
    await this.page.getByRole("tab", { name: new RegExp(tabName, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection|Insurance|Reports/i })).toBeVisible();
  }

  async expectHasChartOrTable() {
    // Reports page should have either a chart or a data table
    const chart = this.page.locator("canvas, svg, .v-data-table").first();
    await expect(chart).toBeVisible();
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
    return this.page.getByRole("button", { name: /Calculate|Get Results/i });
  }

  get resultsSection(): Locator {
    return this.page.locator('[data-testid="hlv-results"], .v-card').filter({ hasText: /Recommended|Coverage|Gap/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection|Calculator|Adequacy/i })).toBeVisible();
  }

  async expectWizardVisible() {
    await expect(this.wizardStepper).toBeVisible();
  }
}
