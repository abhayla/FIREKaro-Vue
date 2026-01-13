# E2E Testing - Financial Health Section

## Trigger Prompt

```
Perform E2E testing for the Financial Health section:

1. Start dev server: npm run dev -- --port 5180
2. Use test data from e2e/fixtures/financial-health-data.ts
3. For each feature below:
   - Navigate to the page
   - Test both Overview and Details tabs (where applicable)
   - Perform test actions (view, interact)
   - Take screenshot: mcp__playwright__browser_take_screenshot
   - Analyze screenshot for correct data, no errors
   - Check console: mcp__playwright__browser_console_messages
4. If FAIL: fix the code, retest until PASS
5. Report results as PASS/FAIL for each feature
```

---

## Section Details

- **Routes**: `/financial-health/*`
- **Test Data**: `e2e/fixtures/financial-health-data.ts`
- **Components**: `src/components/financial-health/`
- **Page Objects**: `e2e/pages/financial-health/index.ts`

---

## Features to Test

### Health Score (`/financial-health`)
- [ ] Page loads with health score gauge
- [ ] Score displays (0-100)
- [ ] Key metrics cards show (Net Worth, Cash Flow, Savings Rate, Emergency Fund)
- [ ] Health factors list renders with scores
- [ ] Alerts section displays recommendations
- [ ] Quick Links to other pages work

### Net Worth (`/financial-health/net-worth`)
#### Overview Tab
- [ ] Summary cards display (Total Net Worth, Monthly Change, Yearly Change)
- [ ] Net worth trend chart (12 months) renders
- [ ] Assets breakdown shows totals
- [ ] Liabilities breakdown shows totals
- [ ] Net worth = Assets - Liabilities

#### Details Tab
- [ ] Milestones section visible
- [ ] Achieved/pending milestones display
- [ ] Add milestone button works
- [ ] Milestone dialog opens with form
- [ ] Progress percentages show for pending milestones

### Cash Flow (`/financial-health/cash-flow`)
- [ ] Summary cards display (Income, Expenses, Net Cash Flow)
- [ ] Savings rate shows with percentage
- [ ] Income breakdown (Salary, Non-Salary, Passive)
- [ ] Expense breakdown (Needs, Wants)
- [ ] Cash flow trend chart renders
- [ ] Passive income summary section displays

### Banking (`/financial-health/banking`)
#### Overview Tab
- [ ] Summary cards display (Total Balance, Active Accounts, Fixed Deposits)
- [ ] Quick insights section (if accounts exist)
- [ ] Empty state shows when no accounts

#### Details Tab
- [ ] Add Account button visible
- [ ] Account form dialog works
- [ ] Bank name autocomplete functions
- [ ] Account type dropdown works
- [ ] Interest rate field shows for FD/RD
- [ ] Account cards grouped by type
- [ ] Edit/Delete actions work

### Emergency Fund (`/financial-health/emergency-fund`)
#### Overview Tab
- [ ] Quick stats cards (Current Fund, Target Amount, Monthly Expenses)
- [ ] Progress bar with percentage
- [ ] Status chip (Critical/Low/Adequate/Excellent)
- [ ] Liquidity tiers breakdown (Tier 1, Tier 2)
- [ ] Cash flow suggestions display

#### Details Tab
- [ ] Calculator component loads
- [ ] Monthly expenses input works
- [ ] Income stability selector functions
- [ ] Target months slider works (3-18)
- [ ] Build timeline slider works (3-24)
- [ ] Results update dynamically

### Reports (`/financial-health/reports`)
- [ ] Report type sidebar displays (4 types)
- [ ] Health Score report preview works
- [ ] Net Worth report preview works
- [ ] Cash Flow report preview works
- [ ] Emergency Fund report preview works
- [ ] Date range selector functions
- [ ] Export buttons visible (PDF, Excel)

---

## Screenshot Analysis Checklist

### Visual Checks
- [ ] Page title correct
- [ ] Navigation highlights "Financial Health" in sidebar
- [ ] Section tabs show correct active state
- [ ] Internal tabs (Overview/Details) highlight correctly
- [ ] Gauges and charts render
- [ ] Cards have data (not empty)
- [ ] Score colors correct (red/yellow/green)

### Data Checks
- [ ] Currency format: ₹X,XX,XXX or ₹X.XX L/Cr
- [ ] Percentages show %
- [ ] Net worth = Assets - Liabilities
- [ ] Score between 0-100
- [ ] Progress bars reflect correct percentages
- [ ] Months covered calculation correct

### Error Checks
- [ ] No error alerts
- [ ] No "undefined" or "NaN"
- [ ] No console errors (except 404 for unimplemented APIs)
- [ ] No broken layouts

---

## Common Fixes

| Symptom | Fix |
|---------|-----|
| Page loading forever | Check composable has fallback data |
| "undefined" showing | Add `?.` optional chaining |
| NaN in calculations | Handle zero denominator |
| Chart not rendering | Check data array not empty |
| Score wrong | Verify scoring formula |
| Empty state shows | API not implemented - expected |

---

## Test Session Example

```
1. Navigate to /financial-health
   Screenshot: ✓ Health score gauge shows 48/100

2. Check Net Worth card
   Screenshot: ✓ Shows ₹0 (API not implemented)

3. Navigate to /financial-health/net-worth
   Click Details tab
   Screenshot: ✓ Milestones section visible

4. Navigate to /financial-health/banking
   Click Details tab
   Click Add Account
   Screenshot: ✓ Form dialog opens correctly

5. Navigate to /financial-health/emergency-fund
   Screenshot: ✓ Progress bar and liquidity tiers display

Result: Financial Health - PASS (UI functional, APIs pending)
```

---

## Notes

- Backend APIs not fully implemented - pages show mock/default data
- Port 5180 is configured for this worktree
- E2E tests: `npm run test:e2e -- e2e/tests/financial-health/`
