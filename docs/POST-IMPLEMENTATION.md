# Stream 2: Post-Implementation Checklist

> Run these steps after completing Expenses and Protection sections.

## Step 1: Verify Build

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S2

npm run type-check   # Must pass with no errors
npm run build        # Must build successfully
npm run lint         # Fix any lint issues
```

## Step 2: Test Functionality

With Next.js backend running (`npm run dev` in FIREKaro/):

- [ ] Expenses Overview shows summary cards
- [ ] Track page lists expenses with filters
- [ ] Add/Edit/Delete expense works
- [ ] Budget cards show progress
- [ ] Category pie chart renders
- [ ] CSV Import modal works
- [ ] Protection Overview shows policies
- [ ] Life/Health/Other insurance pages work
- [ ] Adequacy Calculator (4-step wizard) works
- [ ] All Reports tabs render charts

## Step 3: Final Commit

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S2

git add .
git status  # Review changes

git commit -m "feat(stream2): complete Expenses and Protection sections

- Add useExpenses, useProtection composables
- Implement expense tracking with CRUD
- Add budget management and progress tracking
- Implement category charts and CSV import
- Add insurance policy management
- Implement 4-step coverage adequacy wizard
- Add charts and reports for all sections"
```

## Step 4: Push to Remote

```bash
git push origin feature/vue-expenses-protection
```

## Step 5: Merge to Main

```bash
# Switch to main repo
cd D:\Abhay\VibeCoding\FIREKaro-Vue

git checkout main
git pull origin main

# Merge Stream 2
git merge feature/vue-expenses-protection

# Resolve any conflicts if needed, then:
git push origin main
```

## Step 6: Update Other Worktrees

```bash
# Update Stream 1 (if still active)
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S1
git fetch origin && git rebase origin/main

# Update Stream 3 (if still active)
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S3
git fetch origin && git rebase origin/main

# Update Stream 4 (if still active)
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S4
git fetch origin && git rebase origin/main
```

## Step 7: Cleanup (Only After ALL Streams Complete)

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue

# Remove worktree
git worktree remove ../FIREKaro-Vue-S2

# Delete branch
git branch -d feature/vue-expenses-protection
```

---

## What's Next?

Stream 2 provides data needed by:
- **Stream 4**: Financial Health (expense data for cash flow)
- **Stream 4**: FIRE & Goals (expense data for FIRE calculations)

If Stream 4 is waiting, notify them that expense APIs are now complete.
