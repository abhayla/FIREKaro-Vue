/**
 * E2E Test Helper Utilities
 */

/**
 * Format number as INR currency (Indian format)
 * @example formatINR(150000) => "₹1,50,000"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number as INR in lakhs
 * @example formatINRLakhs(1500000) => "15.00L"
 */
export function formatINRLakhs(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)}Cr`
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)}L`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`
  }
  return amount.toString()
}

/**
 * Parse INR formatted string back to number
 * @example parseINR("₹1,50,000") => 150000
 */
export function parseINR(formatted: string): number {
  return parseInt(formatted.replace(/[₹,\s]/g, ''), 10)
}

/**
 * Get screenshot filename with timestamp
 * @example getScreenshotName('salary', 'add', 'dialog') => "salary-add-dialog-1704672000000.png"
 */
export function getScreenshotName(section: string, test: string, step: string): string {
  const timestamp = Date.now()
  return `${section}-${test}-${step}-${timestamp}.png`
}

/**
 * Wait utility with configurable timeout
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Financial Year month to calendar month mapping
 * FY months: 1=April, 2=May, ..., 12=March
 */
export const fyMonthToCalendarMonth: Record<number, number> = {
  1: 4, // April
  2: 5, // May
  3: 6, // June
  4: 7, // July
  5: 8, // August
  6: 9, // September
  7: 10, // October
  8: 11, // November
  9: 12, // December
  10: 1, // January
  11: 2, // February
  12: 3, // March
}

/**
 * Get year for FY month
 * For FY 2024-25: Apr-Dec is 2024, Jan-Mar is 2025
 */
export function getYearForFYMonth(fyMonth: number, financialYear: string): number {
  const [startYear] = financialYear.split('-').map(Number)
  // FY months 1-9 (Apr-Dec) use startYear, 10-12 (Jan-Mar) use startYear + 1
  return fyMonth <= 9 ? startYear : startYear + 1
}

/**
 * Month names for display
 */
export const monthNames = [
  '', // 0 index placeholder
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
]

/**
 * Short month names
 */
export const shortMonthNames = [
  '', // 0 index placeholder
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
]

/**
 * Get display label for month
 * @example getMonthLabel(1, 2024) => "Apr'24"
 */
export function getMonthLabel(fyMonth: number, year: number): string {
  const shortMonth = shortMonthNames[fyMonth]
  const shortYear = year.toString().slice(-2)
  return `${shortMonth}'${shortYear}`
}

/**
 * Salary calculation helpers
 */
export function calculateGross(earnings: {
  basicSalary: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  otherAllowances: number
}): number {
  return (
    earnings.basicSalary +
    earnings.hra +
    earnings.conveyanceAllowance +
    earnings.medicalAllowance +
    earnings.specialAllowance +
    earnings.otherAllowances
  )
}

export function calculateDeductions(deductions: {
  epfDeduction: number
  vpfDeduction: number
  professionalTax: number
  tdsDeduction: number
  otherDeductions: number
}): number {
  return (
    deductions.epfDeduction +
    deductions.vpfDeduction +
    deductions.professionalTax +
    deductions.tdsDeduction +
    deductions.otherDeductions
  )
}

export function calculateNet(gross: number, deductions: number): number {
  return gross - deductions
}

/**
 * Test result type
 */
export interface TestStepResult {
  step: number
  action: string
  screenshot: string
  verification: string
  result: 'PASS' | 'FAIL'
  error?: string
}

/**
 * Test report type
 */
export interface TestReport {
  testName: string
  date: string
  financialYear: string
  totalSteps: number
  passed: number
  failed: number
  steps: TestStepResult[]
}

/**
 * Create test report
 */
export function createTestReport(testName: string, financialYear: string): TestReport {
  return {
    testName,
    date: new Date().toISOString().split('T')[0],
    financialYear,
    totalSteps: 0,
    passed: 0,
    failed: 0,
    steps: [],
  }
}

/**
 * Add step to report
 */
export function addStepToReport(
  report: TestReport,
  step: Omit<TestStepResult, 'step'>
): TestReport {
  const stepNumber = report.steps.length + 1
  report.steps.push({ ...step, step: stepNumber })
  report.totalSteps = stepNumber
  if (step.result === 'PASS') {
    report.passed++
  } else {
    report.failed++
  }
  return report
}

/**
 * Format test report as markdown
 */
export function formatReportAsMarkdown(report: TestReport): string {
  const header = `## ${report.testName}
Date: ${report.date}
Financial Year: ${report.financialYear}

### Summary
- Total Steps: ${report.totalSteps}
- Passed: ${report.passed}
- Failed: ${report.failed}

### Steps
| # | Action | Screenshot | Verification | Result |
|---|--------|------------|--------------|--------|
`

  const rows = report.steps
    .map(
      (s) =>
        `| ${s.step} | ${s.action} | ${s.screenshot} | ${s.verification} | ${s.result} |`
    )
    .join('\n')

  const footer = `

### Final Status: ${report.failed === 0 ? 'ALL TESTS PASSED ✓' : `${report.failed} FAILURES`}
`

  return header + rows + footer
}
