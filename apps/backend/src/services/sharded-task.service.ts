import type { ShardedDbService } from './sharded-db.service'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../shared/types'

export class ShardedTaskService {
  constructor(private db: ShardedDbService) {}

  async listTasks(userId: string, projectId?: string, status?: string): Promise<Task[]> {
    const where: Record<string, any> = { user_id: userId };
    
    if (projectId) {
      where.project_id = projectId;
    }
    if (status) {
      where.status = status;
    }

    const tasks = await this.db.findAll<any>('tasks', {
      where,
      orderBy: 'created_at DESC'
    });

    return this.mapTasks(tasks);
  }

  async getTask(taskId: string, userId: string): Promise<Task | null> {
    const task = await this.db.findById<any>('tasks', taskId);
    
    if (!task || task.user_id !== userId) {
      return null;
    }

    return this.mapTask(task);
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    // Validate project ownership if projectId provided
    if (input.projectId) {
      const project = await this.db.findById<any>('projects', input.projectId);
      if (!project || project.user_id !== userId) {
        throw new Error('Project not found or access denied');
      }
    }

    const taskData = {
      user_id: userId,
      project_id: input.projectId || null,
      title: input.title,
      description: input.description || null,
      status: input.status || 'todo',
      priority: input.priority || 'medium',
      due_date: input.dueDate || null,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const task = await this.db.create('tasks', taskData);
    
    return this.mapTask(task);
  }

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task | null> {
    // Verify ownership
    const existing = await this.getTask(taskId, userId);
    if (!existing) {
      return null;
    }

    const updates: Record<string, any> = {};
    
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) {
      updates.status = input.status;
      // Set completed_at when marking as done
      if (input.status === 'done' && existing.status !== 'done') {
        updates.completed_at = new Date().toISOString();
      } else if (input.status !== 'done') {
        updates.completed_at = null;
      }
    }
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.dueDate !== undefined) updates.due_date = input.dueDate;
    if (input.tags !== undefined) updates.tags = JSON.stringify(input.tags);
    if (input.projectId !== undefined) updates.project_id = input.projectId;
    
    if (Object.keys(updates).length === 0) {
      return existing;
    }

    await this.db.update('tasks', taskId, updates);
    
    return this.getTask(taskId, userId);
  }

  async deleteTask(taskId: string, userId: string): Promise<boolean> {
    // Verify ownership
    const task = await this.getTask(taskId, userId);
    if (!task) {
      return false;
    }

    return await this.db.delete('tasks', taskId);
  }

  async bulkUpdateTasks(
    userId: string, 
    taskIds: string[], 
    updates: Partial<UpdateTaskInput>
  ): Promise<{ updated: number; failed: string[] }> {
    let updated = 0;
    const failed: string[] = [];

    // Process each task individually (cross-shard operation)
    for (const taskId of taskIds) {
      try {
        const result = await this.updateTask(taskId, userId, updates);
        if (result) {
          updated++;
        } else {
          failed.push(taskId);
        }
      } catch (error) {
        failed.push(taskId);
      }
    }

    return { updated, failed };
  }

  async getTaskStats(userId: string, projectId?: string) {
    const where: Record<string, any> = { user_id: userId };
    if (projectId) {
      where.project_id = projectId;
    }

    // Get all tasks for the user/project
    const tasks = await this.db.findAll<any>('tasks', { where });

    const now = new Date();
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: 0,
        inProgress: 0,
        done: 0,
        cancelled: 0,
      },
      byPriority: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0,
    };

    for (const task of tasks) {
      // Count by status
      switch (task.status) {
        case 'todo':
          stats.byStatus.todo++;
          break;
        case 'in_progress':
          stats.byStatus.inProgress++;
          break;
        case 'done':
          stats.byStatus.done++;
          break;
        case 'cancelled':
          stats.byStatus.cancelled++;
          break;
      }

      // Count by priority
      switch (task.priority) {
        case 'urgent':
          stats.byPriority.urgent++;
          break;
        case 'high':
          stats.byPriority.high++;
          break;
        case 'medium':
          stats.byPriority.medium++;
          break;
        case 'low':
          stats.byPriority.low++;
          break;
      }

      // Check due dates
      if (task.due_date && !['done', 'cancelled'].includes(task.status)) {
        const dueDate = new Date(task.due_date);
        const daysDiff = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (dueDate < now) {
          stats.overdue++;
        } else if (daysDiff === 0) {
          stats.dueToday++;
        } else if (daysDiff <= 7) {
          stats.dueThisWeek++;
        }
      }
    }

    return stats;
  }

  private mapTask(row: any): Task {
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      tags: row.tags ? JSON.parse(row.tags) : [],
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTasks(rows: any[]): Task[] {
    return rows.map(row => this.mapTask(row));
  }
}