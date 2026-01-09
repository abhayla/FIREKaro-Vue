/**
 * Unified Test Profile for FIREKaro E2E Tests
 *
 * This profile maintains consistency across all test sections.
 * Profile: Senior Software Engineer with career progression, based in Bangalore
 *
 * All section-specific test data should reference this profile to ensure
 * cross-section integration tests work correctly.
 */

export interface FamilyMember {
  name: string;
  age: number;
  relationship: 'spouse' | 'child' | 'parent';
  occupation?: string;
  isDependent: boolean;
}

export interface TestUserProfile {
  // Personal Info
  name: string;
  email: string;
  age: number;
  dateOfBirth: string;
  occupation: string;
  employer: string;
  city: string;

  // Family
  family: FamilyMember[];

  // Current Financial Year
  currentFY: string;

  // Income Summary (from salary data - FY 2025-26)
  monthlyGross: number;
  monthlyNet: number;
  annualGross: number;
  annualNet: number;

  // Financial Targets
  targets: {
    savingsRate: number; // percentage
    emergencyFundMonths: number;
    fireAge: number;
    retirementCorpus: number;
    monthlyExpenses: number;
  };

  // Tax Profile
  taxProfile: {
    panNumber: string;
    preferredRegime: 'OLD' | 'NEW';
    isSeniorCitizen: boolean;
  };
}

export const testUserProfile: TestUserProfile = {
  // Personal Info
  name: "Abhay Test User",
  email: "abhayfaircent@gmail.com",
  age: 32,
  dateOfBirth: "1993-06-15",
  occupation: "Lead Software Engineer",
  employer: "Tech Corp India Pvt Ltd",
  city: "Bangalore",

  // Family (4 members including self)
  family: [
    {
      name: "Priya (Spouse)",
      age: 30,
      relationship: "spouse",
      occupation: "Product Manager",
      isDependent: false,
    },
    {
      name: "Arjun (Child)",
      age: 5,
      relationship: "child",
      isDependent: true,
    },
    {
      name: "Father",
      age: 62,
      relationship: "parent",
      isDependent: true,
    },
    {
      name: "Mother",
      age: 58,
      relationship: "parent",
      isDependent: true,
    },
  ],

  // Current Financial Year
  currentFY: "2025-26",

  // Income Summary (from existing salary fixtures - FY 2025-26)
  // Lead level: Rs.1,98,850 gross, Rs.1,55,450 net per month
  monthlyGross: 198850,
  monthlyNet: 155450,
  annualGross: 2386200, // 12 * 198850
  annualNet: 1865400, // 12 * 155450

  // Financial Targets
  targets: {
    savingsRate: 40, // 40% of net income
    emergencyFundMonths: 6,
    fireAge: 45,
    retirementCorpus: 50000000, // Rs. 5 Crores
    monthlyExpenses: 70000, // Rs. 70K/month
  },

  // Tax Profile
  taxProfile: {
    panNumber: "ABCDE1234F",
    preferredRegime: "OLD", // Has enough deductions
    isSeniorCitizen: false,
  },
};

// ============================================
// Financial Summary Calculations
// ============================================

export const financialSummary = {
  // Monthly Cash Flow
  monthly: {
    grossIncome: testUserProfile.monthlyGross,
    netIncome: testUserProfile.monthlyNet,
    expenses: testUserProfile.targets.monthlyExpenses,
    savings: testUserProfile.monthlyNet - testUserProfile.targets.monthlyExpenses,
    savingsRate: Math.round(
      ((testUserProfile.monthlyNet - testUserProfile.targets.monthlyExpenses) /
       testUserProfile.monthlyNet) * 100
    ),
  },

  // Annual Summary
  annual: {
    grossIncome: testUserProfile.annualGross,
    netIncome: testUserProfile.annualNet,
    expenses: testUserProfile.targets.monthlyExpenses * 12,
    savings: testUserProfile.annualNet - (testUserProfile.targets.monthlyExpenses * 12),
  },

  // FIRE Calculations
  fire: {
    fireNumber: testUserProfile.targets.monthlyExpenses * 12 * 25, // 25x annual expenses
    currentAge: testUserProfile.age,
    targetAge: testUserProfile.targets.fireAge,
    yearsToFIRE: testUserProfile.targets.fireAge - testUserProfile.age,
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get dependents from family
 */
export function getDependents(): FamilyMember[] {
  return testUserProfile.family.filter(m => m.isDependent);
}

/**
 * Get working family members (for spouse income consideration)
 */
export function getWorkingMembers(): FamilyMember[] {
  return testUserProfile.family.filter(m => m.occupation && !m.isDependent);
}

/**
 * Check if user has parents as dependents
 */
export function hasParentDependents(): boolean {
  return testUserProfile.family.some(
    m => m.relationship === 'parent' && m.isDependent
  );
}

/**
 * Get child dependents
 */
export function getChildDependents(): FamilyMember[] {
  return testUserProfile.family.filter(
    m => m.relationship === 'child' && m.isDependent
  );
}
