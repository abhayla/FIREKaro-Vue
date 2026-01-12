# Investments Section Plan

> **Status**: ✅ Approved
> **Created**: January 7, 2026
> **Approved**: January 7, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 5: INVESTMENTS)
> **Estimated Effort**: ~9 days (reorganization + gap filling)

---

## Executive Summary

The INVESTMENTS feature is **70% implemented but poorly organized**. Features are scattered across 7 independent pages. This plan focuses on:

1. **Consolidation** - Unify 7 pages under single Investments section
2. **Missing Features** - PPF tracking, Reports tab
3. **Missing APIs** - EPF CRUD, Property CRUD
4. **Family View** - Full integration across all investment types

---

## Current State Analysis

### What Exists & Works ✅

| Feature | Location | Status |
|---------|----------|--------|
| Investment CRUD | `/api/investments/*` (13 routes) | ✅ Comprehensive |
| Portfolio Rebalancing | `/api/portfolio/*` (9 routes) | ✅ Mature |
| ESOP/RSU Management | `/api/esop/*` (6 routes) | ✅ Excellent |
| NPS Tracking | `/api/nps/*` | ✅ Working |
| Real Estate | `/dashboard/property` | ✅ Working |
| Retirement (EPF+NPS) | `/dashboard/retirement` | ✅ Working |
| Investment Goals | `/dashboard/investments` | ✅ Working |
| Calculations | `src/lib/calculations/*` | ✅ 14 modules |
| Components | `src/components/*` | ✅ 37+ components |

### What's Missing ❌

| Feature | Status | Priority |
|---------|--------|----------|
| Consolidated Overview Page | ❌ Missing | P0 |
| Unified Navigation | ❌ Scattered | P0 |
| Investment Reports Tab | ❌ Missing | P1 |
| PPF Tracking | ❌ Missing | P1 |
| EPF CRUD API | ❌ Missing | P1 |
| Property CRUD API | ❌ Missing | P1 |
| Family View Integration | ⚠️ Partial | P1 |

### Current vs Target Structure

```
CURRENT (7 Scattered Pages):          TARGET (Unified Section):
├── /dashboard/investments            ├── /dashboard/investments/
├── /dashboard/portfolio              │   ├── page.tsx (Overview)
├── /dashboard/esop                   │   ├── mutual-funds/
├── /dashboard/property               │   ├── stocks/
├── /dashboard/retirement             │   ├── fixed-deposits/
├── /dashboard/goals                  │   ├── real-estate/
└── /dashboard/banking                │   ├── esop/
                                      │   ├── retirement/
                                      │   └── reports/
```

---

## Target Tab Structure (8 Tabs)

```
INVESTMENTS PAGE
├── Tab 1: Overview (NEW - consolidated dashboard)
├── Tab 2: Mutual Funds (filtered from existing)
├── Tab 3: Stocks & ETFs (filtered from existing)
├── Tab 4: Fixed Deposits & Bonds (filtered from existing)
├── Tab 5: Real Estate (move from /property)
├── Tab 6: ESOPs & RSUs (move from /esop)
├── Tab 7: Retirement Funds (move from /retirement + add PPF)
└── Tab 8: Reports (NEW)
```

---

## Phase 1: Navigation Restructure (Days 1-2)

### 1.1 Create Investments Section Layout

```typescript
// src/app/dashboard/investments/layout.tsx (NEW)
export default function InvestmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <InvestmentsSectionHeader />
      <InvestmentsTabs />
      {children}
    </div>
  );
}
```

### 1.2 New Files to Create

```
src/app/dashboard/investments/
├── layout.tsx                      # Section layout with tabs
├── page.tsx                        # Overview (refactor existing)
├── mutual-funds/page.tsx           # Filtered MF view
├── stocks/page.tsx                 # Filtered stocks view
├── fixed-deposits/page.tsx         # Filtered FD/bonds view
├── real-estate/page.tsx            # Move from /property
├── esop/page.tsx                   # Move from /esop
├── retirement/page.tsx             # Move from /retirement
└── reports/page.tsx                # NEW reports tab
```

### 1.3 Components to Create

```
src/components/investments/
├── InvestmentsSectionHeader.tsx    # Header with family toggle
├── InvestmentsTabs.tsx             # Tab navigation
├── InvestmentsOverview.tsx         # Overview dashboard
└── InvestmentMetricsCards.tsx      # Summary metric cards
```

### 1.4 Sidebar Navigation Update

Update `src/components/dashboard/DashboardSidebar.tsx`:

```typescript
// Replace scattered investment links with single section
{
  title: 'Investments',
  icon: TrendingUp,
  href: '/dashboard/investments',
  children: [
    { title: 'Overview', href: '/dashboard/investments' },
    { title: 'Mutual Funds', href: '/dashboard/investments/mutual-funds' },
    { title: 'Stocks & ETFs', href: '/dashboard/investments/stocks' },
    { title: 'Fixed Deposits', href: '/dashboard/investments/fixed-deposits' },
    { title: 'Real Estate', href: '/dashboard/investments/real-estate' },
    { title: 'ESOPs', href: '/dashboard/investments/esop' },
    { title: 'Retirement', href: '/dashboard/investments/retirement' },
    { title: 'Reports', href: '/dashboard/investments/reports' },
  ]
}
```

---

## Phase 2: Overview Dashboard (Days 2-3)

### 2.1 Overview Page UI Wireframe

```
+------------------------------------------------------------------+
| INVESTMENTS                      [Family: Individual ▼]           |
+------------------------------------------------------------------+
| [Overview] [MF] [Stocks] [FD] [Real Estate] [ESOP] [Retirement]   |
+------------------------------------------------------------------+
| PORTFOLIO SUMMARY                                                 |
| +---------------+ +---------------+ +---------------+             |
| | Total Value   | | Today's Gain  | | Overall Return|             |
| | ₹85,42,350    | | +₹12,450      | | +18.5% (CAGR) |             |
| +---------------+ +---------------+ +---------------+             |
+------------------------------------------------------------------+
| ASSET ALLOCATION                    | TOP HOLDINGS                |
| +-----------------------------+     | +-------------------------+ |
| | [Pie Chart]                 |     | | 1. HDFC Equity    ₹12L  | |
| | Equity: 65% (₹55L)          |     | | 2. Infosys        ₹8L   | |
| | Debt: 20% (₹17L)            |     | | 3. Flat - Pune    ₹45L  | |
| | Gold: 5% (₹4L)              |     | | 4. PPF Account    ₹8L   | |
| | Real Estate: 10% (₹9L)      |     | | 5. NPS Tier 1     ₹5L   | |
| +-----------------------------+     | +-------------------------+ |
+------------------------------------------------------------------+
| QUICK ACTIONS                                                     |
| [+ Add Investment] [Import CAS] [Sync Broker] [Rebalance Check]  |
+------------------------------------------------------------------+
| CATEGORY BREAKDOWN                                                |
| +------------+ +------------+ +------------+ +------------+       |
| | Mutual     | | Stocks     | | Fixed      | | Real       |       |
| | Funds      | | & ETFs     | | Deposits   | | Estate     |       |
| | ₹32,50,000 | | ₹15,20,000 | | ₹8,00,000  | | ₹45,00,000 |       |
| | +12.5%     | | +22.3%     | | +7.2%      | | +8.5%      |       |
| | [View →]   | | [View →]   | | [View →]   | | [View →]   |       |
| +------------+ +------------+ +------------+ +------------+       |
| +------------+ +------------+ +------------+                      |
| | ESOPs      | | Retirement | | Goals      |                      |
| | ₹12,00,000 | | ₹18,50,000 | | 3 Active   |                      |
| | +45.2%     | | +9.8%      | | On Track   |                      |
| | [View →]   | | [View →]   | | [View →]   |                      |
| +------------+ +------------+ +------------+                      |
+------------------------------------------------------------------+
```

### 2.2 API Updates for Overview

```
src/app/api/investments/overview/route.ts     # GET aggregated data
```

```typescript
// Response structure
interface InvestmentOverview {
  totalValue: number;
  todaysGain: number;
  overallReturn: { absolute: number; percentage: number; cagr: number };
  allocation: { equity: number; debt: number; gold: number; realEstate: number; cash: number };
  categoryBreakdown: {
    mutualFunds: { value: number; return: number; count: number };
    stocks: { value: number; return: number; count: number };
    fixedDeposits: { value: number; return: number; count: number };
    realEstate: { value: number; return: number; count: number };
    esop: { value: number; return: number; count: number };
    retirement: { value: number; return: number; count: number };
  };
  topHoldings: { name: string; type: string; value: number; return: number }[];
  rebalancingNeeded: boolean;
  goalProgress: { total: number; onTrack: number; behind: number };
}
```

---

## Phase 3: PPF Tracking (Days 3-4)

### PPF Rules Reference (Verified)

| Parameter | Value |
|-----------|-------|
| Interest Rate | 7.1% p.a. (compounded annually, govt revises quarterly) |
| Min Deposit | ₹500/year |
| Max Deposit | ₹1,50,000/year |
| Tenure | 15 years (from end of FY account opened) |
| Tax Status | EEE (Exempt-Exempt-Exempt) |
| Partial Withdrawal | After 5 complete FYs (from 7th year), max 50% of 4th preceding year balance |
| Loan Facility | Year 3 to Year 6, max 25% of 2nd preceding year balance, PPF rate + 1% |
| Extension | 5-year blocks after maturity (with or without contribution) |

### 3.1 New Prisma Models

```prisma
model PPFAccount {
  id                    String   @id @default(cuid())
  userId                String
  accountNumber         String
  accountHolderName     String
  bankOrPostOffice      String   // "SBI" | "POST_OFFICE" | etc.
  branchName            String?

  // Dates
  openingDate           DateTime
  maturityDate          DateTime // 15 years from end of opening FY
  financialYearOpened   String   // "2020-21"

  // Balance
  currentBalance        Float    @default(0)
  totalDeposits         Float    @default(0)
  totalInterestEarned   Float    @default(0)

  // Current FY tracking
  currentFYDeposits     Float    @default(0)
  currentFY             String   // "2025-26"

  // Extension
  isExtended            Boolean  @default(false)
  extensionType         String?  // "WITH_CONTRIBUTION" | "WITHOUT_CONTRIBUTION"
  extensionStartDate    DateTime?
  extensionEndDate      DateTime?

  // Loan (if any)
  hasActiveLoan         Boolean  @default(false)
  loanAmount            Float    @default(0)
  loanDate              DateTime?
  loanDueDate           DateTime?

  // Family member (for spouse/child accounts)
  familyMemberId        String?
  isMinorAccount        Boolean  @default(false)
  guardianName          String?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions          PPFTransaction[]

  @@index([userId])
}

model PPFTransaction {
  id              String   @id @default(cuid())
  accountId       String
  transactionType String   // DEPOSIT, INTEREST_CREDIT, PARTIAL_WITHDRAWAL, LOAN_TAKEN, LOAN_REPAYMENT
  amount          Float
  transactionDate DateTime
  financialYear   String   // "2024-25"
  balanceAfter    Float
  notes           String?
  loanInterestRate Float?  // For loan transactions

  createdAt       DateTime @default(now())
  account         PPFAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId, financialYear])
}
```

### 3.2 PPF Calculation Module

```typescript
// src/lib/calculations/ppf.ts (NEW)
export const PPF_CONFIG = {
  INTEREST_RATE: 0.071,          // 7.1% (updated quarterly by govt)
  MIN_ANNUAL_DEPOSIT: 500,
  MAX_ANNUAL_DEPOSIT: 150000,
  LOCK_IN_YEARS: 15,
  EXTENSION_BLOCK_YEARS: 5,
  PARTIAL_WITHDRAWAL_YEAR: 7,    // After 6 complete years
  LOAN_AVAILABLE_YEARS: { from: 3, to: 6 },
  INTEREST_CALCULATION: 'MONTHLY_MINIMUM_BALANCE',
} as const;

export function calculatePPFInterest(monthlyBalances: number[]): number;
export function calculatePPFMaturityValue(params: PPFProjectionParams): PPFProjection;
export function canMakePartialWithdrawal(account: PPFAccount): boolean;
export function calculateLoanEligibility(account: PPFAccount): LoanEligibility;
export function getPPFTaxBenefits(contribution: number): TaxBenefit;
```

### 3.3 PPF API Routes

```
src/app/api/ppf/
├── route.ts                        # GET/POST PPF account
├── [id]/route.ts                   # PUT/DELETE account
├── [id]/transactions/route.ts      # GET/POST transactions
├── [id]/projection/route.ts        # GET maturity projection
├── [id]/withdrawal/route.ts        # POST partial withdrawal
└── [id]/loan/route.ts              # GET loan eligibility
```

### 3.4 PPF Components

```
src/components/retirement/
├── PPFDashboard.tsx                # PPF account dashboard
├── PPFTransactionForm.tsx          # Add deposit/withdrawal
├── PPFProjectionChart.tsx          # Maturity projection
└── PPFLoanCalculator.tsx           # Loan eligibility
```

---

## Phase 4: EPF CRUD API (Day 4)

> **Note**: Property API deferred per user decision - uses existing generic endpoints.

### EPF API Routes

Currently EPF data is managed through the retirement page but lacks proper API.

```
src/app/api/epf/
├── route.ts                        # GET/POST EPF account
├── [id]/route.ts                   # PUT/DELETE account
├── [id]/contributions/route.ts     # GET contribution history
├── [id]/projection/route.ts        # GET corpus projection at retirement
└── balance/route.ts                # POST update balance (manual from EPFO)
```

### API Response Examples

**GET /api/epf**
```typescript
{
  id: "xxx",
  uan: "100123456789",
  establishmentCode: "MHBAN0012345",
  currentBalance: 1250000,
  employeeShare: 750000,
  employerShare: 500000,
  pensionFund: 180000,
  lastUpdated: "2024-12-15",
  monthlyContribution: {
    basic: 120000,
    employee: 14400,      // 12% of basic
    employerEPF: 10800,   // 3.67% of basic
    employerEPS: 3600,    // 8.33% of basic (max ₹15,000 wage ceiling)
    vpf: 5000             // Voluntary
  },
  projectedCorpusAt60: 8500000
}
```

---

## Phase 5: Family View Integration (Days 4-5)

### 5.1 API Updates

All investment APIs need `familyMemberId` query parameter support:

```typescript
// Example: GET /api/investments?familyMemberId=all
// Returns aggregated investments for all family members

interface FamilyInvestmentResponse {
  aggregated: InvestmentSummary;
  byMember: {
    memberId: string;
    memberName: string;
    investments: Investment[];
    totalValue: number;
    percentageOfTotal: number;
  }[];
}
```

### 5.2 Components for Family View

```
src/components/investments/
├── FamilyInvestmentBreakdown.tsx   # Member-wise breakdown
├── FamilyAllocationChart.tsx       # Allocation by member
└── FamilyContributionTable.tsx     # Contribution percentages
```

### 5.3 Family View UI

```
+------------------------------------------------------------------+
| INVESTMENTS - Family View                                         |
+------------------------------------------------------------------+
| FAMILY TOTAL: ₹1,25,42,350                                        |
+------------------------------------------------------------------+
| MEMBER BREAKDOWN                                                  |
| +------------------+ +------------------+ +------------------+     |
| | Self             | | Spouse           | | Child 1          |     |
| | ₹85,42,350 (68%) | | ₹32,00,000 (26%) | | ₹8,00,000 (6%)   |     |
| +------------------+ +------------------+ +------------------+     |
+------------------------------------------------------------------+
| ALLOCATION BY MEMBER                                              |
| [Stacked Bar Chart showing each member's contribution]            |
+------------------------------------------------------------------+
```

---

## Phase 6: Reports Tab (Days 7-8)

### 6.1 Report Types

| Report | Content |
|--------|---------|
| **Portfolio Summary** | Total holdings, allocation, returns |
| **Performance Analysis** | XIRR, CAGR, benchmark comparison |
| **Tax Report** | Capital gains, dividend income, tax-saving investments |
| **Family Report** | Aggregated family investments |

### 6.2 UI Wireframe

```
+------------------------------------------------------------------+
| INVESTMENT REPORTS                                                |
+------------------------------------------------------------------+
| [Report Type]                                                     |
| [Portfolio Summary] [Performance] [Tax Report] [Family Report]    |
+------------------------------------------------------------------+
| [View Mode]  [Monthly ▼]  [Quarterly]  [Yearly]  [Custom Range]  |
+------------------------------------------------------------------+
| MONTHLY VIEW:                                                     |
| ◀ Previous │  [January 2024 ▼]  │ Next ▶    [Generate Report]    |
+------------------------------------------------------------------+
| [Report Preview]                                                  |
| +--------------------------------------------------------------+ |
| | PORTFOLIO SUMMARY - January 2024                              | |
| | Total Value: ₹85,42,350                                       | |
| | Monthly Change: +₹1,25,000 (+1.5%)                           | |
| |                                                               | |
| | [Allocation Pie Chart]    [Performance Line Chart]            | |
| |                                                               | |
| | Top Performers:                                               | |
| | 1. HDFC Small Cap Fund   +5.2%                               | |
| | 2. Infosys Ltd           +3.8%                               | |
| +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
| [Download PDF]  [Download Excel]  [Download CSV]                  |
+------------------------------------------------------------------+
```

### 6.3 New Files

```
src/services/reports/InvestmentReportService.ts    # Report generation
src/app/api/investments/reports/
├── route.ts                                       # GET report data
├── portfolio-summary/route.ts                     # Portfolio report
├── performance/route.ts                           # Performance report
├── tax/route.ts                                   # Tax report
├── family/route.ts                                # Family report
└── export/route.ts                                # PDF/Excel export
```

---

## Phase 7: Integration & Testing (Days 9-10)

### 7.1 Page Migrations

| Current Path | New Path | Action |
|--------------|----------|--------|
| `/dashboard/investments` | `/dashboard/investments` | Refactor to overview |
| `/dashboard/portfolio` | `/dashboard/investments` | Merge into overview |
| `/dashboard/esop` | `/dashboard/investments/esop` | Move |
| `/dashboard/property` | `/dashboard/investments/real-estate` | Move |
| `/dashboard/retirement` | `/dashboard/investments/retirement` | Move |

### 7.2 Redirect Setup

```typescript
// src/middleware.ts - Add redirects for old URLs
const investmentRedirects = {
  '/dashboard/portfolio': '/dashboard/investments',
  '/dashboard/esop': '/dashboard/investments/esop',
  '/dashboard/property': '/dashboard/investments/real-estate',
  '/dashboard/retirement': '/dashboard/investments/retirement',
};
```

### 7.3 Tests to Create

```
tests/e2e/investments-overview.spec.ts       # Overview E2E
tests/e2e/investments-ppf.spec.ts            # PPF E2E
tests/e2e/investments-reports.spec.ts        # Reports E2E
tests/e2e/investments-family.spec.ts         # Family view E2E
src/lib/calculations/__tests__/ppf.test.ts   # PPF calculations
src/services/__tests__/InvestmentReportService.test.ts
```

---

## Implementation Order Summary

| Phase | Feature | Days | Priority |
|-------|---------|------|----------|
| 1 | Navigation Restructure | 2 | P0 |
| 2 | Overview Dashboard | 1 | P0 |
| 3 | PPF Tracking | 1.5 | P1 |
| 4 | EPF CRUD API | 0.5 | P1 |
| 5 | Family View Integration | 1.5 | P1 |
| 6 | Reports Tab | 1.5 | P1 |
| 7 | Integration & Testing | 1 | P0 |
| **Total** | | **9 days** | |

### User Decisions Made

| Decision | Choice |
|----------|--------|
| Navigation Style | **Sub-pages** - Separate pages under `/investments/*` |
| Property API | **Deferred** - Use existing generic endpoints |
| PPF Tracking | **Full implementation** with loan/withdrawal rules |

---

## New Files Summary

### Prisma Models (2 new)
- `PPFAccount` - PPF account tracking with loan/extension support
- `PPFTransaction` - PPF transaction history

### Calculations (1 new)
- `src/lib/calculations/ppf.ts` - PPF interest, projection, withdrawal, loan

### Services (1 new)
- `src/services/reports/InvestmentReportService.ts` - Report generation

### API Routes (18 new)
- `/api/investments/overview` - Aggregated overview
- `/api/ppf/*` (6 routes) - PPF CRUD
- `/api/epf/*` (5 routes) - EPF CRUD
- `/api/investments/reports/*` (6 routes) - Reports

### Pages (8 restructured)
- `/dashboard/investments/` - Layout + Overview
- `/dashboard/investments/mutual-funds/`
- `/dashboard/investments/stocks/`
- `/dashboard/investments/fixed-deposits/`
- `/dashboard/investments/real-estate/`
- `/dashboard/investments/esop/`
- `/dashboard/investments/retirement/`
- `/dashboard/investments/reports/`

### Components (15+ new)
- Section components (4): Header, Tabs, Overview, Metrics
- PPF components (4): Dashboard, Form, Chart, Calculator
- Family components (3): Breakdown, Chart, Table
- Report components (4): Tab, Selector, Preview, Export

---

## Dependencies

- **Existing Infrastructure**: Investment model, calculation modules
- **Family View**: UserViewPreference model (exists)
- **Reports**: jspdf, xlsx (already installed)
- **Charts**: Chart.js, Recharts (already installed)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Page migration breaks links | High | Add redirects in middleware |
| Large refactor scope | Medium | Phase by phase implementation |
| Family view complexity | Medium | Leverage existing FamilyAggregationService |

---

## Related Plan Documents

1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation
2. `docs/Income-Section-Plan.md` - Income section (Salary + Non-Salary)
3. `docs/Plans/Tax-Planning-Section-Plan.md` - Tax planning
4. `docs/Plans/Expenses-Section-Plan.md` - Expenses section
5. **`docs/Plans/Investments-Section-Plan.md`** - This plan

---

---

**Status: ✅ APPROVED & READY FOR IMPLEMENTATION**

*Plan approved on January 7, 2026 with user-requested modifications:*
- *Sub-pages navigation (not tabs)*
- *Property API deferred*
- *Full PPF tracking with verified rules*
