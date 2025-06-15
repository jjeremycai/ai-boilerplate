import { DatabaseRouter } from '../lib/sharding/database-router'
import { ShardedDbService } from './sharded-db.service'
import { D1Result } from '@cloudflare/workers-types'

export interface QueryResult<T = unknown> {
  results: T[]
  meta: {
    totalCount: number
    shardCounts: Record<string, number>
    executionTime: number
  }
}

export interface CrossShardQueryOptions {
  orderBy?: {
    column: string
    direction: 'ASC' | 'DESC'
  }
  limit?: number
  offset?: number
  aggregations?: {
    count?: boolean
    sum?: string[]
    avg?: string[]
    min?: string[]
    max?: string[]
    groupBy?: string[]
  }
}

export interface ShardQueryResult<T = unknown> {
  shardId: string
  results: T[]
  error?: Error
}

export class CrossShardQueryService {
  constructor(
    private router: DatabaseRouter,
    private shardedDb: ShardedDbService
  ) {}

  /**
   * Execute a query across all shards with global sorting and pagination
   */
  async queryAllShardsWithGlobalSort<T = unknown>(
    query: string,
    params: unknown[] = [],
    options: CrossShardQueryOptions = {}
  ): Promise<QueryResult<T>> {
    const startTime = Date.now()
    const { orderBy, limit, offset = 0 } = options

    // Execute query on all shards in parallel
    const shardResults = await this.executeQueryOnAllShards<T>(query, params)

    // Collect all results and errors
    const allResults: T[] = []
    const shardCounts: Record<string, number> = {}
    const errors: Array<{ shardId: string; error: Error }> = []

    for (const result of shardResults) {
      if (result.error) {
        errors.push({ shardId: result.shardId, error: result.error })
      } else {
        allResults.push(...result.results)
        shardCounts[result.shardId] = result.results.length
      }
    }

    // Handle errors if any
    if (errors.length > 0) {
      console.error('Errors from shards:', errors)
      // Continue with partial results if some shards succeeded
    }

    // Apply global sorting if specified
    let sortedResults = allResults
    if (orderBy) {
      sortedResults = this.sortResults(allResults, orderBy)
    }

    // Apply global pagination
    const paginatedResults = limit
      ? sortedResults.slice(offset, offset + limit)
      : sortedResults.slice(offset)

    return {
      results: paginatedResults,
      meta: {
        totalCount: allResults.length,
        shardCounts,
        executionTime: Date.now() - startTime,
      },
    }
  }

  /**
   * Execute aggregation queries across all shards
   */
  async aggregateAcrossShards(tableName: string, options: CrossShardQueryOptions): Promise<any> {
    const { aggregations } = options
    if (!aggregations) {
      throw new Error('Aggregations must be specified')
    }

    const startTime = Date.now()
    const results: any = {}

    // Build aggregation queries
    const queries = this.buildAggregationQueries(tableName, aggregations)

    // Execute on all shards
    const shardResults = await Promise.all(
      queries.map(({ query, type, columns }) =>
        this.executeAggregationOnAllShards(query, type, columns)
      )
    )

    // Combine results based on aggregation type
    if (aggregations.count) {
      results.count = shardResults.find((r) => r.type === 'count')?.value || 0
    }

    if (aggregations.sum) {
      const sumResults = shardResults.find((r) => r.type === 'sum')
      results.sum = sumResults?.value || {}
    }

    if (aggregations.avg) {
      const avgResults = shardResults.find((r) => r.type === 'avg')
      results.avg = avgResults?.value || {}
    }

    if (aggregations.min) {
      const minResults = shardResults.find((r) => r.type === 'min')
      results.min = minResults?.value || {}
    }

    if (aggregations.max) {
      const maxResults = shardResults.find((r) => r.type === 'max')
      results.max = maxResults?.value || {}
    }

    if (aggregations.groupBy) {
      const groupResults = shardResults.find((r) => r.type === 'group')
      results.groups = groupResults?.value || []
    }

    return {
      ...results,
      meta: {
        executionTime: Date.now() - startTime,
      },
    }
  }

  /**
   * Perform cross-shard joins (simplified version)
   */
  async joinAcrossShards<T = unknown>(
    leftTable: string,
    rightTable: string,
    joinCondition: string,
    selectColumns: string[] = ['*'],
    where?: string,
    params: unknown[] = []
  ): Promise<QueryResult<T>> {
    const startTime = Date.now()

    // Strategy: Fetch data from both tables across all shards,
    // then perform in-memory join
    const leftQuery = `SELECT * FROM ${leftTable}${where ? ` WHERE ${where}` : ''}`
    const rightQuery = `SELECT * FROM ${rightTable}`

    const [leftResults, rightResults] = await Promise.all([
      this.queryAllShardsWithGlobalSort<any>(leftQuery, params),
      this.queryAllShardsWithGlobalSort<any>(rightQuery, []),
    ])

    // Perform in-memory join (simplified hash join)
    const joinedResults = this.performInMemoryJoin(
      leftResults.results,
      rightResults.results,
      joinCondition,
      selectColumns
    )

    return {
      results: joinedResults as T[],
      meta: {
        totalCount: joinedResults.length,
        shardCounts: {
          left: leftResults.meta.totalCount,
          right: rightResults.meta.totalCount,
        },
        executionTime: Date.now() - startTime,
      },
    }
  }

  /**
   * Execute distributed transaction across shards
   */
  async executeDistributedTransaction(
    operations: Array<{
      shardId?: string // If not specified, will be determined by router
      query: string
      params: unknown[]
    }>
  ): Promise<{ success: boolean; results: any[]; errors?: any[] }> {
    const startTime = Date.now()
    const results: any[] = []
    const errors: any[] = []

    // Group operations by shard
    const operationsByShard = new Map<string, typeof operations>()

    for (const op of operations) {
      const shardId = op.shardId || (await this.determineShardForOperation(op))
      if (!operationsByShard.has(shardId)) {
        operationsByShard.set(shardId, [])
      }
      operationsByShard.get(shardId)!.push(op)
    }

    // Execute transactions on each shard
    const shardPromises = Array.from(operationsByShard.entries()).map(
      async ([shardId, shardOps]) => {
        try {
          const db = this.router.getAllShards().get(shardId)
          if (!db) {
            throw new Error(`Shard ${shardId} not found`)
          }

          // Execute all operations for this shard in a transaction
          const shardResults = await db.batch(
            shardOps.map((op) => db.prepare(op.query).bind(...op.params))
          )

          return { shardId, success: true, results: shardResults }
        } catch (error) {
          return { shardId, success: false, error }
        }
      }
    )

    const shardResults = await Promise.all(shardPromises)

    // Check if all shards succeeded
    const allSucceeded = shardResults.every((r) => r.success)

    if (allSucceeded) {
      // Collect all results
      for (const result of shardResults) {
        results.push(...(result.results || []))
      }
      return { success: true, results }
    } else {
      // Collect errors
      for (const result of shardResults) {
        if (!result.success) {
          errors.push({
            shardId: result.shardId,
            error: result.error,
          })
        }
      }
      // In a real distributed system, we would implement 2PC or Saga pattern
      // For now, we just report the failure
      return { success: false, results: [], errors }
    }
  }

  /**
   * Stream results from all shards for large datasets
   */
  async *streamFromAllShards<T = unknown>(
    query: string,
    params: unknown[] = [],
    batchSize: number = 1000
  ): AsyncGenerator<T[], void, unknown> {
    const shards = this.router.getAllShards()

    for (const [shardId, db] of shards) {
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const batchQuery = `${query} LIMIT ${batchSize} OFFSET ${offset}`
        try {
          const result = await db
            .prepare(batchQuery)
            .bind(...params)
            .all<T>()

          if (result.results.length > 0) {
            yield result.results
            offset += batchSize
          }

          hasMore = result.results.length === batchSize
        } catch (error) {
          console.error(`Error streaming from shard ${shardId}:`, error)
          hasMore = false
        }
      }
    }
  }

  // Private helper methods

  private async executeQueryOnAllShards<T>(
    query: string,
    params: unknown[]
  ): Promise<ShardQueryResult<T>[]> {
    const shards = this.router.getAllShards()
    const promises: Promise<ShardQueryResult<T>>[] = []

    for (const [shardId, db] of shards) {
      promises.push(
        (async () => {
          try {
            const result = await db
              .prepare(query)
              .bind(...params)
              .all<T>()
            return {
              shardId: shardId,
              results: result.results,
            }
          } catch (error) {
            return {
              shardId: shardId,
              results: [],
              error: error as Error,
            }
          }
        })()
      )
    }

    return Promise.all(promises)
  }

  private sortResults<T>(
    results: T[],
    orderBy: { column: string; direction: 'ASC' | 'DESC' }
  ): T[] {
    return results.sort((a, b) => {
      const aValue = (a as any)[orderBy.column]
      const bValue = (b as any)[orderBy.column]

      if (aValue === bValue) return 0

      const comparison = aValue < bValue ? -1 : 1
      return orderBy.direction === 'ASC' ? comparison : -comparison
    })
  }

  private buildAggregationQueries(
    tableName: string,
    aggregations: NonNullable<CrossShardQueryOptions['aggregations']>
  ): Array<{ query: string; type: string; columns?: string[] }> {
    const queries: Array<{ query: string; type: string; columns?: string[] }> = []

    if (aggregations.count) {
      queries.push({
        query: `SELECT COUNT(*) as count FROM ${tableName}`,
        type: 'count',
      })
    }

    if (aggregations.sum) {
      const columns = aggregations.sum.join(', ')
      queries.push({
        query: `SELECT ${aggregations.sum.map((col) => `SUM(${col}) as sum_${col}`).join(', ')} FROM ${tableName}`,
        type: 'sum',
        columns: aggregations.sum,
      })
    }

    if (aggregations.avg) {
      queries.push({
        query: `SELECT ${aggregations.avg.map((col) => `AVG(${col}) as avg_${col}`).join(', ')} FROM ${tableName}`,
        type: 'avg',
        columns: aggregations.avg,
      })
    }

    if (aggregations.min) {
      queries.push({
        query: `SELECT ${aggregations.min.map((col) => `MIN(${col}) as min_${col}`).join(', ')} FROM ${tableName}`,
        type: 'min',
        columns: aggregations.min,
      })
    }

    if (aggregations.max) {
      queries.push({
        query: `SELECT ${aggregations.max.map((col) => `MAX(${col}) as max_${col}`).join(', ')} FROM ${tableName}`,
        type: 'max',
        columns: aggregations.max,
      })
    }

    if (aggregations.groupBy) {
      const groupColumns = aggregations.groupBy.join(', ')
      queries.push({
        query: `SELECT ${groupColumns}, COUNT(*) as count FROM ${tableName} GROUP BY ${groupColumns}`,
        type: 'group',
      })
    }

    return queries
  }

  private async executeAggregationOnAllShards(
    query: string,
    type: string,
    columns?: string[]
  ): Promise<{ type: string; value: any }> {
    const results = await this.executeQueryOnAllShards<any>(query, [])

    switch (type) {
      case 'count':
        const totalCount = results.reduce((sum, r) => {
          if (!r.error && r.results[0]) {
            return sum + (r.results[0].count || 0)
          }
          return sum
        }, 0)
        return { type, value: totalCount }

      case 'sum':
        const sums: Record<string, number> = {}
        columns?.forEach((col) => {
          sums[col] = results.reduce((sum, r) => {
            if (!r.error && r.results[0]) {
              return sum + (r.results[0][`sum_${col}`] || 0)
            }
            return sum
          }, 0)
        })
        return { type, value: sums }

      case 'avg':
        // For AVG, we need to calculate weighted average
        const avgs: Record<string, number> = {}
        columns?.forEach((col) => {
          let totalSum = 0
          let totalCount = 0
          results.forEach((r) => {
            if (!r.error && r.results[0]) {
              // This is simplified - in production, we'd need count per shard
              totalSum += r.results[0][`avg_${col}`] || 0
              totalCount += 1
            }
          })
          avgs[col] = totalCount > 0 ? totalSum / totalCount : 0
        })
        return { type, value: avgs }

      case 'min':
        const mins: Record<string, any> = {}
        columns?.forEach((col) => {
          let minValue: any = null
          results.forEach((r) => {
            if (!r.error && r.results[0]) {
              const value = r.results[0][`min_${col}`]
              if (minValue === null || value < minValue) {
                minValue = value
              }
            }
          })
          mins[col] = minValue
        })
        return { type, value: mins }

      case 'max':
        const maxs: Record<string, any> = {}
        columns?.forEach((col) => {
          let maxValue: any = null
          results.forEach((r) => {
            if (!r.error && r.results[0]) {
              const value = r.results[0][`max_${col}`]
              if (maxValue === null || value > maxValue) {
                maxValue = value
              }
            }
          })
          maxs[col] = maxValue
        })
        return { type, value: maxs }

      case 'group':
        // Merge group results from all shards
        const groupMap = new Map<string, number>()
        results.forEach((r) => {
          if (!r.error) {
            r.results.forEach((group) => {
              const key = JSON.stringify(
                Object.keys(group)
                  .filter((k) => k !== 'count')
                  .reduce((obj, k) => ({ ...obj, [k]: group[k] }), {})
              )
              groupMap.set(key, (groupMap.get(key) || 0) + group.count)
            })
          }
        })

        const groups = Array.from(groupMap.entries()).map(([key, count]) => ({
          ...JSON.parse(key),
          count,
        }))
        return { type, value: groups }

      default:
        return { type, value: null }
    }
  }

  private performInMemoryJoin(
    leftData: any[],
    rightData: any[],
    joinCondition: string,
    selectColumns: string[]
  ): any[] {
    // Parse join condition (simplified - assumes format: "left.col = right.col")
    const match = joinCondition.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/)
    if (!match) {
      throw new Error('Invalid join condition format')
    }

    const [, leftTable, leftCol, rightTable, rightCol] = match

    // Create index on right data for efficient lookup
    const rightIndex = new Map<any, any[]>()
    rightData.forEach((row) => {
      const key = row[rightCol]
      if (!rightIndex.has(key)) {
        rightIndex.set(key, [])
      }
      rightIndex.get(key)!.push(row)
    })

    // Perform join
    const results: any[] = []
    leftData.forEach((leftRow) => {
      const key = leftRow[leftCol]
      const rightRows = rightIndex.get(key) || []

      rightRows.forEach((rightRow) => {
        const joinedRow: any = {}

        // Select specified columns or all columns
        if (selectColumns.includes('*')) {
          Object.assign(joinedRow, leftRow, rightRow)
        } else {
          selectColumns.forEach((col) => {
            if (col.includes('.')) {
              const [table, column] = col.split('.')
              if (table === leftTable) {
                joinedRow[col] = leftRow[column]
              } else if (table === rightTable) {
                joinedRow[col] = rightRow[column]
              }
            } else {
              // Try both tables
              joinedRow[col] = leftRow[col] !== undefined ? leftRow[col] : rightRow[col]
            }
          })
        }

        results.push(joinedRow)
      })
    })

    return results
  }

  private async determineShardForOperation(operation: {
    query: string
    params: unknown[]
  }): Promise<string> {
    // Parse query to determine if it's an INSERT and extract table
    const insertMatch = operation.query.match(/INSERT\s+INTO\s+(\w+)/i)
    if (insertMatch) {
      // For inserts, use the router to get active shard for writes
      const activeShard = await this.router.getActiveShardForWrite()
      return activeShard.shardId
    }

    // For updates/deletes, we need to determine shard from ID
    // This is simplified - in production, we'd parse the WHERE clause
    const idMatch = operation.query.match(/WHERE\s+id\s*=\s*['"]?(\w+)['"]?/i)
    if (idMatch && idMatch[1]) {
      const universalId = require('../lib/sharding/universal-id')
      const shardInfo = universalId.parseId(idMatch[1])
      if (shardInfo?.shardId) {
        return shardInfo.shardId
      }
    }

    // Default to first active shard
    const activeShard = await this.router.getActiveShardForWrite()
    return activeShard.shardId
  }
}
