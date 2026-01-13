# E2E Testing - Insurance Section

## Trigger Prompt

```
Perform E2E testing for the Insurance section:

1. Start dev server: npm run dev
2. Use test data from e2e/fixtures/insurance-data.ts
3. Navigate to /insurance (single page with tabs)
4. For each tab/feature below:
   - Click on the tab to navigate
   - Perform test actions (add, edit, delete, view)
   - Take screenshot: mcp__playwright__browser_take_screenshot
   - Analyze screenshot for correct data, no errors
   - Check console: mcp__playwright__browser_console_messages
5. If FAIL: fix the code, retest until PASS
6. Report results as PASS/FAIL for each feature
```

---

## Section Details

- **URL**: `/insurance` (single page, tab-based navigation)
- **Legacy URLs**: `/dashboard/insurance/*` → redirect to `/insurance`
- **Test Data**: `e2e/fixtures/insurance-data.ts`
- **Components**: `src/components/insurance/`
- **Page Object**: `e2e/pages/insurance/index.ts`

### Tab Structure
```
/insurance
├── Overview Tab (default)
├── Item Details Tab
│   ├── Life sub-tab
│   ├── Health sub-tab
│   ├── Motor sub-tab
│   ├── Home sub-tab
│   └── Travel sub-tab
├── Calculator Tab
└── Reports Tab
```

---

## Features to Test

### Overview Tab (default)
- [ ] Page loads at /insurance
- [ ] Summary cards display (Life Coverage, Health Coverage, Annual Premium, Active Policies)
- [ ] Policies by Type breakdown shows
- [ ] Coverage Gap Alert displays
- [ ] Quick Actions buttons work (Add Policy, Check Adequacy, View All)

### Item Details Tab → Life Sub-Tab
- [ ] Sub-tab navigation works
- [ ] Policies list displays
- [ ] Add new policy form opens
- [ ] Edit policy works
- [ ] Delete policy works
- [ ] Sum assured displays
- [ ] Premium amount shows
- [ ] Maturity date displays (for ULIPs)

### Item Details Tab → Health Sub-Tab
- [ ] Sub-tab navigation works
- [ ] Policies list displays
- [ ] Add new policy works
- [ ] Edit policy works
- [ ] Coverage type shows (Individual/Family/Floater)
- [ ] Room rent limit displays
- [ ] Copay percentage shows

### Item Details Tab → Motor Sub-Tab
- [ ] Policies list displays
- [ ] Add new policy works
- [ ] IDV value displays
- [ ] NCB percentage shows
- [ ] Vehicle details display

### Item Details Tab → Home Sub-Tab
- [ ] Policies list displays
- [ ] Property details display
- [ ] Contents cover shows

### Item Details Tab → Travel Sub-Tab
- [ ] Policies list displays
- [ ] Coverage details show

### Calculator Tab
- [ ] HLV Calculator card displays
- [ ] Input fields respond (annual income, liabilities, etc.)
- [ ] Calculate button works
- [ ] Coverage analysis results display
- [ ] Open Full Calculator button works
- [ ] How HLV Works information shows

### Reports Tab
- [ ] Report type tabs display (Coverage, Premium, Tax, Renewals)
- [ ] Coverage summary report generates
- [ ] Premium breakdown shows
- [ ] Tax deductions (80C/80D) display
- [ ] Upcoming renewals list
- [ ] Export button works

---

## Screenshot Analysis Checklist

### Visual Checks
- [ ] Page title shows "Insurance"
- [ ] Active tab is highlighted
- [ ] Cards/tables have data (not empty)
- [ ] Policy cards render properly
- [ ] Forms show all fields
- [ ] Sub-tabs are visible in Item Details

### Data Checks
- [ ] Currency format: ₹X,XX,XXX
- [ ] Premium frequency shows (Monthly/Yearly)
- [ ] Dates in correct format
- [ ] Coverage amounts display correctly
- [ ] Policy status badges show

### Error Checks
- [ ] No error alerts
- [ ] No "undefined" or "NaN"
- [ ] No console errors
- [ ] No broken layouts

---

## Common Fixes

| Symptom | Fix |
|---------|-----|
| Page loading forever | Check API route returns data |
| "undefined" showing | Add `?.` optional chaining |
| Tab not switching | Check v-model binding on v-tabs |
| Sub-tab content empty | Verify activeSubTab state |
| Calculator not responding | Check input bindings |
| Multiple elements match | Use .first() or more specific selector |

---

## Test Session Example

```
1. Navigate to /insurance
   Screenshot: ✓ Overview tab with summary cards visible

2. Click "Item Details" tab
   Screenshot: ✓ Tab switches, Life sub-tab active by default

3. Click "Health" sub-tab
   Screenshot: ✓ Health policies section displays

4. Click "Add Health Insurance" button
   Screenshot: ✓ Form dialog opens with Health type selected

5. Fill policy details and submit
   Screenshot: ✓ PASS - policy added, form closes

6. Click "Calculator" tab
   Screenshot: ✓ HLV Calculator displays

7. Fill income and calculate
   Screenshot: ✓ Coverage analysis shows

8. Click "Reports" tab
   Screenshot: ✓ Report tabs and data visible

9. Click "Export" button
   Screenshot: ✓ CSV downloads

Result: Insurance Section - PASS
```

---

## E2E Test Files Reference

| Test File | Coverage |
|-----------|----------|
| `01-navigation.spec.ts` | Tab navigation, sub-tabs, legacy URL redirects |
| `02-life-insurance.spec.ts` | Life sub-tab, policy form, CRUD |
| `03-health-insurance.spec.ts` | Health sub-tab, health-specific fields |
| `04-calculations.spec.ts` | Calculator tab, HLV calculator, overview cards |
| `05-reports.spec.ts` | Reports tab, report types, export |
