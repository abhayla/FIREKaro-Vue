# Plan: Income Section - Complete Verification

> **Status**: Verified Complete
> **Created**: January 7, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Income Section)
> **Last Verified**: January 7, 2026

---

## Income Section Coverage Verification

### Required Structure (from Feature-Reorganization-Plan.md)
```
2. INCOME
   ├── All Sources (yearly view with monthly breakdown)
   │   ├── Salary (components: additions/deductions)
   │   ├── Business/Profession
   │   ├── Rental Income
   │   ├── Capital Gains
   │   ├── Dividends/Interest
   │   └── Other Sources (custom rows)
   ├── Salary History (monthly component tracking)
   └── [Reports Tab]
```

### Coverage Status: ALL ITEMS PLANNED

| Required Item | Status | Plan Document | Phase/Section |
|--------------|--------|---------------|---------------|
| All Sources (yearly view) | Done | Non-Salary-Income-Plan.md | Phase 1: Income Landing Page |
| Salary (components) | Done | Salary-Section-Plan.md | ~10 days, with sync to EPF/NPS |
| Business/Profession | Done | Non-Salary-Income-Plan.md | Phase 2: 44AD/44ADA + Regular Books |
| Rental Income | Done | Non-Salary-Income-Plan.md | Phase 3: Property-linked + Section 24 |
| Capital Gains | Done | Non-Salary-Income-Plan.md | Phase 4: STCG/LTCG + Budget 2024 rules |
| Interest Income | Done | Non-Salary-Income-Plan.md | Phase 5: SEPARATE screen (FD/Savings/P2P) |
| Dividend Income | Done | Non-Salary-Income-Plan.md | Phase 6: SEPARATE screen (Stocks/MF) |
| Other Sources | Done | Non-Salary-Income-Plan.md | Phase 7: Commission wizard + Freelance |
| Salary History | Done | Salary-Section-Plan.md | Monthly component tracking |
| **Reports Tab** | Done | **This Plan** | **Phase 8 (NEW)** |

---

## Scope

Build the **Income Section UI** for all income types as per Feature-Reorganization-Plan.md:
- Salary (covered in Salary-Section-Plan.md)
- Business/Profession (with both Presumptive 44AD/44ADA AND Regular Books)
- Rental/House Property (Section 24 deductions)
- Capital Gains (Equity, Property, Other assets)
- Interest Income (FD, RD, Savings, P2P, Bonds) - SEPARATE SCREEN
- Dividend Income (Stocks, Mutual Funds) - SEPARATE SCREEN
- Other Sources (Commission, Royalties, Gifts, Pension, etc.)
- **Reports Tab** (Summary, Charts, Export, Family Breakdown)

---

## Current State Analysis

### Backend: MOSTLY IMPLEMENTED
| Income Type | Model | API Routes | Status |
|-------------|-------|------------|--------|
| Business | BusinessEntity + 5 related models | 15 routes | Ready |
| Rental | Property, RentalIncome, PropertyExpense | 7 routes | Ready |
| Capital Gains | CapitalGainsDetail | 1 route | Needs expansion |
| Dividends/Interest | OtherIncomeDetail | Via income-sources | Ready |
| HUF | HUFEntity | 1 route | Ready |

### Frontend: NEEDS IMPLEMENTATION
| Page | Current State |
|------|---------------|
| `/dashboard/income` | Does NOT exist |
| `/dashboard/income/business` | Does NOT exist |
| `/dashboard/income/rental` | Does NOT exist |
| `/dashboard/income/capital-gains` | Does NOT exist |
| `/dashboard/income/interest` | Does NOT exist (NEW - separate from dividends) |
| `/dashboard/income/dividends` | Does NOT exist (NEW - separate from interest) |
| `/dashboard/income/other` | Does NOT exist |

### Calculation Gaps
1. **Presumptive Taxation (44AD/44ADA)** - NOT implemented
2. **Equity Capital Gains** - No detailed tracking
3. **Loss Carryforward** - NOT implemented

---

## User Decisions

| Decision | Choice |
|----------|--------|
| Taxation Method | **Both** - Support Presumptive (44AD/44ADA) AND Regular Books |
| Interest vs Dividends | **Separate Screens** - Interest and Dividend income on different pages |
| Rental-Property Link | **Mandatory** - Rental income must be attached to a Property. Prompt user to add property if missing |
| Stock API | **Future Phase** - Plan for it but implement manual entry first |
| Priority | **All in order shown** - Business -> Rental -> Capital Gains -> Interest -> Dividends -> Other |

---

## Implementation Plan

### Phase 1: Income Landing Page

**File**: `src/app/dashboard/income/page.tsx`

**UI Structure**:
```
+------------------------------------------------------------------+
| Income Sources                          FY [2024-25 v] [+ Add]   |
+------------------------------------------------------------------+
| +----------+ +----------+ +----------+ +----------+              |
| | Total    | | Total    | | Total    | | Sources  |              |
| | Gross    | | Deduct.  | | Taxable  | | Active   |              |
| | Rs42.5L  | | Rs5.2L   | | Rs37.3L  | |    4     |              |
| +----------+ +----------+ +----------+ +----------+              |
+------------------------------------------------------------------+
| [All] [Salary] [Business] [Rental] [Cap Gains] [Interest] [Dividends] [Other] |
+------------------------------------------------------------------+
|                                                                  |
| SALARY                                                           |
| +--------------------------------------------------------------+ |
| | Cognizant Technology Solutions       Rs36,11,826 gross       | |
| | Full-Time | 12/12 months             Rs23,01,618 net         | |
| |                            [View Monthly Breakdown ->]       | |
| +--------------------------------------------------------------+ |
|                                                                  |
| BUSINESS / PROFESSION                                            |
| +--------------------------------------------------------------+ |
| | Kumar Consulting (Proprietorship)     Rs8,50,000 revenue     | |
| | Presumptive 44ADA | GST Registered    Rs4,25,000 profit      | |
| |                                  [View Details ->]           | |
| +--------------------------------------------------------------+ |
|                                                                  |
| RENTAL INCOME                                                    |
| +--------------------------------------------------------------+ |
| | Green Tower Apt, Pune                 Rs3,60,000/year        | |
| | Residential | Tenant: Mr. Sharma      Rs30,000/month         | |
| |                                  [View Details ->]           | |
| +--------------------------------------------------------------+ |
|                                                                  |
| CAPITAL GAINS                                                    |
| +--------------------------------------------------------------+ |
| | 3 Transactions | FY 2024-25           Rs1,85,000 total gain  | |
| | LTCG: Rs1,50,000 | STCG: Rs35,000     Tax: Rs42,250          | |
| |                                  [View Details ->]           | |
| +--------------------------------------------------------------+ |
|                                                                  |
| INTEREST INCOME                                                  |
| +--------------------------------------------------------------+ |
| | FD/RD: Rs65,000 | Savings: Rs12,000 | P2P: Rs8,000           | |
| | TDS Deducted: Rs6,500 | 80TTA: Rs10,000 Rs85,000 total       | |
| |                                  [View Details ->]           | |
| +--------------------------------------------------------------+ |
|                                                                  |
| DIVIDEND INCOME                                                  |
| +--------------------------------------------------------------+ |
| | Stocks: Rs15,000 | Mutual Funds: Rs5,000                     | |
| | TDS Deducted: Rs1,500                  Rs20,000 total         | |
| |                                  [View Details ->]           | |
| +--------------------------------------------------------------+ |
|                                                                  |
| [+ Add Income Source]                                            |
+------------------------------------------------------------------+
```

**Files to Create**:
```
src/app/dashboard/income/
├── page.tsx                    # Landing page with all source cards
├── layout.tsx                  # Shared layout with tabs
└── components/
    ├── IncomeSourceCard.tsx    # Reusable card component
    ├── IncomeSummaryCards.tsx  # 4-card summary grid
    └── AddIncomeSourceDialog.tsx # Add new source modal
```

---

### Phase 2: Business/Profession Pages

**URL**: `/dashboard/income/business/[id]`

**Features**:
1. **Taxation Method Toggle**: Presumptive (44AD/44ADA) vs Regular Books
2. **Revenue & Expense Tracking** (for Regular Books)
3. **GST Summary** (if registered)
4. **Depreciation Schedule**
5. **Monthly P&L View**

**44AD vs 44ADA Rules**:
| Section | For | Deemed Profit | Turnover Limit | ITR Form |
|---------|-----|---------------|----------------|----------|
| 44AD | Business | 8% (6% digital) | Rs2 Crore | ITR-4 |
| 44ADA | Profession | 50% | Rs50 Lakhs | ITR-4 |

**Files to Create**:
```
src/app/dashboard/income/business/
├── page.tsx                    # List all business entities
├── [id]/
│   ├── page.tsx                # Business detail page
│   ├── transactions/page.tsx   # GST transactions
│   ├── depreciation/page.tsx   # Asset depreciation
│   └── gst/page.tsx            # GST filing status
└── components/
    ├── PresumptiveTaxCard.tsx  # 44AD/44ADA calculator
    ├── RegularBooksCard.tsx    # P&L summary
    ├── GSTStatusCard.tsx       # GST compliance
    └── BusinessSummaryCards.tsx
```

**Calculation to Add**:
```typescript
// src/lib/calculations/presumptive-tax.ts
interface PresumptiveTaxResult {
  section: '44AD' | '44ADA';
  grossReceipts: number;
  deemedProfitRate: number;  // 8% or 50%
  digitalPaymentRate?: number; // 6% for 44AD
  deemedProfit: number;
  isEligible: boolean;
  eligibilityReason?: string;
  itrForm: 'ITR-4';
}

function calculate44AD(turnover: number, digitalPercentage: number): PresumptiveTaxResult;
function calculate44ADA(grossReceipts: number): PresumptiveTaxResult;
```

---

### Phase 3: Rental Income Pages

**URL**: `/dashboard/income/rental/[propertyId]`

**IMPORTANT: Property Linking Requirement**
- Rental income MUST be attached to a Property from the Investments section
- When adding rental income, show property selector dropdown
- If no properties exist or correct property not found:
  - Show prompt: "Property not found? [+ Add New Property]"
  - Link to `/dashboard/investments/real-estate/add`
  - After property creation, return to rental income flow

**Features**:
1. **Property Selector** (from existing properties)
2. **Property Details** (address, type, tenant)
3. **Rental Income Tracking** (monthly)
4. **Section 24 Deductions**:
   - Standard Deduction (30% of NAV)
   - Interest on Housing Loan (up to Rs2L for self-occupied, unlimited for let-out)
   - Municipal Taxes paid
5. **Net Annual Value Calculation**

**Files to Create**:
```
src/app/dashboard/income/rental/
├── page.tsx                    # List all rental income entries
├── add/page.tsx                # Add rental income (with property selector)
├── [propertyId]/
│   ├── page.tsx                # Property rental detail
│   ├── payments/page.tsx       # Monthly payment tracking
│   └── expenses/page.tsx       # Maintenance, repairs, taxes
└── components/
    ├── PropertySelector.tsx    # Dropdown with "Add Property" link
    ├── Section24Calculator.tsx # House property deductions
    ├── RentPaymentTracker.tsx  # Monthly FY grid
    └── PropertyDetailsCard.tsx
```

**Property Selector Logic**:
```typescript
// src/app/dashboard/income/rental/components/PropertySelector.tsx
interface PropertySelectorProps {
  properties: Property[];
  selectedPropertyId: string | null;
  onSelect: (propertyId: string) => void;
  returnUrl?: string; // URL to return after adding property
}

// If no properties or "Add New" clicked:
// 1. Store returnUrl in sessionStorage
// 2. Navigate to /dashboard/investments/real-estate/add?returnTo=/dashboard/income/rental/add
// 3. After property creation, redirect back
```

---

### Phase 4: Capital Gains Pages

**URL**: `/dashboard/income/capital-gains`

**Features**:
1. **Transaction List** (Buy/Sell pairs)
2. **Asset Type Filter** (Equity, Debt MF, Property, Gold, Crypto)
3. **STCG vs LTCG Classification**
4. **CII Indexation** (for LTCG on property, gold, debt MF)
5. **Section 54/54F Exemption Tracking**
6. **Tax Summary**

**Tax Rules to Implement (Post Budget 2024 - July 23, 2024):**
| Asset Type | STCG Period | LTCG Period | STCG Tax | LTCG Tax | Notes |
|------------|-------------|-------------|----------|----------|-------|
| Equity/Equity MF | < 12 mo | >= 12 mo | **20%** | **12.5%** (>Rs1.25L) | Changed from 15%/10% |
| Debt MF (post 2023) | Any | Any | Slab rate | Slab rate | No LTCG benefit |
| Property | < 24 mo | >= 24 mo | Slab rate | **12.5%** OR 20%+CII | Choice for pre-July 2024 buys |
| Gold/Others | < 24 mo | >= 24 mo | Slab rate | **12.5%** | No indexation |

**Note:** For property/gold bought before July 23, 2024, taxpayer can choose between:
- 12.5% flat rate (no indexation)
- 20% with indexation (CII benefit)
System should calculate both and recommend the lower tax option.

**Files to Create**:
```
src/app/dashboard/income/capital-gains/
├── page.tsx                    # Capital gains summary
├── add/page.tsx                # Add transaction
├── [id]/page.tsx               # Transaction detail
└── components/
    ├── CapitalGainsSummary.tsx # STCG/LTCG breakdown
    ├── TransactionTable.tsx    # All transactions
    ├── CIICalculator.tsx       # Cost Inflation Index
    └── Section54Tracker.tsx    # Exemption tracking
```

---

### Phase 5: Interest Income Page (Separate Screen)

**URL**: `/dashboard/income/interest`

**Features**:
1. **FD/RD Interest Tracking** (with TDS, maturity dates)
2. **Savings Interest** (Section 80TTA - Rs10K exemption, 80TTB - Rs50K for seniors)
3. **P2P Lending Interest**
4. **Bonds/Debentures Interest**
5. **Post Office Schemes** (NSC, SCSS, etc.)
6. **TDS Summary & Reconciliation**

**Files to Create**:
```
src/app/dashboard/income/interest/
├── page.tsx                    # Interest income summary
├── fd/page.tsx                 # FD/RD management
├── savings/page.tsx            # Savings account interest
├── add/page.tsx                # Add interest source
└── components/
    ├── FDInterestTable.tsx     # FD listing with TDS
    ├── SavingsInterest80TTA.tsx # 80TTA/80TTB calculator
    ├── P2PInterestCard.tsx     # P2P lending tracking
    ├── BondInterestCard.tsx    # Bonds/debentures
    └── TDSSummary.tsx          # TDS reconciliation
```

---

### Phase 6: Dividend Income Page (Separate Screen)

**URL**: `/dashboard/income/dividends`

**Features**:
1. **Stock Dividends** (fully taxable since 2020)
2. **Mutual Fund Dividends** (now taxable at slab rate)
3. **TDS Tracking** (10% TDS above Rs5,000)
4. **Dividend History** by stock/fund

**Files to Create**:
```
src/app/dashboard/income/dividends/
├── page.tsx                    # Dividend income summary
├── add/page.tsx                # Add dividend entry
└── components/
    ├── StockDividendTable.tsx  # Stock dividend listing
    ├── MFDividendTable.tsx     # Mutual fund dividends
    ├── DividendTDSCard.tsx     # TDS tracking
    └── DividendSummaryCards.tsx
```

---

### Phase 7: Other Income Sources (Including Commission)

**URL**: `/dashboard/income/other`

**Features**:
1. **Commission Income** (agent, broker, referral)
2. **Freelance/Consulting** (one-off projects)
3. **Royalties** (books, music, patents)
4. **Lottery/Game Show Winnings** (30% flat tax)
5. **Gifts** (exemptions for relatives)
6. **Pension** (commuted vs uncommuted)
7. **Agricultural Income** (exempt but for rate purposes)
8. **Family Pension** (after death of earning member)

**Files to Create**:
```
src/app/dashboard/income/other/
├── page.tsx                    # Other sources list
├── add/page.tsx                # Add with type selector
├── commission/page.tsx         # Commission income wizard
└── components/
    ├── OtherIncomeTable.tsx    # All other income entries
    ├── CommissionWizard.tsx    # Regular vs Occasional flow
    ├── GiftExemptionCalc.tsx   # Relative exemption logic
    └── LotteryTaxCalculator.tsx # 30% flat tax
```

---

### Phase 8: Income Reports Tab (NEW)

**URL**: `/dashboard/income/reports` or Tab within Income section

**As per Feature-Reorganization-Plan.md (lines 198-226)**:

**Features**:
1. **Summary Statistics**
   - Total income for FY
   - Month-over-month change
   - Year-over-year comparison
   - Tax liability summary

2. **Visualizations**
   - Trend charts (line/area) - Monthly income over FY
   - Distribution charts (pie/donut) - Income by source
   - Comparison charts (bar) - YoY comparison by source

3. **Family Breakdown** (if Family view enabled)
   - Per-member totals
   - Contribution percentages
   - Member comparison chart

4. **Export Options**
   - Download PDF (formatted report)
   - Download Excel (raw data)
   - Share Report (link/email)
   - Print-friendly view

5. **Historical Data**
   - Previous years comparison
   - Growth trends

**Files to Create**:
```
src/app/dashboard/income/reports/
├── page.tsx                    # Reports landing page
└── components/
    ├── IncomeSummaryStats.tsx  # 4-card summary
    ├── IncomeTrendChart.tsx    # Monthly line chart
    ├── IncomeSourcePie.tsx     # Pie chart by source
    ├── IncomeYoYComparison.tsx # Bar chart YoY
    ├── FamilyBreakdownTable.tsx # Family member breakdown
    ├── HistoricalComparison.tsx # Previous years
    └── ExportOptions.tsx       # PDF/Excel/Share buttons

src/lib/reports/
├── income-report-generator.ts  # PDF generation logic
└── income-report-excel.ts      # Excel export logic
```

---

## Commission Income - Tax Treatment Guide

**How to Add Commission Income:**

Commission income can be categorized in 3 ways depending on its nature:

| Scenario | Income Type | Tax Treatment | Where to Add |
|----------|-------------|---------------|--------------|
| **Regular Agent/Broker** (Insurance, Real Estate, MLM) | Business Income | Sec 44AD - 8% deemed profit | `/income/business` -> Add Business -> Type: Commission Agent |
| **Professional Commission** (Consultant, Advisor fees) | Professional Income | Sec 44ADA - 50% deemed profit | `/income/business` -> Add Profession -> Nature: Consultancy |
| **One-off/Occasional Commission** (Referral bonus, finders fee) | Other Sources | Taxed at slab rate | `/income/other` -> Add -> Type: Commission |

**Commission Agent Business (44AD):**
- Insurance Agent, LIC Agent
- Real Estate Broker
- Stock Broker (sub-broker)
- MLM/Direct Selling
- Delivery Partner (Swiggy, Zomato)
- Any commission-based regular income

**Turnover Limits:**
- Up to Rs2 Crore: Section 44AD (8% deemed profit)
- Above Rs2 Crore: Must maintain books, audit required

---

## New Calculations to Add

### File: `src/lib/calculations/presumptive-tax.ts`
```typescript
// Section 44AD (Business) - 8% deemed profit (6% for digital)
export function calculate44AD(params: {
  turnover: number;
  digitalPaymentPercentage: number;
}): PresumptiveTaxResult;

// Section 44ADA (Profession) - 50% deemed profit
export function calculate44ADA(params: {
  grossReceipts: number;
}): PresumptiveTaxResult;

// Check eligibility
export function checkPresumptiveEligibility(params: {
  entityType: 'BUSINESS' | 'PROFESSION';
  turnover: number;
  hasAuditRequirement: boolean;
}): EligibilityResult;
```

### File: `src/lib/calculations/house-property.ts`
```typescript
// Section 24 - Income from House Property
export function calculateHousePropertyIncome(params: {
  grossAnnualValue: number;
  municipalTaxesPaid: number;
  housingLoanInterest: number;
  isLetOut: boolean;
  isSelfOccupied: boolean;
}): HousePropertyResult;
```

---

## API Enhancements Needed

| Endpoint | Enhancement |
|----------|-------------|
| `POST /api/business-entity/presumptive` | Add presumptive tax calculation |
| `GET /api/capital-gains` | NEW: List all capital gains transactions |
| `POST /api/capital-gains` | NEW: Add capital gain transaction |
| `GET /api/capital-gains/summary` | NEW: STCG/LTCG summary |
| `GET /api/income/summary` | NEW: Aggregate all income sources |

---

## Implementation Order

| Phase | Tasks | Est. Effort |
|-------|-------|-------------|
| 1. Income Landing | Create landing page with source cards + Add Income dialog | 2 days |
| 2. Business/Profession | Presumptive tax (44AD/44ADA) + regular books UI | 3 days |
| 3. Rental Income | Property selector + Section 24 calculator + payment tracker | 2 days |
| 4. Capital Gains | Transaction tracking + STCG/LTCG tax calculator | 3 days |
| 5. Interest Income | FD/RD/Savings tracking + 80TTA/80TTB + TDS | 2 days |
| 6. Dividend Income | Stock/MF dividend tracking + TDS | 1.5 days |
| 7. Other Sources | Commission wizard + Freelance + Royalties + Gifts | 2 days |
| **8. Reports Tab** | **Summary stats + Charts + Family breakdown + Export (PDF/Excel)** | **2 days** |
| 9. Calculations | presumptive-tax.ts, house-property.ts, interest-deductions.ts | 1 day |
| 10. Testing | E2E tests for all income pages | 2 days |

**Total: ~20.5 days** (Non-Salary Income only)

**Note**: Salary Section is covered in `Salary-Section-Plan.md` (~10 days additional)

---

## Critical Files Summary

### New Files to Create
```
src/app/dashboard/income/
├── page.tsx                           # Landing page with source cards
├── layout.tsx                         # Shared layout
├── components/
│   ├── IncomeSourceCard.tsx           # Reusable card component
│   ├── IncomeSummaryCards.tsx         # 4-card summary grid
│   └── AddIncomeSourceDialog.tsx      # Add new source modal
├── business/
│   ├── page.tsx                       # Business list
│   ├── [id]/page.tsx                  # Business detail with 44AD/44ADA
│   └── components/
│       ├── PresumptiveTaxCard.tsx     # 44AD/44ADA calculator
│       └── RegularBooksCard.tsx       # P&L summary
├── rental/
│   ├── page.tsx                       # Rental list
│   ├── add/page.tsx                   # Add rental with property selector
│   ├── [propertyId]/page.tsx          # Rental detail
│   └── components/
│       ├── PropertySelector.tsx       # Dropdown with "Add Property" link
│       └── Section24Calculator.tsx    # House property deductions
├── capital-gains/
│   ├── page.tsx                       # CG summary with STCG/LTCG
│   ├── add/page.tsx                   # Add transaction
│   └── components/
│       ├── TransactionTable.tsx       # All transactions
│       └── CIICalculator.tsx          # Cost Inflation Index
├── interest/                          # SEPARATE from dividends
│   ├── page.tsx                       # Interest income summary
│   ├── add/page.tsx                   # Add interest source
│   └── components/
│       ├── FDInterestTable.tsx        # FD/RD listing
│       └── SavingsInterest80TTA.tsx   # 80TTA/80TTB calculator
├── dividends/                         # SEPARATE from interest
│   ├── page.tsx                       # Dividend income summary
│   ├── add/page.tsx                   # Add dividend entry
│   └── components/
│       ├── StockDividendTable.tsx     # Stock dividends
│       └── MFDividendTable.tsx        # MF dividends
├── other/
│   ├── page.tsx                       # Other sources list
│   ├── add/page.tsx                   # Add with type selector
│   ├── commission/page.tsx            # Commission wizard
│   └── components/
│       ├── CommissionWizard.tsx       # Regular vs Occasional flow
│       └── OtherIncomeTable.tsx       # All other entries
└── reports/                           # NEW - Reports Tab
    ├── page.tsx                       # Reports landing page
    └── components/
        ├── IncomeSummaryStats.tsx     # 4-card summary
        ├── IncomeTrendChart.tsx       # Monthly line chart
        ├── IncomeSourcePie.tsx        # Pie chart by source
        ├── IncomeYoYComparison.tsx    # Bar chart YoY
        ├── FamilyBreakdownTable.tsx   # Family member breakdown
        ├── HistoricalComparison.tsx   # Previous years
        └── ExportOptions.tsx          # PDF/Excel/Share buttons

src/lib/reports/                       # NEW - Report generation
├── income-report-generator.ts         # PDF generation logic
└── income-report-excel.ts             # Excel export logic

src/lib/calculations/
├── presumptive-tax.ts                 # 44AD/44ADA calculations
├── house-property.ts                  # Section 24 deductions
└── interest-deductions.ts             # 80TTA/80TTB calculations

src/app/api/
├── capital-gains/route.ts             # NEW API
├── income/summary/route.ts            # NEW API - aggregate all sources
└── income/interest/route.ts           # NEW API - interest tracking
```

### Existing Files to Enhance
```
src/services/tax/IncomeSourceService.ts  # Add summary method
src/lib/calculations/tax.ts              # Integrate presumptive tax
src/app/dashboard/investments/real-estate/add/page.tsx  # Add returnTo query param support
```

---

## Open Questions (Resolved)

| Question | Answer |
|----------|--------|
| Stock API for Capital Gains? | Yes - Future phase (manual entry first) |
| TDS Reconciliation (Form 26AS)? | Future phase |
| Agricultural Income detail? | Minimal - for rate purposes only |
| Interest vs Dividends? | **Separate screens** |
| Commission Income? | Wizard to route to Business (44AD) or Other Sources |

---

## Industry Research: Best Practices & User Delight Features

Based on analysis of ClearTax, Quicko, Tax2win, TaxBuddy, INDmoney, and other leading Indian fintech apps.

### User Delight Features to Add

| Feature | Description |
|---------|-------------|
| **Tax Optimization Insights** | Show potential savings with regime comparison |
| **Filing Readiness Score** | "85% ready to file ITR" progress bar |
| **FD Maturity Calendar** | Visual calendar with upcoming maturities |
| **80TTB Auto-Detection** | Auto-apply Rs50K deduction for seniors |
| **5-Year Lock-in Tracker** | Visual progress for 44AD commitment |
| **Smart Alerts** | Advance tax reminders, missing data alerts |

### Updated Implementation Priorities

| Phase | Additional Features to Add |
|-------|---------------------------|
| Phase 1 (Landing) | Tax Optimization Insights card, Filing Readiness Score |
| Phase 2 (Business) | 5-year lock-in tracker, Digital/Cash payment split calculator |
| Phase 3 (Rental) | Pre-construction interest schedule, Co-owner deduction split |
| Phase 4 (Capital Gains) | Property LTCG choice calculator (12.5% vs 20%+CII), Broker CSV import |
| Phase 5 (Interest) | FD maturity calendar, 80TTB auto-detection for seniors |
| Phase 6 (Dividends) | Dividend yield tracking, TDS threshold alerts |
| Phase 7 (Other) | Commission 5-year history for 44AD eligibility |

---

## Sources

- [ClearTax vs Quicko Comparison](https://cleartax.in/s/cleartax-vs-quicko-comparison)
- [ClearTax Capital Gains Calculator](https://cleartax.in/s/ltcg-calculator)
- [Section 44AD Presumptive Scheme](https://cleartax.in/s/section-44ad-presumptive-scheme)
- [Section 44ADA for Professionals](https://cleartax.in/s/section-44ada)
- [Section 24 House Property Deductions](https://cleartax.in/s/deductions-under-section24-income-from-house-property)
- [Tax2win Tax Planning Optimizer](https://tax2win.in/tax-tools/tax-planning-optimiser)
- [TaxBuddy Tax Planner](https://www.taxbuddy.com/tax-plan)
- [Income Tax Tutorials - LTCG](https://incometaxindia.gov.in/tutorials/15-%20ltcg.pdf)

---

## FINAL VERIFICATION: Income Section Complete

### All Requirements from Feature-Reorganization-Plan.md Covered

| # | Requirement | Plan Document | Status |
|---|-------------|---------------|--------|
| 1 | All Sources (yearly view with monthly breakdown) | This plan - Phase 1 | Done |
| 2 | Salary (components: additions/deductions) | Salary-Section-Plan.md | Done |
| 3 | Business/Profession | This plan - Phase 2 | Done |
| 4 | Rental Income | This plan - Phase 3 | Done |
| 5 | Capital Gains | This plan - Phase 4 | Done |
| 6 | Dividends (SEPARATE from Interest) | This plan - Phase 6 | Done |
| 7 | Interest (SEPARATE from Dividends) | This plan - Phase 5 | Done |
| 8 | Other Sources (custom rows) | This plan - Phase 7 | Done |
| 9 | Salary History (monthly component tracking) | Salary-Section-Plan.md | Done |
| 10 | [Reports Tab] | This plan - Phase 8 | Done |

### Total Implementation Effort

| Plan | Est. Days |
|------|-----------|
| Non-Salary Income (this plan) | ~20.5 days |
| Salary Section (Salary-Section-Plan.md) | ~10 days |
| **TOTAL INCOME SECTION** | **~30.5 days** |

### Related Plan Documents
1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation structure
2. `docs/Plans/Salary-Section-Plan.md` - Salary component tracking
3. `docs/Plans/Non-Salary-Income-Plan.md` - This plan

**Status: INCOME SECTION PLANNING COMPLETE**
