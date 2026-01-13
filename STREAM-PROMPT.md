# Liabilities Stream - Enhancement Prompt

## Quick Start
```
Read STREAM-PROMPT.md and CLAUDE.md, then start implementing the P0 features.
```

---

## Context

You are working on FIREKaro-Vue Liabilities enhancements (Vue 3 + Vuetify 3 + Hono backend).

- **Project**: D:\Abhay\VibeCoding\FIREKaro-Worktrees\FIREKARO-VUE-Liabilities
- **Branch**: feature/liabilities-enhancements
- **Run**: `npm run dev` (frontend 5173 + backend 3000)

## Section Details

- **Section**: `/dashboard/liabilities/*`
- **Composable**: `src/composables/useLiabilities.ts`
- **Routes**: `server/routes/loans.ts`, `credit-cards.ts`, `liabilities.ts`, `liabilities-reports.ts`
- **Components**: `src/components/liabilities/`
- **Existing**: `AmortizationTable.vue`

## P0 Features to Implement

### 1. Prepayment Calculator
- Impact on tenure vs EMI
- Interest savings calculation
- Optimal prepayment amount
- New amortization schedule preview

**Files to create:**
- `server/services/prepayment.service.ts`
- `server/routes/loan-analytics.ts`
- `src/components/liabilities/PrepaymentCalculator.vue`

### 2. Balance Transfer Analyzer
- Compare offers from banks
- Break-even analysis
- Processing fee impact
- Total cost comparison

**Files to create:**
- `server/services/balance-transfer.service.ts`
- `src/components/liabilities/BalanceTransferAnalyzer.vue`

### 3. EMI Calendar
- All EMIs in calendar view
- Payment reminders
- Cash flow impact visualization

**Files to create:**
- `src/components/liabilities/EMICalendar.vue`

## P1 Features (After P0)

4. **Loan Comparison Tool** - Compare offers, total cost analysis
5. **Credit Score Integration** - Track score, improvement tips
6. **Refinancing Alerts** - Rate drop alerts, savings potential

## Development Guidelines

1. **Read CLAUDE.md first** for project patterns and conventions
2. **Use Indian home loan norms** (monthly compounding)
3. **Build on existing** `AmortizationTable.vue` patterns
4. **Commit convention**: `git commit -m "feat(liabilities): description"`
5. **Run tests**: `npm run test:e2e -- e2e/tests/liabilities/`

## Start Here

Begin with Prepayment Calculator:
1. Create the prepayment service with calculation logic
2. Add API endpoint: `POST /api/loans/:id/prepayment-analysis`
3. Create Vue component with:
   - Prepayment amount input
   - Option: Reduce EMI vs Reduce Tenure
   - Before/After comparison table
   - Interest savings highlight
4. Calculate: total interest saved, new tenure/EMI, months saved
