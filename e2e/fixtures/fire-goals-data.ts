/**
 * FIRE & Goals Test Data
 *
 * FIRE calculations, goals tracking, and projections
 * Target: Rs. 5 Crores at age 45
 */

import { testUserProfile, financialSummary } from './unified-profile';
import { portfolioSummary } from './investments-data';
import { expenseSummary } from './expenses-data';

// ============================================
// Types
// ============================================

export interface FIRECalculationTestData {
  fireNumber: number;
  currentCorpus: number;
  progress: number;
  yearsToFIRE: number;
  monthlyExpenses: number;
  annualExpenses: number;
  withdrawalRate: number;
  // Variations
  leanFIRE: number;
  fatFIRE: number;
  coastFIRE: number;
}

export interface GoalTestData {
  id?: string;
  name: string;
  category: 'essential' | 'lifestyle' | 'legacy';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
  expectedReturn: number;
  // Calculated
  progress: number;
  onTrack: boolean;
  shortfall?: number;
}

export interface ProjectionTestData {
  year: number;
  age: number;
  corpus: number;
  contributions: number;
  returns: number;
  expenses: number;
  netWorth: number;
  fireProgress: number;
  isCrossoverYear: boolean;
}

export interface WithdrawalStrategyTestData {
  strategy: 'swr' | 'bucket' | 'floor_ceiling' | 'guyton_klinger';
  name: string;
  initialRate: number;
  adjustmentRules: string;
  safeWithdrawalAmount: number;
  successRate: number; // % probability of not running out
}

export interface ExpenseCoverageTestData {
  category: string;
  monthlyExpense: number;
  annualExpense: number;
  passiveIncomeCoverage: number;
  corpusRequired: number;
  corpusAvailable: number;
  monthsCovered: number;
  isCovered: boolean;
}

// ============================================
// FIRE Calculation
// ============================================

const monthlyExpenses = testUserProfile.targets.monthlyExpenses;
const annualExpenses = monthlyExpenses * 12;
const withdrawalRate = 4; // 4% SWR

export const fireCalculationData: FIRECalculationTestData = {
  // FIRE Number = Annual Expenses / Withdrawal Rate = 84L / 0.04 = Rs. 2.1 Cr
  // But user's target is Rs. 5 Cr (more conservative with 3.36% SWR)
  fireNumber: testUserProfile.targets.retirementCorpus,

  // Current Corpus = Investments + Retirement accounts
  currentCorpus:
    portfolioSummary.stocks.totalCurrent +
    portfolioSummary.mutualFunds.totalCurrent +
    portfolioSummary.retirement.totalBalance,

  // Progress = Current / Target
  progress: 0, // Will calculate below

  yearsToFIRE: testUserProfile.targets.fireAge - testUserProfile.age,

  monthlyExpenses: monthlyExpenses,
  annualExpenses: annualExpenses,
  withdrawalRate: withdrawalRate,

  // Lean FIRE = 50% of regular expenses * 25
  leanFIRE: (annualExpenses * 0.5) * 25,

  // Fat FIRE = 150% of regular expenses * 25
  fatFIRE: (annualExpenses * 1.5) * 25,

  // Coast FIRE = Amount needed today to grow to FIRE number by retirement
  // Assuming 10% annual returns for 13 years
  coastFIRE: testUserProfile.targets.retirementCorpus / Math.pow(1.10, 13),
};

// Calculate progress
fireCalculationData.progress = Math.round(
  (fireCalculationData.currentCorpus / fireCalculationData.fireNumber) * 100
);

// ============================================
// Financial Goals
// ============================================

export const goalsData: GoalTestData[] = [
  {
    name: "FIRE Corpus",
    category: "essential",
    targetAmount: 50000000, // Rs. 5 Cr
    currentAmount: fireCalculationData.currentCorpus,
    targetDate: "2038-06-15", // Age 45
    priority: "high",
    monthlyContribution: 70000,
    expectedReturn: 12,
    progress: fireCalculationData.progress,
    onTrack: true,
  },
  {
    name: "Child's Higher Education",
    category: "essential",
    targetAmount: 3000000, // Rs. 30L
    currentAmount: 500000,
    targetDate: "2037-06-01", // When child is 17
    priority: "high",
    monthlyContribution: 15000,
    expectedReturn: 10,
    progress: 17,
    onTrack: true,
  },
  {
    name: "Child's Wedding",
    category: "lifestyle",
    targetAmount: 2000000, // Rs. 20L
    currentAmount: 200000,
    targetDate: "2045-06-01", // When child is 25
    priority: "medium",
    monthlyContribution: 5000,
    expectedReturn: 8,
    progress: 10,
    onTrack: true,
  },
  {
    name: "Dream Vacation (Europe)",
    category: "lifestyle",
    targetAmount: 500000, // Rs. 5L
    currentAmount: 150000,
    targetDate: "2027-06-01", // In 2 years
    priority: "medium",
    monthlyContribution: 15000,
    expectedReturn: 6,
    progress: 30,
    onTrack: true,
  },
  {
    name: "New Car",
    category: "lifestyle",
    targetAmount: 1500000, // Rs. 15L
    currentAmount: 300000,
    targetDate: "2028-06-01", // In 3 years
    priority: "low",
    monthlyContribution: 30000,
    expectedReturn: 7,
    progress: 20,
    onTrack: true,
  },
  {
    name: "Parents' Medical Fund",
    category: "essential",
    targetAmount: 1000000, // Rs. 10L
    currentAmount: 400000,
    targetDate: "2030-06-01",
    priority: "high",
    monthlyContribution: 10000,
    expectedReturn: 7,
    progress: 40,
    onTrack: true,
  },
];

// ============================================
// 30-Year Projection
// ============================================

export const projectionData: ProjectionTestData[] = [];

// Generate 30-year projection
let corpus = fireCalculationData.currentCorpus;
const annualContribution = 70000 * 12; // Rs. 8.4L/year
const expectedReturn = 0.10; // 10% annual
const inflationRate = 0.06; // 6% inflation
let currentExpenses = annualExpenses;

for (let i = 0; i <= 30; i++) {
  const year = 2025 + i;
  const age = testUserProfile.age + i;
  const isRetired = age >= testUserProfile.targets.fireAge;

  // Calculate returns
  const returns = corpus * expectedReturn;

  // Calculate contributions (0 after retirement)
  const contributions = isRetired ? 0 : annualContribution;

  // Calculate expenses (increase with inflation)
  currentExpenses = annualExpenses * Math.pow(1 + inflationRate, i);

  // Calculate withdrawal (only after retirement)
  const withdrawal = isRetired ? currentExpenses : 0;

  // Update corpus
  corpus = corpus + returns + contributions - withdrawal;

  // Check if this is crossover year (passive income > expenses)
  const passiveIncome = corpus * 0.04; // 4% withdrawal rate
  const isCrossoverYear = !isRetired && passiveIncome >= currentExpenses;

  projectionData.push({
    year,
    age,
    corpus: Math.round(corpus),
    contributions: Math.round(contributions),
    returns: Math.round(returns),
    expenses: Math.round(currentExpenses),
    netWorth: Math.round(corpus), // Simplified
    fireProgress: Math.round((corpus / fireCalculationData.fireNumber) * 100),
    isCrossoverYear,
  });
}

// ============================================
// Withdrawal Strategies
// ============================================

export const withdrawalStrategies: WithdrawalStrategyTestData[] = [
  {
    strategy: "swr",
    name: "4% Safe Withdrawal Rate",
    initialRate: 4,
    adjustmentRules: "Withdraw 4% of initial portfolio, adjusted for inflation each year",
    safeWithdrawalAmount: fireCalculationData.fireNumber * 0.04,
    successRate: 95,
  },
  {
    strategy: "bucket",
    name: "Bucket Strategy",
    initialRate: 4,
    adjustmentRules: "3 buckets: 2 years cash, 5 years bonds, rest in equity. Refill from equity gains",
    safeWithdrawalAmount: fireCalculationData.fireNumber * 0.04,
    successRate: 97,
  },
  {
    strategy: "floor_ceiling",
    name: "Floor-Ceiling Strategy",
    initialRate: 4,
    adjustmentRules: "3% floor, 5% ceiling. Adjust based on portfolio performance",
    safeWithdrawalAmount: fireCalculationData.fireNumber * 0.04,
    successRate: 98,
  },
  {
    strategy: "guyton_klinger",
    name: "Guyton-Klinger Guardrails",
    initialRate: 5.2,
    adjustmentRules: "Start at 5.2%, cut 10% if rate > 6%, raise 10% if rate < 4%",
    safeWithdrawalAmount: fireCalculationData.fireNumber * 0.052,
    successRate: 96,
  },
];

// ============================================
// Expense Coverage Analysis
// ============================================

export const expenseCoverageData: ExpenseCoverageTestData[] = [
  {
    category: "Housing",
    monthlyExpense: 5000,
    annualExpense: 60000,
    passiveIncomeCoverage: 25000, // Rental income covers this
    corpusRequired: 60000 * 25,
    corpusAvailable: 25000 * 12 * 25, // Rental income capitalized
    monthsCovered: 9999, // Fully covered by rental
    isCovered: true,
  },
  {
    category: "Utilities",
    monthlyExpense: 8000,
    annualExpense: 96000,
    passiveIncomeCoverage: 0,
    corpusRequired: 96000 * 25,
    corpusAvailable: fireCalculationData.currentCorpus * 0.05,
    monthsCovered: Math.round((fireCalculationData.currentCorpus * 0.05) / 8000),
    isCovered: false,
  },
  {
    category: "Groceries",
    monthlyExpense: 15000,
    annualExpense: 180000,
    passiveIncomeCoverage: 0,
    corpusRequired: 180000 * 25,
    corpusAvailable: fireCalculationData.currentCorpus * 0.10,
    monthsCovered: Math.round((fireCalculationData.currentCorpus * 0.10) / 15000),
    isCovered: false,
  },
  {
    category: "Healthcare",
    monthlyExpense: 5000,
    annualExpense: 60000,
    passiveIncomeCoverage: 0,
    corpusRequired: 60000 * 25,
    corpusAvailable: fireCalculationData.currentCorpus * 0.03,
    monthsCovered: Math.round((fireCalculationData.currentCorpus * 0.03) / 5000),
    isCovered: false,
  },
  {
    category: "Lifestyle",
    monthlyExpense: 20000,
    annualExpense: 240000,
    passiveIncomeCoverage: 0,
    corpusRequired: 240000 * 25,
    corpusAvailable: fireCalculationData.currentCorpus * 0.12,
    monthsCovered: Math.round((fireCalculationData.currentCorpus * 0.12) / 20000),
    isCovered: false,
  },
];

// ============================================
// FIRE Summary
// ============================================

export const fireSummary = {
  // Current Status
  fireNumber: fireCalculationData.fireNumber,
  currentCorpus: fireCalculationData.currentCorpus,
  progress: fireCalculationData.progress,
  yearsToFIRE: fireCalculationData.yearsToFIRE,

  // Variations
  leanFIRE: fireCalculationData.leanFIRE,
  fatFIRE: fireCalculationData.fatFIRE,
  coastFIRE: fireCalculationData.coastFIRE,

  // Freedom Score (how much of expenses are covered by passive income)
  freedomScore: Math.round(
    ((fireCalculationData.currentCorpus * 0.04) / annualExpenses) * 100
  ),

  // Goals Summary
  goals: {
    total: goalsData.length,
    onTrack: goalsData.filter(g => g.onTrack).length,
    offTrack: goalsData.filter(g => !g.onTrack).length,
    totalTargetAmount: goalsData.reduce((sum, g) => sum + g.targetAmount, 0),
    totalCurrentAmount: goalsData.reduce((sum, g) => sum + g.currentAmount, 0),
  },

  // Crossover Point (when passive income > expenses)
  crossoverYear: projectionData.find(p => p.isCrossoverYear)?.year || null,
  crossoverAge: projectionData.find(p => p.isCrossoverYear)?.age || null,

  // Projected corpus at FIRE age
  projectedCorpusAtFIRE: projectionData.find(
    p => p.age === testUserProfile.targets.fireAge
  )?.corpus || 0,
};

// ============================================
// Test Helpers
// ============================================

export function getGoalsByCategory(category: GoalTestData['category']): GoalTestData[] {
  return goalsData.filter(g => g.category === category);
}

export function getGoalsByPriority(priority: GoalTestData['priority']): GoalTestData[] {
  return goalsData.filter(g => g.priority === priority);
}

export function getProjectionAtAge(age: number): ProjectionTestData | undefined {
  return projectionData.find(p => p.age === age);
}

export function getProjectionAtYear(year: number): ProjectionTestData | undefined {
  return projectionData.find(p => p.year === year);
}

export function getCoveredExpenses(): ExpenseCoverageTestData[] {
  return expenseCoverageData.filter(e => e.isCovered);
}

export function calculateFIRENumber(monthlyExpenses: number, withdrawalRate: number = 4): number {
  const annualExpenses = monthlyExpenses * 12;
  return annualExpenses / (withdrawalRate / 100);
}

export function calculateYearsToFIRE(
  currentCorpus: number,
  fireNumber: number,
  annualSavings: number,
  expectedReturn: number = 0.10
): number {
  // Using compound interest formula
  let years = 0;
  let corpus = currentCorpus;
  while (corpus < fireNumber && years < 50) {
    corpus = corpus * (1 + expectedReturn) + annualSavings;
    years++;
  }
  return years;
}
