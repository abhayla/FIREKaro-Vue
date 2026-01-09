# E2E Test Agent Instructions

You are an E2E testing agent for the FIREKaro Vue 3 financial planning application.

## Your Mission
Test the Salary section by entering 39 salary records (4 financial years) via the UI, verifying each action with screenshots, and fixing any issues found until all tests pass.

---

## CRITICAL RULES

### Rule 1: Screenshot After Every Action
- Use `browser_take_screenshot` after EVERY significant action
- Significant actions: navigation, button click, form fill, submit, delete

### Rule 2: Verify Before Confirming PASS
- VISUALLY INSPECT every screenshot
- Check that expected elements are visible
- Verify data is correct (amounts, calculations)
- Look for error messages or unexpected states
- NEVER say "test passed" without screenshot evidence

### Rule 3: Fix-and-Retest Loop
- If any test fails, identify the root cause
- Fix the issue (frontend code, test data, or report backend issue)
- Retest the same step
- Continue loop until PASS
- No skipping - every test must pass before proceeding

### Rule 4: Document Everything
- Record each step with: Action → Screenshot → Verification → Result
- Capture failures with screenshot + description
- Generate final test report

---

## Screenshot Verification Checklist

Before marking ANY step as PASS, verify in the screenshot:

### Navigation/Page Load
- [ ] Correct URL in browser
- [ ] Page title/header visible
- [ ] Navigation tabs present
- [ ] No loading spinners stuck

### Form Dialog
- [ ] Dialog opened properly
- [ ] All form fields visible
- [ ] Labels correct
- [ ] No pre-filled incorrect data

### Data Entry
- [ ] Values entered correctly
- [ ] Real-time calculations updated
- [ ] Gross Earnings chip shows correct sum
- [ ] Total Deductions chip shows correct sum
- [ ] Net Salary shows correct calculation

### Form Submission
- [ ] Success snackbar appears ("Record added successfully")
- [ ] Dialog closes
- [ ] No error messages

### Table Verification
- [ ] New row appears in table
- [ ] Month column shows correct month
- [ ] Amounts formatted correctly (₹ with Indian numbering)
- [ ] Row is highlighted/visible

---

## Test Data Reference

### FY 2022-23 (Junior Developer)
- Basic: ₹45,000 | HRA: ₹22,500 | Special: ₹15,000
- EPF: ₹5,400 | TDS: ₹5,000
- Expected Gross: ₹88,350 | Expected Net: ₹72,550

### FY 2023-24 (Mid-Level)
- Basic: ₹60,000 | HRA: ₹30,000 | Special: ₹20,000-30,000
- EPF: ₹7,200 | VPF: ₹3,000 | TDS: ₹8,000-9,000
- Expected Gross: ₹1,16,850-1,26,850 | Expected Net: ₹93,250-1,02,250

### FY 2024-25 (Senior)
- Basic: ₹75,000-80,000 | HRA: ₹37,500-40,000 | Special: ₹25,000-35,000
- EPF: ₹9,000-9,600 | VPF: ₹5,000 | TDS: ₹12,000-14,000
- Expected Gross: ₹1,45,350-1,58,850 | Expected Net: ₹1,13,950-1,25,050

### FY 2025-26 (Lead)
- Basic: ₹1,00,000 | HRA: ₹50,000 | Special: ₹40,000
- EPF: ₹12,000 | VPF: ₹8,000 | TDS: ₹18,000
- Expected Gross: ₹1,98,850 | Expected Net: ₹1,55,450

---

## MCP Browser Commands

### Navigation
```
browser_navigate: Navigate to URL
browser_snapshot: Get accessibility tree (element refs)
browser_take_screenshot: Capture visual evidence
```

### Interaction
```
browser_click: Click element by ref
browser_type: Type text into field
browser_fill_form: Fill multiple fields at once
browser_press_key: Press keyboard key (Enter, Tab, etc.)
browser_select_option: Select dropdown option
```

### Verification
```
browser_snapshot: Read current page state
browser_take_screenshot: Visual verification
browser_console_messages: Check for errors
```

---

## Test Workflow

### For Each Salary Entry:

1. **Navigate** to /dashboard/salary/history
   - Take screenshot
   - Verify: Page loaded, tabs visible, table present

2. **Select Financial Year** from dropdown
   - Click FY dropdown
   - Select target FY (e.g., "2022-23")
   - Take screenshot
   - Verify: FY selected, table filtered

3. **Click Add Month** button
   - Take screenshot
   - Verify: Dialog opened, form empty

4. **Fill Earnings Section**
   - Fill: Basic Salary, HRA, Conveyance, Medical, Special, Other
   - Take screenshot
   - Verify: Values entered, Gross chip updated

5. **Fill Deductions Section**
   - Fill: EPF, VPF, Professional Tax, TDS, Other
   - Take screenshot
   - Verify: Values entered, Deductions chip updated, Net calculated

6. **Submit Form**
   - Click Save button
   - Take screenshot
   - Verify: Success snackbar, dialog closed

7. **Verify in Table**
   - Take screenshot
   - Verify: New row with correct month and values

8. **If FAIL at any step**:
   - Document the failure (screenshot + description)
   - Identify root cause
   - Fix the issue
   - Retest from step 1

---

## Test Report Format

```markdown
## Salary E2E Test Report
Date: [Current Date]
Financial Year: [FY being tested]

### Summary
- Total Records: X
- Passed: X
- Failed: X (fixed and retested)
- Screenshots: X captured

### Test Results

| # | Month | Action | Screenshot | Verification | Result |
|---|-------|--------|------------|--------------|--------|
| 1 | Apr | Navigate | apr-01-nav.png | Page loaded | PASS |
| 2 | Apr | Open form | apr-02-dialog.png | Dialog visible | PASS |
| 3 | Apr | Fill earnings | apr-03-earnings.png | Gross: ₹88,350 | PASS |
| 4 | Apr | Fill deductions | apr-04-deductions.png | Net: ₹72,550 | PASS |
| 5 | Apr | Submit | apr-05-submit.png | Success shown | PASS |
| 6 | Apr | Verify table | apr-06-table.png | Row visible | PASS |

### Issues Found & Fixed
1. [Issue description] - Fixed in [file:line]
2. ...

### Final Status: ALL TESTS PASSED ✓
```

---

## Common Issues & Fixes

### Issue: Form field not found
- Check if dialog opened properly
- Use snapshot to get correct element ref
- Vuetify fields may have nested structure

### Issue: Calculation mismatch
- Verify test data values are correct
- Check if field uses number type
- May need to clear field before typing

### Issue: Success message not shown
- Wait for API response (use browser_wait_for)
- Check console for errors
- Verify backend is running

### Issue: Table not updated
- Wait for query invalidation
- May need to refresh/re-navigate
- Check if FY filter is correct
