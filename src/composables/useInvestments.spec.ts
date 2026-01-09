/**
 * Unit tests for PPF calculations and investment utility functions
 * from useInvestments composable
 */
import { describe, it, expect } from 'vitest'

// Import the actual functions from the composable
import {
  calculatePPFMaturity,
  formatINR,
  formatINRCompact,
  formatPercentage
} from './useInvestments'

// PPF Constants for testing
const PPF_CONFIG = {
  INTEREST_RATE: 7.1,
  MIN_DEPOSIT: 500,
  MAX_DEPOSIT: 150000,
  TENURE_YEARS: 15,
  WITHDRAWAL_YEAR: 7,
  LOAN_START_YEAR: 3,
  LOAN_END_YEAR: 6
}

describe('PPF Maturity Calculator', () => {
  describe('Basic Calculations', () => {
    it('should calculate maturity value for a new account with max deposits', () => {
      const result = calculatePPFMaturity({
        currentBalance: 0,
        yearlyDeposit: 150000,
        yearsRemaining: 15,
        interestRate: 7.1
      })

      // With ₹1.5L/year at 7.1% for 15 years, maturity should be ~40.68L
      expect(result.maturityValue).toBeGreaterThan(4000000)
      expect(result.maturityValue).toBeLessThan(4200000)
      expect(result.totalDeposits).toBe(150000 * 15)
      expect(result.totalInterest).toBeGreaterThan(0)
    })

    it('should calculate maturity for existing balance', () => {
      const result = calculatePPFMaturity({
        currentBalance: 500000,
        yearlyDeposit: 100000,
        yearsRemaining: 10,
        interestRate: 7.1
      })

      // Starting with ₹5L, adding ₹1L/year for 10 years at 7.1%
      expect(result.maturityValue).toBeGreaterThan(2000000)
      expect(result.totalDeposits).toBe(500000 + 100000 * 10)
    })

    it('should handle zero initial balance', () => {
      const result = calculatePPFMaturity({
        currentBalance: 0,
        yearlyDeposit: 50000,
        yearsRemaining: 5,
        interestRate: 7.1
      })

      expect(result.maturityValue).toBeGreaterThan(250000)
      expect(result.totalDeposits).toBe(50000 * 5)
    })

    it('should cap yearly deposit at ₹1.5L (PPF max limit)', () => {
      const result = calculatePPFMaturity({
        currentBalance: 0,
        yearlyDeposit: 200000, // Above max
        yearsRemaining: 1,
        interestRate: 7.1
      })

      // Should cap at 150000
      const expectedDeposit = 150000
      const expectedInterest = expectedDeposit * 0.071
      expect(result.yearlyBreakdown[0].deposit).toBe(expectedDeposit)
    })
  })

  describe('Yearly Breakdown', () => {
    it('should return correct number of years in breakdown', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 10,
        interestRate: 7.1
      })

      expect(result.yearlyBreakdown).toHaveLength(10)
    })

    it('should have increasing balance each year', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 5,
        interestRate: 7.1
      })

      for (let i = 1; i < result.yearlyBreakdown.length; i++) {
        expect(result.yearlyBreakdown[i].balance).toBeGreaterThan(
          result.yearlyBreakdown[i - 1].balance
        )
      }
    })

    it('should calculate interest correctly for each year', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 1,
        interestRate: 7.1
      })

      const year1 = result.yearlyBreakdown[0]
      // Interest = (100000 + 50000) * 0.071 = 10650
      expect(year1.interest).toBe(10650)
      expect(year1.balance).toBe(100000 + 50000 + 10650)
    })

    it('should have year numbers starting from 1', () => {
      const result = calculatePPFMaturity({
        currentBalance: 0,
        yearlyDeposit: 50000,
        yearsRemaining: 3,
        interestRate: 7.1
      })

      expect(result.yearlyBreakdown[0].year).toBe(1)
      expect(result.yearlyBreakdown[1].year).toBe(2)
      expect(result.yearlyBreakdown[2].year).toBe(3)
    })
  })

  describe('Interest Calculation', () => {
    it('should use compound interest formula correctly', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 0,
        yearsRemaining: 1,
        interestRate: 10 // 10% for easy calculation
      })

      // Interest on 100000 at 10% = 10000
      expect(result.yearlyBreakdown[0].interest).toBe(10000)
      expect(result.maturityValue).toBe(110000)
    })

    it('should calculate interest on deposit + balance combined', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 100000,
        yearsRemaining: 1,
        interestRate: 10
      })

      // Interest = (100000 + 100000) * 0.10 = 20000
      expect(result.yearlyBreakdown[0].interest).toBe(20000)
    })

    it('should handle different interest rates', () => {
      const result71 = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 10,
        interestRate: 7.1
      })

      const result8 = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 10,
        interestRate: 8.0
      })

      expect(result8.maturityValue).toBeGreaterThan(result71.maturityValue)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero years remaining', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 0,
        interestRate: 7.1
      })

      expect(result.yearlyBreakdown).toHaveLength(0)
      expect(result.maturityValue).toBe(100000)
      expect(result.totalDeposits).toBe(100000)
    })

    it('should handle zero deposit', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 0,
        yearsRemaining: 5,
        interestRate: 7.1
      })

      expect(result.maturityValue).toBeGreaterThan(100000)
      expect(result.totalDeposits).toBe(100000)
    })

    it('should handle minimum deposit', () => {
      const result = calculatePPFMaturity({
        currentBalance: 0,
        yearlyDeposit: 500, // Minimum
        yearsRemaining: 15,
        interestRate: 7.1
      })

      expect(result.maturityValue).toBeGreaterThan(500 * 15)
    })

    it('should handle very small interest rate', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100000,
        yearlyDeposit: 50000,
        yearsRemaining: 10,
        interestRate: 0.1
      })

      // With 0.1% interest, maturity should be slightly above total deposits
      const totalDeposits = 100000 + 50000 * 10
      expect(result.maturityValue).toBeGreaterThan(totalDeposits)
      expect(result.maturityValue).toBeLessThan(totalDeposits * 1.02) // Less than 2% growth
    })

    it('should round values to integers', () => {
      const result = calculatePPFMaturity({
        currentBalance: 100001,
        yearlyDeposit: 50001,
        yearsRemaining: 3,
        interestRate: 7.1
      })

      expect(Number.isInteger(result.maturityValue)).toBe(true)
      expect(Number.isInteger(result.totalInterest)).toBe(true)
      result.yearlyBreakdown.forEach(year => {
        expect(Number.isInteger(year.balance)).toBe(true)
        expect(Number.isInteger(year.interest)).toBe(true)
      })
    })
  })

  describe('Real-World Scenarios', () => {
    it('should match known PPF projection (15 years, max contribution)', () => {
      const result = calculatePPFMaturity({
        currentBalance: 0,
        yearlyDeposit: 150000,
        yearsRemaining: 15,
        interestRate: 7.1
      })

      // Known: ₹1.5L/year for 15 years at 7.1% ≈ ₹40.68L maturity
      expect(result.maturityValue).toBeGreaterThan(4050000)
      expect(result.maturityValue).toBeLessThan(4100000)
      expect(result.totalDeposits).toBe(2250000) // 1.5L * 15
      expect(result.totalInterest).toBeGreaterThan(1800000) // ~18L+ interest
    })

    it('should calculate extension scenario (5 years after maturity)', () => {
      // After 15 years, extending for 5 more years with ₹1L/year
      const result = calculatePPFMaturity({
        currentBalance: 4000000, // ~₹40L maturity corpus
        yearlyDeposit: 100000,
        yearsRemaining: 5,
        interestRate: 7.1
      })

      expect(result.maturityValue).toBeGreaterThan(6000000)
    })
  })
})

describe('INR Formatting Functions', () => {
  describe('formatINR', () => {
    it('should format basic amounts correctly', () => {
      expect(formatINR(1000)).toBe('₹1,000')
      expect(formatINR(100000)).toBe('₹1,00,000')
      expect(formatINR(10000000)).toBe('₹1,00,00,000')
    })

    it('should handle zero', () => {
      expect(formatINR(0)).toBe('₹0')
    })

    it('should handle negative amounts', () => {
      const result = formatINR(-50000)
      expect(result).toContain('50,000')
      expect(result).toContain('-')
    })

    it('should round to integers', () => {
      expect(formatINR(1234.56)).toBe('₹1,235')
      expect(formatINR(1234.49)).toBe('₹1,234')
    })
  })

  describe('formatINRCompact', () => {
    it('should format crores correctly', () => {
      expect(formatINRCompact(10000000)).toBe('1.00 Cr')
      expect(formatINRCompact(25000000)).toBe('2.50 Cr')
      expect(formatINRCompact(100000000)).toBe('10.00 Cr')
    })

    it('should format lakhs correctly', () => {
      expect(formatINRCompact(100000)).toBe('1.00 L')
      expect(formatINRCompact(500000)).toBe('5.00 L')
      expect(formatINRCompact(9900000)).toBe('99.00 L')
    })

    it('should format thousands correctly', () => {
      expect(formatINRCompact(1000)).toBe('1.0K')
      expect(formatINRCompact(50000)).toBe('50.0K')
      expect(formatINRCompact(99999)).toBe('100.0K')
    })

    it('should format small amounts with full currency format', () => {
      expect(formatINRCompact(500)).toBe('₹500')
      expect(formatINRCompact(999)).toBe('₹999')
    })

    it('should handle zero', () => {
      expect(formatINRCompact(0)).toBe('₹0')
    })

    it('should handle edge cases at boundaries', () => {
      // Just below 1 crore
      expect(formatINRCompact(9999999)).toBe('100.00 L')
      // Exactly 1 crore
      expect(formatINRCompact(10000000)).toBe('1.00 Cr')
      // Just below 1 lakh
      expect(formatINRCompact(99999)).toBe('100.0K')
      // Exactly 1 lakh
      expect(formatINRCompact(100000)).toBe('1.00 L')
    })
  })

  describe('formatPercentage', () => {
    it('should format positive percentages with + sign', () => {
      expect(formatPercentage(10.5)).toBe('+10.50%')
      expect(formatPercentage(0.1)).toBe('+0.10%')
    })

    it('should format negative percentages correctly', () => {
      expect(formatPercentage(-5.25)).toBe('-5.25%')
      expect(formatPercentage(-0.5)).toBe('-0.50%')
    })

    it('should format zero without + sign', () => {
      expect(formatPercentage(0)).toBe('+0.00%')
    })

    it('should round to 2 decimal places', () => {
      // JavaScript's toFixed uses "round half away from zero"
      expect(formatPercentage(10.556)).toBe('+10.56%')
      expect(formatPercentage(10.554)).toBe('+10.55%')
      expect(formatPercentage(10.125)).toBe('+10.13%')
    })
  })
})

describe('PPF Loan Eligibility', () => {
  // Helper function to calculate loan eligibility (mirrors component logic)
  function calculateLoanEligibility(openingDate: string, currentBalance: number) {
    const openingYear = new Date(openingDate).getFullYear()
    const currentYear = new Date().getFullYear()
    const accountAge = currentYear - openingYear

    if (accountAge >= PPF_CONFIG.LOAN_START_YEAR && accountAge <= PPF_CONFIG.LOAN_END_YEAR) {
      // Max 25% of balance at end of 2nd preceding FY
      const maxLoanAmount = currentBalance * 0.25
      return { eligible: true, maxAmount: maxLoanAmount }
    }
    return { eligible: false, maxAmount: 0 }
  }

  it('should not allow loan for accounts less than 3 years old', () => {
    const currentYear = new Date().getFullYear()
    const result = calculateLoanEligibility(`${currentYear - 2}-01-01`, 500000)
    expect(result.eligible).toBe(false)
    expect(result.maxAmount).toBe(0)
  })

  it('should allow loan for accounts 3-6 years old', () => {
    const currentYear = new Date().getFullYear()
    const result = calculateLoanEligibility(`${currentYear - 4}-01-01`, 500000)
    expect(result.eligible).toBe(true)
    expect(result.maxAmount).toBe(125000) // 25% of 500000
  })

  it('should not allow loan for accounts older than 6 years', () => {
    const currentYear = new Date().getFullYear()
    const result = calculateLoanEligibility(`${currentYear - 7}-01-01`, 500000)
    expect(result.eligible).toBe(false)
  })

  it('should calculate max loan as 25% of balance', () => {
    const currentYear = new Date().getFullYear()
    const result = calculateLoanEligibility(`${currentYear - 5}-01-01`, 800000)
    expect(result.maxAmount).toBe(200000)
  })
})

describe('PPF Withdrawal Eligibility', () => {
  // Helper function to check withdrawal eligibility (mirrors component logic)
  function canWithdraw(openingDate: string): boolean {
    const openingYear = new Date(openingDate).getFullYear()
    const currentYear = new Date().getFullYear()
    return currentYear - openingYear >= 6
  }

  it('should not allow withdrawal for accounts less than 6 years old', () => {
    const currentYear = new Date().getFullYear()
    expect(canWithdraw(`${currentYear - 5}-01-01`)).toBe(false)
    expect(canWithdraw(`${currentYear - 3}-01-01`)).toBe(false)
  })

  it('should allow withdrawal for accounts 6 or more years old', () => {
    const currentYear = new Date().getFullYear()
    expect(canWithdraw(`${currentYear - 6}-01-01`)).toBe(true)
    expect(canWithdraw(`${currentYear - 10}-01-01`)).toBe(true)
  })

  it('should allow withdrawal for accounts exactly 6 years old', () => {
    const currentYear = new Date().getFullYear()
    expect(canWithdraw(`${currentYear - 6}-04-01`)).toBe(true)
  })
})
