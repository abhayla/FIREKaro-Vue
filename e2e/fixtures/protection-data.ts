/**
 * Protection (Insurance) Test Data
 *
 * Coverage: Term Life, Health Insurance, Other policies
 * Total Annual Premium: ~Rs. 1.2L
 */

import { testUserProfile, getDependents, hasParentDependents } from './unified-profile';

// ============================================
// Types
// ============================================

export interface LifeInsuranceTestData {
  id?: string;
  policyType: 'term' | 'whole_life' | 'ulip' | 'endowment';
  policyName: string;
  insurer: string;
  policyNumber: string;
  sumAssured: number;
  premiumAmount: number;
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';
  policyStartDate: string;
  policyEndDate: string;
  maturityDate?: string;
  maturityAmount?: number;
  nomineeNames: string[];
  riders?: string[];
  // Tax benefits
  section80C: number;
  section10_10D: boolean; // Maturity exempt
}

export interface HealthInsuranceTestData {
  id?: string;
  policyType: 'individual' | 'family_floater' | 'super_top_up' | 'critical_illness';
  policyName: string;
  insurer: string;
  policyNumber: string;
  sumInsured: number;
  premiumAmount: number;
  premiumFrequency: 'yearly';
  policyStartDate: string;
  policyEndDate: string;
  coveredMembers: string[];
  roomRentLimit?: string;
  ncbPercent: number; // No Claim Bonus
  waitingPeriod: number; // in days
  copayPercent?: number;
  // Tax benefits
  section80D: number;
  section80DSenior?: number; // For parents
}

export interface OtherInsuranceTestData {
  id?: string;
  policyType: 'motor' | 'home' | 'travel' | 'personal_accident';
  policyName: string;
  insurer: string;
  policyNumber: string;
  sumInsured: number;
  premiumAmount: number;
  premiumFrequency: 'yearly';
  policyStartDate: string;
  policyEndDate: string;
  assetDetails?: string;
  coverageDetails?: string[];
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

export const lifeInsuranceData: LifeInsuranceTestData[] = [
  {
    policyType: "term",
    policyName: "HDFC Click 2 Protect Life",
    insurer: "HDFC Life",
    policyNumber: "TERM001234567",
    sumAssured: 10000000, // Rs. 1 Crore
    premiumAmount: 12000,
    premiumFrequency: "yearly",
    policyStartDate: "2021-04-01",
    policyEndDate: "2053-04-01", // Till age 60
    nomineeNames: ["Priya (Spouse)", "Arjun (Child)"],
    riders: ["Accidental Death Benefit", "Critical Illness Rider"],
    section80C: 12000,
    section10_10D: false, // Term plans don't have maturity
  },
  {
    policyType: "term",
    policyName: "ICICI Pru iProtect Smart",
    insurer: "ICICI Prudential",
    policyNumber: "TERM007654321",
    sumAssured: 5000000, // Rs. 50 Lakhs (additional cover)
    premiumAmount: 8000,
    premiumFrequency: "yearly",
    policyStartDate: "2022-06-15",
    policyEndDate: "2053-06-15",
    nomineeNames: ["Priya (Spouse)"],
    riders: ["Waiver of Premium"],
    section80C: 8000,
    section10_10D: false,
  },
  {
    policyType: "ulip",
    policyName: "HDFC ProGrowth Plus",
    insurer: "HDFC Life",
    policyNumber: "ULIP00987654",
    sumAssured: 1000000, // Rs. 10 Lakhs
    premiumAmount: 50000,
    premiumFrequency: "yearly",
    policyStartDate: "2020-01-15",
    policyEndDate: "2040-01-15",
    maturityDate: "2040-01-15",
    maturityAmount: 2500000, // Projected
    nomineeNames: ["Priya (Spouse)"],
    section80C: 50000,
    section10_10D: true, // ULIP maturity is tax-free
  },
];

// ============================================
// Health Insurance Data
// ============================================

export const healthInsuranceData: HealthInsuranceTestData[] = [
  {
    policyType: "family_floater",
    policyName: "HDFC Ergo Optima Secure",
    insurer: "HDFC Ergo",
    policyNumber: "HEALTH001234",
    sumInsured: 1000000, // Rs. 10 Lakhs
    premiumAmount: 25000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-04-01",
    policyEndDate: "2026-03-31",
    coveredMembers: ["Self", "Spouse", "Child"],
    roomRentLimit: "No Limit",
    ncbPercent: 20, // 20% NCB after 2 claim-free years
    waitingPeriod: 30,
    section80D: 25000,
  },
  {
    policyType: "super_top_up",
    policyName: "Star Health Super Top Up",
    insurer: "Star Health",
    policyNumber: "TOPUP007654",
    sumInsured: 5000000, // Rs. 50 Lakhs
    premiumAmount: 8000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-04-01",
    policyEndDate: "2026-03-31",
    coveredMembers: ["Self", "Spouse", "Child"],
    waitingPeriod: 0, // No waiting for super top-up
    copayPercent: 0,
    section80D: 0, // Already claimed in base policy
  },
  {
    policyType: "family_floater",
    policyName: "Care Health Senior",
    insurer: "Care Health",
    policyNumber: "SENIOR00123",
    sumInsured: 500000, // Rs. 5 Lakhs
    premiumAmount: 45000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-04-01",
    policyEndDate: "2026-03-31",
    coveredMembers: ["Father", "Mother"],
    roomRentLimit: "Rs. 5,000/day",
    ncbPercent: 0, // First year
    waitingPeriod: 30,
    copayPercent: 20, // 20% co-pay for senior citizens
    section80D: 0,
    section80DSenior: 50000, // Senior citizen deduction
  },
  {
    policyType: "critical_illness",
    policyName: "Max Bupa Critical Illness",
    insurer: "Max Bupa",
    policyNumber: "CI00987654",
    sumInsured: 2500000, // Rs. 25 Lakhs
    premiumAmount: 12000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-04-01",
    policyEndDate: "2026-03-31",
    coveredMembers: ["Self"],
    waitingPeriod: 90,
    section80D: 0, // Counted under main 80D limit
  },
];

// ============================================
// Other Insurance Data
// ============================================

export const otherInsuranceData: OtherInsuranceTestData[] = [
  {
    policyType: "motor",
    policyName: "HDFC Ergo Motor Insurance",
    insurer: "HDFC Ergo",
    policyNumber: "MOTOR001234",
    sumInsured: 800000, // IDV
    premiumAmount: 15000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-01-15",
    policyEndDate: "2026-01-14",
    assetDetails: "Hyundai Creta 2022 - KA05AB1234",
    coverageDetails: ["Comprehensive", "Zero Depreciation", "Engine Protect", "RSA"],
  },
  {
    policyType: "home",
    policyName: "ICICI Lombard Home Insurance",
    insurer: "ICICI Lombard",
    policyNumber: "HOME007654",
    sumInsured: 5000000, // Rs. 50 Lakhs (contents + building)
    premiumAmount: 5000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-04-01",
    policyEndDate: "2026-03-31",
    assetDetails: "Whitefield Apartment",
    coverageDetails: ["Fire", "Theft", "Natural Calamity", "Contents Cover"],
  },
  {
    policyType: "personal_accident",
    policyName: "Bajaj Allianz PA Cover",
    insurer: "Bajaj Allianz",
    policyNumber: "PA00123456",
    sumInsured: 5000000, // Rs. 50 Lakhs
    premiumAmount: 3000,
    premiumFrequency: "yearly",
    policyStartDate: "2025-04-01",
    policyEndDate: "2026-03-31",
    coverageDetails: ["Accidental Death", "Permanent Total Disability", "Permanent Partial Disability"],
  },
];

// ============================================
// Coverage Summary
// ============================================

export const coverageSummary = {
  life: {
    count: lifeInsuranceData.length,
    totalSumAssured: lifeInsuranceData.reduce((sum, p) => sum + p.sumAssured, 0),
    totalPremium: lifeInsuranceData.reduce((sum, p) => sum + p.premiumAmount, 0),
    termCover: lifeInsuranceData
      .filter(p => p.policyType === 'term')
      .reduce((sum, p) => sum + p.sumAssured, 0),
    ulipCover: lifeInsuranceData
      .filter(p => p.policyType === 'ulip')
      .reduce((sum, p) => sum + p.sumAssured, 0),
  },

  health: {
    count: healthInsuranceData.length,
    totalSumInsured: healthInsuranceData.reduce((sum, p) => sum + p.sumInsured, 0),
    totalPremium: healthInsuranceData.reduce((sum, p) => sum + p.premiumAmount, 0),
    selfFamilyCover: healthInsuranceData
      .filter(p => p.coveredMembers.includes('Self'))
      .reduce((sum, p) => sum + p.sumInsured, 0),
    parentsCover: healthInsuranceData
      .filter(p => p.coveredMembers.includes('Father') || p.coveredMembers.includes('Mother'))
      .reduce((sum, p) => sum + p.sumInsured, 0),
  },

  other: {
    count: otherInsuranceData.length,
    totalPremium: otherInsuranceData.reduce((sum, p) => sum + p.premiumAmount, 0),
  },

  get totalAnnualPremium() {
    return this.life.totalPremium + this.health.totalPremium + this.other.totalPremium;
  },

  // Tax Benefits
  taxBenefits: {
    section80C: lifeInsuranceData.reduce((sum, p) => sum + p.section80C, 0),
    section80D: healthInsuranceData.reduce((sum, p) => sum + p.section80D, 0),
    section80DSenior: healthInsuranceData.reduce((sum, p) => sum + (p.section80DSenior || 0), 0),
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
    type: 'Life Insurance',
    name: p.policyName,
    renewalDate: p.policyEndDate,
    premium: p.premiumAmount,
  })),
  ...healthInsuranceData.map(p => ({
    type: 'Health Insurance',
    name: p.policyName,
    renewalDate: p.policyEndDate,
    premium: p.premiumAmount,
  })),
  ...otherInsuranceData.map(p => ({
    type: 'Other Insurance',
    name: p.policyName,
    renewalDate: p.policyEndDate,
    premium: p.premiumAmount,
  })),
].sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

// ============================================
// Test Helpers
// ============================================

export function getLifePoliciesByType(type: LifeInsuranceTestData['policyType']): LifeInsuranceTestData[] {
  return lifeInsuranceData.filter(p => p.policyType === type);
}

export function getHealthPoliciesByType(type: HealthInsuranceTestData['policyType']): HealthInsuranceTestData[] {
  return healthInsuranceData.filter(p => p.policyType === type);
}

export function getPoliciesExpiringInDays(days: number): typeof renewalCalendar {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  return renewalCalendar.filter(p => new Date(p.renewalDate) <= cutoffDate);
}

export function getMemberCoverage(memberName: string) {
  const healthPolicies = healthInsuranceData.filter(p =>
    p.coveredMembers.some(m => m.toLowerCase().includes(memberName.toLowerCase()))
  );
  return {
    count: healthPolicies.length,
    totalCoverage: healthPolicies.reduce((sum, p) => sum + p.sumInsured, 0),
    policies: healthPolicies,
  };
}
