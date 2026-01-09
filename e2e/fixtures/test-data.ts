/**
 * E2E Test Data for Salary Section
 * Profile: Software Engineer with Career Progression
 * Total Records: 39 (across 4 Financial Years)
 */

export interface SalaryTestRecord {
  month: number // 1=April, 12=March (FY month)
  year: number // Calendar year
  financialYear: string // e.g., "2022-23"
  paidDays: number
  // Earnings
  basicSalary: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  otherAllowances: number
  // Deductions
  epfDeduction: number
  vpfDeduction: number
  professionalTax: number
  tdsDeduction: number
  otherDeductions: number
  // Employer Contributions (optional)
  employerPf?: number
  pensionFund?: number
  employerNps?: number
  // Expected calculations (for verification)
  expectedGross: number
  expectedDeductions: number
  expectedNet: number
}

// Helper to create consistent record structure
const createRecord = (
  month: number,
  year: number,
  fy: string,
  earnings: {
    basic: number
    hra: number
    special: number
    conveyance?: number
    medical?: number
    other?: number
  },
  deductions: {
    epf: number
    vpf?: number
    profTax?: number
    tds: number
    other?: number
  },
  employer?: {
    pf?: number
    eps?: number
    nps?: number
  }
): SalaryTestRecord => {
  const conveyance = earnings.conveyance ?? 1600
  const medical = earnings.medical ?? 1250
  const other = earnings.other ?? 0
  const vpf = deductions.vpf ?? 0
  const profTax = deductions.profTax ?? 200
  const otherDed = deductions.other ?? 0

  const gross = earnings.basic + earnings.hra + conveyance + medical + earnings.special + other
  const totalDeductions = deductions.epf + vpf + profTax + deductions.tds + otherDed
  const net = gross - totalDeductions

  return {
    month,
    year,
    financialYear: fy,
    paidDays: 30,
    basicSalary: earnings.basic,
    hra: earnings.hra,
    conveyanceAllowance: conveyance,
    medicalAllowance: medical,
    specialAllowance: earnings.special,
    otherAllowances: other,
    epfDeduction: deductions.epf,
    vpfDeduction: vpf,
    professionalTax: profTax,
    tdsDeduction: deductions.tds,
    otherDeductions: otherDed,
    employerPf: employer?.pf,
    pensionFund: employer?.eps,
    employerNps: employer?.nps,
    expectedGross: gross,
    expectedDeductions: totalDeductions,
    expectedNet: net,
  }
}

// ============================================
// FY 2022-23: Junior Developer (12 months)
// ============================================
export const fy2022_23: SalaryTestRecord[] = [
  // Apr 2022 - Mar 2023 (consistent salary)
  createRecord(1, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(2, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(3, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(4, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(5, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(6, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(7, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(8, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(9, 2022, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(10, 2023, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(11, 2023, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
  createRecord(12, 2023, '2022-23', { basic: 45000, hra: 22500, special: 15000, other: 3000 }, { epf: 5400, tds: 5000 }, { pf: 5400, eps: 1250 }),
]

// ============================================
// FY 2023-24: Mid-Level (After Promotion + 20% Hike)
// ============================================
export const fy2023_24: SalaryTestRecord[] = [
  // Apr-Sep 2023: Base salary after promotion
  createRecord(1, 2023, '2023-24', { basic: 60000, hra: 30000, special: 20000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 8000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(2, 2023, '2023-24', { basic: 60000, hra: 30000, special: 20000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 8000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(3, 2023, '2023-24', { basic: 60000, hra: 30000, special: 20000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 8000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(4, 2023, '2023-24', { basic: 60000, hra: 30000, special: 20000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 8000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(5, 2023, '2023-24', { basic: 60000, hra: 30000, special: 20000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 8000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(6, 2023, '2023-24', { basic: 60000, hra: 30000, special: 20000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 8000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  // Oct 2023 - Mar 2024: Special allowance increase (bonus adjustment)
  createRecord(7, 2023, '2023-24', { basic: 60000, hra: 30000, special: 30000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 9000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(8, 2023, '2023-24', { basic: 60000, hra: 30000, special: 30000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 9000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(9, 2023, '2023-24', { basic: 60000, hra: 30000, special: 30000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 9000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(10, 2024, '2023-24', { basic: 60000, hra: 30000, special: 30000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 9000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(11, 2024, '2023-24', { basic: 60000, hra: 30000, special: 30000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 9000 }, { pf: 7200, eps: 1250, nps: 6000 }),
  createRecord(12, 2024, '2023-24', { basic: 60000, hra: 30000, special: 30000, other: 4000 }, { epf: 7200, vpf: 3000, tds: 9000 }, { pf: 7200, eps: 1250, nps: 6000 }),
]

// ============================================
// FY 2024-25: Senior (After 25% Hike + Higher VPF)
// ============================================
export const fy2024_25: SalaryTestRecord[] = [
  // Apr-Jul 2024: Base senior salary
  createRecord(1, 2024, '2024-25', { basic: 75000, hra: 37500, special: 25000, other: 5000 }, { epf: 9000, vpf: 5000, tds: 12000 }, { pf: 9000, eps: 1250, nps: 7500 }),
  createRecord(2, 2024, '2024-25', { basic: 75000, hra: 37500, special: 25000, other: 5000 }, { epf: 9000, vpf: 5000, tds: 12000 }, { pf: 9000, eps: 1250, nps: 7500 }),
  createRecord(3, 2024, '2024-25', { basic: 75000, hra: 37500, special: 25000, other: 5000 }, { epf: 9000, vpf: 5000, tds: 12000 }, { pf: 9000, eps: 1250, nps: 7500 }),
  createRecord(4, 2024, '2024-25', { basic: 75000, hra: 37500, special: 25000, other: 5000 }, { epf: 9000, vpf: 5000, tds: 12000 }, { pf: 9000, eps: 1250, nps: 7500 }),
  // Aug-Sep 2024: Special allowance increase
  createRecord(5, 2024, '2024-25', { basic: 75000, hra: 37500, special: 35000, other: 5000 }, { epf: 9000, vpf: 5000, tds: 13000 }, { pf: 9000, eps: 1250, nps: 7500 }),
  createRecord(6, 2024, '2024-25', { basic: 75000, hra: 37500, special: 35000, other: 5000 }, { epf: 9000, vpf: 5000, tds: 13000 }, { pf: 9000, eps: 1250, nps: 7500 }),
  // Oct 2024 - Mar 2025: Basic salary increase (mid-year adjustment)
  createRecord(7, 2024, '2024-25', { basic: 80000, hra: 40000, special: 30000, other: 5000 }, { epf: 9600, vpf: 5000, tds: 14000 }, { pf: 9600, eps: 1250, nps: 8000 }),
  createRecord(8, 2024, '2024-25', { basic: 80000, hra: 40000, special: 30000, other: 5000 }, { epf: 9600, vpf: 5000, tds: 14000 }, { pf: 9600, eps: 1250, nps: 8000 }),
  createRecord(9, 2024, '2024-25', { basic: 80000, hra: 40000, special: 30000, other: 5000 }, { epf: 9600, vpf: 5000, tds: 14000 }, { pf: 9600, eps: 1250, nps: 8000 }),
  createRecord(10, 2025, '2024-25', { basic: 80000, hra: 40000, special: 30000, other: 5000 }, { epf: 9600, vpf: 5000, tds: 14000 }, { pf: 9600, eps: 1250, nps: 8000 }),
  createRecord(11, 2025, '2024-25', { basic: 80000, hra: 40000, special: 30000, other: 5000 }, { epf: 9600, vpf: 5000, tds: 14000 }, { pf: 9600, eps: 1250, nps: 8000 }),
  createRecord(12, 2025, '2024-25', { basic: 80000, hra: 40000, special: 30000, other: 5000 }, { epf: 9600, vpf: 5000, tds: 14000 }, { pf: 9600, eps: 1250, nps: 8000 }),
]

// ============================================
// FY 2025-26: Lead (Current Year - Partial, 3 months)
// ============================================
export const fy2025_26: SalaryTestRecord[] = [
  createRecord(1, 2025, '2025-26', { basic: 100000, hra: 50000, special: 40000, other: 6000 }, { epf: 12000, vpf: 8000, tds: 18000 }, { pf: 12000, eps: 1250, nps: 10000 }),
  createRecord(2, 2025, '2025-26', { basic: 100000, hra: 50000, special: 40000, other: 6000 }, { epf: 12000, vpf: 8000, tds: 18000 }, { pf: 12000, eps: 1250, nps: 10000 }),
  createRecord(3, 2025, '2025-26', { basic: 100000, hra: 50000, special: 40000, other: 6000 }, { epf: 12000, vpf: 8000, tds: 18000 }, { pf: 12000, eps: 1250, nps: 10000 }),
]

// ============================================
// All Test Data Combined (39 records)
// ============================================
export const allSalaryTestData: SalaryTestRecord[] = [
  ...fy2022_23,
  ...fy2023_24,
  ...fy2024_25,
  ...fy2025_26,
]

// ============================================
// Summary by Financial Year
// ============================================
export const fySummaries = {
  '2022-23': {
    records: 12,
    totalGross: 1060200,
    totalNet: 870600,
    totalTDS: 60000,
    avgMonthlyGross: 88350,
    avgMonthlyNet: 72550,
  },
  '2023-24': {
    records: 12,
    totalGross: 1461000,
    totalNet: 1173000,
    totalTDS: 102000,
    avgMonthlyGross: 121750,
    avgMonthlyNet: 97750,
  },
  '2024-25': {
    records: 12,
    totalGross: 1845200,
    totalNet: 1452400,
    totalTDS: 158000,
    avgMonthlyGross: 153767,
    avgMonthlyNet: 121033,
  },
  '2025-26': {
    records: 3,
    totalGross: 596550,
    totalNet: 466350,
    totalTDS: 54000,
    avgMonthlyGross: 198850,
    avgMonthlyNet: 155450,
  },
}

// ============================================
// Edge Case Test Data
// ============================================
export const edgeCases = {
  minimumEntry: {
    month: 1,
    year: 2024,
    financialYear: '2024-25',
    paidDays: 30,
    basicSalary: 50000,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    otherAllowances: 0,
    epfDeduction: 0,
    vpfDeduction: 0,
    professionalTax: 0,
    tdsDeduction: 0,
    otherDeductions: 0,
    expectedGross: 50000,
    expectedDeductions: 0,
    expectedNet: 50000,
  },
  maximumEntry: {
    month: 1,
    year: 2024,
    financialYear: '2024-25',
    paidDays: 30,
    basicSalary: 500000,
    hra: 250000,
    conveyanceAllowance: 5000,
    medicalAllowance: 5000,
    specialAllowance: 100000,
    otherAllowances: 50000,
    epfDeduction: 60000,
    vpfDeduction: 50000,
    professionalTax: 2500,
    tdsDeduction: 150000,
    otherDeductions: 10000,
    expectedGross: 910000,
    expectedDeductions: 272500,
    expectedNet: 637500,
  },
  partTimeMonth: {
    month: 1,
    year: 2024,
    financialYear: '2024-25',
    paidDays: 15,
    basicSalary: 37500, // Half of 75000
    hra: 18750,
    conveyanceAllowance: 800,
    medicalAllowance: 625,
    specialAllowance: 12500,
    otherAllowances: 2500,
    epfDeduction: 4500,
    vpfDeduction: 2500,
    professionalTax: 100,
    tdsDeduction: 6000,
    otherDeductions: 0,
    expectedGross: 72675,
    expectedDeductions: 13100,
    expectedNet: 59575,
  },
}

// ============================================
// Month Names Helper
// ============================================
export const monthNames: Record<number, string> = {
  1: 'April',
  2: 'May',
  3: 'June',
  4: 'July',
  5: 'August',
  6: 'September',
  7: 'October',
  8: 'November',
  9: 'December',
  10: 'January',
  11: 'February',
  12: 'March',
}

export const getMonthLabel = (month: number, year: number): string => {
  const monthName = monthNames[month]
  const shortYear = year.toString().slice(-2)
  return `${monthName.slice(0, 3)}'${shortYear}`
}
