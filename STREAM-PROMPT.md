# Financial Health Stream - Enhancement Prompt

## Quick Start
```
Read STREAM-PROMPT.md and CLAUDE.md, then start implementing the P0 features.
```

---

## Context

You are working on FIREKaro-Vue Financial Health enhancements (Vue 3 + Vuetify 3 + Hono backend).

- **Project**: D:\Abhay\VibeCoding\FIREKaro-Worktrees\FIREKARO-VUE-FinancialHealth
- **Branch**: feature/financial-health-enhancements
- **Run**: `npm run dev` (frontend 5173 + backend 3000)

## Section Details

- **Section**: `/financial-health/*`
- **Composable**: `src/composables/useFinancialHealth.ts`
- **Components**: `src/components/financial-health/`
- **Health score**: `HealthScoreGauge.vue`

## P0 Features to Implement

### 1. Cash Flow Forecasting
- Predict next 3-6 months
- Account for known expenses
- Surplus/deficit projection

**Files to create:**
- `server/services/forecast.service.ts`
- `server/routes/financial-forecast.ts`
- `src/components/financial-health/CashFlowForecast.vue`

### 2. Financial Ratios Dashboard
- Savings Rate: (Income - Expenses) / Income
- Investment Rate: Investments / Income
- Debt-to-Income: Total EMIs / Monthly Income
- Liquidity Ratio: Liquid Assets / Monthly Expenses
- Net Worth to Income: Net Worth / Annual Income

**Files to create:**
- `server/routes/financial-ratios.ts`
- `src/components/financial-health/FinancialRatiosDashboard.vue`

### 3. Net Worth Milestones
- Track milestone achievements
- Historical milestone timeline
- Next milestone projection

**Files to create:**
- `src/components/financial-health/MilestoneTimeline.vue`

## P1 Features (After P0)

4. **Financial Health Score v2** - More factors, peer comparison
5. **Passive Income Tracker** - All sources, growth chart, FIRE crossover
6. **Financial Calendar** - All events, tax deadlines, maturity dates

## Development Guidelines

1. **Read CLAUDE.md first** for project patterns and conventions
2. **Use Indian benchmarks** (e.g., 30% savings rate is good)
3. **Support family view** (combined ratios)
4. **Commit convention**: `git commit -m "feat(financial-health): description"`
5. **Run tests**: `npm run test:e2e -- e2e/tests/financial-health/`

## Start Here

Begin with Financial Ratios Dashboard:
1. Create the ratios API route with historical trends
2. Create Vue component with:
   - Each ratio with gauge visualization
   - Benchmark range (healthy/warning/danger)
   - 6-month trend sparkline
   - Tips to improve each ratio
3. Aggregate into overall financial fitness score
4. Support family view (combined ratios)
