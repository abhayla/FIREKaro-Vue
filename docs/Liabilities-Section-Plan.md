# Liabilities Section Plan

> **Status**: Approved
> **Created**: January 7, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 6: LIABILITIES)
> **Estimated Effort**: ~6.5 days (consolidation + gap filling)

---

## Executive Summary

The LIABILITIES section is **~80% implemented** with excellent infrastructure. The primary work is:

1. **Consolidation** - Unify 2 scattered pages under single Liabilities section
2. **Credit Cards API** - Model exists, need CRUD API routes
3. **Credit Cards UI** - Dashboard page for credit card management
4. **Reports Tab** - Unified reporting with export
5. **Family View** - Integration across all liability types
6. **In-App Alerts** - Enhance existing LoanReminder system

---

## Current State Analysis

### What Exists & Works

| Feature | Location | Status |
|---------|----------|--------|
| Loan Model | `prisma/schema.prisma` (30+ fields) | Complete |
| Loan CRUD API | `/api/loans/*` (9 routes) | Complete |
| Loan Calculations | `src/lib/calculations/loans.ts` (494 lines) | Complete |
| Loans Dashboard | `/dashboard/loans/page.tsx` (4 tabs) | Complete |
| Loan Components | `src/components/loans/*` (8 components) | Complete |
| Debt Strategies | `src/lib/calculations/debt-strategies.ts` (243 lines) | Complete |
| Debt Payoff Page | `/dashboard/debt-payoff/page.tsx` | Complete |
| CreditCard Model | `prisma/schema.prisma` | Complete |
| CreditCardStatement Model | `prisma/schema.prisma` | Complete |
| DebtPayoffPlan Model | `prisma/schema.prisma` | Complete |
| LoanReminder Model | `prisma/schema.prisma` | Complete |

### What's Missing

| Feature | Status | Priority |
|---------|--------|----------|
| Consolidated Section Layout | Missing | P0 |
| Credit Cards CRUD API | Missing | P1 |
| Credit Cards UI Page | Missing | P1 |
| Reports Tab | Missing | P1 |
| Family View Integration | Missing | P1 |
| In-App Alert Delivery | Partial | P2 |

### Current vs Target Structure

```
CURRENT (2 Scattered Pages):          TARGET (Unified Section):
├── /dashboard/loans                  ├── /dashboard/liabilities/
├── /dashboard/debt-payoff            │   ├── page.tsx (Overview)
                                      │   ├── loans/
                                      │   ├── credit-cards/
                                      │   ├── debt-payoff/
                                      │   └── reports/
```

---

## Target Sub-Page Structure (4 Sub-Pages)

```
LIABILITIES SECTION
├── Overview (NEW - consolidated dashboard)
├── Loans (move from /dashboard/loans)
├── Credit Cards (NEW)
├── Debt Payoff (move from /dashboard/debt-payoff)
└── Reports (NEW)
```

---

## Phase 1: Navigation Restructure (Days 1-1.5)

### 1.1 Create Liabilities Section Layout

```typescript
// src/app/dashboard/liabilities/layout.tsx (NEW)
export default function LiabilitiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <LiabilitiesSectionHeader />
      <LiabilitiesNavigation />
      {children}
    </div>
  );
}
```

### 1.2 New Files to Create

```
src/app/dashboard/liabilities/
├── layout.tsx                      # Section layout with sub-navigation
├── page.tsx                        # Overview (consolidated view)
├── loans/page.tsx                  # Move from /dashboard/loans
├── credit-cards/page.tsx           # NEW
├── debt-payoff/page.tsx            # Move from /dashboard/debt-payoff
└── reports/page.tsx                # NEW
```

### 1.3 Components to Create

```
src/components/liabilities/
├── LiabilitiesSectionHeader.tsx    # Header with family toggle
├── LiabilitiesNavigation.tsx       # Sub-page navigation
├── LiabilitiesOverview.tsx         # Overview dashboard
└── LiabilityMetricsCards.tsx       # Summary metric cards
```

### 1.4 Sidebar Navigation Update

Update `src/components/dashboard/DashboardSidebar.tsx`:

```typescript
{
  title: 'Liabilities',
  icon: CreditCard,
  href: '/dashboard/liabilities',
  children: [
    { title: 'Overview', href: '/dashboard/liabilities' },
    { title: 'Loans', href: '/dashboard/liabilities/loans' },
    { title: 'Credit Cards', href: '/dashboard/liabilities/credit-cards' },
    { title: 'Debt Payoff', href: '/dashboard/liabilities/debt-payoff' },
    { title: 'Reports', href: '/dashboard/liabilities/reports' },
  ]
}
```

### 1.5 Redirect Setup

```typescript
// src/middleware.ts - Add redirects for old URLs
const liabilityRedirects = {
  '/dashboard/loans': '/dashboard/liabilities/loans',
  '/dashboard/debt-payoff': '/dashboard/liabilities/debt-payoff',
};
```

---

## Phase 2: Overview Dashboard (Day 2)

### 2.1 Overview Page UI Wireframe

```
+------------------------------------------------------------------+
| LIABILITIES                           [Family: Individual ]       |
+------------------------------------------------------------------+
| [Overview] [Loans] [Credit Cards] [Debt Payoff] [Reports]         |
+------------------------------------------------------------------+
| DEBT SUMMARY                                                      |
| +---------------+ +---------------+ +---------------+             |
| | Total Debt    | | Monthly EMI   | | Interest/Year |             |
| | 45,25,000     | | 52,400        | | 3,85,000      |             |
| | 2 Loans, 1 CC | | Due 5th/15th  | | Avg 10.2%     |             |
| +---------------+ +---------------+ +---------------+             |
+------------------------------------------------------------------+
| DEBT HEALTH INDICATORS                                            |
| +---------------+ +---------------+ +---------------+             |
| | DTI Ratio     | | Credit Util   | | Payoff ETA    |             |
| | 32%           | | 45%           | | Dec 2028      |             |
| | [Healthy]     | | [Moderate]    | | 36 months     |             |
| +---------------+ +---------------+ +---------------+             |
+------------------------------------------------------------------+
| DEBT BREAKDOWN BY TYPE                | UPCOMING PAYMENTS         |
| +-----------------------------+       | +------------------------+|
| | [Pie Chart]                 |       | | Jan 5 - Home Loan EMI  ||
| | Home Loan: 65% (32L)        |       | |   42,500               ||
| | Car Loan: 20% (10L)         |       | | Jan 15 - HDFC CC       ||
| | Credit Card: 15% (3.25L)    |       | |   28,400 (min: 5,680)  ||
| +-----------------------------+       | | Jan 20 - Car Loan EMI  ||
|                                       | |   15,200               ||
|                                       | +------------------------+|
+------------------------------------------------------------------+
| QUICK ACTIONS                                                     |
| [+ Add Loan] [+ Add Credit Card] [Debt Payoff Strategy] [Reports]|
+------------------------------------------------------------------+
```

### 2.2 API for Overview

```
src/app/api/liabilities/overview/route.ts     # GET aggregated data
```

```typescript
// Response structure
interface LiabilitiesOverview {
  totalDebt: number;
  totalMonthlyPayment: number;
  yearlyInterest: number;
  debtToIncomeRatio: number;
  creditUtilization: number;
  projectedPayoffDate: Date;
  debtByType: {
    loans: { count: number; total: number; monthlyEmi: number };
    creditCards: { count: number; total: number; minDue: number };
  };
  upcomingPayments: {
    id: string;
    name: string;
    type: 'loan' | 'credit_card';
    amount: number;
    dueDate: Date;
    isOverdue: boolean;
  }[];
  alerts: {
    overdueCount: number;
    upcoming7Days: number;
    highInterestDebts: number;
  };
}
```

---

## Phase 3: Credit Cards API & UI (Days 2.5-4)

### 3.1 Existing CreditCard Model (No Changes Needed)

The Prisma model is already comprehensive:

```prisma
model CreditCard {
  id                      String          @id @default(cuid())
  userId                  String
  familyMemberId          String?

  cardName                String
  bankName                String
  cardNumber              String          // Masked: ****1234
  cardType                String          // VISA, MASTERCARD, RUPAY, AMEX

  creditLimit             Float
  availableLimit          Float
  currentOutstanding      Float           @default(0)

  billingCycleDate        Int             // Day of month (1-31)
  paymentDueDate          Int             // Day of month (1-31)

  rewardPointsBalance     Int             @default(0)
  interestRateAPR         Float?
  annualFee               Float           @default(0)
  feeWaiverSpend          Float?          // Spend required for fee waiver

  cardExpiryDate          DateTime?
  isActive                Boolean         @default(true)

  // Relations
  user                    User
  familyMember            FamilyMember?
  statements              CreditCardStatement[]
}

model CreditCardStatement {
  id                      String          @id @default(cuid())
  creditCardId            String
  statementDate           DateTime
  statementAmount         Float
  minimumDue              Float
  dueDate                 DateTime
  isPaid                  Boolean         @default(false)
  paidAmount              Float?
  paidDate                DateTime?

  creditCard              CreditCard
}
```

### 3.2 New API Routes

```
src/app/api/credit-cards/
├── route.ts                        # GET/POST credit cards
├── [id]/route.ts                   # GET/PUT/DELETE card
├── [id]/statements/route.ts        # GET/POST statements
├── [id]/pay/route.ts               # POST record payment
└── analytics/route.ts              # GET credit card analytics
```

### 3.3 API Response Examples

**GET /api/credit-cards**
```typescript
{
  cards: [
    {
      id: "xxx",
      cardName: "HDFC Regalia",
      bankName: "HDFC Bank",
      cardNumber: "****5678",
      cardType: "VISA",
      creditLimit: 500000,
      availableLimit: 175000,
      currentOutstanding: 325000,
      utilizationPercent: 65,
      billingCycleDate: 15,
      paymentDueDate: 5,
      rewardPointsBalance: 12500,
      interestRateAPR: 42,
      annualFee: 2500,
      nextDueDate: "2026-02-05",
      minimumDue: 16250,
      isActive: true,
    }
  ],
  summary: {
    totalCards: 2,
    totalLimit: 800000,
    totalOutstanding: 425000,
    averageUtilization: 53,
    totalMinimumDue: 21250,
    totalRewardPoints: 18750,
  }
}
```

### 3.4 Credit Cards Page UI Wireframe

```
+------------------------------------------------------------------+
| CREDIT CARDS                         [Family: Individual ]        |
+------------------------------------------------------------------+
| [Overview] [Loans] [Credit Cards] [Debt Payoff] [Reports]         |
+------------------------------------------------------------------+
| CREDIT SUMMARY                                                    |
| +---------------+ +---------------+ +---------------+             |
| | Total Limit   | | Outstanding   | | Available     |             |
| | 8,00,000      | | 4,25,000      | | 3,75,000      |             |
| | 2 cards       | | 53% utilized  | | to spend      |             |
| +---------------+ +---------------+ +---------------+             |
+------------------------------------------------------------------+
| YOUR CARDS                                     [+ Add Card]       |
| +--------------------------------------------------------------+ |
| | HDFC Regalia (VISA) ****5678                    [Edit] [...]  | |
| | +----------------------------------------------------+        | |
| | | Credit Limit    | Outstanding   | Available        |        | |
| | | 5,00,000       | 3,25,000      | 1,75,000         |        | |
| | +----------------------------------------------------+        | |
| | | Utilization: [=============       ] 65%            |        | |
| | +----------------------------------------------------+        | |
| | | Due: Feb 5    | Min Due: 16,250 | APR: 42%        |        | |
| | | Rewards: 12,500 pts             | Annual Fee: 2,500|        | |
| | +----------------------------------------------------+        | |
| | [View Statements] [Record Payment] [Reward Calculator]        | |
| +--------------------------------------------------------------+ |
|                                                                   |
| +--------------------------------------------------------------+ |
| | SBI SimplyCLICK (MASTERCARD) ****1234                         | |
| | ...                                                            | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
| STATEMENT HISTORY                       [View Mode: Monthly ]     |
| | Dec 2025 | 28,450 | Paid: 28,450 | Status: Paid              | |
| | Nov 2025 | 32,100 | Paid: 32,100 | Status: Paid              | |
| | Oct 2025 | 25,800 | Paid: 25,800 | Status: Paid              | |
+------------------------------------------------------------------+
```

### 3.5 Credit Card Components

```
src/components/credit-cards/
├── CreditCardsList.tsx             # Card listing
├── CreditCardCard.tsx              # Individual card display
├── AddCreditCardDialog.tsx         # Add new card modal
├── EditCreditCardDialog.tsx        # Edit card details
├── RecordPaymentDialog.tsx         # Record payment modal
├── StatementHistory.tsx            # Statement list
└── CreditCardAnalytics.tsx         # Usage analytics
```

### 3.6 Credit Card Calculations

```typescript
// src/lib/calculations/credit-cards.ts (NEW)

export function calculateUtilization(outstanding: number, limit: number): number;
export function calculateMinimumDue(outstanding: number, rate: number): number;
export function calculateInterestCharges(outstanding: number, apr: number, days: number): number;
export function getOptimalPaymentDate(billingDate: number): number;
export function analyzeCreditHealth(cards: CreditCard[]): CreditHealthScore;
```

---

## Phase 4: Family View Integration (Day 4.5)

### 4.1 API Updates

All liability APIs need `familyMemberId` query parameter support:

```typescript
// Example: GET /api/liabilities/overview?familyMemberId=all
// Returns aggregated liabilities for all family members

interface FamilyLiabilitiesResponse {
  aggregated: LiabilitiesOverview;
  byMember: {
    memberId: string;
    memberName: string;
    relationship: string;
    loans: Loan[];
    creditCards: CreditCard[];
    totalDebt: number;
    monthlyPayment: number;
    percentageOfTotal: number;
  }[];
}
```

### 4.2 Family View UI

```
+------------------------------------------------------------------+
| LIABILITIES - Family View                                         |
+------------------------------------------------------------------+
| FAMILY TOTAL DEBT: 75,50,000                                     |
+------------------------------------------------------------------+
| MEMBER BREAKDOWN                                                  |
| +------------------+ +------------------+ +------------------+     |
| | Self             | | Spouse           | | Total Family     |     |
| | 45,25,000 (60%)  | | 30,25,000 (40%)  | | 75,50,000        |     |
| | 2 Loans, 1 CC    | | 1 Loan, 2 CC     | | 3 Loans, 3 CC    |     |
| +------------------+ +------------------+ +------------------+     |
+------------------------------------------------------------------+
| ALLOCATION BY MEMBER                                              |
| [Stacked Bar Chart showing each member's debt contribution]       |
+------------------------------------------------------------------+
```

### 4.3 Components for Family View

```
src/components/liabilities/
├── FamilyLiabilityBreakdown.tsx    # Member-wise breakdown
├── FamilyDebtChart.tsx             # Debt by member chart
└── FamilyPaymentCalendar.tsx       # Combined payment calendar
```

---

## Phase 5: Reports Tab (Days 5-5.5)

### 5.1 Report Types

| Report | Content |
|--------|---------|
| **Debt Summary** | Total liabilities, by type, by member |
| **Payment History** | All payments made, on-time vs late |
| **Interest Analysis** | Interest paid by loan, total cost |
| **Payoff Progress** | Debt reduction trends, projections |
| **Credit Health** | Utilization trends, score factors |

### 5.2 UI Wireframe

```
+------------------------------------------------------------------+
| LIABILITY REPORTS                                                 |
+------------------------------------------------------------------+
| [Report Type]                                                     |
| [Debt Summary] [Payment History] [Interest Analysis] [Credit Health]|
+------------------------------------------------------------------+
| [View Mode]  [Monthly ]  [Quarterly]  [Yearly]  [Custom Range]  |
+------------------------------------------------------------------+
| MONTHLY VIEW:                                                     |
|  Previous |  [January 2026 ]  |  Next      [Generate Report]    |
+------------------------------------------------------------------+
| [Report Preview]                                                  |
| +--------------------------------------------------------------+ |
| | DEBT SUMMARY - January 2026                                   | |
| | Total Outstanding: 45,25,000                                 | |
| | Monthly Payments: 52,400                                     | |
| |                                                               | |
| | DEBT BY TYPE:                                                 | |
| | [Bar Chart: Home Loan 32L, Car Loan 10L, CC 3.25L]           | |
| |                                                               | |
| | PAYMENT STATUS:                                               | |
| | On-time: 3/3 (100%)                                          | |
| | Interest Paid This Month: 28,500                             | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
| [Download PDF]  [Download Excel]  [Download CSV]                  |
+------------------------------------------------------------------+
```

### 5.3 New Files

```
src/services/reports/LiabilityReportService.ts    # Report generation
src/app/api/liabilities/reports/
├── route.ts                                       # GET report data
├── debt-summary/route.ts                          # Debt summary report
├── payment-history/route.ts                       # Payment history
├── interest-analysis/route.ts                     # Interest breakdown
├── credit-health/route.ts                         # Credit score factors
└── export/route.ts                                # PDF/Excel export
```

---

## Phase 6: In-App Alerts Enhancement (Day 6)

> **Note**: In-app only per user preference (no email/push)

### 6.1 Leverage Existing LoanReminder Model

The model already exists - need to add delivery service:

```prisma
// Already exists
model LoanReminder {
  id                String    @id @default(cuid())
  userId            String
  loanId            String

  reminderType      String    // EMI_DUE, PAYMENT_OVERDUE, DOCUMENT_EXPIRY
  reminderDate      DateTime
  message           String

  isActive          Boolean   @default(true)
  isSent            Boolean   @default(false)
  sentAt            DateTime?

  isRecurring       Boolean   @default(false)
  recurringPattern  String?   // MONTHLY, WEEKLY
}
```

### 6.2 Extend for Credit Cards

```prisma
// Add to schema (new model)
model CreditCardReminder {
  id                String      @id @default(cuid())
  userId            String
  creditCardId      String

  reminderType      String      // DUE_DATE, STATEMENT_GENERATED, HIGH_UTILIZATION
  reminderDate      DateTime
  message           String

  isActive          Boolean     @default(true)
  isSent            Boolean     @default(false)
  sentAt            DateTime?

  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  creditCard        CreditCard  @relation(fields: [creditCardId], references: [id], onDelete: Cascade)

  @@index([userId, reminderDate])
}
```

### 6.3 Alert Delivery Service

```typescript
// src/services/alerts/LiabilityAlertService.ts (NEW)

export class LiabilityAlertService {
  // Generate alerts for upcoming EMI dues
  async generateEmiAlerts(userId: string): Promise<void>;

  // Generate alerts for credit card due dates
  async generateCCDueAlerts(userId: string): Promise<void>;

  // Generate alerts for high credit utilization (>70%)
  async generateUtilizationAlerts(userId: string): Promise<void>;

  // Generate alerts for overdue payments
  async generateOverdueAlerts(userId: string): Promise<void>;

  // Mark alert as read
  async markAsRead(alertId: string): Promise<void>;

  // Get all unread alerts for user
  async getUnreadAlerts(userId: string): Promise<Alert[]>;
}
```

### 6.4 Alert API Routes

```
src/app/api/liabilities/alerts/
├── route.ts                        # GET unread alerts
├── [id]/read/route.ts              # POST mark as read
├── preferences/route.ts            # GET/PUT alert preferences
└── generate/route.ts               # POST trigger alert generation
```

### 6.5 Alert Types

| Alert Type | Trigger | Message Example |
|------------|---------|-----------------|
| EMI_DUE_3_DAYS | 3 days before EMI | "Home Loan EMI of 42,500 due on Jan 5" |
| EMI_DUE_TODAY | Day of EMI | "Home Loan EMI of 42,500 due today" |
| EMI_OVERDUE | Day after due date | "Home Loan EMI is overdue by 1 day" |
| CC_DUE_5_DAYS | 5 days before due | "HDFC Credit Card due: 28,400 on Feb 5" |
| CC_DUE_TODAY | Day of due date | "HDFC Credit Card payment due today" |
| HIGH_UTILIZATION | Utilization > 70% | "Credit utilization at 75%. Consider paying down." |
| STATEMENT_GENERATED | Statement date | "New statement: 32,500 for HDFC Regalia" |

---

## Implementation Order Summary

| Phase | Feature | Days | Priority |
|-------|---------|------|----------|
| 1 | Navigation Restructure | 1.5 | P0 |
| 2 | Overview Dashboard | 1 | P0 |
| 3 | Credit Cards API + UI | 1.5 | P1 |
| 4 | Family View Integration | 0.5 | P1 |
| 5 | Reports Tab | 1 | P1 |
| 6 | In-App Alerts | 1 | P2 |
| **Total** | | **6.5 days** | |

---

## New Files Summary

### Prisma Models (1 new)
- `CreditCardReminder` - Credit card alert tracking

### Calculations (1 new)
- `src/lib/calculations/credit-cards.ts` - Utilization, interest, rewards

### Services (2 new)
- `src/services/reports/LiabilityReportService.ts` - Report generation
- `src/services/alerts/LiabilityAlertService.ts` - Alert management

### API Routes (16 new)
- `/api/liabilities/overview` - Aggregated overview
- `/api/credit-cards/*` (5 routes) - Credit card CRUD
- `/api/liabilities/reports/*` (6 routes) - Reports
- `/api/liabilities/alerts/*` (4 routes) - Alerts

### Pages (5 restructured)
- `/dashboard/liabilities/` - Layout + Overview
- `/dashboard/liabilities/loans/` - Move from /loans
- `/dashboard/liabilities/credit-cards/` - NEW
- `/dashboard/liabilities/debt-payoff/` - Move from /debt-payoff
- `/dashboard/liabilities/reports/` - NEW

### Components (14 new)
- Section components (4): Header, Navigation, Overview, Metrics
- Credit card components (7): List, Card, Add, Edit, Payment, Statements, Analytics
- Family components (3): Breakdown, Chart, Calendar
- Report components (reuse from Expenses/Investments pattern)

---

## Dependencies

- **Existing Infrastructure**: Loan model, calculations, components (reuse)
- **Family View**: FamilyMember model, UserViewPreference (exists)
- **Reports**: jspdf, xlsx (already installed)
- **Charts**: Chart.js, Recharts (already installed)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Page migration breaks links | High | Add redirects in middleware |
| Credit card data sensitivity | High | Mask card numbers, secure API |
| Alert spam | Low | Configurable preferences, daily limits |

---

## Approved Patterns Applied

| Pattern | Source | Usage |
|---------|--------|-------|
| Sub-pages Navigation | Investments Plan | `/liabilities/*` structure |
| Date Picker (Prev/Next) | Expenses Plan | Reports date selection |
| In-App Alerts Only | Expenses Plan | No email/push |
| Reports Tab | Expenses Plan | Export PDF/Excel/CSV |
| Family View Toggle | Master Plan | Header dropdown |

---

## User Decisions Made

| Decision | Choice |
|----------|--------|
| Navigation Structure | **Sub-pages approved** - Overview, Loans, Credit Cards, Debt Payoff, Reports |
| Credit Card Rewards | **Excluded** - No reward points tracking or redemption calculator |
| Alert Types | **Approved as-is** - 6 alert types (EMI 3-day/today/overdue, CC 5-day/today, high utilization) |

---

## Related Plan Documents

1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation
2. `docs/Plans/Salary-Section-Plan.md` - Salary component tracking
3. `docs/Plans/Non-Salary-Income-Plan.md` - Income section plan
4. `docs/Plans/Tax-Planning-Section-Plan.md` - Tax planning
5. `docs/Plans/Expenses-Section-Plan.md` - Expenses section
6. `docs/Plans/Investments-Section-Plan.md` - Investments section
7. **`docs/Plans/Liabilities-Section-Plan.md`** - This plan

---

**Status: APPROVED & READY FOR IMPLEMENTATION**

*Plan approved on January 7, 2026 with user decisions:*
- *Sub-pages navigation structure approved*
- *Credit card reward points tracking excluded*
- *6 alert types approved as-is*
