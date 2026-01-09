/**
 * Tax Planning Test Data
 *
 * Comprehensive tax data for testing regime comparison,
 * deductions, and tax calculations
 */

import { testUserProfile } from './unified-profile';
import { nonSalaryIncomeSummary } from './non-salary-income-data';

// ============================================
// Types
// ============================================

export interface DeductionTestData {
  id?: string;
  section: string;
  category: string;
  description: string;
  financialYear: string;
  claimedAmount: number;
  maxLimit: number;
  allowedAmount: number;
  proofRequired: boolean;
}

export interface TaxSlabTestData {
  min: number;
  max: number | null;
  rate: number;
  regime: 'OLD' | 'NEW';
}

export interface TaxCalculationTestData {
  financialYear: string;
  regime: 'OLD' | 'NEW';
  grossTotalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOnIncome: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
}

// ============================================
// Deductions Data (FY 2025-26) - Old Regime
// ============================================

export const deductionsData: DeductionTestData[] = [
  // Section 80C - Rs. 1.5L limit
  {
    section: "80C",
    category: "EPF",
    description: "Employee Provident Fund Contribution",
    financialYear: "2025-26",
    claimedAmount: 144000, // Rs. 12,000 * 12 months
    maxLimit: 150000,
    allowedAmount: 144000,
    proofRequired: true,
  },
  {
    section: "80C",
    category: "VPF",
    description: "Voluntary Provident Fund",
    financialYear: "2025-26",
    claimedAmount: 96000, // Rs. 8,000 * 12 months
    maxLimit: 150000, // Combined with 80C
    allowedAmount: 6000, // Only 6000 left in 80C limit
    proofRequired: true,
  },
  {
    section: "80C",
    category: "PPF",
    description: "Public Provident Fund",
    financialYear: "2025-26",
    claimedAmount: 0, // Full limit used by EPF+VPF
    maxLimit: 150000,
    allowedAmount: 0,
    proofRequired: true,
  },
  {
    section: "80C",
    category: "ELSS",
    description: "Equity Linked Savings Scheme",
    financialYear: "2025-26",
    claimedAmount: 0,
    maxLimit: 150000,
    allowedAmount: 0,
    proofRequired: true,
  },
  {
    section: "80C",
    category: "LIC",
    description: "Life Insurance Premium",
    financialYear: "2025-26",
    claimedAmount: 0,
    maxLimit: 150000,
    allowedAmount: 0,
    proofRequired: true,
  },

  // Section 80CCD(1B) - Additional NPS Rs. 50K
  {
    section: "80CCD(1B)",
    category: "NPS",
    description: "Additional NPS Contribution",
    financialYear: "2025-26",
    claimedAmount: 50000,
    maxLimit: 50000,
    allowedAmount: 50000,
    proofRequired: true,
  },

  // Section 80D - Health Insurance
  {
    section: "80D",
    category: "Health Insurance - Self",
    description: "Health Insurance Premium (Self & Family)",
    financialYear: "2025-26",
    claimedAmount: 25000,
    maxLimit: 25000,
    allowedAmount: 25000,
    proofRequired: true,
  },
  {
    section: "80D",
    category: "Health Insurance - Parents",
    description: "Health Insurance Premium (Parents - Senior Citizen)",
    financialYear: "2025-26",
    claimedAmount: 50000,
    maxLimit: 50000, // 50K for senior citizen parents
    allowedAmount: 50000,
    proofRequired: true,
  },
  {
    section: "80D",
    category: "Preventive Health Checkup",
    description: "Annual Health Checkup",
    financialYear: "2025-26",
    claimedAmount: 5000,
    maxLimit: 5000,
    allowedAmount: 5000,
    proofRequired: true,
  },

  // Section 80TTA - Savings Interest
  {
    section: "80TTA",
    category: "Savings Interest",
    description: "Interest on Savings Account",
    financialYear: "2025-26",
    claimedAmount: 10000,
    maxLimit: 10000,
    allowedAmount: 10000,
    proofRequired: false,
  },

  // Section 24 - Home Loan Interest
  {
    section: "24",
    category: "Home Loan Interest",
    description: "Interest on Housing Loan (Self-occupied)",
    financialYear: "2025-26",
    claimedAmount: 0, // Property is let out, so claimed under rental income
    maxLimit: 200000,
    allowedAmount: 0,
    proofRequired: true,
  },

  // Section 80E - Education Loan
  {
    section: "80E",
    category: "Education Loan Interest",
    description: "Interest on Education Loan",
    financialYear: "2025-26",
    claimedAmount: 0,
    maxLimit: Infinity, // No limit
    allowedAmount: 0,
    proofRequired: true,
  },
];

// ============================================
// HRA Exemption Calculation
// ============================================

export const hraExemptionData = {
  financialYear: "2025-26",
  basicSalary: 100000 * 12, // Rs. 1L * 12 = Rs. 12L annual
  hraReceived: 50000 * 12, // Rs. 50K * 12 = Rs. 6L annual
  rentPaid: 30000 * 12, // Rs. 30K * 12 = Rs. 3.6L annual
  isMetroCity: true, // Bangalore

  // HRA Exemption = Minimum of:
  // 1. Actual HRA received = Rs. 6L
  // 2. 50% of Basic (metro) = Rs. 6L
  // 3. Rent paid - 10% of Basic = Rs. 3.6L - Rs. 1.2L = Rs. 2.4L
  expectedExemption: 240000, // Rs. 2.4L
};

// ============================================
// Tax Slabs (FY 2025-26)
// ============================================

export const oldRegimeSlabs: TaxSlabTestData[] = [
  { min: 0, max: 250000, rate: 0, regime: 'OLD' },
  { min: 250000, max: 500000, rate: 5, regime: 'OLD' },
  { min: 500000, max: 1000000, rate: 20, regime: 'OLD' },
  { min: 1000000, max: null, rate: 30, regime: 'OLD' },
];

export const newRegimeSlabs: TaxSlabTestData[] = [
  { min: 0, max: 300000, rate: 0, regime: 'NEW' },
  { min: 300000, max: 700000, rate: 5, regime: 'NEW' },
  { min: 700000, max: 1000000, rate: 10, regime: 'NEW' },
  { min: 1000000, max: 1200000, rate: 15, regime: 'NEW' },
  { min: 1200000, max: 1500000, rate: 20, regime: 'NEW' },
  { min: 1500000, max: null, rate: 30, regime: 'NEW' },
];

// ============================================
// Tax Calculation Test Cases
// ============================================

// Calculate total income
const salaryIncome = testUserProfile.annualGross;
const businessIncome = 312800; // From non-salary: 300000 + 12800
const rentalIncome = 21600; // Net annual value
const capitalGains = 220000; // Total taxable gains
const otherIncome = 170000; // Interest + Dividends

const grossTotalIncome = salaryIncome + businessIncome + rentalIncome + otherIncome;
// Note: Capital gains taxed separately

// Calculate deductions for old regime
const section80C = 150000;
const section80CCD1B = 50000;
const section80D = 80000; // 25K self + 50K parents + 5K checkup
const section80TTA = 10000;
const hraExemption = 240000;
const standardDeduction = 50000;

const totalDeductionsOld = section80C + section80CCD1B + section80D + section80TTA + hraExemption + standardDeduction;

export const taxCalculationTestCases: TaxCalculationTestData[] = [
  {
    financialYear: "2025-26",
    regime: "OLD",
    grossTotalIncome: grossTotalIncome,
    totalDeductions: totalDeductionsOld, // 580000
    taxableIncome: grossTotalIncome - totalDeductionsOld,
    // Calculate tax based on slabs
    taxOnIncome: 0, // Will be calculated
    surcharge: 0,
    cess: 0, // 4%
    totalTax: 0,
    effectiveRate: 0,
  },
  {
    financialYear: "2025-26",
    regime: "NEW",
    grossTotalIncome: grossTotalIncome,
    totalDeductions: 75000, // Only standard deduction in new regime
    taxableIncome: grossTotalIncome - 75000,
    taxOnIncome: 0,
    surcharge: 0,
    cess: 0,
    totalTax: 0,
    effectiveRate: 0,
  },
];

// ============================================
// Regime Comparison
// ============================================

export const regimeComparisonData = {
  financialYear: "2025-26",

  oldRegime: {
    grossIncome: grossTotalIncome,
    standardDeduction: 50000,
    hraExemption: 240000,
    section80C: 150000,
    section80CCD1B: 50000,
    section80D: 80000,
    section80TTA: 10000,
    totalDeductions: totalDeductionsOld,
    taxableIncome: grossTotalIncome - totalDeductionsOld,
  },

  newRegime: {
    grossIncome: grossTotalIncome,
    standardDeduction: 75000,
    totalDeductions: 75000,
    taxableIncome: grossTotalIncome - 75000,
  },

  // The regime with lower tax is better
  // For this income level with significant deductions, OLD regime is usually better
  expectedBetterRegime: "OLD" as const,
};

// ============================================
// Deduction Summary by Section
// ============================================

export const deductionSummary = {
  section80C: {
    limit: 150000,
    claimed: deductionsData
      .filter(d => d.section === "80C")
      .reduce((sum, d) => sum + d.claimedAmount, 0),
    allowed: 150000, // Capped at limit
    components: [
      { name: "EPF", amount: 144000 },
      { name: "VPF", amount: 6000 },
      { name: "PPF", amount: 0 },
      { name: "ELSS", amount: 0 },
      { name: "LIC", amount: 0 },
    ],
  },

  section80CCD1B: {
    limit: 50000,
    claimed: 50000,
    allowed: 50000,
  },

  section80D: {
    limit: 80000, // 25K self + 50K parents (senior) + 5K checkup
    claimed: 80000,
    allowed: 80000,
    components: [
      { name: "Self & Family", amount: 25000 },
      { name: "Parents (Senior)", amount: 50000 },
      { name: "Preventive Checkup", amount: 5000 },
    ],
  },

  section80TTA: {
    limit: 10000,
    claimed: 10000,
    allowed: 10000,
  },

  hraExemption: {
    claimed: 240000,
    allowed: 240000,
  },

  standardDeduction: {
    oldRegime: 50000,
    newRegime: 75000,
  },

  totalDeductionsOldRegime: totalDeductionsOld,
  totalDeductionsNewRegime: 75000,
};

// ============================================
// ITR Recommendation
// ============================================

export const itrRecommendation = {
  financialYear: "2025-26",

  // Has salary income
  hasSalaryIncome: true,

  // Has business income (44AD/44ADA)
  hasBusinessIncome: true,
  businessTaxationType: "presumptive" as const, // 44AD/44ADA

  // Has capital gains
  hasCapitalGains: true,

  // Has rental income
  hasRentalIncome: true,

  // Recommended ITR form
  // ITR-1: Only salary, one house property, other sources (up to 50L)
  // ITR-2: Salary, multiple properties, capital gains (no business)
  // ITR-3: Business income (regular books)
  // ITR-4: Presumptive business (44AD/44ADA) + salary
  recommendedITR: "ITR-4",
  reason: "Presumptive business income under 44AD/44ADA with salary income",
};

// ============================================
// Test Helpers
// ============================================

export function getDeductionsBySection(section: string): DeductionTestData[] {
  return deductionsData.filter(d => d.section === section);
}

export function getTotalDeductionsBySection(section: string): number {
  return deductionsData
    .filter(d => d.section === section)
    .reduce((sum, d) => sum + d.allowedAmount, 0);
}

export function calculateTaxForSlab(income: number, slabs: TaxSlabTestData[]): number {
  let tax = 0;
  let remainingIncome = income;
  let prevMax = 0;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabMax = slab.max ?? Infinity;
    const slabRange = slabMax - prevMax;
    const taxableInSlab = Math.min(remainingIncome, slabRange);

    tax += taxableInSlab * (slab.rate / 100);
    remainingIncome -= taxableInSlab;
    prevMax = slabMax;
  }

  return Math.round(tax);
}

export function calculateCess(taxAmount: number): number {
  return Math.round(taxAmount * 0.04); // 4% Health & Education Cess
}
