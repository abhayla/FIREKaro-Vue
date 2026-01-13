/**
 * Investments Test Data
 *
 * Portfolio: Diversified across equity, debt, retirement accounts
 * Total Value: ~Rs. 35L
 */

import { testUserProfile } from './unified-profile';

// ============================================
// Types
// ============================================

export interface StockHoldingTestData {
  id?: string;
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE';
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  sector: string;
  // Calculated
  investedValue: number;
  currentValue: number;
  returns: number;
  returnsPercentage: number;
}

export interface MutualFundTestData {
  id?: string;
  fundName: string;
  fundHouse: string;
  category: 'equity' | 'debt' | 'hybrid' | 'elss';
  investmentType: 'sip' | 'lumpsum' | 'both';
  sipAmount?: number;
  sipDate?: number;
  units: number;
  averageNav: number;
  currentNav: number;
  // Calculated
  investedValue: number;
  currentValue: number;
  xirr?: number;
}

export interface EpfPpfTestData {
  type: 'EPF' | 'PPF';
  accountNumber: string;
  balance: number;
  monthlyContribution?: number;
  yearlyContribution?: number;
  interestRate: number;
  maturityDate?: string;
  // Calculated
  projectedCorpus: number; // At retirement
}

export interface NpsTestData {
  pranNumber: string;
  tier: 'Tier1' | 'Tier2';
  balance: number;
  monthlyContribution: number;
  allocation: {
    equity: number;
    corporate: number;
    government: number;
  };
  fundManager: string;
  // Calculated
  projectedCorpus: number;
}

export interface PropertyTestData {
  id?: string;
  propertyName: string;
  propertyType: 'residential' | 'commercial' | 'land';
  location: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValuation: number;
  linkedLoanId?: string;
  isLetOut: boolean;
  monthlyRent?: number;
  // Calculated
  equity: number; // Value - Loan Outstanding
  appreciation: number;
  appreciationPercentage: number;
}

// ============================================
// Stock Holdings
// ============================================

export const stocksData: StockHoldingTestData[] = [
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    exchange: "NSE",
    quantity: 100,
    averagePrice: 1500,
    currentPrice: 1680,
    sector: "Banking",
    investedValue: 150000,
    currentValue: 168000,
    returns: 18000,
    returnsPercentage: 12,
  },
  {
    symbol: "INFY",
    name: "Infosys Ltd",
    exchange: "NSE",
    quantity: 80,
    averagePrice: 1400,
    currentPrice: 1580,
    sector: "IT",
    investedValue: 112000,
    currentValue: 126400,
    returns: 14400,
    returnsPercentage: 12.86,
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    exchange: "NSE",
    quantity: 30,
    averagePrice: 3200,
    currentPrice: 3600,
    sector: "IT",
    investedValue: 96000,
    currentValue: 108000,
    returns: 12000,
    returnsPercentage: 12.5,
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    exchange: "NSE",
    quantity: 40,
    averagePrice: 2400,
    currentPrice: 2800,
    sector: "Conglomerate",
    investedValue: 96000,
    currentValue: 112000,
    returns: 16000,
    returnsPercentage: 16.67,
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank Ltd",
    exchange: "NSE",
    quantity: 100,
    averagePrice: 900,
    currentPrice: 1050,
    sector: "Banking",
    investedValue: 90000,
    currentValue: 105000,
    returns: 15000,
    returnsPercentage: 16.67,
  },
];

// ============================================
// Mutual Funds
// ============================================

export const mutualFundsData: MutualFundTestData[] = [
  {
    fundName: "Parag Parikh Flexi Cap Fund",
    fundHouse: "PPFAS",
    category: "equity",
    investmentType: "both",
    sipAmount: 20000,
    sipDate: 5,
    units: 4500,
    averageNav: 55,
    currentNav: 68,
    investedValue: 500000,
    currentValue: 620000,
    xirr: 18.5,
  },
  {
    fundName: "Axis Bluechip Fund",
    fundHouse: "Axis",
    category: "equity",
    investmentType: "sip",
    sipAmount: 10000,
    sipDate: 10,
    units: 6000,
    averageNav: 50,
    currentNav: 57.5,
    investedValue: 300000,
    currentValue: 345000,
    xirr: 14.2,
  },
  {
    fundName: "Mirae Asset Large Cap Fund",
    fundHouse: "Mirae",
    category: "equity",
    investmentType: "lumpsum",
    units: 2000,
    averageNav: 80,
    currentNav: 95,
    investedValue: 160000,
    currentValue: 190000,
    xirr: 16.8,
  },
  {
    fundName: "HDFC Short Term Debt Fund",
    fundHouse: "HDFC",
    category: "debt",
    investmentType: "lumpsum",
    units: 4000,
    averageNav: 25,
    currentNav: 27,
    investedValue: 100000,
    currentValue: 108000,
    xirr: 7.5,
  },
  {
    fundName: "Axis ELSS Tax Saver Fund",
    fundHouse: "Axis",
    category: "elss",
    investmentType: "sip",
    sipAmount: 5000,
    sipDate: 1,
    units: 1500,
    averageNav: 65,
    currentNav: 78,
    investedValue: 97500,
    currentValue: 117000,
    xirr: 15.5,
  },
];

// ============================================
// EPF & PPF
// ============================================

export const epfPpfData: EpfPpfTestData[] = [
  {
    type: "EPF",
    accountNumber: "TN/BAN/12345/67890",
    balance: 800000,
    monthlyContribution: 21600, // Employee (12000) + Employer (9600)
    interestRate: 8.25,
    // Projected at age 45 (13 years from now)
    projectedCorpus: 2800000,
  },
  {
    type: "PPF",
    accountNumber: "PPF123456789",
    balance: 500000,
    yearlyContribution: 150000,
    interestRate: 7.1,
    maturityDate: "2035-04-01", // 15 year lock-in
    projectedCorpus: 1200000,
  },
];

// ============================================
// NPS
// ============================================

export const npsData: NpsTestData = {
  pranNumber: "1234567890123",
  tier: "Tier1",
  balance: 400000,
  monthlyContribution: 10000,
  allocation: {
    equity: 75,
    corporate: 15,
    government: 10,
  },
  fundManager: "HDFC Pension",
  projectedCorpus: 2500000, // At age 60
};

// ============================================
// Property
// ============================================

export const propertyData: PropertyTestData[] = [
  {
    propertyName: "Whitefield Apartment",
    propertyType: "residential",
    location: "Prestige Lakeside Habitat, Whitefield, Bangalore",
    purchaseDate: "2020-06-15",
    purchasePrice: 8000000, // Rs. 80L
    currentValuation: 11000000, // Rs. 1.1Cr
    linkedLoanId: "home-loan-1", // Linked to home loan in liabilities
    isLetOut: true,
    monthlyRent: 25000,
    equity: 7800000, // 11000000 - 3200000 (outstanding loan)
    appreciation: 3000000,
    appreciationPercentage: 37.5,
  },
];

// ============================================
// Portfolio Summary
// ============================================

export const portfolioSummary = {
  // Stocks
  stocks: {
    count: stocksData.length,
    totalInvested: stocksData.reduce((sum, s) => sum + s.investedValue, 0),
    totalCurrent: stocksData.reduce((sum, s) => sum + s.currentValue, 0),
    totalReturns: stocksData.reduce((sum, s) => sum + s.returns, 0),
  },

  // Mutual Funds
  mutualFunds: {
    count: mutualFundsData.length,
    totalInvested: mutualFundsData.reduce((sum, m) => sum + m.investedValue, 0),
    totalCurrent: mutualFundsData.reduce((sum, m) => sum + m.currentValue, 0),
    monthlySIP: mutualFundsData.reduce((sum, m) => sum + (m.sipAmount || 0), 0),
  },

  // Retirement (EPF + PPF + NPS)
  retirement: {
    epfBalance: epfPpfData.find(e => e.type === 'EPF')?.balance || 0,
    ppfBalance: epfPpfData.find(e => e.type === 'PPF')?.balance || 0,
    npsBalance: npsData.balance,
    totalBalance: epfPpfData.reduce((sum, e) => sum + e.balance, 0) + npsData.balance,
  },

  // Property (equity only, not gross value)
  property: {
    count: propertyData.length,
    totalValuation: propertyData.reduce((sum, p) => sum + p.currentValuation, 0),
    totalEquity: propertyData.reduce((sum, p) => sum + p.equity, 0),
  },

  // Grand Total (liquid investments only, excluding property)
  get totalPortfolioValue() {
    return (
      this.stocks.totalCurrent +
      this.mutualFunds.totalCurrent +
      this.retirement.totalBalance
    );
  },

  get totalInvested() {
    return (
      this.stocks.totalInvested +
      this.mutualFunds.totalInvested +
      this.retirement.totalBalance // For retirement, invested = current balance
    );
  },

  get totalReturns() {
    return this.totalPortfolioValue - this.totalInvested;
  },

  get returnsPercentage() {
    return Math.round((this.totalReturns / this.totalInvested) * 100 * 100) / 100;
  },
};

// ============================================
// Asset Allocation
// ============================================

export const assetAllocation = {
  equity: {
    stocks: portfolioSummary.stocks.totalCurrent,
    equityMF: mutualFundsData
      .filter(m => m.category === 'equity' || m.category === 'elss')
      .reduce((sum, m) => sum + m.currentValue, 0),
    npsEquity: npsData.balance * (npsData.allocation.equity / 100),
    total: 0, // Will calculate
  },

  debt: {
    debtMF: mutualFundsData
      .filter(m => m.category === 'debt')
      .reduce((sum, m) => sum + m.currentValue, 0),
    epf: epfPpfData.find(e => e.type === 'EPF')?.balance || 0,
    ppf: epfPpfData.find(e => e.type === 'PPF')?.balance || 0,
    npsDebt: npsData.balance * ((npsData.allocation.corporate + npsData.allocation.government) / 100),
    total: 0, // Will calculate
  },

  property: {
    equity: portfolioSummary.property.totalEquity,
  },
};

// Calculate totals
assetAllocation.equity.total =
  assetAllocation.equity.stocks +
  assetAllocation.equity.equityMF +
  assetAllocation.equity.npsEquity;

assetAllocation.debt.total =
  assetAllocation.debt.debtMF +
  assetAllocation.debt.epf +
  assetAllocation.debt.ppf +
  assetAllocation.debt.npsDebt;

// ============================================
// Test Helpers
// ============================================

export function getStocksBySector(sector: string): StockHoldingTestData[] {
  return stocksData.filter(s => s.sector === sector);
}

export function getMutualFundsByCategory(category: MutualFundTestData['category']): MutualFundTestData[] {
  return mutualFundsData.filter(m => m.category === category);
}

export function getSIPFunds(): MutualFundTestData[] {
  return mutualFundsData.filter(m => m.investmentType === 'sip' || m.investmentType === 'both');
}

export function getTotalMonthlySIP(): number {
  return mutualFundsData.reduce((sum, m) => sum + (m.sipAmount || 0), 0);
}

export function getRetirementProjection(): { epf: number; ppf: number; nps: number; total: number } {
  return {
    epf: epfPpfData.find(e => e.type === 'EPF')?.projectedCorpus || 0,
    ppf: epfPpfData.find(e => e.type === 'PPF')?.projectedCorpus || 0,
    nps: npsData.projectedCorpus,
    total:
      (epfPpfData.find(e => e.type === 'EPF')?.projectedCorpus || 0) +
      (epfPpfData.find(e => e.type === 'PPF')?.projectedCorpus || 0) +
      npsData.projectedCorpus,
  };
}

// ============================================
// SIP Progression Test Data (New Feature)
// ============================================

export interface SIPHistoryTestData {
  year: number;
  monthlyAmount: number;
  yearOverYearGrowth?: number; // Percentage
}

export const sipHistoryData: SIPHistoryTestData[] = [
  { year: 2018, monthlyAmount: 10000 },
  { year: 2019, monthlyAmount: 20000, yearOverYearGrowth: 100 },
  { year: 2020, monthlyAmount: 30000, yearOverYearGrowth: 50 },
  { year: 2021, monthlyAmount: 45000, yearOverYearGrowth: 50 },
  { year: 2022, monthlyAmount: 55000, yearOverYearGrowth: 22 },
  { year: 2023, monthlyAmount: 70000, yearOverYearGrowth: 27 },
  { year: 2024, monthlyAmount: 90000, yearOverYearGrowth: 29 },
  { year: 2025, monthlyAmount: 110000, yearOverYearGrowth: 22 },
];

export const sipSummary = {
  currentMonthly: 110000,
  totalGrowth: 1000, // 10x growth from 10K to 110K
  averageYearlyGrowth: 41, // Percentage
  yearsTracked: sipHistoryData.length,
};

// ============================================
// Compounding Visualization Test Data (New Feature)
// ============================================

export interface CompoundingDataPoint {
  year: number;
  contributions: number; // Cumulative contributions
  returns: number; // Cumulative returns
  totalValue: number;
  returnsExceedContributions: boolean;
}

export const compoundingData: CompoundingDataPoint[] = [
  { year: 2018, contributions: 120000, returns: 8000, totalValue: 128000, returnsExceedContributions: false },
  { year: 2019, contributions: 360000, returns: 45000, totalValue: 405000, returnsExceedContributions: false },
  { year: 2020, contributions: 720000, returns: 95000, totalValue: 815000, returnsExceedContributions: false },
  { year: 2021, contributions: 1260000, returns: 280000, totalValue: 1540000, returnsExceedContributions: false },
  { year: 2022, contributions: 1920000, returns: 420000, totalValue: 2340000, returnsExceedContributions: false },
  { year: 2023, contributions: 2760000, returns: 780000, totalValue: 3540000, returnsExceedContributions: false },
  { year: 2024, contributions: 3840000, returns: 1260000, totalValue: 5100000, returnsExceedContributions: false },
  { year: 2025, contributions: 5160000, returns: 2040000, totalValue: 7200000, returnsExceedContributions: false },
  // Projected crossover point
  { year: 2028, contributions: 8000000, returns: 8500000, totalValue: 16500000, returnsExceedContributions: true },
];

export const compoundingSummary = {
  currentContributions: 5160000,
  currentReturns: 2040000,
  currentValue: 7200000,
  returnsMultiplier: 0.40, // Returns are 40% of contributions
  crossoverYear: 2028, // Year when returns exceed contributions
  isCompoundingStrong: true, // Returns > 50% of contributions
};

// ============================================
// Portfolio Journey Test Data (New Feature)
// ============================================

export interface PortfolioSnapshotTestData {
  id?: string;
  date: string;
  totalValue: number;
  notes?: string;
}

export const portfolioJourneyData: PortfolioSnapshotTestData[] = [
  { date: "2018-01-01", totalValue: 100000, notes: "Started investing" },
  { date: "2019-01-01", totalValue: 450000, notes: "Steady accumulation" },
  { date: "2020-01-01", totalValue: 850000, notes: "Pre-COVID" },
  { date: "2020-04-01", totalValue: 620000, notes: "COVID crash" },
  { date: "2021-01-01", totalValue: 1500000, notes: "Recovery + new investments" },
  { date: "2022-01-01", totalValue: 2400000, notes: "Bull run" },
  { date: "2023-01-01", totalValue: 3200000, notes: "Bonus investment" },
  { date: "2024-01-01", totalValue: 4800000, notes: "Strong growth" },
  { date: "2025-01-01", totalValue: 7200000, notes: "Compounding kicking in" },
];

export const portfolioJourneySummary = {
  startValue: 100000,
  currentValue: 7200000,
  totalGrowth: 7100000,
  totalGrowthPercent: 7100, // 71x
  yearsTracked: 7,
  cagr: 84.5, // Compound annual growth rate
};

export const testSnapshot: PortfolioSnapshotTestData = {
  date: "2025-06-15",
  totalValue: 7500000,
  notes: "Mid-year update",
};

// ============================================
// Yield Calculations Test Data (New Feature)
// ============================================

export const yieldData = {
  dividendYield: {
    annualDividends: 180000, // Rs. 1.8L/year
    portfolioValue: 7200000, // Rs. 72L
    yield: 2.5, // 2.5%
  },
  rentalYield: {
    annualRent: 300000, // Rs. 3L/year (25K/month)
    propertyValue: 11000000, // Rs. 1.1Cr
    yield: 2.7, // 2.7%
  },
  combinedYield: {
    totalPassiveIncome: 480000, // Dividends + Rent
    totalAssets: 18200000, // Portfolio + Property
    yield: 2.6, // 2.6% combined
  },
};

// ============================================
// Crypto Test Data (New Feature)
// ============================================

export interface CryptoHoldingTestData {
  id?: string;
  name: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  returns: number;
  returnsPercentage: number;
}

export const cryptoData: CryptoHoldingTestData[] = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    quantity: 0.05,
    averagePrice: 3500000, // Rs. 35L per BTC
    currentPrice: 8500000, // Rs. 85L per BTC
    investedValue: 175000,
    currentValue: 425000,
    returns: 250000,
    returnsPercentage: 142.86,
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    quantity: 0.5,
    averagePrice: 150000, // Rs. 1.5L per ETH
    currentPrice: 280000, // Rs. 2.8L per ETH
    investedValue: 75000,
    currentValue: 140000,
    returns: 65000,
    returnsPercentage: 86.67,
  },
];

export const cryptoSummary = {
  totalInvested: 250000,
  currentValue: 565000,
  totalReturns: 315000,
  returnsPercentage: 126,
  holdingsCount: cryptoData.length,
};

export const testCryptoHolding: CryptoHoldingTestData = {
  name: "Solana",
  symbol: "SOL",
  quantity: 10,
  averagePrice: 8000,
  currentPrice: 12000,
  investedValue: 80000,
  currentValue: 120000,
  returns: 40000,
  returnsPercentage: 50,
};

// ============================================
// Additional Test Helpers
// ============================================

export function getSIPForYear(year: number): SIPHistoryTestData | undefined {
  return sipHistoryData.find(s => s.year === year);
}

export function getCompoundingCrossoverYear(): number {
  const crossoverPoint = compoundingData.find(d => d.returnsExceedContributions);
  return crossoverPoint?.year || 0;
}

export function getJourneySnapshot(date: string): PortfolioSnapshotTestData | undefined {
  return portfolioJourneyData.find(s => s.date === date);
}

export function getCryptoBySymbol(symbol: string): CryptoHoldingTestData | undefined {
  return cryptoData.find(c => c.symbol === symbol);
}

export function getTotalCryptoValue(): number {
  return cryptoData.reduce((sum, c) => sum + c.currentValue, 0);
}

// ============================================
// ESOP/RSU Test Data
// ============================================

export type GrantType = 'ESOP' | 'RSU' | 'RSA' | 'SAR' | 'PHANTOM';
export type VestingScheduleType = 'CLIFF' | 'GRADED' | 'IMMEDIATE';
export type GrantStatus = 'ACTIVE' | 'PARTIALLY_VESTED' | 'FULLY_VESTED' | 'EXERCISED' | 'CANCELLED';

export interface ESOPGrantTestData {
  id?: string;
  grantType: GrantType;
  grantDate: string;
  grantNumber: string;
  companyName: string;
  companySymbol?: string;
  totalUnits: number;
  grantPrice: number;
  fairMarketValue: number;
  currentFMV: number;
  vestingScheduleType: VestingScheduleType;
  vestingStartDate: string;
  cliffMonths: number;
  totalVestingMonths: number;
  vestingFrequency: number;
  status: GrantStatus;
  vestedUnits: number;
  exercisedUnits: number;
  exercisableUnits: number;
  unvestedUnits: number;
  forfeitedUnits: number;
  perquisiteValue: number;
  taxPaid: number;
  isListedCompany: boolean;
  isStartup: boolean;
  planName: string;
}

export const esopGrantsData: ESOPGrantTestData[] = [
  {
    grantType: "ESOP",
    grantDate: "2022-04-01",
    grantNumber: "ESOP-2022-001",
    companyName: "TechCorp India Pvt Ltd",
    totalUnits: 10000,
    grantPrice: 100,
    fairMarketValue: 150,
    currentFMV: 450,
    vestingScheduleType: "GRADED",
    vestingStartDate: "2022-04-01",
    cliffMonths: 12,
    totalVestingMonths: 48,
    vestingFrequency: 12,
    status: "PARTIALLY_VESTED",
    vestedUnits: 5000,
    exercisedUnits: 2000,
    exercisableUnits: 3000,
    unvestedUnits: 5000,
    forfeitedUnits: 0,
    perquisiteValue: 700000,
    taxPaid: 210000,
    isListedCompany: false,
    isStartup: true,
    planName: "ESOP 2022",
  },
  {
    grantType: "RSU",
    grantDate: "2023-01-15",
    grantNumber: "RSU-2023-042",
    companyName: "Global Tech Ltd",
    companySymbol: "GTECH",
    totalUnits: 500,
    grantPrice: 0,
    fairMarketValue: 2500,
    currentFMV: 3200,
    vestingScheduleType: "CLIFF",
    vestingStartDate: "2023-01-15",
    cliffMonths: 24,
    totalVestingMonths: 24,
    vestingFrequency: 24,
    status: "ACTIVE",
    vestedUnits: 0,
    exercisedUnits: 0,
    exercisableUnits: 0,
    unvestedUnits: 500,
    forfeitedUnits: 0,
    perquisiteValue: 0,
    taxPaid: 0,
    isListedCompany: true,
    isStartup: false,
    planName: "RSU Plan 2023",
  },
];

export const esopSummary = {
  totalGrants: esopGrantsData.length,
  activeGrants: esopGrantsData.filter(
    (g) => g.status !== "EXERCISED" && g.status !== "CANCELLED"
  ).length,
  totalUnits: esopGrantsData.reduce((sum, g) => sum + g.totalUnits, 0),
  vestedUnits: esopGrantsData.reduce((sum, g) => sum + g.vestedUnits, 0),
  exercisedUnits: esopGrantsData.reduce((sum, g) => sum + g.exercisedUnits, 0),
  exercisableUnits: esopGrantsData.reduce((sum, g) => sum + g.exercisableUnits, 0),
  unvestedUnits: esopGrantsData.reduce((sum, g) => sum + g.unvestedUnits, 0),
  totalCurrentValue: esopGrantsData.reduce(
    (sum, g) => sum + g.totalUnits * g.currentFMV,
    0
  ),
  vestedValue: esopGrantsData.reduce(
    (sum, g) => sum + g.vestedUnits * g.currentFMV,
    0
  ),
  exercisableValue: esopGrantsData.reduce(
    (sum, g) => sum + g.exercisableUnits * g.currentFMV,
    0
  ),
  unvestedValue: esopGrantsData.reduce(
    (sum, g) => sum + g.unvestedUnits * g.currentFMV,
    0
  ),
  totalPerquisiteValue: esopGrantsData.reduce((sum, g) => sum + g.perquisiteValue, 0),
  totalTaxPaid: esopGrantsData.reduce((sum, g) => sum + g.taxPaid, 0),
  companies: [...new Set(esopGrantsData.map((g) => g.companyName))],
};

export const testESOPGrant: ESOPGrantTestData = {
  grantType: "ESOP",
  grantDate: "2024-01-01",
  grantNumber: "ESOP-2024-TEST",
  companyName: "Test Startup Inc",
  totalUnits: 1000,
  grantPrice: 50,
  fairMarketValue: 75,
  currentFMV: 100,
  vestingScheduleType: "GRADED",
  vestingStartDate: "2024-01-01",
  cliffMonths: 12,
  totalVestingMonths: 48,
  vestingFrequency: 12,
  status: "ACTIVE",
  vestedUnits: 0,
  exercisedUnits: 0,
  exercisableUnits: 0,
  unvestedUnits: 1000,
  forfeitedUnits: 0,
  perquisiteValue: 0,
  taxPaid: 0,
  isListedCompany: false,
  isStartup: true,
  planName: "Test Plan 2024",
};

export function getESOPGrantByType(type: GrantType): ESOPGrantTestData | undefined {
  return esopGrantsData.find(g => g.grantType === type);
}

export function getExercisableGrants(): ESOPGrantTestData[] {
  return esopGrantsData.filter(g => g.exercisableUnits > 0);
}
