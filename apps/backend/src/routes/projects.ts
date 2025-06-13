import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import { ProjectService } from '../services/project.service'
import { ShardedProjectService } from '../services/sharded-project.service'
import { getShardContext } from '../lib/shard-context'
import type { Env } from '../index'
import type { CreateProjectInput, UpdateProjectInput } from '../../shared/types'

export const projectRoutes = new Hono<{ Bindings: Env }>()

// Helper to get the appropriate service
function getProjectService(c: any) {
  // Check if sharding is enabled by looking for shard bindings
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  
  if (hasShards) {
    const { db } = getShardContext(c);
    return new ShardedProjectService(db);
  } else {
    return new ProjectService(c.env.DB);
  }
}

// List all projects for the authenticated user
projectRoutes.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  const projectService = getProjectService(c)
  
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
  const projectService = getProjectService(c)
  
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
  const projectService = getProjectService(c)
  
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
  const projectService = getProjectService(c)
  
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
  const projectService = getProjectService(c)
  
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
  const projectService = getProjectService(c)
  
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