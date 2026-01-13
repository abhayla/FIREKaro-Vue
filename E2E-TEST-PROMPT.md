# E2E Testing - Expenses Section

## Trigger Prompt

```
Perform E2E testing for the Expenses section:

1. Start dev server: npm run dev
2. Use test data from e2e/fixtures/expenses-data.ts
3. For each feature below:
   - Navigate to the page
   - Perform test actions (add, edit, delete, view)
   - Take screenshot: mcp__playwright__browser_take_screenshot
   - Analyze screenshot for correct data, no errors
   - Check console: mcp__playwright__browser_console_messages
4. If FAIL: fix the code, retest until PASS
5. Report results as PASS/FAIL for each feature
```

---

## Section Details

- **Routes**: `/expenses/*` (top-level, not under /dashboard)
- **Test Data**: `e2e/fixtures/expenses-data.ts`
- **Page Objects**: `e2e/pages/expenses/`
- **Components**: `src/components/expenses/`

---

## URL Structure

| Route | Description |
|-------|-------------|
| `/expenses` | Landing page with summary cards, alerts, quick nav |
| `/expenses/track` | Track section (Overview + Expense Details tabs) |
| `/expenses/budgets` | Budgets section (Overview + Budget Details tabs) |
| `/expenses/recurring` | Recurring section (Overview + Recurring Details tabs) |

---

## Features to Test

### Landing Page (`/expenses`)
- [ ] Page loads with 4 summary cards
- [ ] Total Expenses card displays correctly (₹ format)
- [ ] Budget Usage card shows percentage
- [ ] Recurring Count card shows active count
- [ ] Top Category card displays highest spending
- [ ] Smart alerts display (budget warnings, upcoming recurring)
- [ ] Quick navigation cards visible (Track, Budgets, Recurring)
- [ ] Quick action buttons work (Add Expense, Set Budget, Add Recurring)

### Track Section (`/expenses/track`)

#### Overview Tab
- [ ] Tab navigation works (Overview/Expense Details)
- [ ] Summary metrics display (Total Spent, Transactions, Avg, Budget Used)
- [ ] Category pie chart renders
- [ ] 6-month trend chart renders
- [ ] Recent expenses list shows last 5-10 items
- [ ] Export buttons visible (PDF, Excel, CSV, JSON)
- [ ] Budget vs Actual cards show Needs/Wants/Savings

#### Expense Details Tab
- [ ] Expenses list displays with all entries
- [ ] Month selector filter works
- [ ] Category filter works
- [ ] Search field filters results
- [ ] Add Expense button opens form dialog
- [ ] Edit expense works
- [ ] Delete expense works with confirmation
- [ ] CSV Import button opens modal
- [ ] Scan Receipt button opens OCR dialog

### Categories Dialog (from Track page)
- [ ] Gear icon opens Categories dialog
- [ ] Rules tab displays with Add Rule button
- [ ] Create new rule works
- [ ] Edit rule works
- [ ] Delete rule works
- [ ] Toggle rule enabled/disabled works
- [ ] Categories tab shows all categories (read-only)
- [ ] Budget type labels display (Needs/Wants/Savings)
- [ ] Dialog closes properly

### Budgets Section (`/expenses/budgets`)

#### Overview Tab
- [ ] 50/30/20 summary cards display (Needs 50%, Wants 30%, Savings 20%)
- [ ] Progress bars show budget usage
- [ ] Budget vs Actual comparison visible
- [ ] Over-budget warning displays when exceeded
- [ ] Monthly trend chart renders

#### Budget Details Tab
- [ ] Monthly income field displays/editable
- [ ] Set Budget button opens form
- [ ] Budget form saves correctly
- [ ] Copy from Previous Month works
- [ ] Budget history table displays
- [ ] Per-category budget limits editable

### Recurring Section (`/expenses/recurring`) - NEW

#### Overview Tab
- [ ] Summary cards display (Active, Paused, Monthly Total, Upcoming)
- [ ] Due This Week section shows upcoming items
- [ ] By Frequency breakdown displays

#### Recurring Details Tab
- [ ] Add Recurring button opens form
- [ ] Status filter works (All/Active/Paused)
- [ ] Search field filters results
- [ ] Frequency filter works
- [ ] Recurring list displays all items
- [ ] Create recurring expense works with all fields:
  - Description, Amount, Category
  - Frequency (Weekly/Monthly/Quarterly/Yearly)
  - Start Date, End Condition
- [ ] Edit recurring expense works
- [ ] Delete recurring expense works (with delete generated option)
- [ ] Pause/Resume toggle works
- [ ] Skip Next occurrence works
- [ ] Generate Now manually creates expense

---

## Screenshot Analysis Checklist

### Visual Checks
- [ ] Page title correct for each section
- [ ] Navigation highlights "Expenses" in sidebar
- [ ] Tab navigation shows active tab
- [ ] Cards/tables have data (not empty)
- [ ] Charts render properly (pie, trend)
- [ ] Forms show all fields
- [ ] Dialogs open centered and styled

### Data Checks
- [ ] Currency format: ₹X,XX,XXX
- [ ] Dates in correct format (DD MMM YYYY)
- [ ] Percentages show % symbol
- [ ] Totals calculate correctly
- [ ] Budget remaining calculates (50/30/20)
- [ ] Recurring frequencies display correctly

### UI Pattern Checks
- [ ] Two-tab structure on Track/Budgets/Recurring pages
- [ ] Categories dialog opens from gear icon
- [ ] 50/30/20 cards show correct colors
- [ ] Progress bars animate on load
- [ ] Empty states show helpful messages

### Error Checks
- [ ] No error alerts visible
- [ ] No "undefined" or "NaN" text
- [ ] No console errors (check with browser_console_messages)
- [ ] No broken layouts or overflow
- [ ] Form validation messages display

---

## Common Fixes

| Symptom | Fix |
|---------|-----|
| Page loading forever | Check API route returns data |
| "undefined" showing | Add `?.` optional chaining |
| NaN in numbers | Add default value `?? 0` |
| Form not submitting | Check validation rules |
| Data not refreshing | Add `queryClient.invalidateQueries` |
| Budget progress wrong | Check percentage calculation against 50/30/20 |
| Tab not switching | Check v-model binding on v-tabs |
| Dialog not opening | Check v-model on dialog component |
| Recurring not saving | Check frequency enum matches backend |

---

## Test Session Example

```
1. Navigate to /expenses
   Screenshot: ✓ Landing page with 4 summary cards
   Screenshot: ✓ Smart alerts visible
   Screenshot: ✓ Quick nav cards present

2. Click Track nav card → /expenses/track
   Screenshot: ✓ Overview tab active
   Screenshot: ✓ Category pie chart renders
   Screenshot: ✓ Export buttons visible

3. Switch to Expense Details tab
   Screenshot: ✓ Expenses table shows
   Screenshot: ✓ Filters visible

4. Click "Add Expense"
   Screenshot: ✓ Form dialog opens
   Fill form and submit
   Screenshot: ✓ PASS - expense added to list

5. Click gear icon for Categories
   Screenshot: ✓ Categories dialog opens
   Screenshot: ✓ Rules tab visible

6. Navigate to /expenses/budgets
   Screenshot: ✓ 50/30/20 cards display
   Screenshot: ✓ Progress bars show usage

7. Navigate to /expenses/recurring
   Screenshot: ✓ Recurring summary cards
   Screenshot: ✓ Add Recurring button visible

8. Click "Add Recurring"
   Screenshot: ✓ Form with frequency options
   Fill form and submit
   Screenshot: ✓ PASS - recurring added

Result: Expenses Section - PASS
```

---

## Related Files

### Page Objects
```
e2e/pages/expenses/
├── index.ts              # Barrel exports
├── overview.page.ts      # Landing page (/expenses)
├── tracking.page.ts      # Track section (/expenses/track)
├── budgets.page.ts       # Budgets section (/expenses/budgets)
├── categories.page.ts    # Categories dialog helper
└── recurring.page.ts     # Recurring section (/expenses/recurring)
```

### Test Specs
```
e2e/tests/expenses/
├── 01-navigation.spec.ts         # Navigation, landing page
├── 02-expense-tracking.spec.ts   # Track section CRUD
├── 03-budgets.spec.ts            # Budgets section, 50/30/20
├── 04-calculations.spec.ts       # Budget calculations
├── 05-validation.spec.ts         # Form validation
├── 06-reports.spec.ts            # Export functionality
├── 07-categories-rules.spec.ts   # Categories dialog, rules
├── 08-receipt-scanning.spec.ts   # Receipt OCR, CSV import
└── 09-recurring.spec.ts          # Recurring expenses CRUD
```
