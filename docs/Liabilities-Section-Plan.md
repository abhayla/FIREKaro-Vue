# Liabilities Section Plan

> **Status**: IMPLEMENTED
> **Created**: January 7, 2026
> **Last Updated**: January 9, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 6: LIABILITIES)

---

## Executive Summary

The LIABILITIES section is **100% implemented** with full backend API, frontend UI, and E2E tests.

### Implementation Completed

1. **Backend APIs** - All CRUD routes for Loans, Credit Cards, Overview, Reports
2. **Database Models** - CreditCard and CreditCardStatement models added to Prisma
3. **Frontend Pages** - 5 sub-pages under consolidated /dashboard/liabilities section
4. **Components** - 8 Vue components for liabilities management
5. **Composable** - Full useLiabilities.ts with all hooks and calculations
6. **E2E Tests** - 7 test spec files covering all functionality
7. **Alert Integration** - Using existing AlertDelivery system

---

## Implementation Status

### Backend API Routes (All Complete)

| Route File | Endpoints | Status |
|------------|-----------|--------|
| `server/routes/loans.ts` | 9 endpoints | COMPLETE |
| `server/routes/credit-cards.ts` | 8 endpoints | COMPLETE |
| `server/routes/liabilities.ts` | 3 endpoints | COMPLETE |
| `server/routes/liabilities-reports.ts` | 5 endpoints | COMPLETE |

#### Loan API Endpoints (`/api/loans`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List all loans with filtering |
| GET | `/api/loans/:id` | Get single loan details |
| POST | `/api/loans` | Create new loan |
| PUT | `/api/loans/:id` | Update loan |
| DELETE | `/api/loans/:id` | Delete loan |
| GET | `/api/loans/:id/payments` | Get payment history |
| POST | `/api/loans/:id/payments` | Record payment |
| GET | `/api/loans/:id/amortization` | Generate amortization schedule |
| POST | `/api/loans/:id/prepay` | Calculate prepayment impact |

#### Credit Cards API Endpoints (`/api/credit-cards`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credit-cards` | List all cards with summary |
| GET | `/api/credit-cards/:id` | Get single card with statements |
| POST | `/api/credit-cards` | Create new card |
| PUT | `/api/credit-cards/:id` | Update card |
| DELETE | `/api/credit-cards/:id` | Delete card |
| GET | `/api/credit-cards/:id/statements` | Get statement history |
| POST | `/api/credit-cards/:id/statements` | Add statement |
| POST | `/api/credit-cards/:id/pay` | Record payment |

#### Liabilities Overview API (`/api/liabilities`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/liabilities/overview` | Aggregated dashboard data |
| POST | `/api/liabilities/generate-alerts` | Generate EMI/CC due alerts |
| GET | `/api/liabilities/debt-payoff-strategies` | Snowball vs Avalanche comparison |

#### Liabilities Reports API (`/api/liabilities/reports`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/liabilities/reports/debt-summary` | Debt summary by type |
| GET | `/api/liabilities/reports/payment-history` | Payment history with stats |
| GET | `/api/liabilities/reports/interest-analysis` | Interest breakdown with insights |
| GET | `/api/liabilities/reports/credit-health` | Credit health score and factors |
| GET | `/api/liabilities/reports/export` | Export data for PDF/Excel |

---

### Database Models (All Complete)

#### Existing Models (No Changes)

| Model | Location | Fields |
|-------|----------|--------|
| Loan | `prisma/schema.prisma:867-903` | 30+ fields |
| LoanPayment | `prisma/schema.prisma:905-928` | Payment tracking |
| DebtPayoffPlan | `prisma/schema.prisma:930-952` | Payoff strategies |

#### New Models Added

```prisma
model CreditCard {
  id                  String                @id @default(cuid())
  userId              String
  familyMemberId      String?
  cardName            String
  bankName            String
  cardNumber          String                // Masked: ****1234
  cardType            String                // VISA, MASTERCARD, RUPAY, AMEX
  creditLimit         Float
  availableLimit      Float
  currentOutstanding  Float                 @default(0)
  billingCycleDate    Int                   // Day of month (1-31)
  paymentDueDate      Int                   // Day of month (1-31)
  rewardPointsBalance Int                   @default(0)
  interestRateAPR     Float?
  annualFee           Float                 @default(0)
  feeWaiverSpend      Float?
  cardExpiryDate      DateTime?
  isActive            Boolean               @default(true)
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  user         User                  @relation(...)
  familyMember FamilyMember?         @relation(...)
  statements   CreditCardStatement[]

  @@index([userId, isActive])
  @@index([paymentDueDate])
}

model CreditCardStatement {
  id              String     @id @default(cuid())
  creditCardId    String
  statementDate   DateTime
  statementAmount Float
  minimumDue      Float
  dueDate         DateTime
  isPaid          Boolean    @default(false)
  paidAmount      Float?
  paidDate        DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  creditCard CreditCard @relation(...)

  @@index([creditCardId, statementDate])
}
```

#### Skipped Models (Using Existing AlertDelivery)

| Model | Decision | Reason |
|-------|----------|--------|
| LoanReminder | SKIPPED | Use existing AlertDelivery model |
| CreditCardReminder | SKIPPED | Use existing AlertDelivery model |

---

### Frontend Implementation (All Complete)

#### Pages Structure

```
src/pages/dashboard/liabilities/
├── index.vue          # Overview dashboard
├── loans.vue          # Loan management
├── credit-cards.vue   # Credit card management
├── debt-payoff.vue    # Payoff strategies
└── reports.vue        # Reports and exports
```

#### Components

```
src/components/liabilities/
├── LoanCard.vue              # Individual loan card display
├── LoanForm.vue              # Add/edit loan form
├── CreditCardCard.vue        # Individual credit card display
├── CreditCardForm.vue        # Add/edit credit card form
├── DebtPayoffChart.vue       # Payoff visualization
├── DebtStrategyComparison.vue# Snowball vs Avalanche
├── AmortizationTable.vue     # Loan amortization schedule
└── LiabilityMetricsCards.vue # Summary metric cards
```

#### Composable (`src/composables/useLiabilities.ts`)

**Hooks Implemented:**
- `useLoans()` - Fetch all loans
- `useLoan(id)` - Fetch single loan
- `useCreateLoan()` - Create mutation
- `useUpdateLoan()` - Update mutation
- `useDeleteLoan()` - Delete mutation
- `useCreditCards()` - Fetch all cards
- `useCreateCreditCard()` - Create mutation
- `useUpdateCreditCard()` - Update mutation
- `useDeleteCreditCard()` - Delete mutation
- `useLiabilitiesOverview()` - Dashboard data
- `useDebtPayoffStrategies(extraPayment)` - Payoff strategies

**Calculation Functions:**
- `calculateEMI(principal, rate, tenure)`
- `calculateTotalInterest(principal, emi, tenure)`
- `generateAmortizationSchedule(principal, rate, tenure, startDate)`
- `calculatePrepaymentImpact(balance, rate, tenure, amount, reduceEmi)`
- `calculateCreditUtilization(outstanding, limit)`
- `calculateMinimumDue(outstanding, minPercent)`
- `calculateInterestCharges(outstanding, apr, days)`
- `calculateDTI(totalMonthlyDebt, monthlyIncome)`
- `getDTIStatus(dti)`
- `comparePayoffStrategies(debts, extraPayment)`

**Utility Functions:**
- `formatINR(amount)` - Currency formatting
- `formatINRCompact(amount)` - Compact currency (L, Cr)
- `formatPercentage(value)` - Percentage formatting
- `formatDate(dateStr)` - Date formatting
- `getLoanTypeLabel(type)` - Loan type display name
- `getLoanTypeIcon(type)` - Loan type icon
- `getLoanTypeColor(type)` - Loan type color

---

### E2E Tests (All Complete)

```
e2e/tests/liabilities/
├── 01-navigation.spec.ts     # Tab navigation tests
├── 02-loans-crud.spec.ts     # Loan CRUD operations
├── 03-credit-cards.spec.ts   # Credit card operations
├── 04-debt-payoff.spec.ts    # Payoff strategy tests
├── 05-overview.spec.ts       # Overview dashboard tests
├── 06-amortization.spec.ts   # Amortization schedule tests
└── 07-reports.spec.ts        # Reports functionality
```

#### Page Objects

```
e2e/pages/liabilities/
├── index.ts               # Barrel export
├── overview.page.ts       # Overview page object
├── loans.page.ts          # Loans page object
├── credit-cards.page.ts   # Credit cards page object
├── debt-payoff.page.ts    # Debt payoff page object
└── reports.page.ts        # Reports page object
```

#### Test Fixtures

```
e2e/fixtures/liabilities-data.ts
├── loansData[]            # Test loan data
├── creditCardsData[]      # Test credit card data
├── liabilitiesSummary     # Summary calculations
├── snowballStrategy       # Snowball payoff strategy
├── avalancheStrategy      # Avalanche payoff strategy
├── upcomingPayments       # Upcoming payment data
└── generateAmortizationSchedule()  # Schedule generator
```

---

### Server Registration

Updated `server/index.ts` to register all routes:

```typescript
// Liabilities routes
import loansRoutes from './routes/loans'
import creditCardsRoutes from './routes/credit-cards'
import liabilitiesRoutes from './routes/liabilities'
import liabilitiesReportsRoutes from './routes/liabilities-reports'

// API routes - Liabilities
app.route('/api/loans', loansRoutes)
app.route('/api/credit-cards', creditCardsRoutes)
app.route('/api/liabilities', liabilitiesRoutes)
app.route('/api/liabilities/reports', liabilitiesReportsRoutes)
```

---

## Features Implemented

### Overview Dashboard
- Total debt summary
- Monthly payment totals
- Yearly interest estimate
- Debt-to-income ratio
- Credit utilization percentage
- Projected payoff date
- Debt breakdown by type (loans vs credit cards)
- Upcoming payments list
- Alert indicators (overdue, upcoming 7 days, high interest)

### Loan Management
- Full CRUD operations
- Multiple loan types: HOME_LOAN, CAR_LOAN, PERSONAL_LOAN, EDUCATION_LOAN, GOLD_LOAN, etc.
- Payment recording and history
- Amortization schedule generation
- Prepayment impact calculator (reduce EMI vs reduce tenure)
- Tax benefit tracking (80C, 24, 80E)

### Credit Card Management
- Full CRUD operations
- Card types: VISA, MASTERCARD, RUPAY, AMEX
- Statement tracking
- Payment recording
- Utilization calculation
- Available credit tracking
- Reward points balance

### Debt Payoff Strategies
- Snowball strategy (smallest balance first)
- Avalanche strategy (highest interest first)
- Extra payment simulation
- Interest savings comparison
- Payoff timeline projection

### Reports
- Debt summary by type
- Payment history with statistics
- Interest analysis with insights
- Credit health score and factors
- Export support (data for PDF/Excel generation)

### Alerts (Using AlertDelivery)
- EMI due alerts (3 days, today, overdue)
- Credit card due alerts (5 days, today)
- High utilization warnings (>70%)
- On-demand alert generation endpoint

---

## Implementation Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Alert Model | Use AlertDelivery | Consistent with existing alert system |
| Family View | Deferred | Build basic APIs first, add later |
| Calculation Files | Keep in composable | Already works, no need to refactor |
| Debt Strategies File | Keep in composable | Logic works in current location |

---

## Files Created/Modified

### Created Files

| File | Purpose |
|------|---------|
| `server/routes/loans.ts` | Loan CRUD API (9 endpoints) |
| `server/routes/credit-cards.ts` | Credit card CRUD API (8 endpoints) |
| `server/routes/liabilities.ts` | Overview + alerts + strategies |
| `server/routes/liabilities-reports.ts` | Reports API (5 endpoints) |
| `e2e/tests/liabilities/05-overview.spec.ts` | Overview tests |
| `e2e/tests/liabilities/06-amortization.spec.ts` | Amortization tests |

### Modified Files

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added CreditCard, CreditCardStatement models |
| `server/index.ts` | Registered new routes |
| `src/composables/useLiabilities.ts` | Fixed debt-payoff-strategies endpoint |

---

## Verification Steps

### Database Verification
```bash
npm run db:push
npm run db:studio  # Verify CreditCard and CreditCardStatement tables
```

### API Testing
```bash
# Health check
curl http://localhost:3000/api/health

# Loans
curl http://localhost:3000/api/loans

# Credit Cards
curl http://localhost:3000/api/credit-cards

# Overview
curl http://localhost:3000/api/liabilities/overview

# Reports
curl http://localhost:3000/api/liabilities/reports/debt-summary
```

### E2E Tests
```bash
npm run test:e2e -- e2e/tests/liabilities/
```

---

## Future Enhancements (Not Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| Family View Backend | DEFERRED | Add familyMemberId filtering later |
| Credit Card Rewards Calculator | EXCLUDED | Per user decision |
| Email/Push Notifications | EXCLUDED | In-app alerts only |
| PDF/Excel Generation | PARTIAL | Export endpoint returns data, client generates files |

---

## Related Documents

1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation
2. `docs/Salary-Section-Plan.md` - Salary component tracking
3. `docs/Non-Salary-Income-Plan.md` - Income section plan
4. `docs/Tax-Planning-Section-Plan.md` - Tax planning
5. `docs/Expenses-Section-Plan.md` - Expenses section
6. `docs/Investments-Section-Plan.md` - Investments section
7. **`docs/Liabilities-Section-Plan.md`** - This plan

---

**Status: IMPLEMENTED**

*Implementation completed on January 9, 2026*
- *All backend APIs operational*
- *All frontend pages functional*
- *E2E tests in place*
- *Using existing AlertDelivery for notifications*
