# Investments Stream - Enhancement Prompt

## Quick Start
```
Read STREAM-PROMPT.md and CLAUDE.md, then start implementing the P0 features.
```

---

## Context

You are working on FIREKaro-Vue Investments enhancements (Vue 3 + Vuetify 3 + Hono backend).

- **Project**: D:\Abhay\VibeCoding\FIREKaro-Worktrees\FIREKARO-VUE-Investments
- **Branch**: feature/investments-enhancements
- **Run**: `npm run dev` (frontend 5173 + backend 3000)

## Section Details

- **Section**: `/dashboard/investments/*`
- **Composable**: `src/composables/useInvestments.ts`
- **Routes**: `server/routes/investments.ts`, `epf.ts`, `ppf.ts`, `nps.ts`, `esop.ts`, `investment-reports.ts`
- **Components**: `src/components/investments/`
- **Portfolio chart**: `PortfolioAllocationChart.vue`

## P0 Features to Implement

### 1. CAS Statement Import
- Parse CAMS/KFintech CAS PDF
- Auto-create MF holdings
- NAV history tracking

**Files to create:**
- `server/services/cas-parser.service.ts`
- `server/routes/cas-import.ts`
- `src/components/investments/CASImporter.vue`

### 2. XIRR Calculation
- Per-investment XIRR
- Portfolio-level XIRR
- Benchmark comparison (Nifty 50)
- Handle edge cases (negative returns, short periods)

**Files to create:**
- `src/utils/xirr.ts` (Newton-Raphson algorithm)
- `src/utils/xirr.spec.ts` (unit tests)
- `server/routes/investment-analytics.ts`
- `src/components/investments/XIRRDisplay.vue`

### 3. Rebalancing Suggestions
- Target allocation vs current
- Rebalance amount calculator
- Tax-efficient rebalancing recommendations

**Files to create:**
- `src/components/investments/RebalancingWizard.vue`

## P1 Features (After P0)

4. **SIP Tracker** - Calendar view, missed SIP alerts, step-up calculator
5. **Stock Screener Integration** - Basic metrics, dividend history
6. **Goal-Based Investing** - Link investments to goals, progress tracking

## Development Guidelines

1. **Read CLAUDE.md first** for project patterns and conventions
2. **Use existing chart theme** from `src/utils/chartTheme.ts`
3. **Follow Indian investment norms** (NAV, SIP dates, etc.)
4. **Commit convention**: `git commit -m "feat(investments): description"`
5. **Run tests**: `npm run test:e2e -- e2e/tests/investments/`

## Start Here

Begin with XIRR Calculation:
1. Create `src/utils/xirr.ts` with Newton-Raphson algorithm
2. Write unit tests in `src/utils/xirr.spec.ts`
3. Add API endpoints for per-investment and portfolio XIRR
4. Create XIRRDisplay component showing absolute returns + XIRR %
5. Display in investment cards and portfolio overview
