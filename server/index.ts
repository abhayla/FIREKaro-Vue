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

// API routes
app.route('/api/salary', salaryRoutes)
app.route('/api/salary-history', salaryHistoryRoutes)
app.route('/api/income-sources', incomeSourcesRoutes)
app.route('/api/salary-components', salaryComponentsRoutes)

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
