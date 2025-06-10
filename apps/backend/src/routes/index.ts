import { Hono } from 'hono'
import { clerkMiddleware } from '../middleware/clerk'
import type { Env } from '../index'
import { projectRoutes } from './projects'
import { taskRoutes } from './tasks'
import { userRoutes } from './users'
import { chatRoutes } from './chat'
import { aiRoutes } from './ai'
import { blog } from './blog'
import { items } from './items'
import { agentChat } from './agentChat'
import billing from './billing'
import organizations from './organizations'

export const apiRoutes = new Hono<{ Bindings: Env }>()

// Apply Clerk middleware to protected routes only
apiRoutes.use('*', async (c, next) => {
  // Blog routes are public for SEO
  if (c.req.path.includes('/blog')) {
    return next()
  }
  // Stripe webhook needs to be public
  if (c.req.path === '/api/v1/billing/webhook') {
    return next()
  }
  return clerkMiddleware(c, next)
})

// Mount route groups
apiRoutes.route('/projects', projectRoutes)
apiRoutes.route('/tasks', taskRoutes)
apiRoutes.route('/users', userRoutes)
apiRoutes.route('/chat', chatRoutes)
apiRoutes.route('/ai', aiRoutes)
apiRoutes.route('/blog', blog)
apiRoutes.route('/items', items)
apiRoutes.route('/chat/agent', agentChat)
apiRoutes.route('/billing', billing)
apiRoutes.route('/organizations', organizations)

// Root API endpoint
apiRoutes.get('/', (c) => {
  return c.json({
    message: 'API v1',
    endpoints: {
      projects: '/api/v1/projects',
      tasks: '/api/v1/tasks',
      users: '/api/v1/users',
      chat: '/api/v1/chat',
      ai: '/api/v1/ai',
      blog: '/api/v1/blog',
      items: '/api/v1/items',
      billing: '/api/v1/billing',
      organizations: '/api/v1/organizations'
    }
  })
})