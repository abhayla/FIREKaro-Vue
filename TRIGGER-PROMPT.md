# FIREKaro Enhancement Stream - Trigger Prompt

## Choose Your Trigger

### 1. E2E Testing (Headed Mode with Playwright Browser)
```
Read E2E-TEST-PROMPT.md. Perform E2E testing in HEADED mode using Playwright browser tools:

SETUP:
1. Start dev server: npm run dev (check E2E-TEST-PROMPT.md for custom port if any)
2. Wait for server to be ready

BROWSER TOOLS TO USE:
- mcp__playwright__browser_navigate - Navigate to URLs
- mcp__playwright__browser_snapshot - Get page accessibility tree with element refs (USE THIS for interactions)
- mcp__playwright__browser_take_screenshot - Capture visual state for verification
- mcp__playwright__browser_click - Click elements using ref="eXX" from snapshot
- mcp__playwright__browser_type - Type text into inputs
- mcp__playwright__browser_fill_form - Fill multiple form fields
- mcp__playwright__browser_console_messages - Check for JS errors
- mcp__playwright__browser_select_option - Select dropdown options

TESTING WORKFLOW:
1. Navigate to page using browser_navigate
2. Take browser_snapshot to see page structure and get element refs
3. Perform actions using refs (click buttons, fill forms)
4. Take browser_take_screenshot after each major action
5. Analyze screenshot: verify data correct, UI renders, no errors
6. Check browser_console_messages for JS errors

IF TEST FAILS:
1. Identify root cause from screenshot/console
2. Fix the code (component, route, API)
3. Refresh page and retest same feature
4. Repeat until PASS

REPORT: Summary table with PASS/FAIL for each feature tested.
```

### 2. Commit Existing Changes
```
Read COMMIT-GUIDE.md. Check git status and git diff to review all changes. Commit the changes with appropriate commit messages following the convention. Group related changes into atomic commits.
```

### 3. Resume Work (Continue from where left off)
```
Read STREAM-PROMPT.md and CLAUDE.md. Check git status and git log to see current state. Continue implementing from where we left off.
```

### 4. Start Fresh Implementation
```
Read STREAM-PROMPT.md, CLAUDE.md, and COMMIT-GUIDE.md. Begin implementing P0 features from the "Start Here" section.
```

### 5. Specific Task
```
Read STREAM-PROMPT.md. [Describe specific task here - e.g., "Fix the bug in...", "Add tests for...", "Implement feature X..."]
```

---

## Quick Commands

| Task | Prompt |
|------|--------|
| E2E test (headed) | `Read E2E-TEST-PROMPT.md. Start dev server, use Playwright browser tools to test all features visually. Take screenshots, fix issues, retest until all PASS.` |
| Commit changes | `Read COMMIT-GUIDE.md and commit all pending changes with proper messages.` |
| Check status | `Run git status and summarize what needs to be done.` |
| Resume work | `Check git log and status, then continue from where we left off.` |
| Run CLI tests | `Run npm run test:e2e -- e2e/tests/<section>/ for automated tests.` |
| Fix & retest | `Analyze the last screenshot, fix the issue, retest using browser tools until PASS.` |

---

## Files Reference

| File | Purpose |
|------|---------|
| `STREAM-PROMPT.md` | Stream-specific features & instructions |
| `E2E-TEST-PROMPT.md` | E2E testing guide with screenshot verification |
| `COMMIT-GUIDE.md` | Commit conventions & workflow |
| `CLAUDE.md` | Project patterns & conventions |

---

## Stream Locations

| Stream | Folder |
|--------|--------|
| Income | `FIREKaro-Worktrees/FIREKARO-VUE-Income` |
| Expenses | `FIREKaro-Worktrees/FIREKARO-VUE-Expenses` |
| Investments | `FIREKaro-Worktrees/FIREKARO-VUE-Investments` |
| Liabilities | `FIREKaro-Worktrees/FIREKARO-VUE-Liabilities` |
| Insurance | `FIREKaro-Worktrees/FIREKARO-VUE-Insurance` |
| Financial Health | `FIREKaro-Worktrees/FIREKARO-VUE-FinancialHealth` |
| FIRE Goals | `FIREKaro-Worktrees/FIREKARO-VUE-FIRE` |
