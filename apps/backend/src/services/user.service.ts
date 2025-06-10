import type { D1Database } from '@cloudflare/workers-types'
import type { User } from '../../shared/types'

export class UserService {
  constructor(private db: D1Database) {}

  async getOrCreateUser(clerkUser: { id: string; email: string; firstName?: string; lastName?: string }): Promise<User> {
    // Check if user exists
    let user = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(clerkUser.id)
      .first()
    
    if (!user) {
      // Create new user
      user = await this.db
        .prepare(`
          INSERT INTO users (id, email, first_name, last_name)
          VALUES (?, ?, ?, ?)
          RETURNING *
        `)
        .bind(clerkUser.id, clerkUser.email, clerkUser.firstName || null, clerkUser.lastName || null)
        .first()
    }
    
    return this.mapUser(user!)
  }

  async updateUser(userId: string, data: { firstName?: string; lastName?: string }): Promise<User> {
    const query = `
      UPDATE users
      SET first_name = ?, last_name = ?
      WHERE id = ?
      RETURNING *
    `
    
    const result = await this.db
      .prepare(query)
      .bind(data.firstName || null, data.lastName || null, userId)
      .first()
    
    if (!result) {
      throw new Error('User not found')
    }
    
    return this.mapUser(result)
  }

  async getUserStats(userId: string) {
    const projectStats = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
        FROM projects
        WHERE user_id = ?
      `)
      .bind(userId)
      .first()
    
    const taskStats = await this.db
      .prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
          SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
          SUM(CASE WHEN due_date < datetime('now') AND status NOT IN ('done', 'cancelled') THEN 1 ELSE 0 END) as overdue
        FROM tasks
        WHERE user_id = ?
      `)
      .bind(userId)
      .first()
    
    const recentActivity = await this.db
      .prepare(`
        SELECT 
          'task' as type,
          title as name,
          status,
          updated_at
        FROM tasks
        WHERE user_id = ?
        ORDER BY updated_at DESC
        LIMIT 10
      `)
      .bind(userId)
      .all()
    
    return {
      projects: {
        total: projectStats?.total || 0,
        active: projectStats?.active || 0,
        completed: projectStats?.completed || 0,
        archived: projectStats?.archived || 0,
      },
      tasks: {
        total: taskStats?.total || 0,
        todo: taskStats?.todo || 0,
        inProgress: taskStats?.in_progress || 0,
        done: taskStats?.done || 0,
        urgent: taskStats?.urgent || 0,
        overdue: taskStats?.overdue || 0,
        completionRate: taskStats?.total ? ((taskStats?.done || 0) / taskStats.total) * 100 : 0,
      },
      recentActivity: recentActivity.results.map(item => ({
        type: item.type,
        name: item.name,
        status: item.status,
        updatedAt: item.updated_at,
      })),
    }
  }

  async deleteUser(userId: string): Promise<void> {
    // Due to foreign key constraints with CASCADE, this will delete all user data
    await this.db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}