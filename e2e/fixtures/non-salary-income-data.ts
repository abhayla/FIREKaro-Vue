/**
 * Non-Salary Income Test Data
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
  businessType: 'trading' | 'freelance' | 'profession';
  taxationMethod: '44AD' | '44ADA' | 'regular';
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
  propertyName: string;
  propertyType: 'residential' | 'commercial';
  propertyAddress: string;
  financialYear: string;
  monthlyRent: number;
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
    businessType: "trading",
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

export const nonSalaryIncomeSummary = {
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
  get totalNonSalaryIncome() {
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
