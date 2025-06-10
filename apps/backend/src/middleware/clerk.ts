import { createMiddleware } from 'hono/factory'
import { verifyToken } from '@clerk/backend'
import type { Env } from '../index'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export const clerkMiddleware = createMiddleware<{
  Bindings: Env
  Variables: {
    user: User | null
  }
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    c.set('user', null)
    return next()
  }

  const token = authHeader.substring(7)
  
  try {
    const payload = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    })
    
    c.set('user', {
      id: payload.sub,
      email: payload.email || '',
      firstName: payload.firstName as string | undefined,
      lastName: payload.lastName as string | undefined,
    })
  } catch (error) {
    console.error('Token verification failed:', error)
    c.set('user', null)
  }
  
  return next()
})

export const requireAuth = createMiddleware<{
  Bindings: Env
  Variables: {
    user: User
  }
}>(async (c, next) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }
  
  return next()
})