/**
 * Financial Health Page Objects
 *
 * Page objects for testing Financial Health section:
 * - Overview (Health Score)
 * - Net Worth
 * - Cash Flow
 * - Emergency Fund
 * - Banking
 * - Reports
 */

import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "../base.page";

// ============================================
// Financial Health Overview Page
// ============================================

export class FinancialHealthOverviewPage extends BasePage {
  readonly baseUrl = "/dashboard/financial-health";

  // Page title
  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Financial Health/i });
  }

  // Navigation tabs
  get overviewTab(): Locator {
    return this.page.getByRole("tab", { name: /Health Score/i });
  }

  get netWorthTab(): Locator {
    return this.page.getByRole("tab", { name: /Net Worth/i });
  }

  get cashFlowTab(): Locator {
    return this.page.getByRole("tab", { name: /Cash Flow/i });
  }

  get emergencyFundTab(): Locator {
    return this.page.getByRole("tab", { name: /Emergency Fund/i });
  }

  get bankingTab(): Locator {
    return this.page.getByRole("tab", { name: /Banking/i });
  }

  get reportsTab(): Locator {
    return this.page.getByRole("tab", { name: /Reports/i });
  }

  // Health Score Card
  get healthScoreCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Financial Health Score/i });
  }

  get healthScoreValue(): Locator {
    return this.healthScoreCard.locator(".text-h2, .text-h3");
  }

  get healthScoreTrend(): Locator {
    return this.healthScoreCard.locator('[class*="trend"], .mdi-trending');
  }

  // Summary Cards
  get netWorthCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Net Worth/i }).first();
  }

  get cashFlowCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Cash Flow|Monthly Surplus/i }).first();
  }

  get savingsRateCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Savings Rate/i });
  }

  get emergencyFundCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Emergency Fund/i }).first();
  }

  // Health Factors
  get healthFactorsList(): Locator {
    return this.page.locator('[class*="factors"], .health-factors');
  }

  get healthFactorItems(): Locator {
    return this.healthFactorsList.locator(".v-list-item, .factor-item");
  }

  // Alerts Section
  get alertsSection(): Locator {
    return this.page.locator('[class*="alerts"], .health-alerts').first();
  }

  get alertItems(): Locator {
    return this.page.locator(".v-alert");
  }

  get criticalAlerts(): Locator {
    return this.page.locator(".v-alert").filter({ has: this.page.locator('[class*="error"]') });
  }

  get warningAlerts(): Locator {
    return this.page.locator(".v-alert").filter({ has: this.page.locator('[class*="warning"]') });
  }

  // Charts
  get netWorthChart(): Locator {
    return this.page.locator("canvas, [class*='chart']").first();
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.page).toHaveURL(/\/dashboard\/financial-health/);
  }

  async getHealthScore(): Promise<string> {
    return (await this.healthScoreValue.textContent()) ?? "";
  }

  async getNetWorth(): Promise<string> {
    return (await this.netWorthCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getSavingsRate(): Promise<string> {
    return (await this.savingsRateCard.locator(".text-h4, .text-h5, .v-chip").first().textContent()) ?? "";
  }

  async getAlertCount(): Promise<number> {
    return await this.alertItems.count();
  }

  async navigateToNetWorth(): Promise<void> {
    await this.netWorthTab.click();
    await this.page.waitForURL(/\/dashboard\/financial-health\/net-worth/);
  }

  async navigateToCashFlow(): Promise<void> {
    await this.cashFlowTab.click();
    await this.page.waitForURL(/\/dashboard\/financial-health\/cash-flow/);
  }

  async navigateToEmergencyFund(): Promise<void> {
    await this.emergencyFundTab.click();
    await this.page.waitForURL(/\/dashboard\/financial-health\/emergency-fund/);
  }

  async navigateToBanking(): Promise<void> {
    await this.bankingTab.click();
    await this.page.waitForURL(/\/dashboard\/financial-health\/banking/);
  }
}

// ============================================
// Net Worth Page
// ============================================

export class NetWorthPage extends BasePage {
  readonly baseUrl = "/dashboard/financial-health/net-worth";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Net Worth/i });
  }

  // Summary Cards
  get totalNetWorthCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Net Worth|Net Worth/i }).first();
  }

  get totalAssetsCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Assets|Assets/i }).first();
  }

  get totalLiabilitiesCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Liabilities|Liabilities/i }).first();
  }

  get monthlyChangeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Monthly Change|Change/i }).first();
  }

  // Assets Breakdown
  get assetsSection(): Locator {
    return this.page.locator('[class*="assets-section"], .assets-breakdown');
  }

  get liquidAssetsRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Liquid Assets|Cash|Bank/i });
  }

  get investmentsRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Investments/i });
  }

  get retirementRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Retirement|EPF|PPF|NPS/i });
  }

  get propertyRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Property|Real Estate/i });
  }

  // Liabilities Breakdown
  get liabilitiesSection(): Locator {
    return this.page.locator('[class*="liabilities-section"], .liabilities-breakdown');
  }

  get homeLoanRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Home Loan|Mortgage/i });
  }

  get carLoanRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Car Loan|Auto/i });
  }

  get creditCardsRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Credit Card/i });
  }

  // Charts
  get netWorthTrendChart(): Locator {
    return this.page.locator("canvas").first();
  }

  get assetAllocationChart(): Locator {
    return this.page.locator("canvas").nth(1);
  }

  // History Table
  get historyTable(): Locator {
    return this.page.locator(".v-data-table, .v-table");
  }

  // ============================================
  // Net Worth Milestones Section (New Feature)
  // ============================================

  get milestonesSection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Milestones|Wealth Milestones/i });
  }

  get addMilestoneButton(): Locator {
    return this.milestonesSection.getByRole("button", { name: /Add|New|Custom/i });
  }

  get milestonesList(): Locator {
    return this.milestonesSection.locator(".v-list, .milestone-list");
  }

  get milestoneItems(): Locator {
    return this.milestonesSection.locator(".v-list-item, .milestone-item");
  }

  get achievedMilestones(): Locator {
    return this.milestonesSection.locator(".v-chip, .v-list-item").filter({ hasText: /Achieved|✓|Complete/i });
  }

  get pendingMilestones(): Locator {
    return this.milestonesSection.locator(".v-list-item").filter({ hasText: /Pending|In Progress|%/i });
  }

  get nextMilestoneCard(): Locator {
    return this.milestonesSection.locator(".v-card, .v-alert").filter({ hasText: /Next Milestone|Days to|Months to/i });
  }

  // Milestone Dialog
  get milestoneDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Milestone|Add Milestone/i });
  }

  get milestoneNameInput(): Locator {
    return this.milestoneDialog.getByLabel(/Name|Milestone Name/i);
  }

  get milestoneAmountInput(): Locator {
    return this.milestoneDialog.getByLabel(/Amount|Target Amount/i);
  }

  get milestoneSaveButton(): Locator {
    return this.milestoneDialog.getByRole("button", { name: /Save|Add|Create/i });
  }

  get milestoneCancelButton(): Locator {
    return this.milestoneDialog.getByRole("button", { name: /Cancel/i });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Net Worth/i).first()).toBeVisible();
  }

  async getTotalNetWorth(): Promise<string> {
    return (await this.totalNetWorthCard.locator(".text-currency, .text-h3, .text-h4").first().textContent()) ?? "";
  }

  async getTotalAssets(): Promise<string> {
    return (await this.totalAssetsCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getTotalLiabilities(): Promise<string> {
    return (await this.totalLiabilitiesCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  // ============================================
  // Milestone Actions
  // ============================================

  async openAddMilestoneDialog(): Promise<void> {
    await this.addMilestoneButton.click();
    await expect(this.milestoneDialog).toBeVisible();
  }

  async addMilestone(name: string, amount: number): Promise<void> {
    await this.openAddMilestoneDialog();
    await this.milestoneNameInput.fill(name);
    await this.milestoneAmountInput.fill(amount.toString());
    await this.milestoneSaveButton.click();
    await this.page.waitForTimeout(500);
  }

  async getMilestoneCount(): Promise<number> {
    return await this.milestoneItems.count();
  }

  async getAchievedMilestoneCount(): Promise<number> {
    return await this.achievedMilestones.count();
  }

  async expectMilestoneVisible(name: string): Promise<void> {
    await expect(this.milestonesSection.getByText(name)).toBeVisible();
  }

  async expectMilestonesSectionVisible(): Promise<void> {
    await expect(this.milestonesSection).toBeVisible();
  }
}

// ============================================
// Cash Flow Page
// ============================================

export class CashFlowPage extends BasePage {
  readonly baseUrl = "/dashboard/financial-health/cash-flow";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Cash Flow/i });
  }

  // Summary Cards
  get totalIncomeCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Income|Income/i }).first();
  }

  get totalExpensesCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Expenses|Expenses/i }).first();
  }

  get netCashFlowCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Net Cash Flow|Surplus|Net/i }).first();
  }

  get savingsRateCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Savings Rate/i });
  }

  // Income Breakdown
  get incomeSection(): Locator {
    return this.page.locator('[class*="income-section"], .income-breakdown');
  }

  get salaryIncomeRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Salary/i });
  }

  get nonSalaryIncomeRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Non-Salary|Other Income/i });
  }

  get passiveIncomeRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Passive|Rental|Dividend/i });
  }

  // Expenses Breakdown
  get expensesSection(): Locator {
    return this.page.locator('[class*="expenses-section"], .expenses-breakdown');
  }

  get needsExpensesRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Needs|Essential/i });
  }

  get wantsExpensesRow(): Locator {
    return this.page.locator(".v-list-item, tr").filter({ hasText: /Wants|Discretionary/i });
  }

  // Charts
  get cashFlowChart(): Locator {
    return this.page.locator("canvas").first();
  }

  get incomeVsExpensesChart(): Locator {
    return this.page.locator("canvas").nth(1);
  }

  // Period Selector
  get periodSelector(): Locator {
    return this.page.locator(".v-select, .v-btn-toggle").filter({ hasText: /Month|Year|Quarter/i });
  }

  // ============================================
  // Passive Income Summary Section (New Feature)
  // ============================================

  get passiveIncomeSummarySection(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Passive Income Summary|Passive Income/i });
  }

  get totalPassiveIncomeCard(): Locator {
    return this.passiveIncomeSummarySection.locator(".v-card, .text-h4, .text-h5").filter({ hasText: /Total|Monthly/i }).first();
  }

  get rentalIncomeDisplay(): Locator {
    return this.passiveIncomeSummarySection.locator(".v-list-item, .income-source").filter({ hasText: /Rental/i });
  }

  get dividendIncomeDisplay(): Locator {
    return this.passiveIncomeSummarySection.locator(".v-list-item, .income-source").filter({ hasText: /Dividend/i });
  }

  get interestIncomeDisplay(): Locator {
    return this.passiveIncomeSummarySection.locator(".v-list-item, .income-source").filter({ hasText: /Interest/i });
  }

  get expensesCoverageCard(): Locator {
    return this.passiveIncomeSummarySection.locator(".v-card, .v-alert, .text-h4").filter({ hasText: /Coverage|Covers|Expenses/i });
  }

  get passiveIncomePieChart(): Locator {
    return this.passiveIncomeSummarySection.locator("canvas");
  }

  get passiveIncomeTrendChart(): Locator {
    return this.passiveIncomeSummarySection.locator("canvas").nth(1);
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Cash Flow/i).first()).toBeVisible();
  }

  async getTotalIncome(): Promise<string> {
    return (await this.totalIncomeCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getTotalExpenses(): Promise<string> {
    return (await this.totalExpensesCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getNetCashFlow(): Promise<string> {
    return (await this.netCashFlowCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getSavingsRate(): Promise<string> {
    return (await this.savingsRateCard.locator(".text-h4, .text-h5, .v-chip").first().textContent()) ?? "";
  }

  // ============================================
  // Passive Income Actions
  // ============================================

  async expectPassiveIncomeSectionVisible(): Promise<void> {
    await expect(this.passiveIncomeSummarySection).toBeVisible();
  }

  async getTotalPassiveIncome(): Promise<string> {
    return (await this.passiveIncomeSummarySection.locator(".text-h4, .text-h5, .text-currency").first().textContent()) ?? "";
  }

  async getExpensesCoverage(): Promise<string> {
    const coverageText = await this.expensesCoverageCard.textContent();
    // Extract percentage from text like "Covers 35% of expenses"
    const match = coverageText?.match(/(\d+(?:\.\d+)?)\s*%/);
    return match ? `${match[1]}%` : "0%";
  }

  async expectRentalIncomeVisible(): Promise<void> {
    await expect(this.rentalIncomeDisplay).toBeVisible();
  }

  async expectDividendIncomeVisible(): Promise<void> {
    await expect(this.dividendIncomeDisplay).toBeVisible();
  }

  async expectInterestIncomeVisible(): Promise<void> {
    await expect(this.interestIncomeDisplay).toBeVisible();
  }
}

// ============================================
// Emergency Fund Page
// ============================================

export class EmergencyFundPage extends BasePage {
  readonly baseUrl = "/dashboard/financial-health/emergency-fund";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Emergency Fund/i });
  }

  // Summary Cards
  get targetAmountCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Target|Goal/i }).first();
  }

  get currentAmountCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Current|Saved/i }).first();
  }

  get progressCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Progress/i });
  }

  get monthsCoveredCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Months Covered|Coverage/i });
  }

  // Progress Visualization
  get progressBar(): Locator {
    return this.page.locator(".v-progress-linear, .v-progress-circular").first();
  }

  get progressPercentage(): Locator {
    return this.progressCard.locator(".text-h4, .text-h5, .percentage");
  }

  // Configuration
  get targetMonthsInput(): Locator {
    return this.page.locator('input[type="number"], .v-text-field').filter({ hasText: /Target Months/i });
  }

  get monthlyExpensesInput(): Locator {
    return this.page.locator('input, .v-text-field').filter({ hasText: /Monthly Expenses/i });
  }

  get editSettingsButton(): Locator {
    return this.page.getByRole("button", { name: /Edit|Settings|Configure/i });
  }

  get saveSettingsButton(): Locator {
    return this.page.getByRole("button", { name: /Save/i });
  }

  // Recommendation
  get recommendationCard(): Locator {
    return this.page.locator(".v-card, .v-alert").filter({ hasText: /Recommendation|Suggestion/i });
  }

  // Accounts Table
  get accountsTable(): Locator {
    return this.page.locator(".v-data-table, .v-table");
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Emergency Fund/i).first()).toBeVisible();
  }

  async getTargetAmount(): Promise<string> {
    return (await this.targetAmountCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getCurrentAmount(): Promise<string> {
    return (await this.currentAmountCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getMonthsCovered(): Promise<string> {
    return (await this.monthsCoveredCard.locator(".text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getProgressPercentage(): Promise<string> {
    return (await this.progressPercentage.textContent()) ?? "";
  }
}

// ============================================
// Banking Page
// ============================================

export class BankingPage extends BasePage {
  readonly baseUrl = "/dashboard/financial-health/banking";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Banking/i });
  }

  // Summary Cards
  get totalBalanceCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Total Balance/i }).first();
  }

  get savingsBalanceCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Savings/i }).first();
  }

  get fdBalanceCard(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Fixed Deposit|FD/i });
  }

  // Accounts Table
  get accountsTable(): Locator {
    return this.page.locator(".v-data-table, .v-table");
  }

  get accountRows(): Locator {
    return this.accountsTable.locator("tbody tr");
  }

  // Add Account
  get addAccountButton(): Locator {
    return this.page.getByRole("button", { name: /Add Account|Add Bank/i });
  }

  // Form Dialog
  get formDialog(): Locator {
    return this.page.locator(".v-dialog").filter({ hasText: /Add Account|Bank Account/i });
  }

  get bankNameInput(): Locator {
    return this.page.getByLabel(/Bank Name/i);
  }

  get accountTypeSelect(): Locator {
    return this.page.locator(".v-select").filter({ hasText: /Account Type/i });
  }

  get accountNumberInput(): Locator {
    return this.page.getByLabel(/Account Number/i);
  }

  get balanceInput(): Locator {
    return this.page.getByLabel(/Balance/i);
  }

  get interestRateInput(): Locator {
    return this.page.getByLabel(/Interest Rate/i);
  }

  get saveButton(): Locator {
    return this.page.getByRole("button", { name: /Save/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole("button", { name: /Cancel/i });
  }

  async navigateTo(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page.getByText(/Banking|Bank Accounts/i).first()).toBeVisible();
  }

  async getTotalBalance(): Promise<string> {
    return (await this.totalBalanceCard.locator(".text-currency, .text-h4, .text-h5").first().textContent()) ?? "";
  }

  async getAccountCount(): Promise<number> {
    return await this.accountRows.count();
  }

  async openAddForm(): Promise<void> {
    await this.addAccountButton.click();
    await expect(this.formDialog).toBeVisible();
  }

  async fillAccountForm(data: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    balance: number;
    interestRate?: number;
  }): Promise<void> {
    await this.bankNameInput.fill(data.bankName);
    await this.selectOption(this.accountTypeSelect, data.accountType);
    await this.accountNumberInput.fill(data.accountNumber);
    await this.balanceInput.fill(data.balance.toString());
    if (data.interestRate) {
      await this.interestRateInput.fill(data.interestRate.toString());
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

  async expectAccountInTable(bankName: string): Promise<void> {
    await expect(this.accountsTable.getByText(bankName)).toBeVisible();
  }
}

// ============================================
// Financial Health Reports Page
// ============================================

export class FinancialHealthReportsPage extends BasePage {
  readonly baseUrl = "/dashboard/financial-health/reports";

  get pageTitle(): Locator {
    return this.page.getByRole("heading", { name: /Reports|Financial Health Report/i });
  }

  // Report Cards
  get healthSummaryReport(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Health Summary/i });
  }

  get netWorthReport(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Net Worth Report/i });
  }

  get cashFlowReport(): Locator {
    return this.page.locator(".v-card").filter({ hasText: /Cash Flow Report/i });
  }

  // Charts
  get netWorthTrendChart(): Locator {
    return this.page.locator("canvas").first();
  }

  get healthScoreChart(): Locator {
    return this.page.locator("canvas").nth(1);
  }

  // Export
  get exportButton(): Locator {
    return this.page.getByRole("button", { name: /Export|Download/i });
  }

  get printButton(): Locator {
    return this.page.getByRole("button", { name: /Print/i });
  }

  // Period Selector
  get periodSelector(): Locator {
    return this.page.locator(".v-select, .v-btn-toggle").filter({ hasText: /Period|Range/i });
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
