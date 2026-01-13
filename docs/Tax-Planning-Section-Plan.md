# Tax Planning Section Plan

> **Status**: ✅ IMPLEMENTED (Redesigned)
> **Created**: January 7, 2026
> **Initial Completion**: January 9, 2026
> **Redesigned**: January 11, 2026
> **Based on**: docs/Plans/Feature-Reorganization-Plan.md (Section 3: TAX PLANNING)

---

## Implementation Summary

### January 2026 Redesign

The Tax Planning section was redesigned to follow the Salary page's 2-tab pattern:

| Change | Before | After |
|--------|--------|-------|
| Navigation | 6 route-based tabs | 2 internal tabs (Overview + Tax Details) |
| Data Sources | Manual entry only | Auto-pull from all income sources |
| Smart Suggestions | Basic | 8 scenario types with priority levels |
| URL Structure | Multiple routes | Single `/tax-planning` route |

### Current Features

| Feature | Status | Notes |
|---------|--------|-------|
| Database Schema | ✅ Complete | 4 Prisma models |
| 2-Tab Structure | ✅ Complete | Overview + Tax Details |
| Auto Data Aggregation | ✅ Complete | Pulls from Salary, Investments, Insurance, Liabilities |
| Smart Suggestions | ✅ Complete | 8 scenario types with priority |
| Data Completion Tracker | ✅ Complete | 8-item progress indicator |
| Income Breakdown Chart | ✅ Complete | Doughnut chart by source |
| Advance Tax Calculator | ✅ Complete | Full feature with 234B/234C interest |
| What-If Scenarios | ✅ Complete | Baseline, create/compare, smart suggestions |
| Reports Section | ✅ Complete | PDF/Excel export, charts, ITR reference |
| E2E Tests | 🔄 Updated | Adapted for 2-tab accordion structure |

---

## Current Tab Structure (2 Tabs)

```
TAX PLANNING PAGE (/tax-planning)
│
├── Tab 1: Overview (read-only summary)
│   ├── TaxSummaryCards (Gross Income, Tax Payable, TDS, Net Due/Refund)
│   ├── DataCompletionTracker (8 items: Salary, 80C, 80D, NPS, HRA, Home Loan, Capital Gains, Other)
│   ├── Top 3 Recommendations (prioritized smart suggestions)
│   ├── Regime Comparison Summary (Old vs New with savings)
│   ├── Income Breakdown Chart (Doughnut by source)
│   ├── ITR Form Recommendation
│   └── Advance Tax Alert (if due > ₹10K)
│
└── Tab 2: Tax Details (accordion with actions/editing)
    ├── Calculator Section (API/Manual mode, regime selector)
    ├── Deductions Section (80C, 80D, NPS, Section 24, Other)
    ├── Scenarios Section (Baseline, what-if, comparison)
    ├── Advance Tax Section (Timeline, payments, interest)
    └── Reports Section (PDF/Excel export, ITR reference)
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES (Auto-Pull)                    │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│   Salary    │ Non-Salary  │ Investments │  Insurance  │Liabilit│
│             │   Income    │             │             │  ies   │
│ useSalary() │ useIncome() │useInvest()  │useInsurance │useLiab │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴───┬────┘
       │             │             │             │          │
       └─────────────┴─────────────┴─────────────┴──────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │  useAggregatedIncome()  │
                 │  - Gross Total Income   │
                 │  - Income by Source     │
                 │  - Deductions by Section│
                 │  - TDS Summary          │
                 └───────────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │useTaxCompar │  │useSmartSugg │  │useDataCompl │
    │- Old vs New │  │- 8 scenarios│  │- Checklist  │
    │- Best regime│  │- Priorities │  │- % complete │
    └─────────────┘  └─────────────┘  └─────────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │     Tax Planning UI          │
              │  ┌────────┐  ┌────────┐     │
              │  │Overview│  │Details │     │
              │  └────────┘  └────────┘     │
              └──────────────────────────────┘
```

---

## Smart Suggestions - 8 Scenario Types

| # | Type | Trigger | Calculation | Priority |
|---|------|---------|-------------|----------|
| 1 | Regime Comparison | Income > ₹5L | Compare old vs new tax | High |
| 2 | 80C Gap | Utilized < ₹1.5L | Gap × marginal rate | High if gap > ₹50K |
| 3 | NPS 80CCD(1B) | Contribution < ₹50K | (₹50K - current) × rate | Medium |
| 4 | 80D Health | No parent OR self < ₹25K | Gap × marginal rate | Medium |
| 5 | HRA Optimization | Rent paid, HRA not claimed | HRA exemption formula | High |
| 6 | Home Loan Sec 24 | Loan exists, interest < ₹2L | Gap × rate | Medium |
| 7 | LTCG Harvesting | Unrealized gains > ₹50K | Min(gains, ₹1.25L) × 12.5% | Low |
| 8 | Advance Tax Alert | (Tax - TDS) > ₹10K | Interest if not paid | High if due soon |

---

## New Components Created (January 11, 2026)

### Overview Tab Components

| File | Description |
|------|-------------|
| `src/components/tax/TaxOverviewTab.vue` | Main Overview tab container |
| `src/components/tax/TaxSummaryCards.vue` | 4-card summary grid (Gross, Tax, TDS, Due/Refund) |
| `src/components/tax/DataCompletionTracker.vue` | 8-item progress indicator |
| `src/components/tax/IncomeBreakdownChart.vue` | Doughnut chart by income source |

### Tax Details Tab Components

| File | Description |
|------|-------------|
| `src/components/tax/TaxDetailsTab.vue` | Accordion container with 5 sections |
| `src/components/tax/TaxCalculatorSection.vue` | Calculator accordion section |
| `src/components/tax/DeductionsSection.vue` | Deductions accordion section |
| `src/components/tax/ScenariosSection.vue` | Scenarios accordion section |
| `src/components/tax/AdvanceTaxSection.vue` | Advance Tax accordion section |
| `src/components/tax/ReportsSection.vue` | Reports accordion section |

### New Composables

| Function | Description |
|----------|-------------|
| `useAggregatedIncome()` | Auto-aggregates income from all sources |
| `useDataCompletionStatus()` | Tracks 8-item data completion |
| `useSmartSuggestionsEnhanced()` | 8 scenario types with priorities |

---

## Route Changes

### Removed Routes (now 404)

Old routes have been removed. Legacy URLs will 404:
- `/tax-planning/calculator`
- `/tax-planning/deductions`
- `/tax-planning/scenarios`
- `/tax-planning/advance-tax`
- `/tax-planning/reports`

### Current Route

Single route with internal tabs:
- `/tax-planning` - Main page with Overview + Tax Details tabs

---

## Database Schema (Unchanged)

### Prisma Models

```prisma
// 1. Advance Tax Payment Tracking
model AdvanceTaxEstimate {
  id                    String   @id @default(cuid())
  userId                String
  financialYear         String   // "2024-25"
  selectedRegime        String   @default("NEW")
  totalEstimatedIncome  Float    @default(0)
  incomeBreakdown       Json?
  estimatedDeductions   Float    @default(0)
  totalTDSDeducted      Float    @default(0)
  grossTaxLiability     Float    @default(0)
  netTaxLiability       Float    @default(0)
  advanceTaxRequired    Boolean  @default(false)
  interest234B          Float    @default(0)
  interest234C          Float    @default(0)
  lastCalculatedAt      DateTime @default(now())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedules             AdvanceTaxSchedule[]
  payments              AdvanceTaxPayment[]
  @@unique([userId, financialYear])
}

model AdvanceTaxSchedule {
  id                    String   @id @default(cuid())
  estimateId            String
  quarter               Int      // 1, 2, 3, 4
  dueDate               DateTime
  cumulativePercentage  Float    // 15, 45, 75, 100
  cumulativeAmountDue   Float    @default(0)
  quarterAmountDue      Float    @default(0)
  amountPaid            Float    @default(0)
  shortfall             Float    @default(0)
  status                String   @default("PENDING")
  interest234C          Float    @default(0)
  estimate              AdvanceTaxEstimate @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  payments              AdvanceTaxPayment[]
  @@unique([estimateId, quarter])
}

model AdvanceTaxPayment {
  id                    String   @id @default(cuid())
  userId                String
  estimateId            String
  scheduleId            String?
  paymentDate           DateTime
  amount                Float
  challanSerialNumber   String
  bsrCode               String
  bankName              String?
  quarter               Int
  financialYear         String
  isVerified            Boolean  @default(false)
  challanDocumentUrl    String?
  notes                 String?
  createdAt             DateTime @default(now())
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  estimate              AdvanceTaxEstimate @relation(fields: [estimateId], references: [id], onDelete: Cascade)
  schedule              AdvanceTaxSchedule? @relation(fields: [scheduleId], references: [id])
  @@index([userId, financialYear])
}

// 2. What-If Scenarios
model TaxWhatIfScenario {
  id                      String   @id @default(cuid())
  userId                  String
  financialYear           String
  name                    String
  description             String?
  isBaseline              Boolean  @default(false)
  isAutoGenerated         Boolean  @default(false)
  selectedRegime          String   // 'OLD' | 'NEW'
  incomeAdjustments       Json     @default("{}")
  deductionAdjustments    Json     @default("{}")
  totalGrossIncome        Float    @default(0)
  totalDeductions         Float    @default(0)
  taxableIncome           Float    @default(0)
  totalTaxLiability       Float    @default(0)
  taxDifferenceFromBaseline Float  @default(0)
  percentageSavings       Float    @default(0)
  suggestionReason        String?
  optimizationCategory    String?
  lastCalculatedAt        DateTime @default(now())
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
  user                    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, financialYear, name])
  @@index([userId, financialYear])
}
```

---

## Backend Routes (Unchanged)

### Advance Tax Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/advance-tax` | List estimates (filter by FY) |
| POST | `/api/advance-tax` | Create estimate for FY |
| GET | `/api/advance-tax/:id` | Get single estimate with schedules |
| PUT | `/api/advance-tax/:id` | Update estimate |
| DELETE | `/api/advance-tax/:id` | Delete estimate |
| POST | `/api/advance-tax/:id/calculate` | Recalculate tax & schedules |
| GET | `/api/advance-tax/:id/payments` | List payments for estimate |
| POST | `/api/advance-tax/:id/payments` | Add payment with challan details |
| PUT | `/api/advance-tax/:id/payments/:paymentId` | Update payment |
| DELETE | `/api/advance-tax/:id/payments/:paymentId` | Delete payment |
| GET | `/api/advance-tax/:id/interest` | Calculate 234B/234C interest |

### Scenario Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax-planning/scenarios` | List scenarios (filter by FY) |
| POST | `/api/tax-planning/scenarios` | Create scenario |
| GET | `/api/tax-planning/scenarios/:id` | Get single scenario |
| PUT | `/api/tax-planning/scenarios/:id` | Update scenario |
| DELETE | `/api/tax-planning/scenarios/:id` | Delete scenario |
| POST | `/api/tax-planning/scenarios/baseline` | Create/update baseline |
| POST | `/api/tax-planning/scenarios/compare` | Compare up to 3 scenarios |
| GET | `/api/tax-planning/scenarios/smart-suggestions` | Generate auto suggestions |

### Report Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax-planning/reports` | Get report data for FY |
| GET | `/api/tax-planning/reports/yoy` | Get multi-year comparison |
| POST | `/api/tax-planning/reports/export` | Generate PDF or Excel |
| GET | `/api/tax-planning/comparison` | Get regime comparison |

---

## Testing

### E2E Tests

| File | Description |
|------|-------------|
| `01-navigation.spec.ts` | 2-tab navigation, accordion sections |
| `02-regime-comparison.spec.ts` | Old vs New regime comparison |
| `03-calculator.spec.ts` | Tax calculation in accordion |
| `04-deductions.spec.ts` | Deduction categories |
| `05-itr-recommendation.spec.ts` | ITR form suggestions |
| `06-reports.spec.ts` | Reports accordion section |
| `07-advance-tax.spec.ts` | Advance tax accordion section |
| `08-scenarios.spec.ts` | Scenarios accordion section |

### E2E Page Objects

| File | Description |
|------|-------------|
| `overview.page.ts` | Overview tab interactions |
| `tax-details.page.ts` | Tax Details tab accordion interactions |
| `calculator.page.ts` | Calculator section interactions |
| `deductions.page.ts` | Deductions section interactions |
| `scenarios.page.ts` | Scenarios section interactions |
| `advance-tax.page.ts` | Advance Tax section interactions |
| `reports.page.ts` | Reports section interactions |

### Unit Tests

**File: `server/lib/calculations/advance-tax.spec.ts`** - 43 tests

| Test Suite | Tests | Description |
|------------|-------|-------------|
| ADVANCE_TAX_CONFIG | 5 | Configuration constants |
| getAdvanceTaxDueDates | 3 | Due date calculations |
| isAdvanceTaxApplicable | 4 | Threshold logic |
| calculateQuarterlySchedule | 7 | Schedule with payments |
| calculateInterest234B | 5 | Default interest calculation |
| calculateInterest234C | 3 | Deferment interest |
| detectQuarterFromPaymentDate | 6 | Quarter detection |
| calculateAdvanceTaxAnalysis | 5 | Complete analysis |
| formatINR | 5 | Currency formatting |

---

## Verification Commands

```bash
# Run unit tests
npm run test:unit -- server/lib/calculations/advance-tax.spec.ts

# Run E2E tests for tax planning
npm run test:e2e -- e2e/tests/tax-planning/

# Type check
npm run type-check

# Start dev server and verify
npm run dev
# Navigate to http://localhost:5173/tax-planning
```

---

## Files Summary

### Created (January 11, 2026 Redesign)

| Category | Files |
|----------|-------|
| **Overview Components** | `TaxOverviewTab.vue`, `TaxSummaryCards.vue`, `DataCompletionTracker.vue`, `IncomeBreakdownChart.vue` |
| **Details Components** | `TaxDetailsTab.vue`, `TaxCalculatorSection.vue`, `DeductionsSection.vue`, `ScenariosSection.vue`, `AdvanceTaxSection.vue`, `ReportsSection.vue` |

### Modified (January 11, 2026 Redesign)

| File | Changes |
|------|---------|
| `src/pages/tax-planning/index.vue` | Restructured to 2-tab with FY navigation |
| `src/composables/useTax.ts` | Added `useAggregatedIncome`, `useDataCompletionStatus`, `useSmartSuggestionsEnhanced` |
| `src/router/index.ts` | Removed child routes, no redirects |
| `src/layouts/DashboardLayout.vue` | Removed Tax Planning children from sidebar |

### Existing (from January 9, 2026)

| Category | Files |
|----------|-------|
| **Backend Routes** | `server/routes/advance-tax.ts`, `server/routes/tax-scenarios.ts`, `server/routes/tax-reports.ts` |
| **Calculation Logic** | `server/lib/calculations/advance-tax.ts` |
| **Existing Components** | `AdvanceTaxTimeline.vue`, `AdvanceTaxPaymentForm.vue`, `InterestCalculator.vue`, `ScenarioCard.vue`, `ScenarioEditor.vue`, `ScenarioComparison.vue`, `SmartSuggestions.vue` |

---

## Not Implemented (Deferred)

These features were intentionally deferred:

- `TDSEntry` Prisma model (Form 26AS placeholder)
- Form 26AS manual entry UI
- TRACES API integration
- TDS reconciliation features

These can be added in a future phase when demand is validated.

---

## Related Plan Documents

1. `docs/Plans/Feature-Reorganization-Plan.md` - Master navigation
2. `docs/Salary-Section-Plan.md` - Salary component tracking (2-tab pattern reference)
3. `docs/Non-Salary-Income-Plan.md` - Income section plan
4. **`docs/Tax-Planning-Section-Plan.md`** - This plan

---

**Status: ✅ IMPLEMENTATION COMPLETE (Redesigned January 11, 2026)**
