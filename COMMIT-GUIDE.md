# FIREKaro Commit Guide for Enhancement Streams

## Commit Convention

```
<type>(<scope>): <description>

[optional body]

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types
| Type | Use When |
|------|----------|
| `feat` | New feature or enhancement |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only changes |
| `style` | Formatting, missing semicolons, etc. |
| `chore` | Maintenance tasks, dependencies |

### Scopes (by Stream)
| Stream | Scope |
|--------|-------|
| Income | `income`, `salary`, `capital-gains`, `tds` |
| Expenses | `expenses`, `budgets`, `receipts` |
| Investments | `investments`, `xirr`, `cas`, `rebalancing` |
| Liabilities | `liabilities`, `loans`, `prepayment` |
| Insurance | `insurance`, `coverage`, `policies` |
| Financial Health | `financial-health`, `ratios`, `forecast` |
| FIRE | `fire`, `monte-carlo`, `withdrawal` |

---

## Pre-Commit Checklist

Run these commands before every commit:

```bash
# 1. Check TypeScript errors
npm run type-check

# 2. Run linting
npm run lint

# 3. Run relevant tests
npm run test:unit -- --grep "feature-name"
npm run test:e2e -- e2e/tests/<section>/

# 4. Check what's changed
git status
git diff
```

---

## Commit Workflow

### Step 1: Review Changes
```bash
# See all changes
git status

# See detailed diff
git diff

# See staged changes
git diff --cached
```

### Step 2: Stage Changes by Category

**Option A: Atomic Commits (Recommended)**
Commit related changes together, separate unrelated changes.

```bash
# Stage backend changes
git add server/routes/form16.ts server/services/form16-parser.service.ts
git commit -m "feat(income): add Form 16 parser backend API"

# Stage frontend changes
git add src/components/salary/Form16Parser.vue
git commit -m "feat(income): add Form 16 upload component"

# Stage tests
git add e2e/tests/income/16-form16-import.spec.ts
git commit -m "test(income): add E2E tests for Form 16 import"
```

**Option B: Feature Commit (When changes are tightly coupled)**
```bash
git add .
git commit -m "feat(income): implement Form 16 PDF parser with upload UI and tests"
```

### Step 3: Commit with Proper Message

```bash
# Simple commit
git commit -m "feat(fire): add Monte Carlo simulation utility"

# Detailed commit with body (use HEREDOC)
git commit -m "$(cat <<'EOF'
feat(investments): implement XIRR calculation

- Add Newton-Raphson algorithm in src/utils/xirr.ts
- Create API endpoint GET /api/investments/:id/xirr
- Add XIRRDisplay.vue component with benchmark comparison
- Handle edge cases: negative returns, short periods

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Change Categories & Commit Examples

### 1. Backend Only
```bash
git add server/routes/*.ts server/services/*.ts
git commit -m "feat(expenses): add spending insights API endpoints"
```

### 2. Frontend Only
```bash
git add src/components/**/*.vue src/composables/*.ts
git commit -m "feat(liabilities): add prepayment calculator UI"
```

### 3. Database Schema
```bash
git add prisma/schema.prisma
git commit -m "feat(insurance): add PolicyDocument model for parsed policies"

# Then run migration
npm run db:push
git add prisma/migrations/
git commit -m "chore(insurance): add migration for PolicyDocument"
```

### 4. Full Feature (Backend + Frontend + Tests)
```bash
git add server/ src/ e2e/
git commit -m "feat(fire): implement Monte Carlo simulation with UI and tests"
```

### 5. Bug Fix
```bash
git add src/components/fire/ProjectionChart.vue
git commit -m "fix(fire): correct NaN display when corpus is zero"
```

### 6. Refactoring
```bash
git add src/utils/xirr.ts
git commit -m "refactor(investments): optimize XIRR convergence algorithm"
```

### 7. Tests Only
```bash
git add e2e/tests/ src/**/*.spec.ts
git commit -m "test(financial-health): add E2E tests for ratios dashboard"
```

### 8. Documentation
```bash
git add docs/ *.md
git commit -m "docs(income): document Form 16 parser API endpoints"
```

---

## Daily Workflow

### Start of Day
```bash
# Sync with master
git fetch origin
git rebase origin/master

# Check current status
git log --oneline -5
git status
```

### During Development
```bash
# Commit frequently (every completed sub-feature)
git add <files>
git commit -m "feat(scope): description"
```

### End of Day
```bash
# Ensure everything is committed
git status

# Push to remote
git push origin <branch-name>

# If rebase was done, force push (with lease for safety)
git push origin <branch-name> --force-with-lease
```

---

## Handling Multiple File Types

When a feature touches multiple areas, decide:

| Scenario | Approach |
|----------|----------|
| Backend API + Frontend UI for same feature | Single commit |
| Backend API + Unrelated frontend fix | Separate commits |
| Component + Its unit test | Single commit |
| E2E tests for previously committed feature | Separate commit |
| Schema change + Migration | Two commits |
| Multiple independent bug fixes | Separate commits |

---

## Quick Reference Commands

```bash
# Stage all changes
git add .

# Stage specific files
git add path/to/file.ts

# Stage by pattern
git add "src/components/**/*.vue"
git add "server/routes/*.ts"

# Unstage files
git reset HEAD path/to/file.ts

# Amend last commit (only if NOT pushed)
git commit --amend

# View commit history
git log --oneline -10

# View changes in last commit
git show HEAD

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

---

## Stream-Specific Examples

### Income Stream
```bash
git commit -m "feat(income): add Form 16 PDF parser service"
git commit -m "feat(salary): extract TDS from Form 16 Part B"
git commit -m "feat(tds): add 26AS reconciliation view"
git commit -m "feat(capital-gains): implement grandfathering calculation"
```

### Expenses Stream
```bash
git commit -m "feat(expenses): add receipt OCR service"
git commit -m "feat(expenses): implement spending insights dashboard"
git commit -m "feat(budgets): add month-end forecast algorithm"
```

### Investments Stream
```bash
git commit -m "feat(xirr): implement Newton-Raphson XIRR calculator"
git commit -m "feat(investments): add CAS PDF parser for mutual funds"
git commit -m "feat(rebalancing): add target allocation comparison"
```

### Liabilities Stream
```bash
git commit -m "feat(loans): add prepayment impact calculator"
git commit -m "feat(liabilities): implement balance transfer analyzer"
git commit -m "feat(liabilities): add EMI calendar view"
```

### Insurance Stream
```bash
git commit -m "feat(insurance): add policy PDF parser"
git commit -m "feat(coverage): implement HLV gap analysis"
git commit -m "feat(insurance): add premium comparison matrix"
```

### Financial Health Stream
```bash
git commit -m "feat(financial-health): add cash flow forecast service"
git commit -m "feat(ratios): implement financial ratios dashboard"
git commit -m "feat(financial-health): add net worth milestone tracker"
```

### FIRE Stream
```bash
git commit -m "feat(monte-carlo): implement simulation engine"
git commit -m "feat(fire): add withdrawal strategy optimizer"
git commit -m "feat(fire): add milestone celebration with confetti"
```
