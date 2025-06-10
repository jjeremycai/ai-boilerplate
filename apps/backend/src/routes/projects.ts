import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import { ProjectService } from '../services/project.service'
import type { Env } from '../index'
import type { CreateProjectInput, UpdateProjectInput } from '../../shared/types'

export const projectRoutes = new Hono<{ Bindings: Env }>()

// List all projects for the authenticated user
projectRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const projectService = new ProjectService(c.env.DB)
  
  try {
    const projects = await projectService.listProjects(user.id)
    return c.json({ data: projects })
  } catch (error) {
    throw error
  }
})

// Get a specific project
projectRoutes.get('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const projectId = c.req.param('id')
  const projectService = new ProjectService(c.env.DB)
  
  try {
    const project = await projectService.getProject(projectId, user.id)
    if (!project) {
      return c.json({ error: 'Project not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: project })
  } catch (error) {
    throw error
  }
})

// Create a new project
projectRoutes.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<CreateProjectInput>()
  const projectService = new ProjectService(c.env.DB)
  
  // Validate input
  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Project name is required', code: 'VALIDATION_ERROR' }, 400)
  }
  
  try {
    const project = await projectService.createProject(user.id, body)
    return c.json({ data: project }, 201)
  } catch (error) {
    throw error
  }
})

// Update a project
projectRoutes.patch('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const projectId = c.req.param('id')
  const body = await c.req.json<UpdateProjectInput>()
  const projectService = new ProjectService(c.env.DB)
  
  try {
    const project = await projectService.updateProject(projectId, user.id, body)
    if (!project) {
      return c.json({ error: 'Project not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: project })
  } catch (error) {
    throw error
  }
})

// Delete a project
projectRoutes.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const projectId = c.req.param('id')
  const projectService = new ProjectService(c.env.DB)
  
  try {
    const deleted = await projectService.deleteProject(projectId, user.id)
    if (!deleted) {
      return c.json({ error: 'Project not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: { success: true } })
  } catch (error) {
    throw error
  }
})

// Get project statistics
projectRoutes.get('/:id/stats', requireAuth, async (c) => {
  const user = c.get('user')
  const projectId = c.req.param('id')
  const projectService = new ProjectService(c.env.DB)
  
  try {
    const stats = await projectService.getProjectStats(projectId, user.id)
    if (!stats) {
      return c.json({ error: 'Project not found', code: 'NOT_FOUND' }, 404)
    }
    return c.json({ data: stats })
  } catch (error) {
    throw error
  }
})