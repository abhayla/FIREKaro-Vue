# CLAUDE.md - FIREKaro Vue 3 SPA (Stream 2)

## Project Overview

This is **Stream 2** of the FIREKaro Vue 3 SPA migration, focusing on:
- **Expenses Section** (~3 days)
- **Protection Section** (~2 days)

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
git branch           # Should show: feature/vue-expenses-protection
```

## API Endpoints (Already Exist - DO NOT Modify)

### Expenses
- `GET /api/expenses` - List expenses (supports ?month=YYYY-MM)
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/categories` - List categories
- `GET /api/expenses/ai/categorize` - AI categorization
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/expense-rules` - Category rules

### Protection (Insurance)
- `GET /api/insurance` - List policies
- `POST /api/insurance` - Create policy
- `PUT /api/insurance/:id` - Update policy
- `DELETE /api/insurance/:id` - Delete policy
- `GET /api/insurance/coverage-analysis` - Coverage analysis
- `GET /api/insurance/recommendations` - Recommendations

## File Structure to Create

### Expenses Section
```
src/
├── composables/
│   └── useExpenses.ts          # Vue Query hooks
├── components/expenses/
│   ├── ExpenseForm.vue         # Add/edit expense modal
│   ├── ExpenseList.vue         # Expense table/list
│   ├── ExpenseCard.vue         # Single expense card
│   ├── BudgetCard.vue          # Budget progress card
│   ├── BudgetForm.vue          # Add/edit budget modal
│   ├── CategoryPieChart.vue    # Pie chart by category
│   ├── MonthlyTrendChart.vue   # Line chart trends
│   ├── CSVImportModal.vue      # CSV import dialog
│   └── ExpenseFilters.vue      # Date/category filters
└── pages/dashboard/expenses/
    ├── index.vue               # Overview (update stub)
    ├── track.vue               # Track expenses (update stub)
    ├── budgets.vue             # Budgets (update stub)
    └── reports.vue             # Reports (update stub)
```

### Protection Section
```
src/
├── composables/
│   └── useProtection.ts        # Vue Query hooks
├── components/protection/
│   ├── InsurancePolicyCard.vue
│   ├── InsurancePolicyForm.vue
│   ├── CoverageAdequacyWizard.vue  # 4-step wizard
│   ├── HLVCalculator.vue       # Human Life Value
│   ├── CoverageGapAlert.vue
│   ├── InsuranceSummaryCard.vue
│   └── FamilyCoverageView.vue
└── pages/dashboard/protection/
    ├── index.vue               # Overview (update stub)
    ├── life.vue                # Life insurance (update stub)
    ├── health.vue              # Health insurance (update stub)
    ├── other.vue               # Motor/Home/Travel (update stub)
    ├── calculator.vue          # Adequacy calculator (update stub)
    └── reports.vue             # Reports (update stub)
```

## Key Patterns

### Vue Query Data Fetching
```typescript
// src/composables/useExpenses.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export function useExpenses(month?: string) {
  return useQuery({
    queryKey: ['expenses', month],
    queryFn: async () => {
      const url = month ? `/api/expenses?month=${month}` : '/api/expenses'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch expenses')
      return res.json()
    }
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create expense')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
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

## User Preferences

1. **Alerts**: In-app only (no email/push notifications)
2. **Date Navigation**: Month dropdown + Prev/Next buttons
3. **CSV Import**: Modal in Track tab, not separate page
4. **Reports**: Monthly/Quarterly/Yearly/Custom date picker

## Implementation Order

### Phase 1: Expenses (Days 1-3)
1. Create `useExpenses.ts` composable
2. Create expense components
3. Update `index.vue` (Overview with summary cards)
4. Update `track.vue` (Expense list + add form)
5. Update `budgets.vue` (Budget management)
6. Update `reports.vue` (Charts + export)

### Phase 2: Protection (Days 4-5)
1. Create `useProtection.ts` composable
2. Create protection components
3. Update all protection pages
4. Implement 4-step adequacy wizard

## Commit Convention

```bash
git add .
git commit -m "feat(expenses): add useExpenses composable"
git commit -m "feat(expenses): implement expense tracking page"
git commit -m "feat(protection): add insurance policy management"
```

## Documentation

See `docs/` folder for detailed plans:
- `Parallel-Implementation-Guide.md` - Full stream prompts
- `Expenses-Section-Plan.md` - Detailed expenses requirements
- `Protection-Section-Plan.md` - Detailed protection requirements
