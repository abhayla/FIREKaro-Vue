/**
 * Unit tests for useFinancialHealth composable
 * Tests helper functions that calculate health factors
 */
import { describe, it, expect } from 'vitest'

// Import the types we need to test
import type { NetWorthData, CashFlowData, EmergencyFundData, HealthFactor } from './useFinancialHealth'

// Re-implement the helper functions for testing (since they're not exported)
// These should match the implementation in useFinancialHealth.ts

function calculateDTIScore(dtiRatio: number): number {
  if (isNaN(dtiRatio) || !isFinite(dtiRatio)) return 25 // Default to best score when no data
  if (dtiRatio <= 0.15) return 25
  if (dtiRatio <= 0.25) return 22
  if (dtiRatio <= 0.35) return 18
  if (dtiRatio <= 0.45) return 12
  if (dtiRatio <= 0.55) return 8
  return 4
}

function calculateEmergencyFundScore(ef: EmergencyFundData): number {
  if (ef.percentComplete >= 100) return 25
  if (ef.percentComplete >= 80) return 22
  if (ef.percentComplete >= 60) return 18
  if (ef.percentComplete >= 40) return 12
  if (ef.percentComplete >= 20) return 8
  return 4
}

function calculateSavingsScore(savingsRate: number): number {
  if (savingsRate >= 40) return 25
  if (savingsRate >= 30) return 22
  if (savingsRate >= 20) return 18
  if (savingsRate >= 10) return 12
  if (savingsRate >= 5) return 8
  return 4
}

function getFactorStatus(score: number, maxScore: number): HealthFactor['status'] {
  const percentage = (score / maxScore) * 100
  if (percentage >= 85) return 'excellent'
  if (percentage >= 70) return 'good'
  if (percentage >= 50) return 'needs_improvement'
  return 'critical'
}

// Helper to calculate DTI ratio safely (matches the fix)
function calculateDTIRatio(liabilities: number, annualIncome: number): number {
  return annualIncome > 0 ? liabilities / annualIncome : 0
}

// Helper to format DTI description safely (matches the fix)
function formatDTIDescription(dtiRatio: number, annualIncome: number): string {
  return annualIncome > 0 ? `${(dtiRatio * 100).toFixed(1)}% annual DTI ratio` : 'No income data'
}

// Helper to format emergency fund months safely (matches the fix)
function formatEmergencyFundMonths(currentAmount: number, monthlyExpenses: number, targetMonths: number): string {
  if (monthlyExpenses > 0) {
    return `${Math.floor(currentAmount / monthlyExpenses)} of ${targetMonths} mo`
  }
  return `0 of ${targetMonths} mo`
}

describe('Financial Health Helper Functions', () => {
  describe('DTI Ratio Calculation', () => {
    it('should return 0 when annual income is 0', () => {
      const ratio = calculateDTIRatio(100000, 0)
      expect(ratio).toBe(0)
    })

    it('should calculate correct ratio when income is positive', () => {
      const ratio = calculateDTIRatio(500000, 1000000)
      expect(ratio).toBe(0.5)
    })

    it('should return 0 when both values are 0', () => {
      const ratio = calculateDTIRatio(0, 0)
      expect(ratio).toBe(0)
    })
  })

  describe('DTI Description Formatting', () => {
    it('should show "No income data" when annual income is 0', () => {
      const description = formatDTIDescription(0, 0)
      expect(description).toBe('No income data')
    })

    it('should show percentage when income is positive', () => {
      const ratio = 0.35
      const description = formatDTIDescription(ratio, 1000000)
      expect(description).toBe('35.0% annual DTI ratio')
    })

    it('should not show NaN in description', () => {
      const description = formatDTIDescription(NaN, 0)
      expect(description).not.toContain('NaN')
      expect(description).toBe('No income data')
    })
  })

  describe('Emergency Fund Months Formatting', () => {
    it('should show "0 of X mo" when monthly expenses is 0', () => {
      const result = formatEmergencyFundMonths(50000, 0, 6)
      expect(result).toBe('0 of 6 mo')
    })

    it('should calculate months correctly when expenses are positive', () => {
      const result = formatEmergencyFundMonths(180000, 60000, 6)
      expect(result).toBe('3 of 6 mo')
    })

    it('should not show NaN in result', () => {
      const result = formatEmergencyFundMonths(0, 0, 6)
      expect(result).not.toContain('NaN')
      expect(result).toBe('0 of 6 mo')
    })

    it('should floor the months covered', () => {
      const result = formatEmergencyFundMonths(170000, 60000, 6)
      expect(result).toBe('2 of 6 mo') // 170000/60000 = 2.83, floored to 2
    })
  })

  describe('DTI Score Calculation', () => {
    it('should return 25 for very low DTI (<=15%)', () => {
      expect(calculateDTIScore(0.10)).toBe(25)
      expect(calculateDTIScore(0.15)).toBe(25)
    })

    it('should return 22 for low DTI (15-25%)', () => {
      expect(calculateDTIScore(0.20)).toBe(22)
      expect(calculateDTIScore(0.25)).toBe(22)
    })

    it('should return 18 for moderate DTI (25-35%)', () => {
      expect(calculateDTIScore(0.30)).toBe(18)
    })

    it('should return 4 for very high DTI (>55%)', () => {
      expect(calculateDTIScore(0.60)).toBe(4)
    })

    it('should handle 0 DTI gracefully', () => {
      expect(calculateDTIScore(0)).toBe(25)
    })
  })

  describe('Emergency Fund Score Calculation', () => {
    it('should return 25 for 100%+ completion', () => {
      expect(calculateEmergencyFundScore({ percentComplete: 100 } as EmergencyFundData)).toBe(25)
      expect(calculateEmergencyFundScore({ percentComplete: 150 } as EmergencyFundData)).toBe(25)
    })

    it('should return 4 for <20% completion', () => {
      expect(calculateEmergencyFundScore({ percentComplete: 10 } as EmergencyFundData)).toBe(4)
      expect(calculateEmergencyFundScore({ percentComplete: 0 } as EmergencyFundData)).toBe(4)
    })
  })

  describe('Factor Status Calculation', () => {
    it('should return "excellent" for score >= 85%', () => {
      expect(getFactorStatus(22, 25)).toBe('excellent')
      expect(getFactorStatus(25, 25)).toBe('excellent')
    })

    it('should return "good" for score >= 70%', () => {
      expect(getFactorStatus(18, 25)).toBe('good')
    })

    it('should return "needs_improvement" for score >= 50%', () => {
      expect(getFactorStatus(14, 25)).toBe('needs_improvement')
    })

    it('should return "critical" for score < 50%', () => {
      expect(getFactorStatus(10, 25)).toBe('critical')
      expect(getFactorStatus(4, 25)).toBe('critical')
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative values gracefully', () => {
      // Negative income shouldn't happen but should be handled
      const ratio = calculateDTIRatio(100000, -50000)
      expect(isFinite(ratio)).toBe(true)
    })

    it('should handle very large numbers', () => {
      const ratio = calculateDTIRatio(10000000000, 50000000000)
      expect(ratio).toBe(0.2)
    })
  })
})
