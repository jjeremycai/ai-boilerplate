import { desc, eq, and, gte, sql } from 'drizzle-orm'
import { protectedProcedure, router } from '../../trpc'
import { 
  ProjectTable, 
  TaskTable, 
  ActivityLogTable,
  ApiUsageTable,
  user
} from '../../db/schema'

export const dashboardRouter = router({
  /**
   * Get all dashboard data in a single request to avoid waterfalls
   * This includes:
   * - User stats (projects, tasks, etc)
   * - Recent activity
   * - API usage stats
   * - Recent projects and tasks
   */
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const { db, user: currentUser, shardContext } = ctx
    const userId = currentUser.id

    // Get date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Execute all queries in parallel
    const [
      userStats,
      recentProjects,
      recentTasks,
      recentActivity,
      apiUsageStats,
      taskStatusDistribution
    ] = await Promise.all([
      // User stats - aggregated from shards
      shardContext.queryAcrossShards(async (shardDb) => {
        const projectCount = await shardDb
          .select({ count: sql<number>`count(*)` })
          .from(ProjectTable)
          .where(eq(ProjectTable.ownerId, userId))
          .get()

        const taskCount = await shardDb
          .select({ count: sql<number>`count(*)` })
          .from(TaskTable)
          .where(eq(TaskTable.assigneeId, userId))
          .get()

        const completedTaskCount = await shardDb
          .select({ count: sql<number>`count(*)` })
          .from(TaskTable)
          .where(
            and(
              eq(TaskTable.assigneeId, userId),
              eq(TaskTable.status, 'done')
            )
          )
          .get()

        return {
          projectCount: projectCount?.count || 0,
          taskCount: taskCount?.count || 0,
          completedTaskCount: completedTaskCount?.count || 0
        }
      }).then(results => {
        // Aggregate results from all shards
        return results.reduce((acc, curr) => ({
          projectCount: acc.projectCount + curr.projectCount,
          taskCount: acc.taskCount + curr.taskCount,
          completedTaskCount: acc.completedTaskCount + curr.completedTaskCount
        }), { projectCount: 0, taskCount: 0, completedTaskCount: 0 })
      }),

      // Recent projects - query across shards
      shardContext.queryAcrossShards(async (shardDb) => {
        return await shardDb
          .select()
          .from(ProjectTable)
          .where(eq(ProjectTable.ownerId, userId))
          .orderBy(desc(ProjectTable.updatedAt))
          .limit(5)
      }).then(results => {
        // Flatten and sort results from all shards
        const allProjects = results.flat()
        return allProjects
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 5)
      }),

      // Recent tasks - query across shards
      shardContext.queryAcrossShards(async (shardDb) => {
        return await shardDb
          .select()
          .from(TaskTable)
          .where(eq(TaskTable.assigneeId, userId))
          .orderBy(desc(TaskTable.updatedAt))
          .limit(10)
      }).then(results => {
        // Flatten and sort results from all shards
        const allTasks = results.flat()
        return allTasks
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 10)
      }),

      // Recent activity - query across shards
      shardContext.queryAcrossShards(async (shardDb) => {
        return await shardDb
          .select()
          .from(ActivityLogTable)
          .where(
            and(
              eq(ActivityLogTable.userId, userId),
              gte(ActivityLogTable.createdAt, sevenDaysAgo)
            )
          )
          .orderBy(desc(ActivityLogTable.createdAt))
          .limit(20)
      }).then(results => {
        // Flatten and sort results from all shards
        const allActivity = results.flat()
        return allActivity
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 20)
      }),

      // API usage stats - query across shards
      shardContext.queryAcrossShards(async (shardDb) => {
        const monthlyUsage = await shardDb
          .select({
            totalCost: sql<number>`sum(cost)`,
            totalRequests: sql<number>`count(*)`,
            totalTokens: sql<number>`sum(totalTokens)`
          })
          .from(ApiUsageTable)
          .where(
            and(
              eq(ApiUsageTable.userId, userId),
              gte(ApiUsageTable.createdAt, thirtyDaysAgo)
            )
          )
          .get()

        const weeklyUsage = await shardDb
          .select({
            totalCost: sql<number>`sum(cost)`,
            totalRequests: sql<number>`count(*)`,
            totalTokens: sql<number>`sum(totalTokens)`
          })
          .from(ApiUsageTable)
          .where(
            and(
              eq(ApiUsageTable.userId, userId),
              gte(ApiUsageTable.createdAt, sevenDaysAgo)
            )
          )
          .get()

        return {
          monthly: {
            totalCost: monthlyUsage?.totalCost || 0,
            totalRequests: monthlyUsage?.totalRequests || 0,
            totalTokens: monthlyUsage?.totalTokens || 0
          },
          weekly: {
            totalCost: weeklyUsage?.totalCost || 0,
            totalRequests: weeklyUsage?.totalRequests || 0,
            totalTokens: weeklyUsage?.totalTokens || 0
          }
        }
      }).then(results => {
        // Aggregate results from all shards
        return results.reduce((acc, curr) => ({
          monthly: {
            totalCost: acc.monthly.totalCost + curr.monthly.totalCost,
            totalRequests: acc.monthly.totalRequests + curr.monthly.totalRequests,
            totalTokens: acc.monthly.totalTokens + curr.monthly.totalTokens
          },
          weekly: {
            totalCost: acc.weekly.totalCost + curr.weekly.totalCost,
            totalRequests: acc.weekly.totalRequests + curr.weekly.totalRequests,
            totalTokens: acc.weekly.totalTokens + curr.weekly.totalTokens
          }
        }), {
          monthly: { totalCost: 0, totalRequests: 0, totalTokens: 0 },
          weekly: { totalCost: 0, totalRequests: 0, totalTokens: 0 }
        })
      }),

      // Task status distribution - query across shards
      shardContext.queryAcrossShards(async (shardDb) => {
        const distribution = await shardDb
          .select({
            status: TaskTable.status,
            count: sql<number>`count(*)`
          })
          .from(TaskTable)
          .where(eq(TaskTable.assigneeId, userId))
          .groupBy(TaskTable.status)

        return distribution
      }).then(results => {
        // Aggregate results from all shards
        const aggregated = results.flat().reduce((acc, curr) => {
          const existing = acc.find(item => item.status === curr.status)
          if (existing) {
            existing.count += curr.count
          } else {
            acc.push({ ...curr })
          }
          return acc
        }, [] as Array<{ status: string; count: number }>)

        return aggregated
      })
    ])

    // Calculate completion rate
    const completionRate = userStats.taskCount > 0 
      ? (userStats.completedTaskCount / userStats.taskCount) * 100 
      : 0

    return {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar
      },
      stats: {
        ...userStats,
        completionRate: Math.round(completionRate * 100) / 100
      },
      recentProjects,
      recentTasks,
      recentActivity,
      apiUsage: apiUsageStats,
      taskStatusDistribution,
      lastUpdated: new Date().toISOString()
    }
  })
})