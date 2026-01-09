import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/investments - List all investments
app.get('/', async (c) => {
  const userId = c.get('userId')
  const type = c.req.query('type')
  const category = c.req.query('category')
  const isActive = c.req.query('isActive')

  try {
    const whereClause: {
      userId: string
      type?: string
      category?: string
      isActive?: boolean
    } = { userId }

    if (type) whereClause.type = type
    if (category) whereClause.category = category
    if (isActive !== undefined) whereClause.isActive = isActive === 'true'

    const investments = await prisma.investment.findMany({
      where: whereClause,
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { currentValue: 'desc' },
    })

    return c.json({ success: true, data: investments })
  } catch (error) {
    console.error('Error fetching investments:', error)
    return c.json({ success: false, error: 'Failed to fetch investments' }, 500)
  }
})

// GET /api/investments/overview - Portfolio overview
app.get('/overview', async (c) => {
  const userId = c.get('userId')

  try {
    const investments = await prisma.investment.findMany({
      where: { userId, isActive: true },
    })

    if (investments.length === 0) {
      return c.json({
        success: true,
        data: {
          totalValue: 0,
          totalInvested: 0,
          absoluteReturn: 0,
          absoluteReturnPercent: 0,
          todaysGain: 0,
          todaysGainPercent: 0,
          allocation: {
            equity: 0,
            debt: 0,
            hybrid: 0,
            gold: 0,
            realEstate: 0,
            other: 0,
          },
          categoryBreakdown: [],
        },
      })
    }

    const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0)
    const absoluteReturn = totalValue - totalInvested
    const absoluteReturnPercent = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0

    // Calculate allocation by category
    const categoryTotals: Record<string, number> = {}
    investments.forEach((inv) => {
      const cat = inv.category || 'OTHER'
      categoryTotals[cat] = (categoryTotals[cat] || 0) + inv.currentValue
    })

    const allocation = {
      equity: ((categoryTotals['EQUITY'] || 0) / totalValue) * 100,
      debt: ((categoryTotals['DEBT'] || 0) / totalValue) * 100,
      hybrid: ((categoryTotals['HYBRID'] || 0) / totalValue) * 100,
      gold: ((categoryTotals['GOLD'] || 0) / totalValue) * 100,
      realEstate: ((categoryTotals['REAL_ESTATE'] || 0) / totalValue) * 100,
      other:
        ((categoryTotals['OTHER'] || 0) / totalValue) * 100 +
        Object.entries(categoryTotals)
          .filter(([k]) => !['EQUITY', 'DEBT', 'HYBRID', 'GOLD', 'REAL_ESTATE', 'OTHER'].includes(k))
          .reduce((sum, [, v]) => sum + (v / totalValue) * 100, 0),
    }

    // Category breakdown for charts
    const categoryBreakdown = Object.entries(categoryTotals).map(([category, value]) => ({
      category,
      value,
      percentage: (value / totalValue) * 100,
      count: investments.filter((inv) => inv.category === category).length,
    }))

    // Type breakdown (MF, Stocks, etc.)
    const typeTotals: Record<string, { invested: number; value: number; count: number }> = {}
    investments.forEach((inv) => {
      const type = inv.type || 'OTHER'
      if (!typeTotals[type]) {
        typeTotals[type] = { invested: 0, value: 0, count: 0 }
      }
      typeTotals[type].invested += inv.totalInvested
      typeTotals[type].value += inv.currentValue
      typeTotals[type].count += 1
    })

    const typeBreakdown = Object.entries(typeTotals).map(([type, data]) => ({
      type,
      ...data,
      returns: data.value - data.invested,
      returnsPercent: data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0,
    }))

    return c.json({
      success: true,
      data: {
        totalValue,
        totalInvested,
        absoluteReturn,
        absoluteReturnPercent,
        todaysGain: 0, // TODO: Implement real-time price tracking
        todaysGainPercent: 0,
        allocation,
        categoryBreakdown,
        typeBreakdown,
        investmentCount: investments.length,
      },
    })
  } catch (error) {
    console.error('Error fetching portfolio overview:', error)
    return c.json({ success: false, error: 'Failed to fetch portfolio overview' }, 500)
  }
})

// GET /api/investments/:id - Get single investment
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const investment = await prisma.investment.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    if (!investment) {
      return c.json({ success: false, error: 'Investment not found' }, 404)
    }

    return c.json({ success: true, data: investment })
  } catch (error) {
    console.error('Error fetching investment:', error)
    return c.json({ success: false, error: 'Failed to fetch investment' }, 500)
  }
})

// POST /api/investments - Create investment
app.post('/', async (c) => {
  const userId = c.get('userId')

  try {
    const body = await c.req.json()

    const investment = await prisma.investment.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        symbol: body.symbol,
        isin: body.isin,
        platform: body.platform,
        folioNumber: body.folioNumber,
        totalInvested: body.totalInvested || 0,
        currentValue: body.currentValue || body.totalInvested || 0,
        totalUnits: body.totalUnits || 0,
        averagePrice: body.averagePrice || 0,
        isSIP: body.isSIP || false,
        sipAmount: body.sipAmount,
        sipDate: body.sipDate,
        nextSIPDate: body.nextSIPDate,
        isELSS: body.isELSS || false,
        isTaxSaving: body.isTaxSaving || false,
        lockInPeriod: body.lockInPeriod,
        maturityDate: body.maturityDate,
        firstInvestmentDate: body.firstInvestmentDate || new Date(),
      },
    })

    // Create initial transaction if amount provided
    if (body.totalInvested && body.totalInvested > 0) {
      await prisma.investmentTransaction.create({
        data: {
          userId,
          investmentId: investment.id,
          transactionType: 'BUY',
          transactionDate: body.firstInvestmentDate || new Date(),
          units: body.totalUnits || 0,
          price: body.averagePrice || 0,
          amount: body.totalInvested,
          totalCharges: 0,
          netAmount: body.totalInvested,
          platform: body.platform,
        },
      })
    }

    return c.json({ success: true, data: investment }, 201)
  } catch (error) {
    console.error('Error creating investment:', error)
    return c.json({ success: false, error: 'Failed to create investment' }, 500)
  }
})

// PUT /api/investments/:id - Update investment
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Verify ownership
    const existing = await prisma.investment.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Investment not found' }, 404)
    }

    const body = await c.req.json()

    // Calculate returns if values changed
    const totalInvested = body.totalInvested ?? existing.totalInvested
    const currentValue = body.currentValue ?? existing.currentValue
    const absoluteReturn = currentValue - totalInvested
    const absoluteReturnPercent = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0

    const investment = await prisma.investment.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        category: body.category,
        subcategory: body.subcategory,
        symbol: body.symbol,
        isin: body.isin,
        platform: body.platform,
        folioNumber: body.folioNumber,
        totalInvested,
        currentValue,
        totalUnits: body.totalUnits,
        averagePrice: body.averagePrice,
        absoluteReturn,
        absoluteReturnPercent,
        xirr: body.xirr,
        cagr: body.cagr,
        isSIP: body.isSIP,
        sipAmount: body.sipAmount,
        sipDate: body.sipDate,
        nextSIPDate: body.nextSIPDate,
        isELSS: body.isELSS,
        isTaxSaving: body.isTaxSaving,
        lockInPeriod: body.lockInPeriod,
        maturityDate: body.maturityDate,
        isActive: body.isActive,
        lastTransactionDate: body.lastTransactionDate,
      },
    })

    return c.json({ success: true, data: investment })
  } catch (error) {
    console.error('Error updating investment:', error)
    return c.json({ success: false, error: 'Failed to update investment' }, 500)
  }
})

// DELETE /api/investments/:id - Delete investment
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Verify ownership
    const existing = await prisma.investment.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'Investment not found' }, 404)
    }

    // Delete investment (cascade will delete transactions)
    await prisma.investment.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'Investment deleted' })
  } catch (error) {
    console.error('Error deleting investment:', error)
    return c.json({ success: false, error: 'Failed to delete investment' }, 500)
  }
})

// POST /api/investments/:id/transactions - Add transaction
app.post('/:id/transactions', async (c) => {
  const userId = c.get('userId')
  const investmentId = c.req.param('id')

  try {
    // Verify ownership
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId },
    })

    if (!investment) {
      return c.json({ success: false, error: 'Investment not found' }, 404)
    }

    const body = await c.req.json()

    const transaction = await prisma.investmentTransaction.create({
      data: {
        userId,
        investmentId,
        transactionType: body.transactionType,
        transactionDate: body.transactionDate || new Date(),
        units: body.units || 0,
        price: body.price || 0,
        amount: body.amount,
        totalCharges: body.totalCharges || 0,
        netAmount: body.netAmount || body.amount,
        platform: body.platform,
        orderId: body.orderId,
        description: body.description,
      },
    })

    // Update investment totals based on transaction type
    let unitsDelta = 0
    let investedDelta = 0

    if (body.transactionType === 'BUY' || body.transactionType === 'SIP') {
      unitsDelta = body.units || 0
      investedDelta = body.amount
    } else if (body.transactionType === 'SELL') {
      unitsDelta = -(body.units || 0)
      // For sell, we reduce invested proportionally
      if (investment.totalUnits > 0) {
        investedDelta = -((body.units / investment.totalUnits) * investment.totalInvested)
      }
    }

    const newTotalUnits = investment.totalUnits + unitsDelta
    const newTotalInvested = Math.max(0, investment.totalInvested + investedDelta)
    const newAveragePrice = newTotalUnits > 0 ? newTotalInvested / newTotalUnits : 0

    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        totalUnits: newTotalUnits,
        totalInvested: newTotalInvested,
        averagePrice: newAveragePrice,
        lastTransactionDate: body.transactionDate || new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error creating transaction:', error)
    return c.json({ success: false, error: 'Failed to create transaction' }, 500)
  }
})

// GET /api/investments/:id/transactions - Get transactions for investment
app.get('/:id/transactions', async (c) => {
  const userId = c.get('userId')
  const investmentId = c.req.param('id')

  try {
    // Verify ownership
    const investment = await prisma.investment.findFirst({
      where: { id: investmentId, userId },
    })

    if (!investment) {
      return c.json({ success: false, error: 'Investment not found' }, 404)
    }

    const transactions = await prisma.investmentTransaction.findMany({
      where: { investmentId },
      orderBy: { transactionDate: 'desc' },
    })

    return c.json({ success: true, data: transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return c.json({ success: false, error: 'Failed to fetch transactions' }, 500)
  }
})

export default app
