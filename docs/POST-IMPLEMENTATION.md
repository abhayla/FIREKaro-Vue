# Stream 1: Post-Implementation Checklist

> Run these steps after completing Salary, Non-Salary Income, and Tax Planning sections.

## Step 1: Verify Build

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S1

npm run type-check   # Must pass with no errors
npm run build        # Must build successfully
npm run lint         # Fix any lint issues
```

## Step 2: Test Functionality

With Next.js backend running (`npm run dev` in FIREKaro/):

- [ ] Salary Overview loads with data
- [ ] Salary History CRUD works
- [ ] Non-Salary Income sources display
- [ ] Business/Rental/Capital Gains forms work
- [ ] Tax Calculator shows Old vs New regime
- [ ] Deductions page works
- [ ] All Reports tabs render charts

## Step 3: Final Commit

```bash
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S1

git add .
git status  # Review changes

git commit -m "feat(stream1): complete Salary, Non-Salary Income, and Tax Planning sections

- Add useSalary, useIncome, useTax composables
- Implement all salary components and pages
- Implement all income source components and pages
- Implement tax calculator with regime comparison
- Add charts and reports for all sections"
```

## Step 4: Push to Remote

```bash
git push origin feature/vue-income-tax
```

## Step 5: Merge to Main

```bash
# Switch to main repo
cd D:\Abhay\VibeCoding\FIREKaro-Vue

git checkout main
git pull origin main

# Merge Stream 1
git merge feature/vue-income-tax

# Resolve any conflicts if needed, then:
git push origin main
```

## Step 6: Update Other Worktrees

```bash
# Update Stream 2 (if still active)
cd D:\Abhay\VibeCoding\FIREKaro-Vue-S2
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
git worktree remove ../FIREKaro-Vue-S1

# Delete branch
git branch -d feature/vue-income-tax
```

---

## What's Next?

Stream 1 provides income data needed by:
- **Stream 4**: Financial Health (net worth calculations)
- **Stream 4**: FIRE & Goals (income projections)

If Stream 4 is waiting, notify them that income APIs are now complete.
