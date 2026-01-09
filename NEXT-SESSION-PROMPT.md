# FIREKaro Vue 3 - Session Continuation Prompt

> **Last Updated**: January 9, 2026
> **Last Session Focus**: Session management setup + styling audit review
> **Branch**: master

---

## Quick Start

Copy this entire file and paste it as your first message in a new Claude Code session, then run:

```
/project:start-session
```

Or for a specific task:
```
/project:start-session Fix the Expenses page JS error
```

---

## Session Summary

### What Was Done
- Reviewed styling audit report (docs/STYLING-AUDIT-REPORT.md)
- Created session management system with custom slash commands
- Updated CLAUDE.md with current status section
- Identified critical JS errors across multiple pages

### What's In Progress
- Multiple pages have JS errors preventing rendering (Expenses, Investments, Tax Planning)
- API 404 errors in Financial Health, Non-Salary Income, Protection sections
- Several files have uncommitted changes that need review

### Issues Encountered
- **Expenses page**: `expensesQuery.data.value?.reduce is not a function`
- **Investments page**: `Cannot read properties of undefined (reading 'toFixed')`
- **Tax Planning**: `Cannot read properties of undefined (reading 'length')`
- **Financial Health**: API 404 errors - backend routes missing
- **FIRE & Goals**: "Time to FIRE" displays "NaNy NaNm"

---

## Current Project State

### Git Status
```
 M CLAUDE.md
 M package-lock.json
 M package.json
 M src/components/investments/AssetForm.vue
 M src/components/salary/SalaryHistoryForm.vue
 M src/components/salary/SalaryHistoryTable.vue
 M src/composables/useFinancialHealth.ts
 M src/composables/useInvestments.ts
 M src/composables/useSalary.ts
 M src/pages/auth/signin.vue
 M src/pages/dashboard/financial-health/cash-flow.vue
 M src/pages/dashboard/financial-health/net-worth.vue
 M src/pages/dashboard/investments/index.vue
 M src/pages/dashboard/investments/reports.vue
 M src/pages/dashboard/salary/history.vue
 M src/pages/dashboard/salary/index.vue
 M src/router/index.ts
 M src/stores/user.ts
 M src/types/salary.ts
?? .claude/commands/
?? docs/STYLING-AUDIT-REPORT.md
?? e2e/
?? playwright.config.ts
?? prisma/
?? server/
?? src/components/financial-health/NetWorthMilestones.vue
?? src/components/financial-health/PassiveIncomeSummary.vue
?? src/components/investments/CompoundingChart.vue
?? src/components/investments/PortfolioJourney.vue
?? src/components/investments/SIPProgressionChart.vue
?? src/components/salary/EmployerCard.vue
?? src/components/salary/SalaryGridCell.vue
?? src/components/salary/SalaryMonthlyGrid.vue
?? src/components/shared/FYMonthHeader.vue
?? src/components/shared/FinancialYearSelector.vue
?? src/components/shared/OpeningBalanceRow.vue
?? src/components/shared/SummaryMetricCards.vue
```

### Recent Commits
```
f7340e4 feat(theme): implement ProjectionLab-inspired theme with theme-adaptive sidebar
e41c2d8 fix(investments,liabilities): complete all pending feature gaps
ecacd80 Merge master (S2+S3+S4) into feature/vue-income-tax (S1)
c33d552 feat(stream1): complete Salary, Non-Salary Income, and Tax Planning sections
51bc682 Merge feature/vue-investments-liabilities: complete Investments and Liabilities sections (S3)
552ce45 Merge pull request #1 from abhayla/feature/vue-health-fire
215caab Merge branch 'master' into feature/vue-health-fire
52e5a83 feat(stream3): complete Investments and Liabilities sections
81ca0f1 feat(stream-4): implement Financial Health and FIRE & Goals sections
e9573d7 feat(stream2): complete Expenses and Protection sections
```

### Build/Type Check Status
**PASS** - TypeScript compilation successful with no errors

---

## Next Session Priorities

### P0 - Must Do First (Critical JS Errors)
1. **Fix Expenses page** - `src/pages/dashboard/expenses/index.vue` - reduce() on undefined
2. **Fix Investments page** - `src/pages/dashboard/investments/index.vue` - toFixed on undefined
3. **Fix Tax Planning** - `src/pages/dashboard/tax-planning/*.vue` - length on undefined
4. **Fix Financial Health APIs** - Backend routes returning 404

### P1 - Should Do
1. Fix "Time to FIRE" NaN calculation in FIRE & Goals
2. Review and commit uncommitted changes
3. Verify all backend API routes are registered in `server/index.ts`

### P2 - Nice to Have
1. Add `text-currency` class to currency values for monospace font
2. Replace "Loading..." text with skeleton loaders
3. Enable export functionality (currently disabled buttons)

---

## Key Files to Review

| File | Reason |
|------|--------|
| `src/composables/useExpenses.ts` | Fix reduce() error - check data initialization |
| `src/composables/useInvestments.ts` | Fix toFixed() error - add null checks |
| `src/composables/useFinancialHealth.ts` | Check API endpoint URLs |
| `src/pages/dashboard/expenses/index.vue` | Expenses page with error |
| `src/pages/dashboard/investments/index.vue` | Investments page with error |
| `server/index.ts` | Verify all routes are registered |
| `server/routes/` | Check for missing API implementations |

---

## Context & Decisions

### Important Decisions Made
- All 4 development streams merged to master (S1: Income/Tax, S2: Expenses/Protection, S3: Investments/Liabilities, S4: Health/FIRE)
- ProjectionLab-inspired theme implemented (light/dark)
- Backend architecture: Hono + Prisma + Better Auth

### Technical Notes
- **Backend**: Hono + Prisma + Better Auth (in `server/` folder) - **NOT Next.js**
- **API Types**: Generated via `openapi-typescript` from `server/openapi/spec.yaml`
- **Data Fetching**: Vue Query hooks in `src/composables/` (use generated types)
- **API Proxy**: `/api/*` → `localhost:3000`
- **Auth Bypass**: Dev mode bypasses auth when no session (see `router/index.ts`)
- **Family View**: Via `uiStore.isFamilyView` and `uiStore.selectedFamilyMemberId`

### Important Reminders
- Do **NOT** reference the old Next.js project (`FIREKaro/`) for API work
- All backend development happens in `server/` folder
- After API changes, regenerate types: `npm run generate:api-types`
- Historical docs may mention Next.js - refer to `CLAUDE.md` for current architecture

### Root Cause Pattern
Most JS errors follow the same pattern:
```typescript
// Problem: Accessing properties before data loads
data.value?.reduce(...)  // fails if data.value is undefined

// Solution: Add proper initialization and guards
const total = computed(() => {
  if (!data.value || !Array.isArray(data.value)) return 0
  return data.value.reduce(...)
})
```

---

## Reference Documentation

| Doc | Purpose |
|-----|---------|
| `CLAUDE.md` | Project instructions, commands, patterns |
| `docs/STYLING-GUIDE.md` | UI component patterns, colors |
| `docs/STYLING-AUDIT-REPORT.md` | Full audit with screenshots |
| `docs/Expenses-Section-Plan.md` | Expenses enhancement roadmap |
| `docs/Protection-Section-Plan.md` | Protection restructure plan |
| `docs/Parallel-Implementation-Guide.md` | Stream architecture |

---

## Session Commands

| Command | Purpose |
|---------|---------|
| `/project:start-session` | Resume from this context |
| `/project:end-session` | Save context before ending |
| `npm run dev` | Start frontend + backend |
| `npm run type-check` | Verify TypeScript |
| `npm run test:e2e` | Run Playwright tests |

---

**End of Session Prompt**

*Use `/project:end-session [description]` before ending your session to update this file.*
