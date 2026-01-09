// Salary Types for FIREKaro Vue 3 SPA

// Sync status for EPF/NPS auto-sync
export type SyncStatus = "PENDING" | "SYNCED" | "CONFLICT" | "SKIPPED";

// Component types for dynamic salary structure
export type SalaryComponentType = "EARNING" | "DEDUCTION" | "EMPLOYER_CONTRIBUTION";

// Sync targets for auto-sync to investment accounts (matches Prisma SyncTargetType)
export type SyncTargetType = "EPF" | "VPF" | "NPS_EMPLOYEE" | "NPS_EMPLOYER" | "SUPERANNUATION" | "PENSION_FUND" | "NONE";
export type SyncTarget = SyncTargetType | null; // Backward compatibility alias

// Sync direction for salary components (matches Prisma SyncDirection)
export type SyncDirection = "FROM_SALARY" | "TO_SALARY" | "BIDIRECTIONAL" | "MANUAL";

// Tax sections that can apply to salary components
export type TaxSection = "80C" | "80CCD(1)" | "80CCD(1B)" | "80CCD(2)" | "80D" | "24" | "10(5)" | "10(13A)" | "10(14)" | "16(iii)" | null;

// Dynamic salary component definition (system or user-defined)
// Matches Prisma SalaryComponentDefinition model
export interface SalaryComponentDefinition {
  id: string;
  code: string; // e.g., "BASIC", "HRA", "VPF"
  name: string; // e.g., "Basic Salary", "House Rent Allowance"
  componentType: SalaryComponentType;
  category: string | null; // "Fixed", "Variable", "Statutory", "Voluntary", "Other"
  isTaxable: boolean;
  taxSection: TaxSection;
  isExemptUpTo: number | null; // Exemption limit in INR
  syncTarget: SyncTargetType;
  syncDirection: SyncDirection;
  isSystem: boolean; // true for system components, false for user-defined
  isExpandable: boolean; // true for "Other Deductions" which can expand
  parentCode: string | null; // for sub-components (VPF under "OTHER_DED")
  displayOrder: number;
  isActive: boolean;
  userId: string | null; // null for system components
  createdAt?: string;
  updatedAt?: string;
}

// Individual component entry for a specific month
// Matches Prisma SalaryComponentEntry model
export interface SalaryComponentEntry {
  id: string;
  monthlySalaryId: string;
  componentDefinitionId: string;
  componentDefinition?: SalaryComponentDefinition;
  amount: number;
  remarks: string | null;
  syncStatus: SyncStatus;
  syncedAt: string | null;
  syncError: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Salary structure for tracking mid-year changes (promotion, raise)
// Matches Prisma SalaryStructure model
export interface SalaryStructure {
  id: string;
  incomeSourceId: string;
  structureName: string; // "Initial", "Post-Promotion Sep 2024"
  effectiveFrom: string; // ISO date
  effectiveTo: string | null; // null if current
  templateData: Record<string, number>; // { "BASIC": 150000, "HRA": 60000, ... }
  reason: string | null; // "Promotion", "Annual Increment"
  changePercent: number | null; // Percentage change from previous structure
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Legacy interface for backward compatibility
export interface SalaryStructureComponent {
  componentCode: string;
  amount: number;
}

// Employer salary summary for cards
export interface EmployerSalarySummary {
  incomeSource: IncomeSource;
  monthsRecorded: number;
  totalMonths: number; // 12 for full FY
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  completionPercentage: number;
}

// Grid data structure for 12-column FY view
export interface SalaryGridRow {
  componentCode: string;
  componentName: string;
  componentType: SalaryComponentType;
  isExpandable: boolean;
  isExpanded?: boolean;
  isSubComponent?: boolean;
  parentCode?: string;
  displayOrder: number;
  values: (number | null)[]; // 12 months: [Apr, May, ..., Mar]
  total: number;
}

export interface SalaryGridData {
  financialYear: string;
  incomeSourceId: string;
  employerName: string;
  rows: SalaryGridRow[];
  paidDays: (number | null)[];
  totalPaidDays: number;
  grossEarnings: (number | null)[];
  totalGrossEarnings: number;
  totalDeductions: (number | null)[];
  totalTotalDeductions: number;
  netSalary: (number | null)[];
  totalNetSalary: number;
}

// System component codes (constants) - matches Prisma seed script
export const SYSTEM_COMPONENTS = {
  // Earnings
  BASIC: "BASIC",
  HRA: "HRA",
  DA: "DA",
  CONVEYANCE: "CONVEYANCE",
  MEDICAL: "MEDICAL",
  SPECIAL: "SPECIAL",
  LTA: "LTA",
  CEA: "CEA",
  CAR: "CAR",
  BONUS: "BONUS",
  INCENTIVE: "INCENTIVE",
  SPECIAL_PAY: "SPECIAL_PAY",
  // Deductions
  EPF: "EPF",
  VPF: "VPF",
  PT: "PT",
  TDS: "TDS",
  NPS_EMP: "NPS_EMP",
  NPS_EMP_ADDL: "NPS_EMP_ADDL",
  ESI: "ESI",
  LWF: "LWF",
  LOAN_RECOVERY: "LOAN_RECOVERY",
  OTHER_DED: "OTHER_DED",
  // Employer Contributions
  EPF_ER: "EPF_ER",
  PENSION: "PENSION",
  NPS_ER: "NPS_ER",
  SUPERANN: "SUPERANN",
  GRATUITY: "GRATUITY",
  ESI_ER: "ESI_ER",
} as const;

// Default system component definitions (matches seed-salary-components.ts)
export const DEFAULT_COMPONENT_DEFINITIONS: Omit<SalaryComponentDefinition, "id" | "userId" | "createdAt" | "updatedAt">[] = [
  // Earnings
  { code: "BASIC", name: "Basic Salary", componentType: "EARNING", category: "Fixed", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 1, isActive: true },
  { code: "HRA", name: "House Rent Allowance", componentType: "EARNING", category: "Fixed", isTaxable: true, taxSection: "10(13A)", isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 2, isActive: true },
  { code: "CONVEYANCE", name: "Conveyance Allowance", componentType: "EARNING", category: "Fixed", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 3, isActive: true },
  { code: "MEDICAL", name: "Medical Allowance", componentType: "EARNING", category: "Fixed", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 4, isActive: true },
  { code: "SPECIAL", name: "Special Allowance", componentType: "EARNING", category: "Fixed", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 5, isActive: true },
  { code: "SPECIAL_PAY", name: "Special Pay/Arrears", componentType: "EARNING", category: "Variable", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 6, isActive: true },
  { code: "LTA", name: "Leave Travel Allowance", componentType: "EARNING", category: "Variable", isTaxable: true, taxSection: "10(5)", isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 7, isActive: true },
  { code: "BONUS", name: "Bonus", componentType: "EARNING", category: "Variable", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 8, isActive: true },
  { code: "INCENTIVE", name: "Incentives", componentType: "EARNING", category: "Variable", isTaxable: true, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 9, isActive: true },
  // Deductions
  { code: "EPF", name: "Employee Provident Fund", componentType: "DEDUCTION", category: "Statutory", isTaxable: false, taxSection: "80C", isExemptUpTo: 150000, syncTarget: "EPF", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 20, isActive: true },
  { code: "OTHER_DED", name: "Other Deductions", componentType: "DEDUCTION", category: "Other", isTaxable: false, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: true, parentCode: null, displayOrder: 21, isActive: true },
  { code: "VPF", name: "Voluntary Provident Fund", componentType: "DEDUCTION", category: "Voluntary", isTaxable: false, taxSection: "80C", isExemptUpTo: null, syncTarget: "VPF", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: "OTHER_DED", displayOrder: 22, isActive: true },
  { code: "NPS_EMP", name: "NPS Employee Contribution", componentType: "DEDUCTION", category: "Voluntary", isTaxable: false, taxSection: "80CCD(1)", isExemptUpTo: 150000, syncTarget: "NPS_EMPLOYEE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: "OTHER_DED", displayOrder: 23, isActive: true },
  { code: "ESI", name: "ESI Contribution", componentType: "DEDUCTION", category: "Statutory", isTaxable: false, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: "OTHER_DED", displayOrder: 24, isActive: true },
  { code: "PT", name: "Professional Tax", componentType: "DEDUCTION", category: "Statutory", isTaxable: false, taxSection: "16(iii)", isExemptUpTo: 2500, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 25, isActive: true },
  { code: "TDS", name: "Income Tax (TDS)", componentType: "DEDUCTION", category: "Statutory", isTaxable: false, taxSection: null, isExemptUpTo: null, syncTarget: "NONE", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 26, isActive: true },
  // Employer Contributions
  { code: "EPF_ER", name: "Employer Provident Fund", componentType: "EMPLOYER_CONTRIBUTION", category: "Statutory", isTaxable: false, taxSection: null, isExemptUpTo: null, syncTarget: "EPF", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 40, isActive: true },
  { code: "PENSION", name: "Pension Fund (EPS)", componentType: "EMPLOYER_CONTRIBUTION", category: "Statutory", isTaxable: false, taxSection: null, isExemptUpTo: null, syncTarget: "PENSION_FUND", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 41, isActive: true },
  { code: "NPS_ER", name: "Employer NPS", componentType: "EMPLOYER_CONTRIBUTION", category: "Voluntary", isTaxable: false, taxSection: "80CCD(2)", isExemptUpTo: null, syncTarget: "NPS_EMPLOYER", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 42, isActive: true },
  { code: "SUPERANN", name: "Superannuation Fund", componentType: "EMPLOYER_CONTRIBUTION", category: "Voluntary", isTaxable: false, taxSection: null, isExemptUpTo: 150000, syncTarget: "SUPERANNUATION", syncDirection: "FROM_SALARY", isSystem: true, isExpandable: false, parentCode: null, displayOrder: 43, isActive: true },
];

// ============================================
// Legacy Types (kept for backward compatibility)
// ============================================

// Income Source (Employer) for multi-employer support
export interface IncomeSource {
  id: string;
  sourceName: string;
  sourceType: "SALARY" | "BUSINESS" | "PROFESSION" | "HOUSE_PROPERTY" | "CAPITAL_GAINS" | "OTHER_SOURCES";
  description?: string;
  financialYear: string;
  status: "ACTIVE" | "INACTIVE";
  isPrimary: boolean;
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
}

export interface SalaryComponent {
  name: string;
  amount: number;
  type: "earning" | "deduction" | "employer_contribution";
  taxable?: boolean;
  taxSection?: string;
}

export interface SalaryBreakdown {
  id: string;
  month: string;
  year: number;
  financialYear: string;
  paidDays: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  employerContributions: SalaryComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  tdsDeducted: number;
}

export interface CurrentSalary {
  id: string;
  employerName: string;
  employeeId?: string;
  designation?: string;
  pan?: string;
  uan?: string;
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  epfDeduction: number;
  vpfDeduction: number;
  professionalTax: number;
  tdsDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface SalaryHistoryRecord {
  id: string;
  month: number; // 1=April, 12=March
  year: number;
  financialYear: string;
  // Multi-employer support
  incomeSourceId?: string;
  employerName?: string;
  incomeSource?: {
    id: string;
    sourceName: string;
    sourceType: string;
  };
  // Earnings
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  specialPay: number;
  otherAllowances: number;
  grossEarnings: number;
  // Deductions
  epfDeduction: number;
  vpfDeduction: number;
  professionalTax: number;
  tdsDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  paidDays: number;
  // Employer contributions (info only)
  employerPf?: number;
  employerNps?: number;
  pensionFund?: number;
  superannuation?: number;
  // Sync tracking
  syncStatus?: SyncStatus;
  lastSyncedAt?: string;
  syncedToEpf?: boolean;
  syncedToNps?: boolean;
  syncError?: string;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface SalaryHistoryInput {
  month: number;
  year: number;
  financialYear: string;
  // Multi-employer support
  incomeSourceId?: string;
  employerName?: string;
  // Earnings
  basicSalary: number;
  hra?: number;
  conveyanceAllowance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  specialPay?: number;
  otherAllowances?: number;
  // Deductions
  epfDeduction?: number;
  vpfDeduction?: number;
  professionalTax?: number;
  tdsDeduction?: number;
  otherDeductions?: number;
  paidDays?: number;
  // Employer contributions
  employerPf?: number;
  employerNps?: number;
  pensionFund?: number;
  superannuation?: number;
}

export interface SalarySummary {
  financialYear: string;
  totalGrossEarnings: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTdsDeducted: number;
  totalEpfContribution: number;
  totalVpfContribution: number;
  monthsRecorded: number;
  averageMonthlyGross: number;
  averageMonthlyNet: number;
}

export interface MonthlySalarySummary {
  month: number;
  monthName: string;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  tdsDeducted: number;
}

// Financial Year months (April = 1, March = 12)
export const FY_MONTHS = [
  { value: 1, label: "April", shortLabel: "Apr" },
  { value: 2, label: "May", shortLabel: "May" },
  { value: 3, label: "June", shortLabel: "Jun" },
  { value: 4, label: "July", shortLabel: "Jul" },
  { value: 5, label: "August", shortLabel: "Aug" },
  { value: 6, label: "September", shortLabel: "Sep" },
  { value: 7, label: "October", shortLabel: "Oct" },
  { value: 8, label: "November", shortLabel: "Nov" },
  { value: 9, label: "December", shortLabel: "Dec" },
  { value: 10, label: "January", shortLabel: "Jan" },
  { value: 11, label: "February", shortLabel: "Feb" },
  { value: 12, label: "March", shortLabel: "Mar" },
] as const;

export function getMonthName(fyMonth: number): string {
  return FY_MONTHS.find((m) => m.value === fyMonth)?.label || "";
}

export function getShortMonthName(fyMonth: number): string {
  return FY_MONTHS.find((m) => m.value === fyMonth)?.shortLabel || "";
}

export function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are 0-indexed
  // FY starts in April
  if (month >= 4) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

export function getFinancialYearOptions(): string[] {
  const current = new Date().getFullYear();
  const options: string[] = [];
  // Show last 5 years and current
  for (let i = 0; i < 6; i++) {
    const startYear = current - i;
    const endYear = startYear + 1;
    // If we're before April, adjust
    options.push(`${startYear}-${endYear.toString().slice(-2)}`);
  }
  return options;
}
