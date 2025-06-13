import type { ShardedDbService } from './sharded-db.service'
import type { Project, CreateProjectInput, UpdateProjectInput } from '../../shared/types'

export class ShardedProjectService {
  constructor(private db: ShardedDbService) {}

  async listProjects(userId: string): Promise<Project[]> {
    // Get all projects for user across all shards
    const projects = await this.db.findAll<any>('projects', {
      where: { user_id: userId },
      orderBy: 'created_at DESC'
    });

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await this.db.count('tasks', { project_id: project.id });
        return { ...project, task_count: taskCount };
      })
    );

    return this.mapProjects(projectsWithCounts);
  }

  async getProject(projectId: string, userId: string): Promise<Project | null> {
    const project = await this.db.findById<any>('projects', projectId);
    
    if (!project || project.user_id !== userId) {
      return null;
    }

    // Get task count
    const taskCount = await this.db.count('tasks', { project_id: projectId });
    
    return this.mapProject({ ...project, task_count: taskCount });
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<Project> {
    const projectData = {
      user_id: userId,
      name: input.name,
      description: input.description || null,
      color: input.color || '#3B82F6',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const project = await this.db.create('projects', projectData);
    
    return this.mapProject({ ...project, task_count: 0 });
  }

  async updateProject(projectId: string, userId: string, input: UpdateProjectInput): Promise<Project | null> {
    // First verify ownership
    const existing = await this.getProject(projectId, userId);
    if (!existing) {
      return null;
    }

    const updates: Record<string, any> = {};
    
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.color !== undefined) updates.color = input.color;
    
    if (Object.keys(updates).length === 0) {
      return existing;
    }

    await this.db.update('projects', projectId, updates);
    
    return this.getProject(projectId, userId);
  }

  async deleteProject(projectId: string, userId: string): Promise<boolean> {
    // Verify ownership first
    const project = await this.getProject(projectId, userId);
    if (!project) {
      return false;
    }

    // Delete associated tasks first (they might be on different shards)
    const tasks = await this.db.findAll<any>('tasks', {
      where: { project_id: projectId }
    });

    for (const task of tasks) {
      await this.db.delete('tasks', task.id);
    }

    // Delete the project
    return await this.db.delete('projects', projectId);
  }

  async getProjectStats(projectId: string, userId: string) {
    const project = await this.getProject(projectId, userId);
    if (!project) return null;
    
    // Get all tasks for this project across shards
    const tasks = await this.db.findAll<any>('tasks', {
      where: { project_id: projectId }
    });

    const now = new Date();
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: 0,
        inProgress: 0,
        done: 0,
        cancelled: 0,
      },
      urgent: 0,
      overdue: 0,
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

      // Count urgent
      if (task.priority === 'urgent') {
        stats.urgent++;
      }

      // Count overdue
      if (task.due_date && 
          new Date(task.due_date) < now && 
          !['done', 'cancelled'].includes(task.status)) {
        stats.overdue++;
      }
    }

    return {
      project,
      stats: {
        ...stats,
        completionRate: stats.total > 0 ? (stats.byStatus.done / stats.total) * 100 : 0,
      }
    };
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
    };
  }

  private mapProjects(rows: any[]): Project[] {
    return rows.map(row => this.mapProject(row));
  }
}