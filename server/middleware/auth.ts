import { Context, Next } from 'hono'
import { auth } from '../lib/auth'

// Extend Hono context with user info
declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    user: {
      id: string
      email: string
      name: string | null
    }
  }
}

export async function authMiddleware(c: Context, next: Next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session?.user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    // Set user info in context
    c.set('userId', session.user.id)
    c.set('user', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    })

    await next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return c.json({ success: false, error: 'Authentication failed' }, 401)
  }
}

// Optional auth middleware - doesn't fail if not authenticated
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (session?.user) {
      c.set('userId', session.user.id)
      c.set('user', {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
    }
  } catch {
    // Ignore auth errors for optional auth
  }

  await next()
}
