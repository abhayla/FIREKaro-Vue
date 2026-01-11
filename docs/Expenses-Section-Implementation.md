# Expenses Section - Implementation Guide

> **Status**: Fully Implemented
> **Created**: January 11, 2026
> **Last Updated**: January 11, 2026
> **Replaces**: Original Expenses-Section-Plan.md (5-tab structure)

---

## Executive Summary

The Expenses section has been restructured to follow the Salary section's tab pattern. The new architecture provides:

1. **Landing Page** - Dashboard with summary cards, alerts, and quick navigation
2. **Track Section** - Expense tracking with Overview/Expense Details tabs
3. **Budgets Section** - 50/30/20 budget management with Overview/Budget Details tabs
4. **Recurring Section** - NEW feature for managing subscriptions and recurring payments
5. **Categories Dialog** - Moved from standalone page to dialog accessible from Track

---

## URL Structure

| Route | Description |
|-------|-------------|
| `/expenses` | Landing page with Summary Cards, Smart Alerts, Quick Navigation |
| `/expenses/track` | Track section with tabs (Overview + Expense Details) |
| `/expenses/budgets` | Budgets section with tabs (Overview + Budget Details) |
| `/expenses/recurring` | Recurring section with tabs (Overview + Recurring Details) |

---

## Section Details

### 1. Landing Page (`/expenses`)

The landing page provides an at-a-glance view of expense status and quick access to all sections.

**Summary Cards:**
| Card | Content |
|------|---------|
| Total Expenses | Current month total spending with ₹ format |
| Budget Usage | Percentage of 50/30/20 budget used |
| Recurring Count | Number of active recurring expenses |
| Top Category | Highest spending category this month |

**Smart Alerts:**
- Budget warnings (approaching/exceeded limits)
- Upcoming recurring expenses (next 7 days)
- Uncategorized expenses requiring attention
- AI categorization suggestions available

**Quick Navigation Cards:**
- Track Expenses (mini-summary + action button)
- Manage Budgets (mini-summary + action button)
- Recurring Expenses (mini-summary + action button)

---

### 2. Track Section (`/expenses/track`)

Two-tab structure for expense tracking and analysis.

#### Overview Tab

| Component | Description |
|-----------|-------------|
| Summary Metrics | Total Spent, Transaction Count, Avg Transaction, Budget Usage |
| Category Pie Chart | Visual breakdown by category (from Reports) |
| 6-Month Trend Chart | Monthly spending trend (from Reports) |
| Recent Expenses | Last 5-10 expenses quick view |
| Export Buttons | PDF, Excel, CSV, JSON export options |
| Budget vs Actual | Comparison cards for Needs/Wants/Savings |

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

#### Categories Dialog (Gear Icon)

Accessible from header gear icon, contains two tabs:

**Rules Tab:**
- Create/edit auto-categorization rules
- Rule priority ordering
- AI-suggested rules
- Test rule functionality

**Categories Tab:**
- View all expense categories (read-only)
- Budget type labels (Needs/Wants/Savings)
- Category icons and colors

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

### 4. Recurring Section (`/expenses/recurring`) - NEW

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

**Recurring Expense Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Description | Text | Yes | Name/description of the expense |
| Amount | Number | Yes | Recurring amount in ₹ |
| Category | Select | Yes | Expense category |
| Subcategory | Select | No | Optional subcategory |
| Frequency | Toggle | Yes | WEEKLY, MONTHLY, QUARTERLY, YEARLY |
| Start Date | Date | Yes | When to start generating expenses |
| End Condition | Select | No | NEVER, AFTER_OCCURRENCES, ON_DATE |
| End After Count | Number | No | Number of occurrences (if AFTER_OCCURRENCES) |
| End Date | Date | No | End date (if ON_DATE) |
| Merchant | Text | No | Merchant/vendor name |
| Payment Method | Select | No | UPI, Credit Card, Cash, etc. |
| Tags | Chips | No | Custom tags |
| Notes | Textarea | No | Additional notes |

**Recurring Actions:**

| Action | Description |
|--------|-------------|
| Edit | Edit recurring expense template |
| Pause | Pause expense generation |
| Resume | Resume paused expense |
| Skip Next | Skip the next occurrence |
| Generate Now | Manually trigger expense generation |
| Delete | Delete recurring expense (option to delete generated expenses) |

---

## Database Models

### RecurringExpense Model (NEW)

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

### Expense Model Update

The Expense model includes an optional link to track generated recurring expenses:

```prisma
model Expense {
  // ... existing fields ...
  recurringExpenseId  String?
  recurringExpense    RecurringExpense?  @relation(fields: [recurringExpenseId], references: [id])
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
├── index.vue          # Landing page with cards, alerts, quick nav
├── track.vue          # Track section with Overview/Details tabs
├── budgets.vue        # Budgets section with Overview/Details tabs
└── recurring.vue      # Recurring section with Overview/Details tabs
```

### Components

```
src/components/expenses/
├── track/
│   ├── TrackOverviewTab.vue       # Track Overview tab content
│   ├── TrackDetailsTab.vue        # Track Expense Details tab content
│   └── CategoriesDialog.vue       # Categories/Rules dialog
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
export function useExpenseCategories() { ... }
export function useExpenseRules() { ... }

// NEW: Recurring expenses
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

### Tab Navigation

All section pages use local tab state (no URL change when switching tabs):

```vue
<template>
  <v-tabs v-model="activeTab">
    <v-tab value="overview">Overview</v-tab>
    <v-tab value="details">Details Tab</v-tab>
  </v-tabs>

  <v-window v-model="activeTab">
    <v-window-item value="overview">
      <OverviewTab />
    </v-window-item>
    <v-window-item value="details">
      <DetailsTab />
    </v-window-item>
  </v-window>
</template>

<script setup>
const activeTab = ref('overview')
</script>
```

### Categories Dialog Pattern

Categories dialog is opened from a gear icon in the Track page header:

```vue
<template>
  <v-btn icon @click="categoriesDialogOpen = true">
    <v-icon>mdi-cog</v-icon>
  </v-btn>

  <CategoriesDialog v-model="categoriesDialogOpen" />
</template>
```

### 50/30/20 Budget Cards

```vue
<v-row>
  <v-col cols="12" md="4">
    <v-card>
      <v-card-text>
        <div class="text-h6">Needs (50%)</div>
        <div class="text-h4 text-currency">₹{{ formatINR(needsUsed) }}</div>
        <v-progress-linear :model-value="needsPercent" color="primary" />
      </v-card-text>
    </v-card>
  </v-col>
  <!-- Wants (30%), Savings (20%) similar -->
</v-row>
```

---

## E2E Tests

### Test File Structure

```
e2e/tests/expenses/
├── 01-navigation.spec.ts           # Navigation, landing page, quick nav, legacy redirects
├── 02-expense-tracking.spec.ts     # Track section, tabs, CRUD operations
├── 03-budgets.spec.ts              # Budgets section, 50/30/20, tabs
├── 04-calculations.spec.ts         # Budget calculations, totals
├── 05-validation.spec.ts           # Form validation
├── 06-reports.spec.ts              # Export functionality (merged into Track)
├── 07-categories-rules.spec.ts     # Categories dialog, rules management
├── 08-receipt-scanning.spec.ts     # Receipt OCR, CSV import
└── 09-recurring.spec.ts            # NEW: Recurring expenses CRUD
```

### Page Objects

```
e2e/pages/expenses/
├── index.ts                        # Barrel exports
├── overview.page.ts                # Landing page
├── tracking.page.ts                # Track section
├── budgets.page.ts                 # Budgets section
├── categories.page.ts              # Categories dialog
└── recurring.page.ts               # Recurring section
```

### Test Count Summary

| Test File | Test Count | Description |
|-----------|------------|-------------|
| 01-navigation.spec.ts | 14 | Navigation and redirects |
| 02-expense-tracking.spec.ts | 12 | Track section tests |
| 03-budgets.spec.ts | 15 | Budgets section tests |
| 04-calculations.spec.ts | 7 | Calculation tests |
| 05-validation.spec.ts | 3 | Validation tests |
| 06-reports.spec.ts | 9 | Export tests |
| 07-categories-rules.spec.ts | 16 | Categories/Rules tests |
| 08-receipt-scanning.spec.ts | 12 | OCR/Import tests |
| 09-recurring.spec.ts | 27 | Recurring expense tests |
| **Total** | **115** | |

---

## Recurring Expenses Service

The backend service (`server/services/recurring-expenses.service.ts`) provides:

### Core Functions

```typescript
// Calculate next occurrence based on frequency
function calculateNextOccurrence(
  frequency: RecurringFrequency,
  fromDate: Date
): Date

// Generate expense from recurring template
async function generateExpenseFromRecurring(
  recurringId: string,
  userId: string
): Promise<Expense | null>

// Process all due recurring expenses for user
async function processRecurringExpenses(
  userId: string
): Promise<Expense[]>

// Skip next occurrence
async function skipNextOccurrence(
  recurringId: string,
  userId: string
): Promise<{ nextOccurrence: string }>

// Get statistics
async function getRecurringStats(
  userId: string
): Promise<RecurringStats>
```

### Frequency Calculations

| Frequency | Calculation |
|-----------|-------------|
| WEEKLY | Add 7 days |
| MONTHLY | Add 1 month (same day) |
| QUARTERLY | Add 3 months |
| YEARLY | Add 1 year |

---

## Implementation Checklist

### Phase 1: Database & Backend (Recurring)
- [x] Add `RecurringExpense` model to Prisma schema
- [x] Add `RecurringFrequency` enum
- [x] Add `RecurringEndType` enum
- [x] Update `Expense` model with `recurringExpenseId`
- [x] Run `npm run db:push`
- [x] Create `recurring-expenses.ts` route
- [x] Create `recurring-expenses.service.ts`
- [x] Register route in `server/index.ts`

### Phase 2: Frontend - Shared Components
- [x] Tab pattern established

### Phase 3: Frontend - Track Section
- [x] Create `TrackOverviewTab.vue`
- [x] Create `TrackDetailsTab.vue`
- [x] Create `CategoriesDialog.vue`
- [x] Rewrite `track.vue` with tab structure

### Phase 4: Frontend - Budgets Section
- [x] Create `BudgetsOverviewTab.vue`
- [x] Create `BudgetsDetailsTab.vue`
- [x] Rewrite `budgets.vue` with tab structure

### Phase 5: Frontend - Recurring Section
- [x] Create `useRecurringExpenses` in composable
- [x] Create `RecurringOverviewTab.vue`
- [x] Create `RecurringDetailsTab.vue`
- [x] Create `RecurringExpenseForm.vue`
- [x] Create `recurring.vue` page

### Phase 6: Frontend - Landing Page
- [x] Update `index.vue` as landing page

### Phase 7: Cleanup & Router
- [x] Delete `reports.vue` page (merged into Track)
- [x] Delete `categories.vue` page (converted to dialog)
- [x] Update router with redirects

### Phase 8: E2E Tests
- [x] Update page objects
- [x] Update navigation tests
- [x] Update tracking tests
- [x] Update budgets tests
- [x] Update reports tests
- [x] Update categories tests
- [x] Create recurring tests

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `jspdf` | ^2.x | PDF export generation |
| `jspdf-autotable` | ^3.x | PDF tables |
| `xlsx` | ^0.18.x | Excel file generation |
| `openai` | ^4.x | Grok AI integration (OpenAI-compatible) |

---

## Environment Variables

```env
# Required for AI features
XAI_API_KEY=your-grok-api-key
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tab navigation | Local state (no URL change) | Consistent with Salary section |
| Categories | Dialog instead of page | Reduces navigation, quick access |
| Reports | Merged into Track Overview | Consolidates related features |
| Recurring | New standalone section | Major feature deserves dedicated space |
| Budget framework | 50/30/20 | Industry standard, simple to understand |

---

## Related Documentation

- `docs/Expenses-Section-Plan.md` - Original planning document (superseded)
- `docs/Salary-Section-Plan.md` - Reference for tab pattern
- `CLAUDE.md` - Project development guidelines
