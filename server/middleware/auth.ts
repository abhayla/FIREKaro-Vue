import { Context, Next } from 'hono'
import { auth } from '../lib/auth'
import { prisma } from '../lib/prisma'

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

// Dev mode bypass user config
const DEV_BYPASS_EMAIL = 'test@firekaro.com'
const DEV_BYPASS_NAME = 'Test User'

// Cache the dev user to avoid repeated DB lookups
let cachedDevUser: { id: string; email: string; name: string | null } | null = null

async function getOrCreateDevUser() {
  if (cachedDevUser) return cachedDevUser

  // Find existing user by email
  let user = await prisma.user.findFirst({
    where: { email: DEV_BYPASS_EMAIL },
    select: { id: true, email: true, name: true }
  })

  // Create if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: DEV_BYPASS_EMAIL,
        name: DEV_BYPASS_NAME,
        emailVerified: true,
      },
      select: { id: true, email: true, name: true }
    })
    console.log(`Created dev bypass user: ${user.id}`)
  }

  cachedDevUser = user
  return user
}

export async function authMiddleware(c: Context, next: Next) {
  // Dev bypass for testing - check for special header or env var
  const devBypass = process.env.DEV_BYPASS_AUTH === 'true' ||
                    c.req.header('x-dev-bypass') === 'true'

  if (devBypass) {
    try {
      const devUser = await getOrCreateDevUser()
      c.set('userId', devUser.id)
      c.set('user', devUser)
      await next()
      return
    } catch (error) {
      console.error('Failed to get/create dev user:', error)
      // Fall through to normal auth
    }
  }

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
