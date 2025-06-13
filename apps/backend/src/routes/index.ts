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
import { shardRoutes } from './shards'

export const apiRoutes = new Hono<{ Bindings: Env }>()

// Apply Clerk middleware to protected routes only
apiRoutes.use('*', async (c, next) => {
  // Blog routes are public for SEO
  if (c.req.path.includes('/blog')) {
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
apiRoutes.route('/shards', shardRoutes)

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
      shards: '/api/v1/shards'
    }
  })
})