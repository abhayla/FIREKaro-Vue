/**
 * FIRE & Goals Page Objects
 *
 * Page objects for testing FIRE & Goals section:
 * - Dashboard (FIRE progress)
 * - Calculators (25x, Lean/Fat, Coast)
 * - Goals (CRUD)
 * - Projections (30+ year outlook)
 * - Withdrawal (SWR, Bucket strategy)
 * - Reports
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

// ============================================
// FIRE Dashboard Page
// ============================================

export class FIREDashboardPage extends BasePage {
  readonly baseUrl = "/dashboard/fire-goals";

  // Page title
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /FIRE|Financial Independence/i });
  }

  // Navigation tabs
  get dashboardTab(): Locator {
    return this.page.getByRole("tab", { name: /Dashboard|Overview/i });
  }

  get calculatorsTab(): Locator {
    return this.page.getByRole("tab", { name: /Calculator/i });
  }

  get goalsTab(): Locator {
    return this.page.getByRole("tab", { name: /Goal/i });
  }

  get projectionsTab(): Locator {
    return this.page.getByRole("tab", { name: /Projection/i });
  }

  get withdrawalTab(): Locator {
    return this.page.getByRole("tab", { name: /Withdrawal/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Report/i });
  }

  // FIRE Number Card
  get fireNumberCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FIRE Number|Target/i }).first();
  }

  get fireNumberValue(): Locator {
    return this.fireNumberCard.locator(".text-currency, .text-h3, .text-h4");
  }

  // Current Corpus Card
  get currentCorpusCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Current Corpus|Current Value/i }).first();
  }

  get currentCorpusValue(): Locator {
    return this.currentCorpusCard.locator(".text-currency, .text-h3, .text-h4");
  }

  // Progress Card
  get progressCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Progress|%/i }).first();
  }

  get progressBar(): Locator {
    return this.page.locator(".v-progress-linear, .v-progress-circular").first();
  }

  get progressValue(): Locator {
    return this.progressCard.locator(".text-h3, .text-h4, .percentage");
  }

  // Years to FIRE Card
  get yearsToFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Years to FIRE|Years Left/i });
  }

  // FIRE Variations
  get leanFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Lean FIRE/i });
  }

  get fatFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Fat FIRE/i });
  }

  get coastFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Coast FIRE/i });
  }

  // Freedom Score
  get freedomScoreCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Freedom Score/i });
  }

  // Charts
  get progressChart(): Locator {
    return this.page.locator("canvas").first();
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page).toHaveURL(/\/dashboard\/fire-goals/);
  }

  async getFIRENumber(): Promise<string> {
    return (await this.fireNumberValue.first().textContent()) ?? "";
  }

  async getCurrentCorpus(): Promise<string> {
    return (await this.currentCorpusValue.first().textContent()) ?? "";
  }

  async getProgress(): Promise<string> {
    return (await this.progressValue.first().textContent()) ?? "";
  }

  async navigateToCalculators(): Promise<void> {
    await this.calculatorsTab.click();
    await this.page.waitForURL(/\/dashboard\/fire-goals\/calculators/);
  }

  async navigateToGoals(): Promise<void> {
    await this.goalsTab.click();
    await this.page.waitForURL(/\/dashboard\/fire-goals\/goals/);
  }

  async navigateToProjections(): Promise<void> {
    await this.projectionsTab.click();
    await this.page.waitForURL(/\/dashboard\/fire-goals\/projections/);
  }

  async navigateToWithdrawal(): Promise<void> {
    await this.withdrawalTab.click();
    await this.page.waitForURL(/\/dashboard\/fire-goals\/withdrawal/);
  }
}

// ============================================
// FIRE Calculators Page
// ============================================

export class FIRECalculatorsPage extends BasePage {
  readonly baseUrl = "/dashboard/fire-goals/calculators";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Calculator/i });
  }

  // Calculator Cards
  get fireNumberCalculator(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FIRE Number|25x/i }).first();
  }

  get coastFIRECalculator(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Coast FIRE/i });
  }

  get leanFatFIRECalculator(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Lean.*Fat|Fat.*Lean/i });
  }

  get yearsToFIRECalculator(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Years to FIRE/i });
  }

  // Input Fields
  get monthlyExpensesInput(): Locator {
    return this.page.getByLabel(/Monthly Expenses/i);
  }

  get withdrawalRateInput(): Locator {
    return this.page.getByLabel(/Withdrawal Rate|SWR/i);
  }

  get currentCorpusInput(): Locator {
    return this.page.getByLabel(/Current Corpus|Current Value/i);
  }

  get expectedReturnInput(): Locator {
    return this.page.getByLabel(/Expected Return|Return Rate/i);
  }

  get inflationRateInput(): Locator {
    return this.page.getByLabel(/Inflation/i);
  }

  get targetAgeInput(): Locator {
    return this.page.getByLabel(/Target Age|FIRE Age/i);
  }

  get monthlySavingsInput(): Locator {
    return this.page.getByLabel(/Monthly Savings|Monthly Investment/i);
  }

  // Calculate Button
  get calculateButton(): Locator {
    return this.page.getByRole("button", { name: /Calculate/i });
  }

  // Results
  get resultCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Result|Calculated/i });
  }

  get fireNumberResult(): Locator {
    return this.page.locator("[class*='result'], .text-h3, .text-h4").filter({ hasText: /₹/ }).first();
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Calculator/i).first()).toBeVisible();
  }

  async calculateFIRENumber(monthlyExpenses: number, withdrawalRate: number = 4): Promise<void> {
    await this.monthlyExpensesInput.fill(monthlyExpenses.toString());
    await this.withdrawalRateInput.fill(withdrawalRate.toString());
    await this.calculateButton.click();
  }

  async getFIRENumberResult(): Promise<string> {
    return (await this.fireNumberResult.textContent()) ?? "";
  }
}

// ============================================
// Goals Page
// ============================================

export class GoalsPage extends BasePage {
  readonly baseUrl = "/dashboard/fire-goals/goals";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Goal/i });
  }

  // Summary Cards
  get totalGoalsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Goals/i });
  }

  get onTrackCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /On Track/i });
  }

  get totalTargetCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Target/i });
  }

  // Goals Table/List
  get goalsTable(): Locator {
    return this.page.locator(".v-data-table, .v-table, .goals-list");
  }

  get goalRows(): Locator {
    return this.goalsTable.locator("tbody tr, .goal-item");
  }

  // Add Goal
  get addGoalButton(): Locator {
    return this.page.getByRole("button", { name: /Add Goal|New Goal/i });
  }

  // Form Dialog
  get formDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Goal|Edit Goal|Goal/i });
  }

  get goalNameInput(): Locator {
    return this.page.getByLabel(/Goal Name|Name/i);
  }

  get categorySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Category/i });
  }

  get targetAmountInput(): Locator {
    return this.page.getByLabel(/Target Amount|Target/i);
  }

  get currentAmountInput(): Locator {
    return this.page.getByLabel(/Current Amount|Current/i);
  }

  get targetDateInput(): Locator {
    return this.page.getByLabel(/Target Date|Due Date/i);
  }

  get prioritySelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Priority/i });
  }

  get monthlyContributionInput(): Locator {
    return this.page.getByLabel(/Monthly Contribution|Monthly/i);
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /Save/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel/i });
  }

  // Category Filters
  get essentialFilter(): Locator {
    return this.page.getByRole("button", { name: /Essential/i });
  }

  get lifestyleFilter(): Locator {
    return this.page.getByRole("button", { name: /Lifestyle/i });
  }

  get legacyFilter(): Locator {
    return this.page.getByRole("button", { name: /Legacy/i });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Goal/i).first()).toBeVisible();
  }

  async getGoalCount(): Promise<number> {
    return await this.goalRows.count();
  }

  async openAddForm(): Promise<void> {
    await this.addGoalButton.click();
    await expect(this.formDialog).toBeVisible();
  }

  async fillGoalForm(data: {
    name: string;
    category: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    priority: string;
    monthlyContribution?: number;
  }): Promise<void> {
    await this.goalNameInput.fill(data.name);
    await this.selectOption(this.categorySelect, data.category);
    await this.targetAmountInput.fill(data.targetAmount.toString());
    await this.currentAmountInput.fill(data.currentAmount.toString());
    await this.targetDateInput.fill(data.targetDate);
    await this.selectOption(this.prioritySelect, data.priority);
    if (data.monthlyContribution) {
      await this.monthlyContributionInput.fill(data.monthlyContribution.toString());
    }
  }

  async saveForm(): Promise<void> {
    await this.saveButton.click();
  }

  async expectFormDialogVisible(): Promise<void> {
    await expect(this.formDialog).toBeVisible();
  }

  async expectFormDialogClosed(): Promise<void> {
    await expect(this.formDialog).not.toBeVisible();
  }

  async expectGoalInTable(goalName: string): Promise<void> {
    await expect(this.goalsTable.getByText(goalName)).toBeVisible();
  }
}

// ============================================
// Projections Page
// ============================================

export class ProjectionsPage extends BasePage {
  readonly baseUrl = "/dashboard/fire-goals/projections";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Projection/i });
  }

  // Projection Chart
  get projectionChart(): Locator {
    return this.page.locator("canvas").first();
  }

  // Summary Cards
  get crossoverYearCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Crossover|Financial Independence/i });
  }

  get projectedCorpusCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Projected Corpus|Future Value/i });
  }

  // Projection Table
  get projectionTable(): Locator {
    return this.page.locator(".v-data-table, .v-table");
  }

  get projectionRows(): Locator {
    return this.projectionTable.locator("tbody tr");
  }

  // Scenario Inputs
  get returnRateInput(): Locator {
    return this.page.getByLabel(/Return Rate|Expected Return/i);
  }

  get inflationRateInput(): Locator {
    return this.page.getByLabel(/Inflation/i);
  }

  get monthlySavingsInput(): Locator {
    return this.page.getByLabel(/Monthly Savings/i);
  }

  get recalculateButton(): Locator {
    return this.page.getByRole("button", { name: /Recalculate|Update/i });
  }

  // Milestone Indicators
  get milestonesList(): Locator {
    return this.page.locator('[class*="milestones"], .milestones-list');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Projection/i).first()).toBeVisible();
  }

  async getCrossoverYear(): Promise<string> {
    return (await this.crossoverYearCard.locator(".text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getProjectedCorpus(): Promise<string> {
    return (await this.projectedCorpusCard.locator(".text-currency, .text-h4").first().textContent()) ?? "";
  }
}

// ============================================
// Withdrawal Page
// ============================================

export class WithdrawalPage extends BasePage {
  readonly baseUrl = "/dashboard/fire-goals/withdrawal";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Withdrawal/i });
  }

  // Strategy Cards
  get swrStrategyCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /4%.*Rate|Safe Withdrawal/i });
  }

  get bucketStrategyCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Bucket/i });
  }

  get floorCeilingCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Floor.*Ceiling|Guardrail/i });
  }

  // Calculator
  get corpusInput(): Locator {
    return this.page.getByLabel(/Corpus|Portfolio Value/i);
  }

  get withdrawalRateInput(): Locator {
    return this.page.getByLabel(/Withdrawal Rate/i);
  }

  get calculateButton(): Locator {
    return this.page.getByRole("button", { name: /Calculate/i });
  }

  // Results
  get annualWithdrawalResult(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Annual Withdrawal/i });
  }

  get monthlyWithdrawalResult(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly Withdrawal/i });
  }

  get successRateResult(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Success Rate/i });
  }

  // Bucket Strategy Details
  get cashBucket(): Locator {
    return this.page.locator(".v-card, .bucket").filter({ hasText: /Cash|Short.*Term/i });
  }

  get bondBucket(): Locator {
    return this.page.locator(".v-card, .bucket").filter({ hasText: /Bond|Medium.*Term/i });
  }

  get equityBucket(): Locator {
    return this.page.locator(".v-card, .bucket").filter({ hasText: /Equity|Long.*Term/i });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Withdrawal/i).first()).toBeVisible();
  }

  async calculateWithdrawal(corpus: number, rate: number = 4): Promise<void> {
    await this.corpusInput.fill(corpus.toString());
    await this.withdrawalRateInput.fill(rate.toString());
    await this.calculateButton.click();
  }

  async getAnnualWithdrawal(): Promise<string> {
    return (await this.annualWithdrawalResult.locator(".text-currency, .text-h4").first().textContent()) ?? "";
  }

  async getMonthlyWithdrawal(): Promise<string> {
    return (await this.monthlyWithdrawalResult.locator(".text-currency, .text-h4").first().textContent()) ?? "";
  }
}

// ============================================
// FIRE Reports Page
// ============================================

export class FIREReportsPage extends BasePage {
  readonly baseUrl = "/dashboard/fire-goals/reports";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Report/i });
  }

  // Report Cards
  get fireProgressReport(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FIRE Progress/i });
  }

  get goalsReport(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Goals Report/i });
  }

  get projectionReport(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Projection Report/i });
  }

  // Charts
  get progressChart(): Locator {
    return this.page.locator("canvas").first();
  }

  get goalsChart(): Locator {
    return this.page.locator("canvas").nth(1);
  }

  // Export
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export|Download/i });
  }

  get printButton(): Locator {
    return this.page.getByRole("button", { name: /Print/i });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Report/i).first()).toBeVisible();
  }

  async exportReport(): Promise<void> {
    await this.exportButton.click();
  }
}
