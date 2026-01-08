# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FIREKaro is a comprehensive Indian financial planning SPA built with Vue 3 + Vite + Vuetify 3. It helps users track income, expenses, investments, liabilities, and plan for FIRE (Financial Independence, Retire Early).

## Architecture

- **Frontend**: Vue 3 SPA (port 5173)
- **Backend**: Next.js API (port 3000) - proxied via Vite, DO NOT modify
- **State**: Pinia stores (`user.ts`, `ui.ts`) + TanStack Vue Query for server state
- **Styling**: Vuetify 3 with ProjectionLab-inspired theme (light/dark)

## Commands

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # TypeScript check + Vite build
npm run type-check   # TypeScript validation only
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
```

## Code Organization

```
src/
├── composables/     # Vue Query hooks (useInvestments, useLiabilities, etc.)
├── components/      # Feature-specific components organized by section
├── pages/dashboard/ # 9 sections with ~50 total pages
├── stores/          # Pinia stores (user session, UI state)
├── plugins/         # Vuetify theme, Vue Query config
├── types/           # TypeScript interfaces
└── utils/           # Chart theme, formatters
```

## Key Patterns

### Data Fetching (Vue Query)
```typescript
// Queries
export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const res = await fetch('/api/loans')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })
}

// Mutations with cache invalidation
export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => { /* POST /api/loans */ },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loans'] })
  })
}
```

### INR Currency Formatting
```typescript
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
// 150000 → "₹1,50,000"
```

### Component Styling
- Use Vuetify components (`v-card`, `v-btn`, `v-data-table`)
- Currency values: `class="text-currency"` (monospace font)
- Charts: Import from `@/utils/chartTheme` for consistent colors
- Icons: Material Design Icons (`mdi-*` prefix)

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
