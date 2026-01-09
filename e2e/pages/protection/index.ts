/**
 * Protection (Insurance) Page Objects
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

  get totalCoverageCard(): Locator {
    return this.getSummaryCardByTitle("Total Coverage");
  }

  get annualPremiumCard(): Locator {
    return this.getSummaryCardByTitle("Annual Premium");
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
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }
}

export class LifeInsurancePage extends BasePage {
  readonly url = "/dashboard/protection/life";

  constructor(page: Page) {
    super(page);
  }

  get addPolicyButton(): Locator {
    return this.page.getByRole("button", { name: /Add Policy|Add Life/i });
  }

  get policyFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Policy|Edit.*Policy|Life Insurance/i });
  }

  get policyTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Policy Type/i });
  }

  get policyNameField(): Locator {
    return this.page.getByRole("textbox", { name: /Policy Name/i });
  }

  get sumAssuredField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Sum Assured|Coverage/i });
  }

  get premiumField(): Locator {
    return this.page.getByRole("spinbutton", { name: /Premium/i });
  }

  get saveButton(): Locator {
    return this.policyFormDialog.getByRole("button", { name: /Save|Add/i });
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

  async fillPolicyForm(data: { policyType?: string; policyName?: string; sumAssured?: number; premium?: number }) {
    if (data.policyType) {
      await this.policyTypeSelect.click();
      await this.page.waitForTimeout(200);
      await this.page.getByRole("option", { name: data.policyType }).click();
    }
    if (data.policyName) {
      await this.policyNameField.clear();
      await this.policyNameField.fill(data.policyName);
    }
    if (data.sumAssured !== undefined) {
      await this.sumAssuredField.clear();
      await this.sumAssuredField.fill(data.sumAssured.toString());
    }
    if (data.premium !== undefined) {
      await this.premiumField.clear();
      await this.premiumField.fill(data.premium.toString());
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

  async expectPolicyInTable(policyName: string) {
    await expect(this.getTableRowByText(policyName)).toBeVisible();
  }
}

export class HealthInsurancePage extends BasePage {
  readonly url = "/dashboard/protection/health";

  constructor(page: Page) {
    super(page);
  }

  get addPolicyButton(): Locator {
    return this.page.getByRole("button", { name: /Add Policy|Add Health/i });
  }

  get policyFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add.*Policy|Health Insurance/i });
  }

  get saveButton(): Locator {
    return this.policyFormDialog.getByRole("button", { name: /Save|Add/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async openAddForm() {
    await this.addPolicyButton.click();
    await this.policyFormDialog.waitFor({ state: "visible" });
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
    return this.page.getByRole("button", { name: /Export|Download/i });
  }

  async navigateTo() {
    await this.goto(this.url);
    await this.waitForPageLoad();
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole("heading", { name: /Protection|Insurance/i })).toBeVisible();
  }
}
