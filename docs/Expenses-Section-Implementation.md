# Expenses Section - Implementation Guide

> **Status**: Fully Implemented
> **Created**: January 11, 2026
> **Last Updated**: January 11, 2026
> **Structure**: Section-level header tabs + internal page tabs

---

## Executive Summary

The Expenses section uses a two-level tab structure:
- **Section-level tabs** (in SectionHeader): Navigate between major pages (Overview, Track, Budgets, Categories, Reports)
- **Page-level tabs** (internal): Switch between Overview/Details within each page

The structure provides:

1. **Overview Page** (`/expenses`) - Landing page with summary cards and quick actions
2. **Track Section** (`/expenses/track`) - Expense tracking with Overview/Expense Details tabs
3. **Budgets Section** (`/expenses/budgets`) - 50/30/20 budget management with Overview/Budget Details tabs
4. **Categories Page** (`/expenses/categories`) - Category management with Rules/Categories tabs
5. **Reports Page** (`/expenses/reports`) - Analytics, charts, and exports

**Note**: Recurring expenses are accessed via the sidebar (`/expenses/recurring`) but not shown in the section header tabs.

---

## URL Structure

| Route | Description |
|-------|-------------|
| `/expenses` | Overview page with Summary Cards, Quick Actions |
| `/expenses/track` | Track section with tabs (Overview + Expense Details) |
| `/expenses/budgets` | Budgets section with tabs (Overview + Budget Details) |
| `/expenses/recurring` | Recurring section with tabs (Overview + Recurring Details) |
| `/expenses/categories` | Categories page with tabs (Rules + Categories) |
| `/expenses/reports` | Reports page with period selectors, charts, exports |

---

## Sidebar Navigation

The Expenses section appears in the sidebar with the following items:
1. Overview
2. Track Expenses
3. Budgets
4. Recurring
5. Categories
6. Reports (always last)

---

## Section Details

### 1. Overview Page (`/expenses`)

The landing page provides an at-a-glance view of expense status and quick access to all sections.

**Section-level header tabs**: Overview, Track, Budgets, Categories, Reports

**Summary Cards:**
| Card | Content |
|------|---------|
| Total Spent | Current month total spending with ₹ format |
| Budget Used | Percentage of budget used (or "No budget set") |
| Top Category | Highest spending category this month |
| Daily Average | Average daily spending |

**Quick Actions:**
- Add Expense
- Set Budget
- Import CSV
- View Reports

**Additional Sections:**
- No Budget Set card (with Create Budget button)
- Spending by Category pie chart
- Recent Expenses list

---

### 2. Track Section (`/expenses/track`)

Two-tab structure for expense tracking and analysis.

#### Overview Tab

| Component | Description |
|-----------|-------------|
| Summary Metrics | Total Expenses, Transaction Count, Avg Transaction, Budget Usage |
| Category Pie Chart | Visual breakdown by category |
| 6-Month Trend Chart | Monthly spending trend |
| Recent Expenses | Last 5-10 expenses quick view |
| Top Expenses | Highest spending items |
| Export Button | Export report data |

#### Expense Details Tab

| Feature | Description |
|---------|-------------|
| Expense List | Full list with search and filters |
| Filters | Month selector, Category filter, Search field |
| Add Expense | Form dialog for new expenses |
| CSV Import | Bulk import from CSV file |
| Receipt Upload | OCR-powered receipt scanning |
| AI Categorization | Automatic category suggestions |
| Bulk Actions | Multi-select for batch operations |

---

### 3. Budgets Section (`/expenses/budgets`)

Two-tab structure for 50/30/20 budget management.

#### Overview Tab

| Component | Description |
|-----------|-------------|
| 50/30/20 Summary Cards | Needs (50%), Wants (30%), Savings (20%) cards |
| Budget Progress Bars | Visual progress for each category |
| Monthly Trend | Last 6 months budget adherence |
| Budget Health | Overall budget health indicator |

#### Budget Details Tab

| Feature | Description |
|---------|-------------|
| Monthly Income | Set/edit monthly income for budget calculations |
| Category Budgets | Per-category budget limits |
| Budget History | Historical budget data table |
| Copy from Previous | Copy settings from previous month |
| Reset Budget | Reset to default 50/30/20 allocation |

---

### 4. Recurring Section (`/expenses/recurring`)

Comprehensive recurring expense management for subscriptions, bills, and regular payments.

#### Overview Tab

| Component | Description |
|-----------|-------------|
| Active Count Card | Number of active recurring expenses |
| Paused Count Card | Number of paused recurring expenses |
| Monthly Total Card | Total monthly recurring amount |
| Upcoming Card | Count of expenses due in next 7 days |
| Due This Week | List of expenses due in current week |
| By Frequency | Breakdown by Weekly/Monthly/Quarterly/Yearly |

#### Recurring Details Tab

| Feature | Description |
|---------|-------------|
| Add Recurring | Create new recurring expense template |
| Status Filters | All, Active, Paused filter buttons |
| Search | Search by description/merchant |
| Frequency Filter | Filter by frequency type |
| Recurring List | Full list with actions |

---

### 5. Categories Page (`/expenses/categories`) - NEW STANDALONE PAGE

Dedicated page for managing expense categories and auto-categorization rules.

**Two-tab structure:**

#### Rules Tab

| Component | Description |
|-----------|-------------|
| Create Rule Button | Opens rule editor dialog |
| Rules List | All auto-categorization rules with priority |
| Rule Toggle | Enable/disable individual rules |
| Edit/Delete Actions | Manage existing rules |
| AI Suggestions | Suggested rules based on expense patterns |

#### Categories Tab

| Component | Description |
|-----------|-------------|
| 50/30/20 Explanation | Info card explaining the budgeting rule |
| Category Cards | Grid of all expense categories |
| Category Type Labels | NEEDS, WANTS, SAVINGS indicators |
| Subcategories | List of subcategories per category |

---

### 6. Reports Page (`/expenses/reports`) - NEW STANDALONE PAGE

Dedicated page for expense analytics and exports.

**Components:**

| Component | Description |
|-----------|-------------|
| Period Selectors | Monthly, Quarterly, Yearly, Custom buttons |
| Month Navigator | Previous/Next month navigation |
| Export Button | Export dropdown (PDF, Excel, CSV, JSON) |
| Report Title | "Expense Report - [Month Year]" |
| Summary Cards | Total Expenses, Transactions, Avg Transaction, Budget Usage |
| Category Pie Chart | Spending breakdown by category |
| 6-Month Trend Chart | Monthly trend with Needs/Wants/Savings breakdown |
| Top Expenses | List of highest expenses |
| Payment Methods | Breakdown by payment method |

---

## Database Models

### RecurringExpense Model

```prisma
model RecurringExpense {
  id                String             @id @default(cuid())
  userId            String

  // Expense template fields
  amount            Float
  description       String
  category          String
  subcategory       String?
  merchant          String?
  paymentMethod     PaymentMethod      @default(OTHER)
  tags              String[]           @default([])
  notes             String?

  // Recurrence settings
  frequency         RecurringFrequency  // WEEKLY, MONTHLY, QUARTERLY, YEARLY
  startDate         DateTime
  endType           RecurringEndType    @default(NEVER)
  endAfterCount     Int?                // If endType = AFTER_OCCURRENCES
  endDate           DateTime?           // If endType = ON_DATE

  // Tracking
  nextOccurrence    DateTime
  lastGenerated     DateTime?
  generatedCount    Int                @default(0)
  isPaused          Boolean            @default(false)

  // Family support
  familyMemberId    String?

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  user              User               @relation(...)
  generatedExpenses Expense[]

  @@index([userId])
  @@index([nextOccurrence])
  @@index([isPaused])
}

enum RecurringFrequency {
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

enum RecurringEndType {
  NEVER
  AFTER_OCCURRENCES
  ON_DATE
}
```

---

## API Endpoints

### Recurring Expenses (`server/routes/recurring-expenses.ts`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recurring-expenses` | List all recurring expenses |
| GET | `/api/recurring-expenses/stats` | Get statistics (active, paused, monthly total) |
| GET | `/api/recurring-expenses/upcoming` | Get upcoming occurrences (next N days) |
| GET | `/api/recurring-expenses/:id` | Get single recurring expense with history |
| POST | `/api/recurring-expenses` | Create new recurring expense |
| PUT | `/api/recurring-expenses/:id` | Update recurring expense |
| DELETE | `/api/recurring-expenses/:id` | Delete (with optional deleteGenerated) |
| POST | `/api/recurring-expenses/:id/pause` | Pause recurring expense |
| POST | `/api/recurring-expenses/:id/resume` | Resume recurring expense |
| POST | `/api/recurring-expenses/:id/skip` | Skip next occurrence |
| POST | `/api/recurring-expenses/:id/generate` | Manually generate expense |
| POST | `/api/recurring-expenses/process` | Process all due recurring expenses |

### Existing Expense APIs

| Route File | Base Path | Purpose |
|------------|-----------|---------|
| `expenses.ts` | `/api/expenses` | Expense CRUD, categories |
| `budgets.ts` | `/api/budgets` | Budget CRUD, current budget |
| `expenses-ai.ts` | `/api/expenses/ai` | AI categorization, receipt OCR |
| `expense-rules.ts` | `/api/expense-rules` | Auto-categorization rules |
| `alerts.ts` | `/api/alerts` | Budget alerts, notifications |

---

## Frontend File Structure

### Pages

```
src/pages/expenses/
├── index.vue          # Overview page with cards, quick actions
├── track.vue          # Track section with Overview/Details tabs
├── budgets.vue        # Budgets section with Overview/Details tabs
├── recurring.vue      # Recurring section with Overview/Details tabs
├── categories.vue     # Categories page with Rules/Categories tabs (NEW)
└── reports.vue        # Reports page with charts and exports (NEW)
```

### Components

```
src/components/expenses/
├── track/
│   ├── TrackOverviewTab.vue       # Track Overview tab content
│   ├── TrackDetailsTab.vue        # Track Expense Details tab content
│   └── CategoriesDialog.vue       # Categories/Rules dialog (legacy, still usable)
├── budgets/
│   ├── BudgetsOverviewTab.vue     # Budgets Overview tab content
│   └── BudgetsDetailsTab.vue      # Budgets Details tab content
├── recurring/
│   ├── RecurringOverviewTab.vue   # Recurring Overview tab content
│   ├── RecurringDetailsTab.vue    # Recurring Details tab content
│   └── RecurringExpenseForm.vue   # Add/Edit form dialog
├── BudgetCard.vue                 # Budget summary card
├── BudgetForm.vue                 # Budget edit form
├── CSVImportModal.vue             # CSV import dialog
├── CategoryPieChart.vue           # Category breakdown chart
├── ExpenseCard.vue                # Expense item card
├── ExpenseFilters.vue             # Filter controls
├── ExpenseForm.vue                # Add/Edit expense form
├── ExpenseList.vue                # Expense list component
├── MonthlyTrendChart.vue          # 6-month trend chart
├── ReceiptUploader.vue            # Receipt OCR upload
├── RuleConditionBuilder.vue       # Rule condition UI
└── RuleEditor.vue                 # Rule create/edit dialog
```

### Composables

```typescript
// src/composables/useExpenses.ts

// Existing exports
export function useExpenses() { ... }
export function useCreateExpense() { ... }
export function useUpdateExpense() { ... }
export function useDeleteExpense() { ... }
export function useBudgets() { ... }
export function useCategories() { ... }
export function useExpenseRules() { ... }

// Recurring expenses
export function useRecurringExpenses() { ... }
export function useRecurringStats() { ... }
export function useUpcomingRecurring() { ... }
export function useCreateRecurringExpense() { ... }
export function useUpdateRecurringExpense() { ... }
export function useDeleteRecurringExpense() { ... }
export function usePauseRecurringExpense() { ... }
export function useResumeRecurringExpense() { ... }
export function useSkipRecurringExpense() { ... }
export function useGenerateRecurringExpense() { ... }
```

---

## UI Patterns

### Internal Tab Navigation Pattern

All section pages use:
1. **Section-level tabs** (in SectionHeader via `:tabs` prop) - URL changes when clicking
2. **Page-level tabs** (local state) - No URL change, just switches content within page

```vue
<template>
  <div>
    <SectionHeader
      title="Expenses"
      subtitle="Track and manage your spending"
      icon="mdi-cart-outline"
      :tabs="expensesTabs"
    />

    <div class="d-flex justify-space-between align-center mb-4">
      <v-tabs v-model="activeTab" color="primary" density="compact">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="details">Expense Details</v-tab>
      </v-tabs>

      <!-- Filters/Actions next to tabs -->
      <ExpenseFilters v-model:month="selectedMonth" />
    </div>

    <v-window v-model="activeTab">
      <v-window-item value="overview">
        <TrackOverviewTab :selected-month="selectedMonth" />
      </v-window-item>
      <v-window-item value="details">
        <TrackDetailsTab :selected-month="selectedMonth" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
// Section-level tabs (shown in SectionHeader)
const expensesTabs = [
  { title: 'Overview', route: '/expenses' },
  { title: 'Track', route: '/expenses/track' },
  { title: 'Budgets', route: '/expenses/budgets' },
  { title: 'Categories', route: '/expenses/categories' },
  { title: 'Reports', route: '/expenses/reports' },
]

// Page-level tabs (local state, no URL change)
const activeTab = ref('overview')
const selectedMonth = ref(getCurrentMonth())
</script>
```

### Section-Level Header Tabs

All expense pages include section-level tabs in the SectionHeader for quick navigation:

```javascript
const expensesTabs = [
  { title: 'Overview', route: '/expenses' },
  { title: 'Track', route: '/expenses/track' },
  { title: 'Budgets', route: '/expenses/budgets' },
  { title: 'Categories', route: '/expenses/categories' },
  { title: 'Reports', route: '/expenses/reports' },  // Always last
]
```

**Note**: Recurring is accessible via sidebar only, not in the header tabs.

### 50/30/20 Budget Explanation Card

```vue
<v-card class="mb-6" variant="tonal" color="primary">
  <v-card-text>
    <div class="d-flex align-center mb-2">
      <v-icon icon="mdi-information" class="mr-2" />
      <span class="font-weight-medium">Categories follow the 50/30/20 budgeting rule</span>
    </div>
    <v-row dense>
      <v-col cols="12" sm="4">
        <v-avatar color="success" size="24"><span>50</span></v-avatar>
        <strong>Needs</strong> - Essential expenses
      </v-col>
      <v-col cols="12" sm="4">
        <v-avatar color="warning" size="24"><span>30</span></v-avatar>
        <strong>Wants</strong> - Discretionary spending
      </v-col>
      <v-col cols="12" sm="4">
        <v-avatar color="info" size="24"><span>20</span></v-avatar>
        <strong>Savings</strong> - Investments & savings
      </v-col>
    </v-row>
  </v-card-text>
</v-card>
```

---

## E2E Tests

### Test File Structure

```
e2e/tests/expenses/
├── 01-navigation.spec.ts           # Navigation, sidebar, URL structure
├── 02-expense-tracking.spec.ts     # Track section, tabs, CRUD operations
├── 03-budgets.spec.ts              # Budgets section, 50/30/20, tabs
├── 04-calculations.spec.ts         # Budget calculations, totals
├── 05-validation.spec.ts           # Form validation
├── 06-reports.spec.ts              # Reports page, charts, exports
├── 07-categories-rules.spec.ts     # Categories page, rules management
├── 08-receipt-scanning.spec.ts     # Receipt OCR, CSV import
└── 09-recurring.spec.ts            # Recurring expenses CRUD
```

### Page Objects

```
e2e/pages/expenses/
├── index.ts                        # Barrel exports
├── overview.page.ts                # Overview page (/expenses)
├── tracking.page.ts                # Track section (/expenses/track)
├── budgets.page.ts                 # Budgets section (/expenses/budgets)
├── recurring.page.ts               # Recurring section (/expenses/recurring)
├── categories.page.ts              # Categories page (/expenses/categories)
└── reports.page.ts                 # Reports page (/expenses/reports)
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tab navigation | Two-level (section + page tabs) | Section tabs for main navigation, page tabs for internal views |
| Header tabs | Section-level tabs in SectionHeader | Quick navigation between main expense pages |
| Tab order | Overview, Track, Budgets, Categories, Reports | Reports always last in the tab order |
| Categories | Standalone page | Major feature deserves dedicated space |
| Reports | Standalone page | Analytics/exports warrant their own page |
| Recurring | Sidebar only (not in header tabs) | Less frequently accessed than other sections |
| Budget framework | 50/30/20 | Industry standard, simple to understand |

---

## Related Documentation

- `CLAUDE.md` - Project development guidelines
- `docs/Salary-Section-Plan.md` - Reference for tab pattern
