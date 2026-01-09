import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Tax calculation constants (FY 2025-26)
const TAX_CONFIG = {
  NEW_REGIME: {
    slabs: [
      { min: 0, max: 400000, rate: 0 },
      { min: 400000, max: 800000, rate: 5 },
      { min: 800000, max: 1200000, rate: 10 },
      { min: 1200000, max: 1600000, rate: 15 },
      { min: 1600000, max: 2000000, rate: 20 },
      { min: 2000000, max: 2400000, rate: 25 },
      { min: 2400000, max: Infinity, rate: 30 },
    ],
    standardDeduction: 75000,
    rebateLimit: 1200000, // Full rebate if income <= 12L
  },
  OLD_REGIME: {
    slabs: [
      { min: 0, max: 250000, rate: 0 },
      { min: 250000, max: 500000, rate: 5 },
      { min: 500000, max: 1000000, rate: 20 },
      { min: 1000000, max: Infinity, rate: 30 },
    ],
    standardDeduction: 50000,
    rebateLimit: 500000, // 87A rebate limit
  },
  DEDUCTION_LIMITS: {
    section80C: 150000,
    section80D: 25000, // Self & family
    section80D_Parents: 50000, // Senior citizen parents
    section80CCD1B: 50000, // NPS additional
    section80TTA: 10000, // Savings interest
    section24: 200000, // Home loan interest
  },
  CESS_RATE: 0.04, // 4% health & education cess
  SURCHARGE_SLABS: [
    { min: 0, max: 5000000, rate: 0 },
    { min: 5000000, max: 10000000, rate: 10 },
    { min: 10000000, max: 20000000, rate: 15 },
    { min: 20000000, max: 50000000, rate: 25 },
    { min: 50000000, max: Infinity, rate: 37 },
  ],
}

// Smart suggestion categories
const SUGGESTION_CATEGORIES = {
  MAX_80C: {
    name: 'Maximize 80C',
    description: 'Utilize full ₹1.5L limit under Section 80C',
    optimizationCategory: 'MAX_80C',
  },
  MAX_NPS: {
    name: 'Add NPS',
    description: 'Add ₹50K NPS under 80CCD(1B)',
    optimizationCategory: 'MAX_NPS',
  },
  MAX_80D: {
    name: 'Health Insurance',
    description: 'Add health insurance under 80D',
    optimizationCategory: 'MAX_80D',
  },
  REGIME_SWITCH: {
    name: 'Switch Regime',
    description: 'Compare with opposite tax regime',
    optimizationCategory: 'REGIME_SWITCH',
  },
  COMBINED_OPTIMAL: {
    name: 'Optimal Strategy',
    description: 'Best combination of all deductions',
    optimizationCategory: 'COMBINED_OPTIMAL',
  },
}

// Validation schemas
const scenarioInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY'),
  selectedRegime: z.enum(['OLD', 'NEW']),
  incomeAdjustments: z.object({
    salary: z.number().default(0),
    business: z.number().default(0),
    rental: z.number().default(0),
    capitalGains: z.number().default(0),
    interest: z.number().default(0),
    dividend: z.number().default(0),
    other: z.number().default(0),
  }).optional(),
  deductionAdjustments: z.object({
    section80C: z.number().default(0),
    section80D: z.number().default(0),
    section80CCD1B: z.number().default(0),
    section24: z.number().default(0),
    section80TTA: z.number().default(0),
    other: z.number().default(0),
  }).optional(),
})

const compareSchema = z.object({
  scenarioIds: z.array(z.string()).min(1).max(3),
})

// Calculate tax for a given taxable income and regime
function calculateTax(taxableIncome: number, regime: 'OLD' | 'NEW'): number {
  const config = regime === 'NEW' ? TAX_CONFIG.NEW_REGIME : TAX_CONFIG.OLD_REGIME
  let tax = 0

  // Check rebate eligibility
  if (taxableIncome <= config.rebateLimit) {
    return 0
  }

  // Calculate slab-wise tax
  for (const slab of config.slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min
      tax += (taxableInSlab * slab.rate) / 100
    }
  }

  // Add surcharge
  const surchargeRate = TAX_CONFIG.SURCHARGE_SLABS.find(
    (s) => taxableIncome > s.min && taxableIncome <= s.max
  )?.rate || 0
  const surcharge = (tax * surchargeRate) / 100

  // Add cess
  const totalTaxWithSurcharge = tax + surcharge
  const cess = totalTaxWithSurcharge * TAX_CONFIG.CESS_RATE

  return Math.round(totalTaxWithSurcharge + cess)
}

// Calculate scenario values
function calculateScenarioValues(
  incomeAdjustments: Record<string, number>,
  deductionAdjustments: Record<string, number>,
  regime: 'OLD' | 'NEW'
): {
  totalGrossIncome: number
  totalDeductions: number
  taxableIncome: number
  totalTaxLiability: number
} {
  const config = regime === 'NEW' ? TAX_CONFIG.NEW_REGIME : TAX_CONFIG.OLD_REGIME

  // Calculate gross income
  const totalGrossIncome = Object.values(incomeAdjustments).reduce((sum, val) => sum + (val || 0), 0)

  // Calculate deductions (only for old regime, new regime has limited deductions)
  let totalDeductions = config.standardDeduction

  if (regime === 'OLD') {
    // Apply deduction limits
    totalDeductions += Math.min(deductionAdjustments.section80C || 0, TAX_CONFIG.DEDUCTION_LIMITS.section80C)
    totalDeductions += Math.min(deductionAdjustments.section80D || 0, TAX_CONFIG.DEDUCTION_LIMITS.section80D)
    totalDeductions += Math.min(deductionAdjustments.section80CCD1B || 0, TAX_CONFIG.DEDUCTION_LIMITS.section80CCD1B)
    totalDeductions += Math.min(deductionAdjustments.section24 || 0, TAX_CONFIG.DEDUCTION_LIMITS.section24)
    totalDeductions += Math.min(deductionAdjustments.section80TTA || 0, TAX_CONFIG.DEDUCTION_LIMITS.section80TTA)
    totalDeductions += deductionAdjustments.other || 0
  }

  const taxableIncome = Math.max(0, totalGrossIncome - totalDeductions)
  const totalTaxLiability = calculateTax(taxableIncome, regime)

  return {
    totalGrossIncome,
    totalDeductions,
    taxableIncome,
    totalTaxLiability,
  }
}

// GET /api/tax-planning/scenarios - List scenarios for user
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  try {
    const whereClause: { userId: string; financialYear?: string } = { userId }
    if (financialYear) {
      whereClause.financialYear = financialYear
    }

    const scenarios = await prisma.taxWhatIfScenario.findMany({
      where: whereClause,
      orderBy: [
        { isBaseline: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10, // Limit to 10 scenarios per FY
    })

    return c.json(scenarios)
  } catch (error) {
    console.error('Error fetching scenarios:', error)
    return c.json({ success: false, error: 'Failed to fetch scenarios' }, 500)
  }
})

// POST /api/tax-planning/scenarios - Create scenario
app.post('/', zValidator('json', scenarioInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Check scenario count for this FY
    const count = await prisma.taxWhatIfScenario.count({
      where: {
        userId,
        financialYear: data.financialYear,
      },
    })

    if (count >= 10) {
      return c.json(
        { success: false, error: 'Maximum 10 scenarios allowed per financial year' },
        400
      )
    }

    // Get baseline for comparison
    const baseline = await prisma.taxWhatIfScenario.findFirst({
      where: {
        userId,
        financialYear: data.financialYear,
        isBaseline: true,
      },
    })

    const incomeAdjustments = data.incomeAdjustments || {}
    const deductionAdjustments = data.deductionAdjustments || {}

    // Calculate values
    const calculated = calculateScenarioValues(
      incomeAdjustments,
      deductionAdjustments,
      data.selectedRegime
    )

    // Calculate difference from baseline
    const taxDifferenceFromBaseline = baseline
      ? calculated.totalTaxLiability - baseline.totalTaxLiability
      : 0
    const percentageSavings = baseline && baseline.totalTaxLiability > 0
      ? ((baseline.totalTaxLiability - calculated.totalTaxLiability) / baseline.totalTaxLiability) * 100
      : 0

    const scenario = await prisma.taxWhatIfScenario.create({
      data: {
        userId,
        financialYear: data.financialYear,
        name: data.name,
        description: data.description || null,
        selectedRegime: data.selectedRegime,
        incomeAdjustments,
        deductionAdjustments,
        ...calculated,
        taxDifferenceFromBaseline,
        percentageSavings,
      },
    })

    return c.json(scenario, 201)
  } catch (error) {
    console.error('Error creating scenario:', error)
    if ((error as any).code === 'P2002') {
      return c.json({ success: false, error: 'Scenario with this name already exists' }, 400)
    }
    return c.json({ success: false, error: 'Failed to create scenario' }, 500)
  }
})

// GET /api/tax-planning/scenarios/:id - Get single scenario
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const scenario = await prisma.taxWhatIfScenario.findFirst({
      where: { id, userId },
    })

    if (!scenario) {
      return c.json({ success: false, error: 'Scenario not found' }, 404)
    }

    return c.json(scenario)
  } catch (error) {
    console.error('Error fetching scenario:', error)
    return c.json({ success: false, error: 'Failed to fetch scenario' }, 500)
  }
})

// PUT /api/tax-planning/scenarios/:id - Update scenario
app.put('/:id', zValidator('json', scenarioInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.taxWhatIfScenario.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Scenario not found' }, 404)
    }

    // Recalculate if income/deductions changed
    let calculated = {}
    if (data.incomeAdjustments || data.deductionAdjustments || data.selectedRegime) {
      const incomeAdjustments = data.incomeAdjustments || (existing.incomeAdjustments as Record<string, number>)
      const deductionAdjustments = data.deductionAdjustments || (existing.deductionAdjustments as Record<string, number>)
      const regime = data.selectedRegime || existing.selectedRegime

      calculated = calculateScenarioValues(
        incomeAdjustments,
        deductionAdjustments,
        regime as 'OLD' | 'NEW'
      )
    }

    const scenario = await prisma.taxWhatIfScenario.update({
      where: { id },
      data: {
        ...data,
        ...calculated,
        lastCalculatedAt: new Date(),
      },
    })

    return c.json(scenario)
  } catch (error) {
    console.error('Error updating scenario:', error)
    return c.json({ success: false, error: 'Failed to update scenario' }, 500)
  }
})

// DELETE /api/tax-planning/scenarios/:id - Delete scenario (not baseline)
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.taxWhatIfScenario.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Scenario not found' }, 404)
    }

    if (existing.isBaseline) {
      return c.json({ success: false, error: 'Cannot delete baseline scenario' }, 400)
    }

    await prisma.taxWhatIfScenario.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Scenario deleted' })
  } catch (error) {
    console.error('Error deleting scenario:', error)
    return c.json({ success: false, error: 'Failed to delete scenario' }, 500)
  }
})

// POST /api/tax-planning/scenarios/baseline - Create/update baseline from current data
app.post('/baseline', async (c) => {
  const userId = c.get('userId')

  try {
    const body = await c.req.json()
    const financialYear = body.financialYear

    if (!financialYear || !/^\d{4}-\d{2}$/.test(financialYear)) {
      return c.json({ success: false, error: 'Valid financial year required' }, 400)
    }

    // Get current income data from various sources
    // This would aggregate from salary, business income, etc.
    // For now, we'll use provided data or defaults

    const incomeAdjustments = body.incomeAdjustments || {
      salary: 0,
      business: 0,
      rental: 0,
      capitalGains: 0,
      interest: 0,
      dividend: 0,
      other: 0,
    }

    const deductionAdjustments = body.deductionAdjustments || {
      section80C: 0,
      section80D: 0,
      section80CCD1B: 0,
      section24: 0,
      section80TTA: 0,
      other: 0,
    }

    const regime = body.selectedRegime || 'NEW'
    const calculated = calculateScenarioValues(incomeAdjustments, deductionAdjustments, regime)

    // Upsert baseline
    const baseline = await prisma.taxWhatIfScenario.upsert({
      where: {
        userId_financialYear_name: {
          userId,
          financialYear,
          name: 'Baseline (Current)',
        },
      },
      create: {
        userId,
        financialYear,
        name: 'Baseline (Current)',
        description: 'Your current tax situation based on actual income and deductions',
        isBaseline: true,
        selectedRegime: regime,
        incomeAdjustments,
        deductionAdjustments,
        ...calculated,
      },
      update: {
        selectedRegime: regime,
        incomeAdjustments,
        deductionAdjustments,
        ...calculated,
        lastCalculatedAt: new Date(),
      },
    })

    // Update all other scenarios' differences from baseline
    const otherScenarios = await prisma.taxWhatIfScenario.findMany({
      where: {
        userId,
        financialYear,
        isBaseline: false,
      },
    })

    for (const scenario of otherScenarios) {
      const taxDifference = scenario.totalTaxLiability - baseline.totalTaxLiability
      const percentSavings = baseline.totalTaxLiability > 0
        ? ((baseline.totalTaxLiability - scenario.totalTaxLiability) / baseline.totalTaxLiability) * 100
        : 0

      await prisma.taxWhatIfScenario.update({
        where: { id: scenario.id },
        data: {
          taxDifferenceFromBaseline: taxDifference,
          percentageSavings: percentSavings,
        },
      })
    }

    return c.json(baseline, 201)
  } catch (error) {
    console.error('Error creating baseline:', error)
    return c.json({ success: false, error: 'Failed to create baseline' }, 500)
  }
})

// POST /api/tax-planning/scenarios/compare - Compare up to 3 scenarios
app.post('/compare', zValidator('json', compareSchema), async (c) => {
  const userId = c.get('userId')
  const { scenarioIds } = c.req.valid('json')

  try {
    const scenarios = await prisma.taxWhatIfScenario.findMany({
      where: {
        id: { in: scenarioIds },
        userId,
      },
    })

    if (scenarios.length === 0) {
      return c.json({ success: false, error: 'No scenarios found' }, 404)
    }

    // Find best scenario (lowest tax)
    const sorted = [...scenarios].sort((a, b) => a.totalTaxLiability - b.totalTaxLiability)
    const best = sorted[0]

    // Calculate comparison data
    const comparison = scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      isBaseline: s.isBaseline,
      selectedRegime: s.selectedRegime,
      totalGrossIncome: s.totalGrossIncome,
      totalDeductions: s.totalDeductions,
      taxableIncome: s.taxableIncome,
      totalTaxLiability: s.totalTaxLiability,
      taxDifferenceFromBaseline: s.taxDifferenceFromBaseline,
      percentageSavings: s.percentageSavings,
      isBest: s.id === best.id,
      savingsVsBest: s.totalTaxLiability - best.totalTaxLiability,
    }))

    return c.json({
      scenarios: comparison,
      bestScenario: {
        id: best.id,
        name: best.name,
        totalTaxLiability: best.totalTaxLiability,
      },
      maxSavings: sorted[sorted.length - 1].totalTaxLiability - best.totalTaxLiability,
    })
  } catch (error) {
    console.error('Error comparing scenarios:', error)
    return c.json({ success: false, error: 'Failed to compare scenarios' }, 500)
  }
})

// GET /api/tax-planning/scenarios/smart-suggestions - Generate auto suggestions
app.get('/smart-suggestions', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  if (!financialYear) {
    return c.json({ success: false, error: 'Financial year required' }, 400)
  }

  try {
    // Get baseline
    const baseline = await prisma.taxWhatIfScenario.findFirst({
      where: {
        userId,
        financialYear,
        isBaseline: true,
      },
    })

    if (!baseline) {
      return c.json({
        success: false,
        error: 'Create a baseline scenario first',
        suggestions: [],
      }, 400)
    }

    const baselineIncome = baseline.incomeAdjustments as Record<string, number>
    const baselineDeductions = baseline.deductionAdjustments as Record<string, number>
    const suggestions = []

    // 1. MAX_80C suggestion
    const current80C = baselineDeductions.section80C || 0
    if (current80C < TAX_CONFIG.DEDUCTION_LIMITS.section80C) {
      const max80CDeductions = {
        ...baselineDeductions,
        section80C: TAX_CONFIG.DEDUCTION_LIMITS.section80C,
      }
      const max80CCalc = calculateScenarioValues(baselineIncome, max80CDeductions, 'OLD')
      const savings = baseline.totalTaxLiability - max80CCalc.totalTaxLiability

      if (savings > 0) {
        suggestions.push({
          ...SUGGESTION_CATEGORIES.MAX_80C,
          potentialSavings: savings,
          currentValue: current80C,
          suggestedValue: TAX_CONFIG.DEDUCTION_LIMITS.section80C,
          incomeAdjustments: baselineIncome,
          deductionAdjustments: max80CDeductions,
          selectedRegime: 'OLD',
          calculatedTax: max80CCalc.totalTaxLiability,
        })
      }
    }

    // 2. MAX_NPS suggestion
    const currentNPS = baselineDeductions.section80CCD1B || 0
    if (currentNPS < TAX_CONFIG.DEDUCTION_LIMITS.section80CCD1B) {
      const maxNPSDeductions = {
        ...baselineDeductions,
        section80CCD1B: TAX_CONFIG.DEDUCTION_LIMITS.section80CCD1B,
      }
      const maxNPSCalc = calculateScenarioValues(baselineIncome, maxNPSDeductions, 'OLD')
      const savings = baseline.totalTaxLiability - maxNPSCalc.totalTaxLiability

      if (savings > 0) {
        suggestions.push({
          ...SUGGESTION_CATEGORIES.MAX_NPS,
          potentialSavings: savings,
          currentValue: currentNPS,
          suggestedValue: TAX_CONFIG.DEDUCTION_LIMITS.section80CCD1B,
          incomeAdjustments: baselineIncome,
          deductionAdjustments: maxNPSDeductions,
          selectedRegime: 'OLD',
          calculatedTax: maxNPSCalc.totalTaxLiability,
        })
      }
    }

    // 3. MAX_80D suggestion
    const current80D = baselineDeductions.section80D || 0
    if (current80D < TAX_CONFIG.DEDUCTION_LIMITS.section80D) {
      const max80DDeductions = {
        ...baselineDeductions,
        section80D: TAX_CONFIG.DEDUCTION_LIMITS.section80D,
      }
      const max80DCalc = calculateScenarioValues(baselineIncome, max80DDeductions, 'OLD')
      const savings = baseline.totalTaxLiability - max80DCalc.totalTaxLiability

      if (savings > 0) {
        suggestions.push({
          ...SUGGESTION_CATEGORIES.MAX_80D,
          potentialSavings: savings,
          currentValue: current80D,
          suggestedValue: TAX_CONFIG.DEDUCTION_LIMITS.section80D,
          incomeAdjustments: baselineIncome,
          deductionAdjustments: max80DDeductions,
          selectedRegime: 'OLD',
          calculatedTax: max80DCalc.totalTaxLiability,
        })
      }
    }

    // 4. REGIME_SWITCH suggestion
    const oppositeRegime = baseline.selectedRegime === 'NEW' ? 'OLD' : 'NEW'
    const regimeSwitchCalc = calculateScenarioValues(
      baselineIncome,
      baselineDeductions,
      oppositeRegime as 'OLD' | 'NEW'
    )
    const regimeSavings = baseline.totalTaxLiability - regimeSwitchCalc.totalTaxLiability

    if (regimeSavings > 0) {
      suggestions.push({
        ...SUGGESTION_CATEGORIES.REGIME_SWITCH,
        potentialSavings: regimeSavings,
        currentRegime: baseline.selectedRegime,
        suggestedRegime: oppositeRegime,
        incomeAdjustments: baselineIncome,
        deductionAdjustments: baselineDeductions,
        selectedRegime: oppositeRegime,
        calculatedTax: regimeSwitchCalc.totalTaxLiability,
      })
    }

    // 5. COMBINED_OPTIMAL suggestion
    const optimalDeductions = {
      section80C: TAX_CONFIG.DEDUCTION_LIMITS.section80C,
      section80D: TAX_CONFIG.DEDUCTION_LIMITS.section80D,
      section80CCD1B: TAX_CONFIG.DEDUCTION_LIMITS.section80CCD1B,
      section24: baselineDeductions.section24 || 0,
      section80TTA: TAX_CONFIG.DEDUCTION_LIMITS.section80TTA,
      other: baselineDeductions.other || 0,
    }

    // Calculate for both regimes and pick better
    const optimalOld = calculateScenarioValues(baselineIncome, optimalDeductions, 'OLD')
    const optimalNew = calculateScenarioValues(baselineIncome, optimalDeductions, 'NEW')
    const bestOptimal = optimalOld.totalTaxLiability < optimalNew.totalTaxLiability
      ? { ...optimalOld, regime: 'OLD' }
      : { ...optimalNew, regime: 'NEW' }

    const combinedSavings = baseline.totalTaxLiability - bestOptimal.totalTaxLiability

    if (combinedSavings > 0) {
      suggestions.push({
        ...SUGGESTION_CATEGORIES.COMBINED_OPTIMAL,
        potentialSavings: combinedSavings,
        incomeAdjustments: baselineIncome,
        deductionAdjustments: optimalDeductions,
        selectedRegime: bestOptimal.regime,
        calculatedTax: bestOptimal.totalTaxLiability,
        breakdown: {
          section80C: TAX_CONFIG.DEDUCTION_LIMITS.section80C,
          section80D: TAX_CONFIG.DEDUCTION_LIMITS.section80D,
          section80CCD1B: TAX_CONFIG.DEDUCTION_LIMITS.section80CCD1B,
        },
      })
    }

    // Sort by potential savings (highest first)
    suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings)

    return c.json({
      baseline: {
        id: baseline.id,
        name: baseline.name,
        totalTaxLiability: baseline.totalTaxLiability,
        selectedRegime: baseline.selectedRegime,
      },
      suggestions,
      deductionLimits: TAX_CONFIG.DEDUCTION_LIMITS,
    })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return c.json({ success: false, error: 'Failed to generate suggestions' }, 500)
  }
})

export default app
