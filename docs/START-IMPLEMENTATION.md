# Stream 3: Start Implementation Prompt

> Copy and paste this prompt into the Claude Code session for FIREKaro-Vue-S3

---

## Implementation Prompt

```
I'm implementing Stream 3 of FIREKaro Vue 3 SPA migration.

## Context
- Directory: FIREKaro-Vue-S3
- Branch: feature/vue-investments-liabilities
- Sections: Investments (3.5d) + Liabilities (2.5d)

## Before Starting
Read these files for context:
1. CLAUDE.md - Project overview and API endpoints
2. docs/STYLING-GUIDE.md - Theme colors, fonts, chart configuration
3. docs/Investments-Section-Plan.md - Detailed investments requirements

## Styling Requirements (MUST FOLLOW)
- Use Inter font for text, JetBrains Mono for numbers (already configured in main.css)
- Use `formatINR()` helper for all currency display
- Use `text-currency` class for monetary values in templates
- Import chart theme from `@/utils/chartTheme` for all Chart.js charts
- Use `createAssetAllocationDataset()` for portfolio allocation charts
- Use asset class colors: `chartColors.assetClasses.equity`, `.debt`, `.gold`, `.retirement`, etc.
- Use CSS classes: `.asset-equity`, `.asset-debt`, `.asset-gold`, `.asset-retirement`
- For positive/negative returns use `text-positive` / `text-negative` classes

## Implementation Order
1. Create `src/composables/useInvestments.ts` - Vue Query hooks for investment APIs
2. Create `src/components/investments/` components:
   - PortfolioAllocationChart.vue (use createAssetAllocationDataset + doughnutChartOptions)
   - AssetCard.vue
   - EPFCalculator.vue
   - PPFTracker.vue
   - NPSCalculator.vue
   - ReturnsChart.vue (use lineChartOptions)
3. Update `src/pages/dashboard/investments/` pages (replace stubs)
4. Then create Liabilities section composables and components
5. Implement debt payoff strategies with visualization

## API Endpoints
- GET/POST /api/investments
- GET /api/portfolio
- GET/POST /api/epf, /api/ppf, /api/nps
- GET/POST /api/loans, /api/credit-cards

## Start Now
Begin with `useInvestments.ts` composable, then implement the Investments section pages.
After each major component, commit: `git commit -m "feat(investments): description"`
```

---

## Quick Reference

### Files to Create
```
src/composables/useInvestments.ts
src/composables/useLiabilities.ts
src/components/investments/*.vue
src/components/liabilities/*.vue
```

### Asset Allocation Chart Example
```typescript
import { Doughnut } from 'vue-chartjs'
import { createAssetAllocationDataset, doughnutChartOptions } from '@/utils/chartTheme'

const chartData = createAssetAllocationDataset({
  equity: 500000,     // Stocks, MF
  debt: 300000,       // Bonds, FD
  gold: 100000,
  retirement: 400000, // EPF, PPF, NPS
  realEstate: 2000000
})
```

### Asset Class Colors
```typescript
import { chartColors } from '@/utils/chartTheme'

chartColors.assetClasses.equity      // #1976d2 - Blue
chartColors.assetClasses.debt        // #7cb342 - Green
chartColors.assetClasses.gold        // #ffc107 - Gold
chartColors.assetClasses.retirement  // #00acc1 - Cyan
chartColors.assetClasses.realEstate  // #8d6e63 - Brown
```

### When Done
Run: `Read docs/POST-IMPLEMENTATION.md` for merge instructions.
