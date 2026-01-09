import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/nps - List all NPS accounts
app.get('/', async (c) => {
  const userId = c.get('userId')

  try {
    const npsAccounts = await prisma.nPSAccount.findMany({
      where: { userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 12,
        },
      },
    })

    // Add computed summary
    const summary = {
      totalCorpus: npsAccounts.reduce((sum, acc) => sum + acc.currentCorpus, 0),
      tier1Corpus: npsAccounts.find((a) => a.tierType === 'Tier I')?.currentCorpus || 0,
      tier2Corpus: npsAccounts.find((a) => a.tierType === 'Tier II')?.currentCorpus || 0,
      totalMonthlyContribution: npsAccounts.reduce((sum, acc) => sum + acc.monthlyContribution, 0),
    }

    return c.json({ success: true, data: { accounts: npsAccounts, summary } })
  } catch (error) {
    console.error('Error fetching NPS accounts:', error)
    return c.json({ success: false, error: 'Failed to fetch NPS accounts' }, 500)
  }
})

// GET /api/nps/:id - Get single NPS account
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const npsAccount = await prisma.nPSAccount.findFirst({
      where: { id, userId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    if (!npsAccount) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    // Calculate allocation percentages
    const totalAllocation =
      npsAccount.equityAllocation +
      npsAccount.corporateDebtAllocation +
      npsAccount.governmentBondAllocation

    return c.json({
      success: true,
      data: {
        ...npsAccount,
        allocationBreakdown: {
          equity: {
            percentage: npsAccount.equityAllocation,
            value: (npsAccount.currentCorpus * npsAccount.equityAllocation) / 100,
          },
          corporateDebt: {
            percentage: npsAccount.corporateDebtAllocation,
            value: (npsAccount.currentCorpus * npsAccount.corporateDebtAllocation) / 100,
          },
          governmentBonds: {
            percentage: npsAccount.governmentBondAllocation,
            value: (npsAccount.currentCorpus * npsAccount.governmentBondAllocation) / 100,
          },
        },
        totalAllocation,
        isAllocationValid: Math.abs(totalAllocation - 100) < 0.01,
      },
    })
  } catch (error) {
    console.error('Error fetching NPS account:', error)
    return c.json({ success: false, error: 'Failed to fetch NPS account' }, 500)
  }
})

// POST /api/nps - Create NPS account
app.post('/', async (c) => {
  const userId = c.get('userId')

  try {
    const body = await c.req.json()

    // Validate allocation sums to 100
    const totalAllocation =
      (body.equityAllocation || 50) +
      (body.corporateDebtAllocation || 30) +
      (body.governmentBondAllocation || 20)

    if (Math.abs(totalAllocation - 100) > 0.01) {
      return c.json({
        success: false,
        error: 'Asset allocation must sum to 100%',
      }, 400)
    }

    // Check if tier type account already exists
    const existing = await prisma.nPSAccount.findFirst({
      where: { userId, tierType: body.tierType || 'Tier I' },
    })

    if (existing) {
      return c.json({
        success: false,
        error: `NPS ${body.tierType || 'Tier I'} account already exists`,
      }, 400)
    }

    const npsAccount = await prisma.nPSAccount.create({
      data: {
        userId,
        pran: body.pran,
        subscriberName: body.subscriberName,
        tierType: body.tierType || 'Tier I',
        currentCorpus: body.currentCorpus || 0,
        equityAllocation: body.equityAllocation || 50,
        corporateDebtAllocation: body.corporateDebtAllocation || 30,
        governmentBondAllocation: body.governmentBondAllocation || 20,
        monthlyContribution: body.monthlyContribution || 0,
        employerContribution: body.employerContribution || 0,
        riskProfile: body.riskProfile || 'MODERATE',
      },
    })

    return c.json({ success: true, data: npsAccount }, 201)
  } catch (error) {
    console.error('Error creating NPS account:', error)
    return c.json({ success: false, error: 'Failed to create NPS account' }, 500)
  }
})

// PUT /api/nps/:id - Update NPS account
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    const body = await c.req.json()

    // Validate allocation if provided
    if (
      body.equityAllocation !== undefined ||
      body.corporateDebtAllocation !== undefined ||
      body.governmentBondAllocation !== undefined
    ) {
      const totalAllocation =
        (body.equityAllocation ?? existing.equityAllocation) +
        (body.corporateDebtAllocation ?? existing.corporateDebtAllocation) +
        (body.governmentBondAllocation ?? existing.governmentBondAllocation)

      if (Math.abs(totalAllocation - 100) > 0.01) {
        return c.json({
          success: false,
          error: 'Asset allocation must sum to 100%',
        }, 400)
      }
    }

    const npsAccount = await prisma.nPSAccount.update({
      where: { id },
      data: {
        pran: body.pran,
        subscriberName: body.subscriberName,
        currentCorpus: body.currentCorpus,
        equityAllocation: body.equityAllocation,
        corporateDebtAllocation: body.corporateDebtAllocation,
        governmentBondAllocation: body.governmentBondAllocation,
        monthlyContribution: body.monthlyContribution,
        employerContribution: body.employerContribution,
        riskProfile: body.riskProfile,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: npsAccount })
  } catch (error) {
    console.error('Error updating NPS account:', error)
    return c.json({ success: false, error: 'Failed to update NPS account' }, 500)
  }
})

// DELETE /api/nps/:id - Delete NPS account
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    await prisma.nPSAccount.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'NPS account deleted' })
  } catch (error) {
    console.error('Error deleting NPS account:', error)
    return c.json({ success: false, error: 'Failed to delete NPS account' }, 500)
  }
})

// POST /api/nps/:id/contribution - Add contribution
app.post('/:id/contribution', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const npsAccount = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!npsAccount) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    const body = await c.req.json()
    const amount = body.amount
    const transactionDate = new Date(body.transactionDate || new Date())
    const newCorpus = npsAccount.currentCorpus + amount

    const transaction = await prisma.nPSTransaction.create({
      data: {
        npsAccountId: id,
        transactionType: body.transactionType || 'CONTRIBUTION',
        amount,
        corpus: newCorpus,
        description: body.description,
        transactionDate,
      },
    })

    await prisma.nPSAccount.update({
      where: { id },
      data: {
        currentCorpus: newCorpus,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: transaction }, 201)
  } catch (error) {
    console.error('Error adding NPS contribution:', error)
    return c.json({ success: false, error: 'Failed to add NPS contribution' }, 500)
  }
})

// GET /api/nps/:id/projection - Get corpus projection
app.get('/:id/projection', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const years = parseInt(c.req.query('years') || '25')
  const expectedReturn = parseFloat(c.req.query('expectedReturn') || '10') / 100

  try {
    const npsAccount = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!npsAccount) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    const monthlyContribution = npsAccount.monthlyContribution + npsAccount.employerContribution

    // Year-by-year projection
    const projections: Array<{
      year: number
      startingCorpus: number
      contributions: number
      returns: number
      endingCorpus: number
    }> = []

    let corpus = npsAccount.currentCorpus

    for (let year = 1; year <= years; year++) {
      const startingCorpus = corpus
      const yearlyContribution = monthlyContribution * 12
      const returns = (startingCorpus + yearlyContribution / 2) * expectedReturn
      corpus = startingCorpus + yearlyContribution + returns

      projections.push({
        year,
        startingCorpus: Math.round(startingCorpus),
        contributions: Math.round(yearlyContribution),
        returns: Math.round(returns),
        endingCorpus: Math.round(corpus),
      })
    }

    // 2025 NPS withdrawal rules
    const withdrawalOptions = calculateWithdrawalOptions(corpus)

    return c.json({
      success: true,
      data: {
        currentCorpus: npsAccount.currentCorpus,
        monthlyContribution,
        expectedReturn: expectedReturn * 100,
        projections,
        finalCorpus: Math.round(corpus),
        totalContributions: Math.round(monthlyContribution * 12 * years),
        totalReturns: Math.round(corpus - npsAccount.currentCorpus - monthlyContribution * 12 * years),
        withdrawalOptions,
      },
    })
  } catch (error) {
    console.error('Error calculating NPS projection:', error)
    return c.json({ success: false, error: 'Failed to calculate NPS projection' }, 500)
  }
})

// Helper function for 2025 NPS withdrawal rules
function calculateWithdrawalOptions(corpus: number) {
  // 2025 Rules for corpus above Rs 5 Lakh
  // - 60% can be withdrawn tax-free (lump sum)
  // - 40% must be used to buy annuity

  // For corpus <= Rs 5 Lakh: 100% can be withdrawn
  if (corpus <= 500000) {
    return {
      lumpSumPercentage: 100,
      annuityPercentage: 0,
      lumpSumAmount: corpus,
      annuityAmount: 0,
      message: 'Corpus below Rs 5 Lakh - 100% can be withdrawn as lump sum',
    }
  }

  // Standard 60/40 rule (post-2025 changes allow 60% tax-free withdrawal)
  const lumpSumAmount = corpus * 0.6
  const annuityAmount = corpus * 0.4

  // Estimated monthly pension (assuming 6% annuity rate)
  const annuityRate = 0.06
  const monthlyPension = (annuityAmount * annuityRate) / 12

  return {
    lumpSumPercentage: 60,
    annuityPercentage: 40,
    lumpSumAmount: Math.round(lumpSumAmount),
    annuityAmount: Math.round(annuityAmount),
    estimatedMonthlyPension: Math.round(monthlyPension),
    taxFreeWithdrawal: Math.round(lumpSumAmount), // 60% is tax-free
    annuityTaxation: 'Pension from annuity is taxable as per income slab',
    message: 'Standard 60/40 withdrawal - 60% tax-free lump sum, 40% mandatory annuity',
  }
}

// GET /api/nps/:id/withdrawal-options - Get detailed withdrawal options
app.get('/:id/withdrawal-options', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const npsAccount = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!npsAccount) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    const corpus = npsAccount.currentCorpus
    const withdrawalOptions = calculateWithdrawalOptions(corpus)

    // Additional scenarios
    const scenarios = [
      {
        name: 'Maximum Lump Sum (60%)',
        lumpSum: corpus * 0.6,
        annuity: corpus * 0.4,
        monthlyPension: (corpus * 0.4 * 0.06) / 12,
      },
      {
        name: 'Maximum Annuity (100%)',
        lumpSum: 0,
        annuity: corpus,
        monthlyPension: (corpus * 0.06) / 12,
      },
      {
        name: 'Balanced (50/50)',
        lumpSum: corpus * 0.5,
        annuity: corpus * 0.5,
        monthlyPension: (corpus * 0.5 * 0.06) / 12,
      },
    ]

    // Tax benefit calculation (80CCD)
    const taxBenefits = {
      section80CCD1: Math.min(npsAccount.monthlyContribution * 12, 150000), // Part of 80C limit
      section80CCD1B: Math.min(npsAccount.monthlyContribution * 12, 50000), // Additional 50K
      section80CCD2: npsAccount.employerContribution * 12, // 10% of basic (no cap in 2025)
      totalDeduction: 0,
    }
    taxBenefits.totalDeduction =
      taxBenefits.section80CCD1 + taxBenefits.section80CCD1B + taxBenefits.section80CCD2

    return c.json({
      success: true,
      data: {
        currentCorpus: corpus,
        tierType: npsAccount.tierType,
        withdrawalOptions,
        scenarios: scenarios.map((s) => ({
          ...s,
          lumpSum: Math.round(s.lumpSum),
          annuity: Math.round(s.annuity),
          monthlyPension: Math.round(s.monthlyPension),
        })),
        taxBenefits,
        rules2025: {
          lumpSumLimit: '60% of corpus (tax-free)',
          annuityMinimum: '40% of corpus (mandatory for corpus > Rs 5L)',
          partialWithdrawal: '25% for specific purposes after 3 years',
          prematureExit: 'Allowed after 5 years with 80% annuity requirement',
        },
      },
    })
  } catch (error) {
    console.error('Error fetching withdrawal options:', error)
    return c.json({ success: false, error: 'Failed to fetch withdrawal options' }, 500)
  }
})

// PUT /api/nps/:id/allocation - Update asset allocation
app.put('/:id/allocation', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    const body = await c.req.json()

    const totalAllocation =
      (body.equityAllocation || 0) +
      (body.corporateDebtAllocation || 0) +
      (body.governmentBondAllocation || 0)

    if (Math.abs(totalAllocation - 100) > 0.01) {
      return c.json({
        success: false,
        error: 'Asset allocation must sum to 100%',
      }, 400)
    }

    // Validate equity limit based on age (if provided)
    // For subscribers below 50: max 75% equity
    // Age 50-55: max 50%
    // Above 55: max 25%
    if (body.subscriberAge) {
      let maxEquity = 75
      if (body.subscriberAge >= 55) maxEquity = 25
      else if (body.subscriberAge >= 50) maxEquity = 50

      if (body.equityAllocation > maxEquity) {
        return c.json({
          success: false,
          error: `Maximum equity allocation for your age is ${maxEquity}%`,
        }, 400)
      }
    }

    const npsAccount = await prisma.nPSAccount.update({
      where: { id },
      data: {
        equityAllocation: body.equityAllocation,
        corporateDebtAllocation: body.corporateDebtAllocation,
        governmentBondAllocation: body.governmentBondAllocation,
        riskProfile: body.riskProfile,
        lastUpdated: new Date(),
      },
    })

    // Record allocation change as transaction
    await prisma.nPSTransaction.create({
      data: {
        npsAccountId: id,
        transactionType: 'ALLOCATION_CHANGE',
        amount: 0,
        corpus: npsAccount.currentCorpus,
        description: `Allocation changed: E:${body.equityAllocation}% C:${body.corporateDebtAllocation}% G:${body.governmentBondAllocation}%`,
        transactionDate: new Date(),
      },
    })

    return c.json({ success: true, data: npsAccount })
  } catch (error) {
    console.error('Error updating NPS allocation:', error)
    return c.json({ success: false, error: 'Failed to update NPS allocation' }, 500)
  }
})

// GET /api/nps/:id/transactions - Get transaction history
app.get('/:id/transactions', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const npsAccount = await prisma.nPSAccount.findFirst({
      where: { id, userId },
    })

    if (!npsAccount) {
      return c.json({ success: false, error: 'NPS account not found' }, 404)
    }

    const transactions = await prisma.nPSTransaction.findMany({
      where: { npsAccountId: id },
      orderBy: { transactionDate: 'desc' },
    })

    return c.json({ success: true, data: transactions })
  } catch (error) {
    console.error('Error fetching NPS transactions:', error)
    return c.json({ success: false, error: 'Failed to fetch NPS transactions' }, 500)
  }
})

export default app
