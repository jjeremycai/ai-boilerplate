import { desc, eq, and, sql, gte } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, router } from '../../trpc'
import { 
  ProjectTable, 
  TaskTable,
  ActivityLogTable,
  ApiUsageTable,
  user
} from '../../db/schema'

const profileInputSchema = z.object({
  userId: z.string().optional() // If not provided, defaults to current user
})

export const profileRouter = router({
  /**
   * Get complete profile data for a user
   * This includes:
   * - User details
   * - Projects (with stats)
   * - Activity summary
   * - Achievements/badges (if implemented)
   * - API usage summary
   */
  getProfileData: publicProcedure
    .input(profileInputSchema)
    .query(async ({ ctx, input }) => {
      const { db, user: currentUser, shardContext } = ctx
      const profileUserId = input.userId || currentUser?.id
      
      if (!profileUserId) {
        throw new Error('User ID required')
      }

      // Check if viewing own profile
      const isOwnProfile = currentUser?.id === profileUserId

      // Get date ranges
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

      // Execute all queries in parallel
      const [
        userProfile,
        projectStats,
        taskStats,
        recentActivity,
        activityHeatmap,
        apiUsageSummary
      ] = await Promise.all([
        // Get user profile
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            createdAt: user.createdAt,
            emailVerified: user.emailVerified
          })
          .from(user)
          .where(eq(user.id, profileUserId))
          .get(),

        // Project statistics
        shardContext.queryAcrossShards(async (shardDb) => {
          const projects = await shardDb
            .select({
              id: ProjectTable.id,
              name: ProjectTable.name,
              description: ProjectTable.description,
              status: ProjectTable.status,
              createdAt: ProjectTable.createdAt,
              updatedAt: ProjectTable.updatedAt
            })
            .from(ProjectTable)
            .where(eq(ProjectTable.ownerId, profileUserId))
            .orderBy(desc(ProjectTable.updatedAt))

          const activeCount = projects.filter(p => p.status === 'active').length
          const archivedCount = projects.filter(p => p.status === 'archived').length

          return {
            projects: isOwnProfile ? projects : projects.filter(p => p.status === 'active'),
            total: projects.length,
            active: activeCount,
            archived: archivedCount
          }
        }).then(results => {
          // Aggregate results from all shards
          const allProjects = results.flatMap(r => r.projects)
          const sortedProjects = allProjects.sort((a, b) => 
            b.updatedAt.getTime() - a.updatedAt.getTime()
          )

          return {
            projects: sortedProjects.slice(0, 10), // Top 10 projects
            total: results.reduce((sum, r) => sum + r.total, 0),
            active: results.reduce((sum, r) => sum + r.active, 0),
            archived: results.reduce((sum, r) => sum + r.archived, 0)
          }
        }),

        // Task statistics
        shardContext.queryAcrossShards(async (shardDb) => {
          const allTasks = await shardDb
            .select({
              status: TaskTable.status,
              priority: TaskTable.priority,
              count: sql<number>`count(*)`
            })
            .from(TaskTable)
            .where(eq(TaskTable.assigneeId, profileUserId))
            .groupBy(TaskTable.status, TaskTable.priority)

          const completedThisMonth = await shardDb
            .select({ count: sql<number>`count(*)` })
            .from(TaskTable)
            .where(
              and(
                eq(TaskTable.assigneeId, profileUserId),
                eq(TaskTable.status, 'done'),
                gte(TaskTable.completedAt, thirtyDaysAgo)
              )
            )
            .get()

          return {
            byStatus: allTasks,
            completedThisMonth: completedThisMonth?.count || 0
          }
        }).then(results => {
          // Aggregate task statistics
          const statusMap = new Map<string, number>()
          const priorityMap = new Map<string, number>()
          
          results.forEach(result => {
            result.byStatus.forEach(item => {
              statusMap.set(item.status, (statusMap.get(item.status) || 0) + item.count)
              priorityMap.set(item.priority, (priorityMap.get(item.priority) || 0) + item.count)
            })
          })

          const totalCompleted = results.reduce((sum, r) => sum + r.completedThisMonth, 0)

          return {
            total: Array.from(statusMap.values()).reduce((sum, count) => sum + count, 0),
            byStatus: Object.fromEntries(statusMap),
            byPriority: Object.fromEntries(priorityMap),
            completedThisMonth: totalCompleted
          }
        }),

        // Recent activity (public activities only if not own profile)
        shardContext.queryAcrossShards(async (shardDb) => {
          const query = shardDb
            .select()
            .from(ActivityLogTable)
            .where(eq(ActivityLogTable.userId, profileUserId))
            .orderBy(desc(ActivityLogTable.createdAt))
            .limit(20)

          return await query
        }).then(results => {
          // Flatten and sort results from all shards
          const allActivity = results.flat()
          return allActivity
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 20)
            .filter(activity => {
              // Filter sensitive activities if not own profile
              if (isOwnProfile) return true
              const publicActions = ['project_created', 'task_completed', 'comment_added']
              return publicActions.includes(activity.action)
            })
        }),

        // Activity heatmap data (last year)
        shardContext.queryAcrossShards(async (shardDb) => {
          const activities = await shardDb
            .select({
              date: sql<string>`date(createdAt)`,
              count: sql<number>`count(*)`
            })
            .from(ActivityLogTable)
            .where(
              and(
                eq(ActivityLogTable.userId, profileUserId),
                gte(ActivityLogTable.createdAt, oneYearAgo)
              )
            )
            .groupBy(sql`date(createdAt)`)

          return activities
        }).then(results => {
          // Aggregate activity data by date
          const dateMap = new Map<string, number>()
          
          results.flat().forEach(item => {
            dateMap.set(item.date, (dateMap.get(item.date) || 0) + item.count)
          })

          return Array.from(dateMap.entries()).map(([date, count]) => ({
            date,
            count
          }))
        }),

        // API usage summary (only for own profile)
        isOwnProfile ? 
          shardContext.queryAcrossShards(async (shardDb) => {
            const monthlyUsage = await shardDb
              .select({
                endpoint: ApiUsageTable.endpoint,
                count: sql<number>`count(*)`,
                totalCost: sql<number>`sum(cost)`
              })
              .from(ApiUsageTable)
              .where(
                and(
                  eq(ApiUsageTable.userId, profileUserId),
                  gte(ApiUsageTable.createdAt, thirtyDaysAgo)
                )
              )
              .groupBy(ApiUsageTable.endpoint)

            return monthlyUsage
          }).then(results => {
            // Aggregate API usage by endpoint
            const endpointMap = new Map<string, { count: number; totalCost: number }>()
            
            results.flat().forEach(item => {
              const existing = endpointMap.get(item.endpoint) || { count: 0, totalCost: 0 }
              endpointMap.set(item.endpoint, {
                count: existing.count + item.count,
                totalCost: existing.totalCost + item.totalCost
              })
            })

            return Array.from(endpointMap.entries())
              .map(([endpoint, data]) => ({ endpoint, ...data }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5) // Top 5 endpoints
          }) : 
          Promise.resolve([])
      ])

      if (!userProfile) {
        throw new Error('User not found')
      }

      // Calculate member duration
      const memberSince = new Date(userProfile.createdAt)
      const memberDurationDays = Math.floor(
        (now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Calculate achievements/badges
      const achievements = calculateAchievements({
        projectCount: projectStats.total,
        taskCount: taskStats.total,
        completedTasks: taskStats.byStatus.done || 0,
        memberDurationDays
      })

      return {
        user: {
          ...userProfile,
          // Hide email if not own profile and not verified
          email: isOwnProfile || userProfile.emailVerified ? userProfile.email : null
        },
        stats: {
          projects: projectStats,
          tasks: taskStats,
          memberSince: memberSince.toISOString(),
          memberDurationDays
        },
        recentProjects: projectStats.projects,
        recentActivity,
        activityHeatmap,
        apiUsage: isOwnProfile ? apiUsageSummary : undefined,
        achievements,
        isOwnProfile,
        lastUpdated: new Date().toISOString()
      }
    })
})

// Helper function to calculate achievements
function calculateAchievements(stats: {
  projectCount: number
  taskCount: number
  completedTasks: number
  memberDurationDays: number
}) {
  const achievements = []

  // Project-based achievements
  if (stats.projectCount >= 1) achievements.push({ id: 'first_project', name: 'First Project', icon: 'star' })
  if (stats.projectCount >= 10) achievements.push({ id: 'project_veteran', name: 'Project Veteran', icon: 'award' })
  if (stats.projectCount >= 50) achievements.push({ id: 'project_master', name: 'Project Master', icon: 'crown' })

  // Task-based achievements
  if (stats.completedTasks >= 10) achievements.push({ id: 'task_starter', name: 'Task Starter', icon: 'check' })
  if (stats.completedTasks >= 100) achievements.push({ id: 'task_achiever', name: 'Task Achiever', icon: 'target' })
  if (stats.completedTasks >= 1000) achievements.push({ id: 'task_champion', name: 'Task Champion', icon: 'trophy' })

  // Time-based achievements
  if (stats.memberDurationDays >= 30) achievements.push({ id: 'month_member', name: 'Monthly Member', icon: 'calendar' })
  if (stats.memberDurationDays >= 365) achievements.push({ id: 'year_member', name: 'Yearly Member', icon: 'badge' })

  return achievements
}