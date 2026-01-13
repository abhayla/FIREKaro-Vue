# Insurance Stream - Enhancement Prompt

## Quick Start
```
Read STREAM-PROMPT.md and CLAUDE.md, then start implementing the P0 features.
```

---

## Context

You are working on FIREKaro-Vue Insurance enhancements (Vue 3 + Vuetify 3 + Hono backend).

- **Project**: D:\Abhay\VibeCoding\FIREKaro-Worktrees\FIREKARO-VUE-Insurance
- **Branch**: feature/insurance-enhancements
- **Run**: `npm run dev` (frontend 5173 + backend 3000)

## Section Details

- **Section**: `/dashboard/insurance/*`
- **Composable**: `src/composables/useInsurance.ts`
- **Routes**: `server/routes/insurance.ts`
- **Components**: `src/components/insurance/`
- **Calculator**: `src/pages/dashboard/insurance/calculator.vue`

## P0 Features to Implement

### 1. Policy Document Parser
- Extract key policy details from PDF
- Auto-fill policy form
- Document storage

**Files to create:**
- `server/services/policy-parser.service.ts`
- `server/routes/insurance-analytics.ts`
- `src/components/insurance/PolicyDocParser.vue`

### 2. Coverage Gap Analysis
- Life cover adequacy (HLV method)
- Income replacement method
- Health cover vs medical inflation
- Critical illness gap

**Files to create:**
- `server/services/coverage-analysis.service.ts`
- `src/components/insurance/CoverageGapAnalysis.vue`

### 3. Premium Comparison
- Compare similar policies
- Cost per lakh cover
- Feature comparison matrix

**Files to create:**
- `src/components/insurance/PremiumComparison.vue`

## P1 Features (After P0)

4. **Claim Tracker** - Track status, document checklist
5. **Renewal Manager** - Calendar, auto-renewal tracking
6. **Nominee Management** - Centralized view, update reminders

## Development Guidelines

1. **Read CLAUDE.md first** for project patterns and conventions
2. **Use Indian context** (medical costs, inflation rates)
3. **Consider**: annual income growth, existing liabilities, children's education, retirement gap
4. **Commit convention**: `git commit -m "feat(insurance): description"`
5. **Run tests**: `npm run test:e2e -- e2e/tests/insurance/`

## Start Here

Begin with Coverage Gap Analysis:
1. Create coverage analysis service with HLV calculation
2. Add API endpoint: `GET /api/insurance/coverage-analysis`
3. Create Vue component with:
   - Current coverage summary
   - Recommended coverage by method
   - Gap visualization (gauge chart)
   - Action items for closing gap
4. Health insurance: Compare sum insured vs medical inflation projection
