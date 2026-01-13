/**
 * Income Test Data
 *
 * Profile: Lead Software Engineer with freelance consulting,
 * rental property, stock investments, and interest income
 */

import { testUserProfile } from './unified-profile';

// ============================================
// Types
// ============================================

export interface BusinessIncomeTestData {
  id?: string;
  businessName: string;
  businessType: 'proprietorship' | 'partnership' | 'freelance' | 'commission_agent';
  taxationMethod: '44AD' | '44ADA' | 'regular_books';
  financialYear: string;
  grossReceipts: number;
  cashReceiptsPercentage: number;
  digitalPaymentPercentage: number;
  gstRegistered: boolean;
  gstNumber?: string;
  // Calculated
  expectedDeemedProfit: number;
  expectedProfitRate: number;
}

export interface RentalIncomeTestData {
  id?: string;
  propertyName: string;  // Mandatory
  propertyType: 'residential' | 'commercial';
  propertyAddress?: string;  // Optional
  financialYear: string;
  monthlyRent: number;  // Mandatory
  annualRent: number;
  vacantMonths: number;
  municipalTaxesPaid: number;
  housingLoanInterest: number;
  isLetOut: boolean;
  // Calculated
  expectedGrossAnnualValue: number;
  expectedNetAnnualValue: number;
  expectedSection24Deduction: number;
}

export interface CapitalGainTestData {
  id?: string;
  assetType: 'equity' | 'mutual_fund' | 'property' | 'gold' | 'crypto';
  assetName: string;
  financialYear: string;
  purchaseDate: string;
  purchasePrice: number;
  saleDate: string;
  salePrice: number;
  holdingPeriod: number; // in months
  gainType: 'STCG' | 'LTCG';
  indexedCost?: number;
  // Calculated
  expectedGain: number;
  expectedTaxableGain: number;
  expectedTaxRate: number;
  expectedTax: number;
}

export interface OtherIncomeTestData {
  id?: string;
  category: 'interest' | 'dividend' | 'commission' | 'royalty' | 'other';
  subcategory?: 'fd' | 'rd' | 'savings' | 'p2p' | 'stock' | 'mf';
  description: string;
  financialYear: string;
  grossAmount: number;
  tdsDeducted: number;
  tdsRate?: number;
  // For 80TTA/80TTB
  eligible80TTA?: boolean;
  eligible80TTB?: boolean;
  // Aliases for test compatibility
  incomeType?: string;
  amount?: number;
}

export interface InterestIncomeTestData {
  id?: string;
  sourceType: 'fd' | 'rd' | 'savings' | 'p2p' | 'bonds' | 'nsc' | 'scss';  // Mandatory
  institutionName?: string;  // Optional
  accountNumber?: string;
  financialYear: string;
  principalAmount: number;  // Mandatory
  interestRate: number;  // Mandatory
  interestEarned?: number;  // Optional (can be auto-calculated)
  tdsDeducted: number;
  maturityDate?: string;
  is80TTAEligible?: boolean;
  is80TTBEligible?: boolean;
}

export interface DividendIncomeTestData {
  id?: string;
  sourceType: 'stock' | 'mutual_fund';  // Mandatory
  companyOrFundName: string;  // Mandatory
  symbol?: string;
  financialYear: string;
  dividendAmount: number;  // Mandatory
  dividendDate?: string;  // Optional (paymentDate)
  tdsDeducted: number;
}

// ============================================
// Business Income Data (FY 2025-26)
// ============================================

export const businessIncomeData: BusinessIncomeTestData[] = [
  {
    businessName: "Tech Consulting Services",
    businessType: "freelance",
    taxationMethod: "44ADA",
    financialYear: "2025-26",
    grossReceipts: 600000, // Rs. 6L
    cashReceiptsPercentage: 10,
    digitalPaymentPercentage: 90,
    gstRegistered: false,
    // 44ADA: 50% deemed profit for professionals
    expectedDeemedProfit: 300000,
    expectedProfitRate: 50,
  },
  {
    businessName: "Online Course Sales",
    businessType: "proprietorship",
    taxationMethod: "44AD",
    financialYear: "2025-26",
    grossReceipts: 200000, // Rs. 2L
    cashReceiptsPercentage: 20,
    digitalPaymentPercentage: 80,
    gstRegistered: false,
    // 44AD: 6% for digital, 8% for cash
    // (160000 * 0.06) + (40000 * 0.08) = 9600 + 3200 = 12800
    expectedDeemedProfit: 12800,
    expectedProfitRate: 6.4,
  },
  {
    businessName: "Cloud Architecture Consulting",
    businessType: "freelance",
    taxationMethod: "44ADA",
    financialYear: "2025-26",
    grossReceipts: 3000000, // Rs. 30L
    cashReceiptsPercentage: 5,
    digitalPaymentPercentage: 95,
    gstRegistered: true,
    gstNumber: "29ABCDE1234F1Z5",
    // 44ADA: 50% deemed profit for professionals
    expectedDeemedProfit: 1500000,
    expectedProfitRate: 50,
  },
  {
    businessName: "Software Reselling",
    businessType: "partnership",
    taxationMethod: "44AD",
    financialYear: "2025-26",
    grossReceipts: 1500000, // Rs. 15L
    cashReceiptsPercentage: 0,
    digitalPaymentPercentage: 100,
    gstRegistered: true,
    gstNumber: "29XYZPQ9876R1Z8",
    // 44AD: 6% for digital payments (all digital)
    // 1500000 * 0.06 = 90000
    expectedDeemedProfit: 90000,
    expectedProfitRate: 6,
  },
];

// ============================================
// Rental Income Data (FY 2025-26)
// ============================================

export const rentalIncomeData: RentalIncomeTestData[] = [
  {
    propertyName: "Whitefield Apartment",
    propertyType: "residential",
    propertyAddress: "Prestige Lakeside Habitat, Whitefield, Bangalore 560066",
    financialYear: "2025-26",
    monthlyRent: 25000,
    annualRent: 300000, // Rs. 3L
    vacantMonths: 0,
    municipalTaxesPaid: 12000,
    housingLoanInterest: 180000, // Rs. 1.8L (Section 24)
    isLetOut: true,
    // GAV = 300000
    // NAV = GAV - Municipal Tax = 300000 - 12000 = 288000
    // Standard Deduction (30%) = 86400
    // Section 24 Interest = min(180000, 200000) = 180000
    // Net = 288000 - 86400 - 180000 = 21600
    expectedGrossAnnualValue: 300000,
    expectedNetAnnualValue: 21600,
    expectedSection24Deduction: 180000,
  },
  {
    propertyName: "Electronic City Investment",
    propertyType: "residential",
    propertyAddress: "Brigade Gateway, Electronic City Phase 1, Bangalore 560100",
    financialYear: "2025-26",
    monthlyRent: 38000,
    annualRent: 456000, // Rs. 4.56L
    vacantMonths: 1,
    municipalTaxesPaid: 18000,
    housingLoanInterest: 0, // Loan paid off
    isLetOut: true,
    // GAV = 456000 - (38000 * 1 vacancy) = 418000
    // NAV = GAV - Municipal Tax = 418000 - 18000 = 400000
    // Standard Deduction (30%) = 120000
    // Net = 400000 - 120000 = 280000
    expectedGrossAnnualValue: 418000,
    expectedNetAnnualValue: 280000,
    expectedSection24Deduction: 0,
  },
  {
    propertyName: "Commercial Shop",
    propertyType: "commercial",
    propertyAddress: "MG Road, Bangalore 560001",
    financialYear: "2025-26",
    monthlyRent: 45000,
    annualRent: 540000, // Rs. 5.4L
    vacantMonths: 0,
    municipalTaxesPaid: 25000,
    housingLoanInterest: 0,
    isLetOut: true,
    // GAV = 540000
    // NAV = GAV - Municipal Tax = 540000 - 25000 = 515000
    // Standard Deduction (30%) = 154500
    // Net = 515000 - 154500 = 360500
    expectedGrossAnnualValue: 540000,
    expectedNetAnnualValue: 360500,
    expectedSection24Deduction: 0,
  },
];

// ============================================
// Capital Gains Data (FY 2025-26)
// ============================================

export const capitalGainsData: CapitalGainTestData[] = [
  {
    assetType: "equity",
    assetName: "HDFC Bank Shares",
    financialYear: "2025-26",
    purchaseDate: "2023-01-15",
    purchasePrice: 500000,
    saleDate: "2025-06-20",
    salePrice: 750000,
    holdingPeriod: 29, // > 12 months = LTCG
    gainType: "LTCG",
    // LTCG on equity: 12.5% above Rs. 1.25L exemption
    expectedGain: 250000,
    expectedTaxableGain: 125000, // 250000 - 125000 exemption
    expectedTaxRate: 12.5,
    expectedTax: 15625,
  },
  {
    assetType: "mutual_fund",
    assetName: "Axis Bluechip Fund",
    financialYear: "2025-26",
    purchaseDate: "2024-09-01",
    purchasePrice: 100000,
    saleDate: "2025-05-15",
    salePrice: 115000,
    holdingPeriod: 8, // < 12 months = STCG
    gainType: "STCG",
    // STCG on equity MF: 20%
    expectedGain: 15000,
    expectedTaxableGain: 15000,
    expectedTaxRate: 20,
    expectedTax: 3000,
  },
  {
    assetType: "gold",
    assetName: "Sovereign Gold Bonds",
    financialYear: "2025-26",
    purchaseDate: "2022-03-10",
    purchasePrice: 200000,
    saleDate: "2025-04-15",
    salePrice: 280000,
    holdingPeriod: 37, // > 36 months = LTCG for gold
    gainType: "LTCG",
    indexedCost: 240000, // With indexation
    // LTCG on gold: 12.5% without indexation (new rules)
    expectedGain: 80000,
    expectedTaxableGain: 80000,
    expectedTaxRate: 12.5,
    expectedTax: 10000,
  },
  {
    assetType: "equity",
    assetName: "Reliance Industries",
    financialYear: "2025-26",
    purchaseDate: "2020-04-15",
    purchasePrice: 132000, // 600 shares @ 2200
    saleDate: "2025-08-10",
    salePrice: 171000, // 600 shares @ 2850
    holdingPeriod: 64, // > 12 months = LTCG
    gainType: "LTCG",
    // LTCG on equity: 12.5% above Rs. 1.25L exemption
    expectedGain: 39000,
    expectedTaxableGain: 0, // Below 1.25L exemption threshold
    expectedTaxRate: 12.5,
    expectedTax: 0,
  },
  {
    assetType: "equity",
    assetName: "Infosys",
    financialYear: "2025-26",
    purchaseDate: "2022-02-20",
    purchasePrice: 1400000, // 1000 shares @ 1400
    saleDate: "2025-07-15",
    salePrice: 1750000, // 1000 shares @ 1750
    holdingPeriod: 41, // > 12 months = LTCG
    gainType: "LTCG",
    // LTCG on equity: 12.5% above Rs. 1.25L exemption
    expectedGain: 350000,
    expectedTaxableGain: 225000, // 350000 - 125000 exemption
    expectedTaxRate: 12.5,
    expectedTax: 28125,
  },
  {
    assetType: "equity",
    assetName: "TCS",
    financialYear: "2025-26",
    purchaseDate: "2025-01-15",
    purchasePrice: 410000, // 100 shares @ 4100
    saleDate: "2025-06-20",
    salePrice: 430000, // 100 shares @ 4300
    holdingPeriod: 5, // < 12 months = STCG
    gainType: "STCG",
    // STCG on equity: 20%
    expectedGain: 20000,
    expectedTaxableGain: 20000,
    expectedTaxRate: 20,
    expectedTax: 4000,
  },
  {
    assetType: "property",
    assetName: "Land in Hosur",
    financialYear: "2025-26",
    purchaseDate: "2018-06-01",
    purchasePrice: 3000000,
    saleDate: "2025-09-15",
    salePrice: 5500000,
    holdingPeriod: 87, // > 24 months = LTCG for property
    gainType: "LTCG",
    indexedCost: 4200000, // With indexation
    // LTCG on property: 12.5% without indexation (new rules)
    expectedGain: 2500000,
    expectedTaxableGain: 1300000,
    expectedTaxRate: 12.5,
    expectedTax: 162500,
  },
];

// ============================================
// Interest Income Data (FY 2025-26)
// ============================================

export const interestIncomeData: InterestIncomeTestData[] = [
  {
    sourceType: 'fd',
    institutionName: "HDFC Bank",
    accountNumber: "FD123456789",
    financialYear: "2025-26",
    principalAmount: 1000000,
    interestRate: 7.5,
    interestEarned: 75000,
    tdsDeducted: 7500,
    maturityDate: "2026-03-15",
    is80TTAEligible: false,
  },
  {
    sourceType: 'savings',
    institutionName: "ICICI Bank Savings",
    accountNumber: "SAV987654321",
    financialYear: "2025-26",
    principalAmount: 500000,
    interestRate: 3.5,
    interestEarned: 15000,
    tdsDeducted: 0,
    is80TTAEligible: true, // Eligible for 80TTA deduction up to Rs. 10,000
  },
  {
    sourceType: 'rd',
    institutionName: "SBI Recurring Deposit",
    accountNumber: "RD456789123",
    financialYear: "2025-26",
    principalAmount: 240000,
    interestRate: 6.5,
    interestEarned: 12000,
    tdsDeducted: 1200,
    maturityDate: "2027-06-01",
    is80TTAEligible: false,
  },
  {
    sourceType: 'p2p',
    institutionName: "Faircent P2P",
    financialYear: "2025-26",
    principalAmount: 300000,
    interestRate: 12,
    interestEarned: 30000,
    tdsDeducted: 3000,
    is80TTAEligible: false,
  },
  {
    sourceType: 'nsc',
    institutionName: "NSC - Post Office",
    financialYear: "2025-26",
    principalAmount: 150000,
    interestRate: 7.7,
    interestEarned: 11550,
    tdsDeducted: 0,
    maturityDate: "2030-01-10",
    is80TTAEligible: false,
  },
];

// ============================================
// Dividend Income Data (FY 2025-26)
// ============================================

export const dividendIncomeData: DividendIncomeTestData[] = [
  {
    sourceType: 'stock',
    companyOrFundName: "HDFC Bank Ltd",
    symbol: "HDFCBANK",
    financialYear: "2025-26",
    dividendAmount: 8500,
    dividendDate: "2025-06-15",
    tdsDeducted: 850,
  },
  {
    sourceType: 'stock',
    companyOrFundName: "Infosys Ltd",
    symbol: "INFY",
    financialYear: "2025-26",
    dividendAmount: 12000,
    dividendDate: "2025-07-20",
    tdsDeducted: 1200,
  },
  {
    sourceType: 'stock',
    companyOrFundName: "Tata Consultancy Services",
    symbol: "TCS",
    financialYear: "2025-26",
    dividendAmount: 6500,
    dividendDate: "2025-08-10",
    tdsDeducted: 650,
  },
  {
    sourceType: 'mutual_fund',
    companyOrFundName: "HDFC Equity Fund - Dividend",
    financialYear: "2025-26",
    dividendAmount: 5000,
    dividendDate: "2025-09-05",
    tdsDeducted: 500,
  },
  {
    sourceType: 'mutual_fund',
    companyOrFundName: "ICICI Pru Value Discovery Fund",
    financialYear: "2025-26",
    dividendAmount: 3500,
    dividendDate: "2025-10-15",
    tdsDeducted: 350,
  },
];

// ============================================
// Other Income Data (FY 2025-26)
// ============================================

export const otherIncomeData: OtherIncomeTestData[] = [
  {
    category: "interest",
    subcategory: "fd",
    description: "HDFC Bank FD Interest",
    financialYear: "2025-26",
    grossAmount: 80000,
    tdsDeducted: 8000,
    tdsRate: 10,
    eligible80TTA: false,
  },
  {
    category: "interest",
    subcategory: "savings",
    description: "Savings Account Interest",
    financialYear: "2025-26",
    grossAmount: 15000,
    tdsDeducted: 0,
    eligible80TTA: true, // Eligible for 80TTA deduction up to Rs. 10,000
  },
  {
    category: "interest",
    subcategory: "rd",
    description: "ICICI Recurring Deposit Interest",
    financialYear: "2025-26",
    grossAmount: 12000,
    tdsDeducted: 1200,
    tdsRate: 10,
    eligible80TTA: false,
  },
  {
    category: "dividend",
    subcategory: "stock",
    description: "Stock Dividends (HDFC, Infosys, TCS)",
    financialYear: "2025-26",
    grossAmount: 25000,
    tdsDeducted: 2500,
    tdsRate: 10,
  },
  {
    category: "dividend",
    subcategory: "mf",
    description: "Mutual Fund Dividends",
    financialYear: "2025-26",
    grossAmount: 8000,
    tdsDeducted: 800,
    tdsRate: 10,
  },
  {
    category: "interest",
    subcategory: "p2p",
    description: "P2P Lending Returns (Faircent)",
    financialYear: "2025-26",
    grossAmount: 30000,
    tdsDeducted: 3000,
    tdsRate: 10,
    eligible80TTA: false,
  },
];

// ============================================
// Summary Calculations
// ============================================

export const incomeSummary = {
  financialYear: "2025-26",

  businessIncome: {
    count: businessIncomeData.length,
    totalGrossReceipts: businessIncomeData.reduce((sum, b) => sum + b.grossReceipts, 0),
    totalDeemedProfit: businessIncomeData.reduce((sum, b) => sum + b.expectedDeemedProfit, 0),
  },

  rentalIncome: {
    count: rentalIncomeData.length,
    totalAnnualRent: rentalIncomeData.reduce((sum, r) => sum + r.annualRent, 0),
    totalNetAnnualValue: rentalIncomeData.reduce((sum, r) => sum + r.expectedNetAnnualValue, 0),
  },

  capitalGains: {
    count: capitalGainsData.length,
    totalGains: capitalGainsData.reduce((sum, cg) => sum + cg.expectedGain, 0),
    totalTaxableGains: capitalGainsData.reduce((sum, cg) => sum + cg.expectedTaxableGain, 0),
    totalTax: capitalGainsData.reduce((sum, cg) => sum + cg.expectedTax, 0),
    stcgTotal: capitalGainsData
      .filter(cg => cg.gainType === 'STCG')
      .reduce((sum, cg) => sum + cg.expectedTaxableGain, 0),
    ltcgTotal: capitalGainsData
      .filter(cg => cg.gainType === 'LTCG')
      .reduce((sum, cg) => sum + cg.expectedTaxableGain, 0),
  },

  otherIncome: {
    count: otherIncomeData.length,
    totalGross: otherIncomeData.reduce((sum, o) => sum + o.grossAmount, 0),
    totalTds: otherIncomeData.reduce((sum, o) => sum + o.tdsDeducted, 0),
    interestTotal: otherIncomeData
      .filter(o => o.category === 'interest')
      .reduce((sum, o) => sum + o.grossAmount, 0),
    dividendTotal: otherIncomeData
      .filter(o => o.category === 'dividend')
      .reduce((sum, o) => sum + o.grossAmount, 0),
    eligible80TTA: otherIncomeData
      .filter(o => o.eligible80TTA)
      .reduce((sum, o) => sum + Math.min(o.grossAmount, 10000), 0),
  },

  // Grand total (excluding salary)
  get totalIncome() {
    return (
      this.businessIncome.totalDeemedProfit +
      this.rentalIncome.totalNetAnnualValue +
      this.capitalGains.totalTaxableGains +
      this.otherIncome.totalGross
    );
  },
};

// ============================================
// Test Helpers
// ============================================

export function getBusinessIncomeByType(type: BusinessIncomeTestData['businessType']) {
  return businessIncomeData.filter(b => b.businessType === type);
}

export function getCapitalGainsByType(gainType: 'STCG' | 'LTCG') {
  return capitalGainsData.filter(cg => cg.gainType === gainType);
}

export function getOtherIncomeByCategory(category: OtherIncomeTestData['category']) {
  return otherIncomeData.filter(o => o.category === category);
}

export function getInterestIncomeBreakdown() {
  const interest = otherIncomeData.filter(o => o.category === 'interest');
  return {
    fd: interest.filter(i => i.subcategory === 'fd').reduce((s, i) => s + i.grossAmount, 0),
    rd: interest.filter(i => i.subcategory === 'rd').reduce((s, i) => s + i.grossAmount, 0),
    savings: interest.filter(i => i.subcategory === 'savings').reduce((s, i) => s + i.grossAmount, 0),
    p2p: interest.filter(i => i.subcategory === 'p2p').reduce((s, i) => s + i.grossAmount, 0),
  };
}

export function getInterestIncomeByType(sourceType: InterestIncomeTestData['sourceType']) {
  return interestIncomeData.filter(i => i.sourceType === sourceType);
}

export function getDividendIncomeByType(sourceType: DividendIncomeTestData['sourceType']) {
  return dividendIncomeData.filter(d => d.sourceType === sourceType);
}

export const interestIncomeSummary = {
  financialYear: "2025-26",
  count: interestIncomeData.length,
  totalInterestEarned: interestIncomeData.reduce((sum, i) => sum + i.interestEarned, 0),
  totalTdsDeducted: interestIncomeData.reduce((sum, i) => sum + i.tdsDeducted, 0),
  fdTotal: interestIncomeData.filter(i => i.sourceType === 'fd').reduce((s, i) => s + i.interestEarned, 0),
  rdTotal: interestIncomeData.filter(i => i.sourceType === 'rd').reduce((s, i) => s + i.interestEarned, 0),
  savingsTotal: interestIncomeData.filter(i => i.sourceType === 'savings').reduce((s, i) => s + i.interestEarned, 0),
  p2pTotal: interestIncomeData.filter(i => i.sourceType === 'p2p').reduce((s, i) => s + i.interestEarned, 0),
  eligible80TTA: interestIncomeData
    .filter(i => i.is80TTAEligible)
    .reduce((sum, i) => sum + Math.min(i.interestEarned, 10000), 0),
};

export const dividendIncomeSummary = {
  financialYear: "2025-26",
  count: dividendIncomeData.length,
  totalDividends: dividendIncomeData.reduce((sum, d) => sum + d.dividendAmount, 0),
  totalTdsDeducted: dividendIncomeData.reduce((sum, d) => sum + d.tdsDeducted, 0),
  stockDividends: dividendIncomeData
    .filter(d => d.sourceType === 'stock')
    .reduce((s, d) => s + d.dividendAmount, 0),
  mfDividends: dividendIncomeData
    .filter(d => d.sourceType === 'mutual_fund')
    .reduce((s, d) => s + d.dividendAmount, 0),
};
