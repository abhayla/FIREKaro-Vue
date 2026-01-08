// Non-Salary Income TypeScript Types

// Income source types
export type IncomeType =
  | "business"
  | "rental"
  | "capital_gains"
  | "interest"
  | "dividend"
  | "other";

export type BusinessType =
  | "proprietorship"
  | "partnership"
  | "freelance"
  | "commission_agent";
export type TaxationMethod = "44AD" | "44ADA" | "regular_books";
export type PropertyType = "residential" | "commercial" | "land";
export type CapitalGainType = "STCG" | "LTCG";
export type AssetType =
  | "equity"
  | "debt_mf"
  | "property"
  | "gold"
  | "crypto"
  | "other";

// Base income source interface
export interface IncomeSource {
  id: string;
  type: IncomeType;
  name: string;
  description?: string;
  financialYear: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Business/Profession Income (44AD/44ADA)
export interface BusinessIncome {
  id: string;
  incomeSourceId?: string;
  businessName: string;
  businessType: BusinessType;
  taxationMethod: TaxationMethod;
  financialYear: string;

  // Revenue
  grossReceipts: number;
  digitalPaymentPercentage: number; // For 44AD - 6% vs 8%

  // For Regular Books (not presumptive)
  totalExpenses?: number;
  depreciation?: number;

  // Calculated
  deemedProfitRate: number; // 8% for 44AD, 50% for 44ADA, actual for regular
  deemedProfit: number;

  // GST Details
  isGstRegistered: boolean;
  gstin?: string;
  gstFilingFrequency?: "monthly" | "quarterly";

  createdAt: string;
  updatedAt: string;
}

export interface BusinessIncomeInput {
  businessName: string;
  businessType: BusinessType;
  taxationMethod: TaxationMethod;
  financialYear: string;
  grossReceipts: number;
  digitalPaymentPercentage?: number;
  totalExpenses?: number;
  depreciation?: number;
  isGstRegistered?: boolean;
  gstin?: string;
}

// Rental Income (House Property)
export interface RentalIncome {
  id: string;
  incomeSourceId?: string;
  propertyId?: string;
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: string;
  financialYear: string;

  // Rental Details
  monthlyRent: number;
  annualRent: number;
  vacancyMonths: number;
  tenantName?: string;
  tenantStartDate?: string;

  // Section 24 Deductions
  municipalTaxesPaid: number;
  standardDeduction: number; // 30% of NAV
  housingLoanInterest: number;

  // Calculated
  grossAnnualValue: number;
  netAnnualValue: number; // After Sec 24 deductions

  isLetOut: boolean;
  isSelfOccupied: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface RentalIncomeInput {
  propertyName: string;
  propertyType: PropertyType;
  propertyAddress: string;
  financialYear: string;
  monthlyRent: number;
  vacancyMonths?: number;
  tenantName?: string;
  tenantStartDate?: string;
  municipalTaxesPaid?: number;
  housingLoanInterest?: number;
  isLetOut?: boolean;
}

// Capital Gains
export interface CapitalGain {
  id: string;
  incomeSourceId?: string;
  financialYear: string;

  assetType: AssetType;
  assetName: string;

  // Transaction Details
  purchaseDate: string;
  purchasePrice: number;
  saleDate: string;
  salePrice: number;

  // Expenses
  purchaseExpenses: number;
  saleExpenses: number;
  improvementCost: number;

  // Indexation (for LTCG on property, gold, debt MF pre-2023)
  useIndexation: boolean;
  ciiPurchaseYear?: number; // Cost Inflation Index
  ciiSaleYear?: number;
  indexedCost?: number;

  // Calculated
  holdingPeriodMonths: number;
  gainType: CapitalGainType;
  grossGain: number;
  taxableGain: number;

  // Exemptions (Section 54/54F)
  exemptionClaimed?: number;
  exemptionSection?: "54" | "54F" | "54EC";

  // Tax
  applicableTaxRate: number;
  estimatedTax: number;

  createdAt: string;
  updatedAt: string;
}

export interface CapitalGainInput {
  assetType: AssetType;
  assetName: string;
  financialYear: string;
  purchaseDate: string;
  purchasePrice: number;
  saleDate: string;
  salePrice: number;
  purchaseExpenses?: number;
  saleExpenses?: number;
  improvementCost?: number;
  useIndexation?: boolean;
  exemptionClaimed?: number;
  exemptionSection?: "54" | "54F" | "54EC";
}

// Other Income (Interest, Dividends, etc.)
export interface OtherIncome {
  id: string;
  incomeSourceId?: string;
  financialYear: string;

  category:
    | "interest"
    | "dividend"
    | "commission"
    | "royalty"
    | "pension"
    | "gift"
    | "agricultural"
    | "other";
  subcategory?: string; // FD, Savings, P2P, Stock, MF, etc.
  description: string;

  grossAmount: number;
  tdsDeducted: number;
  netAmount: number;

  // For Interest - 80TTA/80TTB
  eligible80TTA?: boolean; // Up to ₹10,000 for savings interest
  eligible80TTB?: boolean; // Up to ₹50,000 for seniors

  // Source details
  sourceName?: string;
  sourceType?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OtherIncomeInput {
  category: OtherIncome["category"];
  subcategory?: string;
  description: string;
  financialYear: string;
  grossAmount: number;
  tdsDeducted?: number;
  sourceName?: string;
  sourceType?: string;
}

// Income Summary
export interface IncomeSummary {
  financialYear: string;

  // By Type
  salaryIncome: number;
  businessIncome: number;
  rentalIncome: number;
  capitalGains: number;
  interestIncome: number;
  dividendIncome: number;
  otherIncome: number;

  // Totals
  totalGrossIncome: number;
  totalDeductions: number;
  totalTaxableIncome: number;
  totalTdsDeducted: number;

  // Source counts
  businessCount: number;
  rentalCount: number;
  capitalGainTransactions: number;
  otherSourcesCount: number;
}

// CII (Cost Inflation Index) for capital gains indexation
export const CII_INDEX: Record<number, number> = {
  2001: 100,
  2002: 105,
  2003: 109,
  2004: 113,
  2005: 117,
  2006: 122,
  2007: 129,
  2008: 137,
  2009: 148,
  2010: 167,
  2011: 184,
  2012: 200,
  2013: 220,
  2014: 240,
  2015: 254,
  2016: 264,
  2017: 272,
  2018: 280,
  2019: 289,
  2020: 301,
  2021: 317,
  2022: 331,
  2023: 348,
  2024: 363, // FY 2024-25
  2025: 363, // Placeholder
};

// Tax rates for capital gains (Post Budget 2024 - July 23, 2024)
export const CAPITAL_GAINS_TAX_RATES = {
  equity: {
    stcg: 0.2, // Was 15%, now 20%
    ltcg: 0.125, // Was 10%, now 12.5% (above ₹1.25L exemption)
    ltcgExemption: 125000,
  },
  debtMf: {
    // Post April 2023 - no LTCG benefit
    rate: "slab", // Taxed at slab rate
  },
  property: {
    stcg: "slab",
    ltcg: 0.125, // 12.5% OR 20%+indexation for pre-July 2024 purchases
    holdingPeriod: 24, // months
  },
  gold: {
    stcg: "slab",
    ltcg: 0.125, // 12.5% (no indexation post July 2024)
    holdingPeriod: 24,
  },
};

// Section 44AD/44ADA limits
export const PRESUMPTIVE_TAX_LIMITS = {
  "44AD": {
    turnoverLimit: 20000000, // ₹2 Crore
    profitRateCash: 0.08, // 8%
    profitRateDigital: 0.06, // 6%
    itrForm: "ITR-4",
  },
  "44ADA": {
    receiptsLimit: 5000000, // ₹50 Lakhs
    profitRate: 0.5, // 50%
    itrForm: "ITR-4",
  },
};

// Section 24 deduction limits
export const SECTION_24_LIMITS = {
  standardDeductionRate: 0.3, // 30% of NAV
  selfOccupiedInterestLimit: 200000, // ₹2L
  letOutInterestLimit: Infinity, // No limit for let-out
};

// Helper to get FY from CII year
export function getCIIYear(date: string): number {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  // FY starts April, so April 2024 onwards is FY 2024-25
  return month >= 4 ? year : year - 1;
}

// Calculate indexed cost for capital gains
export function calculateIndexedCost(
  purchasePrice: number,
  purchaseDate: string,
  saleDate: string,
): number {
  const purchaseYear = getCIIYear(purchaseDate);
  const saleYear = getCIIYear(saleDate);

  const purchaseCII = CII_INDEX[purchaseYear] || 100;
  const saleCII = CII_INDEX[saleYear] || 363;

  return Math.round((purchasePrice * saleCII) / purchaseCII);
}

// Calculate holding period in months
export function calculateHoldingPeriod(
  purchaseDate: string,
  saleDate: string,
): number {
  const purchase = new Date(purchaseDate);
  const sale = new Date(saleDate);

  const months =
    (sale.getFullYear() - purchase.getFullYear()) * 12 +
    (sale.getMonth() - purchase.getMonth());

  return months;
}

// Determine if gain is STCG or LTCG
export function determineGainType(
  assetType: AssetType,
  holdingMonths: number,
): CapitalGainType {
  const ltcgThreshold =
    assetType === "equity" || assetType === "debt_mf" ? 12 : 24;
  return holdingMonths >= ltcgThreshold ? "LTCG" : "STCG";
}

// Calculate 44AD deemed profit
export function calculate44ADProfit(
  grossReceipts: number,
  digitalPercentage: number = 0,
): { deemedProfit: number; effectiveRate: number } {
  const cashReceipts = grossReceipts * (1 - digitalPercentage / 100);
  const digitalReceipts = grossReceipts * (digitalPercentage / 100);

  const cashProfit =
    cashReceipts * PRESUMPTIVE_TAX_LIMITS["44AD"].profitRateCash;
  const digitalProfit =
    digitalReceipts * PRESUMPTIVE_TAX_LIMITS["44AD"].profitRateDigital;

  const deemedProfit = cashProfit + digitalProfit;
  const effectiveRate = deemedProfit / grossReceipts;

  return { deemedProfit, effectiveRate };
}

// Calculate 44ADA deemed profit
export function calculate44ADAProfit(grossReceipts: number): number {
  return grossReceipts * PRESUMPTIVE_TAX_LIMITS["44ADA"].profitRate;
}

// Calculate Section 24 deductions for rental income
export function calculateSection24Deductions(
  grossAnnualValue: number,
  municipalTaxesPaid: number,
  housingLoanInterest: number,
  isLetOut: boolean,
): {
  netAnnualValue: number;
  standardDeduction: number;
  allowableInterest: number;
  totalDeduction: number;
} {
  // NAV = GAV - Municipal Taxes
  const nav = grossAnnualValue - municipalTaxesPaid;

  // Standard deduction = 30% of NAV
  const standardDeduction = nav * SECTION_24_LIMITS.standardDeductionRate;

  // Interest deduction
  const interestLimit = isLetOut
    ? SECTION_24_LIMITS.letOutInterestLimit
    : SECTION_24_LIMITS.selfOccupiedInterestLimit;

  const allowableInterest = Math.min(housingLoanInterest, interestLimit);

  const totalDeduction = standardDeduction + allowableInterest;
  const netAnnualValue = nav - totalDeduction;

  return {
    netAnnualValue,
    standardDeduction,
    allowableInterest,
    totalDeduction,
  };
}
