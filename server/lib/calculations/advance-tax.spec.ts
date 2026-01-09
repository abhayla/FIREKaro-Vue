import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ADVANCE_TAX_CONFIG,
  getAdvanceTaxDueDates,
  isAdvanceTaxApplicable,
  calculateQuarterlySchedule,
  calculateInterest234B,
  calculateInterest234C,
  detectQuarterFromPaymentDate,
  calculateAdvanceTaxAnalysis,
  formatINR,
} from './advance-tax'

describe('Advance Tax Calculations', () => {
  describe('ADVANCE_TAX_CONFIG', () => {
    it('should have correct threshold value', () => {
      expect(ADVANCE_TAX_CONFIG.THRESHOLD).toBe(10000)
    })

    it('should have correct quarterly percentages', () => {
      expect(ADVANCE_TAX_CONFIG.QUARTERLY_PERCENTAGES).toEqual({
        Q1: 15,
        Q2: 45,
        Q3: 75,
        Q4: 100,
      })
    })

    it('should have correct interest rate', () => {
      expect(ADVANCE_TAX_CONFIG.INTEREST_RATE).toBe(0.01)
    })

    it('should have correct 234B threshold', () => {
      expect(ADVANCE_TAX_CONFIG.THRESHOLD_234B).toBe(90)
    })

    it('should have correct deferment months', () => {
      expect(ADVANCE_TAX_CONFIG.DEFERMENT_MONTHS).toEqual({
        Q1: 3,
        Q2: 3,
        Q3: 3,
        Q4: 1,
      })
    })
  })

  describe('getAdvanceTaxDueDates', () => {
    it('should return 4 due dates', () => {
      const dueDates = getAdvanceTaxDueDates('2024-25')
      expect(dueDates).toHaveLength(4)
    })

    it('should return correct due dates for FY 2024-25', () => {
      const dueDates = getAdvanceTaxDueDates('2024-25')

      expect(dueDates[0].quarter).toBe(1)
      expect(dueDates[0].dueDate).toEqual(new Date(2024, 5, 15)) // June 15, 2024
      expect(dueDates[0].cumulativePercentage).toBe(15)

      expect(dueDates[1].quarter).toBe(2)
      expect(dueDates[1].dueDate).toEqual(new Date(2024, 8, 15)) // September 15, 2024
      expect(dueDates[1].cumulativePercentage).toBe(45)

      expect(dueDates[2].quarter).toBe(3)
      expect(dueDates[2].dueDate).toEqual(new Date(2024, 11, 15)) // December 15, 2024
      expect(dueDates[2].cumulativePercentage).toBe(75)

      expect(dueDates[3].quarter).toBe(4)
      expect(dueDates[3].dueDate).toEqual(new Date(2025, 2, 15)) // March 15, 2025
      expect(dueDates[3].cumulativePercentage).toBe(100)
    })

    it('should include descriptions for each quarter', () => {
      const dueDates = getAdvanceTaxDueDates('2024-25')

      expect(dueDates[0].description).toContain('First')
      expect(dueDates[1].description).toContain('Second')
      expect(dueDates[2].description).toContain('Third')
      expect(dueDates[3].description).toContain('Fourth')
    })
  })

  describe('isAdvanceTaxApplicable', () => {
    it('should return false when tax liability is below threshold', () => {
      expect(isAdvanceTaxApplicable(5000)).toBe(false)
      expect(isAdvanceTaxApplicable(10000)).toBe(false)
    })

    it('should return true when tax liability exceeds threshold', () => {
      expect(isAdvanceTaxApplicable(10001)).toBe(true)
      expect(isAdvanceTaxApplicable(50000)).toBe(true)
      expect(isAdvanceTaxApplicable(100000)).toBe(true)
    })

    it('should return false for zero tax liability', () => {
      expect(isAdvanceTaxApplicable(0)).toBe(false)
    })

    it('should return false for negative tax liability', () => {
      expect(isAdvanceTaxApplicable(-5000)).toBe(false)
    })
  })

  describe('calculateQuarterlySchedule', () => {
    const financialYear = '2024-25'
    const netTaxLiability = 100000

    it('should return 4 quarterly schedules', () => {
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear)
      expect(schedules).toHaveLength(4)
    })

    it('should calculate correct cumulative amounts due', () => {
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear)

      expect(schedules[0].cumulativeAmountDue).toBe(15000) // 15% of 100000
      expect(schedules[1].cumulativeAmountDue).toBe(45000) // 45% of 100000
      expect(schedules[2].cumulativeAmountDue).toBe(75000) // 75% of 100000
      expect(schedules[3].cumulativeAmountDue).toBe(100000) // 100% of 100000
    })

    it('should calculate correct quarter amounts due', () => {
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear)

      expect(schedules[0].quarterAmountDue).toBe(15000) // Q1: 15%
      expect(schedules[1].quarterAmountDue).toBe(30000) // Q2: 45% - 15% = 30%
      expect(schedules[2].quarterAmountDue).toBe(30000) // Q3: 75% - 45% = 30%
      expect(schedules[3].quarterAmountDue).toBe(25000) // Q4: 100% - 75% = 25%
    })

    it('should show full shortfall when no payments made', () => {
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear)

      schedules.forEach(schedule => {
        expect(schedule.amountPaid).toBe(0)
        expect(schedule.shortfall).toBe(schedule.cumulativeAmountDue)
      })
    })

    it('should correctly apply payments to quarters', () => {
      const payments = [
        { quarter: 1, amount: 15000, paymentDate: new Date(2024, 5, 10) },
      ]
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear, payments)

      expect(schedules[0].amountPaid).toBe(15000)
      expect(schedules[0].shortfall).toBe(0)
    })

    it('should calculate cumulative shortfall correctly', () => {
      const payments = [
        { quarter: 1, amount: 10000, paymentDate: new Date(2024, 5, 10) },
      ]
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear, payments)

      // Q1 shortfall: 15000 due - 10000 paid = 5000
      expect(schedules[0].shortfall).toBe(5000)
      // Q2 shortfall: 45000 due - 10000 total paid = 35000
      expect(schedules[1].shortfall).toBe(35000)
    })

    it('should aggregate multiple payments in same quarter', () => {
      const payments = [
        { quarter: 1, amount: 5000, paymentDate: new Date(2024, 5, 1) },
        { quarter: 1, amount: 10000, paymentDate: new Date(2024, 5, 10) },
      ]
      const schedules = calculateQuarterlySchedule(netTaxLiability, financialYear, payments)

      expect(schedules[0].amountPaid).toBe(15000)
      expect(schedules[0].shortfall).toBe(0)
    })
  })

  describe('calculateInterest234B', () => {
    it('should not be applicable when 90% or more is paid', () => {
      const result = calculateInterest234B(100000, 90000)

      expect(result.isApplicable).toBe(false)
      expect(result.interest).toBe(0)
      expect(result.reason).toContain('90%')
    })

    it('should not be applicable when 100% is paid', () => {
      const result = calculateInterest234B(100000, 100000)

      expect(result.isApplicable).toBe(false)
      expect(result.interest).toBe(0)
    })

    it('should be applicable when less than 90% is paid', () => {
      const result = calculateInterest234B(100000, 80000)

      expect(result.isApplicable).toBe(true)
      expect(result.shortfall).toBe(20000) // 100000 - 80000
    })

    it('should calculate interest correctly', () => {
      const assessmentDate = new Date(2025, 4, 15) // May 15, 2025
      const result = calculateInterest234B(100000, 50000, assessmentDate)

      expect(result.isApplicable).toBe(true)
      expect(result.shortfall).toBe(50000)
      // Interest should be calculated from April 1 to assessment date
      expect(result.monthsOfDefault).toBeGreaterThan(0)
      expect(result.interest).toBeGreaterThan(0)
    })

    it('should return correct values when nothing is paid', () => {
      const assessmentDate = new Date(2025, 3, 1) // April 1, 2025
      const result = calculateInterest234B(100000, 0, assessmentDate)

      expect(result.isApplicable).toBe(true)
      expect(result.totalTaxLiability).toBe(100000)
      expect(result.totalAdvanceTaxPaid).toBe(0)
      expect(result.shortfall).toBe(100000)
    })
  })

  describe('calculateInterest234C', () => {
    it('should return zero interest when no shortfall', () => {
      const schedules = [
        { quarter: 1, shortfall: 0, interest234C: 0 },
        { quarter: 2, shortfall: 0, interest234C: 0 },
        { quarter: 3, shortfall: 0, interest234C: 0 },
        { quarter: 4, shortfall: 0, interest234C: 0 },
      ] as any[]

      const result = calculateInterest234C(schedules)

      expect(result.totalInterest).toBe(0)
      expect(result.quarterlyInterest.every(q => q.interest === 0)).toBe(true)
    })

    it('should calculate interest based on quarterly shortfalls', () => {
      // Simulate a schedule with shortfalls and pre-calculated interest
      const schedules = [
        { quarter: 1, shortfall: 10000, interest234C: 300 }, // 10000 * 0.01 * 3
        { quarter: 2, shortfall: 5000, interest234C: 150 },  // 5000 * 0.01 * 3
        { quarter: 3, shortfall: 0, interest234C: 0 },
        { quarter: 4, shortfall: 0, interest234C: 0 },
      ] as any[]

      const result = calculateInterest234C(schedules)

      expect(result.totalInterest).toBe(450) // 300 + 150
    })

    it('should return quarterly interest breakdown', () => {
      const schedules = [
        { quarter: 1, shortfall: 10000, interest234C: 300 },
        { quarter: 2, shortfall: 0, interest234C: 0 },
        { quarter: 3, shortfall: 0, interest234C: 0 },
        { quarter: 4, shortfall: 0, interest234C: 0 },
      ] as any[]

      const result = calculateInterest234C(schedules)

      expect(result.quarterlyInterest).toHaveLength(4)
      expect(result.quarterlyInterest[0].quarter).toBe(1)
      expect(result.quarterlyInterest[0].shortfall).toBe(10000)
      expect(result.quarterlyInterest[0].months).toBe(3) // Q1 deferment months
    })
  })

  describe('detectQuarterFromPaymentDate', () => {
    const financialYear = '2024-25'

    it('should detect Q1 for payment before June 15', () => {
      const paymentDate = new Date(2024, 5, 10) // June 10, 2024
      expect(detectQuarterFromPaymentDate(paymentDate, financialYear)).toBe(1)
    })

    it('should detect Q1 for payment on June 15', () => {
      const paymentDate = new Date(2024, 5, 15) // June 15, 2024
      expect(detectQuarterFromPaymentDate(paymentDate, financialYear)).toBe(1)
    })

    it('should detect Q2 for payment after June 15 but before Sep 15', () => {
      const paymentDate = new Date(2024, 7, 1) // August 1, 2024
      expect(detectQuarterFromPaymentDate(paymentDate, financialYear)).toBe(2)
    })

    it('should detect Q3 for payment after Sep 15 but before Dec 15', () => {
      const paymentDate = new Date(2024, 10, 1) // November 1, 2024
      expect(detectQuarterFromPaymentDate(paymentDate, financialYear)).toBe(3)
    })

    it('should detect Q4 for payment after Dec 15 but before Mar 15', () => {
      const paymentDate = new Date(2025, 1, 1) // February 1, 2025
      expect(detectQuarterFromPaymentDate(paymentDate, financialYear)).toBe(4)
    })

    it('should detect Q4 for payment after March 15', () => {
      const paymentDate = new Date(2025, 3, 1) // April 1, 2025
      expect(detectQuarterFromPaymentDate(paymentDate, financialYear)).toBe(4)
    })
  })

  describe('calculateAdvanceTaxAnalysis', () => {
    const financialYear = '2024-25'

    it('should return complete analysis structure', () => {
      const result = calculateAdvanceTaxAnalysis(100000, financialYear)

      expect(result).toHaveProperty('netTaxLiability')
      expect(result).toHaveProperty('advanceTaxRequired')
      expect(result).toHaveProperty('schedules')
      expect(result).toHaveProperty('interest234B')
      expect(result).toHaveProperty('interest234C')
      expect(result).toHaveProperty('totalInterest')
    })

    it('should correctly identify when advance tax is required', () => {
      const result = calculateAdvanceTaxAnalysis(100000, financialYear)
      expect(result.advanceTaxRequired).toBe(true)
    })

    it('should correctly identify when advance tax is not required', () => {
      const result = calculateAdvanceTaxAnalysis(5000, financialYear)
      expect(result.advanceTaxRequired).toBe(false)
    })

    it('should calculate schedules with payments', () => {
      const payments = [
        { quarter: 1, amount: 15000, paymentDate: new Date(2024, 5, 10) },
        { quarter: 2, amount: 30000, paymentDate: new Date(2024, 8, 10) },
      ]
      const result = calculateAdvanceTaxAnalysis(100000, financialYear, payments)

      expect(result.schedules[0].amountPaid).toBe(15000)
      expect(result.schedules[1].amountPaid).toBe(30000)
    })

    it('should calculate total interest from 234B and 234C', () => {
      const result = calculateAdvanceTaxAnalysis(100000, financialYear, [], new Date(2025, 4, 1))

      const expectedTotal = result.interest234B.interest + result.interest234C.totalInterest
      expect(result.totalInterest).toBe(expectedTotal)
    })
  })

  describe('formatINR', () => {
    it('should format positive numbers with INR symbol', () => {
      const formatted = formatINR(100000)
      expect(formatted).toContain('₹')
      expect(formatted).toContain('1,00,000')
    })

    it('should format zero', () => {
      const formatted = formatINR(0)
      expect(formatted).toContain('₹')
      expect(formatted).toContain('0')
    })

    it('should format negative numbers', () => {
      const formatted = formatINR(-50000)
      expect(formatted).toContain('₹')
      expect(formatted).toContain('50,000')
    })

    it('should format large numbers with Indian grouping', () => {
      const formatted = formatINR(10000000) // 1 crore
      expect(formatted).toContain('₹')
      // Indian format: 1,00,00,000
      expect(formatted).toMatch(/1,00,00,000/)
    })

    it('should round to whole numbers', () => {
      const formatted = formatINR(12345.67)
      expect(formatted).toContain('12,346') // Rounded
    })
  })
})
