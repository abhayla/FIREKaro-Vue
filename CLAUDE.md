# CLAUDE.md - FIREKaro Vue 3 SPA (Stream 3)

## Project Overview

This is **Stream 3** of the FIREKaro Vue 3 SPA migration, focusing on:
- **Investments Section** (~3.5 days)
- **Liabilities Section** (~2.5 days)

These sections can be built in parallel as they don't depend on each other.

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
git branch           # Should show: feature/vue-investments-liabilities
```

## API Endpoints (Already Exist - DO NOT Modify)

### Investments
- `GET /api/investments` - List all investments
- `POST /api/investments` - Create investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment
- `GET /api/portfolio` - Portfolio summary
- `GET /api/epf` - EPF details
- `POST /api/epf` - Update EPF
- `GET /api/ppf` - PPF details
- `POST /api/ppf` - Update PPF
- `GET /api/nps` - NPS details
- `POST /api/nps` - Update NPS

### Liabilities
- `GET /api/loans` - List all loans
- `POST /api/loans` - Create loan
- `PUT /api/loans/:id` - Update loan
- `DELETE /api/loans/:id` - Delete loan
- `GET /api/credit-cards` - List credit cards
- `POST /api/credit-cards` - Create credit card
- `PUT /api/credit-cards/:id` - Update credit card
- `DELETE /api/credit-cards/:id` - Delete credit card
- `GET /api/debt-payoff/strategies` - Payoff strategies

## File Structure to Create

### Investments Section
```
src/
├── composables/
│   └── useInvestments.ts         # Vue Query hooks
├── components/investments/
│   ├── PortfolioAllocationChart.vue  # Donut chart
│   ├── AssetCard.vue             # Generic asset card
│   ├── AssetForm.vue             # Add/edit asset modal
│   ├── EPFCalculator.vue         # EPF projection
│   ├── PPFTracker.vue            # PPF with loan facility
│   ├── NPSCalculator.vue         # NPS projection
│   ├── StockHoldingCard.vue      # Stock holdings
│   ├── MutualFundCard.vue        # MF holdings
│   ├── PropertyCard.vue          # Real estate
│   └── ReturnsChart.vue          # Returns over time
└── pages/dashboard/investments/
    ├── index.vue                 # Portfolio overview (update stub)
    ├── stocks.vue                # Direct equity (update stub)
    ├── mutual-funds.vue          # MF holdings (update stub)
    ├── epf-ppf.vue               # EPF & PPF (update stub)
    ├── nps.vue                   # NPS (update stub)
    ├── property.vue              # Real estate (update stub)
    └── reports.vue               # Reports (update stub)
```

### Liabilities Section
```
src/
├── composables/
│   └── useLiabilities.ts         # Vue Query hooks
├── components/liabilities/
│   ├── LoanCard.vue              # Loan summary card
│   ├── LoanForm.vue              # Add/edit loan modal
│   ├── CreditCardCard.vue        # Credit card card
│   ├── CreditCardForm.vue        # Add/edit CC modal
│   ├── DebtPayoffStrategy.vue    # Strategy comparison
│   ├── AmortizationTable.vue     # Loan amortization
│   ├── DebtToIncomeGauge.vue     # DTI ratio gauge
│   └── PayoffProgressChart.vue   # Payoff timeline
└── pages/dashboard/liabilities/
    ├── index.vue                 # Overview (update stub)
    ├── loans.vue                 # All loans (update stub)
    ├── credit-cards.vue          # Credit cards (update stub)
    ├── debt-payoff.vue           # Payoff strategies (update stub)
    └── reports.vue               # Reports (update stub)
```

## Key Patterns

### Vue Query Data Fetching
```typescript
// src/composables/useInvestments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio')
      if (!res.ok) throw new Error('Failed to fetch portfolio')
      return res.json()
    }
  })
}

export function useInvestments() {
  return useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const res = await fetch('/api/investments')
      if (!res.ok) throw new Error('Failed to fetch investments')
      return res.json()
    }
  })
}

export function useEPF() {
  return useQuery({
    queryKey: ['epf'],
    queryFn: async () => {
      const res = await fetch('/api/epf')
      if (!res.ok) throw new Error('Failed to fetch EPF')
      return res.json()
    }
  })
}
```

```typescript
// src/composables/useLiabilities.ts
export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const res = await fetch('/api/loans')
      if (!res.ok) throw new Error('Failed to fetch loans')
      return res.json()
    }
  })
}

export function useCreditCards() {
  return useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => {
      const res = await fetch('/api/credit-cards')
      if (!res.ok) throw new Error('Failed to fetch credit cards')
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

## Indian Investment Context

### Retirement Instruments
- **EPF**: Employee Provident Fund (8.25% interest, employer matched)
- **VPF**: Voluntary PF (additional contribution to EPF)
- **PPF**: Public Provident Fund (7.1% interest, 15-year lock-in)
- **NPS**: National Pension System (market-linked, 80CCD benefits)

### Key Limits
- EPF: 12% of basic (employee) + 12% (employer)
- PPF: ₹1.5L per year max
- NPS 80CCD(1B): ₹50K additional deduction
- Section 80C: ₹1.5L total (includes EPF, PPF, ELSS, etc.)

### Loan Types
- Home Loan (80C principal + 80EE/80EEA interest)
- Car Loan
- Personal Loan
- Education Loan (80E interest deduction)
- Gold Loan

### Debt Payoff Strategies
- **Snowball**: Smallest balance first (psychological wins)
- **Avalanche**: Highest interest first (mathematically optimal)
- **Custom**: User-defined priority

## Implementation Order

### Phase 1: Investments (Days 1-3.5)
1. Create `useInvestments.ts` composable
2. Create investment components
3. Update `index.vue` (Portfolio overview with allocation chart)
4. Update `stocks.vue` and `mutual-funds.vue`
5. Update `epf-ppf.vue` and `nps.vue`
6. Update `property.vue` and `reports.vue`

### Phase 2: Liabilities (Days 1-2.5, can run parallel)
1. Create `useLiabilities.ts` composable
2. Create liability components
3. Update `index.vue` (Debt overview with DTI)
4. Update `loans.vue` and `credit-cards.vue`
5. Update `debt-payoff.vue` and `reports.vue`

## Commit Convention

```bash
git add .
git commit -m "feat(investments): add useInvestments composable"
git commit -m "feat(investments): implement portfolio allocation chart"
git commit -m "feat(liabilities): add loan management"
git commit -m "feat(liabilities): implement debt payoff strategies"
```

## Documentation

See `docs/` folder for detailed plans:
- `Parallel-Implementation-Guide.md` - Full stream prompts
- `Investments-Section-Plan.md` - Detailed investments requirements
- `Liabilities-Section-Plan.md` - Detailed liabilities requirements
