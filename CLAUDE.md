# CLAUDE.md - FIREKaro Vue 3 SPA (Stream 1)

## Project Overview

This is **Stream 1** of the FIREKaro Vue 3 SPA migration, focusing on:
- **Salary Section** (~3 days)
- **Non-Salary Income Section** (~5 days)
- **Tax Planning Section** (~4 days) - depends on Salary & Non-Salary

### Architecture
- **Frontend**: Vue 3 + Vite + Vuetify 3 (SPA) - Port 5173
- **Backend**: Next.js API (unchanged) - Port 3000
- **API Proxy**: Vite proxies `/api/*` to `http://localhost:3000`

## Commands

```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
```

## Branch

```bash
git branch           # Should show: feature/vue-income-tax
```

## API Endpoints (Already Exist - DO NOT Modify)

### Salary
- `GET /api/salary/current` - Current salary breakdown
- `GET /api/salary-history` - Salary history list
- `POST /api/salary-history` - Add salary record
- `PUT /api/salary-history/:id` - Update salary record
- `DELETE /api/salary-history/:id` - Delete salary record

### Non-Salary Income
- `GET /api/income-sources` - List all income sources
- `POST /api/income-sources` - Create income source
- `PUT /api/income-sources/:id` - Update income source
- `DELETE /api/income-sources/:id` - Delete income source
- `GET /api/business-income` - Business income details
- `POST /api/business-income` - Add business income
- `GET /api/rental-income` - Rental income
- `POST /api/rental-income` - Add rental income
- `GET /api/capital-gains` - Capital gains
- `POST /api/capital-gains` - Add capital gains
- `GET /api/other-income` - Other income sources

### Tax Planning
- `GET /api/tax-planning/calculate` - Calculate tax
- `GET /api/tax-planning/comparison` - Old vs New regime comparison
- `GET /api/tax/deductions` - List deductions
- `POST /api/tax/deductions` - Add deduction
- `GET /api/tax/exemptions` - List exemptions

## File Structure to Create

### Salary Section
```
src/
├── composables/
│   └── useSalary.ts              # Vue Query hooks
├── components/salary/
│   ├── SalaryBreakdownCard.vue   # Salary components breakdown
│   ├── SalaryHistoryTable.vue    # History data table
│   ├── SalaryHistoryForm.vue     # Add/edit salary modal
│   ├── SalaryChart.vue           # Salary trend chart
│   └── SalaryComparisonCard.vue  # YoY comparison
└── pages/dashboard/salary/
    ├── index.vue                 # Overview (update stub)
    ├── current.vue               # Current breakdown (update stub)
    ├── history.vue               # Salary history (update stub)
    └── reports.vue               # Reports (update stub)
```

### Non-Salary Income Section
```
src/
├── composables/
│   └── useIncome.ts              # Vue Query hooks
├── components/income/
│   ├── IncomeSourceCard.vue      # Income source card
│   ├── IncomeSourceForm.vue      # Add/edit income source
│   ├── BusinessIncomeForm.vue    # 44AD/44ADA form
│   ├── RentalIncomeForm.vue      # House property form
│   ├── CapitalGainsCalculator.vue # STCG/LTCG calculator
│   ├── OtherIncomeForm.vue       # Interest, dividends, etc.
│   └── IncomeSummaryChart.vue    # Income breakdown chart
└── pages/dashboard/non-salary-income/
    ├── index.vue                 # Overview (update stub)
    ├── business.vue              # Business income (update stub)
    ├── rental.vue                # Rental income (update stub)
    ├── capital-gains.vue         # Capital gains (update stub)
    ├── other.vue                 # Other sources (update stub)
    └── reports.vue               # Reports (update stub)
```

### Tax Planning Section
```
src/
├── composables/
│   └── useTax.ts                 # Vue Query hooks
├── components/tax/
│   ├── TaxRegimeSelector.vue     # Old/New regime toggle
│   ├── TaxComparisonCard.vue     # Regime comparison
│   ├── TaxBreakdownTable.vue     # Tax calculation breakdown
│   ├── DeductionsOptimizer.vue   # 80C/80D optimizer
│   ├── DeductionCategory.vue     # Single deduction category
│   ├── TaxSavingsRecommendations.vue
│   └── ITRFormSuggestion.vue     # ITR-1/2/3/4 suggestion
└── pages/dashboard/tax-planning/
    ├── index.vue                 # Overview (update stub)
    ├── calculator.vue            # Tax calculator (update stub)
    ├── deductions.vue            # Deductions (update stub)
    └── reports.vue               # Reports (update stub)
```

## Key Patterns

### Vue Query Data Fetching
```typescript
// src/composables/useSalary.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export function useCurrentSalary() {
  return useQuery({
    queryKey: ['salary', 'current'],
    queryFn: async () => {
      const res = await fetch('/api/salary/current')
      if (!res.ok) throw new Error('Failed to fetch salary')
      return res.json()
    }
  })
}

export function useSalaryHistory() {
  return useQuery({
    queryKey: ['salary', 'history'],
    queryFn: async () => {
      const res = await fetch('/api/salary-history')
      if (!res.ok) throw new Error('Failed to fetch salary history')
      return res.json()
    }
  })
}
```

### INR Formatting
```typescript
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
```

### Vuetify Components
| Use Case | Component |
|----------|-----------|
| Cards | `<v-card>`, `<v-card-title>`, `<v-card-text>` |
| Buttons | `<v-btn>` |
| Forms | `<v-text-field>`, `<v-select>`, `<v-autocomplete>` |
| Tables | `<v-data-table>` |
| Dialogs | `<v-dialog>` |
| Progress | `<v-progress-linear>`, `<v-progress-circular>` |
| Alerts | `<v-alert>` |
| Chips | `<v-chip>` |
| Icons | `<v-icon>` with mdi-* names |

## Indian Tax Context

### Financial Year
- April to March (not calendar year)
- Month 1 = April, Month 12 = March

### Tax Regimes
- **Old Regime**: Deductions allowed (80C, 80D, HRA, etc.)
- **New Regime**: Lower rates, no deductions, ₹75K standard deduction

### Key Limits
- Section 80C: ₹1,50,000
- Section 80D (Health): ₹25,000 (₹50,000 for seniors)
- NPS 80CCD(1B): ₹50,000 additional
- Standard Deduction (New): ₹75,000

### ITR Forms
- **ITR-1 (Sahaj)**: Salary + 1 house property + other sources (< ₹50L)
- **ITR-2**: Multiple house properties, capital gains, foreign income
- **ITR-3**: Business/profession income
- **ITR-4 (Sugam)**: Presumptive income (44AD/44ADA)

## Implementation Order

### Phase 1: Salary (Days 1-3)
1. Create `useSalary.ts` composable
2. Create salary components
3. Update all salary pages

### Phase 2: Non-Salary Income (Days 1-5, parallel with Salary)
1. Create `useIncome.ts` composable
2. Create income components
3. Update all non-salary-income pages

### Phase 3: Tax Planning (Days 6-9, after Income complete)
1. Create `useTax.ts` composable
2. Create tax components
3. Update all tax-planning pages
4. Integrate with Salary + Non-Salary data

## Commit Convention

```bash
git add .
git commit -m "feat(salary): add useSalary composable"
git commit -m "feat(income): implement business income form"
git commit -m "feat(tax): add regime comparison calculator"
```

## Documentation

See `docs/` folder for detailed plans:
- `Parallel-Implementation-Guide.md` - Full stream prompts
- `Salary-Section-Plan.md` - Detailed salary requirements
- `Non-Salary-Income-Plan.md` - Detailed income requirements
- `Tax-Planning-Section-Plan.md` - Detailed tax requirements
