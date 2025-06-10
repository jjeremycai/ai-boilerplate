import type { D1Database } from '@cloudflare/workers-types'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../shared/types'

interface TaskFilters {
  projectId?: string
  status?: Task['status']
  priority?: Task['priority']
}

export class TaskService {
  constructor(private db: D1Database) {}

  async listTasks(userId: string, filters: TaskFilters = {}): Promise<Task[]> {
    let query = `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ?
    `
    const params: any[] = [userId]

    if (filters.projectId) {
      query += ' AND t.project_id = ?'
      params.push(filters.projectId)
    }
    if (filters.status) {
      query += ' AND t.status = ?'
      params.push(filters.status)
    }
    if (filters.priority) {
      query += ' AND t.priority = ?'
      params.push(filters.priority)
    }

    query += ' ORDER BY t.created_at DESC'

    const result = await this.db.prepare(query).bind(...params).all()
    return this.mapTasks(result.results)
  }

  async getTask(taskId: string, userId: string): Promise<Task | null> {
    const query = `
      SELECT t.*, p.name as project_name, p.color as project_color
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND t.user_id = ?
    `
    
    const result = await this.db.prepare(query).bind(taskId, userId).first()
    return result ? this.mapTask(result) : null
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    // Verify project belongs to user
    const projectCheck = await this.db
      .prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
      .bind(input.projectId, userId)
      .first()
    
    if (!projectCheck) {
      throw new Error('Project not found')
    }

    const id = crypto.randomUUID()
    const query = `
      INSERT INTO tasks (id, project_id, user_id, title, description, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `
    
    const result = await this.db
      .prepare(query)
      .bind(
        id,
        input.projectId,
        userId,
        input.title,
        input.description || null,
        input.priority || 'medium',
        input.dueDate || null
      )
      .first()
    
    return this.mapTask(result!)
  }

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (input.title !== undefined) {
      updates.push('title = ?')
      values.push(input.title)
    }
    if (input.description !== undefined) {
      updates.push('description = ?')
      values.push(input.description)
    }
    if (input.status !== undefined) {
      updates.push('status = ?')
      values.push(input.status)
      
      // Set completed_at when marking as done
      if (input.status === 'done') {
        updates.push('completed_at = CURRENT_TIMESTAMP')
      } else {
        updates.push('completed_at = NULL')
      }
    }
    if (input.priority !== undefined) {
      updates.push('priority = ?')
      values.push(input.priority)
    }
    if (input.dueDate !== undefined) {
      updates.push('due_date = ?')
      values.push(input.dueDate)
    }
    
    if (updates.length === 0) {
      return this.getTask(taskId, userId)
    }
    
    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
      RETURNING *
    `
    
    values.push(taskId, userId)
    const result = await this.db.prepare(query).bind(...values).first()
    
    return result ? this.mapTask(result) : null
  }

  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM tasks WHERE id = ? AND user_id = ?'
    const result = await this.db.prepare(query).bind(taskId, userId).run()
    return result.changes > 0
  }

  async bulkUpdateTasks(userId: string, taskIds: string[], updates: UpdateTaskInput): Promise<number> {
    const updateClauses: string[] = []
    const values: any[] = []
    
    if (updates.status !== undefined) {
      updateClauses.push('status = ?')
      values.push(updates.status)
      
      if (updates.status === 'done') {
        updateClauses.push('completed_at = CURRENT_TIMESTAMP')
      } else {
        updateClauses.push('completed_at = NULL')
      }
    }
    if (updates.priority !== undefined) {
      updateClauses.push('priority = ?')
      values.push(updates.priority)
    }
    
    if (updateClauses.length === 0) {
      return 0
    }
    
    const placeholders = taskIds.map(() => '?').join(',')
    const query = `
      UPDATE tasks
      SET ${updateClauses.join(', ')}
      WHERE user_id = ? AND id IN (${placeholders})
    `
    
    values.push(userId, ...taskIds)
    const result = await this.db.prepare(query).bind(...values).run()
    
    return result.changes
  }

  private mapTask(row: any): Task {
    return {
      id: row.id,
      projectId: row.project_id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      project: row.project_name ? {
        id: row.project_id,
        name: row.project_name,
        color: row.project_color,
      } as any : undefined,
    }
  }

  private mapTasks(rows: any[]): Task[] {
    return rows.map(row => this.mapTask(row))
  }
}