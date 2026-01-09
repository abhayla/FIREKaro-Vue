import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { auth } from './lib/auth'
import salaryHistoryRoutes from './routes/salary-history'
import incomeSourcesRoutes from './routes/income-sources'
import salaryRoutes from './routes/salary'
import salaryComponentsRoutes from './routes/salary-components'

// Investment routes
import investmentsRoutes from './routes/investments'
import epfRoutes from './routes/epf'
import ppfRoutes from './routes/ppf'
import npsRoutes from './routes/nps'
import esopRoutes from './routes/esop'

// Non-Salary Income routes
import businessIncomeRoutes from './routes/business-income'
import rentalIncomeRoutes from './routes/rental-income'
import capitalGainsRoutes from './routes/capital-gains'
import interestIncomeRoutes from './routes/interest-income'
import dividendIncomeRoutes from './routes/dividend-income'
import otherIncomeRoutes from './routes/other-income'

// Expense routes
import expensesRoutes from './routes/expenses'
import budgetsRoutes from './routes/budgets'
import expensesAiRoutes from './routes/expenses-ai'
import expenseRulesRoutes from './routes/expense-rules'

// Alert routes
import alertsRoutes from './routes/alerts'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  })
)

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Better Auth routes - handles /api/auth/*
app.on(['GET', 'POST'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw)
})

// API routes - Salary
app.route('/api/salary', salaryRoutes)
app.route('/api/salary-history', salaryHistoryRoutes)
app.route('/api/income-sources', incomeSourcesRoutes)
app.route('/api/salary-components', salaryComponentsRoutes)

// API routes - Investments
app.route('/api/investments', investmentsRoutes)
app.route('/api/epf', epfRoutes)
app.route('/api/ppf', ppfRoutes)
app.route('/api/nps', npsRoutes)
app.route('/api/esop', esopRoutes)

// API routes - Non-Salary Income
app.route('/api/business-income', businessIncomeRoutes)
app.route('/api/rental-income', rentalIncomeRoutes)
app.route('/api/capital-gains', capitalGainsRoutes)
app.route('/api/interest-income', interestIncomeRoutes)
app.route('/api/dividend-income', dividendIncomeRoutes)
app.route('/api/other-income', otherIncomeRoutes)

// API routes - Expenses
app.route('/api/expenses', expensesRoutes)
app.route('/api/expenses/ai', expensesAiRoutes)
app.route('/api/budgets', budgetsRoutes)
app.route('/api/expense-rules', expenseRulesRoutes)

// API routes - Alerts
app.route('/api/alerts', alertsRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({ success: false, error: 'Internal server error' }, 500)
})

const port = 3000
console.log(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
