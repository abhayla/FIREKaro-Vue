/**
 * Advance Tax Calculation Utilities
 *
 * Implements Indian Income Tax rules for:
 * - Quarterly advance tax schedule (Jun 15, Sep 15, Dec 15, Mar 15)
 * - Interest calculation under Section 234B (default on advance tax)
 * - Interest calculation under Section 234C (deferment of installments)
 */

// Advance Tax Configuration Constants
export const ADVANCE_TAX_CONFIG = {
  // Threshold: Advance tax required if net tax liability > ₹10,000
  THRESHOLD: 10000,

  // Quarterly cumulative percentages
  QUARTERLY_PERCENTAGES: {
    Q1: 15,  // By June 15
    Q2: 45,  // By September 15
    Q3: 75,  // By December 15
    Q4: 100, // By March 15
  } as const,

  // Due dates (month is 1-indexed, day)
  DUE_DATES: {
    Q1: { month: 6, day: 15 },   // June 15
    Q2: { month: 9, day: 15 },   // September 15
    Q3: { month: 12, day: 15 },  // December 15
    Q4: { month: 3, day: 15 },   // March 15 (next calendar year)
  } as const,

  // Interest rate: 1% per month (simple interest)
  INTEREST_RATE: 0.01,

  // 234B: Interest charged if < 90% paid by March 31
  THRESHOLD_234B: 90,

  // 234C: Deferment months for interest calculation
  DEFERMENT_MONTHS: {
    Q1: 3,  // 3 months (Jun-Sep)
    Q2: 3,  // 3 months (Sep-Dec)
    Q3: 3,  // 3 months (Dec-Mar)
    Q4: 1,  // 1 month (Mar-Mar)
  } as const,
} as const

// Types
export interface AdvanceTaxDueDate {
  quarter: 1 | 2 | 3 | 4
  dueDate: Date
  cumulativePercentage: number
  description: string
}

export interface QuarterlySchedule {
  quarter: 1 | 2 | 3 | 4
  dueDate: Date
  cumulativePercentage: number
  cumulativeAmountDue: number
  quarterAmountDue: number
  amountPaid: number
  shortfall: number
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'
  interest234C: number
}

export interface Interest234BResult {
  isApplicable: boolean
  totalTaxLiability: number
  totalAdvanceTaxPaid: number
  shortfall: number
  monthsOfDefault: number
  interest: number
  reason: string
}

export interface Interest234CResult {
  quarterlyInterest: {
    quarter: number
    shortfall: number
    months: number
    interest: number
  }[]
  totalInterest: number
}

export interface AdvanceTaxCalculationResult {
  netTaxLiability: number
  advanceTaxRequired: boolean
  schedules: QuarterlySchedule[]
  interest234B: Interest234BResult
  interest234C: Interest234CResult
  totalInterest: number
}

/**
 * Get the start year of a financial year
 * "2024-25" => 2024
 */
function getFYStartYear(financialYear: string): number {
  return parseInt(financialYear.split('-')[0], 10)
}

/**
 * Get advance tax due dates for a financial year
 */
export function getAdvanceTaxDueDates(financialYear: string): AdvanceTaxDueDate[] {
  const startYear = getFYStartYear(financialYear)
  const { DUE_DATES, QUARTERLY_PERCENTAGES } = ADVANCE_TAX_CONFIG

  return [
    {
      quarter: 1,
      dueDate: new Date(startYear, DUE_DATES.Q1.month - 1, DUE_DATES.Q1.day),
      cumulativePercentage: QUARTERLY_PERCENTAGES.Q1,
      description: 'First Installment (15% of tax)',
    },
    {
      quarter: 2,
      dueDate: new Date(startYear, DUE_DATES.Q2.month - 1, DUE_DATES.Q2.day),
      cumulativePercentage: QUARTERLY_PERCENTAGES.Q2,
      description: 'Second Installment (45% cumulative)',
    },
    {
      quarter: 3,
      dueDate: new Date(startYear, DUE_DATES.Q3.month - 1, DUE_DATES.Q3.day),
      cumulativePercentage: QUARTERLY_PERCENTAGES.Q3,
      description: 'Third Installment (75% cumulative)',
    },
    {
      quarter: 4,
      dueDate: new Date(startYear + 1, DUE_DATES.Q4.month - 1, DUE_DATES.Q4.day),
      cumulativePercentage: QUARTERLY_PERCENTAGES.Q4,
      description: 'Fourth Installment (100% of tax)',
    },
  ]
}

/**
 * Check if advance tax is applicable based on net tax liability
 */
export function isAdvanceTaxApplicable(netTaxLiability: number): boolean {
  return netTaxLiability > ADVANCE_TAX_CONFIG.THRESHOLD
}

/**
 * Calculate quarterly schedule based on net tax liability and payments made
 */
export function calculateQuarterlySchedule(
  netTaxLiability: number,
  financialYear: string,
  payments: { quarter: number; amount: number; paymentDate: Date }[] = []
): QuarterlySchedule[] {
  const dueDates = getAdvanceTaxDueDates(financialYear)
  const today = new Date()

  // Group payments by quarter
  const paymentsByQuarter = new Map<number, number>()
  for (const payment of payments) {
    const current = paymentsByQuarter.get(payment.quarter) || 0
    paymentsByQuarter.set(payment.quarter, current + payment.amount)
  }

  // Calculate cumulative payments up to each quarter
  let cumulativePaid = 0

  return dueDates.map((dueDate, index) => {
    const quarterPayment = paymentsByQuarter.get(dueDate.quarter) || 0
    cumulativePaid += quarterPayment

    const cumulativeAmountDue = Math.round((netTaxLiability * dueDate.cumulativePercentage) / 100)
    const prevCumulativeAmountDue = index > 0
      ? Math.round((netTaxLiability * dueDates[index - 1].cumulativePercentage) / 100)
      : 0
    const quarterAmountDue = cumulativeAmountDue - prevCumulativeAmountDue

    const shortfall = Math.max(0, cumulativeAmountDue - cumulativePaid)

    // Determine status
    let status: QuarterlySchedule['status'] = 'PENDING'
    if (today > dueDate.dueDate) {
      if (cumulativePaid >= cumulativeAmountDue) {
        status = 'PAID'
      } else if (cumulativePaid > 0 && cumulativePaid < cumulativeAmountDue) {
        status = 'PARTIAL'
      } else {
        status = 'OVERDUE'
      }
    } else if (cumulativePaid >= cumulativeAmountDue) {
      status = 'PAID'
    }

    // Calculate 234C interest for this quarter
    const interest234C = today > dueDate.dueDate && shortfall > 0
      ? calculateQuarterInterest234C(shortfall, dueDate.quarter)
      : 0

    return {
      quarter: dueDate.quarter,
      dueDate: dueDate.dueDate,
      cumulativePercentage: dueDate.cumulativePercentage,
      cumulativeAmountDue,
      quarterAmountDue,
      amountPaid: quarterPayment,
      shortfall,
      status,
      interest234C,
    }
  })
}

/**
 * Calculate interest under Section 234B
 * Applicable when less than 90% of assessed tax is paid as advance tax
 */
export function calculateInterest234B(
  totalTaxLiability: number,
  totalAdvanceTaxPaid: number,
  assessmentDate: Date = new Date()
): Interest234BResult {
  const threshold = (totalTaxLiability * ADVANCE_TAX_CONFIG.THRESHOLD_234B) / 100
  const isApplicable = totalAdvanceTaxPaid < threshold

  if (!isApplicable) {
    return {
      isApplicable: false,
      totalTaxLiability,
      totalAdvanceTaxPaid,
      shortfall: 0,
      monthsOfDefault: 0,
      interest: 0,
      reason: 'Paid 90% or more of tax liability as advance tax',
    }
  }

  // Shortfall = Tax Liability - Advance Tax Paid (if advance tax paid < 90%)
  const shortfall = totalTaxLiability - totalAdvanceTaxPaid

  // Interest is calculated from April 1 of the assessment year
  // until the date of determination of total income (assessment)
  const aprilFirst = new Date(assessmentDate.getFullYear(), 3, 1) // April 1
  const monthsOfDefault = Math.max(1,
    Math.ceil((assessmentDate.getTime() - aprilFirst.getTime()) / (30 * 24 * 60 * 60 * 1000))
  )

  // Simple interest: 1% per month on shortfall
  const interest = Math.round(shortfall * ADVANCE_TAX_CONFIG.INTEREST_RATE * monthsOfDefault)

  return {
    isApplicable: true,
    totalTaxLiability,
    totalAdvanceTaxPaid,
    shortfall,
    monthsOfDefault,
    interest,
    reason: `Advance tax paid (₹${totalAdvanceTaxPaid.toLocaleString('en-IN')}) is less than 90% of tax liability`,
  }
}

/**
 * Calculate interest for a single quarter under Section 234C
 */
function calculateQuarterInterest234C(shortfall: number, quarter: 1 | 2 | 3 | 4): number {
  const months = ADVANCE_TAX_CONFIG.DEFERMENT_MONTHS[`Q${quarter}` as keyof typeof ADVANCE_TAX_CONFIG.DEFERMENT_MONTHS]
  return Math.round(shortfall * ADVANCE_TAX_CONFIG.INTEREST_RATE * months)
}

/**
 * Calculate interest under Section 234C
 * Applicable when advance tax installments are paid late or short
 */
export function calculateInterest234C(
  schedules: QuarterlySchedule[]
): Interest234CResult {
  const quarterlyInterest = schedules.map(schedule => ({
    quarter: schedule.quarter,
    shortfall: schedule.shortfall,
    months: ADVANCE_TAX_CONFIG.DEFERMENT_MONTHS[`Q${schedule.quarter}` as keyof typeof ADVANCE_TAX_CONFIG.DEFERMENT_MONTHS],
    interest: schedule.interest234C,
  }))

  const totalInterest = quarterlyInterest.reduce((sum, q) => sum + q.interest, 0)

  return {
    quarterlyInterest,
    totalInterest,
  }
}

/**
 * Detect which quarter a payment belongs to based on payment date
 */
export function detectQuarterFromPaymentDate(paymentDate: Date, financialYear: string): 1 | 2 | 3 | 4 {
  const dueDates = getAdvanceTaxDueDates(financialYear)

  // Find the quarter whose due date is closest to (but after) the payment date
  for (const dueDate of dueDates) {
    if (paymentDate <= dueDate.dueDate) {
      return dueDate.quarter
    }
  }

  // If payment is after all due dates, assign to Q4
  return 4
}

/**
 * Calculate complete advance tax analysis
 */
export function calculateAdvanceTaxAnalysis(
  netTaxLiability: number,
  financialYear: string,
  payments: { quarter: number; amount: number; paymentDate: Date }[] = [],
  assessmentDate?: Date
): AdvanceTaxCalculationResult {
  const advanceTaxRequired = isAdvanceTaxApplicable(netTaxLiability)
  const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear, payments)

  const totalAdvanceTaxPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const interest234B = calculateInterest234B(netTaxLiability, totalAdvanceTaxPaid, assessmentDate)
  const interest234C = calculateInterest234C(schedules)

  return {
    netTaxLiability,
    advanceTaxRequired,
    schedules,
    interest234B,
    interest234C,
    totalInterest: interest234B.interest + interest234C.totalInterest,
  }
}

/**
 * Format currency for display
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
