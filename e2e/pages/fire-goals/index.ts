/**
 * FIRE & Goals Page Objects
 *
 * Updated for 2-tab structure:
 * - Overview Tab: FIRE metrics, Freedom Score, Crossover Chart
 * - Planning Tab: Goals + Calculators + Projections + Withdrawal (accordions)
 *
 * URL: /fire-goals (previously /dashboard/fire-goals)
 * Legacy URLs redirect to new location
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

// ============================================
// FIRE Dashboard Page (Main Page with 2 Tabs)
// ============================================

export class FIREDashboardPage extends BasePage {
  readonly baseUrl = "/fire-goals";

  // Page title
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /FIRE|Financial Independence/i });
  }

  // Main Navigation Tabs (2 tabs: Overview + Planning)
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: /Overview/i });
  }

  get planningTab(): Locator {
    return this.page.getByRole("tab", { name: /Planning/i });
  }

  // Export Menu
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export/i });
  }

  get exportPDFOption(): Locator {
    return this.page.getByRole("listitem").filter({ hasText: /PDF/i });
  }

  get exportExcelOption(): Locator {
    return this.page.getByRole("listitem").filter({ hasText: /Excel/i });
  }

  // FIRE Number Card
  get fireNumberCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FIRE Number/i }).first();
  }

  get fireNumberValue(): Locator {
    return this.fireNumberCard.locator(".text-currency, .text-h3, .text-h4, .text-h6");
  }

  // Current Corpus Card
  get currentCorpusCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Current Corpus/i }).first();
  }

  get currentCorpusValue(): Locator {
    return this.currentCorpusCard.locator(".text-currency, .text-h3, .text-h4, .text-h6");
  }

  // Progress Card
  get progressCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Progress/i }).first();
  }

  get progressBar(): Locator {
    // Progress is shown as percentage text with fire-progress class or as a progress component
    return this.page.locator(".v-progress-linear, .v-progress-circular, [class*='fire-progress'], .v-card:has-text('Progress') .text-h6").first();
  }

  get progressValue(): Locator {
    return this.progressCard.locator(".text-h3, .text-h4, .text-h6, .percentage, [class*='fire-progress']");
  }

  // Years to FIRE Card
  get yearsToFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Time to FIRE/i });
  }

  // FIRE Variations
  get leanFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Lean FIRE/i });
  }

  get fatFIRECard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Fat FIRE/i });
  }

  // Freedom Score
  get freedomScoreCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FIRE Freedom Score|Freedom Score/i }).first();
  }

  // Charts
  get progressChart(): Locator {
    return this.page.locator("canvas").first();
  }

  // Milestone Bar
  get milestoneBar(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /FIRE Milestones/i }).first();
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for page content to be visible
    await this.page.locator(".v-card").first().waitFor({ state: "visible", timeout: 15000 });
  }

  async navigateToOverview(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for FIRE metrics cards to be visible
    await this.page.locator(".v-card").first().waitFor({ state: "visible", timeout: 15000 });
  }

  async navigateToPlanning(): Promise<void> {
    await this.page.goto(`${this.baseUrl}?tab=planning`);
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for planning tab content
    await this.page.locator(".v-expansion-panels").first().waitFor({ state: "visible", timeout: 15000 });
  }

  async switchToOverviewTab(): Promise<void> {
    await this.overviewTab.click();
    await this.page.waitForURL(/\/fire-goals(?:\?tab=overview)?(?:$|[^\/])/);
  }

  async switchToPlanningTab(): Promise<void> {
    await this.planningTab.click();
    await this.page.waitForURL(/\/fire-goals\?tab=planning/);
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page).toHaveURL(/\/fire-goals/);
  }

  async expectOverviewTabActive(): Promise<void> {
    await expect(this.overviewTab).toHaveAttribute("aria-selected", "true");
  }

  async expectPlanningTabActive(): Promise<void> {
    await expect(this.planningTab).toHaveAttribute("aria-selected", "true");
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

  async openExportMenu(): Promise<void> {
    await this.exportButton.click();
  }
}

// ============================================
// FIRE Planning Tab Page Object
// ============================================

export class FIREPlanningPage extends BasePage {
  readonly baseUrl = "/fire-goals?tab=planning";

  // Expand/Collapse All
  get expandAllButton(): Locator {
    return this.page.getByRole("button", { name: /Expand All/i });
  }

  get collapseAllButton(): Locator {
    return this.page.getByRole("button", { name: /Collapse All/i });
  }

  // Accordion Sections
  get goalsAccordion(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Goals/i });
  }

  get calculatorsAccordion(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Calculators/i });
  }

  get projectionsAccordion(): Locator {
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Projections/i }).first();
  }

  get withdrawalAccordion(): Locator {
    // Use more specific selector to avoid matching "Withdrawal" in other sections
    return this.page.locator(".v-expansion-panel").filter({ hasText: /Withdrawal Planning/i }).first();
  }

  // Goals Section Elements
  get addGoalButton(): Locator {
    return this.page.getByRole("button", { name: /Add Goal/i });
  }

  get goalCards(): Locator {
    return this.page.locator(".v-card").filter({ has: this.page.locator("[class*='goal'], .goal-card") });
  }

  get goalsEmptyState(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Start Your FIRE Journey/i });
  }

  get statusFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Status/i });
  }

  get categoryFilter(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Category/i });
  }

  // Goal Form Dialog
  get goalFormDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Create New Goal|Edit Goal/i });
  }

  get goalNameInput(): Locator {
    return this.goalFormDialog.getByLabel(/Goal Name/i);
  }

  get targetAmountInput(): Locator {
    return this.goalFormDialog.getByLabel(/Target Amount/i);
  }

  get targetDateInput(): Locator {
    return this.goalFormDialog.getByLabel(/Target Date/i);
  }

  get categorySelect(): Locator {
    return this.goalFormDialog.locator(".v-select").filter({ hasText: /Category/i });
  }

  get saveButton(): Locator {
    return this.goalFormDialog.getByRole("button", { name: /Create Goal|Update Goal/i });
  }

  get cancelButton(): Locator {
    return this.goalFormDialog.getByRole("button", { name: /Cancel/i });
  }

  // Calculator Tabs (inside Calculators accordion)
  get fireCalculatorTab(): Locator {
    return this.page.getByRole("tab", { name: /FIRE Number/i });
  }

  get retirementCalculatorTab(): Locator {
    return this.page.getByRole("tab", { name: /Retirement Date/i });
  }

  get sipCalculatorTab(): Locator {
    return this.page.getByRole("tab", { name: /SIP Calculator/i });
  }

  get monteCarloTab(): Locator {
    return this.page.getByRole("tab", { name: /Monte Carlo/i });
  }

  // Projection Tabs (inside Projections accordion)
  get projectionChartTab(): Locator {
    return this.page.getByRole("tab", { name: /100-Year Projection/i });
  }

  // Projection chart (canvas element)
  get projectionChart(): Locator {
    return this.page.locator("canvas").first();
  }

  get sensitivityTab(): Locator {
    return this.page.getByRole("tab", { name: /Sensitivity/i });
  }

  // Withdrawal Section Elements
  get swrTable(): Locator {
    return this.page.locator(".v-table").filter({ hasText: /SWR|Withdrawal Rate/i });
  }

  get strategyCards(): Locator {
    // Target the strategy comparison section specifically
    return this.page.locator(".v-card").filter({ hasText: /Which Strategy is Right/i });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for page content to be visible
    await this.page.locator(".v-expansion-panels").first().waitFor({ state: "visible", timeout: 15000 });
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Goals|Planning/i).first()).toBeVisible();
    await expect(this.page).toHaveURL(/\/fire-goals\?tab=planning/);
  }

  async expandAllSections(): Promise<void> {
    await this.expandAllButton.click();
    // Wait for accordions to expand
    await this.page.waitForTimeout(500);
  }

  async collapseAllSections(): Promise<void> {
    await this.collapseAllButton.click();
    // Wait for accordions to collapse
    await this.page.waitForTimeout(500);
  }

  async expandGoalsSection(): Promise<void> {
    // Check if already expanded by looking for visible content
    const contentVisible = await this.goalsAccordion.locator(".v-expansion-panel-text").isVisible().catch(() => false);
    if (!contentVisible) {
      await this.goalsAccordion.locator(".v-expansion-panel-title").click();
      // Wait for content to be visible
      await this.goalsAccordion.locator(".v-expansion-panel-text").waitFor({ state: "visible", timeout: 5000 });
    }
  }

  async expandCalculatorsSection(): Promise<void> {
    const contentVisible = await this.calculatorsAccordion.locator(".v-expansion-panel-text").isVisible().catch(() => false);
    if (!contentVisible) {
      // Wait for the accordion to be clickable
      await this.calculatorsAccordion.locator(".v-expansion-panel-title").waitFor({ state: "visible", timeout: 10000 });
      await this.calculatorsAccordion.locator(".v-expansion-panel-title").click();
      await this.calculatorsAccordion.locator(".v-expansion-panel-text").waitFor({ state: "visible", timeout: 10000 });
    }
  }

  async expandProjectionsSection(): Promise<void> {
    const contentVisible = await this.projectionsAccordion.locator(".v-expansion-panel-text").isVisible().catch(() => false);
    if (!contentVisible) {
      await this.projectionsAccordion.locator(".v-expansion-panel-title").waitFor({ state: "visible", timeout: 10000 });
      await this.projectionsAccordion.locator(".v-expansion-panel-title").click();
      await this.projectionsAccordion.locator(".v-expansion-panel-text").waitFor({ state: "visible", timeout: 10000 });
    }
  }

  async expandWithdrawalSection(): Promise<void> {
    const contentVisible = await this.withdrawalAccordion.locator(".v-expansion-panel-text").isVisible().catch(() => false);
    if (!contentVisible) {
      await this.withdrawalAccordion.locator(".v-expansion-panel-title").waitFor({ state: "visible", timeout: 10000 });
      await this.withdrawalAccordion.locator(".v-expansion-panel-title").click();
      await this.withdrawalAccordion.locator(".v-expansion-panel-text").waitFor({ state: "visible", timeout: 10000 });
    }
  }

  async openAddGoalForm(): Promise<void> {
    await this.addGoalButton.click();
    await expect(this.goalFormDialog).toBeVisible();
  }

  async getGoalCount(): Promise<number> {
    return await this.page.locator(".v-card").filter({ has: this.page.locator(".goal-card, [class*='goal']") }).count();
  }
}

// ============================================
// Legacy Page Objects (for backwards compatibility)
// These redirect to the new structure
// ============================================

export class FIRECalculatorsPage extends FIREPlanningPage {
  readonly baseUrl = "/fire-goals?tab=planning";

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
    await this.expandCalculatorsSection();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Calculator/i).first()).toBeVisible();
  }
}

export class GoalsPage extends FIREPlanningPage {
  readonly baseUrl = "/fire-goals?tab=planning";

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Goal/i).first()).toBeVisible();
  }

  get goalsTable(): Locator {
    return this.page.locator(".v-row").filter({ has: this.page.locator(".goal-card, [class*='goal']") });
  }

  get goalRows(): Locator {
    return this.page.locator(".v-card").filter({ has: this.page.locator(".goal-card, [class*='goal']") });
  }
}

export class ProjectionsPage extends FIREPlanningPage {
  readonly baseUrl = "/fire-goals?tab=planning";

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
    await this.expandProjectionsSection();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Projection/i).first()).toBeVisible();
  }

  get projectionChart(): Locator {
    return this.page.locator("canvas").first();
  }
}

export class WithdrawalPage extends FIREPlanningPage {
  readonly baseUrl = "/fire-goals?tab=planning";

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
    await this.expandWithdrawalSection();
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Withdrawal/i).first()).toBeVisible();
  }
}

export class FIREReportsPage extends FIREDashboardPage {
  // Reports are now integrated as export functionality
  readonly baseUrl = "/fire-goals";

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.exportButton).toBeVisible();
  }

  async exportReport(): Promise<void> {
    await this.openExportMenu();
    await this.exportPDFOption.click();
  }
}
