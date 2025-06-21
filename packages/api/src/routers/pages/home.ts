import { desc, eq, and, sql } from 'drizzle-orm'
import { publicProcedure, protectedProcedure, router } from '../../trpc'
import { 
  ProjectTable, 
  TaskTable,
  user
} from '../../db/schema'

export const homeRouter = router({
  /**
   * Get home page data for authenticated users
   * This includes:
   * - User profile summary
   * - Featured/pinned projects
   * - Quick stats
   * - Recent notifications or updates
   */
  getAuthenticatedHomeData: protectedProcedure.query(async ({ ctx }) => {
    const { db, user: currentUser, shardContext } = ctx
    const userId = currentUser.id

    // Execute all queries in parallel
    const [
      userProfile,
      featuredProjects,
      quickStats,
      upcomingTasks
    ] = await Promise.all([
      // Get user profile with additional info
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt
        })
        .from(user)
        .where(eq(user.id, userId))
        .get(),

      // Get featured projects (most recently updated)
      shardContext.queryAcrossShards(async (shardDb) => {
        return await shardDb
          .select()
          .from(ProjectTable)
          .where(
            and(
              eq(ProjectTable.ownerId, userId),
              eq(ProjectTable.status, 'active')
            )
          )
          .orderBy(desc(ProjectTable.updatedAt))
          .limit(3)
      }).then(results => {
        // Flatten and sort results from all shards
        const allProjects = results.flat()
        return allProjects
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 3)
      }),

      // Quick stats for the user
      shardContext.queryAcrossShards(async (shardDb) => {
        const activeProjects = await shardDb
          .select({ count: sql<number>`count(*)` })
          .from(ProjectTable)
          .where(
            and(
              eq(ProjectTable.ownerId, userId),
              eq(ProjectTable.status, 'active')
            )
          )
          .get()

        const pendingTasks = await shardDb
          .select({ count: sql<number>`count(*)` })
          .from(TaskTable)
          .where(
            and(
              eq(TaskTable.assigneeId, userId),
              eq(TaskTable.status, 'todo')
            )
          )
          .get()

        const inProgressTasks = await shardDb
          .select({ count: sql<number>`count(*)` })
          .from(TaskTable)
          .where(
            and(
              eq(TaskTable.assigneeId, userId),
              eq(TaskTable.status, 'in_progress')
            )
          )
          .get()

        return {
          activeProjects: activeProjects?.count || 0,
          pendingTasks: pendingTasks?.count || 0,
          inProgressTasks: inProgressTasks?.count || 0
        }
      }).then(results => {
        // Aggregate results from all shards
        return results.reduce((acc, curr) => ({
          activeProjects: acc.activeProjects + curr.activeProjects,
          pendingTasks: acc.pendingTasks + curr.pendingTasks,
          inProgressTasks: acc.inProgressTasks + curr.inProgressTasks
        }), { activeProjects: 0, pendingTasks: 0, inProgressTasks: 0 })
      }),

      // Upcoming tasks (due soon)
      shardContext.queryAcrossShards(async (shardDb) => {
        const now = new Date()
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        return await shardDb
          .select()
          .from(TaskTable)
          .where(
            and(
              eq(TaskTable.assigneeId, userId),
              sql`${TaskTable.dueDate} IS NOT NULL`,
              sql`${TaskTable.dueDate} <= ${oneWeekFromNow}`,
              sql`${TaskTable.dueDate} >= ${now}`,
              sql`${TaskTable.status} != 'done'`
            )
          )
          .orderBy(TaskTable.dueDate)
          .limit(5)
      }).then(results => {
        // Flatten and sort results from all shards
        const allTasks = results.flat()
        return allTasks
          .sort((a, b) => {
            if (!a.dueDate || !b.dueDate) return 0
            return a.dueDate.getTime() - b.dueDate.getTime()
          })
          .slice(0, 5)
      })
    ])

    return {
      user: userProfile,
      featuredProjects,
      stats: quickStats,
      upcomingTasks,
      greeting: getGreeting(currentUser.name),
      lastUpdated: new Date().toISOString()
    }
  }),

  /**
   * Get public home page data for unauthenticated users
   * This could include:
   * - Platform statistics
   * - Featured public content
   * - General information
   */
  getPublicHomeData: publicProcedure.query(async ({ ctx }) => {
    const { db } = ctx

    // Get platform statistics
    const [totalUsers, platformStats] = await Promise.all([
      // Total user count
      db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .get(),

      // Platform-wide stats (you might want to cache these)
      Promise.resolve({
        totalProjects: 1000, // These could be cached values
        totalTasks: 5000,
        activeUsers: 250
      })
    ])

    return {
      stats: {
        totalUsers: totalUsers?.count || 0,
        ...platformStats
      },
      features: [
        {
          title: 'Project Management',
          description: 'Organize your projects efficiently',
          icon: 'folder'
        },
        {
          title: 'Task Tracking',
          description: 'Keep track of all your tasks',
          icon: 'check-square'
        },
        {
          title: 'AI Integration',
          description: 'Powered by advanced AI capabilities',
          icon: 'cpu'
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  })
})

// Helper function to generate personalized greeting
function getGreeting(name?: string | null): string {
  const hour = new Date().getHours()
  const timeGreeting = 
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening'
  
  return name ? `${timeGreeting}, ${name}!` : `${timeGreeting}!`
}