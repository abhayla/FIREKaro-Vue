import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// Card type enum
const CardTypeEnum = z.enum(['VISA', 'MASTERCARD', 'RUPAY', 'AMEX', 'DINERS', 'OTHER'])

// Validation schema for credit card input
const creditCardInputSchema = z.object({
  cardName: z.string().min(1, 'Card name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  cardNumber: z.string().min(4, 'Card number must be at least 4 digits'), // Masked format: ****1234
  cardType: CardTypeEnum,
  creditLimit: z.number().positive('Credit limit must be positive'),
  availableLimit: z.number().min(0, 'Available limit cannot be negative'),
  currentOutstanding: z.number().min(0).default(0),
  billingCycleDate: z.number().int().min(1).max(31),
  paymentDueDate: z.number().int().min(1).max(31),
  rewardPointsBalance: z.number().int().min(0).default(0),
  interestRateAPR: z.number().min(0).max(100).optional().nullable(),
  annualFee: z.number().min(0).default(0),
  feeWaiverSpend: z.number().optional().nullable(),
  cardExpiryDate: z.string().transform((val) => new Date(val)).optional().nullable(),
  isActive: z.boolean().default(true),
  familyMemberId: z.string().optional().nullable(),
})

// Validation schema for statement
const statementInputSchema = z.object({
  statementDate: z.string().transform((val) => new Date(val)),
  statementAmount: z.number().min(0),
  minimumDue: z.number().min(0),
  dueDate: z.string().transform((val) => new Date(val)),
  isPaid: z.boolean().default(false),
  paidAmount: z.number().min(0).optional().nullable(),
  paidDate: z.string().transform((val) => new Date(val)).optional().nullable(),
})

// Validation schema for payment
const paymentInputSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().transform((val) => new Date(val)),
  statementId: z.string().optional(), // Optional: link to specific statement
})

// GET /api/credit-cards - List all credit cards
app.get('/', async (c) => {
  const userId = c.get('userId')
  const isActive = c.req.query('isActive')

  try {
    const whereClause: {
      userId: string
      isActive?: boolean
    } = { userId }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true'
    }

    const cards = await prisma.creditCard.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        statements: {
          orderBy: { statementDate: 'desc' },
          take: 1, // Get latest statement
        },
        familyMember: {
          select: { id: true, name: true, relationship: true },
        },
      },
    })

    // Transform and add computed fields
    const transformedCards = cards.map((card) => ({
      ...card,
      cardExpiryDate: card.cardExpiryDate?.toISOString().split('T')[0] ?? null,
      utilizationPercent: card.creditLimit > 0
        ? Math.round((card.currentOutstanding / card.creditLimit) * 100)
        : 0,
      latestStatement: card.statements[0]
        ? {
            ...card.statements[0],
            statementDate: card.statements[0].statementDate.toISOString().split('T')[0],
            dueDate: card.statements[0].dueDate.toISOString().split('T')[0],
            paidDate: card.statements[0].paidDate?.toISOString().split('T')[0] ?? null,
          }
        : null,
    }))

    // Calculate summary
    const summary = {
      totalCards: cards.length,
      activeCards: cards.filter(c => c.isActive).length,
      totalLimit: cards.reduce((sum, c) => sum + c.creditLimit, 0),
      totalOutstanding: cards.reduce((sum, c) => sum + c.currentOutstanding, 0),
      totalAvailable: cards.reduce((sum, c) => sum + c.availableLimit, 0),
      averageUtilization: cards.length > 0
        ? Math.round(
            cards.reduce((sum, c) =>
              sum + (c.creditLimit > 0 ? (c.currentOutstanding / c.creditLimit) * 100 : 0), 0
            ) / cards.length
          )
        : 0,
      totalRewardPoints: cards.reduce((sum, c) => sum + c.rewardPointsBalance, 0),
    }

    return c.json({ cards: transformedCards, summary })
  } catch (error) {
    console.error('Error fetching credit cards:', error)
    return c.json({ success: false, error: 'Failed to fetch credit cards' }, 500)
  }
})

// GET /api/credit-cards/:id - Get single credit card
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const card = await prisma.creditCard.findFirst({
      where: { id, userId },
      include: {
        statements: {
          orderBy: { statementDate: 'desc' },
          take: 12, // Last 12 statements
        },
        familyMember: {
          select: { id: true, name: true, relationship: true },
        },
      },
    })

    if (!card) {
      return c.json({ success: false, error: 'Credit card not found' }, 404)
    }

    return c.json({
      ...card,
      cardExpiryDate: card.cardExpiryDate?.toISOString().split('T')[0] ?? null,
      utilizationPercent: card.creditLimit > 0
        ? Math.round((card.currentOutstanding / card.creditLimit) * 100)
        : 0,
      statements: card.statements.map(s => ({
        ...s,
        statementDate: s.statementDate.toISOString().split('T')[0],
        dueDate: s.dueDate.toISOString().split('T')[0],
        paidDate: s.paidDate?.toISOString().split('T')[0] ?? null,
      })),
    })
  } catch (error) {
    console.error('Error fetching credit card:', error)
    return c.json({ success: false, error: 'Failed to fetch credit card' }, 500)
  }
})

// POST /api/credit-cards - Create credit card
app.post('/', zValidator('json', creditCardInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const card = await prisma.creditCard.create({
      data: {
        userId,
        cardName: data.cardName,
        bankName: data.bankName,
        cardNumber: data.cardNumber,
        cardType: data.cardType,
        creditLimit: data.creditLimit,
        availableLimit: data.availableLimit,
        currentOutstanding: data.currentOutstanding || 0,
        billingCycleDate: data.billingCycleDate,
        paymentDueDate: data.paymentDueDate,
        rewardPointsBalance: data.rewardPointsBalance || 0,
        interestRateAPR: data.interestRateAPR || null,
        annualFee: data.annualFee || 0,
        feeWaiverSpend: data.feeWaiverSpend || null,
        cardExpiryDate: data.cardExpiryDate || null,
        isActive: data.isActive ?? true,
        familyMemberId: data.familyMemberId || null,
      },
    })

    return c.json(
      {
        ...card,
        cardExpiryDate: card.cardExpiryDate?.toISOString().split('T')[0] ?? null,
        utilizationPercent: card.creditLimit > 0
          ? Math.round((card.currentOutstanding / card.creditLimit) * 100)
          : 0,
      },
      201
    )
  } catch (error) {
    console.error('Error creating credit card:', error)
    return c.json({ success: false, error: 'Failed to create credit card' }, 500)
  }
})

// PUT /api/credit-cards/:id - Update credit card
app.put('/:id', zValidator('json', creditCardInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    const existing = await prisma.creditCard.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Credit card not found' }, 404)
    }

    const card = await prisma.creditCard.update({
      where: { id },
      data: {
        ...(data.cardName !== undefined && { cardName: data.cardName }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.cardNumber !== undefined && { cardNumber: data.cardNumber }),
        ...(data.cardType !== undefined && { cardType: data.cardType }),
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.availableLimit !== undefined && { availableLimit: data.availableLimit }),
        ...(data.currentOutstanding !== undefined && { currentOutstanding: data.currentOutstanding }),
        ...(data.billingCycleDate !== undefined && { billingCycleDate: data.billingCycleDate }),
        ...(data.paymentDueDate !== undefined && { paymentDueDate: data.paymentDueDate }),
        ...(data.rewardPointsBalance !== undefined && { rewardPointsBalance: data.rewardPointsBalance }),
        ...(data.interestRateAPR !== undefined && { interestRateAPR: data.interestRateAPR }),
        ...(data.annualFee !== undefined && { annualFee: data.annualFee }),
        ...(data.feeWaiverSpend !== undefined && { feeWaiverSpend: data.feeWaiverSpend }),
        ...(data.cardExpiryDate !== undefined && { cardExpiryDate: data.cardExpiryDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.familyMemberId !== undefined && { familyMemberId: data.familyMemberId }),
      },
    })

    return c.json({
      ...card,
      cardExpiryDate: card.cardExpiryDate?.toISOString().split('T')[0] ?? null,
      utilizationPercent: card.creditLimit > 0
        ? Math.round((card.currentOutstanding / card.creditLimit) * 100)
        : 0,
    })
  } catch (error) {
    console.error('Error updating credit card:', error)
    return c.json({ success: false, error: 'Failed to update credit card' }, 500)
  }
})

// DELETE /api/credit-cards/:id - Delete credit card
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.creditCard.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Credit card not found' }, 404)
    }

    // Delete card (statements will cascade)
    await prisma.creditCard.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Credit card deleted successfully' })
  } catch (error) {
    console.error('Error deleting credit card:', error)
    return c.json({ success: false, error: 'Failed to delete credit card' }, 500)
  }
})

// GET /api/credit-cards/:id/statements - Get statement history
app.get('/:id/statements', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const limit = parseInt(c.req.query('limit') || '24')

  try {
    // Verify card belongs to user
    const card = await prisma.creditCard.findFirst({
      where: { id, userId },
    })

    if (!card) {
      return c.json({ success: false, error: 'Credit card not found' }, 404)
    }

    const statements = await prisma.creditCardStatement.findMany({
      where: { creditCardId: id },
      orderBy: { statementDate: 'desc' },
      take: limit,
    })

    const transformedStatements = statements.map((s) => ({
      ...s,
      statementDate: s.statementDate.toISOString().split('T')[0],
      dueDate: s.dueDate.toISOString().split('T')[0],
      paidDate: s.paidDate?.toISOString().split('T')[0] ?? null,
    }))

    return c.json(transformedStatements)
  } catch (error) {
    console.error('Error fetching statements:', error)
    return c.json({ success: false, error: 'Failed to fetch statements' }, 500)
  }
})

// POST /api/credit-cards/:id/statements - Add statement
app.post('/:id/statements', zValidator('json', statementInputSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify card belongs to user
    const card = await prisma.creditCard.findFirst({
      where: { id, userId },
    })

    if (!card) {
      return c.json({ success: false, error: 'Credit card not found' }, 404)
    }

    const statement = await prisma.creditCardStatement.create({
      data: {
        creditCardId: id,
        statementDate: data.statementDate,
        statementAmount: data.statementAmount,
        minimumDue: data.minimumDue,
        dueDate: data.dueDate,
        isPaid: data.isPaid || false,
        paidAmount: data.paidAmount || null,
        paidDate: data.paidDate || null,
      },
    })

    // Update card's current outstanding if this is the latest statement
    await prisma.creditCard.update({
      where: { id },
      data: {
        currentOutstanding: data.statementAmount,
        availableLimit: card.creditLimit - data.statementAmount,
      },
    })

    return c.json(
      {
        ...statement,
        statementDate: statement.statementDate.toISOString().split('T')[0],
        dueDate: statement.dueDate.toISOString().split('T')[0],
        paidDate: statement.paidDate?.toISOString().split('T')[0] ?? null,
      },
      201
    )
  } catch (error) {
    console.error('Error creating statement:', error)
    return c.json({ success: false, error: 'Failed to create statement' }, 500)
  }
})

// POST /api/credit-cards/:id/pay - Record payment
app.post('/:id/pay', zValidator('json', paymentInputSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify card belongs to user
    const card = await prisma.creditCard.findFirst({
      where: { id, userId },
    })

    if (!card) {
      return c.json({ success: false, error: 'Credit card not found' }, 404)
    }

    // Calculate new balances
    const newOutstanding = Math.max(0, card.currentOutstanding - data.amount)
    const newAvailable = Math.min(card.creditLimit, card.availableLimit + data.amount)

    // Update card balances
    const updatedCard = await prisma.creditCard.update({
      where: { id },
      data: {
        currentOutstanding: newOutstanding,
        availableLimit: newAvailable,
      },
    })

    // If statement ID provided, update that statement
    if (data.statementId) {
      await prisma.creditCardStatement.update({
        where: { id: data.statementId },
        data: {
          isPaid: true,
          paidAmount: data.amount,
          paidDate: data.paymentDate,
        },
      })
    }

    return c.json({
      success: true,
      message: 'Payment recorded successfully',
      card: {
        id: updatedCard.id,
        currentOutstanding: updatedCard.currentOutstanding,
        availableLimit: updatedCard.availableLimit,
        utilizationPercent: updatedCard.creditLimit > 0
          ? Math.round((updatedCard.currentOutstanding / updatedCard.creditLimit) * 100)
          : 0,
      },
      payment: {
        amount: data.amount,
        date: data.paymentDate.toISOString().split('T')[0],
      },
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    return c.json({ success: false, error: 'Failed to record payment' }, 500)
  }
})

export default app
