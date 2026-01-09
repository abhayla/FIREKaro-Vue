import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'
import {
  calculateAdvanceTaxAnalysis,
  getAdvanceTaxDueDates,
  isAdvanceTaxApplicable,
  detectQuarterFromPaymentDate,
  ADVANCE_TAX_CONFIG,
} from '../lib/calculations/advance-tax'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Validation schemas
const estimateInputSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY'),
  selectedRegime: z.enum(['OLD', 'NEW']).default('NEW'),
  totalEstimatedIncome: z.number().min(0).default(0),
  incomeBreakdown: z.object({
    salary: z.number().default(0),
    business: z.number().default(0),
    rental: z.number().default(0),
    capitalGains: z.number().default(0),
    interest: z.number().default(0),
    dividend: z.number().default(0),
    other: z.number().default(0),
  }).optional(),
  estimatedDeductions: z.number().min(0).default(0),
  totalTDSDeducted: z.number().min(0).default(0),
  grossTaxLiability: z.number().min(0).default(0),
  netTaxLiability: z.number().min(0).default(0),
})

const paymentInputSchema = z.object({
  paymentDate: z.string().transform((val) => new Date(val)),
  amount: z.number().positive('Amount must be positive'),
  challanSerialNumber: z.string().min(1, 'Challan serial number is required'),
  bsrCode: z.string().min(1, 'BSR code is required'),
  bankName: z.string().optional().nullable(),
  quarter: z.number().min(1).max(4).optional(),
  notes: z.string().optional().nullable(),
})

// GET /api/advance-tax - List estimates for user (optionally filtered by FY)
app.get('/', async (c) => {
  const userId = c.get('userId')
  const financialYear = c.req.query('financialYear')

  try {
    const whereClause: { userId: string; financialYear?: string } = { userId }
    if (financialYear) {
      whereClause.financialYear = financialYear
    }

    const estimates = await prisma.advanceTaxEstimate.findMany({
      where: whereClause,
      include: {
        schedules: {
          orderBy: { quarter: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { financialYear: 'desc' },
    })

    return c.json(estimates)
  } catch (error) {
    console.error('Error fetching advance tax estimates:', error)
    return c.json({ success: false, error: 'Failed to fetch estimates' }, 500)
  }
})

// POST /api/advance-tax - Create estimate for a financial year
app.post('/', zValidator('json', estimateInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    // Check if estimate already exists for this FY
    const existing = await prisma.advanceTaxEstimate.findUnique({
      where: {
        userId_financialYear: {
          userId,
          financialYear: data.financialYear,
        },
      },
    })

    if (existing) {
      return c.json(
        { success: false, error: 'Estimate already exists for this financial year' },
        400
      )
    }

    // Create estimate with schedules
    const dueDates = getAdvanceTaxDueDates(data.financialYear)
    const advanceTaxRequired = isAdvanceTaxApplicable(data.netTaxLiability)

    const estimate = await prisma.advanceTaxEstimate.create({
      data: {
        userId,
        financialYear: data.financialYear,
        selectedRegime: data.selectedRegime,
        totalEstimatedIncome: data.totalEstimatedIncome,
        incomeBreakdown: data.incomeBreakdown || null,
        estimatedDeductions: data.estimatedDeductions,
        totalTDSDeducted: data.totalTDSDeducted,
        grossTaxLiability: data.grossTaxLiability,
        netTaxLiability: data.netTaxLiability,
        advanceTaxRequired,
        schedules: {
          create: dueDates.map((dd) => ({
            quarter: dd.quarter,
            dueDate: dd.dueDate,
            cumulativePercentage: dd.cumulativePercentage,
            cumulativeAmountDue: Math.round((data.netTaxLiability * dd.cumulativePercentage) / 100),
            quarterAmountDue: Math.round(
              (data.netTaxLiability * dd.cumulativePercentage) / 100 -
              (dd.quarter === 1 ? 0 : (data.netTaxLiability * dueDates[dd.quarter - 2].cumulativePercentage) / 100)
            ),
            status: 'PENDING',
          })),
        },
      },
      include: {
        schedules: {
          orderBy: { quarter: 'asc' },
        },
      },
    })

    return c.json(estimate, 201)
  } catch (error) {
    console.error('Error creating advance tax estimate:', error)
    return c.json({ success: false, error: 'Failed to create estimate' }, 500)
  }
})

// GET /api/advance-tax/:id - Get single estimate with schedules and payments
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const estimate = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
      include: {
        schedules: {
          orderBy: { quarter: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!estimate) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    return c.json(estimate)
  } catch (error) {
    console.error('Error fetching advance tax estimate:', error)
    return c.json({ success: false, error: 'Failed to fetch estimate' }, 500)
  }
})

// PUT /api/advance-tax/:id - Update estimate
app.put('/:id', zValidator('json', estimateInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    const advanceTaxRequired = data.netTaxLiability !== undefined
      ? isAdvanceTaxApplicable(data.netTaxLiability)
      : existing.advanceTaxRequired

    const estimate = await prisma.advanceTaxEstimate.update({
      where: { id },
      data: {
        ...data,
        advanceTaxRequired,
        lastCalculatedAt: new Date(),
      },
      include: {
        schedules: {
          orderBy: { quarter: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    return c.json(estimate)
  } catch (error) {
    console.error('Error updating advance tax estimate:', error)
    return c.json({ success: false, error: 'Failed to update estimate' }, 500)
  }
})

// DELETE /api/advance-tax/:id - Delete estimate
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    await prisma.advanceTaxEstimate.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Estimate deleted' })
  } catch (error) {
    console.error('Error deleting advance tax estimate:', error)
    return c.json({ success: false, error: 'Failed to delete estimate' }, 500)
  }
})

// POST /api/advance-tax/:id/calculate - Recalculate schedules and interest
app.post('/:id/calculate', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const estimate = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
      include: {
        payments: true,
        schedules: true,
      },
    })

    if (!estimate) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    // Calculate analysis
    const payments = estimate.payments.map((p) => ({
      quarter: p.quarter,
      amount: p.amount,
      paymentDate: p.paymentDate,
    }))

    const analysis = calculateAdvanceTaxAnalysis(
      estimate.netTaxLiability,
      estimate.financialYear,
      payments
    )

    // Update schedules with calculated values
    for (const schedule of analysis.schedules) {
      await prisma.advanceTaxSchedule.update({
        where: {
          estimateId_quarter: {
            estimateId: id,
            quarter: schedule.quarter,
          },
        },
        data: {
          cumulativeAmountDue: schedule.cumulativeAmountDue,
          quarterAmountDue: schedule.quarterAmountDue,
          amountPaid: schedule.amountPaid,
          shortfall: schedule.shortfall,
          status: schedule.status,
          interest234C: schedule.interest234C,
        },
      })
    }

    // Update estimate with interest calculations
    const updatedEstimate = await prisma.advanceTaxEstimate.update({
      where: { id },
      data: {
        interest234B: analysis.interest234B.interest,
        interest234C: analysis.interest234C.totalInterest,
        lastCalculatedAt: new Date(),
      },
      include: {
        schedules: {
          orderBy: { quarter: 'asc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    return c.json({
      estimate: updatedEstimate,
      analysis: {
        interest234B: analysis.interest234B,
        interest234C: analysis.interest234C,
        totalInterest: analysis.totalInterest,
      },
    })
  } catch (error) {
    console.error('Error calculating advance tax:', error)
    return c.json({ success: false, error: 'Failed to calculate' }, 500)
  }
})

// GET /api/advance-tax/:id/payments - List payments for estimate
app.get('/:id/payments', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const estimate = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
    })

    if (!estimate) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    const payments = await prisma.advanceTaxPayment.findMany({
      where: { estimateId: id },
      orderBy: { paymentDate: 'desc' },
    })

    return c.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return c.json({ success: false, error: 'Failed to fetch payments' }, 500)
  }
})

// POST /api/advance-tax/:id/payments - Add payment
app.post('/:id/payments', zValidator('json', paymentInputSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const estimate = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
    })

    if (!estimate) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    // Auto-detect quarter if not provided
    const quarter = data.quarter || detectQuarterFromPaymentDate(data.paymentDate, estimate.financialYear)

    // Find the schedule for this quarter
    const schedule = await prisma.advanceTaxSchedule.findUnique({
      where: {
        estimateId_quarter: {
          estimateId: id,
          quarter,
        },
      },
    })

    const payment = await prisma.advanceTaxPayment.create({
      data: {
        userId,
        estimateId: id,
        scheduleId: schedule?.id || null,
        paymentDate: data.paymentDate,
        amount: data.amount,
        challanSerialNumber: data.challanSerialNumber,
        bsrCode: data.bsrCode,
        bankName: data.bankName || null,
        quarter,
        financialYear: estimate.financialYear,
        notes: data.notes || null,
      },
    })

    // Trigger recalculation
    await recalculateEstimate(id)

    return c.json(payment, 201)
  } catch (error) {
    console.error('Error creating payment:', error)
    return c.json({ success: false, error: 'Failed to create payment' }, 500)
  }
})

// PUT /api/advance-tax/:id/payments/:paymentId - Update payment
app.put('/:id/payments/:paymentId', zValidator('json', paymentInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const paymentId = c.req.param('paymentId')
  const data = c.req.valid('json')

  try {
    const payment = await prisma.advanceTaxPayment.findFirst({
      where: { id: paymentId, estimateId: id, userId },
    })

    if (!payment) {
      return c.json({ success: false, error: 'Payment not found' }, 404)
    }

    const updatedPayment = await prisma.advanceTaxPayment.update({
      where: { id: paymentId },
      data: {
        ...data,
        paymentDate: data.paymentDate || undefined,
      },
    })

    // Trigger recalculation
    await recalculateEstimate(id)

    return c.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return c.json({ success: false, error: 'Failed to update payment' }, 500)
  }
})

// DELETE /api/advance-tax/:id/payments/:paymentId - Delete payment
app.delete('/:id/payments/:paymentId', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const paymentId = c.req.param('paymentId')

  try {
    const payment = await prisma.advanceTaxPayment.findFirst({
      where: { id: paymentId, estimateId: id, userId },
    })

    if (!payment) {
      return c.json({ success: false, error: 'Payment not found' }, 404)
    }

    await prisma.advanceTaxPayment.delete({
      where: { id: paymentId },
    })

    // Trigger recalculation
    await recalculateEstimate(id)

    return c.json({ success: true, message: 'Payment deleted' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return c.json({ success: false, error: 'Failed to delete payment' }, 500)
  }
})

// GET /api/advance-tax/:id/interest - Get detailed interest calculation
app.get('/:id/interest', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const estimate = await prisma.advanceTaxEstimate.findFirst({
      where: { id, userId },
      include: {
        payments: true,
        schedules: {
          orderBy: { quarter: 'asc' },
        },
      },
    })

    if (!estimate) {
      return c.json({ success: false, error: 'Estimate not found' }, 404)
    }

    const payments = estimate.payments.map((p) => ({
      quarter: p.quarter,
      amount: p.amount,
      paymentDate: p.paymentDate,
    }))

    const analysis = calculateAdvanceTaxAnalysis(
      estimate.netTaxLiability,
      estimate.financialYear,
      payments
    )

    return c.json({
      interest234B: analysis.interest234B,
      interest234C: analysis.interest234C,
      totalInterest: analysis.totalInterest,
      config: {
        threshold: ADVANCE_TAX_CONFIG.THRESHOLD,
        interestRate: ADVANCE_TAX_CONFIG.INTEREST_RATE,
        threshold234B: ADVANCE_TAX_CONFIG.THRESHOLD_234B,
      },
    })
  } catch (error) {
    console.error('Error calculating interest:', error)
    return c.json({ success: false, error: 'Failed to calculate interest' }, 500)
  }
})

// Helper function to recalculate estimate after payment changes
async function recalculateEstimate(estimateId: string) {
  const estimate = await prisma.advanceTaxEstimate.findUnique({
    where: { id: estimateId },
    include: { payments: true, schedules: true },
  })

  if (!estimate) return

  const payments = estimate.payments.map((p) => ({
    quarter: p.quarter,
    amount: p.amount,
    paymentDate: p.paymentDate,
  }))

  const analysis = calculateAdvanceTaxAnalysis(
    estimate.netTaxLiability,
    estimate.financialYear,
    payments
  )

  // Update schedules
  for (const schedule of analysis.schedules) {
    await prisma.advanceTaxSchedule.update({
      where: {
        estimateId_quarter: {
          estimateId,
          quarter: schedule.quarter,
        },
      },
      data: {
        amountPaid: schedule.amountPaid,
        shortfall: schedule.shortfall,
        status: schedule.status,
        interest234C: schedule.interest234C,
      },
    })
  }

  // Update estimate
  await prisma.advanceTaxEstimate.update({
    where: { id: estimateId },
    data: {
      interest234B: analysis.interest234B.interest,
      interest234C: analysis.interest234C.totalInterest,
      lastCalculatedAt: new Date(),
    },
  })
}

export default app
