# FIRE & Goals Section Documentation

## Overview

The FIRE (Financial Independence, Retire Early) & Goals section provides comprehensive tools for tracking your journey to financial independence. This documentation covers the restructured 2-tab layout, features, and technical implementation.

## Architecture

### Structure Change (January 2026)

**Previous Structure (6 pages at `/dashboard/fire-goals/*`):**
- `/dashboard/fire-goals` - Dashboard
- `/dashboard/fire-goals/calculators` - Calculators
- `/dashboard/fire-goals/goals` - Goals CRUD
- `/dashboard/fire-goals/projections` - Projections
- `/dashboard/fire-goals/withdrawal` - Withdrawal strategies
- `/dashboard/fire-goals/reports` - Reports

**New Structure (2 tabs at `/fire-goals`):**
- `/fire-goals` (or `?tab=overview`) - Overview Tab
- `/fire-goals?tab=planning` - Planning Tab

> **Note:** URL changed from `/dashboard/fire-goals` to `/fire-goals` as a top-level route. All legacy URLs redirect to the new location.

### Design Principles

1. **Progressive Disclosure**: Information is organized from high-level metrics (Overview) to detailed tools (Planning)
2. **URL-based Tab State**: Tabs sync with URL query params for bookmarking and sharing
3. **Accordion-based Organization**: Planning tools grouped in collapsible sections
4. **Mobile-first Responsive Design**: Works seamlessly on all screen sizes

## Tab 1: Overview

The Overview tab provides a read-only summary of your FIRE journey.

### Primary Metrics (4 cards)

| Metric | Description | Icon |
|--------|-------------|------|
| **FIRE Number** | Target corpus needed for financial independence | `mdi-fire` |
| **Current Corpus** | Your current investment portfolio value | `mdi-piggy-bank` |
| **Progress** | Percentage progress toward FIRE Number | `mdi-chart-arc` |
| **Time to FIRE** | Estimated years and months until FI | `mdi-timer-sand` |

### Secondary Metrics (4 cards)

| Metric | Description | Icon |
|--------|-------------|------|
| **Savings Rate** | Monthly savings as percentage of income | `mdi-percent` |
| **Monthly Passive** | Potential passive income at 4% SWR | `mdi-cash-sync` |
| **Lean FIRE** | Conservative FIRE target (50% expenses) | `mdi-fire-circle` |
| **Fat FIRE** | Comfortable FIRE target (150% expenses) | `mdi-fire` |

### Visualizations

1. **Freedom Score Card**: A gauge showing how much of your expenses are covered by passive income
2. **Crossover Point Chart**: Timeline chart showing when passive income exceeds expenses
3. **Milestone Bar**: Progress visualization showing 25%, 50%, 75%, 100% FIRE milestones
4. **Expense Coverage Grid**: Breakdown of expense categories and their coverage status

### Quick Actions

Links to Planning tab sections:
- FIRE Calculator
- Set a Goal
- View Projections
- Withdrawal Strategy

### FIRE Tip of the Day

Motivational tips with actionable challenges (e.g., "The Power of 1% More" savings challenge)

## Tab 2: Planning

The Planning tab contains interactive tools organized in accordion sections.

### Accordion Sections

#### 1. Goals (Expanded by Default)

**Summary Stats:**
- Total Goals count
- Completed Goals count
- Total Target Amount
- Saved So Far

**Features:**
- Add Goal button → Opens GoalForm dialog
- Status Filter (On Track, At Risk, Off Track, Completed)
- Category Filter (Essential, Lifestyle, Legacy)
- Goal cards with progress indicators
- Edit, Delete, View Details actions
- Empty state with CTA for first-time users

#### 2. Calculators (Collapsed)

**Calculator Tabs:**

| Calculator | Purpose | Inputs |
|------------|---------|--------|
| **FIRE Number** | Calculate target corpus | Monthly expenses, withdrawal rate, inflation |
| **Retirement Date** | Calculate when you can retire | Current age, corpus, savings, target |
| **SIP Calculator** | Calculate required SIP for goal | Goal amount, years, expected returns |
| **Monte Carlo** | Simulate success probability | Uses current portfolio data |

#### 3. Projections (Collapsed)

**Projection Views:**

| View | Description |
|------|-------------|
| **100-Year Projection** | Long-term corpus growth chart with life events |
| **Monte Carlo** | 10th, 50th, 90th percentile outcomes |
| **Sensitivity Analysis** | Impact of variable changes on FIRE timeline |

**Sensitivity Variables:**
- Returns -2%
- Inflation +2%
- Expenses +20%
- SIP -25%
- Healthcare +50K/yr
- Inheritance +20L

#### 4. Withdrawal Planning (Collapsed)

**Withdrawal Strategies:**

| Strategy | Initial Rate | Best For |
|----------|--------------|----------|
| **4% Rule** | 4.0% | Simplicity seekers |
| **Bucket Strategy** | 4.0% | Risk-averse investors |
| **VPW** | Variable | Flexible spenders |
| **Guyton-Klinger** | 5.2% | Maximizers |

**SWR Calculator Table:**
Shows corpus required and success rate for 3.0% to 5.0% SWR

**India-specific Note:**
Due to higher inflation (6-7%), 3-3.5% SWR recommended for Indian FIRE

## Technical Implementation

### File Structure

```
src/
├── pages/dashboard/fire-goals/
│   └── index.vue                # Main page with tab navigation
├── components/fire/
│   ├── FIREOverviewTab.vue      # Overview tab content
│   ├── FIREPlanningTab.vue      # Planning tab with accordions
│   ├── FreedomScoreCard.vue     # Freedom score gauge
│   ├── CrossoverPointChart.vue  # Crossover timeline chart
│   ├── ExpenseCoverageGrid.vue  # Expense coverage breakdown
│   ├── FIREMilestoneBar.vue     # Progress milestones
│   ├── GoalCard.vue             # Individual goal with milestone celebrations
│   ├── GoalForm.vue             # Goal create/edit dialog
│   ├── FIRECalculator.vue       # FIRE number calculator
│   ├── MonteCarloChart.vue      # Monte Carlo simulation (10,000 runs)
│   ├── ProjectionChart.vue      # 100-year projection with life events
│   └── WithdrawalStrategySelector.vue  # Strategy comparison
├── composables/
│   └── useFIRE.ts               # All FIRE-related Vue Query hooks

server/routes/
├── fire-metrics.ts              # GET /api/fire/metrics - FIRE calculations
├── fire-freedom-score.ts        # GET /api/fire/freedom-score - Freedom score
├── fire-crossover.ts            # GET /api/fire/crossover - Crossover point
├── fire-expense-coverage.ts     # GET /api/fire/expense-coverage - Expense coverage
├── fire-projections.ts          # GET /api/fire/projections - 100-year projections
├── fire-monte-carlo.ts          # GET /api/fire/monte-carlo - Monte Carlo simulation
├── fire-export.ts               # GET /api/fire/export - Export data for PDF/Excel
├── goals.ts                     # CRUD /api/goals - Financial goals with milestones
└── withdrawal-strategy.ts       # GET/PUT /api/withdrawal-strategy - Withdrawal preferences
```

### URL Routing Pattern

```typescript
// Tab state synced with URL query params
const activeTab = computed({
  get: () => (route.query.tab as string) || 'overview',
  set: (tab: string) => {
    router.push({
      query: { ...route.query, tab: tab === 'overview' ? undefined : tab }
    })
  }
})
```

### Accordion State Management

```typescript
// Goals expanded by default
const expandedSections = ref<string[]>(['goals'])

function expandAll() {
  expandedSections.value = ['goals', 'calculators', 'projections', 'withdrawal']
}

function collapseAll() {
  expandedSections.value = []
}
```

### Data Composables

| Composable | Purpose |
|------------|---------|
| `useFIREMetrics()` | Fetch all FIRE metrics (variants, progress, years to FIRE) |
| `useFreedomScore()` | Fetch freedom score with domain breakdown |
| `useCrossoverPoint()` | Fetch crossover point data with chart data |
| `useExpenseCoverage()` | Fetch expense coverage by category |
| `useFIREProjections()` | Fetch 100-year projection with life events |
| `useMonteCarlo()` | Fetch Monte Carlo simulation (10,000 runs) |
| `useGoals()` | Fetch user goals with milestones |
| `useGoal(id)` | Fetch single goal |
| `useGoalMilestones(id)` | Fetch goal milestones |
| `useGoalInsight(id)` | Fetch AI-driven goal insight |
| `useCreateGoal()` | Create goal mutation (auto-creates milestones) |
| `useUpdateGoal()` | Update goal mutation |
| `useDeleteGoal()` | Delete goal mutation |
| `useUpdateGoalProgress()` | Update goal progress (triggers milestone checks) |
| `useWithdrawalStrategyPrefs()` | Fetch withdrawal strategy preferences |
| `useUpdateWithdrawalStrategy()` | Update withdrawal strategy mutation |
| `useWithdrawalStrategyComparison()` | Fetch strategy comparison data |
| `useFIREExport(format)` | Export FIRE data for PDF/Excel generation |

## Legacy URL Redirects

Old URLs automatically redirect to the new structure:

| Old URL | Redirect To |
|---------|------------|
| `/dashboard/fire-goals` | `/fire-goals` |
| `/dashboard/fire-goals/calculators` | `/fire-goals?tab=planning` |
| `/dashboard/fire-goals/goals` | `/fire-goals?tab=planning` |
| `/dashboard/fire-goals/projections` | `/fire-goals?tab=planning` |
| `/dashboard/fire-goals/withdrawal` | `/fire-goals?tab=planning` |
| `/dashboard/fire-goals/reports` | `/fire-goals` |

Additionally, new `/fire-goals/*` sub-paths also redirect:

| URL | Redirect To |
|-----|------------|
| `/fire-goals/calculators` | `/fire-goals?tab=planning` |
| `/fire-goals/goals` | `/fire-goals?tab=planning` |
| `/fire-goals/projections` | `/fire-goals?tab=planning` |
| `/fire-goals/withdrawal` | `/fire-goals?tab=planning` |

## E2E Testing

### Test Files

| File | Coverage |
|------|----------|
| `01-navigation.spec.ts` | Tab navigation, URL sync, legacy redirects |
| `02-fire-dashboard.spec.ts` | Overview tab metrics, charts, export |
| `03-calculators.spec.ts` | Calculator tabs, FIRE/SIP/Retirement calculations |
| `04-goals-crud.spec.ts` | Goals CRUD, filters, expand/collapse |
| `05-projections.spec.ts` | Projection chart, Monte Carlo, sensitivity |
| `06-withdrawal.spec.ts` | Withdrawal strategies, SWR calculator |

### Page Objects

```typescript
// FIREDashboardPage - Overview tab
class FIREDashboardPage {
  navigateToOverview()
  expectOverviewTabActive()
  switchToPlanningTab()
  getFIRENumber()
  getCurrentCorpus()
  getProgress()
}

// FIREPlanningPage - Planning tab
class FIREPlanningPage {
  navigateTo()
  expectPageLoaded()
  expandGoalsSection()
  expandCalculatorsSection()
  expandProjectionsSection()
  expandWithdrawalSection()
  expandAllSections()
  collapseAllSections()
  openAddGoalForm()
}
```

## Accessibility

- **Keyboard Navigation**: Tab through all interactive elements
- **ARIA Labels**: Proper labels on tabs, accordions, buttons
- **Focus Management**: Visible focus rings on all controls
- **Screen Reader**: Announces tab changes and accordion state
- **Reduced Motion**: Respects `prefers-reduced-motion`

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| **xs** (< 600px) | Single column, stacked cards |
| **sm** (600-960px) | 2 columns for metrics |
| **md** (960-1264px) | 4 columns primary, 2 columns secondary |
| **lg+** (> 1264px) | Full 4-column layout |

## Export Functionality

Export menu in header provides:
- **PDF Export**: Full FIRE report with charts
- **Excel Export**: Data tables for calculations

## FIRE Calculations

### FIRE Number Formula

```
FIRE Number = Annual Expenses × (100 / SWR%)
```

Example: ₹12L annual expenses × 25 (4% SWR) = ₹3 Cr FIRE Number

### FIRE Variations

| Type | Multiplier | Description |
|------|------------|-------------|
| **Lean FIRE** | 50% expenses × 25 | Minimal lifestyle |
| **Regular FIRE** | 100% expenses × 25 | Current lifestyle |
| **Fat FIRE** | 150% expenses × 25 | Enhanced lifestyle |
| **Coast FIRE** | Varies | Amount to coast to FIRE with no more savings |

### Freedom Score

```
Freedom Score = (Current Corpus × SWR%) / Annual Expenses × 100
```

Shows what percentage of expenses could be covered by passive income today.

### Time to FIRE

Calculated using compound interest formula, accounting for:
- Current corpus
- Monthly contributions
- Expected returns
- Target FIRE number

## Best Practices

1. **Start with FIRE Corpus Goal**: Provides overall progress tracking
2. **Use Conservative SWR for India**: 3-3.5% recommended due to higher inflation
3. **Run Monte Carlo Regularly**: Market changes affect success probability
4. **Review Sensitivity Analysis**: Understand key risk factors
5. **Set Multiple Goals**: Break down FIRE into milestone goals

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Metrics show 0 | Check if income/expense data is entered |
| Chart not loading | Refresh page, check network tab |
| Goal not saving | Validate all required fields |
| Tab not switching | Check browser console for errors |

## India-Specific FIRE Considerations

### Safe Withdrawal Rate (SWR)

| Region | Recommended SWR | Reason |
|--------|-----------------|--------|
| **US** | 4.0% | Based on Trinity Study (2.5-3% inflation) |
| **India** | 3.0-3.5% | Higher inflation (6-7%), market volatility |

The app defaults to 3.5% SWR for all calculations.

### Inflation Rates

| Type | Rate | Applied To |
|------|------|------------|
| **General Inflation** | 6% | Regular expenses |
| **Healthcare Inflation** | 8% | Medical expenses (tracked separately) |

### FIRE Targets by Lifestyle (₹ per month expenses → FIRE corpus)

| Monthly Expenses | Lean FIRE | Regular FIRE | Fat FIRE |
|------------------|-----------|--------------|----------|
| ₹50,000 | ~₹86L | ~₹1.7 Cr | ~₹2.6 Cr |
| ₹1,00,000 | ~₹1.7 Cr | ~₹3.4 Cr | ~₹5.1 Cr |
| ₹2,00,000 | ~₹3.4 Cr | ~₹6.9 Cr | ~₹10.3 Cr |

*Based on 3.5% SWR (28.57x multiplier)*

## New Features (January 2026)

### 1. Goal Milestones with Celebrations

Goals now include automatic milestone tracking at 25%, 50%, 75%, and 100%. When a milestone is achieved:
- Confetti animation plays on the GoalCard
- Badge appears with bronze/silver/gold/trophy icons
- Milestone date is recorded for tracking

### 2. FIRE Variants

| Variant | Description | Calculation |
|---------|-------------|-------------|
| **Lean FIRE** | Minimal lifestyle | 60% of current expenses × 28.57 |
| **Regular FIRE** | Current lifestyle | 100% of current expenses × 28.57 |
| **Fat FIRE** | Enhanced lifestyle | 150% of current expenses × 28.57 |
| **Coast FIRE** | Stop saving, let compound interest work | Complex formula based on age |
| **Barista FIRE** | Semi-retirement with part-time income | Corpus covers 50% of expenses |

### 3. Withdrawal Strategies

| Strategy | Initial Rate | Flexibility | Best For |
|----------|--------------|-------------|----------|
| **4% Rule** | 4.0% | Low | Simplicity seekers |
| **Custom SWR** | 3-5% | Medium | Control seekers (3.5% for India) |
| **Bucket Strategy** | 4.0% | Medium | Risk-averse investors |
| **VPW** | Variable by age | High | Flexible spenders |
| **Guyton-Klinger** | 4.5-5.2% | High | Maximizers (±20% guardrails) |

### 4. Monte Carlo Simulation

- 10,000 simulation runs for statistical significance
- Shows success rate (percentage of scenarios where corpus lasts 30 years)
- Percentile distribution: P10, P25, P50, P75, P90
- Scenario samples: Worst, Poor, Median, Good, Best outcomes

### 5. 100-Year Projections

- Year-by-year corpus projection from current age to 100
- Includes life events (children's education, wedding, healthcare costs)
- Separate tracking for healthcare inflation (8% vs 6% general)
- Sensitivity analysis for key variables

### 6. Export Functionality

| Format | Content |
|--------|---------|
| **PDF** | Full FIRE report with summary, variants, goals, recommendations |
| **Excel** | Multi-sheet workbook: Summary, Goals, Portfolio, Assumptions, Recommendations |

## API Endpoints

### FIRE Metrics

```
GET /api/fire/metrics
```

Returns: FIRE number, variants, progress, savings rate, years to FIRE

### Freedom Score

```
GET /api/fire/freedom-score
```

Returns: Total score (0-100), domain breakdown (Save, Grow, Protect, Ready)

### Crossover Point

```
GET /api/fire/crossover
```

Returns: Months to crossover, target corpus, chart data

### Expense Coverage

```
GET /api/fire/expense-coverage
```

Returns: Category-wise expense coverage status

### Projections

```
GET /api/fire/projections
```

Returns: 100-year projection with life events and sensitivity analysis

### Monte Carlo

```
GET /api/fire/monte-carlo?runs=10000&years=30&refresh=false
```

Returns: Success rate, percentiles, scenario samples

### Goals

```
GET /api/goals                    # List all goals
POST /api/goals                   # Create goal (auto-creates milestones)
GET /api/goals/:id                # Get goal with milestones
PUT /api/goals/:id                # Update goal
DELETE /api/goals/:id             # Delete goal
GET /api/goals/:id/milestones     # Get milestones
POST /api/goals/:id/progress      # Update progress (checks milestones)
GET /api/goals/:id/insight        # Get AI-driven insight
```

### Withdrawal Strategy

```
GET /api/withdrawal-strategy             # Get preferences
PUT /api/withdrawal-strategy             # Update preferences
GET /api/withdrawal-strategy/calculate   # Calculate for current strategy
GET /api/withdrawal-strategy/swr-table   # Get SWR comparison table
```

### Export

```
GET /api/fire/export?format=json|pdf|xlsx
```

Returns: Comprehensive FIRE data for frontend PDF/Excel generation

## Related Documentation

- [FIRE Calculations Guide](./FIRE-Calculations.md)
- [Indian Financial Context](../CLAUDE.md#indian-financial-context)
- [Styling Guide](./STYLING-GUIDE.md)
