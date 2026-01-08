// Salary Types for FIREKaro Vue 3 SPA

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
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  specialPay: number;
  otherAllowances: number;
  grossEarnings: number;
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
  createdAt: string;
  updatedAt: string;
}

export interface SalaryHistoryInput {
  month: number;
  year: number;
  financialYear: string;
  basicSalary: number;
  hra?: number;
  conveyanceAllowance?: number;
  medicalAllowance?: number;
  specialAllowance?: number;
  specialPay?: number;
  otherAllowances?: number;
  epfDeduction?: number;
  vpfDeduction?: number;
  professionalTax?: number;
  tdsDeduction?: number;
  otherDeductions?: number;
  paidDays?: number;
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
