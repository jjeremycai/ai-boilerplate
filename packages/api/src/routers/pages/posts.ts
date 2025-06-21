import { desc, eq, and, or, like, sql, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { publicProcedure, protectedProcedure, router } from '../../trpc'
import { 
  ProjectTable,
  TaskTable,
  CommentTable,
  user,
  ActivityLogTable
} from '../../db/schema'

const postsFilterSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'archived']).default('all'),
  sortBy: z.enum(['updated', 'created', 'name', 'activity']).default('updated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  userId: z.string().optional(), // Filter by specific user
  dateFrom: z.string().optional(), // ISO date string
  dateTo: z.string().optional(), // ISO date string
})

export const postsRouter = router({
  /**
   * Get paginated posts/projects listing with all related data
   * This includes:
   * - Project details
   * - Owner information
   * - Task counts
   * - Recent activity
   * - Comment counts
   */
  getPostsListing: publicProcedure
    .input(postsFilterSchema)
    .query(async ({ ctx, input }) => {
      const { db, user: currentUser, shardContext } = ctx
      const { page, limit, search, status, sortBy, sortOrder, userId, dateFrom, dateTo } = input
      const offset = (page - 1) * limit

      // Build where conditions
      const buildWhereConditions = () => {
        const conditions = []
        
        if (userId) {
          conditions.push(eq(ProjectTable.ownerId, userId))
        }
        
        if (status !== 'all') {
          conditions.push(eq(ProjectTable.status, status))
        }
        
        if (search) {
          conditions.push(
            or(
              like(ProjectTable.name, `%${search}%`),
              like(ProjectTable.description, `%${search}%`)
            )
          )
        }
        
        if (dateFrom) {
          conditions.push(gte(ProjectTable.createdAt, new Date(dateFrom)))
        }
        
        if (dateTo) {
          conditions.push(lte(ProjectTable.createdAt, new Date(dateTo)))
        }
        
        return conditions.length > 0 ? and(...conditions) : undefined
      }

      const whereConditions = buildWhereConditions()

      // Execute queries in parallel across shards
      const [projectsData, totalCount] = await Promise.all([
        // Get projects with pagination
        shardContext.queryAcrossShards(async (shardDb) => {
          const query = shardDb
            .select()
            .from(ProjectTable)
          
          if (whereConditions) {
            query.where(whereConditions)
          }

          // Note: We'll need to fetch all and then sort/paginate in memory
          // due to cross-shard querying limitations
          return await query
        }).then(async results => {
          // Flatten all projects from shards
          const allProjects = results.flat()
          
          // Sort based on sortBy and sortOrder
          allProjects.sort((a, b) => {
            let comparison = 0
            
            switch (sortBy) {
              case 'created':
                comparison = a.createdAt.getTime() - b.createdAt.getTime()
                break
              case 'updated':
                comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
                break
              case 'name':
                comparison = a.name.localeCompare(b.name)
                break
              default:
                comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
            }
            
            return sortOrder === 'desc' ? -comparison : comparison
          })
          
          // Apply pagination
          const paginatedProjects = allProjects.slice(offset, offset + limit)
          
          // Now fetch additional data for each project
          const projectsWithDetails = await Promise.all(
            paginatedProjects.map(async (project) => {
              // Get owner info
              const owner = await db
                .select({
                  id: user.id,
                  name: user.name,
                  avatar: user.avatar
                })
                .from(user)
                .where(eq(user.id, project.ownerId))
                .get()

              // Get task statistics from the appropriate shard
              const taskStats = await shardContext.queryAcrossShards(async (shardDb) => {
                const stats = await shardDb
                  .select({
                    total: sql<number>`count(*)`,
                    completed: sql<number>`count(case when status = 'done' then 1 end)`,
                    inProgress: sql<number>`count(case when status = 'in_progress' then 1 end)`
                  })
                  .from(TaskTable)
                  .where(eq(TaskTable.projectId, project.id))
                  .get()

                return stats || { total: 0, completed: 0, inProgress: 0 }
              }).then(results => {
                // Sum up stats from all shards
                return results.reduce((acc, curr) => ({
                  total: acc.total + curr.total,
                  completed: acc.completed + curr.completed,
                  inProgress: acc.inProgress + curr.inProgress
                }), { total: 0, completed: 0, inProgress: 0 })
              })

              // Get comment count
              const commentCount = await shardContext.queryAcrossShards(async (shardDb) => {
                const count = await shardDb
                  .select({ count: sql<number>`count(*)` })
                  .from(CommentTable)
                  .where(eq(CommentTable.projectId, project.id))
                  .get()

                return count?.count || 0
              }).then(results => results.reduce((sum, count) => sum + count, 0))

              // Get recent activity count
              const recentActivityCount = await shardContext.queryAcrossShards(async (shardDb) => {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                const count = await shardDb
                  .select({ count: sql<number>`count(*)` })
                  .from(ActivityLogTable)
                  .where(
                    and(
                      eq(ActivityLogTable.projectId, project.id),
                      gte(ActivityLogTable.createdAt, sevenDaysAgo)
                    )
                  )
                  .get()

                return count?.count || 0
              }).then(results => results.reduce((sum, count) => sum + count, 0))

              return {
                ...project,
                owner,
                stats: {
                  tasks: taskStats,
                  comments: commentCount,
                  recentActivity: recentActivityCount
                }
              }
            })
          )

          return projectsWithDetails
        }),

        // Get total count for pagination
        shardContext.queryAcrossShards(async (shardDb) => {
          const query = shardDb
            .select({ count: sql<number>`count(*)` })
            .from(ProjectTable)
          
          if (whereConditions) {
            query.where(whereConditions)
          }

          const result = await query.get()
          return result?.count || 0
        }).then(results => results.reduce((sum, count) => sum + count, 0))
      ])

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPreviousPage = page > 1

      // Get aggregate statistics
      const aggregateStats = await shardContext.queryAcrossShards(async (shardDb) => {
        const stats = await shardDb
          .select({
            totalProjects: sql<number>`count(*)`,
            activeProjects: sql<number>`count(case when status = 'active' then 1 end)`,
            archivedProjects: sql<number>`count(case when status = 'archived' then 1 end)`
          })
          .from(ProjectTable)
          .get()

        return stats || { totalProjects: 0, activeProjects: 0, archivedProjects: 0 }
      }).then(results => {
        return results.reduce((acc, curr) => ({
          totalProjects: acc.totalProjects + curr.totalProjects,
          activeProjects: acc.activeProjects + curr.activeProjects,
          archivedProjects: acc.archivedProjects + curr.archivedProjects
        }), { totalProjects: 0, activeProjects: 0, archivedProjects: 0 })
      })

      return {
        posts: projectsData,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage
        },
        filters: {
          search,
          status,
          sortBy,
          sortOrder,
          userId,
          dateFrom,
          dateTo
        },
        aggregateStats,
        lastUpdated: new Date().toISOString()
      }
    }),

  /**
   * Get a single post/project with all its details
   */
  getPostDetails: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, user: currentUser, shardContext } = ctx
      const { projectId } = input

      // Get project details from shards
      const project = await shardContext.queryAcrossShards(async (shardDb) => {
        return await shardDb
          .select()
          .from(ProjectTable)
          .where(eq(ProjectTable.id, projectId))
          .get()
      }).then(results => results.find(p => p !== undefined))

      if (!project) {
        throw new Error('Project not found')
      }

      // Fetch all related data in parallel
      const [
        owner,
        tasks,
        comments,
        recentActivity,
        contributors
      ] = await Promise.all([
        // Get owner details
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          })
          .from(user)
          .where(eq(user.id, project.ownerId))
          .get(),

        // Get all tasks
        shardContext.queryAcrossShards(async (shardDb) => {
          return await shardDb
            .select()
            .from(TaskTable)
            .where(eq(TaskTable.projectId, projectId))
            .orderBy(desc(TaskTable.createdAt))
        }).then(results => results.flat()),

        // Get recent comments
        shardContext.queryAcrossShards(async (shardDb) => {
          return await shardDb
            .select()
            .from(CommentTable)
            .where(eq(CommentTable.projectId, projectId))
            .orderBy(desc(CommentTable.createdAt))
            .limit(10)
        }).then(async results => {
          const allComments = results.flat()
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10)

          // Fetch author details for each comment
          const commentsWithAuthors = await Promise.all(
            allComments.map(async (comment) => {
              const author = await db
                .select({
                  id: user.id,
                  name: user.name,
                  avatar: user.avatar
                })
                .from(user)
                .where(eq(user.id, comment.authorId))
                .get()

              return { ...comment, author }
            })
          )

          return commentsWithAuthors
        }),

        // Get recent activity
        shardContext.queryAcrossShards(async (shardDb) => {
          return await shardDb
            .select()
            .from(ActivityLogTable)
            .where(eq(ActivityLogTable.projectId, projectId))
            .orderBy(desc(ActivityLogTable.createdAt))
            .limit(20)
        }).then(results => {
          const allActivity = results.flat()
          return allActivity
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 20)
        }),

        // Get unique contributors
        shardContext.queryAcrossShards(async (shardDb) => {
          const contributorIds = await shardDb
            .selectDistinct({ userId: ActivityLogTable.userId })
            .from(ActivityLogTable)
            .where(eq(ActivityLogTable.projectId, projectId))

          return contributorIds.map(c => c.userId)
        }).then(async results => {
          const uniqueUserIds = [...new Set(results.flat())]
          
          // Fetch user details for contributors
          const contributors = await Promise.all(
            uniqueUserIds.slice(0, 10).map(async (userId) => {
              return await db
                .select({
                  id: user.id,
                  name: user.name,
                  avatar: user.avatar
                })
                .from(user)
                .where(eq(user.id, userId))
                .get()
            })
          )

          return contributors.filter(c => c !== null)
        })
      ])

      // Calculate task statistics
      const taskStats = {
        total: tasks.length,
        byStatus: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        byPriority: tasks.reduce((acc, task) => {
          acc[task.priority] = (acc[task.priority] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      return {
        project,
        owner,
        tasks: tasks.slice(0, 10), // Return top 10 tasks
        taskStats,
        comments,
        recentActivity,
        contributors,
        isOwner: currentUser?.id === project.ownerId,
        canEdit: currentUser?.id === project.ownerId, // Add more permission logic as needed
        lastUpdated: new Date().toISOString()
      }
    })
})