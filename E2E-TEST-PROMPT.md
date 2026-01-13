# E2E Testing - Investments Section

## Quick Start

### Trigger Prompt

```
Perform E2E testing for the Investments section:

1. Start dev server: npm run dev
2. Use test data from e2e/fixtures/investments-data.ts
3. For each feature below:
   - Navigate to the page
   - Perform test actions (add, edit, delete, view)
   - Take screenshot: mcp__playwright__browser_take_screenshot
   - Analyze screenshot for correct data, no errors
   - Check console: mcp__playwright__browser_console_messages
4. If FAIL: fix the code, retest until PASS
5. Report results as PASS/FAIL for each feature
```

### Test Commands

```bash
# Run all investment tests
npm run test:e2e -- e2e/tests/investments/

# Run specific test file
npm run test:e2e -- e2e/tests/investments/05-epf.spec.ts

# Run tests with UI mode (debugging)
npm run test:e2e:ui -- e2e/tests/investments/

# Run tests matching pattern
npm run test:e2e -- --grep "ESOP"
```

---

## Test Architecture

### Page Object Model (POM)

All tests use the Page Object Model pattern:
- **Base class**: `e2e/pages/base.page.ts` - Common Vuetify helpers
- **Page objects**: `e2e/pages/investments/*.page.ts` - Feature-specific pages
- **Test fixtures**: `e2e/fixtures/investments-data.ts` - Test data

### Key Patterns

#### Two-Tab Pattern (EPF/PPF/NPS/ESOP)
```
/dashboard/investments/{type}
├── Overview Tab (default)
│   ├── Summary cards (balance, returns, etc.)
│   ├── DataCompletionGrid (X/12 months indicator) - NEW v2.1
│   ├── Charts (allocation, projection)
│   └── Quick view list
└── Item Details Tab
    ├── Monthly/contribution grid
    ├── Edit mode toggle
    ├── Copy menu button (copy/import dialog) - NEW v2.1
    └── Add/delete operations
```

#### Family View Toggle
```
App Bar → Family Toggle Button (mdi-account/mdi-account-group)
├── Personal View (default, single user icon)
└── Family View (group icon)
    ├── All Members (aggregated)
    └── Individual Member filter
```

#### Financial Year Selector
```
FY Selector dropdown (available on EPF, PPF, NPS, Reports)
├── Current FY (default, e.g., "2025-26")
├── Previous FYs available
└── Data updates on selection
```

---

## Test Files (16 Total)

### Navigation & Core

| File | Tests | Purpose |
|------|-------|---------|
| `01-navigation.spec.ts` | ~15 | Tab navigation between investment types |
| `02-portfolio-overview.spec.ts` | ~20 | Portfolio summary, asset allocation, total value |

### Investment Types

| File | Tests | Purpose |
|------|-------|---------|
| `03-stocks.spec.ts` | ~25 | Stock CRUD, P&L calculation, current price |
| `04-mutual-funds.spec.ts` | ~20 | MF operations, NAV tracking, SIP |
| `05-epf.spec.ts` | ~42 | EPF two-tab pattern, edit mode, VPF, interest calc, DataCompletionGrid, CopyDialog |
| `05-ppf.spec.ts` | ~34 | PPF contributions, annual limits (₹1.5L), maturity, DataCompletionGrid, CopyDialog |
| `05-epf-ppf.spec.ts` | ~5 | Legacy redirect test |
| `06-nps.spec.ts` | ~20 | NPS allocations (E/C/G), Tier 1/2 |
| `07-property.spec.ts` | ~15 | Property investments, rental yield |
| `08-esop.spec.ts` | ~35 | ESOP/RSU grants, vesting schedule, FMV, tax calc |
| `10-crypto-category.spec.ts` | ~10 | Crypto investments |

### Features & Cross-Cutting

| File | Tests | Purpose |
|------|-------|---------|
| `08-reports.spec.ts` | ~25 | PDF/Excel export, tax reports, performance metrics |
| `09-new-features.spec.ts` | ~30 | Yield calc, SIP timeline, compounding, snapshots |
| `11-family-view.spec.ts` | ~15 | Family toggle, member selection, aggregation |
| `12-financial-year.spec.ts` | ~20 | FY selector, data filtering, persistence |
| `13-edge-cases.spec.ts` | ~25 | Validation, errors, boundary values, loading states |

---

## Page Objects (12 Total)

| Page Object | Class | Key Methods |
|-------------|-------|-------------|
| `overview.page.ts` | `InvestmentsOverviewPage` | `getTotalValue()`, `getAssetAllocation()`, `expectSummaryCardsVisible()` |
| `stocks.page.ts` | `StocksPage` | `addStock()`, `editStock()`, `deleteStock()`, `openAddForm()` |
| `mutual-funds.page.ts` | `MutualFundsPage` | `addFund()`, `addTransaction()`, `getCurrentNAV()` |
| `epf.page.ts` | `EpfPage` | `navigateToDetails()`, `enterEditMode()`, `getTotalBalance()`, `openCopyMenu()`, `expectDataCompletionGridVisible()` |
| `ppf.page.ts` | `PpfPage` | `addContribution()`, `getCurrentBalance()`, `expectContributionGridVisible()`, `openCopyMenu()`, `expectDataCompletionGridVisible()` |
| `epf-ppf.page.ts` | `EpfPpfPage` | Legacy redirect support |
| `nps.page.ts` | `NpsPage` | `getAllocation()`, `updateAllocation()`, `addContribution()` |
| `esop.page.ts` | `ESOPPage` | `addGrant()`, `updateFMV()`, `exerciseOptions()`, `getVestedValue()` |
| `property.page.ts` | `PropertyPage` | `addProperty()`, `getRentalYield()`, `getCurrentValue()` |
| `reports.page.ts` | `InvestmentReportsPage` | `exportToPDF()`, `exportToExcel()`, `getXIRR()`, `selectReportType()` |
| `portfolio.page.ts` | `PortfolioPage` | `addSnapshot()`, `editSnapshot()`, `deleteSnapshot()` |
| `index.ts` | - | Barrel exports for all page objects |

### New Locators (v2.1)

| Page Object | New Locators | Purpose |
|-------------|--------------|---------|
| `epf.page.ts` | `dataCompletionGrid`, `dataCompletionChip`, `copyMenuButton`, `copyDialog` | DataCompletionGrid & CopyDialog |
| `ppf.page.ts` | `dataCompletionGrid`, `dataCompletionChip`, `copyMenuButton`, `copyDialog` | DataCompletionGrid & CopyDialog |

---

## Features Checklist

### Navigation & Overview (`/dashboard/investments`)
- [x] Page loads with portfolio summary
- [x] Total investment value displays
- [x] Asset allocation chart renders
- [x] Returns percentage displays
- [x] Tab navigation works (Stocks, MF, EPF, PPF, etc.)
- [x] Yield summary displays

### Stocks (`/dashboard/investments/stocks`)
- [x] Holdings list displays
- [x] Add new holding works
- [x] Edit holding works
- [x] Delete holding works
- [x] Current price displays
- [x] P&L calculation correct

### Mutual Funds (`/dashboard/investments/mutual-funds`)
- [x] Funds list displays
- [x] Add new fund works
- [x] Add transaction (buy/sell) works
- [x] Current NAV displays
- [x] Returns calculation correct
- [x] Category filtering works

### EPF (`/dashboard/investments/epf`) - Two-Tab Pattern
- [x] Overview tab displays summary cards
- [x] Item Details tab shows monthly grid
- [x] Financial year selector works
- [x] Edit mode enables field editing
- [x] VPF contribution entry works
- [x] Interest calculation at 8.25%
- [x] UAN display (when available)
- [x] Projection chart renders
- [x] DataCompletionGrid shows on Overview tab (v2.1)
- [x] Copy menu button visible on Details tab (v2.1)
- [x] Copy to remaining months dialog works (v2.1)
- [x] Import from previous FY dialog works (v2.1)

### PPF (`/dashboard/investments/ppf`) - Two-Tab Pattern
- [x] Overview tab displays balance and maturity
- [x] Item Details tab shows contribution grid
- [x] Add contribution works
- [x] Delete contribution works
- [x] Annual limit warning (₹1.5L max)
- [x] Minimum deposit validation (₹500)
- [x] Maturity date displays
- [x] Interest rate shows (7.1%)
- [x] DataCompletionGrid shows on Overview tab (v2.1)
- [x] Copy menu button visible on Details tab (v2.1)
- [x] Copy to remaining months dialog works (v2.1)
- [x] Import from previous FY dialog works (v2.1)

### NPS (`/dashboard/investments/nps`) - Two-Tab Pattern
- [x] NPS details display
- [x] Tier 1 and Tier 2 show separately
- [x] Asset allocation (E/C/G) displays
- [x] Edit allocation works
- [x] Add contribution works
- [x] 80CCD benefit tracking
- [x] DataCompletionGrid shows on Overview tab (v2.1)
- [x] Copy menu button visible on Details tab (v2.1)
- [x] Copy to remaining months dialog works (v2.1)
- [x] Import from previous FY dialog works (v2.1)

### ESOP/RSU (`/dashboard/investments/esop`)
- [x] Overview tab with summary cards
- [x] Item Details tab with grants list
- [x] Add new grant (ESOP/RSU/RSA types)
- [x] Vesting schedule displays
- [x] FMV update works
- [x] Exercise options works
- [x] Delete grant works
- [x] Vested vs unvested breakdown
- [x] Tax calculation (perquisite value)
- [x] Grant type distribution chart

### Property (`/dashboard/investments/property`)
- [x] Properties list displays
- [x] Add new property works
- [x] Edit property works
- [x] Delete property works
- [x] Current value displays
- [x] Rental yield calculation

### Crypto (`/dashboard/investments/crypto`)
- [x] Crypto holdings display
- [x] Add crypto works
- [x] Current value displays

### Reports (`/dashboard/investments/reports`)
- [x] Reports page loads
- [x] Portfolio summary generates
- [x] Asset allocation report works
- [x] Performance metrics (XIRR, CAGR)
- [x] PDF export works
- [x] Excel/CSV export works
- [x] Tax reports (capital gains, 80C, 80CCD)
- [x] Period selector (1M, 3M, 1Y, etc.)

### Family View (Cross-Cutting)
- [x] Family toggle button visible in app bar
- [x] Default to personal view
- [x] Switch to family view works
- [x] Member selector appears
- [x] All Members aggregation works
- [x] Individual member filtering works
- [x] Icon changes on toggle

### Financial Year Handling (Cross-Cutting)
- [x] FY selector visible on relevant pages
- [x] Default to current FY
- [x] FY change updates data
- [x] FY persists across tab switches
- [x] Monthly grid shows correct months (Apr-Mar)

### Edge Cases & Validation
- [x] Negative values rejected
- [x] Empty required fields show errors
- [x] Zero values handled (no NaN)
- [x] Large numbers formatted correctly
- [x] Decimal values allowed for MF units
- [x] Future dates validated
- [x] Page refresh maintains state
- [x] Loading states display

---

## Screenshot Analysis Checklist

### Visual Checks
- [ ] Page title correct ("Investments")
- [ ] Navigation highlights current tab
- [ ] Cards/tables have data (not empty)
- [ ] Charts render properly (canvas visible)
- [ ] Forms show all fields
- [ ] Two-tab pattern shows correct active tab
- [ ] Family view icon matches state

### Data Checks
- [ ] Currency format: ₹X,XX,XXX
- [ ] Large amounts use compact notation (L/Cr)
- [ ] Percentages show %
- [ ] Returns show +/- correctly
- [ ] Totals calculate correctly
- [ ] Dates in DD/MM/YYYY format

### Error Checks
- [ ] No error alerts visible
- [ ] No "undefined" or "NaN" text
- [ ] No console errors (red text)
- [ ] No broken layouts/overflow
- [ ] No missing icons (no mdi-*-outline placeholders)

### Two-Tab Specific
- [ ] Tab indicator shows on active tab
- [ ] Tab content changes on click
- [ ] Edit mode shows save/cancel buttons
- [ ] Grid cells are editable in edit mode
- [ ] DataCompletionGrid visible on Overview tab (v2.1)
- [ ] Completion chip shows "X/12 months" format (v2.1)
- [ ] Progress bar reflects completion percentage (v2.1)
- [ ] Copy menu button visible on Details tab (v2.1)

### Copy Dialog Specific (v2.1)
- [ ] Dialog opens from Copy menu button
- [ ] Shows 4 modes: copy remaining, copy previous, import FY, clear
- [ ] Month selection chips are visible and selectable
- [ ] Preview section shows operation details
- [ ] Cancel button closes dialog
- [ ] Apply button executes operation

### Family View Specific
- [ ] Toggle button icon correct
- [ ] Member selector shows options
- [ ] Data changes on member selection

---

## Common Fixes

| Symptom | Fix |
|---------|-----|
| Page loading forever | Check API route returns data |
| "undefined" showing | Add `?.` optional chaining |
| NaN in returns | Handle zero investment case |
| Chart not rendering | Check data structure, ensure canvas exists |
| XIRR showing wrong | Verify transaction dates format |
| Tab not switching | Check `aria-selected` attribute |
| Edit mode not working | Verify edit button click handler |
| FY selector empty | Check FY options array in component |
| Family toggle stuck | Check UI store state management |
| Export not downloading | Verify download event listener |
| Validation not showing | Check VeeValidate schema rules |
| Grid cells not editable | Verify edit mode boolean state |
| DataCompletionGrid not showing | Check `.data-completion-grid` class exists |
| Completion chip wrong count | Verify `fyMonthlyData` has correct entries |
| Copy menu not opening | Check `v-menu` activator binding |
| Copy dialog not closing | Verify `showCopyDialog` state toggle |

---

## Test Session Example

```
1. Navigate to /dashboard/investments
   Screenshot: ✓ Portfolio overview visible

2. Click "EPF" tab
   Screenshot: ✓ EPF page loads with two tabs

3. Verify Overview tab active
   Screenshot: ✓ Summary cards visible

4. Click "Item Details" tab
   Screenshot: ✓ Monthly contribution grid displays

5. Click "Edit" button
   Screenshot: ✓ Edit mode enabled

6. Modify April contribution
   Screenshot: ✓ Field accepts input

7. Click "Save"
   Screenshot: ✓ Changes persisted

Result: EPF Item Details Edit - PASS
```

---

## Routes Reference

| Route | Page | Pattern |
|-------|------|---------|
| `/dashboard/investments` | Overview | Summary |
| `/dashboard/investments/stocks` | Stocks | Table + Dialog |
| `/dashboard/investments/mutual-funds` | Mutual Funds | Table + Dialog |
| `/dashboard/investments/epf` | EPF | Two-Tab |
| `/dashboard/investments/ppf` | PPF | Two-Tab |
| `/dashboard/investments/nps` | NPS | Two-Tab |
| `/dashboard/investments/esop` | ESOP/RSU | Two-Tab |
| `/dashboard/investments/property` | Property | Table + Dialog |
| `/dashboard/investments/crypto` | Crypto | Table + Dialog |
| `/dashboard/investments/reports` | Reports | Tabs + Export |

---

## Test Data Location

- **Fixtures**: `e2e/fixtures/investments-data.ts`
- **Page Objects**: `e2e/pages/investments/`
- **Test Specs**: `e2e/tests/investments/`
