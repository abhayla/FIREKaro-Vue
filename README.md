# FIREKaro

An Indian financial planning application to help users track income, expenses, investments, liabilities, and plan for FIRE (Financial Independence, Retire Early).

## Important Disclaimer

**FIREKaro is a personal financial planning tool, not a source of truth.**

- **User-provided data only**: All financial data (salary, investments, insurance, liabilities, etc.) must be manually entered by the user or synced from external sources. This app does not connect to banks, employers, or government systems.
- **Planning & tracking, not execution**: This app helps you visualize, plan, and track your FIRE journey. It does not facilitate income tax filing, investment transactions, insurance purchases, or any financial operations.
- **No financial advice**: All calculations, projections, and insights are based solely on user-provided data. Users should verify information against official sources (Form 16, CAS statements, policy documents) and consult qualified professionals for financial decisions.

## Tech Stack

- **Frontend**: Vue 3 + Vite + Vuetify 3
- **Backend**: Hono + Prisma + Better Auth
- **Database**: PostgreSQL

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server (frontend + backend)
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

Create a `.env` file with:

```
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend (5173) + backend (3000) |
| `npm run build` | TypeScript check + Vite build |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | ESLint with auto-fix |
| `npm run db:studio` | Open Prisma Studio GUI |

## Documentation

See `CLAUDE.md` for detailed architecture and development guidance.
