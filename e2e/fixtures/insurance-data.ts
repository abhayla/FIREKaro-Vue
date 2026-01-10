/**
 * Protection (Insurance) Test Data
 * Updated to match backend API schema (January 2026)
 *
 * Coverage: Term Life, Health Insurance, Other policies
 * Total Annual Premium: ~Rs. 1.2L
 */

import { testUserProfile } from './unified-profile';

// ============================================
// Types - Matching backend API schema
// ============================================

// Backend enum values
export type InsuranceType = 'LIFE' | 'HEALTH' | 'MOTOR' | 'HOME' | 'TRAVEL';
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
export type TaxBenefitType = 'SECTION_80C' | 'SECTION_80D' | 'BOTH' | 'NONE';

// API input format for creating policies
export interface CreatePolicyInput {
  policyNumber: string;
  policyName: string;
  type: InsuranceType;
  provider: string;
  status?: PolicyStatus;
  sumAssured: number;
  premium: number;
  paymentFrequency: PaymentFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  nextDueDate?: string | null;
  lastPremiumPaidDate?: string | null;
  // Life insurance specific
  maturityDate?: string | null;
  maturityAmount?: number | null;
  surrenderValue?: number | null;
  loanAvailable?: boolean;
  loanAmount?: number | null;
  // Health insurance specific
  coverType?: string | null; // individual, family, floater
  roomRentLimit?: number | null;
  copayPercent?: number | null;
  waitingPeriod?: number | null;
  preExistingWaiting?: number | null;
  networkHospitals?: number | null;
  // Motor insurance specific
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  vehicleModel?: string | null;
  idvValue?: number | null;
  ncbPercent?: number | null;
  // Home insurance specific
  propertyType?: string | null;
  propertyAddress?: string | null;
  propertyValue?: number | null;
  contentsCover?: number | null;
  // Tax & metadata
  taxBenefit?: TaxBenefitType | null;
  policyDocument?: string | null;
  notes?: string | null;
  familyMemberId?: string | null;
}

// Full policy response from API
export interface InsurancePolicy extends CreatePolicyInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  nominees?: InsuranceNominee[];
}

export interface InsuranceNominee {
  id: string;
  policyId: string;
  name: string;
  relationship: string;
  dateOfBirth?: string | null;
  sharePercent: number;
  isMinor: boolean;
  appointeeName?: string | null;
  appointeeRelation?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

export interface CoverageNeedCalculation {
  currentAge: number;
  annualIncome: number;
  yearsToRetirement: number;
  existingCoverage: number;
  liabilities: number;
  childrenEducationFund: number;
  // Calculated
  humanLifeValue: number;
  incomeReplacementNeed: number;
  recommendedCoverage: number;
  coverageGap: number;
}

// ============================================
// Life Insurance Data
// ============================================

export const lifeInsuranceData: CreatePolicyInput[] = [
  {
    type: 'LIFE',
    policyName: 'HDFC Click 2 Protect Life',
    provider: 'HDFC Life',
    policyNumber: 'TERM001234567',
    sumAssured: 10000000, // Rs. 1 Crore
    premium: 12000,
    paymentFrequency: 'YEARLY',
    startDate: '2021-04-01',
    endDate: '2053-04-01', // Till age 60
    taxBenefit: 'SECTION_80C',
    notes: 'Term plan with riders: Accidental Death Benefit, Critical Illness',
  },
  {
    type: 'LIFE',
    policyName: 'ICICI Pru iProtect Smart',
    provider: 'ICICI Prudential',
    policyNumber: 'TERM007654321',
    sumAssured: 5000000, // Rs. 50 Lakhs (additional cover)
    premium: 8000,
    paymentFrequency: 'YEARLY',
    startDate: '2022-06-15',
    endDate: '2053-06-15',
    taxBenefit: 'SECTION_80C',
    notes: 'Additional term coverage with Waiver of Premium rider',
  },
  {
    type: 'LIFE',
    policyName: 'HDFC ProGrowth Plus ULIP',
    provider: 'HDFC Life',
    policyNumber: 'ULIP00987654',
    sumAssured: 1000000, // Rs. 10 Lakhs
    premium: 50000,
    paymentFrequency: 'YEARLY',
    startDate: '2020-01-15',
    endDate: '2040-01-15',
    maturityDate: '2040-01-15',
    maturityAmount: 2500000, // Projected
    taxBenefit: 'SECTION_80C',
    notes: 'ULIP - maturity is tax-free under Section 10(10D)',
  },
];

// ============================================
// Health Insurance Data
// ============================================

export const healthInsuranceData: CreatePolicyInput[] = [
  {
    type: 'HEALTH',
    policyName: 'HDFC Ergo Optima Secure',
    provider: 'HDFC Life', // Using provider from form dropdown
    policyNumber: 'HEALTH001234',
    sumAssured: 1000000, // Rs. 10 Lakhs
    premium: 25000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    coverType: 'floater',
    roomRentLimit: 0, // No limit
    copayPercent: 0,
    waitingPeriod: 30,
    taxBenefit: 'SECTION_80D',
    notes: 'Family floater covering Self, Spouse, Child. 20% NCB after claim-free years.',
  },
  {
    type: 'HEALTH',
    policyName: 'Star Health Super Top Up',
    provider: 'Care Health', // Using provider from form dropdown
    policyNumber: 'TOPUP007654',
    sumAssured: 5000000, // Rs. 50 Lakhs
    premium: 8000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    coverType: 'floater',
    waitingPeriod: 0, // No waiting for super top-up
    copayPercent: 0,
    taxBenefit: 'NONE', // Already claimed in base policy
    notes: 'Super top-up for family - kicks in after base policy exhausted',
  },
  {
    type: 'HEALTH',
    policyName: 'Care Health Senior',
    provider: 'Care Health',
    policyNumber: 'SENIOR00123',
    sumAssured: 500000, // Rs. 5 Lakhs
    premium: 45000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    coverType: 'floater',
    roomRentLimit: 5000, // Rs. 5,000/day
    copayPercent: 20, // 20% co-pay for senior citizens
    waitingPeriod: 30,
    taxBenefit: 'SECTION_80D',
    notes: 'Senior citizen health plan for parents. Section 80D up to Rs 50,000.',
  },
  {
    type: 'HEALTH',
    policyName: 'Max Bupa Critical Illness',
    provider: 'Max Life',
    policyNumber: 'CI00987654',
    sumAssured: 2500000, // Rs. 25 Lakhs
    premium: 12000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    coverType: 'individual',
    waitingPeriod: 90,
    taxBenefit: 'NONE', // Counted under main 80D limit
    notes: 'Critical illness cover for self',
  },
];

// ============================================
// Other Insurance Data (Motor, Home, Travel)
// ============================================

export const otherInsuranceData: CreatePolicyInput[] = [
  {
    type: 'MOTOR',
    policyName: 'HDFC Ergo Motor Insurance',
    provider: 'HDFC Life',
    policyNumber: 'MOTOR001234',
    sumAssured: 800000, // IDV
    premium: 15000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-01-15',
    endDate: '2026-01-14',
    vehicleNumber: 'KA05AB1234',
    vehicleType: 'Car',
    vehicleModel: 'Hyundai Creta 2022',
    idvValue: 800000,
    ncbPercent: 20,
    taxBenefit: 'NONE',
    notes: 'Comprehensive cover with Zero Depreciation, Engine Protect, RSA',
  },
  {
    type: 'HOME',
    policyName: 'ICICI Lombard Home Insurance',
    provider: 'ICICI Prudential',
    policyNumber: 'HOME007654',
    sumAssured: 5000000, // Rs. 50 Lakhs (contents + building)
    premium: 5000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    propertyType: 'Apartment',
    propertyAddress: 'Whitefield, Bangalore',
    propertyValue: 5000000,
    contentsCover: 1000000,
    taxBenefit: 'NONE',
    notes: 'Covers Fire, Theft, Natural Calamity, Contents',
  },
  {
    type: 'TRAVEL',
    policyName: 'Bajaj Allianz PA Cover',
    provider: 'Bajaj Allianz',
    policyNumber: 'PA00123456',
    sumAssured: 5000000, // Rs. 50 Lakhs
    premium: 3000,
    paymentFrequency: 'YEARLY',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    taxBenefit: 'NONE',
    notes: 'Personal Accident: Accidental Death, Permanent Total/Partial Disability',
  },
];

// ============================================
// Coverage Summary
// ============================================

export const coverageSummary = {
  life: {
    count: lifeInsuranceData.length,
    totalSumAssured: lifeInsuranceData.reduce((sum, p) => sum + p.sumAssured, 0),
    totalPremium: lifeInsuranceData.reduce((sum, p) => sum + p.premium, 0),
    termCover: lifeInsuranceData
      .filter(p => p.policyName.toLowerCase().includes('term') || p.policyName.toLowerCase().includes('protect'))
      .reduce((sum, p) => sum + p.sumAssured, 0),
  },

  health: {
    count: healthInsuranceData.length,
    totalSumAssured: healthInsuranceData.reduce((sum, p) => sum + p.sumAssured, 0),
    totalPremium: healthInsuranceData.reduce((sum, p) => sum + p.premium, 0),
  },

  other: {
    count: otherInsuranceData.length,
    totalPremium: otherInsuranceData.reduce((sum, p) => sum + p.premium, 0),
  },

  get totalAnnualPremium() {
    return this.life.totalPremium + this.health.totalPremium + this.other.totalPremium;
  },

  // Tax Benefits
  taxBenefits: {
    section80C: lifeInsuranceData
      .filter(p => p.taxBenefit === 'SECTION_80C' || p.taxBenefit === 'BOTH')
      .reduce((sum, p) => sum + p.premium, 0),
    section80D: healthInsuranceData
      .filter(p => p.taxBenefit === 'SECTION_80D' || p.taxBenefit === 'BOTH')
      .reduce((sum, p) => sum + p.premium, 0),
  },
};

// ============================================
// Coverage Need Calculation
// ============================================

export const coverageNeedCalculation: CoverageNeedCalculation = {
  currentAge: testUserProfile.age,
  annualIncome: testUserProfile.annualGross,
  yearsToRetirement: testUserProfile.targets.fireAge - testUserProfile.age,
  existingCoverage: coverageSummary.life.totalSumAssured,
  liabilities: 3720000, // From liabilities data
  childrenEducationFund: 2000000, // Rs. 20L for child's education

  // Human Life Value = Annual Income * Years to Retirement
  humanLifeValue: testUserProfile.annualGross * (testUserProfile.targets.fireAge - testUserProfile.age),

  // Income Replacement Need = 10-15x annual income
  incomeReplacementNeed: testUserProfile.annualGross * 12,

  // Recommended = Max(HLV, Income Replacement) + Liabilities + Education
  recommendedCoverage:
    Math.max(
      testUserProfile.annualGross * 13, // HLV
      testUserProfile.annualGross * 12  // 12x income
    ) + 3720000 + 2000000,

  // Gap = Recommended - Existing
  get coverageGap() {
    return Math.max(0, this.recommendedCoverage - this.existingCoverage);
  },
};

// ============================================
// Renewal Calendar
// ============================================

export const renewalCalendar = [
  ...lifeInsuranceData.map(p => ({
    type: 'LIFE' as InsuranceType,
    name: p.policyName,
    renewalDate: p.endDate,
    premium: p.premium,
  })),
  ...healthInsuranceData.map(p => ({
    type: 'HEALTH' as InsuranceType,
    name: p.policyName,
    renewalDate: p.endDate,
    premium: p.premium,
  })),
  ...otherInsuranceData.map(p => ({
    type: p.type,
    name: p.policyName,
    renewalDate: p.endDate,
    premium: p.premium,
  })),
].sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

// ============================================
// Test Helpers
// ============================================

export function getPoliciesByType(type: InsuranceType): CreatePolicyInput[] {
  switch (type) {
    case 'LIFE':
      return lifeInsuranceData;
    case 'HEALTH':
      return healthInsuranceData;
    case 'MOTOR':
    case 'HOME':
    case 'TRAVEL':
      return otherInsuranceData.filter(p => p.type === type);
    default:
      return [];
  }
}

export function getPoliciesExpiringInDays(days: number): typeof renewalCalendar {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  return renewalCalendar.filter(p => new Date(p.renewalDate) <= cutoffDate);
}

// Sample policy for quick tests
export const sampleLifePolicy: CreatePolicyInput = {
  type: 'LIFE',
  policyName: 'Test Term Plan',
  provider: 'LIC',
  policyNumber: 'TEST123456',
  sumAssured: 5000000,
  premium: 10000,
  paymentFrequency: 'YEARLY',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  taxBenefit: 'SECTION_80C',
};

export const sampleHealthPolicy: CreatePolicyInput = {
  type: 'HEALTH',
  policyName: 'Test Health Plan',
  provider: 'Star Health',
  policyNumber: 'TESTH123456',
  sumAssured: 1000000,
  premium: 20000,
  paymentFrequency: 'YEARLY',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  coverType: 'family',
  taxBenefit: 'SECTION_80D',
};
