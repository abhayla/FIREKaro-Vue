import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// GET /api/esop - List all ESOP grants
app.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status')
  const companyName = c.req.query('companyName')

  try {
    const whereClause: {
      userId: string
      status?: string
      companyName?: string
    } = { userId }

    if (status) whereClause.status = status
    if (companyName) whereClause.companyName = companyName

    const grants = await prisma.eSOPGrant.findMany({
      where: whereClause,
      include: {
        vestingEvents: {
          orderBy: { vestingDate: 'asc' },
        },
      },
      orderBy: { grantDate: 'desc' },
    })

    // Calculate summary
    const summary = {
      totalGrants: grants.length,
      totalUnits: grants.reduce((sum, g) => sum + g.totalUnits, 0),
      vestedUnits: grants.reduce((sum, g) => sum + g.vestedUnits, 0),
      exercisedUnits: grants.reduce((sum, g) => sum + g.exercisedUnits, 0),
      unvestedUnits: grants.reduce((sum, g) => sum + g.unvestedUnits, 0),
      totalCurrentValue: grants.reduce((sum, g) => sum + g.totalUnits * (g.currentFMV || g.fairMarketValue), 0),
      totalVestedValue: grants.reduce((sum, g) => sum + g.vestedUnits * (g.currentFMV || g.fairMarketValue), 0),
      byCompany: {} as Record<string, { grants: number; units: number; value: number }>,
    }

    grants.forEach((g) => {
      if (!summary.byCompany[g.companyName]) {
        summary.byCompany[g.companyName] = { grants: 0, units: 0, value: 0 }
      }
      summary.byCompany[g.companyName].grants += 1
      summary.byCompany[g.companyName].units += g.totalUnits
      summary.byCompany[g.companyName].value += g.totalUnits * (g.currentFMV || g.fairMarketValue)
    })

    return c.json({ success: true, data: { grants, summary } })
  } catch (error) {
    console.error('Error fetching ESOP grants:', error)
    return c.json({ success: false, error: 'Failed to fetch ESOP grants' }, 500)
  }
})

// GET /api/esop/summary - Get ESOP portfolio summary
app.get('/summary', async (c) => {
  const userId = c.get('userId')

  try {
    const grants = await prisma.eSOPGrant.findMany({
      where: { userId, status: { not: 'CANCELLED' } },
    })

    const summary = {
      totalGrants: grants.length,
      activeGrants: grants.filter((g) => g.status === 'ACTIVE' || g.status === 'PARTIALLY_VESTED').length,
      totalUnits: grants.reduce((sum, g) => sum + g.totalUnits, 0),
      vestedUnits: grants.reduce((sum, g) => sum + g.vestedUnits, 0),
      exercisedUnits: grants.reduce((sum, g) => sum + g.exercisedUnits, 0),
      exercisableUnits: grants.reduce((sum, g) => sum + g.exercisableUnits, 0),
      unvestedUnits: grants.reduce((sum, g) => sum + g.unvestedUnits, 0),
      totalCurrentValue: grants.reduce((sum, g) => sum + g.totalUnits * (g.currentFMV || g.fairMarketValue), 0),
      vestedValue: grants.reduce((sum, g) => sum + g.vestedUnits * (g.currentFMV || g.fairMarketValue), 0),
      exercisableValue: grants.reduce((sum, g) => sum + g.exercisableUnits * (g.currentFMV || g.fairMarketValue), 0),
      unvestedValue: grants.reduce((sum, g) => sum + g.unvestedUnits * (g.currentFMV || g.fairMarketValue), 0),
      totalPerquisiteValue: grants.reduce((sum, g) => sum + (g.perquisiteValue || 0), 0),
      totalTaxPaid: grants.reduce((sum, g) => sum + g.taxPaid, 0),
      companies: [...new Set(grants.map((g) => g.companyName))],
    }

    return c.json({ success: true, data: summary })
  } catch (error) {
    console.error('Error fetching ESOP summary:', error)
    return c.json({ success: false, error: 'Failed to fetch ESOP summary' }, 500)
  }
})

// GET /api/esop/:id - Get single ESOP grant with vesting schedule
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const grant = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
      include: {
        vestingEvents: {
          orderBy: { vestingDate: 'asc' },
        },
      },
    })

    if (!grant) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    // Calculate vesting progress
    const vestingProgress = {
      percentVested: grant.totalUnits > 0 ? (grant.vestedUnits / grant.totalUnits) * 100 : 0,
      percentExercised: grant.totalUnits > 0 ? (grant.exercisedUnits / grant.totalUnits) * 100 : 0,
      nextVestingEvent: grant.vestingEvents.find((e) => e.status === 'PENDING'),
      upcomingVestingValue: 0,
    }

    // Calculate upcoming vesting in next 12 months
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    vestingProgress.upcomingVestingValue = grant.vestingEvents
      .filter((e) => e.status === 'PENDING' && new Date(e.vestingDate) <= oneYearFromNow)
      .reduce((sum, e) => sum + e.unitsVested * (grant.currentFMV || grant.fairMarketValue), 0)

    return c.json({
      success: true,
      data: {
        ...grant,
        vestingProgress,
        currentValue: grant.totalUnits * (grant.currentFMV || grant.fairMarketValue),
        exercisableValue: grant.exercisableUnits * (grant.currentFMV || grant.fairMarketValue),
        inTheMoneyAmount:
          grant.exercisableUnits * ((grant.currentFMV || grant.fairMarketValue) - grant.grantPrice),
      },
    })
  } catch (error) {
    console.error('Error fetching ESOP grant:', error)
    return c.json({ success: false, error: 'Failed to fetch ESOP grant' }, 500)
  }
})

// POST /api/esop - Create ESOP grant
app.post('/', async (c) => {
  const userId = c.get('userId')

  try {
    const body = await c.req.json()

    const grant = await prisma.eSOPGrant.create({
      data: {
        userId,
        grantType: body.grantType || 'ESOP',
        grantDate: new Date(body.grantDate),
        grantNumber: body.grantNumber,
        companyName: body.companyName,
        companySymbol: body.companySymbol,
        totalUnits: body.totalUnits,
        grantPrice: body.grantPrice || 0,
        fairMarketValue: body.fairMarketValue,
        currentFMV: body.currentFMV || body.fairMarketValue,
        vestingScheduleType: body.vestingScheduleType || 'GRADED',
        vestingStartDate: new Date(body.vestingStartDate || body.grantDate),
        cliffMonths: body.cliffMonths || 12,
        totalVestingMonths: body.totalVestingMonths || 48,
        vestingFrequency: body.vestingFrequency || 12,
        unvestedUnits: body.totalUnits,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        postTerminationExercisePeriod: body.postTerminationExercisePeriod,
        isListedCompany: body.isListedCompany || false,
        isStartup: body.isStartup || false,
        startupDPIITNumber: body.startupDPIITNumber,
        planName: body.planName,
        notes: body.notes,
      },
    })

    // Generate vesting schedule
    if (body.generateVestingSchedule !== false) {
      await generateVestingSchedule(grant.id, {
        totalUnits: body.totalUnits,
        vestingScheduleType: body.vestingScheduleType || 'GRADED',
        vestingStartDate: new Date(body.vestingStartDate || body.grantDate),
        cliffMonths: body.cliffMonths || 12,
        totalVestingMonths: body.totalVestingMonths || 48,
        vestingFrequency: body.vestingFrequency || 12,
        grantPrice: body.grantPrice || 0,
        fairMarketValue: body.fairMarketValue,
      })
    }

    return c.json({ success: true, data: grant }, 201)
  } catch (error) {
    console.error('Error creating ESOP grant:', error)
    return c.json({ success: false, error: 'Failed to create ESOP grant' }, 500)
  }
})

// Helper function to generate vesting schedule
async function generateVestingSchedule(
  grantId: string,
  config: {
    totalUnits: number
    vestingScheduleType: string
    vestingStartDate: Date
    cliffMonths: number
    totalVestingMonths: number
    vestingFrequency: number
    grantPrice: number
    fairMarketValue: number
  }
) {
  const events: Array<{
    esopGrantId: string
    vestingDate: Date
    unitsVested: number
    vestingPercentage: number
    fmvAtVesting: number
    exercisePrice: number
    perquisiteValue: number
    status: string
  }> = []

  const vestingStart = new Date(config.vestingStartDate)

  if (config.vestingScheduleType === 'CLIFF') {
    // All units vest at cliff
    const cliffDate = new Date(vestingStart)
    cliffDate.setMonth(cliffDate.getMonth() + config.cliffMonths)

    events.push({
      esopGrantId: grantId,
      vestingDate: cliffDate,
      unitsVested: config.totalUnits,
      vestingPercentage: 100,
      fmvAtVesting: config.fairMarketValue,
      exercisePrice: config.grantPrice,
      perquisiteValue: (config.fairMarketValue - config.grantPrice) * config.totalUnits,
      status: 'PENDING',
    })
  } else if (config.vestingScheduleType === 'GRADED' || config.vestingScheduleType === 'HYBRID') {
    // Cliff period first (for HYBRID)
    let startMonth = config.vestingScheduleType === 'HYBRID' ? config.cliffMonths : 0
    const vestingPeriods = Math.floor(
      (config.totalVestingMonths - startMonth) / config.vestingFrequency
    )
    const unitsPerPeriod = config.totalUnits / vestingPeriods

    for (let i = 0; i < vestingPeriods; i++) {
      const vestingDate = new Date(vestingStart)
      vestingDate.setMonth(
        vestingDate.getMonth() + startMonth + (i + 1) * config.vestingFrequency
      )

      const percentage = ((i + 1) / vestingPeriods) * 100

      events.push({
        esopGrantId: grantId,
        vestingDate,
        unitsVested: unitsPerPeriod,
        vestingPercentage: 100 / vestingPeriods,
        fmvAtVesting: config.fairMarketValue,
        exercisePrice: config.grantPrice,
        perquisiteValue: (config.fairMarketValue - config.grantPrice) * unitsPerPeriod,
        status: 'PENDING',
      })
    }
  }

  // Create all vesting events
  if (events.length > 0) {
    await prisma.eSOPVestingEvent.createMany({
      data: events,
    })
  }

  return events
}

// PUT /api/esop/:id - Update ESOP grant
app.put('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    const body = await c.req.json()

    const grant = await prisma.eSOPGrant.update({
      where: { id },
      data: {
        companyName: body.companyName,
        companySymbol: body.companySymbol,
        currentFMV: body.currentFMV,
        vestedUnits: body.vestedUnits,
        exercisedUnits: body.exercisedUnits,
        exercisableUnits: body.exercisableUnits,
        unvestedUnits: body.unvestedUnits,
        forfeitedUnits: body.forfeitedUnits,
        status: body.status,
        perquisiteValue: body.perquisiteValue,
        taxPaid: body.taxPaid,
        notes: body.notes,
        lastUpdated: new Date(),
      },
    })

    return c.json({ success: true, data: grant })
  } catch (error) {
    console.error('Error updating ESOP grant:', error)
    return c.json({ success: false, error: 'Failed to update ESOP grant' }, 500)
  }
})

// DELETE /api/esop/:id - Delete ESOP grant
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    await prisma.eSOPGrant.delete({
      where: { id },
    })

    return c.json({ success: true, message: 'ESOP grant deleted' })
  } catch (error) {
    console.error('Error deleting ESOP grant:', error)
    return c.json({ success: false, error: 'Failed to delete ESOP grant' }, 500)
  }
})

// POST /api/esop/:id/vest - Process vesting event
app.post('/:id/vest', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const grant = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
    })

    if (!grant) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    const body = await c.req.json()
    const vestingEventId = body.vestingEventId

    // Get the vesting event
    const vestingEvent = await prisma.eSOPVestingEvent.findFirst({
      where: { id: vestingEventId, esopGrantId: id },
    })

    if (!vestingEvent) {
      return c.json({ success: false, error: 'Vesting event not found' }, 404)
    }

    if (vestingEvent.status !== 'PENDING') {
      return c.json({ success: false, error: 'Vesting event already processed' }, 400)
    }

    // Update vesting event
    const fmvAtVesting = body.fmvAtVesting || grant.currentFMV || grant.fairMarketValue
    const perquisiteValue = (fmvAtVesting - grant.grantPrice) * vestingEvent.unitsVested

    await prisma.eSOPVestingEvent.update({
      where: { id: vestingEventId },
      data: {
        status: 'VESTED',
        fmvAtVesting,
        perquisiteValue,
        taxableAmount: perquisiteValue,
        tdsDeducted: body.tdsDeducted || 0,
      },
    })

    // Update grant totals
    const newVestedUnits = grant.vestedUnits + vestingEvent.unitsVested
    const newExercisableUnits = grant.exercisableUnits + vestingEvent.unitsVested
    const newUnvestedUnits = grant.unvestedUnits - vestingEvent.unitsVested

    let newStatus = grant.status
    if (newUnvestedUnits <= 0) {
      newStatus = 'FULLY_VESTED'
    } else if (newVestedUnits > 0) {
      newStatus = 'PARTIALLY_VESTED'
    }

    await prisma.eSOPGrant.update({
      where: { id },
      data: {
        vestedUnits: newVestedUnits,
        exercisableUnits: newExercisableUnits,
        unvestedUnits: newUnvestedUnits,
        status: newStatus,
        perquisiteValue: { increment: perquisiteValue },
        lastUpdated: new Date(),
      },
    })

    return c.json({
      success: true,
      data: {
        message: `${vestingEvent.unitsVested} units vested successfully`,
        vestedUnits: newVestedUnits,
        exercisableUnits: newExercisableUnits,
        perquisiteValue,
      },
    })
  } catch (error) {
    console.error('Error processing vesting:', error)
    return c.json({ success: false, error: 'Failed to process vesting' }, 500)
  }
})

// POST /api/esop/:id/exercise - Exercise options
app.post('/:id/exercise', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const grant = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
    })

    if (!grant) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    const body = await c.req.json()
    const unitsToExercise = body.units

    if (unitsToExercise > grant.exercisableUnits) {
      return c.json({
        success: false,
        error: `Only ${grant.exercisableUnits} units are exercisable`,
      }, 400)
    }

    const salePrice = body.salePrice || grant.currentFMV || grant.fairMarketValue
    const exerciseCost = unitsToExercise * grant.grantPrice
    const saleProceeds = unitsToExercise * salePrice
    const profit = saleProceeds - exerciseCost

    // Update grant
    await prisma.eSOPGrant.update({
      where: { id },
      data: {
        exercisedUnits: { increment: unitsToExercise },
        exercisableUnits: { decrement: unitsToExercise },
        status: grant.exercisedUnits + unitsToExercise >= grant.totalUnits ? 'EXERCISED' : grant.status,
        lastUpdated: new Date(),
      },
    })

    // Find and update pending vesting events to mark as exercised
    const vestingEvents = await prisma.eSOPVestingEvent.findMany({
      where: {
        esopGrantId: id,
        status: 'VESTED',
        isExercised: false,
      },
      orderBy: { vestingDate: 'asc' },
    })

    let remainingUnits = unitsToExercise
    for (const event of vestingEvents) {
      if (remainingUnits <= 0) break

      const unitsFromThisEvent = Math.min(remainingUnits, event.unitsVested - (event.unitsExercised || 0))

      await prisma.eSOPVestingEvent.update({
        where: { id: event.id },
        data: {
          isExercised: unitsFromThisEvent >= event.unitsVested,
          exerciseDate: new Date(),
          unitsExercised: (event.unitsExercised || 0) + unitsFromThisEvent,
          salePrice,
          status: unitsFromThisEvent >= event.unitsVested ? 'EXERCISED' : event.status,
        },
      })

      remainingUnits -= unitsFromThisEvent
    }

    return c.json({
      success: true,
      data: {
        message: `${unitsToExercise} units exercised successfully`,
        exerciseCost,
        saleProceeds,
        profit,
        taxImplication: {
          shortTermCapitalGains: profit, // If sold within 24 months of vesting
          taxRate: '15% (listed) or 20% (unlisted)',
          note: 'Tax depends on holding period from vesting date',
        },
      },
    }, 201)
  } catch (error) {
    console.error('Error exercising options:', error)
    return c.json({ success: false, error: 'Failed to exercise options' }, 500)
  }
})

// GET /api/esop/:id/vesting-schedule - Get vesting schedule
app.get('/:id/vesting-schedule', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const grant = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
    })

    if (!grant) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    const vestingEvents = await prisma.eSOPVestingEvent.findMany({
      where: { esopGrantId: id },
      orderBy: { vestingDate: 'asc' },
    })

    // Group by status
    const schedule = {
      pending: vestingEvents.filter((e) => e.status === 'PENDING'),
      vested: vestingEvents.filter((e) => e.status === 'VESTED'),
      exercised: vestingEvents.filter((e) => e.status === 'EXERCISED'),
      expired: vestingEvents.filter((e) => e.status === 'EXPIRED'),
      forfeited: vestingEvents.filter((e) => e.status === 'FORFEITED'),
    }

    // Next vesting
    const nextVesting = vestingEvents.find((e) => e.status === 'PENDING')

    // Upcoming vestings in next 12 months
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    const upcomingVestings = vestingEvents.filter(
      (e) => e.status === 'PENDING' && new Date(e.vestingDate) <= oneYearFromNow
    )

    return c.json({
      success: true,
      data: {
        totalEvents: vestingEvents.length,
        schedule,
        nextVesting: nextVesting
          ? {
              date: nextVesting.vestingDate,
              units: nextVesting.unitsVested,
              value: nextVesting.unitsVested * (grant.currentFMV || grant.fairMarketValue),
              daysUntil: Math.ceil(
                (new Date(nextVesting.vestingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              ),
            }
          : null,
        upcomingVestings: {
          count: upcomingVestings.length,
          totalUnits: upcomingVestings.reduce((sum, e) => sum + e.unitsVested, 0),
          totalValue:
            upcomingVestings.reduce((sum, e) => sum + e.unitsVested, 0) *
            (grant.currentFMV || grant.fairMarketValue),
          events: upcomingVestings,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching vesting schedule:', error)
    return c.json({ success: false, error: 'Failed to fetch vesting schedule' }, 500)
  }
})

// PUT /api/esop/:id/fmv - Update current FMV
app.put('/:id/fmv', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const existing = await prisma.eSOPGrant.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ success: false, error: 'ESOP grant not found' }, 404)
    }

    const body = await c.req.json()

    await prisma.eSOPGrant.update({
      where: { id },
      data: {
        currentFMV: body.currentFMV,
        lastUpdated: new Date(),
      },
    })

    // Calculate updated values
    const currentValue = existing.totalUnits * body.currentFMV
    const vestedValue = existing.vestedUnits * body.currentFMV
    const unrealizedGain = existing.exercisableUnits * (body.currentFMV - existing.grantPrice)

    return c.json({
      success: true,
      data: {
        message: 'FMV updated successfully',
        currentFMV: body.currentFMV,
        currentValue,
        vestedValue,
        unrealizedGain,
      },
    })
  } catch (error) {
    console.error('Error updating FMV:', error)
    return c.json({ success: false, error: 'Failed to update FMV' }, 500)
  }
})

export default app
