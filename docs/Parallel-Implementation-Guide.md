# Vue 3 SPA Parallel Implementation Guide

> **Purpose**: Step-by-step manual actions + Claude prompts for parallel section enhancements
> **Created**: January 7, 2026 | **Updated**: January 10, 2026
> **Architecture**: Vue 3 + Vite + Vuetify 3 (SPA) + Hono + Prisma Backend
> **Status**: Core implementation complete, section enhancement phase

---

## Recent Changes (January 10, 2026)

### Sidebar Menu Restructure: Merged Income Section

**Before**: Two separate sidebar sections
- "Salary" → `/dashboard/salary`
- "Non-Salary Income" → `/dashboard/non-salary-income/*`

**After**: Single unified section
- "Income" (icon: `mdi-currency-inr` ₹) → `/dashboard/income/*`

**New Menu Structure:**
```
Income (₹)
├── Overview          → /dashboard/income
├── Salary            → /dashboard/income/salary
├── Business Income   → /dashboard/income/business
├── Rental Income     → /dashboard/income/rental
├── Capital Gains     → /dashboard/income/capital-gains
├── Other Sources     → /dashboard/income/other
└── Reports           → /dashboard/income/reports
```

**Backward Compatibility**: Old URLs redirect to new locations:
- `/dashboard/salary` → `/dashboard/income/salary`
- `/dashboard/non-salary-income` → `/dashboard/income`
- `/dashboard/non-salary-income/*` → `/dashboard/income/*`

**Files Modified:**
- `src/router/index.ts` - New routes + redirects
- `src/layouts/DashboardLayout.vue` - Merged sidebar section
- `src/pages/dashboard/non-salary-income/*.vue` - Updated tab routes

---

## Current Status (January 10, 2026)

### Architecture Overview

| Layer | Technology | Port |
|-------|------------|------|
| **Frontend** | Vue 3 + Vite + Vuetify 3 | 5173 |
| **Backend** | Hono + Prisma + Better Auth | 3000 |
| **Database** | PostgreSQL | - |
| **State** | Pinia + TanStack Vue Query | - |

### Implementation Status - CORE COMPLETE

| Category | Count | Status |
|----------|-------|--------|
| Backend Routes | 31 files | Done |
| Frontend Pages | 52 pages | Done |
| Components | 90+ components | Done |
| Composables | 11 files | Done |
| E2E Tests | 80+ specs | Done |

---

## Quick Start

```bash
# Development
npm run dev              # Start frontend (5173) + backend (3000)
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Testing
npm run test:e2e         # E2E tests (headed Chrome)
npm run test:unit        # Unit tests

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:studio        # Open Prisma Studio
```

---

## Parallel Section Enhancement Streams

With core implementation complete, parallel development now focuses on **enhancing each section**. Each stream corresponds to a dashboard section.

### Stream Overview

| Stream | Folder | Branch | Section | Focus |
|--------|--------|--------|---------|-------|
| 1 | `FIREKARO-VUE-Income` | `feature/income-enhancements` | Income (unified) | Form 16 import, capital gains, TDS tracking |
| 2 | `FIREKARO-VUE-Expenses` | `feature/expenses-enhancements` | Expenses | AI categorization, receipt scanning, insights |
| 3 | `FIREKARO-VUE-Investments` | `feature/investments-enhancements` | Investments | CAS import, XIRR, rebalancing |
| 4 | `FIREKARO-VUE-Liabilities` | `feature/liabilities-enhancements` | Liabilities | Prepayment calc, balance transfer, EMI optimizer |
| 5 | `FIREKARO-VUE-Insurance` | `feature/insurance-enhancements` | Insurance | Policy parser, coverage gaps, premium comparison |
| 6 | `FIREKARO-VUE-FinancialHealth` | `feature/financial-health-enhancements` | Financial Health | Cash flow forecast, ratios, goal savings |
| 7 | `FIREKARO-VUE-FIRE` | `feature/fire-enhancements` | FIRE Goals | Monte Carlo, withdrawal optimizer, celebrations |

---

## Stream 1: Income Enhancements

**Folder**: `FIREKARO-VUE-Income`
**Branch**: `feature/income-enhancements`
**Section**: Income (unified - formerly Salary + Non-Salary Income)
**Routes**: `/dashboard/income/*`

### Enhancement Features

#### P0 - Must Have
1. **Form 16 Parser**
   - Upload Form 16 PDF
   - Extract salary components automatically
   - Pre-fill salary history

2. **TDS Tracking**
   - Track TDS deducted per income source
   - 26AS reconciliation view
   - TDS certificate generation

3. **Capital Gains Enhancement**
   - Grandfathering calculation for pre-2018 equity
   - FIFO/LIFO cost basis selection
   - Tax harvesting suggestions

#### P1 - Should Have
4. **Salary Slip Import**
   - Parse common salary slip formats
   - Auto-detect components
   - Bulk import capability

5. **Dividend Tracking**
   - Track dividend per stock/MF
   - DDT vs new regime handling
   - Dividend yield calculation

6. **Interest Income Enhancement**
   - TDS on FD tracking
   - Form 15G/15H reminder
   - Interest accrual vs receipt

### Files to Create/Modify

```
# New Components
src/components/salary/Form16Parser.vue
src/components/salary/SalarySlipImport.vue
src/components/income/TDSTracker.vue
src/components/income/Form26ASView.vue
src/components/income/GrandfatheringCalc.vue
src/components/income/TaxHarvestingSuggestions.vue

# New/Modified Routes
server/routes/form16.ts
server/routes/tds.ts
server/services/form16-parser.service.ts
server/services/pdf-parser.service.ts

# Tests
e2e/tests/income/16-form16-import.spec.ts
e2e/tests/income/17-tds-tracking.spec.ts
```

> **Note**: E2E test folder may need renaming from `salary/` and `non-salary-income/` to unified `income/` folder.

### Claude Prompt

```
You are working on FIREKARO-VUE-Income (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement Form 16 PDF parser and salary auto-fill.

Context:
- Unified Income section: /dashboard/income/* (merged from Salary + Non-Salary)
- Salary composable: src/composables/useSalary.ts
- Salary routes: server/routes/salary.ts, salary-history.ts, salary-components.ts
- Income routes: server/routes/business-income.ts, rental-income.ts, capital-gains.ts, etc.
- Existing components: src/components/salary/, src/components/income/

Requirements:
1. Create server/services/form16-parser.service.ts using pdf-parse library
2. Create server/routes/form16.ts with POST /api/form16/parse
3. Create src/components/salary/Form16Parser.vue with:
   - PDF upload dropzone
   - Parsed data preview
   - Field mapping confirmation
   - Import to salary history
4. Handle Part A (employer details) and Part B (salary breakup)
5. Extract: Basic, HRA, Special Allowance, PF, PT, TDS
6. Support multiple Form 16 formats (different employers)

Use existing patterns. Follow Indian tax terminology.
Commit after each feature: "feat(income): description"
```

---

## Stream 2: Expenses Enhancements

**Folder**: `FIREKARO-VUE-Expenses`
**Branch**: `feature/expenses-enhancements`
**Section**: Expenses

### Enhancement Features

#### P0 - Must Have
1. **Smart Receipt Scanner**
   - OCR for receipt images
   - Auto-extract amount, date, merchant
   - Category suggestion

2. **Spending Insights**
   - Month-over-month comparison
   - Category trend analysis
   - Unusual spending alerts

3. **Budget Forecasting**
   - Predict month-end spending
   - Seasonal adjustment
   - Budget recommendation

#### P1 - Should Have
4. **Split Expenses**
   - Split with family members
   - Settlement tracking
   - Shared expense categories

5. **Recurring Expense Detection**
   - Auto-detect subscriptions
   - Renewal reminders
   - Subscription ROI analysis

6. **Export & Reports**
   - Expense report PDF
   - Tax-deductible expenses summary
   - Custom date range exports

### Files to Create/Modify

```
# New Components
src/components/expenses/SmartReceiptScanner.vue
src/components/expenses/SpendingInsights.vue
src/components/expenses/BudgetForecast.vue
src/components/expenses/SplitExpenseModal.vue
src/components/expenses/RecurringExpenseTracker.vue
src/components/expenses/ExpenseReportGenerator.vue

# New/Modified Routes
server/routes/receipts.ts
server/routes/expenses-insights.ts
server/services/ocr.service.ts
server/services/expense-forecast.service.ts

# Tests
e2e/tests/expenses/09-receipt-scanner.spec.ts
e2e/tests/expenses/10-spending-insights.spec.ts
```

### Claude Prompt

```
You are working on FIREKARO-VUE-Expenses (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement spending insights dashboard with trend analysis.

Context:
- Expenses composable: src/composables/useExpenses.ts
- Expenses routes: server/routes/expenses.ts, budgets.ts
- Existing charts: src/components/expenses/CategoryPieChart.vue, MonthlyTrendChart.vue

Requirements:
1. Create server/routes/expenses-insights.ts with:
   - GET /api/expenses/insights/trends (category trends)
   - GET /api/expenses/insights/anomalies (unusual spending)
   - GET /api/expenses/insights/forecast (month-end prediction)
2. Create src/components/expenses/SpendingInsights.vue with:
   - Category comparison (this month vs last month vs average)
   - Spending velocity chart (cumulative daily spending)
   - Top 5 spending categories with % change
   - Unusual transactions highlight
3. Add insights card to expenses index page
4. Support date range filtering

Use Chart.js for visualizations. Follow existing chart theme.
Commit after each feature: "feat(expenses): description"
```

---

## Stream 3: Investments Enhancements

**Folder**: `FIREKARO-VUE-Investments`
**Branch**: `feature/investments-enhancements`
**Section**: Investments

### Enhancement Features

#### P0 - Must Have
1. **CAS Statement Import**
   - Parse CAMS/KFintech CAS PDF
   - Auto-create MF holdings
   - NAV history tracking

2. **XIRR Calculation**
   - Per-investment XIRR
   - Portfolio-level XIRR
   - Benchmark comparison

3. **Rebalancing Suggestions**
   - Target allocation vs current
   - Rebalance amount calculator
   - Tax-efficient rebalancing

#### P1 - Should Have
4. **SIP Tracker**
   - SIP calendar view
   - Missed SIP alerts
   - SIP step-up calculator

5. **Stock Screener Integration**
   - Basic stock metrics
   - Dividend history
   - PE ratio tracking

6. **Goal-Based Investing**
   - Link investments to goals
   - Progress tracking
   - Shortfall alerts

### Files to Create/Modify

```
# New Components
src/components/investments/CASImporter.vue
src/components/investments/XIRRDisplay.vue
src/components/investments/RebalancingWizard.vue
src/components/investments/SIPCalendar.vue
src/components/investments/GoalLinkingModal.vue

# New Utilities
src/utils/xirr.ts
src/utils/xirr.spec.ts

# New/Modified Routes
server/routes/cas-import.ts
server/routes/investment-analytics.ts
server/services/cas-parser.service.ts
server/services/xirr.service.ts

# Tests
e2e/tests/investments/11-cas-import.spec.ts
e2e/tests/investments/12-xirr-calculation.spec.ts
```

### Claude Prompt

```
You are working on FIREKARO-VUE-Investments (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement XIRR calculation for investment returns.

Context:
- Investment composable: src/composables/useInvestments.ts
- Investment routes: server/routes/investments.ts
- Portfolio chart: src/components/investments/PortfolioAllocationChart.vue

Requirements:
1. Create src/utils/xirr.ts with Newton-Raphson XIRR algorithm
2. Create src/utils/xirr.spec.ts with test cases:
   - Single investment
   - Multiple investments
   - SIP investments
   - Partial redemptions
3. Add XIRR endpoint: GET /api/investments/:id/xirr
4. Add portfolio XIRR: GET /api/investments/portfolio-xirr
5. Create src/components/investments/XIRRDisplay.vue showing:
   - Absolute returns
   - XIRR percentage
   - Comparison with benchmark (Nifty 50)
6. Display XIRR in investment cards and portfolio overview

Handle edge cases: negative returns, very short periods.
Commit after each feature: "feat(investments): description"
```

---

## Stream 4: Liabilities Enhancements

**Folder**: `FIREKARO-VUE-Liabilities`
**Branch**: `feature/liabilities-enhancements`
**Section**: Liabilities

### Enhancement Features

#### P0 - Must Have
1. **Prepayment Calculator**
   - Impact on tenure vs EMI
   - Interest savings calculation
   - Optimal prepayment amount

2. **Balance Transfer Analyzer**
   - Compare offers from banks
   - Break-even analysis
   - Processing fee impact

3. **EMI Calendar**
   - All EMIs in calendar view
   - Payment reminders
   - Cash flow impact

#### P1 - Should Have
4. **Loan Comparison Tool**
   - Compare loan offers
   - Total cost analysis
   - Best offer recommendation

5. **Credit Score Integration**
   - Track credit score
   - Score improvement tips
   - Credit utilization alerts

6. **Refinancing Alerts**
   - Interest rate drop alerts
   - Refinancing opportunity detection
   - Savings potential calculation

### Files to Create/Modify

```
# New Components
src/components/liabilities/PrepaymentCalculator.vue
src/components/liabilities/BalanceTransferAnalyzer.vue
src/components/liabilities/EMICalendar.vue
src/components/liabilities/LoanComparisonTool.vue
src/components/liabilities/CreditScoreTracker.vue

# New/Modified Routes
server/routes/loan-analytics.ts
server/services/prepayment.service.ts
server/services/balance-transfer.service.ts

# Tests
e2e/tests/liabilities/08-prepayment-calc.spec.ts
e2e/tests/liabilities/09-balance-transfer.spec.ts
```

### Claude Prompt

```
You are working on FIREKARO-VUE-Liabilities (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement prepayment calculator with interest savings analysis.

Context:
- Liabilities composable: src/composables/useLiabilities.ts
- Loan routes: server/routes/loans.ts
- Existing amortization: src/components/liabilities/AmortizationTable.vue

Requirements:
1. Create src/components/liabilities/PrepaymentCalculator.vue with:
   - Prepayment amount input
   - Option: Reduce EMI vs Reduce Tenure
   - Before/After comparison table
   - Interest savings highlight
   - New amortization schedule preview
2. Add server endpoint: POST /api/loans/:id/prepayment-analysis
3. Calculate:
   - Total interest saved
   - New tenure/EMI
   - Months saved
   - Effective return on prepayment
4. Add prepayment to amortization chart visualization
5. Support partial and full prepayment scenarios

Use Indian home loan norms (monthly compounding).
Commit after each feature: "feat(liabilities): description"
```

---

## Stream 5: Insurance Enhancements

**Folder**: `FIREKARO-VUE-Insurance`
**Branch**: `feature/insurance-enhancements`
**Section**: Insurance

### Enhancement Features

#### P0 - Must Have
1. **Policy Document Parser**
   - Extract key policy details from PDF
   - Auto-fill policy form
   - Document storage

2. **Coverage Gap Analysis**
   - Life cover adequacy (HLV method)
   - Health cover vs medical inflation
   - Critical illness gap

3. **Premium Comparison**
   - Compare similar policies
   - Cost per lakh cover
   - Feature comparison matrix

#### P1 - Should Have
4. **Claim Tracker**
   - Track claim status
   - Document checklist
   - Claim history

5. **Renewal Manager**
   - Renewal calendar
   - Auto-renewal tracking
   - Premium change alerts

6. **Nominee Management**
   - Centralized nominee view
   - Update reminders
   - Nomination percentage tracking

### Files to Create/Modify

```
# New Components
src/components/insurance/PolicyDocParser.vue
src/components/insurance/CoverageGapAnalysis.vue
src/components/insurance/PremiumComparison.vue
src/components/insurance/ClaimTracker.vue
src/components/insurance/RenewalCalendar.vue
src/components/insurance/NomineeManager.vue

# New/Modified Routes
server/routes/insurance-analytics.ts
server/services/policy-parser.service.ts
server/services/coverage-analysis.service.ts

# Tests
e2e/tests/insurance/06-policy-parser.spec.ts
e2e/tests/insurance/07-coverage-gap.spec.ts
```

### Claude Prompt

```
You are working on FIREKARO-VUE-Insurance (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement coverage gap analysis with recommendations.

Context:
- Insurance composable: src/composables/useInsurance.ts
- Insurance routes: server/routes/insurance.ts
- Existing calculator: src/pages/dashboard/insurance/calculator.vue

Requirements:
1. Create server/services/coverage-analysis.service.ts with:
   - HLV (Human Life Value) calculation
   - Income replacement method
   - Expense-based method
2. Create src/components/insurance/CoverageGapAnalysis.vue with:
   - Current coverage summary
   - Recommended coverage by method
   - Gap visualization (gauge chart)
   - Action items for closing gap
3. Add endpoint: GET /api/insurance/coverage-analysis
4. Consider:
   - Annual income and growth
   - Existing liabilities
   - Children's education needs
   - Retirement corpus gap
   - Existing coverage (term + employer)
5. Health insurance: Compare sum insured vs medical inflation projection

Use Indian context (medical costs, inflation rates).
Commit after each feature: "feat(insurance): description"
```

---

## Stream 6: Financial Health Enhancements

**Folder**: `FIREKARO-VUE-FinancialHealth`
**Branch**: `feature/financial-health-enhancements`
**Section**: Financial Health

### Enhancement Features

#### P0 - Must Have
1. **Cash Flow Forecasting**
   - Predict next 3-6 months
   - Account for known expenses
   - Surplus/deficit projection

2. **Financial Ratios Dashboard**
   - Savings rate
   - Debt-to-income
   - Liquidity ratio
   - Investment rate

3. **Net Worth Milestones**
   - Track milestone achievements
   - Historical milestone timeline
   - Next milestone projection

#### P1 - Should Have
4. **Financial Health Score v2**
   - More factors in score
   - Peer comparison (anonymized)
   - Improvement recommendations

5. **Passive Income Tracker**
   - Track all passive income sources
   - Passive income growth chart
   - FIRE crossover progress

6. **Financial Calendar**
   - All financial events
   - Tax deadlines
   - Investment maturity dates

### Files to Create/Modify

```
# New Components
src/components/financial-health/CashFlowForecast.vue
src/components/financial-health/FinancialRatiosDashboard.vue
src/components/financial-health/MilestoneTimeline.vue
src/components/financial-health/HealthScoreV2.vue
src/components/financial-health/FinancialCalendar.vue

# New/Modified Routes
server/routes/financial-forecast.ts
server/routes/financial-ratios.ts
server/services/forecast.service.ts

# Tests
e2e/tests/financial-health/08-cash-flow-forecast.spec.ts
e2e/tests/financial-health/09-financial-ratios.spec.ts
```

### Claude Prompt

```
You are working on FIREKARO-VUE-FinancialHealth (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement financial ratios dashboard with benchmarks.

Context:
- Financial health composable: src/composables/useFinancialHealth.ts
- Existing components: src/components/financial-health/
- Health score: src/components/financial-health/HealthScoreGauge.vue

Requirements:
1. Create server/routes/financial-ratios.ts with:
   - GET /api/financial-health/ratios (all ratios)
   - Historical ratio trends
2. Create src/components/financial-health/FinancialRatiosDashboard.vue with:
   - Savings Rate: (Income - Expenses) / Income
   - Investment Rate: Investments / Income
   - Debt-to-Income: Total EMIs / Monthly Income
   - Liquidity Ratio: Liquid Assets / Monthly Expenses
   - Net Worth to Income: Net Worth / Annual Income
3. Each ratio shows:
   - Current value with gauge
   - Benchmark range (healthy/warning/danger)
   - 6-month trend sparkline
   - Tips to improve
4. Aggregate into overall financial fitness score
5. Support family view (combined ratios)

Use Indian benchmarks (e.g., 30% savings rate is good).
Commit after each feature: "feat(financial-health): description"
```

---

## Stream 7: FIRE Enhancements

**Folder**: `FIREKARO-VUE-FIRE`
**Branch**: `feature/fire-enhancements`
**Section**: FIRE Goals

### Enhancement Features

#### P0 - Must Have
1. **Monte Carlo Simulation**
   - 1000+ simulation runs
   - Success probability
   - Confidence intervals
   - Sequence of returns risk

2. **Withdrawal Strategy Optimizer**
   - SWR calculator with guardrails
   - Bucket strategy visualizer
   - VPW calculator

3. **FIRE Milestone Celebrations**
   - Confetti on achievements
   - Milestone badges
   - Progress animations

#### P1 - Should Have
4. **What-If Scenarios**
   - Adjust assumptions
   - Side-by-side comparison
   - Sensitivity analysis

5. **Coast FIRE Calculator**
   - Coast FIRE number
   - Years to coast
   - Part-time income modeling

6. **FIRE Community Benchmarks**
   - Anonymous comparison
   - Percentile ranking
   - Similar profile insights

### Files to Create/Modify

```
# New Components
src/components/fire/MonteCarloSimulation.vue
src/components/fire/WithdrawalOptimizer.vue
src/components/fire/MilestoneCelebration.vue
src/components/fire/WhatIfScenarios.vue
src/components/fire/CoastFIRECalculator.vue
src/components/fire/ConfettiEffect.vue

# New Utilities
src/utils/monte-carlo.ts
src/utils/monte-carlo.spec.ts

# New/Modified Routes
server/routes/fire-simulations.ts
server/services/monte-carlo.service.ts
server/services/withdrawal.service.ts

# Tests
e2e/tests/fire-goals/07-monte-carlo.spec.ts
e2e/tests/fire-goals/08-withdrawal-optimizer.spec.ts
```

### Claude Prompt

```
You are working on FIREKARO-VUE-FIRE (Vue 3 + Vuetify 3 + Hono backend).

Task: Implement Monte Carlo simulation for FIRE projections.

Context:
- FIRE composable: src/composables/useFIRE.ts
- Existing projection: src/components/fire/ProjectionChart.vue
- FIRE calculator: src/components/fire/FIRECalculator.vue

Requirements:
1. Create src/utils/monte-carlo.ts with:
   - Simulation engine (1000 runs default)
   - Variable return distributions by asset class
   - Inflation variability
   - Sequence of returns modeling
2. Create src/utils/monte-carlo.spec.ts with test cases
3. Create server/routes/fire-simulations.ts:
   - POST /api/fire/monte-carlo (run simulation)
   - Return percentile outcomes (10th, 25th, 50th, 75th, 90th)
4. Create src/components/fire/MonteCarloSimulation.vue with:
   - Fan chart showing probability ranges
   - Success rate percentage
   - Median outcome vs target
   - Worst/best case scenarios
   - Adjustable parameters (runs, return assumptions)
5. Add to projections page

Use historical Indian market returns for defaults.
Commit after each feature: "feat(fire): description"
```

---

## Worktree Setup Commands

### Folder Structure

All worktrees are created inside a single parent folder for better organization:

```
D:\Abhay\VibeCoding\
├── FIREKaro-Vue/                      # Main repo (master branch)
└── FIREKaro-Worktrees/                # Parent folder for all worktrees
    ├── FIREKARO-VUE-Income/           # Stream 1
    ├── FIREKARO-VUE-Expenses/         # Stream 2
    ├── FIREKARO-VUE-Investments/      # Stream 3
    ├── FIREKARO-VUE-Liabilities/      # Stream 4
    ├── FIREKARO-VUE-Insurance/        # Stream 5
    ├── FIREKARO-VUE-FinancialHealth/  # Stream 6
    └── FIREKARO-VUE-FIRE/             # Stream 7
```

### Setup Commands

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue

# Create parent folder for worktrees
mkdir ../FIREKaro-Worktrees

# Create feature branches
git branch feature/income-enhancements
git branch feature/expenses-enhancements
git branch feature/investments-enhancements
git branch feature/liabilities-enhancements
git branch feature/insurance-enhancements
git branch feature/financial-health-enhancements
git branch feature/fire-enhancements

# Create worktrees inside parent folder
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-Income feature/income-enhancements
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-Expenses feature/expenses-enhancements
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-Investments feature/investments-enhancements
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-Liabilities feature/liabilities-enhancements
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-Insurance feature/insurance-enhancements
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-FinancialHealth feature/financial-health-enhancements
git worktree add ../FIREKaro-Worktrees/FIREKARO-VUE-FIRE feature/fire-enhancements

# Install dependencies in each worktree
cd ../FIREKaro-Worktrees/FIREKARO-VUE-Income && npm install
cd ../FIREKaro-Worktrees/FIREKARO-VUE-Expenses && npm install
cd ../FIREKaro-Worktrees/FIREKARO-VUE-Investments && npm install
cd ../FIREKaro-Worktrees/FIREKARO-VUE-Liabilities && npm install
cd ../FIREKaro-Worktrees/FIREKARO-VUE-Insurance && npm install
cd ../FIREKaro-Worktrees/FIREKARO-VUE-FinancialHealth && npm install
cd ../FIREKaro-Worktrees/FIREKARO-VUE-FIRE && npm install
```

---

## Daily Workflow

### Morning Sync (Each Worktree)

```bash
git fetch origin
git rebase origin/master
```

### End of Day

```bash
git add .
git commit -m "feat(section): description"
git push origin <branch-name>
```

---

## Merge Protocol

### When a Stream Completes

```bash
# 1. Verify in worktree
npm run type-check
npm run test:e2e -- --grep "section-name"

# 2. Rebase and push
git fetch origin
git rebase origin/master
git push origin feature/section-enhancements --force-with-lease

# 3. Create PR or merge
cd D:\Abhay\VibeCoding\FIREKaro-Vue
git checkout master
git merge feature/section-enhancements
git push origin master

# 4. Update other worktrees
cd ../FIREKaro-Worktrees/FIREKARO-VUE-Income && git fetch && git rebase origin/master
# Repeat for other active worktrees
```

### Cleanup

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue

# Remove worktrees
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-Income
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-Expenses
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-Investments
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-Liabilities
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-Insurance
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-FinancialHealth
git worktree remove ../FIREKaro-Worktrees/FIREKARO-VUE-FIRE

# Remove parent folder (after all worktrees removed)
rmdir ../FIREKaro-Worktrees

# Delete merged branches
git branch -d feature/income-enhancements
git branch -d feature/expenses-enhancements
git branch -d feature/investments-enhancements
git branch -d feature/liabilities-enhancements
git branch -d feature/insurance-enhancements
git branch -d feature/financial-health-enhancements
git branch -d feature/fire-enhancements
```

---

## Component Mapping: shadcn/ui to Vuetify 3

| shadcn/ui (React) | Vuetify 3 (Vue) |
|-------------------|-----------------|
| `<Button>` | `<v-btn>` |
| `<Card>` | `<v-card>` |
| `<CardHeader>` | `<v-card-title>` |
| `<CardContent>` | `<v-card-text>` |
| `<Input>` | `<v-text-field>` |
| `<Select>` | `<v-select>` |
| `<Dialog>` | `<v-dialog>` |
| `<Table>` | `<v-data-table>` |
| `<Tabs>` | `<v-tabs>` + `<v-tab>` |
| `<TabsContent>` | `<v-tabs-window-item>` |
| `<Alert>` | `<v-alert>` |
| `<Badge>` | `<v-chip>` |
| `<Checkbox>` | `<v-checkbox>` |
| `<Switch>` | `<v-switch>` |
| `<Skeleton>` | `<v-skeleton-loader>` |
| `<Progress>` | `<v-progress-linear>` |
| `<Slider>` | `<v-slider>` |
| `<Tooltip>` | `<v-tooltip>` |
| `<Avatar>` | `<v-avatar>` |
| `<DropdownMenu>` | `<v-menu>` |

---

## Key Files Reference

### Backend Entry Points
- `server/index.ts` - Route registration
- `server/lib/prisma.ts` - Database client
- `server/lib/auth.ts` - Authentication
- `server/middleware/auth.ts` - Auth middleware

### Frontend Entry Points
- `src/main.ts` - App bootstrap
- `src/router/index.ts` - Route definitions (includes legacy redirects)
- `src/layouts/DashboardLayout.vue` - Sidebar navigation (8 sections)
- `src/stores/ui.ts` - UI state (family view, theme)
- `src/stores/user.ts` - User state

### Dashboard Sections (8 total)
| Section | Route | Icon |
|---------|-------|------|
| Income | `/dashboard/income/*` | `mdi-currency-inr` |
| Tax Planning | `/dashboard/tax-planning/*` | `mdi-calculator-variant-outline` |
| Expenses | `/dashboard/expenses/*` | `mdi-credit-card-outline` |
| Investments | `/dashboard/investments/*` | `mdi-chart-line` |
| Liabilities | `/dashboard/liabilities/*` | `mdi-bank-outline` |
| Insurance | `/dashboard/insurance/*` | `mdi-shield-check-outline` |
| Financial Health | `/dashboard/financial-health/*` | `mdi-heart-pulse` |
| FIRE & Goals | `/dashboard/fire-goals/*` | `mdi-fire` |

### Shared Utilities
- `src/utils/formatters.ts` - INR formatting
- `src/utils/chartTheme.ts` - Chart colors/options
- `src/composables/useSalary.ts` - FY utilities

---

## Enhancement Priority Matrix

| Stream | P0 Features | P1 Features | Est. Effort |
|--------|-------------|-------------|-------------|
| Income (unified) | Form 16, TDS, Cap Gains | Salary Slip, Dividends | Medium |
| Expenses | Receipt Scanner, Insights, Forecast | Split, Recurring | Medium |
| Investments | CAS Import, XIRR, Rebalancing | SIP Tracker, Goals | High |
| Liabilities | Prepayment, Balance Transfer, Calendar | Comparison, Credit Score | Medium |
| Insurance | Policy Parser, Coverage Gap, Comparison | Claims, Renewals | Medium |
| Financial Health | Cash Flow, Ratios, Milestones | Score v2, Calendar | Medium |
| FIRE | Monte Carlo, Withdrawal, Celebrations | What-If, Coast FIRE | High |

---

*Guide updated: January 10, 2026*
*Architecture: Vue 3 SPA + Hono + Prisma Backend*
*Status: Core complete, section enhancement streams defined*
