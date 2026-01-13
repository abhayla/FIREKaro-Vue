# Expenses Stream - Enhancement Prompt

## Quick Start
```
Read STREAM-PROMPT.md and CLAUDE.md, then start implementing the P0 features.
```

---

## Context

You are working on FIREKaro-Vue Expenses enhancements (Vue 3 + Vuetify 3 + Hono backend).

- **Project**: D:\Abhay\VibeCoding\FIREKaro-Worktrees\FIREKARO-VUE-Expenses
- **Branch**: feature/expenses-enhancements
- **Run**: `npm run dev` (frontend 5173 + backend 3000)

## Section Details

- **Section**: `/dashboard/expenses/*`
- **Composable**: `src/composables/useExpenses.ts`
- **Routes**: `server/routes/expenses.ts`, `budgets.ts`, `expenses-ai.ts`, `expense-rules.ts`
- **Components**: `src/components/expenses/`
- **Charts**: `CategoryPieChart.vue`, `MonthlyTrendChart.vue`

## P0 Features to Implement

### 1. Smart Receipt Scanner
- OCR for receipt images
- Auto-extract amount, date, merchant
- Category suggestion based on merchant

**Files to create:**
- `server/services/ocr.service.ts`
- `server/routes/receipts.ts`
- `src/components/expenses/SmartReceiptScanner.vue`

### 2. Spending Insights
- Month-over-month comparison
- Category trend analysis
- Unusual spending alerts
- Top 5 spending categories with % change

**Files to create:**
- `server/routes/expenses-insights.ts`
- `src/components/expenses/SpendingInsights.vue`

### 3. Budget Forecasting
- Predict month-end spending
- Seasonal adjustment
- Budget recommendation
- Spending velocity chart

**Files to create:**
- `server/services/expense-forecast.service.ts`
- `src/components/expenses/BudgetForecast.vue`

## P1 Features (After P0)

4. **Split Expenses** - Split with family, settlement tracking
5. **Recurring Expense Detection** - Auto-detect subscriptions, renewal reminders
6. **Export & Reports** - PDF reports, tax-deductible summary

## Development Guidelines

1. **Read CLAUDE.md first** for project patterns and conventions
2. **Use Chart.js** for visualizations with existing chart theme
3. **Follow existing patterns** in `src/components/expenses/`
4. **Commit convention**: `git commit -m "feat(expenses): description"`
5. **Run tests**: `npm run test:e2e -- e2e/tests/expenses/`

## Start Here

Begin with Spending Insights:
1. Create the insights API route with trends/anomalies/forecast endpoints
2. Create the Vue component with comparison charts
3. Add insights card to expenses index page
4. Support date range filtering
