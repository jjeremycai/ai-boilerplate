import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import { TaskService } from '../services/task.service'
import type { Env } from '../index'
import type { CreateTaskInput, UpdateTaskInput } from '../../shared/types'

export const taskRoutes = new Hono<{ Bindings: Env }>()

// List tasks with filters
taskRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const projectId = c.req.query('projectId')
  const status = c.req.query('status')
  const priority = c.req.query('priority')
  const taskService = new TaskService(c.env.DB)
  
  try {
    const tasks = await taskService.listTasks(user.id, {
      projectId,
      status: status as any,
      priority: priority as any,
    })
    return c.json({ data: tasks })
  } catch (error) {
    throw error
  }
})

// Get a specific task
taskRoutes.get('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const taskId = c.req.param('id')
  const taskService = new TaskService(c.env.DB)
  
  try {
    const task = await taskService.getTask(taskId, user.id)
    if (!task) {
      return c.json({ error: 'Task not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: task })
  } catch (error) {
    throw error
  }
})

// Create a new task
taskRoutes.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<CreateTaskInput>()
  const taskService = new TaskService(c.env.DB)
  
  // Validate input
  if (!body.title || body.title.trim().length === 0) {
    return c.json({ error: 'Task title is required', code: 'VALIDATION_ERROR' }, 400)
  }
  if (!body.projectId) {
    return c.json({ error: 'Project ID is required', code: 'VALIDATION_ERROR' }, 400)
  }
  
  try {
    const task = await taskService.createTask(user.id, body)
    return c.json({ data: task }, 201)
  } catch (error) {
    throw error
  }
})

// Update a task
taskRoutes.patch('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const taskId = c.req.param('id')
  const body = await c.req.json<UpdateTaskInput>()
  const taskService = new TaskService(c.env.DB)
  
  try {
    const task = await taskService.updateTask(taskId, user.id, body)
    if (!task) {
      return c.json({ error: 'Task not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: task })
  } catch (error) {
    throw error
  }
})

// Delete a task
taskRoutes.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const taskId = c.req.param('id')
  const taskService = new TaskService(c.env.DB)
  
  try {
    const deleted = await taskService.deleteTask(taskId, user.id)
    if (!deleted) {
      return c.json({ error: 'Task not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: { success: true } })
  } catch (error) {
    throw error
  }
})

// Bulk update tasks
taskRoutes.post('/bulk-update', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ taskIds: string[], updates: UpdateTaskInput }>()
  const taskService = new TaskService(c.env.DB)
  
  if (!body.taskIds || body.taskIds.length === 0) {
    return c.json({ error: 'Task IDs are required', code: 'VALIDATION_ERROR' }, 400)
  }
  
  try {
    const updatedCount = await taskService.bulkUpdateTasks(user.id, body.taskIds, body.updates)
    return c.json({ data: { updatedCount } })
  } catch (error) {
    throw error
  }
})