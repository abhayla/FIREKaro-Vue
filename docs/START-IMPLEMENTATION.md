# Stream 1: Start Implementation Prompt

> Copy and paste this prompt into the Claude Code session for FIREKaro-Vue-S1

---

## Implementation Prompt

```
I'm implementing Stream 1 of FIREKaro Vue 3 SPA migration.

## Context
- Directory: FIREKaro-Vue-S1
- Branch: feature/vue-income-tax
- Sections: Salary (3d) + Non-Salary Income (5d) + Tax Planning (4d)

## Before Starting
Read these files for context:
1. CLAUDE.md - Project overview and API endpoints
2. docs/STYLING-GUIDE.md - Theme colors, fonts, chart configuration
3. docs/Salary-Section-Plan.md - Detailed salary requirements

## Styling Requirements (MUST FOLLOW)
- Use Inter font for text, JetBrains Mono for numbers (already configured in main.css)
- Use `formatINR()` helper for all currency display
- Use `text-currency` class for monetary values in templates
- Import chart theme from `@/utils/chartTheme` for all Chart.js charts
- Use Vuetify color props (color="primary") not inline styles
- Use CSS variables for financial colors (see docs/STYLING-GUIDE.md)
- For positive/negative values use `text-positive` / `text-negative` classes

## Implementation Order
1. Create `src/composables/useSalary.ts` - Vue Query hooks for salary APIs
2. Create `src/components/salary/` components:
   - SalaryBreakdownCard.vue
   - SalaryHistoryTable.vue
   - SalaryHistoryForm.vue
   - SalaryChart.vue (use chartTheme)
3. Update `src/pages/dashboard/salary/` pages (replace stubs)
4. Then repeat for Non-Salary Income section
5. Finally Tax Planning section (depends on Income data)

## API Endpoints
- GET /api/salary/current
- GET/POST/PUT/DELETE /api/salary-history

## Start Now
Begin with `useSalary.ts` composable, then implement the Salary section pages.
After each major component, commit: `git commit -m "feat(salary): description"`
```

---

## Quick Reference

### Files to Create
```
src/composables/useSalary.ts
src/composables/useIncome.ts
src/composables/useTax.ts
src/components/salary/*.vue
src/components/income/*.vue
src/components/tax/*.vue
```

### Key Imports
```typescript
// Chart theme
import { chartColors, lineChartOptions, formatINRForChart } from '@/utils/chartTheme'

// INR formatting
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
```

### When Done
Run: `Read docs/POST-IMPLEMENTATION.md` for merge instructions.
