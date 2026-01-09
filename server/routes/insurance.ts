import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

// ============================================================================
// ENUMS & SCHEMAS
// ============================================================================

const InsuranceTypeEnum = z.enum(['LIFE', 'HEALTH', 'MOTOR', 'HOME', 'TRAVEL'])
const PolicyStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'])
const PaymentFrequencyEnum = z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'])
const TaxBenefitEnum = z.enum(['SECTION_80C', 'SECTION_80D', 'BOTH', 'NONE'])

// Policy input schema
const policyInputSchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  policyName: z.string().min(1, 'Policy name is required'),
  type: InsuranceTypeEnum,
  provider: z.string().min(1, 'Provider is required'),
  status: PolicyStatusEnum.optional().default('ACTIVE'),
  sumAssured: z.number().positive('Sum assured must be positive'),
  premium: z.number().positive('Premium must be positive'),
  paymentFrequency: PaymentFrequencyEnum,
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  nextDueDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  lastPremiumPaidDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),

  // Life insurance specific
  maturityDate: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  maturityAmount: z.number().optional().nullable(),
  surrenderValue: z.number().optional().nullable(),
  loanAvailable: z.boolean().optional().default(false),
  loanAmount: z.number().optional().nullable(),

  // Health insurance specific
  coverType: z.string().optional().nullable(),
  roomRentLimit: z.number().optional().nullable(),
  copayPercent: z.number().optional().nullable(),
  waitingPeriod: z.number().int().optional().nullable(),
  preExistingWaiting: z.number().int().optional().nullable(),
  networkHospitals: z.number().int().optional().nullable(),

  // Motor insurance specific
  vehicleNumber: z.string().optional().nullable(),
  vehicleType: z.string().optional().nullable(),
  vehicleModel: z.string().optional().nullable(),
  idvValue: z.number().optional().nullable(),
  ncbPercent: z.number().optional().nullable(),

  // Home insurance specific
  propertyType: z.string().optional().nullable(),
  propertyAddress: z.string().optional().nullable(),
  propertyValue: z.number().optional().nullable(),
  contentsCover: z.number().optional().nullable(),

  // Tax & metadata
  taxBenefit: TaxBenefitEnum.optional().nullable(),
  policyDocument: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  familyMemberId: z.string().optional().nullable(),
})

// Nominee input schema
const nomineeInputSchema = z.object({
  name: z.string().min(1, 'Nominee name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  dateOfBirth: z.string().optional().nullable().transform((val) => val ? new Date(val) : null),
  sharePercent: z.number().min(0).max(100).default(100),
  isMinor: z.boolean().optional().default(false),
  appointeeName: z.string().optional().nullable(),
  appointeeRelation: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isPrimary: z.boolean().optional().default(true),
})

// ============================================================================
// POLICY ROUTES
// ============================================================================

// GET /api/insurance - List policies with optional filters
app.get('/', async (c) => {
  const userId = c.get('userId')
  const type = c.req.query('type')
  const status = c.req.query('status')
  const familyMemberId = c.req.query('familyMemberId')

  try {
    const whereClause: {
      userId: string
      type?: 'LIFE' | 'HEALTH' | 'MOTOR' | 'HOME' | 'TRAVEL'
      status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
      familyMemberId?: string | null
    } = { userId }

    if (type && ['LIFE', 'HEALTH', 'MOTOR', 'HOME', 'TRAVEL'].includes(type)) {
      whereClause.type = type as 'LIFE' | 'HEALTH' | 'MOTOR' | 'HOME' | 'TRAVEL'
    }

    if (status && ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'].includes(status)) {
      whereClause.status = status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING'
    }

    if (familyMemberId) {
      whereClause.familyMemberId = familyMemberId
    }

    const policies = await prisma.insurancePolicy.findMany({
      where: whereClause,
      include: {
        nominees: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform dates to ISO strings for frontend
    const transformedPolicies = policies.map((policy) => ({
      ...policy,
      startDate: policy.startDate.toISOString().split('T')[0],
      endDate: policy.endDate.toISOString().split('T')[0],
      nextDueDate: policy.nextDueDate?.toISOString().split('T')[0] || null,
      lastPremiumPaidDate: policy.lastPremiumPaidDate?.toISOString().split('T')[0] || null,
      maturityDate: policy.maturityDate?.toISOString().split('T')[0] || null,
      nominees: policy.nominees.map((n) => ({
        ...n,
        dateOfBirth: n.dateOfBirth?.toISOString().split('T')[0] || null,
      })),
    }))

    return c.json(transformedPolicies)
  } catch (error) {
    console.error('Error fetching insurance policies:', error)
    return c.json({ error: 'Failed to fetch insurance policies' }, 500)
  }
})

// GET /api/insurance/summary - Get aggregated summary
app.get('/summary', async (c) => {
  const userId = c.get('userId')

  try {
    const policies = await prisma.insurancePolicy.findMany({
      where: { userId, status: 'ACTIVE' },
    })

    const now = new Date()
    const sixtyDaysFromNow = new Date()
    sixtyDaysFromNow.setDate(now.getDate() + 60)

    // Calculate aggregates
    const lifePolicies = policies.filter((p) => p.type === 'LIFE')
    const healthPolicies = policies.filter((p) => p.type === 'HEALTH')

    const lifeCoverage = lifePolicies.reduce((sum, p) => sum + p.sumAssured, 0)
    const healthCoverage = healthPolicies.reduce((sum, p) => sum + p.sumAssured, 0)

    // Calculate annual premium
    const frequencyMultiplier: Record<string, number> = {
      MONTHLY: 12,
      QUARTERLY: 4,
      HALF_YEARLY: 2,
      YEARLY: 1,
    }

    const annualPremium = policies.reduce((sum, p) => {
      return sum + p.premium * (frequencyMultiplier[p.paymentFrequency] || 1)
    }, 0)

    // Find policies expiring in next 60 days
    const upcomingRenewals = policies.filter((p) => {
      return p.endDate >= now && p.endDate <= sixtyDaysFromNow
    })

    // Count by type
    const policiesByType = {
      life: lifePolicies.length,
      health: healthPolicies.length,
      motor: policies.filter((p) => p.type === 'MOTOR').length,
      home: policies.filter((p) => p.type === 'HOME').length,
      travel: policies.filter((p) => p.type === 'TRAVEL').length,
    }

    // Calculate tax deductions
    const section80C = policies
      .filter((p) => p.taxBenefit === 'SECTION_80C' || p.taxBenefit === 'BOTH')
      .reduce((sum, p) => sum + p.premium * (frequencyMultiplier[p.paymentFrequency] || 1), 0)

    const section80D = policies
      .filter((p) => p.taxBenefit === 'SECTION_80D' || p.taxBenefit === 'BOTH')
      .reduce((sum, p) => sum + p.premium * (frequencyMultiplier[p.paymentFrequency] || 1), 0)

    const summary = {
      totalPolicies: policies.length,
      lifeCoverage,
      healthCoverage,
      annualPremium,
      upcomingRenewals: upcomingRenewals.map((p) => ({
        id: p.id,
        policyName: p.policyName,
        type: p.type,
        endDate: p.endDate.toISOString().split('T')[0],
        premium: p.premium,
      })),
      policiesByType,
      taxDeductions: {
        section80C,
        section80D,
      },
    }

    return c.json(summary)
  } catch (error) {
    console.error('Error fetching insurance summary:', error)
    return c.json({ error: 'Failed to fetch insurance summary' }, 500)
  }
})

// GET /api/insurance/:id - Get single policy with nominees
app.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    const policy = await prisma.insurancePolicy.findFirst({
      where: { id, userId },
      include: { nominees: true },
    })

    if (!policy) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    return c.json({
      ...policy,
      startDate: policy.startDate.toISOString().split('T')[0],
      endDate: policy.endDate.toISOString().split('T')[0],
      nextDueDate: policy.nextDueDate?.toISOString().split('T')[0] || null,
      lastPremiumPaidDate: policy.lastPremiumPaidDate?.toISOString().split('T')[0] || null,
      maturityDate: policy.maturityDate?.toISOString().split('T')[0] || null,
      nominees: policy.nominees.map((n) => ({
        ...n,
        dateOfBirth: n.dateOfBirth?.toISOString().split('T')[0] || null,
      })),
    })
  } catch (error) {
    console.error('Error fetching insurance policy:', error)
    return c.json({ error: 'Failed to fetch insurance policy' }, 500)
  }
})

// POST /api/insurance - Create new policy
app.post('/', zValidator('json', policyInputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')

  try {
    const policy = await prisma.insurancePolicy.create({
      data: {
        ...data,
        userId,
      },
      include: { nominees: true },
    })

    return c.json(policy, 201)
  } catch (error) {
    console.error('Error creating insurance policy:', error)
    return c.json({ error: 'Failed to create insurance policy' }, 500)
  }
})

// PUT /api/insurance/:id - Update policy
app.put('/:id', zValidator('json', policyInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify ownership
    const existing = await prisma.insurancePolicy.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    const policy = await prisma.insurancePolicy.update({
      where: { id },
      data,
      include: { nominees: true },
    })

    return c.json(policy)
  } catch (error) {
    console.error('Error updating insurance policy:', error)
    return c.json({ error: 'Failed to update insurance policy' }, 500)
  }
})

// DELETE /api/insurance/:id - Delete policy
app.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  try {
    // Verify ownership
    const existing = await prisma.insurancePolicy.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    await prisma.insurancePolicy.delete({
      where: { id },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting insurance policy:', error)
    return c.json({ error: 'Failed to delete insurance policy' }, 500)
  }
})

// ============================================================================
// NOMINEE ROUTES
// ============================================================================

// GET /api/insurance/:id/nominees - List nominees for a policy
app.get('/:id/nominees', async (c) => {
  const userId = c.get('userId')
  const policyId = c.req.param('id')

  try {
    // Verify policy ownership
    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: policyId, userId },
    })

    if (!policy) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    const nominees = await prisma.insuranceNominee.findMany({
      where: { policyId },
      orderBy: { isPrimary: 'desc' },
    })

    return c.json(
      nominees.map((n) => ({
        ...n,
        dateOfBirth: n.dateOfBirth?.toISOString().split('T')[0] || null,
      }))
    )
  } catch (error) {
    console.error('Error fetching nominees:', error)
    return c.json({ error: 'Failed to fetch nominees' }, 500)
  }
})

// POST /api/insurance/:id/nominees - Add nominee to policy
app.post('/:id/nominees', zValidator('json', nomineeInputSchema), async (c) => {
  const userId = c.get('userId')
  const policyId = c.req.param('id')
  const data = c.req.valid('json')

  try {
    // Verify policy ownership
    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: policyId, userId },
    })

    if (!policy) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    const nominee = await prisma.insuranceNominee.create({
      data: {
        ...data,
        policyId,
      },
    })

    return c.json(nominee, 201)
  } catch (error) {
    console.error('Error creating nominee:', error)
    return c.json({ error: 'Failed to create nominee' }, 500)
  }
})

// PUT /api/insurance/:id/nominees/:nomineeId - Update nominee
app.put('/:id/nominees/:nomineeId', zValidator('json', nomineeInputSchema.partial()), async (c) => {
  const userId = c.get('userId')
  const policyId = c.req.param('id')
  const nomineeId = c.req.param('nomineeId')
  const data = c.req.valid('json')

  try {
    // Verify policy ownership
    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: policyId, userId },
    })

    if (!policy) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    // Verify nominee exists
    const existingNominee = await prisma.insuranceNominee.findFirst({
      where: { id: nomineeId, policyId },
    })

    if (!existingNominee) {
      return c.json({ error: 'Nominee not found' }, 404)
    }

    const nominee = await prisma.insuranceNominee.update({
      where: { id: nomineeId },
      data,
    })

    return c.json(nominee)
  } catch (error) {
    console.error('Error updating nominee:', error)
    return c.json({ error: 'Failed to update nominee' }, 500)
  }
})

// DELETE /api/insurance/:id/nominees/:nomineeId - Delete nominee
app.delete('/:id/nominees/:nomineeId', async (c) => {
  const userId = c.get('userId')
  const policyId = c.req.param('id')
  const nomineeId = c.req.param('nomineeId')

  try {
    // Verify policy ownership
    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: policyId, userId },
    })

    if (!policy) {
      return c.json({ error: 'Policy not found' }, 404)
    }

    // Verify nominee exists
    const existingNominee = await prisma.insuranceNominee.findFirst({
      where: { id: nomineeId, policyId },
    })

    if (!existingNominee) {
      return c.json({ error: 'Nominee not found' }, 404)
    }

    await prisma.insuranceNominee.delete({
      where: { id: nomineeId },
    })

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting nominee:', error)
    return c.json({ error: 'Failed to delete nominee' }, 500)
  }
})

export default app
