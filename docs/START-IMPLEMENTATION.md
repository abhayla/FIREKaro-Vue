# Stream 2: Start Implementation Prompt

> Copy and paste this prompt into the Claude Code session for FIREKaro-Vue-S2

---

## Implementation Prompt

```
I'm implementing Stream 2 of FIREKaro Vue 3 SPA migration.

## Context
- Directory: FIREKaro-Vue-S2
- Branch: feature/vue-expenses-protection
- Sections: Expenses (3d) + Protection (2d)

## Before Starting
Read these files for context:
1. CLAUDE.md - Project overview and API endpoints
2. docs/STYLING-GUIDE.md - Theme colors, fonts, chart configuration
3. docs/Expenses-Section-Plan.md - Detailed expenses requirements

## Styling Requirements (MUST FOLLOW)
- Use Inter font for text, JetBrains Mono for numbers (already configured in main.css)
- Use `formatINR()` helper for all currency display
- Use `text-currency` class for monetary values in templates
- Import chart theme from `@/utils/chartTheme` for all Chart.js charts
- Use Vuetify color props (color="primary") not inline styles
- Use CSS variables for financial colors (see docs/STYLING-GUIDE.md)
- For positive/negative values use `text-positive` / `text-negative` classes
- For expense categories, use the chart color palette from chartTheme

## Implementation Order
1. Create `src/composables/useExpenses.ts` - Vue Query hooks for expense APIs
2. Create `src/components/expenses/` components:
   - ExpenseForm.vue
   - ExpenseList.vue
   - BudgetCard.vue
   - CategoryPieChart.vue (use chartTheme with doughnutChartOptions)
   - MonthlyTrendChart.vue (use lineChartOptions)
   - CSVImportModal.vue
3. Update `src/pages/dashboard/expenses/` pages (replace stubs)
4. Then create Protection section composables and components
5. Implement Protection pages including 4-step adequacy wizard

## API Endpoints
- GET/POST/PUT/DELETE /api/expenses
- GET /api/expenses/categories
- GET /api/budgets
- GET/POST /api/insurance

## Start Now
Begin with `useExpenses.ts` composable, then implement the Expenses section pages.
After each major component, commit: `git commit -m "feat(expenses): description"`
```

---

## Quick Reference

### Files to Create
```
src/composables/useExpenses.ts
src/composables/useProtection.ts
src/components/expenses/*.vue
src/components/protection/*.vue
```

### Chart Example (Category Pie Chart)
```typescript
import { Doughnut } from 'vue-chartjs'
import { doughnutChartOptions, chartColors } from '@/utils/chartTheme'

const chartData = {
  labels: ['Food', 'Transport', 'Utilities', 'Entertainment'],
  datasets: [{
    data: [15000, 8000, 5000, 3000],
    backgroundColor: chartColors.primary.slice(0, 4),
    borderWidth: 2,
    borderColor: '#ffffff'
  }]
}
```

### When Done
Run: `Read docs/POST-IMPLEMENTATION.md` for merge instructions.
