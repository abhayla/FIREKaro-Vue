# Financial Health Section Plan

> **Status**: UI Complete with Tab Restructure
> **Created**: January 11, 2026
> **Last Updated**: January 11, 2026 (Overview/Details Tab Structure Implemented)
> **Related**: Feature-Reorganization-Plan.md

---

## Executive Summary

The **Financial Health** section provides a comprehensive dashboard for monitoring overall financial wellness. It aggregates data from other sections (Salary, Investments, Liabilities, Banking) to provide health scores, net worth tracking, cash flow analysis, and emergency fund monitoring.

### Recent Update: Tab Restructure (January 2026)

The Financial Health section has been restructured to follow the Salary section's pattern with **Overview** and **Details** tabs for improved organization:

| Page | Before | After |
|------|--------|-------|
| **Net Worth** | Single page with all content | Overview + Details tabs |
| **Banking** | Single page with mixed content | Overview + Details tabs |
| **Emergency Fund** | "Current Status" + "Calculator" tabs | Renamed to "Overview" + "Details" |
| **Health Score** | Overview page (unchanged) | No change needed |
| **Cash Flow** | Read-only aggregation (unchanged) | No change needed |
| **Reports** | Utility page (unchanged) | No change needed |

---

## Section Structure

### Pages (6 total)

| Page | Route | Purpose |
|------|-------|---------|
| Health Score | `/financial-health` | Overall financial health score & factors |
| Net Worth | `/financial-health/net-worth` | Assets, liabilities, milestones |
| Cash Flow | `/financial-health/cash-flow` | Income vs expenses analysis |
| Banking | `/financial-health/banking` | Bank accounts & FD management |
| Emergency Fund | `/financial-health/emergency-fund` | Emergency fund progress & calculator |
| Reports | `/financial-health/reports` | Report generation |

---

## Page Details

### 1. Health Score (index.vue)

**Purpose**: Aggregated financial health overview with scoring system

**Content**:
- Health Score Card (0-100 score with gauge visualization)
- Health Factors List (individual scores for each factor)
- Key Metrics Summary (Net Worth, Savings Rate, DTI, Emergency Fund)
- Alerts & Recommendations

**No tabs needed** - This is already an overview/aggregation page.

---

### 2. Net Worth (net-worth.vue)

**Tab Structure**: Overview | Details

#### Overview Tab
- **Summary Cards Row**
  - Total Net Worth (with yearly change %)
  - Monthly Change (amount + %)
  - Yearly Change (amount + %)
- **Net Worth Trend Chart** (12-month line chart)
- **Asset/Liability Breakdown** (NetWorthBreakdown component)

#### Details Tab
- **Net Worth Milestones** (NetWorthMilestones component)
  - List of user-defined milestones
  - Progress tracking per milestone
  - Add/Edit/Delete milestone dialogs

**Implementation Pattern**:
```vue
<script setup lang="ts">
import { ref } from 'vue'
const activeTab = ref('overview')
</script>

<template>
  <v-tabs v-model="activeTab" color="primary" class="mb-4">
    <v-tab value="overview">
      <v-icon icon="mdi-chart-box" size="small" class="mr-2" />
      Overview
    </v-tab>
    <v-tab value="details">
      <v-icon icon="mdi-flag-checkered" size="small" class="mr-2" />
      Details
    </v-tab>
  </v-tabs>

  <v-window v-model="activeTab">
    <v-window-item value="overview">
      <!-- Summary, Chart, Breakdown -->
    </v-window-item>
    <v-window-item value="details">
      <!-- Milestones -->
    </v-window-item>
  </v-window>
</template>
```

---

### 3. Banking (banking.vue)

**Tab Structure**: Overview | Details

#### Overview Tab
- **Summary Cards Row**
  - Total Balance (across all accounts)
  - Active Accounts count
  - Fixed Deposits count (with total value)
- **Quick Insights**
  - Average balance per account
  - Highest balance account
  - Upcoming FD maturities

#### Details Tab
- **Account Management Header** ("Your Accounts" + Add Account button)
- **Account Lists by Type**
  - Savings & Current Accounts (v-card list)
  - Fixed Deposits & Recurring Deposits (v-card list)
- **CRUD Dialogs**
  - BankAccountForm for add/edit
  - Delete confirmation dialog

---

### 4. Emergency Fund (emergency-fund.vue)

**Tab Structure**: Overview | Details

> **Note**: Tabs were renamed from "Current Status"/"Calculator" to "Overview"/"Details" for consistency.

#### Overview Tab
- **Progress Cards**
  - Target Amount (based on monthly expenses × target months)
  - Current Amount (linked to designated bank account)
  - Months Covered
- **Progress Bar** (visual gauge)
- **Recommendation Card** (action items)

#### Details Tab
- **Emergency Fund Calculator**
  - Monthly expenses input
  - Target months slider (3-12 months)
  - Calculation results
- **Contribution Planner**
  - Monthly contribution suggestions
  - Time-to-goal projections

---

### 5. Cash Flow (cash-flow.vue)

**No tabs needed** - Read-only aggregation page

**Content**:
- Summary Cards (Total Income, Total Expenses, Net Cash Flow)
- Savings Rate display
- Income Breakdown (by source)
- Expenses Breakdown (by category)
- Cash Flow Chart (monthly trend)
- Passive Income Summary section

---

### 6. Reports (reports.vue)

**No tabs needed** - Utility page

**Content**:
- Report Type Selection
- Date Range Picker
- Generate Report button
- Report Preview/Download

---

## Frontend Implementation

### Vue Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SectionHeader.vue` | `src/components/shared/` | Page header with navigation tabs |
| `NetWorthChart.vue` | `src/components/financial-health/` | 12-month trend line chart |
| `NetWorthBreakdown.vue` | `src/components/financial-health/` | Asset/Liability breakdown |
| `NetWorthMilestones.vue` | `src/components/financial-health/` | Milestone management |
| `BankAccountForm.vue` | `src/components/banking/` | Bank account add/edit form |
| `HealthScoreGauge.vue` | `src/components/financial-health/` | Circular gauge visualization |
| `HealthFactorCard.vue` | `src/components/financial-health/` | Individual factor display |

### Composables

| Composable | Location | Features |
|------------|----------|----------|
| `useFinancialHealth` | `src/composables/useFinancialHealth.ts` | Health score, net worth, cash flow |
| `useMilestones` | `src/composables/useMilestones.ts` | Milestone CRUD operations |
| `useBanking` | `src/composables/useBanking.ts` | Bank account management |

---

## API Endpoints

### Net Worth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/financial-health/net-worth` | GET | Net worth summary with history |
| `/api/financial-health/net-worth/milestones` | GET | List milestones |
| `/api/financial-health/net-worth/milestones` | POST | Create milestone |
| `/api/financial-health/net-worth/milestones/:id` | PUT | Update milestone |
| `/api/financial-health/net-worth/milestones/:id` | DELETE | Delete milestone |

### Banking
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bank-accounts` | GET | List bank accounts |
| `/api/bank-accounts` | POST | Create bank account |
| `/api/bank-accounts/:id` | PUT | Update bank account |
| `/api/bank-accounts/:id` | DELETE | Delete bank account |

### Emergency Fund
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/financial-health/emergency-fund` | GET | Emergency fund status |
| `/api/financial-health/emergency-fund/settings` | PUT | Update target settings |

### Health Score
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/financial-health/score` | GET | Overall health score with factors |
| `/api/financial-health/alerts` | GET | Active alerts/recommendations |

---

## E2E Tests

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `01-navigation.spec.ts` | 17 | Navigation, tab visibility, tab switching |
| `02-health-score.spec.ts` | 12 | Health score display, factors, alerts |
| `03-net-worth.spec.ts` | 12 | Net worth display, tabs, cards |
| `04-cash-flow.spec.ts` | 10 | Cash flow display, breakdowns |
| `05-emergency-fund.spec.ts` | 11 | Emergency fund, tabs, progress |
| `06-net-worth-milestones.spec.ts` | 11 | Milestone CRUD operations |
| `07-passive-income-summary.spec.ts` | 10 | Passive income aggregation |

### Page Objects

Location: `e2e/pages/financial-health/index.ts`

**Key Classes**:
- `FinancialHealthOverviewPage` - Health Score page
- `NetWorthPage` - Net Worth with internal tabs
- `CashFlowPage` - Cash Flow page
- `BankingPage` - Banking with internal tabs
- `EmergencyFundPage` - Emergency Fund with internal tabs

**Internal Tab Pattern**:
```typescript
// For pages with internal tabs (Net Worth, Banking, Emergency Fund)
get internalTablist(): Locator {
  return this.page.locator('[role="tablist"]').nth(1);
}

get overviewTab(): Locator {
  return this.internalTablist.getByRole("tab", { name: /Overview/i });
}

get detailsTab(): Locator {
  return this.internalTablist.getByRole("tab", { name: /Details/i });
}

async navigateToDetailsTab(): Promise<void> {
  await this.detailsTab.click();
  await this.page.waitForTimeout(300);
}
```

---

## Health Score Calculation

The health score is calculated from weighted factors:

| Factor | Weight | Score Range | Calculation |
|--------|--------|-------------|-------------|
| Emergency Fund | 25% | 0-25 | `(currentFund / targetFund) * 25` |
| Savings Rate | 25% | 0-25 | `(savingsRate / 30) * 25` (30% = max) |
| Debt-to-Income | 20% | 0-20 | `(1 - DTI/0.4) * 20` (40% = threshold) |
| Insurance Coverage | 15% | 0-15 | Based on HLV coverage % |
| Investment Diversity | 15% | 0-15 | Based on asset allocation |

**Total Score**: 0-100 (sum of weighted factors)

**Score Ranges**:
- 80-100: Excellent (green)
- 60-79: Good (light green)
- 40-59: Fair (yellow)
- 20-39: Needs Work (orange)
- 0-19: Critical (red)

---

## Configuration

### Playwright Config (playwright.config.ts)

```typescript
// Port 5180 for this worktree (to avoid conflicts with other worktrees)
use: {
  baseURL: 'http://localhost:5180',
},
webServer: {
  command: 'npm run dev:frontend -- --port 5180',
  port: 5180,
},
```

---

## Future Enhancements

1. **Net Worth History Export** - Export net worth history as CSV/PDF
2. **Goal-based Tracking** - Link milestones to FIRE goals
3. **Automated Alerts** - Push notifications for milestone progress
4. **Bank Account Sync** - Integration with account aggregators
5. **Cash Flow Forecasting** - ML-based expense predictions

---

## Related Documentation

- [Salary Section Plan](./Salary-Section-Plan.md) - Reference for tab structure pattern
- [STYLING-GUIDE.md](./STYLING-GUIDE.md) - UI patterns and Vuetify conventions
- [CLAUDE.md](../CLAUDE.md) - Project overview and development guidelines
