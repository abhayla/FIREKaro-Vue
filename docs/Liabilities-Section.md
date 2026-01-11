# Liabilities Section Documentation

## Overview

The Liabilities section in FIREKaro helps users track and manage their debts including loans and credit cards. It provides comprehensive tools for monitoring outstanding amounts, EMI payments, credit utilization, and debt payoff strategies.

## Section Structure

The Liabilities section follows a hierarchical navigation pattern:

```
/liabilities           <- Overview page (section-level)
/liabilities/loans     <- Loans page (with internal tabs)
/liabilities/credit-cards <- Credit Cards page (with internal tabs)
/liabilities/debt-payoff <- Debt Payoff strategies
/liabilities/reports   <- Reports and analytics
```

### Section-Level Navigation

All pages within the Liabilities section share a common `SectionHeader` component that provides navigation between:
- **Overview**: High-level summary of all liabilities
- **Loans**: Detailed loan management with Overview/Details tabs
- **Credit Cards**: Credit card management with Overview/Details tabs
- **Debt Payoff**: Snowball and Avalanche payoff strategies
- **Reports**: Amortization schedules and analytics

### Internal Tab Pattern (Overview + Details)

The **Loans** and **Credit Cards** pages follow a two-tab internal navigation pattern, similar to the Salary section:

| Tab | Purpose | Content |
|-----|---------|---------|
| **Overview** | Read-only summary | Summary metrics, distribution charts, upcoming payments, condensed item list |
| **Details** | CRUD operations | Full item cards with edit/delete actions, add button, filters |

This pattern provides:
- Quick glance at key metrics without UI clutter (Overview tab)
- Full functionality when needed (Details tab)
- Consistent UX across similar sections

## Component Architecture

### Loans Page Components

```
src/pages/liabilities/loans.vue
├── SectionHeader (section-level tabs)
├── v-tabs (internal: Overview | Loan Details)
├── v-window
│   ├── LoansOverviewTab.vue
│   │   ├── Summary metric cards (4x)
│   │   ├── Debt Distribution by Type
│   │   ├── Upcoming EMI Payments
│   │   ├── Condensed Loans List
│   │   └── Tax Benefits info
│   └── LoansDetailsTab.vue
│       ├── Toolbar (Add button, filters)
│       ├── LoanCard grid (CRUD actions)
│       └── Empty state
├── LoanForm dialog
├── Delete confirmation dialog
├── Amortization schedule dialog
└── Prepayment simulation dialog
```

### Credit Cards Page Components

```
src/pages/liabilities/credit-cards.vue
├── SectionHeader (section-level tabs)
├── v-tabs (internal: Overview | Card Details)
├── v-window
│   ├── CreditCardsOverviewTab.vue
│   │   ├── Summary metric cards (4x)
│   │   ├── Credit Utilization Gauge
│   │   ├── Upcoming Payments
│   │   ├── Condensed Cards List
│   │   └── Credit Score Tips
│   └── CreditCardsDetailsTab.vue
│       ├── Utilization bar with alerts
│       ├── Toolbar (Add button)
│       ├── CreditCardCard grid
│       └── Empty state
├── CreditCardForm dialog
├── Delete confirmation dialog
├── Payment recording dialog
└── Statements dialog
```

### Component Files

| File | Purpose |
|------|---------|
| `src/components/liabilities/LoansOverviewTab.vue` | Overview tab content for Loans |
| `src/components/liabilities/LoansDetailsTab.vue` | Details tab with LoanCard grid |
| `src/components/liabilities/CreditCardsOverviewTab.vue` | Overview tab content for Credit Cards |
| `src/components/liabilities/CreditCardsDetailsTab.vue` | Details tab with CreditCardCard grid |
| `src/components/liabilities/LoanCard.vue` | Individual loan card component |
| `src/components/liabilities/CreditCardCard.vue` | Individual credit card component |
| `src/components/liabilities/LoanForm.vue` | Add/Edit loan dialog form |
| `src/components/liabilities/CreditCardForm.vue` | Add/Edit credit card dialog form |
| `src/components/liabilities/AmortizationTable.vue` | Loan amortization schedule display |

## Data Flow

### State Management Pattern

The Liabilities section uses Vue Query (TanStack Query) for server state management:

```typescript
// src/composables/useLiabilities.ts

// Queries
export function useLoans() {
  const uiStore = useUiStore()
  return useQuery({
    queryKey: computed(() => ['loans', uiStore.isFamilyView, uiStore.selectedFamilyMemberId]),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (uiStore.isFamilyView) params.set('familyView', 'true')
      if (uiStore.selectedFamilyMemberId) params.set('memberId', uiStore.selectedFamilyMemberId)
      const res = await fetch(`/api/loans${params.toString() ? '?' + params.toString() : ''}`)
      if (!res.ok) throw new Error('Failed to fetch loans')
      return res.json()
    }
  })
}

// Mutations
export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: LoanInput) => {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create loan')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['liabilities-overview'] })
    }
  })
}
```

### Event-Based Communication

Tab components emit events to parent pages for dialog management:

```typescript
// Tab component emits
emit('add-loan')
emit('edit-loan', loan)
emit('delete-loan', id)
emit('view-schedule', loan)
emit('prepay', loan)
emit('go-to-details')

// Parent page handles
@add-loan="handleAddLoan"
@edit-loan="handleEdit"
@delete-loan="handleDelete"
@view-schedule="handleViewSchedule"
@prepay="handlePrepay"
@go-to-details="activeTab = 'details'"
```

### Defensive Coding Pattern

All tab components use defensive array handling for API responses:

```typescript
const loansList = computed(() => {
  const data = loans.value
  return Array.isArray(data) ? data : []
})
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/loans` | GET | List all loans (supports familyView, memberId params) |
| `/api/loans` | POST | Create new loan |
| `/api/loans/:id` | GET | Get single loan |
| `/api/loans/:id` | PUT | Update loan |
| `/api/loans/:id` | DELETE | Delete loan |
| `/api/credit-cards` | GET | List all credit cards |
| `/api/credit-cards` | POST | Create new credit card |
| `/api/credit-cards/:id` | PUT | Update credit card |
| `/api/credit-cards/:id` | DELETE | Delete credit card |
| `/api/liabilities` | GET | Get liabilities overview/summary |
| `/api/liabilities/reports` | GET | Get liabilities reports data |

### Loan Types

```typescript
type LoanType =
  | 'HOME_LOAN'
  | 'CAR_LOAN'
  | 'PERSONAL_LOAN'
  | 'EDUCATION_LOAN'
  | 'GOLD_LOAN'
  | 'BUSINESS_LOAN'
  | 'OTHER'
```

### Loan Data Model

```typescript
interface Loan {
  id: string
  userId: string
  loanType: LoanType
  lenderName: string
  accountNumber?: string
  principalAmount: number
  outstandingAmount: number
  interestRate: number
  tenureMonths: number
  remainingTenureMonths: number
  emiAmount: number
  emiDate: number // Day of month (1-28)
  startDate: string
  nextEmiDate?: string
  status: 'ACTIVE' | 'CLOSED' | 'PREPAID'
  createdAt: string
  updatedAt: string
}
```

### Credit Card Data Model

```typescript
interface CreditCard {
  id: string
  userId: string
  cardName: string
  bankName: string
  last4Digits?: string
  creditLimit: number
  currentOutstanding: number
  minimumDue: number
  dueDate: number // Day of month
  billingCycleDate?: number
  interestRate: number
  rewardPoints?: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}
```

## Key Features

### Loans

1. **EMI Tracking**: Track monthly EMI payments with due date reminders
2. **Amortization Schedule**: View complete payment breakdown showing principal vs interest
3. **Prepayment Simulation**: Calculate impact of lump-sum prepayments on tenure/EMI
4. **Tax Benefits**: Section 80C (principal) and 24(b) (interest) deduction tracking
5. **Loan Distribution**: Visual breakdown by loan type

### Credit Cards

1. **Credit Utilization**: Real-time utilization tracking with color-coded zones
2. **Payment Reminders**: Upcoming payment due dates
3. **Reward Points**: Track accumulated reward points across cards
4. **Minimum Due Alerts**: Highlight cards with pending minimum payments
5. **Credit Score Tips**: Actionable tips for maintaining good credit

### Debt Payoff Strategies

1. **Snowball Method**: Pay smallest debts first for psychological wins
2. **Avalanche Method**: Pay highest interest debts first for savings
3. **Extra Payment Calculator**: See impact of additional monthly payments
4. **Payoff Timeline**: Visualize debt-free date

## E2E Testing

### Page Objects

| File | Purpose |
|------|---------|
| `e2e/pages/liabilities/loans.page.ts` | Loans page interactions |
| `e2e/pages/liabilities/credit-cards.page.ts` | Credit cards page interactions |
| `e2e/pages/liabilities/debt-payoff.page.ts` | Debt payoff page interactions |
| `e2e/pages/liabilities/reports.page.ts` | Reports page interactions |
| `e2e/pages/liabilities/overview.page.ts` | Overview page interactions |

### Test Files

| File | Coverage |
|------|----------|
| `01-navigation.spec.ts` | Tab navigation, internal tabs |
| `02-loans-crud.spec.ts` | Loan CRUD operations |
| `03-credit-cards.spec.ts` | Credit card CRUD operations |
| `04-debt-payoff.spec.ts` | Debt payoff strategies |
| `05-calculations.spec.ts` | Financial calculations |
| `05-overview.spec.ts` | Overview page functionality |
| `06-amortization.spec.ts` | Amortization schedules |
| `06-validation.spec.ts` | Form validation |
| `07-reports.spec.ts` | Reports functionality |

### Key Test Patterns

#### Internal Tab Navigation

```typescript
// Locator for internal tabs (vs section-level)
get overviewTab(): Locator {
  return this.page.locator('[role="tablist"]').nth(1).getByRole("tab", { name: "Overview" });
}

// Navigate to details tab before CRUD operations
async openAddForm() {
  await this.goToDetailsTab();
  await this.addLoanButton.click();
  await this.loanFormDialog.waitFor({ state: "visible" });
}
```

## Utility Functions

```typescript
// src/composables/useLiabilities.ts

// Currency formatting
formatINR(150000)         // "₹1,50,000"
formatINRCompact(10000000) // "1.00 Cr"

// Loan type helpers
getLoanTypeLabel('HOME_LOAN')  // "Home Loan"
getLoanTypeIcon('HOME_LOAN')   // "mdi-home"
getLoanTypeColor('HOME_LOAN')  // "primary"

// Calculations
calculatePrepaymentImpact(loan, amount, option) // Returns savings info
calculateAmortizationSchedule(loan)             // Returns monthly breakdown
calculateMinimumDue(card)                       // Returns minimum payment
```

## Migration Notes

### From v1 (Pre Two-Tab Pattern)

The Loans and Credit Cards pages were restructured to use the two-tab pattern:

**Before:**
- Single page with all content visible
- Summary cards, toolbar, and item grid mixed together

**After:**
- Overview tab: Summary metrics + condensed read-only list
- Details tab: Full CRUD functionality with item cards
- Dialogs remain at page level (not in tab components)

### Key Changes

1. Extracted tab content into separate components
2. Added internal `v-tabs`/`v-window` navigation
3. Moved summary calculations to Overview tab
4. Details tab emits events for dialog operations
5. Defensive `Array.isArray()` pattern for API responses

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project conventions and patterns
- [STYLING-GUIDE.md](./STYLING-GUIDE.md) - UI/UX patterns
- [Plan File](../.claude/plans/breezy-dreaming-rose.md) - Original implementation plan
