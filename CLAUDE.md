# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FIREKaro is an Indian financial planning SPA built with Vue 3 + Vite + Vuetify 3. It helps users track income, expenses, investments, liabilities, and plan for FIRE (Financial Independence, Retire Early).

## Clarification Workflow

For ambiguous or underspecified tasks, ask clarifying questions before proceeding. Do NOT apply this to clear, straightforward requests.

### When to Clarify
Ask questions when you lack confidence about:
- **Scope**: What exactly needs to change or be built
- **Affected files**: Which files/components will be modified
- **Expected outcome**: What the end result should look like or do

Guiding principle: Be confident enough to complete the task without making assumptions about user intent.

### How to Clarify
1. **Estimate**: State the expected number of questions upfront (e.g., "I have 3 questions")
2. **Progressive**: Ask one question at a time, starting with the most critical
3. **Options**: Provide 2-4 concrete options for each question (reduces cognitive load)
   - Always include your recommendation with rationale
   - User can always provide a custom answer beyond the listed options
4. **Research**: Before recommending, search the internet for best practices and standards
5. **Adapt**: After each answer, check relevant code/docs, then reassess remaining questions

### Question Format
```
**Question N of M:**
[Clear, specific question]

**Options:**
- A) Option one
- B) Option two
- C) Option three (if needed)

**My Recommendation:** Option [X] - [reason based on best practices/standards]
```

### Limits
- **Soft limit**: Aim for 3 questions maximum; prioritize the most important uncertainties
- **User override**: Respect phrases like "just proceed", "use your judgment", or "skip questions" to bypass clarification

### Skip Clarification For
- Simple, unambiguous tasks (typo fixes, single-line changes)
- Tasks with explicit, detailed instructions
- When the user says to proceed or use judgment

## Architecture

- **Frontend**: Vue 3 SPA (port 5173) - proxies `/api/*` to backend
- **Backend**: Hono + Prisma + Better Auth (port 3000) in `server/` folder
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Better Auth (session-based, email/password)
- **State**: Pinia stores (`user.ts`, `ui.ts`) + TanStack Vue Query for server state
- **Styling**: Vuetify 3 with ProjectionLab-inspired theme (light/dark)
- **Forms**: VeeValidate + Zod schemas
- **API Types**: OpenAPI spec (`@hono/zod-openapi`) + `openapi-typescript` for type generation
- **Dev Mode**: Auth bypass enabled when `DEV_BYPASS_AUTH=true` or when backend auth check fails (returns mock user)

### Dashboard Sections (9 total)
`salary` | `non-salary-income` | `tax-planning` | `expenses` | `investments` | `liabilities` | `protection` | `financial-health` | `fire-goals`

## Commands

```bash
# Development
npm run dev          # Start frontend (5173) + backend (3000) concurrently
npm run dev:frontend # Start Vite dev server only
npm run dev:backend  # Start Hono server only (tsx watch)

# Build & Quality
npm run build        # TypeScript check + Vite build
npm run type-check   # TypeScript validation only
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting

# Testing
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests (headed Chrome)
npm run test:e2e:ui  # Playwright with UI mode

# Database (Prisma)
npm run db:generate  # Generate Prisma client from schema
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database (no migration)
npm run db:studio    # Open Prisma Studio GUI

# Run single unit test
npm run test:unit -- src/utils/chartTheme.spec.ts
npm run test:unit -- --grep "test name pattern"

# Run single E2E test
npm run test:e2e -- e2e/tests/salary/01-navigation.spec.ts
npm run test:e2e -- --grep "test description"
```

## Code Organization

```
src/
├── composables/           # Vue Query hooks (useSalary, useExpenses, useInvestments, etc.)
├── components/            # Feature-specific components by section
├── pages/dashboard/       # 9 sections with ~50 total pages
├── stores/                # Pinia stores (user.ts, ui.ts)
├── plugins/               # Vuetify theme, Vue Query config
├── types/                 # Frontend-only TypeScript interfaces
└── utils/                 # Chart theme, formatters

server/
├── index.ts               # Hono app entry point (registers all routes)
├── lib/                   # prisma.ts, auth.ts
├── middleware/            # Auth middleware (session validation)
├── routes/                # 20+ route files (CRUD per domain)
└── services/              # Business logic (sync.service.ts)

prisma/schema.prisma       # Database models (~30 core models)
e2e/                       # Playwright tests (Page Object Model pattern)
```

### Backend Routes
Routes are organized by domain. Each file in `server/routes/` exports a Hono app:
- **Salary**: `salary.ts`, `salary-history.ts`, `salary-components.ts`, `income-sources.ts`
- **Investments**: `investments.ts`, `epf.ts`, `ppf.ts`, `nps.ts`, `esop.ts`, `investment-reports.ts`
- **Non-Salary Income**: `business-income.ts`, `rental-income.ts`, `capital-gains.ts`, `interest-income.ts`, `dividend-income.ts`, `other-income.ts`
- **Expenses**: `expenses.ts`, `budgets.ts`, `expenses-ai.ts`, `expense-rules.ts`
- **Other**: `alerts.ts`

### Backend Route Pattern (Hono + Zod)
```typescript
// server/routes/expenses.ts - Standard CRUD route structure
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()
app.use('*', authMiddleware)  // All routes require auth

const inputSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  // ... other fields
})

// GET / - List with filters
app.get('/', async (c) => {
  const userId = c.get('userId')  // From auth middleware
  const items = await prisma.expense.findMany({ where: { userId } })
  return c.json(items)
})

// POST / - Create
app.post('/', zValidator('json', inputSchema), async (c) => {
  const userId = c.get('userId')
  const data = c.req.valid('json')
  const item = await prisma.expense.create({ data: { ...data, userId } })
  return c.json(item, 201)
})

export default app
```

## Key Patterns

### Data Fetching (Vue Query)
```typescript
// Queries with family view support (pattern used across composables)
export function useLoans() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['loans', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (uiStore.isFamilyView) params.set('familyView', 'true')
      if (uiStore.selectedFamilyMemberId) params.set('memberId', uiStore.selectedFamilyMemberId)
      const queryString = params.toString() ? `?${params.toString()}` : ''

      const res = await fetch(`/api/loans${queryString}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })
}

// Mutations should invalidate both direct queries AND summary/overview queries
export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => { /* POST /api/loans */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}
```

### Defensive Coding (Critical)
Many backend APIs are not yet implemented. Use these patterns to prevent runtime errors:

```typescript
// Always use optional chaining and nullish coalescing
const total = props.data?.reduce((a, b) => a + b, 0) ?? 0
const percent = `${(allocation?.equity ?? 0).toFixed(1)}%`

// Template guards
v-if="data?.items?.length"

// Handle NaN in computed properties
const yearsToFIRE = computed(() => {
  const years = calculateYears()
  return isNaN(years) || !isFinite(years) ? null : years
})

// Mock data fallback in composables when API returns 404
if (!res.ok) {
  return { defaultValue: 0, items: [] } // Return safe defaults
}
```

### Form Validation (VeeValidate + Zod)
```typescript
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
})

const { handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(schema),
})

const onSubmit = handleSubmit(async (values) => {
  await mutation.mutateAsync(values)
})
```

### INR Currency Formatting
```typescript
// Standard formatting - use utils/formatters.ts
formatINR(150000)         // "₹1,50,000"
formatINRCompact(10000000) // "1.00 Cr"
formatINRCompact(500000)   // "5.00 L"
```

### Component Styling
- Use Vuetify components (`v-card`, `v-btn`, `v-data-table`)
- Currency values: `class="text-currency"` (monospace font)
- Charts: Import from `@/utils/chartTheme` for consistent colors
- Icons: Material Design Icons (`mdi-*` prefix)
- Theme colors: `primary`, `secondary`, `success`, `warning`, `error`, `fire-orange`, `fire-green`

### Financial Year Handling
Indian financial year runs April-March. Use these utilities from `useSalary.ts`:
```typescript
getCurrentFinancialYear()           // "2025-26" (based on current date)
getFYMonthIndex(4, 2025, "2025-26") // 0 (April = index 0)
getCalendarMonthYear(0, "2025-26")  // { month: 4, year: 2025 }
```

### E2E Testing (Playwright)
Tests use Page Object Model pattern:
- `e2e/pages/base.page.ts` - Base class with common Vuetify helpers
- `e2e/tests/` - Test specs organized by section
- `e2e/fixtures/` - Test data per section
- `e2e/global-setup.ts` - Auth setup (stores session in `e2e/.auth/user.json`)

Playwright auto-starts the dev server before tests. Tests run in headed Chrome by default.

```typescript
// Common BasePage helpers available in all page objects
await page.navigateToDashboardSection('salary')
await page.selectFinancialYear('2025-26')
await page.clickSaveButton()
await page.expectSuccessMessage('Saved')
```

### Unit Testing (Vitest)
Unit tests are colocated with source files as `*.spec.ts`. Use for pure functions:
```typescript
// src/composables/useInvestments.spec.ts
import { describe, it, expect } from 'vitest'
import { calculatePPFMaturity, formatINR } from './useInvestments'

describe('PPF Maturity Calculator', () => {
  it('should calculate maturity with max contributions', () => {
    const result = calculatePPFMaturity({
      currentBalance: 0,
      yearlyDeposit: 150000,
      yearsRemaining: 15,
      interestRate: 7.1
    })
    expect(result.maturityValue).toBeGreaterThan(4000000)
  })
})
```

## Routing

Vue Router with file-based routing in `src/pages/`. Dashboard pages follow the pattern:
```
/dashboard/{section}/{page}
```

Legacy URL redirects should be added in `src/router/index.ts` when moving pages.

## Type Sharing Pattern

Currently, types are defined manually on both frontend and backend:
- Backend: Zod schemas in `server/routes/` validate requests
- Frontend: TypeScript interfaces in `src/types/` mirror backend shapes

For new features, define Zod schemas in routes and create matching frontend types. Eventually, this will be automated via OpenAPI generation.

## Environment Setup

Required environment variables in `.env`:
```
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
```

First-time setup:
```bash
npm install
npm run db:generate
npm run db:push      # or db:migrate for production
npm run dev
```

## Indian Financial Context

### Key Instruments
- **EPF**: Employee Provident Fund (8.25% interest, employer-matched)
- **PPF**: Public Provident Fund (7.1%, 15-year lock-in, ₹1.5L/year max)
- **NPS**: National Pension System (market-linked, 80CCD benefits)

### Tax Deduction Limits
- Section 80C: ₹1.5L (EPF, PPF, ELSS, etc.)
- Section 80CCD(1B): ₹50K additional (NPS)
- Section 80D: Health insurance premiums
- Section 24: ₹2L home loan interest

## Commit Convention

```bash
git commit -m "feat(section): description"
git commit -m "fix(section): description"
# Examples: feat(investments), fix(liabilities), feat(tax)
```

## Session Continuity

For detailed session context and current task status, see `NEXT-SESSION-PROMPT.md`. This file tracks recent changes, working/broken sections, and immediate priorities.

## Documentation

See `docs/` folder for detailed implementation plans per section:
- `Salary-Section-Plan.md`, `Non-Salary-Income-Plan.md`, `Tax-Planning-Section-Plan.md`
- `Expenses-Section-Plan.md`, `Investments-Section-Plan.md`, `Liabilities-Section-Plan.md`
- `Protection-Section-Plan.md`
- `STYLING-GUIDE.md` - UI patterns and Vuetify conventions
