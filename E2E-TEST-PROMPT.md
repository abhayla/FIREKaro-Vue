# E2E Testing - Liabilities Section

## Trigger Prompt

```
Perform E2E testing for the Liabilities section:

1. Start dev server: npm run dev
2. Use test data from e2e/fixtures/liabilities-data.ts
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

- **Routes**: `/liabilities/*`
- **Test Data**: `e2e/fixtures/liabilities-data.ts`
- **Components**: `src/components/liabilities/`
- **Pages**: `src/pages/liabilities/`

---

## Page Structure

### Navigation Pattern
All pages share a `SectionHeader` with 5 tabs:
- Overview | Loans | Credit Cards | Debt Payoff | Reports

### Internal Tabs Pattern (Loans & Credit Cards)
These pages use a two-tab internal navigation:
| Tab | Purpose |
|-----|---------|
| **Overview** | Read-only summary with metrics, charts, condensed list |
| **Details** | Full CRUD operations with item cards, add button |

**Important**: Navigate to "Details" tab before performing CRUD operations.

---

## Test Files (9 specs, 57 tests)

| File | Purpose | Tests |
|------|---------|-------|
| `01-navigation.spec.ts` | Navigation & tab management | 10 |
| `02-loans-crud.spec.ts` | Loan CRUD operations | 7 |
| `03-credit-cards.spec.ts` | Credit card CRUD | 7 |
| `04-debt-payoff.spec.ts` | Payoff strategies | 7 |
| `05-overview.spec.ts` | Overview page | 8 |
| `05-calculations.spec.ts` | Financial calculations | 5 |
| `06-amortization.spec.ts` | Amortization schedules | 6 |
| `06-validation.spec.ts` | Form validation | 4 |
| `07-reports.spec.ts` | Reports & exports | 3 |

---

## Page Objects

| File | Class | URL |
|------|-------|-----|
| `overview.page.ts` | LiabilitiesOverviewPage | `/liabilities` |
| `loans.page.ts` | LoansPage | `/liabilities/loans` |
| `credit-cards.page.ts` | CreditCardsPage | `/liabilities/credit-cards` |
| `debt-payoff.page.ts` | DebtPayoffPage | `/liabilities/debt-payoff` |
| `reports.page.ts` | LiabilitiesReportsPage | `/liabilities/reports` |

---

## Features to Test

### Overview Page (`/liabilities`)
- [ ] Page loads with debt summary
- [ ] Total Debt card displays correctly
- [ ] Monthly EMI card shows total
- [ ] DTI Ratio (Debt-to-Income) displays
- [ ] Upcoming payments section shows due dates
- [ ] Debt breakdown by type (Loans vs Credit Cards)
- [ ] Navigation to sub-pages works (View All buttons)

### Loans (`/liabilities/loans`)
**Overview Tab:**
- [ ] Summary cards display (Total Outstanding, Monthly EMI, Active Loans)
- [ ] Debt distribution chart renders
- [ ] Upcoming EMI payments list shows
- [ ] Condensed loans list displays

**Details Tab (Loan Details):**
- [ ] Loans list displays with cards
- [ ] Add new loan works (all types: Home/Car/Personal/Education/Gold)
- [ ] Edit loan works
- [ ] Delete loan works with confirmation
- [ ] EMI calculation correct
- [ ] Outstanding balance displays
- [ ] View amortization schedule works
- [ ] Prepayment simulation dialog opens
- [ ] Tax benefits info shows (Section 80C, 24b)

### Credit Cards (`/liabilities/credit-cards`)
**Overview Tab:**
- [ ] Summary cards display (Total Outstanding, Credit Limit, Utilization)
- [ ] Credit utilization gauge renders
- [ ] Upcoming payments section shows
- [ ] Condensed cards list displays

**Details Tab (Card Details):**
- [ ] Credit cards list displays
- [ ] Add new card works
- [ ] Edit card works
- [ ] Delete card works with confirmation
- [ ] Credit limit displays
- [ ] Outstanding balance shows
- [ ] Utilization percentage calculates correctly
- [ ] Minimum due displays
- [ ] Due date displays

### Debt Payoff (`/liabilities/debt-payoff`)
- [ ] Page loads with strategy selection
- [ ] Snowball strategy selectable (smallest balance first)
- [ ] Avalanche strategy selectable (highest interest first)
- [ ] Summary cards show (Total Debt, Months to Payoff, Total Interest)
- [ ] Payoff order table displays debts
- [ ] Extra payment input works
- [ ] Interest savings calculation updates
- [ ] Payoff timeline chart renders

### Reports (`/liabilities/reports`)
- [ ] Reports page loads
- [ ] Report type tabs work (Summary, Payments, Interest, Tax)
- [ ] Amortization report with loan selector
- [ ] Debt breakdown chart renders
- [ ] Payment history displays
- [ ] Export buttons visible (PDF, Excel)

---

## Screenshot Analysis Checklist

### Visual Checks
- [ ] Page title shows "Liabilities"
- [ ] Sidebar highlights "Liabilities" section
- [ ] Section tabs visible (Overview, Loans, Credit Cards, Debt Payoff, Reports)
- [ ] Internal tabs visible on Loans/Credit Cards pages
- [ ] Cards/tables have data (not empty)
- [ ] Charts render properly (not blank canvas)
- [ ] Forms show all fields

### Data Checks
- [ ] Currency format: ₹X,XX,XXX (Indian format)
- [ ] Interest rates show % symbol
- [ ] EMI calculates correctly
- [ ] Outstanding balance correct
- [ ] Dates in DD/MM/YYYY format
- [ ] Utilization percentage 0-100%

### Error Checks
- [ ] No error alerts/snackbars
- [ ] No "undefined" or "NaN" text
- [ ] No console errors (check with browser_console_messages)
- [ ] No broken layouts or missing components

---

## Common Fixes

| Symptom | Fix |
|---------|-----|
| Page loading forever | Check API route returns data |
| "undefined" showing | Add `?.` optional chaining |
| EMI calculation wrong | Check formula: P*r*(1+r)^n / ((1+r)^n-1) |
| Amortization table empty | Generate schedule on loan create |
| Utilization shows NaN | Handle zero credit limit case |
| Tab click doesn't navigate | Use direct URL navigation instead |
| Internal tab not switching | Check `activeTab` ref binding |
| Form doesn't submit | Verify form validation passes |
| CRUD buttons not visible | Navigate to Details tab first |

---

## Test Session Example

```
1. Navigate to /liabilities
   Screenshot: Overview page with debt summary visible

2. Click "Loans" tab
   Screenshot: Loans page with Overview tab active

3. Click "Loan Details" internal tab
   Screenshot: Loans list with Add button visible

4. Click "Add Loan"
   Screenshot: Loan form dialog opens

5. Fill home loan details:
   - Type: Home Loan
   - Lender: HDFC Bank
   - Principal: 5000000
   - Outstanding: 3200000
   - Interest: 8.5%
   - Tenure: 240 months
   - EMI: 43391
   Submit form

   Screenshot: PASS - Loan added, appears in list

6. Click amortization icon on loan card
   Screenshot: Amortization schedule displays with monthly breakdown

Result: Loans CRUD - PASS
```

---

## Run Tests

```bash
# Run all liabilities tests
npm run test:e2e -- e2e/tests/liabilities/

# Run specific test file
npm run test:e2e -- e2e/tests/liabilities/01-navigation.spec.ts

# Run with UI mode for debugging
npm run test:e2e:ui -- e2e/tests/liabilities/
```
