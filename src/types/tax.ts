/**
 * Tax Planning Types
 * FIREKaro - Indian Tax Calculation Types
 */

// Tax Regime
export type TaxRegime = "OLD" | "NEW";

// Tax Status
export type TaxStatus =
  | "individual"
  | "senior_citizen"
  | "super_senior_citizen"
  | "huf";

// Financial Year format: "2024-25"
export type FinancialYear = string;

// Deduction Section types
export type DeductionSection =
  | "80C"
  | "80CCC"
  | "80CCD1"
  | "80CCD1B"
  | "80CCD2"
  | "80D"
  | "80DD"
  | "80DDB"
  | "80E"
  | "80EE"
  | "80EEA"
  | "80G"
  | "80GG"
  | "80GGA"
  | "80GGC"
  | "80TTA"
  | "80TTB"
  | "80U";

// Tax calculation input
export interface TaxCalculationInput {
  financialYear: FinancialYear;
  taxRegime: TaxRegime;
  taxStatus: TaxStatus;
  age: number;
  grossSalaryIncome: number;
  businessIncome: number;
  rentalIncome: number;
  capitalGains: number;
  otherIncome: number;
  standardDeduction?: number;
  hra?: number;
  lta?: number;
  section80C: number;
  section80D: number;
  section80CCD1B: number;
  otherDeductions: number;
}

// Tax slab structure
export interface TaxSlab {
  min: number;
  max: number | null;
  rate: number;
}

// Tax slabs for different regimes and years
export const OLD_REGIME_SLABS: TaxSlab[] = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 0.05 },
  { min: 500001, max: 1000000, rate: 0.2 },
  { min: 1000001, max: null, rate: 0.3 },
];

export const NEW_REGIME_SLABS_2024: TaxSlab[] = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 700000, rate: 0.05 },
  { min: 700001, max: 1000000, rate: 0.1 },
  { min: 1000001, max: 1200000, rate: 0.15 },
  { min: 1200001, max: 1500000, rate: 0.2 },
  { min: 1500001, max: null, rate: 0.3 },
];

// Tax calculation result
export interface TaxCalculationResult {
  regime: TaxRegime;
  grossTotalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOnIncome: number;
  surcharge: number;
  healthEducationCess: number;
  totalTaxLiability: number;
  effectiveRate: number;
  slabBreakdown: TaxSlabBreakdown[];
  deductionBreakdown: DeductionBreakdown[];
}

export interface TaxSlabBreakdown {
  slab: string;
  income: number;
  rate: number;
  tax: number;
}

export interface DeductionBreakdown {
  section: string;
  label: string;
  claimed: number;
  limit: number;
  allowed: number;
}

// Regime comparison
export interface RegimeComparison {
  financialYear: FinancialYear;
  oldRegime: TaxCalculationResult;
  newRegime: TaxCalculationResult;
  betterRegime: TaxRegime;
  savingsAmount: number;
  savingsPercentage: number;
}

// Deduction
export interface Deduction {
  id: string;
  userId: string;
  financialYear: FinancialYear;
  section: DeductionSection;
  category: string;
  description: string;
  amount: number;
  maxLimit: number;
  documentRef?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeductionInput {
  section: DeductionSection;
  category: string;
  description: string;
  amount: number;
}

// Deduction summary by section
export interface DeductionSummary {
  section80C: DeductionCategoryDetail;
  section80D: DeductionCategoryDetail;
  section80CCD1B: DeductionCategoryDetail;
  section80E: DeductionCategoryDetail;
  section80G: DeductionCategoryDetail;
  section24: DeductionCategoryDetail;
  section80TTA: DeductionCategoryDetail;
  otherDeductions: DeductionCategoryDetail;
  totalDeductions: number;
}

export interface DeductionCategoryDetail {
  section: string;
  label: string;
  items: DeductionItem[];
  total: number;
  limit: number;
  remaining: number;
  utilizationPercent: number;
}

export interface DeductionItem {
  id: string;
  category: string;
  description: string;
  amount: number;
}

// Exemption
export interface Exemption {
  id: string;
  userId: string;
  financialYear: FinancialYear;
  type: string;
  description: string;
  amount: number;
  isAutoCalculated: boolean;
}

// Tax optimization suggestion
export interface TaxOptimizationSuggestion {
  id: string;
  category: "deduction" | "investment" | "restructure" | "timing";
  section: string;
  title: string;
  description: string;
  currentValue: number;
  suggestedValue: number;
  potentialSavings: number;
  priority: "high" | "medium" | "low";
  action: string;
}

// ITR form recommendation
export interface ITRRecommendation {
  recommendedForm: "ITR-1" | "ITR-2" | "ITR-3" | "ITR-4";
  formName: string;
  eligibilityReasons: string[];
  ineligibilityReasons: string[];
  alternativeForms: string[];
  dueDate: string;
  lateFee: number;
}

// Tax summary for dashboard
export interface TaxSummary {
  financialYear: FinancialYear;
  selectedRegime: TaxRegime;
  grossTotalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTax: number;
  tdsDeducted: number;
  advanceTaxPaid: number;
  selfAssessmentTax: number;
  refundDue: number;
  lastCalculated: string;
}

// Advance Tax
export interface AdvanceTaxSchedule {
  quarter: 1 | 2 | 3 | 4;
  quarterName: string;
  dueDate: string;
  cumulativePercentage: number;
  cumulativeAmountDue: number;
  quarterAmountDue: number;
  amountPaid: number;
  shortfall: number;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";
  interest234C: number;
}

export interface AdvanceTaxEstimate {
  id: string;
  financialYear: FinancialYear;
  estimatedIncome: number;
  estimatedTax: number;
  tdsDeducted: number;
  advanceTaxRequired: boolean;
  netTaxPayable: number;
  totalPaid: number;
  remaining: number;
  interest234B: number;
  interest234C: number;
  schedules: AdvanceTaxSchedule[];
}

// Tax scenario for what-if analysis
export interface TaxScenario {
  id: string;
  name: string;
  description?: string;
  isBaseline: boolean;
  regime: TaxRegime;
  incomeAdjustments: IncomeAdjustment[];
  deductionAdjustments: DeductionAdjustment[];
  result: TaxCalculationResult;
  savingsFromBaseline: number;
}

export interface IncomeAdjustment {
  type: string;
  label: string;
  originalAmount: number;
  adjustedAmount: number;
}

export interface DeductionAdjustment {
  section: string;
  label: string;
  originalAmount: number;
  adjustedAmount: number;
}

// Deduction limits
export const DEDUCTION_LIMITS = {
  section80C: 150000,
  section80CCC: 150000, // Part of 80C aggregate
  section80CCD1: 150000, // Part of 80C aggregate (10% of salary)
  section80CCD1B: 50000, // Additional NPS
  section80CCD2: Infinity, // Employer NPS (14% of salary)
  section80D: 25000, // Self/family (50000 for seniors)
  section80DParents: 50000, // Parents (seniors)
  section80DD: 75000, // Disabled dependent (125000 for severe)
  section80DDB: 40000, // Medical treatment (100000 for seniors)
  section80E: Infinity, // Education loan interest
  section80EE: 50000, // First home loan interest
  section80EEA: 150000, // Affordable housing
  section80G: Infinity, // Donations (50% or 100%)
  section80GG: 60000, // Rent paid (25% of total income)
  section80TTA: 10000, // Savings interest
  section80TTB: 50000, // Interest for seniors
  section80U: 75000, // Disability (125000 for severe)
  section24: 200000, // Home loan interest (self-occupied)
  standardDeductionNew: 75000, // New regime standard deduction
  standardDeductionOld: 50000, // Old regime standard deduction
} as const;

// Surcharge rates
export const SURCHARGE_RATES = {
  "50L-1Cr": 0.1,
  "1Cr-2Cr": 0.15,
  "2Cr-5Cr": 0.25,
  "5Cr+": 0.37,
  newRegimeMax: 0.25, // New regime caps at 25%
} as const;

// Health & Education Cess
export const CESS_RATE = 0.04;

// 80C sub-categories
export const SECTION_80C_CATEGORIES = [
  { value: "epf", label: "Employee Provident Fund (EPF)" },
  { value: "ppf", label: "Public Provident Fund (PPF)" },
  { value: "elss", label: "ELSS Mutual Funds" },
  { value: "nsc", label: "National Savings Certificate (NSC)" },
  { value: "life_insurance", label: "Life Insurance Premium" },
  { value: "sukanya", label: "Sukanya Samriddhi Yojana" },
  { value: "nps", label: "National Pension System (NPS)" },
  { value: "home_loan_principal", label: "Home Loan Principal" },
  { value: "tuition_fees", label: "Tuition Fees (2 children)" },
  { value: "5yr_fd", label: "5-Year Tax Saving FD" },
  { value: "scss", label: "Senior Citizens Savings Scheme" },
  { value: "other", label: "Other 80C Investments" },
] as const;

// 80D sub-categories
export const SECTION_80D_CATEGORIES = [
  { value: "self_family", label: "Self & Family Health Insurance" },
  { value: "parents", label: "Parents Health Insurance" },
  { value: "preventive_checkup", label: "Preventive Health Checkup" },
] as const;

// ITR Form types
export const ITR_FORMS = {
  "ITR-1": {
    name: "Sahaj",
    description: "Salaried individuals with income up to Rs.50L",
    eligibility: [
      "Salary income",
      "One house property",
      "Other sources (interest, etc.)",
      "Agricultural income up to Rs.5,000",
    ],
    ineligibility: [
      "Business/profession income",
      "Capital gains",
      "Multiple house properties",
      "Income from outside India",
      "Total income > Rs.50 lakhs",
    ],
  },
  "ITR-2": {
    name: "For Individuals/HUF",
    description: "Individuals with capital gains or multiple properties",
    eligibility: [
      "Salary income",
      "Multiple house properties",
      "Capital gains",
      "Foreign income/assets",
      "Director in company",
    ],
    ineligibility: ["Business/profession income"],
  },
  "ITR-3": {
    name: "For Business/Profession",
    description: "Business income without presumptive taxation",
    eligibility: [
      "Business income (books maintained)",
      "Professional income",
      "Partner in firm",
      "All ITR-2 sources",
    ],
    ineligibility: [],
  },
  "ITR-4": {
    name: "Sugam",
    description: "Presumptive income under Sec 44AD/44ADA",
    eligibility: [
      "Presumptive business income (44AD)",
      "Presumptive professional income (44ADA)",
      "Salary income",
      "One house property",
      "Other sources",
    ],
    ineligibility: [
      "Regular business accounts",
      "Capital gains",
      "Multiple house properties",
      "Foreign income",
    ],
  },
} as const;

// Helper functions
export function getTaxSlabs(regime: TaxRegime): TaxSlab[] {
  return regime === "NEW" ? NEW_REGIME_SLABS_2024 : OLD_REGIME_SLABS;
}

export function getDeductionLimit(
  section: DeductionSection,
  isSenior: boolean = false,
): number {
  const key = section.replace("-", "") as keyof typeof DEDUCTION_LIMITS;
  let limit = DEDUCTION_LIMITS[key] || 0;

  // Special cases for seniors
  if (section === "80D" && isSenior) {
    limit = 50000;
  }
  if (section === "80TTB" && isSenior) {
    limit = 50000;
  }
  if (section === "80TTA" && isSenior) {
    limit = 0; // 80TTB replaces 80TTA for seniors
  }

  return limit;
}

export function calculateSurcharge(
  tax: number,
  income: number,
  regime: TaxRegime,
): number {
  if (income <= 5000000) return 0;

  let rate = 0;
  if (income <= 10000000) rate = SURCHARGE_RATES["50L-1Cr"];
  else if (income <= 20000000) rate = SURCHARGE_RATES["1Cr-2Cr"];
  else if (income <= 50000000) rate = SURCHARGE_RATES["2Cr-5Cr"];
  else rate = SURCHARGE_RATES["5Cr+"];

  // New regime caps surcharge at 25% for income > Rs.2Cr
  if (regime === "NEW" && rate > SURCHARGE_RATES.newRegimeMax) {
    rate = SURCHARGE_RATES.newRegimeMax;
  }

  return Math.round(tax * rate);
}

export function calculateCess(taxWithSurcharge: number): number {
  return Math.round(taxWithSurcharge * CESS_RATE);
}

export function calculateTaxOnIncome(income: number, slabs: TaxSlab[]): number {
  let tax = 0;
  let remainingIncome = income;

  for (const slab of slabs) {
    if (remainingIncome <= 0) break;

    const slabIncome = slab.max
      ? Math.min(remainingIncome, slab.max - slab.min + 1)
      : remainingIncome;

    tax += slabIncome * slab.rate;
    remainingIncome -= slabIncome;
  }

  return Math.round(tax);
}

export function getAdvanceTaxQuarters(
  financialYear: string,
): AdvanceTaxSchedule[] {
  const [startYear] = financialYear.split("-").map(Number);

  return [
    {
      quarter: 1,
      quarterName: "Q1 (Apr-Jun)",
      dueDate: `${startYear}-06-15`,
      cumulativePercentage: 15,
      cumulativeAmountDue: 0,
      quarterAmountDue: 0,
      amountPaid: 0,
      shortfall: 0,
      status: "PENDING",
      interest234C: 0,
    },
    {
      quarter: 2,
      quarterName: "Q2 (Jul-Sep)",
      dueDate: `${startYear}-09-15`,
      cumulativePercentage: 45,
      cumulativeAmountDue: 0,
      quarterAmountDue: 0,
      amountPaid: 0,
      shortfall: 0,
      status: "PENDING",
      interest234C: 0,
    },
    {
      quarter: 3,
      quarterName: "Q3 (Oct-Dec)",
      dueDate: `${startYear}-12-15`,
      cumulativePercentage: 75,
      cumulativeAmountDue: 0,
      quarterAmountDue: 0,
      amountPaid: 0,
      shortfall: 0,
      status: "PENDING",
      interest234C: 0,
    },
    {
      quarter: 4,
      quarterName: "Q4 (Jan-Mar)",
      dueDate: `${startYear + 1}-03-15`,
      cumulativePercentage: 100,
      cumulativeAmountDue: 0,
      quarterAmountDue: 0,
      amountPaid: 0,
      shortfall: 0,
      status: "PENDING",
      interest234C: 0,
    },
  ];
}
