import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import { UserService } from '../services/user.service'
import type { Env } from '../index'

export const userRoutes = new Hono<{ Bindings: Env }>()

// Get current user profile
userRoutes.get('/me', requireAuth, async (c) => {
  const user = c.get('user')
  const userService = new UserService(c.env.DB)
  
  try {
    const profile = await userService.getOrCreateUser(user)
    return c.json({ data: profile })
  } catch (error) {
    throw error
  }
})

// Update user profile
userRoutes.patch('/me', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ firstName?: string; lastName?: string }>()
  const userService = new UserService(c.env.DB)
  
  try {
    const profile = await userService.updateUser(user.id, body)
    return c.json({ data: profile })
  } catch (error) {
    throw error
  }
})

// Get user statistics
userRoutes.get('/me/stats', requireAuth, async (c) => {
  const user = c.get('user')
  const userService = new UserService(c.env.DB)
  
  try {
    const stats = await userService.getUserStats(user.id)
    return c.json({ data: stats })
  } catch (error) {
    throw error
  }
})

// Delete user account and all data
userRoutes.delete('/me', requireAuth, async (c) => {
  const user = c.get('user')
  const userService = new UserService(c.env.DB)
  
  try {
    await userService.deleteUser(user.id)
    return c.json({ data: { success: true } })
  } catch (error) {
    throw error
  }
})