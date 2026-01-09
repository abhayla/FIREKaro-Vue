import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Loan type enum matching Prisma schema
const LoanTypeEnum = z.enum([
  'HOME_LOAN',
  'PERSONAL_LOAN',
  'CAR_LOAN',
  'EDUCATION_LOAN',
  'BUSINESS_LOAN',
  'GOLD_LOAN',
  'LOAN_AGAINST_PROPERTY',
  'LOAN_AGAINST_SECURITIES',
  'OTHER',
])

const LoanStatusEnum = z.enum(['ACTIVE', 'CLOSED', 'DEFAULTED', 'FORECLOSED'])

const PaymentFrequencyEnum = z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY'])

// Validation schema for loan input
const loanInputSchema = z.object({
  loanName: z.string().min(1, 'Loan name is required'),
  loanType: LoanTypeEnum,
  lender: z.string().min(1, 'Lender is required'),
  loanAccountNumber: z.string().optional().nullable(),
  principalAmount: z.number().positive('Principal must be positive'),
  outstandingAmount: z.number().min(0, 'Outstanding cannot be negative'),
  interestRate: z.number().min(0).max(100, 'Interest rate must be 0-100%'),
  emiAmount: z.number().positive('EMI must be positive'),
  tenure: z.number().int().positive('Tenure must be positive'),
  remainingTenure: z.number().int().min(0),
  loanStartDate: z.string().transform((val) => new Date(val)),
  emiStartDate: z.string().transform((val) => new Date(val)),
  maturityDate: z.string().transform((val) => new Date(val)),
  paymentFrequency: PaymentFrequencyEnum.optional().default('MONTHLY'),
  nextEmiDate: z.string().transform((val) => new Date(val)).optional().nullable(),
  lastPaymentDate: z.string().transform((val) => new Date(val)).optional().nullable(),
  status: LoanStatusEnum.optional().default('ACTIVE'),
  collateralValue: z.number().optional().nullable(),
  processingFee: z.number().optional().nullable(),
  prepaymentCharges: z.number().optional().nullable(),
  taxBenefitSection: z.string().optional().nullable(),
  maxTaxBenefit: z.number().optional().nullable(),
  purpose: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// Validation schema for loan payment
const loanPaymentSchema = z.object({
  paymentDate: z.string().transform((val) => new Date(val)),
  emiNumber: z.number().int().optional().nullable(),
  principalPaid: z.number().min(0),
  interestPaid: z.number().min(0),
  totalPaid: z.number().positive(),
  outstandingAfter: z.number().min(0),
  paymentMode: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  isLateFee: z.boolean().optional().default(false),
  lateFeeAmount: z.number().optional().default(0),
  notes: z.string().optional().nullable(),
})

// Validation schema for prepayment calculation
const prepaymentSchema = z.object({
  prepaymentAmount: z.number().positive(),
  reduceEmi: z.boolean().default(false), // true = reduce EMI, false = reduce tenure
})

// Loan type values for type checking
const LOAN_TYPES = [
  'HOME_LOAN',
  'PERSONAL_LOAN',
  'CAR_LOAN',
  'EDUCATION_LOAN',
  'BUSINESS_LOAN',
  'GOLD_LOAN',
  'LOAN_AGAINST_PROPERTY',
  'LOAN_AGAINST_SECURITIES',
  'OTHER',
] as const

type LoanTypeValue = (typeof LOAN_TYPES)[number]

// GET /api/loans - List all loans
app.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status')
  const loanType = c.req.query('loanType')

  try {
    const whereClause: {
      userId: string
      status?: 'ACTIVE' | 'CLOSED' | 'DEFAULTED' | 'FORECLOSED'
      loanType?: LoanTypeValue
    } = { userId }

    if (status && ['ACTIVE', 'CLOSED', 'DEFAULTED', 'FORECLOSED'].includes(status)) {
      whereClause.status = status as 'ACTIVE' | 'CLOSED' | 'DEFAULTED' | 'FORECLOSED'
    }

    if (loanType && LOAN_TYPES.includes(loanType as LoanTypeValue)) {
      whereClause.loanType = loanType as LoanTypeValue
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 1, // Get last payment
        },
      },
    })

    // Transform dates for frontend
    const transformedLoans = loans.map((loan) => ({
      ...loan,
      loanStartDate: loan.loanStartDate.toISOString().split('T')[0],
      emiStartDate: loan.emiStartDate.toISOString().split('T')[0],
      maturityDate: loan.maturityDate.toISOString().split('T')[0],
      nextEmiDate: loan.nextEmiDate?.toISOString().split('T')[0] ?? null,
      lastPaymentDate: loan.lastPaymentDate?.toISOString().split('T')[0] ?? null,
      lastPayment: loan.payments[0] || null,
    }))

    return c.json(transformedLoans)
  } catch (error) {
    console.error('Error fetching loans:', error)
    return c.json({ success: false, error: 'Failed to fetch loans' }, 500)
  }
})

// GET /api/loans/:id - Get single loan
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    })

    if (!loan) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    return c.json({
      ...loan,
      loanStartDate: loan.loanStartDate.toISOString().split('T')[0],
      emiStartDate: loan.emiStartDate.toISOString().split('T')[0],
      maturityDate: loan.maturityDate.toISOString().split('T')[0],
      nextEmiDate: loan.nextEmiDate?.toISOString().split('T')[0] ?? null,
      lastPaymentDate: loan.lastPaymentDate?.toISOString().split('T')[0] ?? null,
    })
  } catch (error) {
    console.error('Error fetching loan:', error)
    return c.json({ success: false, error: 'Failed to fetch loan' }, 500)
  }
})

// POST /api/loans - Create loan
app.post('/', zValidator('json', loanInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const loan = await prisma.loan.create({
      data: {
        userId,
        loanName: data.loanName,
        loanType: data.loanType,
        lender: data.lender,
        loanAccountNumber: data.loanAccountNumber || null,
        principalAmount: data.principalAmount,
        outstandingAmount: data.outstandingAmount,
        interestRate: data.interestRate,
        emiAmount: data.emiAmount,
        tenure: data.tenure,
        remainingTenure: data.remainingTenure,
        loanStartDate: data.loanStartDate,
        emiStartDate: data.emiStartDate,
        maturityDate: data.maturityDate,
        paymentFrequency: data.paymentFrequency || 'MONTHLY',
        nextEmiDate: data.nextEmiDate || null,
        lastPaymentDate: data.lastPaymentDate || null,
        status: data.status || 'ACTIVE',
        collateralValue: data.collateralValue || null,
        processingFee: data.processingFee || null,
        prepaymentCharges: data.prepaymentCharges || null,
        taxBenefitSection: data.taxBenefitSection || null,
        maxTaxBenefit: data.maxTaxBenefit || null,
        purpose: data.purpose || null,
        notes: data.notes || null,
      },
    })

    return c.json(
      {
        ...loan,
        loanStartDate: loan.loanStartDate.toISOString().split('T')[0],
        emiStartDate: loan.emiStartDate.toISOString().split('T')[0],
        maturityDate: loan.maturityDate.toISOString().split('T')[0],
        nextEmiDate: loan.nextEmiDate?.toISOString().split('T')[0] ?? null,
        lastPaymentDate: loan.lastPaymentDate?.toISOString().split('T')[0] ?? null,
      },
      201
    )
  } catch (error) {
    console.error('Error creating loan:', error)
    return c.json({ success: false, error: 'Failed to create loan' }, 500)
  }
})

// PUT /api/loans/:id - Update loan
app.put('/:id', zValidator('json', loanInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        ...(data.loanName !== undefined && { loanName: data.loanName }),
        ...(data.loanType !== undefined && { loanType: data.loanType }),
        ...(data.lender !== undefined && { lender: data.lender }),
        ...(data.loanAccountNumber !== undefined && { loanAccountNumber: data.loanAccountNumber }),
        ...(data.principalAmount !== undefined && { principalAmount: data.principalAmount }),
        ...(data.outstandingAmount !== undefined && { outstandingAmount: data.outstandingAmount }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.emiAmount !== undefined && { emiAmount: data.emiAmount }),
        ...(data.tenure !== undefined && { tenure: data.tenure }),
        ...(data.remainingTenure !== undefined && { remainingTenure: data.remainingTenure }),
        ...(data.loanStartDate !== undefined && { loanStartDate: data.loanStartDate }),
        ...(data.emiStartDate !== undefined && { emiStartDate: data.emiStartDate }),
        ...(data.maturityDate !== undefined && { maturityDate: data.maturityDate }),
        ...(data.paymentFrequency !== undefined && { paymentFrequency: data.paymentFrequency }),
        ...(data.nextEmiDate !== undefined && { nextEmiDate: data.nextEmiDate }),
        ...(data.lastPaymentDate !== undefined && { lastPaymentDate: data.lastPaymentDate }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.collateralValue !== undefined && { collateralValue: data.collateralValue }),
        ...(data.processingFee !== undefined && { processingFee: data.processingFee }),
        ...(data.prepaymentCharges !== undefined && { prepaymentCharges: data.prepaymentCharges }),
        ...(data.taxBenefitSection !== undefined && { taxBenefitSection: data.taxBenefitSection }),
        ...(data.maxTaxBenefit !== undefined && { maxTaxBenefit: data.maxTaxBenefit }),
        ...(data.purpose !== undefined && { purpose: data.purpose }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })

    return c.json({
      ...loan,
      loanStartDate: loan.loanStartDate.toISOString().split('T')[0],
      emiStartDate: loan.emiStartDate.toISOString().split('T')[0],
      maturityDate: loan.maturityDate.toISOString().split('T')[0],
      nextEmiDate: loan.nextEmiDate?.toISOString().split('T')[0] ?? null,
      lastPaymentDate: loan.lastPaymentDate?.toISOString().split('T')[0] ?? null,
    })
  } catch (error) {
    console.error('Error updating loan:', error)
    return c.json({ success: false, error: 'Failed to update loan' }, 500)
  }
})

// DELETE /api/loans/:id - Delete loan
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    // Delete loan (payments will cascade)
    await prisma.loan.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Loan deleted successfully' })
  } catch (error) {
    console.error('Error deleting loan:', error)
    return c.json({ success: false, error: 'Failed to delete loan' }, 500)
  }
})

// GET /api/loans/:id/payments - Get payment history
app.get('/:id/payments', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Verify loan belongs to user
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!loan) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    const payments = await prisma.loanPayment.findMany({
      where: { loanId: id },
      orderBy: { paymentDate: 'desc' },
    })

    const transformedPayments = payments.map((payment) => ({
      ...payment,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
    }))

    return c.json(transformedPayments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return c.json({ success: false, error: 'Failed to fetch payments' }, 500)
  }
})

// POST /api/loans/:id/payments - Record a payment
app.post('/:id/payments', zValidator('json', loanPaymentSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify loan belongs to user
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!loan) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    // Create payment
    const payment = await prisma.loanPayment.create({
      data: {
        userId,
        loanId: id,
        paymentDate: data.paymentDate,
        emiNumber: data.emiNumber || null,
        principalPaid: data.principalPaid,
        interestPaid: data.interestPaid,
        totalPaid: data.totalPaid,
        outstandingAfter: data.outstandingAfter,
        paymentMode: data.paymentMode || null,
        transactionId: data.transactionId || null,
        isLateFee: data.isLateFee || false,
        lateFeeAmount: data.lateFeeAmount || 0,
        notes: data.notes || null,
      },
    })

    // Update loan outstanding and last payment date
    await prisma.loan.update({
      where: { id },
      data: {
        outstandingAmount: data.outstandingAfter,
        lastPaymentDate: data.paymentDate,
        remainingTenure: Math.max(0, loan.remainingTenure - 1),
      },
    })

    return c.json(
      {
        ...payment,
        paymentDate: payment.paymentDate.toISOString().split('T')[0],
      },
      201
    )
  } catch (error) {
    console.error('Error recording payment:', error)
    return c.json({ success: false, error: 'Failed to record payment' }, 500)
  }
})

// GET /api/loans/:id/amortization - Get amortization schedule
app.get('/:id/amortization', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!loan) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    // Generate amortization schedule
    const schedule = generateAmortizationSchedule(
      loan.outstandingAmount,
      loan.interestRate,
      loan.remainingTenure,
      loan.emiAmount,
      loan.nextEmiDate || new Date()
    )

    return c.json({
      loanId: id,
      loanName: loan.loanName,
      principal: loan.outstandingAmount,
      interestRate: loan.interestRate,
      tenure: loan.remainingTenure,
      emiAmount: loan.emiAmount,
      schedule,
      totalInterest: schedule.reduce((sum, row) => sum + row.interest, 0),
      totalPayment: schedule.reduce((sum, row) => sum + row.emi, 0),
    })
  } catch (error) {
    console.error('Error generating amortization:', error)
    return c.json({ success: false, error: 'Failed to generate amortization schedule' }, 500)
  }
})

// POST /api/loans/:id/prepay - Calculate prepayment impact
app.post('/:id/prepay', zValidator('json', prepaymentSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const loan = await prisma.loan.findFirst({
      where: { id, userId },
    })

    if (!loan) {
      return c.json({ success: false, error: 'Loan not found' }, 404)
    }

    const impact = calculatePrepaymentImpact(
      loan.outstandingAmount,
      loan.interestRate,
      loan.remainingTenure,
      loan.emiAmount,
      data.prepaymentAmount,
      data.reduceEmi
    )

    return c.json({
      loanId: id,
      loanName: loan.loanName,
      currentOutstanding: loan.outstandingAmount,
      prepaymentAmount: data.prepaymentAmount,
      option: data.reduceEmi ? 'REDUCE_EMI' : 'REDUCE_TENURE',
      ...impact,
    })
  } catch (error) {
    console.error('Error calculating prepayment:', error)
    return c.json({ success: false, error: 'Failed to calculate prepayment impact' }, 500)
  }
})

// Helper: Generate amortization schedule
function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emiAmount: number,
  startDate: Date
): Array<{
  month: number
  date: string
  emi: number
  principal: number
  interest: number
  balance: number
}> {
  const schedule = []
  let balance = principal
  const monthlyRate = annualRate / 12 / 100
  const currentDate = new Date(startDate)

  for (let month = 1; month <= tenureMonths && balance > 0; month++) {
    const interest = balance * monthlyRate
    const principalPart = Math.min(emiAmount - interest, balance)
    balance = Math.max(0, balance - principalPart)

    schedule.push({
      month,
      date: currentDate.toISOString().split('T')[0],
      emi: month === tenureMonths && balance === 0 ? principalPart + interest : emiAmount,
      principal: principalPart,
      interest,
      balance,
    })

    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  return schedule
}

// Helper: Calculate prepayment impact
function calculatePrepaymentImpact(
  currentBalance: number,
  annualRate: number,
  remainingTenure: number,
  currentEmi: number,
  prepaymentAmount: number,
  reduceEmi: boolean
): {
  newBalance: number
  newEmi: number
  newTenure: number
  interestSaved: number
  tenureReduced: number
  emiReduced: number
} {
  const monthlyRate = annualRate / 12 / 100
  const newBalance = currentBalance - prepaymentAmount

  // Calculate total interest without prepayment
  const totalInterestWithout = currentEmi * remainingTenure - currentBalance

  let newEmi: number
  let newTenure: number

  if (reduceEmi) {
    // Keep tenure, reduce EMI
    newTenure = remainingTenure
    newEmi = (newBalance * monthlyRate * Math.pow(1 + monthlyRate, newTenure)) /
             (Math.pow(1 + monthlyRate, newTenure) - 1)
  } else {
    // Keep EMI, reduce tenure
    newEmi = currentEmi
    // Calculate new tenure using logarithm
    if (currentEmi > newBalance * monthlyRate) {
      newTenure = Math.ceil(
        Math.log(currentEmi / (currentEmi - newBalance * monthlyRate)) /
        Math.log(1 + monthlyRate)
      )
    } else {
      newTenure = remainingTenure // Edge case: EMI barely covers interest
    }
  }

  // Calculate total interest with prepayment
  const totalInterestWith = newEmi * newTenure - newBalance
  const interestSaved = Math.max(0, totalInterestWithout - totalInterestWith)

  return {
    newBalance,
    newEmi: Math.round(newEmi * 100) / 100,
    newTenure,
    interestSaved: Math.round(interestSaved * 100) / 100,
    tenureReduced: remainingTenure - newTenure,
    emiReduced: Math.round((currentEmi - newEmi) * 100) / 100,
  }
}

export default app
