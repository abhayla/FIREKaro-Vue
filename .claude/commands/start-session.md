# Start Session Command

**Purpose**: Resume development by reading `NEXT-SESSION-PROMPT.md` and continuing from where the last session left off.

## Instructions

You MUST perform the following steps to properly resume the session:

### Step 1: Read Session Context

Read the following files in order:

1. **`CLAUDE.md`** - Project instructions, architecture, commands, patterns
2. **`NEXT-SESSION-PROMPT.md`** - Last session's handoff context

```
Read CLAUDE.md first, then read NEXT-SESSION-PROMPT.md
```

### Step 2: Verify Project State

Run quick checks to confirm the current state:

```bash
# Check current branch
git branch --show-current

# Check for uncommitted changes
git status --short

# Verify dev server can start (quick check)
npm run type-check
```

### Step 3: Display Session Briefing

Present a concise briefing to the user:

```
## Session Briefing

**Last Session**: [Date from NEXT-SESSION-PROMPT.md]
**Focus**: [What was being worked on]
**Branch**: [Current branch]

### Pending from Last Session
- [List of incomplete tasks]

### Today's Priorities
1. [P0 items from NEXT-SESSION-PROMPT.md]
2. [P1 items]

### Known Issues
- [Any blockers or problems noted]

### Ready to Continue?
[Ask user which priority to start with]
```

### Step 4: Get User Direction

Ask the user:

> "Based on the priorities above, which task would you like to start with? Or describe a different task."

Options to present:
1. Continue with P0 priorities
2. Pick a specific task from the list
3. Work on something different
4. Review/explore the codebase first

### Step 5: Begin Work

Once the user confirms direction:
1. Create a todo list for the selected task(s) using TodoWrite
2. Start implementation following the established patterns in CLAUDE.md
3. Reference relevant documentation as needed

---

## If NEXT-SESSION-PROMPT.md Doesn't Exist

If the file is missing, perform a fresh project scan:

1. Read `CLAUDE.md` for project context
2. Run `git status` and `git log --oneline -10` to understand recent work
3. Check `docs/STYLING-AUDIT-REPORT.md` for known issues
4. Ask the user what they want to work on

---

## Optional Argument

If `$ARGUMENTS` is provided, skip the briefing and directly start that task.

Example: `/project:start-session Fix the Expenses page JS error`

---

## Tech Stack Reminder

**IMPORTANT**: This project uses its own backend stack:

| Component | Technology | Location |
|-----------|------------|----------|
| Backend | **Hono** (NOT Next.js) | `server/` folder |
| Database | PostgreSQL + Prisma | `prisma/schema.prisma` |
| Auth | Better Auth | `server/lib/auth.ts` |
| API Types | OpenAPI + openapi-typescript | `server/openapi/spec.yaml` |

- Do **NOT** reference the old Next.js project (`FIREKaro/`)
- All API development happens in `server/routes/`
- After API changes, run: `npm run generate:api-types`

---

## Best Practices Reminder

- Commit frequently with descriptive messages
- Update NEXT-SESSION-PROMPT.md at the end with `/project:end-session`
- Use `/clear` if context becomes cluttered during long sessions
- Regenerate API types after backend changes
