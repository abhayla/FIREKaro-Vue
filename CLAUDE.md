# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Continuity

**Check `NEXT-SESSION-PROMPT.md` at session start** for recent changes, uncommitted work, and priorities. This file is updated at the end of each session.

## Project Overview

FIREKaro is an Indian financial planning SPA built with Vue 3 + Vite + Vuetify 3. It helps users track income, expenses, investments, liabilities, and plan for FIRE (Financial Independence, Retire Early).

### Data & Scope Disclaimer

**FIREKaro is a personal financial planning tool, not a source of truth.**

- **User-provided data only**: All financial data (salary, investments, insurance, liabilities, etc.) must be manually entered by the user or synced from external sources. This app does not connect to banks, employers, or government systems.
- **Planning & tracking, not execution**: This app helps you visualize, plan, and track your FIRE journey. It does not facilitate income tax filing, investment transactions, insurance purchases, or any financial operations.
- **No financial advice**: All calculations, projections, and insights are based solely on user-provided data. Users should verify information against official sources (Form 16, CAS statements, policy documents) and consult qualified professionals for financial decisions.

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

### Path Aliases & Proxy
- Import alias: `@` resolves to `src/` (e.g., `import { formatINR } from '@/utils/formatters'`)
- API proxy: Frontend requests to `/api/*` are proxied to `http://localhost:3000` (configured in `vite.config.ts`)

### Dashboard Sections (9 total)
`salary` | `non-salary-income` | `tax-planning` | `expenses` | `investments` | `liabilities` | `insurance` | `financial-health` | `fire-goals`

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
├── routes/                # 29 route files (CRUD per domain)
└── services/              # Business logic (sync.service.ts)

prisma/schema.prisma       # Database models (~30 core models)
e2e/                       # Playwright tests (Page Object Model pattern)
```

### Backend Routes & API Paths
Routes are organized by domain. Each file in `server/routes/` exports a Hono app:

| Domain | Route Files | API Paths |
|--------|------------|-----------|
| **Auth** | Better Auth handles | `/api/auth/*` |
| **Health** | (inline in index.ts) | `/api/health` |
| **Salary** | `salary.ts`, `salary-history.ts`, `salary-components.ts`, `income-sources.ts` | `/api/salary`, `/api/salary-history`, `/api/salary-components`, `/api/income-sources` |
| **Investments** | `investments.ts`, `epf.ts`, `ppf.ts`, `nps.ts`, `esop.ts`, `investment-reports.ts` | `/api/investments`, `/api/epf`, `/api/ppf`, `/api/nps`, `/api/esop`, `/api/investment-reports` |
| **Family** | (via query params on most routes) | `?familyView=true&memberId=...` |
| **Non-Salary Income** | `business-income.ts`, `rental-income.ts`, `capital-gains.ts`, `interest-income.ts`, `dividend-income.ts`, `other-income.ts` | `/api/business-income`, `/api/rental-income`, `/api/capital-gains`, `/api/interest-income`, `/api/dividend-income`, `/api/other-income` |
| **Expenses** | `expenses.ts`, `budgets.ts`, `expenses-ai.ts`, `expense-rules.ts` | `/api/expenses`, `/api/budgets`, `/api/expenses/ai`, `/api/expense-rules` |
| **Tax Planning** | `advance-tax.ts`, `tax-scenarios.ts`, `tax-reports.ts` | `/api/advance-tax`, `/api/tax-planning/scenarios`, `/api/tax-planning/reports` |
| **Liabilities** | `loans.ts`, `credit-cards.ts`, `liabilities.ts`, `liabilities-reports.ts` | `/api/loans`, `/api/credit-cards`, `/api/liabilities`, `/api/liabilities/reports` |
| **Insurance** | `insurance.ts` | `/api/insurance` |
| **Other** | `alerts.ts` | `/api/alerts` |

### Frontend Composables
Main data-fetching composables in `src/composables/`:
- `useSalary.ts` - Salary, income sources, salary history
- `useIncome.ts` - All non-salary income types
- `useExpenses.ts` - Expenses, budgets, AI categorization
- `useInvestments.ts` - All investment types (EPF, PPF, NPS, ESOP, etc.)
- `useLiabilities.ts` - Loans, credit cards, liabilities overview
- `useInsurance.ts` - Insurance policies
- `useTax.ts` - Tax scenarios, advance tax, tax reports
- `useFinancialHealth.ts` - Aggregated financial health metrics
- `useFIRE.ts` - FIRE goal calculations and projections

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
Timeouts: 60s test, 15s expect, 15s action, 30s navigation.

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

## Documentation

Key docs in `docs/` folder:
- **Section Plans** (`*-Section-Plan.md`) - Feature requirements and implementation details per dashboard section
- **STYLING-GUIDE.md** - UI patterns, Vuetify conventions, theme usage
- **Parallel-Implementation-Guide.md** - Multi-section workflow coordination

## Development Workflow

### Adding a New Feature
1. Check relevant `docs/*-Section-Plan.md` for requirements
2. Add Prisma model if needed → `npm run db:push`
3. Create route in `server/routes/` → register in `server/index.ts`
4. Create/update composable in `src/composables/`
5. Add page/components in `src/pages/dashboard/{section}/`
6. Add E2E tests in `e2e/tests/{section}/`

### Testing a Backend Route
```bash
# Start the dev server
npm run dev

# In another terminal, test endpoints
curl http://localhost:3000/api/health
curl -b cookies.txt http://localhost:3000/api/salary
```

### Debug Mode
The app runs with `DEV_BYPASS_AUTH=true` in development, so auth is bypassed and a mock user is returned. This allows testing without logging in.
