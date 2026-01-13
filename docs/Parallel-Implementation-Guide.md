# Vue 3 SPA Parallel Implementation Guide

> **Purpose**: Step-by-step manual actions + Claude prompts for each worktree
> **Created**: January 7, 2026 | **Updated**: January 8, 2026
> **Architecture**: Vue 3 + Vite + Vuetify 3 (SPA) + Next.js API Backend
> **Companion to**: Vue3-SPA-Parallel-Implementation-Plan.md

---

## Current Status (January 8, 2026)

### Foundation Complete

- [x] Vue 3 project created (`D:\Abhay\VibeCoding\FIREKaro-Vue`)
- [x] Vuetify 3 configured with ProjectionLab theme
- [x] Vue Router with 50+ routes for all 9 sections
- [x] Pinia stores (ui, user)
- [x] Vue Query plugin configured
- [x] DashboardLayout with 9-section sidebar
- [x] Shared components (SectionHeader, FamilyToggle)
- [x] All stub pages created (55 .vue files)
- [x] Git initialized with initial commit
- [x] 4 feature branches created
- [x] 4 worktrees ready with dependencies installed

### Ready for Parallel Development

```
D:\Abhay\VibeCoding\
├── FIREKaro/              # Next.js API backend (port 3000)
├── FIREKaro-Vue/          # Main Vue 3 repo (main branch)
├── FIREKaro-Vue-S1/       # Stream 1: Income & Tax
├── FIREKaro-Vue-S2/       # Stream 2: Expenses & Protection
├── FIREKaro-Vue-S3/       # Stream 3: Investments & Liabilities
└── FIREKaro-Vue-S4/       # Stream 4: Financial Health & FIRE
```

---

## Quick Start: Development Terminals

### Terminal 1: Next.js API Backend (Always Running)
```bash
cd D:\Abhay\VibeCoding\FIREKaro
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: Vue Stream (Pick One)
```bash
# Stream 1 - Income & Tax
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S1
npm run dev

# Stream 2 - Expenses & Protection
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S2
npm run dev

# Stream 3 - Investments & Liabilities
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S3
npm run dev

# Stream 4 - Financial Health & FIRE
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S4
npm run dev

# Vue dev server runs on http://localhost:5173
# API calls proxy to http://localhost:3000
```

---

## Stream Overview

| Stream | Directory | Branch | Sections | Est. Days |
|--------|-----------|--------|----------|-----------|
| 1 | `FIREKaro-Vue-S1` | `feature/vue-income-tax` | Salary, Non-Salary, Tax | 9 |
| 2 | `FIREKaro-Vue-S2` | `feature/vue-expenses-protection` | Expenses, Protection | 5 |
| 3 | `FIREKaro-Vue-S3` | `feature/vue-investments-liabilities` | Investments, Liabilities | 6 |
| 4 | `FIREKaro-Vue-S4` | `feature/vue-health-fire` | Financial Health, FIRE | 11 |

---

## STREAM 1: Income & Tax Track

**Directory**: `D:\Abhay\VibeCoding\FIREKaro-Vue-S1`
**Branch**: `feature/vue-income-tax`
**Sections**: Salary (3d) + Non-Salary (5d) → Tax Planning (4d)
**Total**: ~9 days (Salary/Non-Salary run in parallel)

---

### Stream 1 - Prompt 1A: Salary Section

```
You are working in FIREKaro-Vue-S1 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build the SALARY section UI that calls the existing Next.js API.

API Endpoints (already exist - DO NOT modify):
- GET /api/salary/current
- GET /api/salary-history
- POST /api/salary-history
- PUT /api/salary-history/:id
- DELETE /api/salary-history/:id

File Structure to Create:
src/pages/dashboard/salary/
├── index.vue (Overview - replace stub)
├── current.vue (Current salary breakdown)
├── history.vue (Monthly salary history)
└── reports.vue (Salary reports)

src/components/salary/
├── SalaryBreakdownCard.vue
├── SalaryHistoryTable.vue
├── SalaryHistoryForm.vue
├── SalaryChart.vue
└── SalaryComparisonCard.vue

src/composables/
└── useSalary.ts (Vue Query hooks)

IMPORTANT RULES:
1. Use Vuetify 3 components (v-card, v-data-table, v-btn, v-text-field, etc.)
2. Use Vue Query (@tanstack/vue-query) for data fetching
3. Use INR formatting: Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })
4. Include Family View toggle support (show selected member's salary)
5. Use the existing SectionHeader component with tabs
6. API base: use relative URLs (e.g., fetch('/api/salary/current'))

Implement in order:
1. useSalary.ts composable with Vue Query hooks
2. index.vue - Overview page with summary cards
3. current.vue - Current salary breakdown page
4. history.vue - Salary history with CRUD table
5. reports.vue - Reports tab with charts

Commit after each: "feat(salary): description"
```

---

### Stream 1 - Prompt 1B: Non-Salary Income Section

```
You are working in FIREKaro-Vue-S1 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build the NON-SALARY INCOME section UI.

API Endpoints (already exist):
- GET/POST /api/income-sources
- GET/PUT/DELETE /api/income-sources/:id
- GET/POST /api/business-income
- GET/POST /api/rental-income
- GET/POST /api/capital-gains
- GET/POST /api/other-income

File Structure to Create:
src/pages/dashboard/income/
├── index.vue (Overview - replace stub)
├── business.vue (Business/Profession)
├── rental.vue (Rental/House Property)
├── capital-gains.vue (STCG/LTCG)
├── interest.vue (Interest Income)
├── dividends.vue (Dividend Income)
├── other.vue (Commission, Gifts, Other)
└── reports.vue (Income reports)

src/components/income/
├── IncomeSourceCard.vue
├── IncomeSourceForm.vue
├── BusinessIncomeForm.vue
├── RentalIncomeForm.vue
├── CapitalGainsCalculator.vue
├── OtherIncomeForm.vue
└── IncomeSummaryChart.vue

src/composables/
└── useIncome.ts (Vue Query hooks)

Key Features:
- Multi-source income overview with aggregation
- Business/Profession (44AD/44ADA presumptive taxation)
- Rental income with HRA exemption calculation
- Capital gains (STCG/LTCG) calculator
- Other sources (interest, dividends, gifts)
- Family member income aggregation view

Commit after each sub-page: "feat(income): description"
```

---

### Stream 1 - Prompt 1C: Tax Planning Section

**Prerequisites**: Salary AND Non-Salary Income APIs must be working

```
You are working in FIREKaro-Vue-S1 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build TAX PLANNING section UI.

API Endpoints (already exist):
- GET /api/tax-planning/calculate
- GET /api/tax-planning/comparison
- GET /api/tax/deductions
- GET /api/tax/exemptions

File Structure to Create:
src/pages/dashboard/tax-planning/
├── index.vue (Overview - replace stub)
├── calculator.vue (Old vs New regime)
├── deductions.vue (80C, 80D optimizer)
└── reports.vue (Tax reports)

src/components/tax/
├── TaxRegimeSelector.vue
├── TaxComparisonCard.vue
├── TaxBreakdownTable.vue
├── DeductionsOptimizer.vue
├── DeductionCategory.vue
├── TaxSavingsRecommendations.vue
└── ITRFormSuggestion.vue

src/composables/
└── useTax.ts (Vue Query hooks)

Key Features:
- Old vs New regime comparison with recommendation
- Multi-source income aggregation from Salary + Non-Salary
- Section 80C/80D/80E deduction tracking with limits
- Tax-saving investment recommendations
- ITR form suggestion (ITR-1/2/3/4)
- Family tax planning view

CRITICAL: Integrate with Salary + Non-Salary Income data via APIs
```

---

## STREAM 2: Expenses & Protection Track

**Directory**: `D:\Abhay\VibeCoding\FIREKaro-Vue-S2`
**Branch**: `feature/vue-expenses-protection`
**Sections**: Expenses (3d) + Protection (2d)
**Total**: ~5 days

---

### Stream 2 - Prompt 2A: Expenses Section

```
You are working in FIREKaro-Vue-S2 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build EXPENSES section UI.

API Endpoints (already exist):
- GET/POST /api/expenses
- GET /api/expenses/categories
- GET /api/expenses/ai/categorize
- GET/POST /api/budgets
- GET/POST /api/expense-rules

File Structure to Create:
src/pages/dashboard/expenses/
├── index.vue (Overview - replace stub)
├── track.vue (Add/list expenses)
├── budgets.vue (Budget management)
└── reports.vue (Expense reports)

src/components/expenses/
├── ExpenseForm.vue
├── ExpenseList.vue
├── ExpenseCard.vue
├── BudgetCard.vue
├── BudgetForm.vue
├── CategoryPieChart.vue
├── MonthlyTrendChart.vue
├── CSVImportModal.vue
└── ExpenseFilters.vue

src/composables/
└── useExpenses.ts (Vue Query hooks)

Key Features:
- Expense tracking with AI categorization
- Budget vs actual comparison with progress bars
- Category breakdown pie chart
- Monthly trend line chart
- CSV import modal (in Track tab)
- Date navigation: Month dropdown + Prev/Next buttons

User preferences:
- In-app alerts ONLY (no email/push)
- Month picker for navigation
- CSV import stays as modal, not separate page

Commit after each page: "feat(expenses): description"
```

---

### Stream 2 - Prompt 2B: Protection Section

```
You are working in FIREKaro-Vue-S2 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build PROTECTION (Insurance) section UI.

API Endpoints (already exist):
- GET/POST /api/insurance
- GET /api/insurance/coverage-analysis
- GET /api/insurance/recommendations

File Structure to Create:
src/pages/dashboard/protection/
├── index.vue (Overview - replace stub)
├── life.vue (Life insurance)
├── health.vue (Health insurance)
├── other.vue (Motor, Home, Travel)
├── calculator.vue (Adequacy wizard)
└── reports.vue (Insurance reports)

src/components/protection/
├── InsurancePolicyCard.vue
├── InsurancePolicyForm.vue
├── CoverageAdequacyWizard.vue (4-step)
├── HLVCalculator.vue
├── CoverageGapAlert.vue
├── InsuranceSummaryCard.vue
└── FamilyCoverageView.vue

src/composables/
└── useProtection.ts (Vue Query hooks)

Key Features:
- Life insurance adequacy using HLV (Human Life Value) method
- Health insurance coverage check (sum insured vs needs)
- 4-step adequacy wizard:
  1. Current coverage
  2. Financial obligations
  3. Future goals
  4. Gap analysis
- Family member coverage view
- Policy renewal reminders

Commit after each page: "feat(protection): description"
```

---

## STREAM 3: Investments & Liabilities Track

**Directory**: `D:\Abhay\VibeCoding\FIREKaro-Vue-S3`
**Branch**: `feature/vue-investments-liabilities`
**Sections**: Investments (3.5d) + Liabilities (2.5d)
**Total**: ~6 days (can run in parallel)

---

### Stream 3 - Prompt 3A: Investments Section

```
You are working in FIREKaro-Vue-S3 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build INVESTMENTS section UI.

API Endpoints (already exist):
- GET/POST /api/investments
- GET /api/portfolio
- GET/POST /api/epf
- GET/POST /api/nps
- GET/POST /api/ppf

File Structure to Create:
src/pages/dashboard/investments/
├── index.vue (Portfolio overview - replace stub)
├── stocks.vue (Direct equity)
├── mutual-funds.vue (MF holdings)
├── epf-ppf.vue (Retirement funds)
├── nps.vue (National Pension)
├── property.vue (Real estate)
└── reports.vue (Investment reports)

src/components/investments/
├── PortfolioAllocationChart.vue (Donut)
├── AssetCard.vue
├── AssetForm.vue
├── EPFCalculator.vue
├── PPFTracker.vue
├── NPSCalculator.vue
├── StockHoldingCard.vue
├── MutualFundCard.vue
├── PropertyCard.vue
└── ReturnsChart.vue

src/composables/
└── useInvestments.ts (Vue Query hooks)

Key Features:
- Consolidated portfolio overview
- Asset allocation donut chart
- EPF/PPF/NPS calculators with projections
- Property tracking
- Family portfolio aggregation
- Investment returns tracking

Commit after each page: "feat(investments): description"
```

---

### Stream 3 - Prompt 3B: Liabilities Section

```
You are working in FIREKaro-Vue-S3 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build LIABILITIES section UI.

API Endpoints (already exist):
- GET/POST /api/loans
- GET/PUT/DELETE /api/loans/:id
- GET/POST /api/credit-cards
- GET /api/debt-payoff/strategies

File Structure to Create:
src/pages/liabilities/
├── index.vue (Overview - replace stub)
├── loans.vue (All loans)
├── credit-cards.vue (Credit cards)
├── debt-payoff.vue (Payoff strategies)
└── reports.vue (Liability reports)

src/components/liabilities/
├── LoanCard.vue
├── LoanForm.vue
├── CreditCardCard.vue
├── CreditCardForm.vue
├── DebtPayoffStrategy.vue
├── AmortizationTable.vue
├── DebtToIncomeGauge.vue
└── PayoffProgressChart.vue

src/composables/
└── useLiabilities.ts (Vue Query hooks)

Key Features:
- Loans with EMI tracking and amortization
- Credit card balance/limit utilization
- Debt-to-income ratio gauge
- Payoff strategies (Snowball, Avalanche, Custom)
- Family liabilities view
- Prepayment calculator

Commit after each page: "feat(liabilities): description"
```

---

## STREAM 4: Financial Health & FIRE Track

**Directory**: `D:\Abhay\VibeCoding\FIREKaro-Vue-S4`
**Branch**: `feature/vue-health-fire`
**Sections**: Financial Health (3d) → FIRE & Goals (8d)
**Total**: ~11 days

---

### Stream 4 - Prompt 4A: Financial Health Section

**Prerequisites**: Wait until Streams 1-3 have core APIs working (~Day 7)

```
You are working in FIREKaro-Vue-S4 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build FINANCIAL HEALTH section UI.

API Endpoints (already exist):
- GET /api/financial-health/networth
- GET /api/financial-health/cash-flow
- GET/POST /api/banking/accounts
- GET /api/banking/transactions

Verify these APIs work before starting:
- GET /api/salary/current (Stream 1)
- GET /api/expenses (Stream 2)
- GET /api/investments (Stream 3)
- GET /api/loans (Stream 3)

File Structure to Create:
src/pages/dashboard/financial-health/
├── index.vue (Health score - replace stub)
├── net-worth.vue (Net worth breakdown)
├── cash-flow.vue (Monthly cash flow)
├── banking.vue (Bank accounts)
├── emergency-fund.vue (Emergency fund)
└── reports.vue (Financial reports)

src/components/financial-health/
├── HealthScoreGauge.vue (0-100 score)
├── HealthFactorCard.vue
├── NetWorthChart.vue (Area chart)
├── NetWorthBreakdown.vue
├── CashFlowSankey.vue
├── CashFlowSummary.vue
├── BankAccountCard.vue
├── BankAccountForm.vue
├── EmergencyFundCalculator.vue
└── EmergencyFundProgress.vue

src/composables/
└── useFinancialHealth.ts (Vue Query hooks)

Key Features:
- Financial Health Score (4 factors):
  1. Net Worth trend
  2. Emergency Fund coverage
  3. Debt-to-Income ratio
  4. Savings Rate
- Net Worth tracker with asset/liability breakdown
- Monthly cash flow Sankey diagram
- Emergency fund calculator:
  - User selects which FDs and Liquid MFs to include
  - Shows months of coverage
- Family net worth aggregation

Commit after each page: "feat(financial-health): description"
```

---

### Stream 4 - Prompt 4B: FIRE & Goals Section (CAPSTONE)

**Prerequisites**: ALL other sections must be complete

```
You are working in FIREKaro-Vue-S4 worktree (Vue 3 + Vuetify 3 SPA).

Task: Build FIRE & GOALS section - the CAPSTONE integrating all data.

API Endpoints (already exist):
- GET /api/fire/metrics
- GET /api/fire/projections
- GET /api/fire/monte-carlo
- GET/POST /api/goals
- GET /api/withdrawal-strategy

File Structure to Create:
src/pages/dashboard/fire-goals/
├── index.vue (FIRE Dashboard - replace stub)
├── calculators.vue (FIRE calculators)
├── goals.vue (Financial goals)
├── projections.vue (Long-term projections)
├── withdrawal.vue (Withdrawal strategies)
└── reports.vue (FIRE reports)

src/components/fire/
├── FreedomScoreCard.vue (4-domain score)
├── FreedomScoreDomain.vue
├── CrossoverPointChart.vue
├── ExpenseCoverageUnlocks.vue
├── FIREMilestoneCard.vue
├── FIRECalculator.vue
├── MonteCarloChart.vue
├── MonteCarloResults.vue
├── GoalCard.vue
├── GoalForm.vue
├── GoalTimeline.vue
├── ProjectionChart.vue (100-year)
├── ScenarioCompare.vue
├── WithdrawalStrategySelector.vue
├── BucketVisualization.vue
├── SWRCalculator.vue
└── DailyNugget.vue

src/composables/
└── useFIRE.ts (Vue Query hooks)

Key Features (Priority Order):

P0 (Must Have):
- FIRE Freedom Score (4 domains: SAVE, GROW, PROTECT, READY)
- FIRE number calculator (25x annual expenses)
- Goal cards with progress bars
- Basic projection chart

P1 (Should Have):
- Crossover Point visualization (investment income vs expenses)
- Monte Carlo simulation (1000 runs)
- Withdrawal strategies:
  - SWR (Safe Withdrawal Rate)
  - Bucket Strategy
  - VPW (Variable Percentage Withdrawal)
- Life events timeline

P2 (Nice to Have):
- Daily FIRE Nuggets
- Confetti celebrations
- Expense Coverage Unlocks (gamification)
- Achievement badges

Implementation order:
1. useFIRE.ts composable with all Vue Query hooks
2. index.vue - FIRE Dashboard with Freedom Score
3. calculators.vue - FIRE calculators
4. goals.vue - Financial goals management
5. projections.vue - Long-term projections
6. withdrawal.vue - Withdrawal strategies
7. reports.vue - FIRE reports

Commit after each: "feat(fire): description"
```

---

## Component Mapping: shadcn/ui → Vuetify 3

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

## Daily Sync Protocol

### Morning Sync (Run in Each Worktree)

```bash
# Stream 1
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S1
git fetch origin
git rebase origin/main

# Stream 2
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S2
git fetch origin
git rebase origin/main

# Stream 3
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S3
git fetch origin
git rebase origin/main

# Stream 4
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S4
git fetch origin
git rebase origin/main
```

### End of Day Commit & Push

```bash
# In each worktree that had changes
git add .
git commit -m "feat(section): description of work"
git push origin <branch-name>
```

---

## Merge Protocol

### When a Stream Completes

```bash
# Example: Stream 2 completes first

# 1. Final rebase and verify
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S2
git fetch origin
git rebase origin/main
npm run type-check
npm run build

# 2. Push final changes
git push origin feature/vue-expenses-protection --force-with-lease

# 3. Merge to main (or create PR)
cd D:\Abhay\VibeCoding\FIREKaro-Vue
git checkout main
git merge feature/vue-expenses-protection
git push origin main

# 4. Update other worktrees
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S1
git fetch origin && git rebase origin/main

cd D:\Abhay\VibeCoding\FIREKaro-Vue-S3
git fetch origin && git rebase origin/main

cd D:\Abhay\VibeCoding\FIREKaro-Vue-S4
git fetch origin && git rebase origin/main
```

### Recommended Merge Order

1. **Stream 2** (Expenses + Protection) - Day ~5
2. **Stream 3** (Investments + Liabilities) - Day ~6
3. **Stream 1** (Salary + Non-Salary + Tax) - Day ~9
4. **Stream 4** (Financial Health + FIRE) - Day ~17

---

## Cleanup After Completion

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue

# Remove worktrees
git worktree remove ../FIREKaro-Vue-S1
git worktree remove ../FIREKaro-Vue-S2
git worktree remove ../FIREKaro-Vue-S3
git worktree remove ../FIREKaro-Vue-S4

# Delete feature branches
git branch -d feature/vue-income-tax
git branch -d feature/vue-expenses-protection
git branch -d feature/vue-investments-liabilities
git branch -d feature/vue-health-fire
```

---

## Troubleshooting

### API Proxy Not Working
```bash
# Ensure Next.js backend is running on port 3000
cd D:\Abhay\VibeCoding\FIREKaro
npm run dev

# Check vite.config.ts has proxy configured
# proxy: { '/api': { target: 'http://localhost:3000' } }
```

### TypeScript Errors
```bash
npm run type-check  # Identify issues
npx vue-tsc --noEmit  # Alternative check
```

### Conflict During Rebase
```bash
git status  # See conflicting files
# Manually resolve conflicts
git add <resolved-files>
git rebase --continue
```

### Worktree Issues
```bash
git worktree list  # List all worktrees
git worktree remove <path> --force  # Force remove
git worktree add <path> <branch>  # Recreate
```

---

## Timeline Summary

```
Day:    1    3    5    7    9    11   13   15   17   19   21   23   25
        │    │    │    │    │    │    │    │    │    │    │    │    │
        ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼

STREAM 1 (Income Track) ─────────────────────────────────────────────────
   [███ SALARY (3d) ███]
   [████████ NON-SALARY INCOME (5d) ████████]
                        [████████ TAX PLANNING (4d) ████████]

STREAM 2 (Money Management) ─────────────────────────────────────────────
   [███ EXPENSES (3d) ███]
          [██ PROTECTION (2d) ██]
                              ← MERGE Day 5

STREAM 3 (Assets & Debts) ───────────────────────────────────────────────
   [████ INVESTMENTS (3.5d) ████]
      [███ LIABILITIES (2.5d) ███]
                              ← MERGE Day 6

STREAM 4 (Health & FIRE) ────────────────────────────────────────────────
                        [███ FIN HEALTH (3d) ███]
                                 [████████████████ FIRE & GOALS (8d) ████████████████]
                                                                    ← MERGE Day 17
```

---

*Guide updated: January 8, 2026*
*Architecture: Vue 3 SPA + Next.js API Backend*
*Estimated Duration: ~17-25 days (parallel) vs ~45 days (sequential)*
