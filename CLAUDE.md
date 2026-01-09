# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status (Updated: January 9, 2026)

**All 4 development streams have been merged to master.** The application is functional but has several critical issues:

### Critical Issues to Fix
| Section | Issue | Priority |
|---------|-------|----------|
| Expenses | JS Error: `reduce is not a function` | P0 |
| Investments | JS Error: `toFixed on undefined` | P0 |
| Tax Planning | JS Error: `length on undefined` | P0 |
| Financial Health | API 404 errors | P0 |
| FIRE & Goals | "Time to FIRE" shows NaN | P1 |

### Working Sections
- Salary (all tabs functional)
- Liabilities (well-styled)
- FIRE & Goals (mostly working, except NaN issue)

### Reference
- See `docs/STYLING-AUDIT-REPORT.md` for full audit findings
- See `NEXT-SESSION-PROMPT.md` for detailed continuation context

---

## Project Overview

FIREKaro is a comprehensive Indian financial planning SPA built with Vue 3 + Vite + Vuetify 3. It helps users track income, expenses, investments, liabilities, and plan for FIRE (Financial Independence, Retire Early).

## Architecture

- **Frontend**: Vue 3 SPA (port 5173)
- **Backend**: Hono + Prisma + Better Auth (port 3000) - in `server/` folder
- **Database**: PostgreSQL with Prisma ORM (`firekaro_vue` database)
- **Auth**: Better Auth (session-based, email/password)
- **State**: Pinia stores (`user.ts`, `ui.ts`) + TanStack Vue Query for server state
- **Styling**: Vuetify 3 with ProjectionLab-inspired theme (light/dark)
- **Forms**: VeeValidate + Zod schemas for validation
- **API Types**: OpenAPI spec (`@hono/zod-openapi`) + `openapi-typescript` for type generation
- **Dev Mode**: Auth is bypassed when no authenticated session (see `router/index.ts`)

### Important: This is NOT the Next.js Project

This project (`FIREKaro-Vue`) has its own Hono backend in the `server/` folder.
Do NOT reference the old Next.js project (`FIREKaro/`) for API development.

| Aspect | Old Project (FIREKaro) | Current Project (FIREKaro-Vue) |
|--------|------------------------|--------------------------------|
| Frontend | Next.js (React) | Vue 3 + Vite + Vuetify 3 |
| Backend | Next.js API Routes | Hono + Prisma |
| Auth | NextAuth | Better Auth |
| Location | `D:\Abhay\VibeCoding\FIREKaro` | `D:\Abhay\VibeCoding\FIREKaro-Vue` |
| Status | Legacy (reference only) | **Active development** |

> **Note**: Historical docs (`docs/Parallel-Implementation-Guide.md`) may reference Next.js. These are kept for reference but do not reflect the current architecture.

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

# API Type Generation
npm run generate:api-types  # Generate TypeScript types from OpenAPI spec
```

## Code Organization

```
src/                       # Frontend (Vue 3)
├── composables/           # Vue Query hooks (use generated types)
├── components/            # Feature-specific components organized by section
├── generated/             # Auto-generated API types (DO NOT EDIT)
│   └── api-types.d.ts     # TypeScript types from OpenAPI spec
├── pages/dashboard/       # 9 sections with ~50 total pages
├── stores/                # Pinia stores (user session, UI state)
├── plugins/               # Vuetify theme, Vue Query config
├── types/                 # Frontend-only TypeScript interfaces
└── utils/                 # Chart theme, formatters

server/                    # Backend (Hono) - ACTIVE DEVELOPMENT
├── index.ts               # Hono app entry point
├── openapi/               # Generated OpenAPI spec
│   └── spec.yaml          # API contract (source of truth)
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   └── auth.ts            # Better Auth configuration
├── middleware/
│   └── auth.ts            # Auth middleware (session validation)
├── routes/                # API routes with @hono/zod-openapi
│   ├── salary.ts          # GET /api/salary/current
│   ├── salary-history.ts  # CRUD + sync for salary records
│   └── income-sources.ts  # Multi-employer support
└── services/
    └── sync.service.ts    # EPF/NPS sync logic

prisma/
└── schema.prisma          # Database models (~30 core models)

scripts/
└── generate-api-types.ts  # OpenAPI → TypeScript generation
```

## UI/API Layer Separation

This project follows **OpenAPI-first** design for clean separation between frontend and backend.

### Type Generation Workflow

```bash
# 1. Backend defines routes with @hono/zod-openapi (Zod schemas → OpenAPI)
# 2. OpenAPI spec is auto-generated to server/openapi/spec.yaml
# 3. Run type generation
npm run generate:api-types

# 4. Frontend imports generated types
import type { SalaryHistoryRecord } from '@/generated/api-types'
```

### Best Practices

1. **Never duplicate types** - Always import from `@/generated/api-types`
2. **Backend owns the contract** - API changes start in `server/routes/`
3. **Regenerate on changes** - Run `npm run generate:api-types` after API changes
4. **Type-safe composables** - Use generated types in Vue Query hooks

```typescript
// Good: Use generated types
import type { SalaryHistoryRecord } from '@/generated/api-types'
export function useSalaryHistory() {
  return useQuery<SalaryHistoryRecord[]>({ ... })
}

// Bad: Don't duplicate types in composables
interface SalaryHistoryRecord { ... } // DON'T DO THIS
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
      const res = await fetch(`/api/loans${buildQueryParams()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })
}

// Mutations with cache invalidation (invalidate related queries)
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
// Pattern: Mutations should invalidate both direct queries AND summary/overview queries
```

### INR Currency Formatting
```typescript
// Standard formatting
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
// 150000 → "₹1,50,000"

// Compact formatting (lakhs/crores)
formatINRCompact(10000000)  // "1.00 Cr"
formatINRCompact(500000)    // "5.00 L"
formatINRCompact(5000)      // "5.0K"
```

### Component Styling
- Use Vuetify components (`v-card`, `v-btn`, `v-data-table`)
- Currency values: `class="text-currency"` (monospace font)
- Charts: Import from `@/utils/chartTheme` for consistent colors and options
- Icons: Material Design Icons (`mdi-*` prefix)
- Theme colors: `primary`, `secondary`, `success`, `warning`, `error`, `fire-orange`, `fire-green`
- Form fields use `variant="outlined" density="comfortable"` by default (configured in Vuetify plugin)

### E2E Testing (Playwright)
Tests use Page Object Model pattern. Structure:
- `e2e/pages/` - Page objects per section (extend `BasePage`)
- `e2e/tests/` - Test specs organized by section
- `e2e/fixtures/` - Test data per section
- `e2e/global-setup.ts` - Auth setup (stores session in `e2e/.auth/user.json`)

Playwright auto-starts the dev server before tests. Tests run in headed Chrome by default.

```typescript
// e2e/pages/salary/overview.page.ts
export class SalaryOverviewPage extends BasePage {
  async navigate() { await this.page.goto('/dashboard/salary') }
  async clickAddSalary() { /* ... */ }
}

// e2e/tests/salary/01-navigation.spec.ts
test('can navigate to salary page', async ({ page }) => {
  const salaryPage = new SalaryOverviewPage(page)
  await salaryPage.navigate()
})
```

## Dashboard Sections

| Section | Route | Composable |
|---------|-------|------------|
| Salary | `/dashboard/salary/*` | `useSalary.ts` |
| Non-Salary Income | `/dashboard/non-salary-income/*` | `useIncome.ts` |
| Tax Planning | `/dashboard/tax-planning/*` | `useTax.ts` |
| Expenses | `/dashboard/expenses/*` | `useExpenses.ts` |
| Investments | `/dashboard/investments/*` | `useInvestments.ts` |
| Liabilities | `/dashboard/liabilities/*` | `useLiabilities.ts` |
| Protection | `/dashboard/protection/*` | `useProtection.ts` |
| Financial Health | `/dashboard/financial-health/*` | `useFinancialHealth.ts` |
| FIRE & Goals | `/dashboard/fire-goals/*` | `useFIRE.ts` |

## API Endpoints (Backend)

### Authentication (Better Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email/password |
| POST | `/api/auth/sign-in/email` | Sign in with email/password |
| POST | `/api/auth/sign-out` | Sign out (clear session) |
| GET | `/api/auth/get-session` | Get current session |

### Salary (Implemented)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salary/current` | Get current salary breakdown |
| GET | `/api/salary-history` | List salary history (FY filter) |
| POST | `/api/salary-history` | Add salary record |
| PUT | `/api/salary-history/:id` | Update salary record |
| DELETE | `/api/salary-history/:id` | Delete salary record |
| POST | `/api/salary-history/:id/sync` | Sync to EPF/NPS accounts |
| DELETE | `/api/salary-history/:id/sync` | Reset sync status |
| GET | `/api/income-sources` | List employers |
| POST | `/api/income-sources` | Create employer |

## Indian Financial Context

### Retirement Instruments
- **EPF**: Employee Provident Fund (8.25% interest, employer-matched)
- **PPF**: Public Provident Fund (7.1%, 15-year lock-in, ₹1.5L/year max)
- **NPS**: National Pension System (market-linked, 80CCD benefits)

### Tax Deduction Limits
- Section 80C: ₹1.5L (EPF, PPF, ELSS, etc.)
- Section 80CCD(1B): ₹50K additional (NPS)
- Section 80D: Health insurance premiums
- Section 24: ₹2L home loan interest

### Debt Payoff Strategies
- **Snowball**: Smallest balance first
- **Avalanche**: Highest interest first

## Commit Convention

```bash
git commit -m "feat(section): description"
git commit -m "fix(section): description"
# Examples: feat(investments), fix(liabilities), feat(tax)
```

## Documentation

See `docs/` folder for detailed implementation plans per section.
