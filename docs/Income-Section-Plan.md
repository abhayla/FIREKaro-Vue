# Income Section - Comprehensive Plan

> **Status**: Implementation Complete (UI + Backend + E2E Tests)
> **Created**: January 11, 2026
> **Route**: `/income` (top-level, no `/dashboard` prefix)
> **Framework**: Vue 3 + Vite + Vuetify 3

---

## Overview

The Income section is a unified hub for tracking all income sources in FIREKaro:

1. **Salary Income** - Employment income with detailed component tracking
2. **Business Income** - Business/Profession (44AD/44ADA)
3. **Rental Income** - House Property (Section 24)
4. **Capital Gains** - STCG/LTCG from assets
5. **Interest Income** - FD/RD/Savings/P2P/Bonds
6. **Dividend Income** - Stocks/Mutual Funds
7. **Other Income** - Commission/Gifts/Lottery/Pension

---

## Route Structure

| Route | Page | Description |
|-------|------|-------------|
| `/income` | `index.vue` | Hub with all income type overview cards |
| `/income/salary` | `salary/index.vue` | Salary income (consolidated under Income) |
| `/income/business` | `business.vue` | Business/Profession (44AD/44ADA) |
| `/income/rental` | `rental.vue` | Rental Income (Section 24) |
| `/income/capital-gains` | `capital-gains.vue` | Capital Gains (STCG/LTCG) |
| `/income/interest` | `interest.vue` | Interest Income |
| `/income/dividends` | `dividends.vue` | Dividend Income |
| `/income/other` | `other.vue` | Other Sources |
| `/income/reports` | `reports.vue` | Reports & Analytics |

**Legacy Redirects**:
- `/dashboard/income/*` redirects to `/income/*`
- `/dashboard/salary` redirects to `/income/salary`
- `/dashboard/non-salary-income/*` redirects to `/income/*`

---

## File Structure

```
src/pages/dashboard/income/
├── index.vue                    # Hub with all income type cards
├── salary.vue                   # Salary income (if separate page needed)
├── business.vue                 # Business/Profession (44AD/44ADA)
├── rental.vue                   # Rental Income (Section 24)
├── capital-gains.vue            # Capital Gains (STCG/LTCG)
├── interest.vue                 # Interest Income (FD/RD/Savings/P2P)
├── dividends.vue                # Dividend Income (Stocks/MF)
├── other.vue                    # Other Sources (Commission/Gifts/Lottery)
└── reports.vue                  # Reports with PDF/Excel export

src/components/income/
├── # Overview/Details Tab Components
├── BusinessOverviewTab.vue
├── BusinessDetailsTab.vue
├── RentalOverviewTab.vue
├── RentalDetailsTab.vue
├── CapitalGainsOverviewTab.vue
├── CapitalGainsDetailsTab.vue
├── InterestOverviewTab.vue
├── InterestDetailsTab.vue
├── DividendOverviewTab.vue
├── DividendDetailsTab.vue
├── OtherOverviewTab.vue
├── OtherDetailsTab.vue
│
├── # Form Components
├── BusinessIncomeForm.vue
├── RentalIncomeForm.vue
├── CapitalGainsCalculator.vue
├── InterestIncomeForm.vue
├── DividendIncomeForm.vue
├── OtherIncomeForm.vue
│
├── # User Delight Components
├── TaxOptimizationCard.vue      # Old vs New regime comparison
├── FilingReadinessScore.vue     # ITR filing progress tracker
├── SmartAlerts.vue              # Advance tax & deadline alerts
├── LockInTracker.vue            # 5-year 44AD/44ADA tracker
├── PreConstructionInterest.vue  # Pre-construction interest schedule
├── CoOwnerSplit.vue             # Co-owner deduction calculator
├── PropertyLTCGCalculator.vue   # 12.5% vs 20%+CII comparison
├── BrokerCSVImport.vue          # Zerodha/Groww/Upstox CSV import
├── Section54Dashboard.vue       # Section 54/54F/54EC tracker
├── FDMaturityCalendar.vue       # FD maturity date calendar
├── CommissionWizard.vue         # Regular vs Occasional commission
├── GiftExemptionCalc.vue        # Relative gift exemption calculator
└── LotteryTaxCalc.vue           # 30% flat tax calculator

src/components/salary/
├── SalaryOverviewTab.vue        # Summary cards, charts, YoY comparison
├── SalaryDetailsTab.vue         # Grid with monthly salary data
├── AddEmployerDialog.vue        # Full + Quick add employer
├── ManageEmployersDialog.vue    # Employer management
├── CopyDataDialog.vue           # Copy salary data between months
└── SalaryChart.vue              # Salary trend visualization

src/composables/
├── useIncome.ts                 # All non-salary income Vue Query hooks
└── useSalary.ts                 # Salary-specific Vue Query hooks

server/routes/
├── salary.ts                    # Salary CRUD API
├── salary-history.ts            # Monthly salary entries API
├── salary-components.ts         # Salary component definitions API
├── income-sources.ts            # Employer/Income source management
├── business-income.ts           # Business income CRUD API
├── rental-income.ts             # Rental income CRUD API
├── capital-gains.ts             # Capital gains CRUD API
├── interest-income.ts           # Interest income CRUD API
├── dividend-income.ts           # Dividend income CRUD API
├── other-income.ts              # Other income CRUD API
└── income-summary.ts            # Aggregate income summary API

e2e/
├── pages/income/
│   ├── index.ts                 # Barrel exports
│   ├── overview.page.ts         # Income overview page object
│   ├── business.page.ts
│   ├── rental.page.ts
│   ├── capital-gains.page.ts
│   ├── interest.page.ts
│   ├── dividends.page.ts
│   ├── other.page.ts
│   └── reports.page.ts
├── tests/income/
│   ├── 01-navigation.spec.ts
│   ├── 02-business-income.spec.ts
│   ├── 03-rental-income.spec.ts
│   ├── 04-capital-gains.spec.ts
│   ├── 05-other-income.spec.ts
│   ├── 06-calculations.spec.ts
│   ├── 07-reports.spec.ts
│   ├── 08-interest-income.spec.ts
│   └── 09-dividend-income.spec.ts
└── fixtures/
    └── income-data.ts           # Test data for all income types
```

---

## Part 1: Salary Income

### 1.1 Salary Statement Structure (Cognizant Format)

```
EMPLOYEE INFO
├── Name, Employee ID, Designation, Gender, Location
├── PAN
├── PF Account Number, Universal Account Number (UAN)
├── SA New Policy Number, LIC ID (for Superannuation)
└── NPS PRAN Account Number

EARNINGS (Monthly columns: Apr'24 to Mar'25 + Total)
├── Paid Days
├── Basic
├── House Rent Allowance (HRA)
├── Conveyance Allowance
├── Medical Allowance
├── Special Allowance
├── Special Pay* (variable/one-time)
└── Gross Earnings (A) = Sum of above

DEDUCTIONS - EMPLOYEE CONTRIBUTION (Monthly + Total)
├── Provident Fund (EPF - 12% of Basic) → Syncs to EPF Account
├── Other Deductions (VPF) → Syncs to EPF Account (VPF)
├── Professional Tax
├── TDS (Income Tax)
└── Gross Deductions (B) = Sum of above

NET EARNINGS = (A) - (B)

EMPLOYER CONTRIBUTION (Monthly + Total) - Info only, not deducted
├── National Pension System (NPS) → 80CCD(2), syncs to NPS Account
├── Pension Fund (EPS) → Syncs to EPF Account
├── Provident Fund (Employer PF - 3.67%) → Syncs to EPF Account
└── Superannuation Fund Contribution → Has Opening Balance
```

### 1.2 Salary Sync Rules

| Salary Component | Sync Target | Tax Section | Notes |
|------------------|-------------|-------------|-------|
| EPF (Employee) | EPF Account - Employee | 80C | 12% of Basic |
| VPF | EPF Account - VPF | 80C | Optional additional |
| EPF (Employer) | EPF Account - Employer | - | 3.67% of Basic |
| Pension Fund (EPS) | EPF Account - Pension | - | 8.33% of Basic (capped) |
| NPS (Employer) | NPS Account - Employer | 80CCD(2) | 10%/14% of Basic+DA |
| Superannuation | Superannuation Fund | - | Has Opening Balance |

### 1.3 Salary Page Structure

**Single page with 2 tabs:**
- **Overview Tab**: Summary cards, charts, data completion, YoY comparison
- **Salary Details Tab**: Monthly grid with earnings/deductions/employer contributions

**Key Features:**
- Per-month employer dropdown (supports job changes)
- Dynamic salary components (custom components via SalaryComponentDefinition)
- Column header menu (copy to remaining months, import from prev FY)
- Multi-employer tracking

### 1.4 Salary Data Models

```prisma
model SalaryComponentDefinition {
  id              String                @id @default(cuid())
  code            String                // "BASIC", "HRA", "VPF"
  name            String                // "Basic Salary"
  componentType   SalaryComponentType   // EARNING, DEDUCTION, EMPLOYER_CONTRIBUTION
  category        String?               // "Fixed", "Variable", "Statutory"
  isTaxable       Boolean               @default(true)
  taxSection      String?               // "80C", "10(13A)"
  syncTarget      SyncTargetType?       // EPF, VPF, NPS, SUPERANNUATION
  isSystem        Boolean               @default(false)
  isActive        Boolean               @default(true)
  userId          String?               // null = system-wide
  @@unique([code, userId])
}

model MonthlySalaryEntry {
  id                    String        @id @default(cuid())
  incomeSourceId        String        // Link to employer
  financialYear         String        // "2024-25"
  month                 Int           // 1=April, 12=March
  year                  Int           // Calendar year
  paidDays              Int           @default(30)
  grossEarnings         Float         @default(0)
  totalDeductions       Float         @default(0)
  employerContributions Float         @default(0)
  netSalary             Float         @default(0)
  tdsDeducted           Float         @default(0)
  components            SalaryComponentEntry[]
  @@unique([incomeSourceId, financialYear, month])
}

model SalaryComponentEntry {
  id                      String    @id @default(cuid())
  monthlySalaryEntryId    String
  componentDefinitionId   String
  amount                  Float     @default(0)
  syncStatus              SyncStatus @default(PENDING)
  @@unique([monthlySalaryEntryId, componentDefinitionId])
}
```

### 1.5 System Salary Components

**Earnings (12):** Basic, HRA, DA, Conveyance, Medical, Special, LTA, CEA, Car, Bonus, Incentive, Special Pay

**Deductions (10):** EPF, VPF, PT, TDS, NPS Employee, NPS Additional, ESI, LWF, Loan Recovery, Other

**Employer Contributions (6):** EPF Employer, Pension Fund, NPS Employer, Superannuation, Gratuity, ESI Employer

---

## Part 2: Business Income (44AD/44ADA)

### 2.1 Features
- Support for Presumptive (44AD/44ADA) AND Regular Books
- GST registration tracking
- Digital vs Cash payment split calculator
- 5-Year Lock-in Tracker

### 2.2 Tax Rules

| Section | For | Deemed Profit | Turnover Limit |
|---------|-----|---------------|----------------|
| 44AD | Business | 8% (6% digital) | Rs 2 Cr (Rs 3 Cr if >95% digital) |
| 44ADA | Profession | 50% | Rs 75 Lakhs |

### 2.3 User Delight: Lock-in Tracker
- Visual timeline showing commitment years
- Warning if switching schemes early
- Progress indicator (Year X of 5)

---

## Part 3: Rental Income (Section 24)

### 3.1 Features
- Property selector (linked to Investments)
- Section 24 deductions calculator
- Standard deduction (30% of NAV)
- Housing loan interest tracking
- Municipal taxes paid

### 3.2 Deduction Limits
- Standard Deduction: 30% of NAV
- Interest on Housing Loan: Rs 2L (self-occupied), Unlimited (let-out)
- Pre-construction interest: 1/5th for 5 years

### 3.3 User Delight Components
- **Pre-Construction Interest Schedule**: Track interest during construction, 5-year amortization
- **Co-Owner Deduction Split**: Multiple co-owners with ownership %, auto-calculate per-owner deductions

---

## Part 4: Capital Gains (STCG/LTCG)

### 4.1 Features
- Transaction tracking (Buy/Sell pairs)
- Asset type filter (Equity, Debt MF, Property, Gold, Crypto)
- STCG vs LTCG classification
- CII indexation for applicable assets
- Section 54/54F/54EC exemption tracking

### 4.2 Tax Rates (Post Budget 2024)

| Asset Type | STCG | LTCG | Notes |
|------------|------|------|-------|
| Equity/MF | 20% | 12.5% (>Rs 1.25L) | Changed from 15%/10% |
| Debt MF | Slab | Slab | No LTCG benefit |
| Property | Slab | 12.5% OR 20%+CII | Choice for pre-July 2024 |
| Gold | Slab | 12.5% | No indexation |
| Crypto | 30% | 30% | Flat rate |

### 4.3 User Delight Components
- **Property LTCG Calculator**: Compare 12.5% vs 20%+CII, shows better option
- **Broker CSV Import**: Support for Zerodha, Groww, Upstox, Angel One
- **Section 54/54F Dashboard**: Track exemptions, reinvestment deadlines

---

## Part 5: Interest Income

### 5.1 Features
- FD/RD interest tracking with TDS
- Savings account interest (80TTA eligible)
- P2P lending interest
- Bonds/Debentures interest
- NSC/SCSS (Post Office schemes)
- TDS reconciliation summary

### 5.2 Deduction Limits
- 80TTA: Rs 10,000 (savings interest, non-seniors)
- 80TTB: Rs 50,000 (all interest, seniors 60+)

### 5.3 User Delight Components
- **FD Maturity Calendar**: Visual calendar with upcoming maturities
- **80TTA/80TTB Auto-Detection**: Auto-apply appropriate deduction

---

## Part 6: Dividend Income

### 6.1 Features
- Stock dividends tracking
- Mutual fund dividends tracking
- TDS tracking (10% above Rs 5,000)
- Dividend history by stock/fund
- Stock vs MF breakdown chart

### 6.2 User Delight Components
- Dividend Yield Tracking
- TDS Threshold Alerts

---

## Part 7: Other Income

### 7.1 Categories
- Commission income
- Freelance/Consulting
- Royalties
- Lottery/Game show winnings
- Gifts (with exemptions)
- Pension
- Agricultural income

### 7.2 Tax Rules

**Gift Tax:**
- From relatives: Fully exempt
- From non-relatives: Exempt up to Rs 50,000
- Above Rs 50,000: Entire amount taxable

**Lottery/Gambling:**
- Flat 30% tax + 10% surcharge (>Rs 50L) + 4% cess
- Effective rate: 31.2% to 34.32%

### 7.3 User Delight Components
- **Commission Wizard**: Routes to Business (44AD) or Other based on regularity
- **Gift Exemption Calculator**: Relationship-based exemptions
- **Lottery Tax Calculator**: 30% flat tax + surcharge + cess

---

## Part 8: Reports

### 8.1 Features
- Summary statistics cards
- Income by source breakdown
- Monthly trend chart
- Year-over-Year comparison
- Salary vs Non-Salary breakdown

### 8.2 Export Options
- **PDF Export**: Branded report with summary + breakdown tables
- **Excel Export**: Multi-sheet workbook, ITR-compatible format

---

## API Endpoints

### Salary APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/salary-components` | List all component definitions |
| POST | `/api/salary-components` | Create custom component |
| GET | `/api/income-sources/[id]/salary` | List monthly entries |
| POST | `/api/income-sources/[id]/salary` | Create/update month |
| POST | `/api/income-sources/[id]/salary/auto-fill` | Auto-fill months |
| GET | `/api/income-sources/[id]/salary/summary` | Yearly summary |

### Non-Salary Income APIs

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/business-income` | GET, POST, PUT, DELETE | Business income CRUD |
| `/api/rental-income` | GET, POST, PUT, DELETE | Rental income CRUD |
| `/api/capital-gains` | GET, POST, PUT, DELETE | Capital gains CRUD |
| `/api/interest-income` | GET, POST, PUT, DELETE | Interest income CRUD |
| `/api/dividend-income` | GET, POST, PUT, DELETE | Dividend income CRUD |
| `/api/other-income` | GET, POST, PUT, DELETE | Other income CRUD |
| `/api/income/summary` | GET | Aggregate all sources |

---

## Composables

### `useSalary.ts`
```typescript
// Salary
useSalary()
useSalaryHistory()
useAddSalaryEntry()
useUpdateSalaryEntry()
useDeleteSalaryEntry()
useSalarySummary()

// Employers
useIncomeSources()
useAddIncomeSource()
useUpdateIncomeSource()
useDeleteIncomeSource()

// Components
useSalaryComponents()
useAddSalaryComponent()
```

### `useIncome.ts`
```typescript
// Business Income
useBusinessIncome()
useAddBusinessIncome()
useUpdateBusinessIncome()
useDeleteBusinessIncome()

// Rental Income
useRentalIncome()
useAddRentalIncome()
useUpdateRentalIncome()
useDeleteRentalIncome()

// Capital Gains
useCapitalGains()
useAddCapitalGain()
useUpdateCapitalGain()
useDeleteCapitalGain()

// Interest Income
useInterestIncomeAPI()
useAddInterestIncome()
useUpdateInterestIncome()
useDeleteInterestIncome()

// Dividend Income
useDividendIncomeAPI()
useAddDividendIncome()
useUpdateDividendIncome()
useDeleteDividendIncome()

// Other Income
useOtherIncome()
useAddOtherIncome()
useUpdateOtherIncome()
useDeleteOtherIncome()

// Summary
useIncomeSummary()
```

---

## E2E Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `01-navigation.spec.ts` | 10 | All tabs navigation |
| `02-business-income.spec.ts` | 8 | CRUD + 44AD/44ADA |
| `03-rental-income.spec.ts` | 8 | CRUD + Section 24 |
| `04-capital-gains.spec.ts` | 10 | CRUD + STCG/LTCG |
| `05-other-income.spec.ts` | 8 | CRUD + categories |
| `06-calculations.spec.ts` | 6 | Tax calculations |
| `07-reports.spec.ts` | 5 | Export + charts |
| `08-interest-income.spec.ts` | 12 | CRUD + 80TTA/80TTB |
| `09-dividend-income.spec.ts` | 11 | CRUD + TDS |

**Total: ~78 E2E tests**

---

## Implementation Status

| Section | UI | Backend | E2E Tests |
|---------|-----|---------|-----------|
| Hub (index.vue) | ✅ | ✅ | ✅ |
| Salary | ✅ | ✅ | ⏳ Pending |
| Business Income | ✅ | ✅ | ✅ |
| Rental Income | ✅ | ✅ | ✅ |
| Capital Gains | ✅ | ✅ | ✅ |
| Interest Income | ✅ | ✅ | ✅ |
| Dividend Income | ✅ | ✅ | ✅ |
| Other Income | ✅ | ✅ | ✅ |
| Reports | ✅ | ✅ | ✅ |

---

## User Delight Features Summary

| Feature | Component | Location |
|---------|-----------|----------|
| Tax Optimization Insights | `TaxOptimizationCard.vue` | Hub Page |
| Filing Readiness Score | `FilingReadinessScore.vue` | Hub Page |
| Smart Alerts | `SmartAlerts.vue` | Hub Page |
| 5-Year Lock-in Tracker | `LockInTracker.vue` | Business Page |
| Pre-Construction Interest | `PreConstructionInterest.vue` | Rental Page |
| Co-Owner Split Calculator | `CoOwnerSplit.vue` | Rental Page |
| Property LTCG Calculator | `PropertyLTCGCalculator.vue` | Capital Gains |
| Broker CSV Import | `BrokerCSVImport.vue` | Capital Gains |
| Section 54/54F Dashboard | `Section54Dashboard.vue` | Capital Gains |
| FD Maturity Calendar | `FDMaturityCalendar.vue` | Interest Page |
| Commission Wizard | `CommissionWizard.vue` | Other Page |
| Gift Exemption Calculator | `GiftExemptionCalc.vue` | Other Page |
| Lottery Tax Calculator | `LotteryTaxCalc.vue` | Other Page |
| PDF Export | `reports.vue` | Reports Page |
| Excel Export | `reports.vue` | Reports Page |

---

## Related Documentation

1. `CLAUDE.md` - Project instructions and patterns
2. `docs/Expenses-Section-Plan.md` - Expenses tracking
3. `docs/Investments-Section-Plan.md` - Investment tracking
4. `docs/Tax-Planning-Section-Plan.md` - Tax calculations

---

## Mandatory Fields by Income Type

All mandatory fields are marked with asterisks (*) in the UI forms.

| Income Type | Mandatory Fields | Notes |
|-------------|------------------|-------|
| **Interest Income** | Source Type *, Principal Amount *, Interest Rate * | Interest Earned is auto-calculated from Principal × Rate |
| **Rental Income** | Property Name *, Monthly Rent * | Property Address is optional |
| **Dividend Income** | Source Type *, Company/Fund Name *, Total Dividend * | Payment Date is optional |
| **Capital Gains** | Asset Type *, Asset Name *, Purchase Date *, Purchase Price *, Sale Date *, Sale Price * | All transaction details required for gain calculation |
| **Business Income** | Business Name *, Business Type *, Gross Receipts * | Deemed profit auto-calculated based on taxation method |
| **Other Income** | Income Category *, Description *, Gross Amount * | Flexible catch-all for various income types |

**Notes:**
- Reports page does NOT display navigation tabs (standalone analytics view)
- Interest Earned can be auto-calculated from Principal Amount × Interest Rate
- Annual Rent is auto-calculated from Monthly Rent × (12 - Vacancy Months)

---

## Change Log

| Date | Change |
|------|--------|
| Jan 11, 2026 | Added mandatory field indicators (*) to all income forms |
| Jan 11, 2026 | Updated Interest Income: Principal Amount & Interest Rate now mandatory, Institution Name & Interest Earned optional |
| Jan 11, 2026 | Updated Rental Income: Property Address now optional |
| Jan 11, 2026 | Updated Dividend Income: Payment Date now optional |
| Jan 11, 2026 | Removed navigation tabs from Reports page |
| Jan 11, 2026 | Route restructured from `/dashboard/income` to `/income` (top-level) |
| Jan 11, 2026 | Salary consolidated under Income section at `/income/salary` |
| Jan 11, 2026 | Created unified Income section doc (merged Salary + Non-Salary) |
| Jan 11, 2026 | Route renamed from `/dashboard/non-salary-income` to `/dashboard/income` |
| Jan 10, 2026 | Salary UI components completed |
| Jan 9, 2026 | Non-Salary Income fully implemented |
