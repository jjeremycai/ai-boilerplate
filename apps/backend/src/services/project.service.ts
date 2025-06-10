import type { D1Database } from '@cloudflare/workers-types'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../../shared/types'

export class ProjectService {
  constructor(private db: D1Database) {}

  async listProjects(userId: string): Promise<Project[]> {
    const query = `
      SELECT 
        p.*,
        COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.user_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `
    
    const result = await this.db.prepare(query).bind(userId).all()
    return this.mapProjects(result.results)
  }

  async getProject(projectId: string, userId: string): Promise<Project | null> {
    const query = `
      SELECT 
        p.*,
        COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = ? AND p.user_id = ?
      GROUP BY p.id
    `
    
    const result = await this.db.prepare(query).bind(projectId, userId).first()
    return result ? this.mapProject(result) : null
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<Project> {
    const id = crypto.randomUUID()
    const query = `
      INSERT INTO projects (id, user_id, name, description, color)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `
    
    const result = await this.db
      .prepare(query)
      .bind(id, userId, input.name, input.description || null, input.color || '#3B82F6')
      .first()
    
    return this.mapProject(result!)
  }

  async updateProject(projectId: string, userId: string, input: UpdateProjectInput): Promise<Project | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (input.name !== undefined) {
      updates.push('name = ?')
      values.push(input.name)
    }
    if (input.description !== undefined) {
      updates.push('description = ?')
      values.push(input.description)
    }
    if (input.status !== undefined) {
      updates.push('status = ?')
      values.push(input.status)
    }
    if (input.color !== undefined) {
      updates.push('color = ?')
      values.push(input.color)
    }
    
    if (updates.length === 0) {
      return this.getProject(projectId, userId)
    }
    
    const query = `
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
      RETURNING *
    `
    
    values.push(projectId, userId)
    const result = await this.db.prepare(query).bind(...values).first()
    
    return result ? this.mapProject(result) : null
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM projects WHERE id = ? AND user_id = ?'
    const result = await this.db.prepare(query).bind(projectId, userId).run()
    return result.changes > 0
  }

  async getProjectStats(projectId: string, userId: string) {
    const project = await this.getProject(projectId, userId)
    if (!project) return null
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN due_date < datetime('now') AND status NOT IN ('done', 'cancelled') THEN 1 ELSE 0 END) as overdue
      FROM tasks
      WHERE project_id = ?
    `
    
    const stats = await this.db.prepare(statsQuery).bind(projectId).first()
    
    return {
      project,
      stats: {
        total: stats?.total || 0,
        byStatus: {
          todo: stats?.todo || 0,
          inProgress: stats?.in_progress || 0,
          done: stats?.done || 0,
          cancelled: stats?.cancelled || 0,
        },
        urgent: stats?.urgent || 0,
        overdue: stats?.overdue || 0,
        completionRate: stats?.total ? ((stats?.done || 0) / stats.total) * 100 : 0,
      }
    }
  }

  private mapProject(row: any): Project {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      status: row.status,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      taskCount: row.task_count || 0,
    }
  }

  private mapProjects(rows: any[]): Project[] {
    return rows.map(row => this.mapProject(row))
  }
}