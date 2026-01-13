# Liabilities Section Documentation

## Overview

The Liabilities section in FIREKaro helps users track and manage their debts including loans and credit cards. It provides comprehensive tools for monitoring outstanding amounts, EMI payments, credit utilization, and debt payoff strategies.

## Section Structure

The Liabilities section consists of 5 separate pages, each with its own purpose:

```
/liabilities              <- Overview/Dashboard page (no tabs)
/liabilities/loans        <- Loans page (Overview | Details tabs)
/liabilities/credit-cards <- Credit Cards page (Overview | Details tabs)
/liabilities/debt-payoff  <- Debt Payoff page (Overview | Details tabs)
/liabilities/reports      <- Reports page (Debt Summary | Payment History | Interest Analysis | Tax Benefits tabs)
```

### Navigation Pattern

Each page has its own `SectionHeader` with title and icon. There are **no section-level navigation tabs** - navigation between pages happens via the sidebar.

### Internal Tab Pattern (Overview + Details)

The **Loans**, **Credit Cards**, and **Debt Payoff** pages follow a two-tab internal navigation pattern:

| Tab | Purpose | Content |
|-----|---------|---------|
| **Overview** | Read-only summary | Summary metrics, distribution charts, upcoming payments, condensed item list |
| **Details** | Full functionality | Full item cards with CRUD actions, filters, detailed tables |

The **Reports** page has a different tab structure for different report types:
- Debt Summary
- Payment History
- Interest Analysis
- Tax Benefits

## Page Details

### 1. Index Page (`/liabilities`)

The main dashboard showing a high-level overview of all liabilities.

**Components:**
- 4 Summary cards: Total Debt, Monthly Payment, Loan Outstanding, Credit Card Debt
- DTI (Debt-to-Income) Gauge
- Upcoming Payments list
- Payoff Progress Chart
- Top 5 Loans & Credit Cards quick views
- Quick Action buttons: Add Loan, Add Credit Card, Payoff Strategy, Generate Report

### 2. Loans Page (`/liabilities/loans`)

**Overview Tab:**
- 4 metric cards: Total Outstanding, Monthly EMI, Total Loans, Avg Interest Rate
- Loan Distribution by Type (progress bars)
- Upcoming EMI Payments list
- Top 5 Loans (condensed view)
- Tax Benefits Info Card (80C, 24b, 80E)

**Details Tab:**
- Toolbar with Add Loan button
- Type filters: dropdown + chip filters (Home, Car, Personal, etc.)
- Card grid: LoanCard components with actions (View Schedule, Prepay, Edit, Delete)

### 3. Credit Cards Page (`/liabilities/credit-cards`)

**Overview Tab:**
- 4 metric cards: Total Credit Limit, Outstanding, Available Credit, Reward Points
- Large Credit Utilization Gauge with status
- Upcoming Payment Due Dates list
- Top 5 Cards (condensed view)
- Credit Score Tips

**Details Tab:**
- Overall Utilization bar with warnings
- Toolbar with Add Credit Card button
- Card grid: CreditCardCard components (visual card design with utilization bar, actions)

### 4. Debt Payoff Page (`/liabilities/debt-payoff`)

**Overview Tab:**
- 4 metric cards: Total Debt, Minimum Payment, Avg Interest Rate, Extra Payment
- Extra Payment Slider (₹0 - ₹50K)
- Strategy Comparison: Snowball vs Avalanche cards
- Payoff Progress Chart (60-month projection)
- Strategy Tips

**Details Tab:**
- Strategy selector (Avalanche/Snowball toggle)
- Debt Payoff Order table (priority, balance, rate, est. payoff date)
- Visual Payoff Timeline
- Comparison Table: Snowball vs Avalanche metrics

### 5. Reports Page (`/liabilities/reports`)

**Tabs:**
- **Debt Summary**: Overview stats, debt distribution doughnut chart, detailed loan table
- **Payment History**: Date range filter, payment history table with status
- **Interest Analysis**: Interest by loan, EMI breakdown bar chart, interest cost analysis
- **Tax Benefits**: Section 80C, 24(b), 80E deduction cards, benefits table

**Export Options:** PDF, Excel, CSV

## Component Architecture

### File Structure

```
src/pages/liabilities/
├── index.vue              # Dashboard page
├── loans.vue              # Loans page with tabs
├── credit-cards.vue       # Credit Cards page with tabs
├── debt-payoff.vue        # Debt Payoff page with tabs
└── reports.vue            # Reports page with report type tabs

src/components/liabilities/
├── LoansOverviewTab.vue         # Loans overview content
├── LoansDetailsTab.vue          # Loans details with cards
├── CreditCardsOverviewTab.vue   # Credit cards overview content
├── CreditCardsDetailsTab.vue    # Credit cards details with cards
├── DebtPayoffOverviewTab.vue    # Debt payoff overview content
├── DebtPayoffDetailsTab.vue     # Debt payoff details with tables
├── LoanCard.vue                 # Individual loan card component
├── CreditCardCard.vue           # Individual credit card component
├── LoanForm.vue                 # Add/Edit loan dialog form
├── CreditCardForm.vue           # Add/Edit credit card dialog form
├── AmortizationTable.vue        # Loan amortization schedule display
├── DebtToIncomeGauge.vue        # DTI ratio visualization
├── PayoffProgressChart.vue      # Debt projection chart
└── DebtPayoffStrategy.vue       # Snowball vs Avalanche comparison
```

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

// Mutations invalidate related queries
export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: LoanInput) => { /* POST /api/loans */ },
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

## API Endpoints

### Loan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List all loans (supports familyView, memberId params) |
| GET | `/api/loans/:id` | Get single loan details |
| POST | `/api/loans` | Create new loan |
| PUT | `/api/loans/:id` | Update loan |
| DELETE | `/api/loans/:id` | Delete loan |
| GET | `/api/loans/:id/payments` | Get payment history |
| POST | `/api/loans/:id/payments` | Record payment |
| GET | `/api/loans/:id/amortization` | Generate amortization schedule |
| POST | `/api/loans/:id/prepay` | Calculate prepayment impact |

### Credit Card Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credit-cards` | List all credit cards |
| GET | `/api/credit-cards/:id` | Get single card with statements |
| POST | `/api/credit-cards` | Create new card |
| PUT | `/api/credit-cards/:id` | Update card |
| DELETE | `/api/credit-cards/:id` | Delete card |
| GET | `/api/credit-cards/:id/statements` | Get statement history |
| POST | `/api/credit-cards/:id/statements` | Add statement |
| POST | `/api/credit-cards/:id/pay` | Record payment |

### Overview & Reports Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/liabilities/overview` | Aggregated dashboard data |
| POST | `/api/liabilities/generate-alerts` | Generate EMI/CC due alerts |
| GET | `/api/liabilities/debt-payoff-strategies` | Snowball vs Avalanche comparison |
| GET | `/api/liabilities/reports/debt-summary` | Debt summary by type |
| GET | `/api/liabilities/reports/payment-history` | Payment history with stats |
| GET | `/api/liabilities/reports/interest-analysis` | Interest breakdown with insights |
| GET | `/api/liabilities/reports/credit-health` | Credit health score and factors |
| GET | `/api/liabilities/reports/export` | Export data for PDF/Excel |

## Data Models

### Loan Types

```typescript
type LoanType =
  | 'HOME_LOAN'
  | 'CAR_LOAN'
  | 'PERSONAL_LOAN'
  | 'EDUCATION_LOAN'
  | 'GOLD_LOAN'
  | 'BUSINESS_LOAN'
  | 'LOAN_AGAINST_PROPERTY'
  | 'LOAN_AGAINST_SECURITIES'
  | 'OTHER'
```

### Loan Data Model

```typescript
interface Loan {
  id: string
  userId: string
  loanType: LoanType
  loanName: string
  lender: string
  accountNumber?: string
  principalAmount: number
  outstandingAmount: number
  interestRate: number
  tenure: number
  remainingTenure: number
  emiAmount: number
  nextEmiDate?: string
  status: 'ACTIVE' | 'CLOSED' | 'DEFAULTED' | 'FORECLOSED'
  taxBenefitSection?: string
  maxTaxBenefit?: number
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
  cardNumber: string  // Masked: ****1234
  cardType: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX'
  creditLimit: number
  availableLimit: number
  currentOutstanding: number
  billingCycleDate: number
  paymentDueDate: number
  rewardPointsBalance: number
  interestRateAPR?: number
  annualFee: number
  cardExpiryDate?: string
  isActive: boolean
}
```

## Key Features

### Loans
- EMI Tracking with due date reminders
- Amortization Schedule generation
- Prepayment Simulation (reduce EMI vs reduce tenure)
- Tax Benefits tracking (80C, 24, 80E)
- Loan Distribution visualization

### Credit Cards
- Credit Utilization tracking with color-coded zones
- Payment Due Date reminders
- Reward Points tracking
- Minimum Due Alerts
- Credit Score Tips

### Debt Payoff Strategies
- Snowball Method (smallest balance first)
- Avalanche Method (highest interest first)
- Extra Payment Calculator
- Payoff Timeline Visualization
- Strategy Comparison

### Reports
- Debt Summary by type
- Payment History with statistics
- Interest Analysis with insights
- Tax Benefits calculation
- Export (PDF, Excel, CSV)

## Utility Functions

```typescript
// Currency formatting
formatINR(150000)          // "₹1,50,000"
formatINRCompact(10000000) // "1.00 Cr"

// Loan type helpers
getLoanTypeLabel('HOME_LOAN')  // "Home Loan"
getLoanTypeIcon('HOME_LOAN')   // "mdi-home"
getLoanTypeColor('HOME_LOAN')  // "primary"

// Calculations
calculateEMI(principal, rate, tenure)
calculatePrepaymentImpact(loan, amount, option)
generateAmortizationSchedule(loan)
calculateMinimumDue(outstanding)
calculateCreditUtilization(outstanding, limit)
calculateDTI(totalMonthlyDebt, monthlyIncome)
comparePayoffStrategies(debts, extraPayment)
```

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
| `01-navigation.spec.ts` | Page navigation, internal tabs |
| `02-loans-crud.spec.ts` | Loan CRUD operations |
| `03-credit-cards.spec.ts` | Credit card CRUD operations |
| `04-debt-payoff.spec.ts` | Debt payoff strategies |
| `05-overview.spec.ts` | Overview page functionality |
| `06-amortization.spec.ts` | Amortization schedules |
| `07-reports.spec.ts` | Reports functionality |

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project conventions and patterns
- [STYLING-GUIDE.md](./STYLING-GUIDE.md) - UI/UX patterns
