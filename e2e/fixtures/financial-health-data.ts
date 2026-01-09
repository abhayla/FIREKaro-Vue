/**
 * Financial Health Test Data
 *
 * Aggregates data from all sections for:
 * - Net Worth calculation
 * - Cash Flow analysis
 * - Health Score
 * - Emergency Fund tracking
 */

import { testUserProfile, financialSummary } from './unified-profile';
import { portfolioSummary, assetAllocation, propertyData } from './investments-data';
import { liabilitiesSummary } from './liabilities-data';
import { expenseSummary } from './expenses-data';

// ============================================
// Types
// ============================================

export interface NetWorthTestData {
  date: string;
  // Assets
  assets: {
    liquidAssets: number;
    investments: number;
    retirement: number;
    property: number;
    other: number;
    total: number;
  };
  // Liabilities
  liabilities: {
    homeLoan: number;
    carLoan: number;
    creditCards: number;
    other: number;
    total: number;
  };
  // Net Worth
  netWorth: number;
  // Changes
  monthlyChange?: number;
  yearlyChange?: number;
}

export interface CashFlowTestData {
  month: string;
  income: {
    salary: number;
    nonSalaryIncome: number;
    passiveIncome: number;
    total: number;
  };
  expenses: {
    needs: number;
    wants: number;
    total: number;
  };
  savings: {
    investments: number;
    emiPrincipal: number;
    total: number;
  };
  netCashFlow: number;
  savingsRate: number;
}

export interface HealthScoreTestData {
  overall: number; // 0-100
  factors: HealthFactor[];
  alerts: HealthAlert[];
  trend: 'improving' | 'stable' | 'declining';
}

export interface HealthFactor {
  name: string;
  score: number; // 0-100
  weight: number; // percentage
  status: 'good' | 'warning' | 'critical';
  recommendation?: string;
}

export interface HealthAlert {
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
}

export interface BankAccountTestData {
  id?: string;
  bankName: string;
  accountType: 'savings' | 'current' | 'salary' | 'fd' | 'rd';
  accountNumber: string;
  balance: number;
  interestRate?: number;
  maturityDate?: string;
  isActive: boolean;
  isPrimary: boolean;
}

export interface EmergencyFundTestData {
  targetMonths: number;
  monthlyExpenses: number;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  monthsCovered: number;
  recommendation: string;
}

// ============================================
// Net Worth Data
// ============================================

export const netWorthData: NetWorthTestData = {
  date: "2025-06-30",

  assets: {
    // Liquid (Bank accounts)
    liquidAssets: 500000, // Rs. 5L in savings/current accounts

    // Investments (from investments-data)
    investments:
      portfolioSummary.stocks.totalCurrent +
      portfolioSummary.mutualFunds.totalCurrent, // Stocks + MF

    // Retirement accounts
    retirement: portfolioSummary.retirement.totalBalance, // EPF + PPF + NPS

    // Property (market value)
    property: propertyData.reduce((sum, p) => sum + p.currentValuation, 0),

    // Other (gold, etc.)
    other: 200000, // Rs. 2L in gold/other

    get total() {
      return this.liquidAssets + this.investments + this.retirement + this.property + this.other;
    },
  },

  liabilities: {
    homeLoan: liabilitiesSummary.loans.homeLoan,
    carLoan: liabilitiesSummary.loans.carLoan,
    creditCards: liabilitiesSummary.creditCards.totalOutstanding,
    other: 0,

    get total() {
      return this.homeLoan + this.carLoan + this.creditCards + this.other;
    },
  },

  get netWorth() {
    return this.assets.total - this.liabilities.total;
  },

  monthlyChange: 85000, // Approx monthly change
  yearlyChange: 1200000, // Approx yearly change
};

// Note: totals are calculated by getters in the object definition

// ============================================
// Cash Flow Data (Monthly)
// ============================================

export const cashFlowData: CashFlowTestData = {
  month: "June 2025",

  income: {
    salary: testUserProfile.monthlyNet,
    nonSalaryIncome: 30000, // Avg monthly from non-salary sources
    passiveIncome: 25000, // Rental income (after expenses)
    get total() {
      return this.salary + this.nonSalaryIncome + this.passiveIncome;
    },
  },

  expenses: {
    needs: expenseSummary.needs,
    wants: expenseSummary.wants,
    get total() {
      return this.needs + this.wants;
    },
  },

  savings: {
    investments: 45000, // Monthly SIP + EPF/NPS
    emiPrincipal: 25000, // Principal portion of EMIs
    get total() {
      return this.investments + this.emiPrincipal;
    },
  },

  get netCashFlow() {
    return this.income.total - this.expenses.total;
  },

  get savingsRate() {
    return Math.round((this.netCashFlow / this.income.total) * 100);
  },
};

// Note: totals are calculated by getters in the object definition

// ============================================
// Health Score Data
// ============================================

export const healthScoreData: HealthScoreTestData = {
  overall: 72, // Out of 100

  factors: [
    {
      name: "Savings Rate",
      score: 85,
      weight: 20,
      status: "good",
      recommendation: "Excellent! You're saving over 40% of income.",
    },
    {
      name: "Emergency Fund",
      score: 50,
      weight: 15,
      status: "warning",
      recommendation: "Build up to 6 months of expenses.",
    },
    {
      name: "Debt-to-Income Ratio",
      score: 65,
      weight: 20,
      status: "warning",
      recommendation: "DTI is 30%. Aim for below 25%.",
    },
    {
      name: "Insurance Coverage",
      score: 90,
      weight: 15,
      status: "good",
      recommendation: "Life and health coverage is adequate.",
    },
    {
      name: "Investment Diversification",
      score: 75,
      weight: 15,
      status: "good",
      recommendation: "Good mix, but consider more debt allocation.",
    },
    {
      name: "Retirement Readiness",
      score: 60,
      weight: 15,
      status: "warning",
      recommendation: "Increase retirement contributions by 10%.",
    },
  ],

  alerts: [
    {
      type: "warning",
      title: "Emergency Fund Low",
      message: "Current emergency fund covers only 3.5 months. Target is 6 months.",
      actionRequired: true,
    },
    {
      type: "info",
      title: "Credit Card Due",
      message: "Rs. 45,000 credit card payment due on 15th.",
      actionRequired: false,
    },
    {
      type: "info",
      title: "Insurance Renewal",
      message: "Car insurance expires on Jan 14, 2026.",
      actionRequired: false,
    },
  ],

  trend: "improving",
};

// ============================================
// Bank Accounts Data
// ============================================

export const bankAccountsData: BankAccountTestData[] = [
  {
    bankName: "HDFC Bank",
    accountType: "salary",
    accountNumber: "XXXX1234",
    balance: 250000,
    isActive: true,
    isPrimary: true,
  },
  {
    bankName: "ICICI Bank",
    accountType: "savings",
    accountNumber: "XXXX5678",
    balance: 150000,
    interestRate: 3.0,
    isActive: true,
    isPrimary: false,
  },
  {
    bankName: "SBI",
    accountType: "savings",
    accountNumber: "XXXX9012",
    balance: 100000,
    interestRate: 2.7,
    isActive: true,
    isPrimary: false,
  },
  {
    bankName: "HDFC Bank",
    accountType: "fd",
    accountNumber: "XXXX3456",
    balance: 500000,
    interestRate: 7.0,
    maturityDate: "2026-03-31",
    isActive: true,
    isPrimary: false,
  },
];

// ============================================
// Emergency Fund Data
// ============================================

export const emergencyFundData: EmergencyFundTestData = {
  targetMonths: testUserProfile.targets.emergencyFundMonths, // 6 months
  monthlyExpenses: testUserProfile.targets.monthlyExpenses, // Rs. 70K
  targetAmount: testUserProfile.targets.emergencyFundMonths * testUserProfile.targets.monthlyExpenses,
  currentAmount: 250000, // Current liquid savings for emergency
  progress: Math.round((250000 / (6 * 70000)) * 100),
  monthsCovered: Math.round((250000 / 70000) * 10) / 10,
  recommendation: "Add Rs. 20,000/month to reach target in 8 months.",
};

// ============================================
// Financial Health Summary
// ============================================

export const financialHealthSummary = {
  // Net Worth
  netWorth: {
    total: netWorthData.assets.total - netWorthData.liabilities.total,
    assets: netWorthData.assets.total,
    liabilities: netWorthData.liabilities.total,
    monthlyGrowth: netWorthData.monthlyChange,
  },

  // Cash Flow
  cashFlow: {
    income: cashFlowData.income.total,
    expenses: cashFlowData.expenses.total,
    netCashFlow: cashFlowData.income.total - cashFlowData.expenses.total,
    savingsRate: Math.round(
      ((cashFlowData.income.total - cashFlowData.expenses.total) / cashFlowData.income.total) * 100
    ),
  },

  // Key Ratios
  ratios: {
    debtToIncome: liabilitiesSummary.debtToIncomeRatio,
    debtToAssets: Math.round((netWorthData.liabilities.total / netWorthData.assets.total) * 100),
    liquidityRatio: Math.round(
      (netWorthData.assets.liquidAssets / (cashFlowData.expenses.total * 3)) * 100
    ) / 100,
    savingsRate: Math.round(
      ((cashFlowData.income.total - cashFlowData.expenses.total) / cashFlowData.income.total) * 100
    ),
  },

  // Health Score
  healthScore: healthScoreData.overall,

  // Alerts Count
  alertsCount: {
    critical: healthScoreData.alerts.filter(a => a.type === 'critical').length,
    warning: healthScoreData.alerts.filter(a => a.type === 'warning').length,
    info: healthScoreData.alerts.filter(a => a.type === 'info').length,
  },
};

// ============================================
// Net Worth History (Last 12 Months)
// ============================================

export const netWorthHistory = [
  { month: "Jul 2024", netWorth: 6500000, assets: 10200000, liabilities: 3700000 },
  { month: "Aug 2024", netWorth: 6600000, assets: 10350000, liabilities: 3750000 },
  { month: "Sep 2024", netWorth: 6700000, assets: 10500000, liabilities: 3800000 },
  { month: "Oct 2024", netWorth: 6850000, assets: 10700000, liabilities: 3850000 },
  { month: "Nov 2024", netWorth: 7000000, assets: 10900000, liabilities: 3900000 },
  { month: "Dec 2024", netWorth: 7150000, assets: 11100000, liabilities: 3950000 },
  { month: "Jan 2025", netWorth: 7300000, assets: 11300000, liabilities: 4000000 },
  { month: "Feb 2025", netWorth: 7450000, assets: 11500000, liabilities: 4050000 },
  { month: "Mar 2025", netWorth: 7600000, assets: 11700000, liabilities: 4100000 },
  { month: "Apr 2025", netWorth: 7750000, assets: 11900000, liabilities: 4150000 },
  { month: "May 2025", netWorth: 7900000, assets: 12100000, liabilities: 4200000 },
  { month: "Jun 2025", netWorth: 8050000, assets: 12300000, liabilities: 4250000 },
];

// ============================================
// Test Helpers
// ============================================

export function getBankAccountsByType(type: BankAccountTestData['accountType']): BankAccountTestData[] {
  return bankAccountsData.filter(a => a.accountType === type);
}

export function getTotalBankBalance(): number {
  return bankAccountsData.reduce((sum, a) => sum + a.balance, 0);
}

export function getHealthFactorByName(name: string): HealthFactor | undefined {
  return healthScoreData.factors.find(f => f.name === name);
}

export function getCriticalAlerts(): HealthAlert[] {
  return healthScoreData.alerts.filter(a => a.type === 'critical');
}

export function getNetWorthGrowthRate(): number {
  const firstMonth = netWorthHistory[0];
  const lastMonth = netWorthHistory[netWorthHistory.length - 1];
  const growth = lastMonth.netWorth - firstMonth.netWorth;
  return Math.round((growth / firstMonth.netWorth) * 100 * 100) / 100;
}

// ============================================
// Net Worth Milestones Test Data (New Feature)
// ============================================

export interface MilestoneTestData {
  id?: string;
  name: string;
  targetAmount: number;
  isAchieved: boolean;
  achievedDate?: string;
}

export const milestonesData: MilestoneTestData[] = [
  {
    name: "First 10 Lakhs",
    targetAmount: 1000000,
    isAchieved: true,
    achievedDate: "2021-03-15",
  },
  {
    name: "25 Lakhs",
    targetAmount: 2500000,
    isAchieved: true,
    achievedDate: "2022-08-20",
  },
  {
    name: "50 Lakhs",
    targetAmount: 5000000,
    isAchieved: true,
    achievedDate: "2023-11-10",
  },
  {
    name: "Crorepati",
    targetAmount: 10000000,
    isAchieved: false, // Next target
  },
  {
    name: "2 Crore",
    targetAmount: 20000000,
    isAchieved: false,
  },
];

export const testMilestone: MilestoneTestData = {
  name: "Test Milestone",
  targetAmount: 7500000, // 75L
  isAchieved: false,
};

// ============================================
// Passive Income Summary Test Data (New Feature)
// ============================================

export interface PassiveIncomeTestData {
  totalMonthly: number;
  totalAnnual: number;
  sources: PassiveIncomeSource[];
  expensesCoverage: number; // Percentage of expenses covered
}

export interface PassiveIncomeSource {
  type: 'rental' | 'dividend' | 'interest' | 'other';
  name: string;
  monthlyAmount: number;
  annualAmount: number;
}

export const passiveIncomeData: PassiveIncomeTestData = {
  totalMonthly: 55000, // Rs. 55K/month
  totalAnnual: 660000, // Rs. 6.6L/year
  sources: [
    {
      type: 'rental',
      name: 'Whitefield Apartment Rent',
      monthlyAmount: 25000,
      annualAmount: 300000,
    },
    {
      type: 'dividend',
      name: 'Stock Dividends',
      monthlyAmount: 15000, // Average monthly (180K/year)
      annualAmount: 180000,
    },
    {
      type: 'interest',
      name: 'FD & Savings Interest',
      monthlyAmount: 10000,
      annualAmount: 120000,
    },
    {
      type: 'other',
      name: 'Mutual Fund Dividends',
      monthlyAmount: 5000,
      annualAmount: 60000,
    },
  ],
  expensesCoverage: 78, // Passive income covers 78% of monthly expenses
};

export function getPassiveIncomeByType(type: PassiveIncomeSource['type']): PassiveIncomeSource[] {
  return passiveIncomeData.sources.filter(s => s.type === type);
}

export function getTotalPassiveIncome(): number {
  return passiveIncomeData.totalMonthly;
}
