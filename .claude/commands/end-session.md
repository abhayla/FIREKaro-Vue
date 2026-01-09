# End Session Command

**Purpose**: Save current session context to `NEXT-SESSION-PROMPT.md` for seamless continuation in a new session.

## Instructions

You MUST perform the following steps to create a comprehensive session handoff document:

### Step 1: Gather Current State

Run these commands to collect project state:

```bash
# Get git status
git status --short

# Get recent commits
git log --oneline -10

# Get current branch
git branch --show-current

# Check for any failing tests or build issues
npm run type-check 2>&1 | head -50
```

### Step 2: Analyze What Was Done This Session

Review the conversation history and identify:
1. **Tasks completed** - What was accomplished
2. **Tasks in progress** - What was started but not finished
3. **Issues encountered** - Errors, blockers, or challenges
4. **Files modified** - Key files that were changed
5. **Decisions made** - Important choices or trade-offs

### Step 3: Identify Next Steps

Based on the session work, determine:
1. **Immediate priorities** - What should be done first in the next session
2. **Pending tasks** - What remains from the original goals
3. **Known issues** - Bugs or problems that need attention
4. **Suggestions** - Recommendations for the next session

### Step 4: Update NEXT-SESSION-PROMPT.md

Write/update the file `NEXT-SESSION-PROMPT.md` with this structure:

```markdown
# FIREKaro Vue 3 - Session Continuation Prompt

> **Last Updated**: [Current Date/Time]
> **Last Session Focus**: [Brief description]
> **Branch**: [Current branch]

---

## Quick Start

Copy this entire file and paste it as your first message in a new Claude Code session, then run `/project:start-session` to continue.

---

## Session Summary

### What Was Done
- [Bullet points of completed work]

### What's In Progress
- [Bullet points of incomplete work with current state]

### Issues Encountered
- [Any errors, blockers, or challenges]

---

## Current Project State

### Git Status
```
[Output of git status --short]
```

### Recent Commits
```
[Output of git log --oneline -10]
```

### Build/Type Check Status
[Pass/Fail with any relevant errors]

---

## Next Session Priorities

### P0 - Must Do First
1. [Highest priority task]
2. [Second priority]

### P1 - Should Do
1. [Important but not urgent]

### P2 - Nice to Have
1. [Lower priority items]

---

## Key Files to Review

| File | Reason |
|------|--------|
| [path/to/file] | [Why it's relevant] |

---

## Context & Decisions

### Important Decisions Made
- [Key decisions from this session]

### Technical Notes
- [Any technical context that would help continuation]

---

## Reference Documentation

- `CLAUDE.md` - Project instructions and patterns
- `docs/STYLING-GUIDE.md` - UI component patterns
- `docs/STYLING-AUDIT-REPORT.md` - Current issues list

---

**End of Session Prompt**
```

### Step 5: Confirm Completion

After updating the file, display:
1. Summary of what was saved
2. Reminder to commit the updated `NEXT-SESSION-PROMPT.md` if desired
3. Instructions for starting the next session

---

## Optional Argument

If `$ARGUMENTS` is provided, use it as the session focus description.

Example: `/project:end-session Fixed authentication flow`

---

## API Changes Checklist

If you made changes to backend routes (`server/routes/`) during this session:

1. **Note in session summary** - Mention which API endpoints were added/modified
2. **Remind about type regeneration** - Add to P0 priorities: "Run `npm run generate:api-types`"
3. **Document new endpoints** - If new endpoints were added, note them for CLAUDE.md update

### Important Reminders for Next Session

- **Backend**: Hono + Prisma (in `server/` folder) - NOT Next.js
- **API Types**: Must regenerate after route changes: `npm run generate:api-types`
- **Old Project**: Do NOT reference `FIREKaro/` (Next.js) - use `server/` folder only
