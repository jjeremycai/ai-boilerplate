import { createMiddleware } from 'hono/factory'
import { WorkOS } from '@workos-inc/node'
import type { Env } from '../index'

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export const workosMiddleware = createMiddleware<{
  Bindings: Env
  Variables: {
    user: User | null
    workos: WorkOS
  }
}>(async (c, next) => {
  // Initialize WorkOS client
  const workos = new WorkOS(c.env.WORKOS_API_KEY)
  c.set('workos', workos)

  const authHeader = c.req.header('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    c.set('user', null)
    return next()
  }

  const accessToken = authHeader.substring(7)
  
  try {
    // Verify the access token with WorkOS
    const { user } = await workos.userManagement.authenticateWithAccessToken({
      accessToken,
      clientId: c.env.WORKOS_CLIENT_ID
    })
    
    c.set('user', {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
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