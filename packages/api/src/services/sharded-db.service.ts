import { D1Database } from '@cloudflare/workers-types'
import { UniversalIdGenerator } from '../lib/sharding/universal-id'
import { DatabaseRouter } from '../lib/sharding/database-router'
import { ShardDeduplicationService } from '../lib/sharding/shard-dedup'
import { CrossShardQueryService, CrossShardQueryOptions } from './cross-shard-query.service'

export interface ShardedDbConfig {
  idGenerator: UniversalIdGenerator
  router: DatabaseRouter
  dedup?: ShardDeduplicationService
  enforceUniqueConstraints?: boolean
}

export class ShardedDbService {
  private idGenerator: UniversalIdGenerator
  private router: DatabaseRouter
  private dedup?: ShardDeduplicationService
  private enforceUniqueConstraints: boolean
  private crossShardQuery: CrossShardQueryService

  constructor(config: ShardedDbConfig) {
    this.idGenerator = config.idGenerator
    this.router = config.router
    this.dedup = config.dedup
    this.enforceUniqueConstraints = config.enforceUniqueConstraints ?? true
    this.crossShardQuery = new CrossShardQueryService(this.router, this)
  }

  async create<T extends Record<string, any>>(
    tableName: string,
    data: Omit<T, 'id'>,
    options?: { timestamp?: number; skipUniqueCheck?: boolean }
  ): Promise<T & { id: string }> {
    // Check unique constraints if enabled
    if (this.enforceUniqueConstraints && this.dedup && !options?.skipUniqueCheck) {
      const validation = await this.dedup.validateUniqueConstraints(tableName, data)
      if (!validation.valid) {
        throw new Error(`Unique constraint violation: ${validation.violations.join(', ')}`)
      }
    }

    // Get active shard for writing
    const { shardId, db } = await this.router.getActiveShardForWrite()

    // Generate new ID with shard information
    const id = await this.idGenerator.generate({
      shardId,
      recordType: tableName,
      timestamp: options?.timestamp,
    })

    // Prepare columns and values
    const columns = Object.keys(data)
    const placeholders = columns.map(() => '?').join(', ')
    const values = columns.map((col) => data[col])

    // Insert record
    await db
      .prepare(`
      INSERT INTO ${tableName} (id, ${columns.join(', ')})
      VALUES (?, ${placeholders})
    `)
      .bind(id, ...values)
      .run()

    return { id, ...data } as T & { id: string }
  }

  async findById<T>(tableName: string, id: string): Promise<T | null> {
    // Get the correct shard for this ID
    const db = await this.router.getShardForId(id)

    const result = await db
      .prepare(`
      SELECT * FROM ${tableName} WHERE id = ?
    `)
      .bind(id)
      .first<T>()

    return result || null
  }

  async findByIds<T>(tableName: string, ids: string[]): Promise<T[]> {
    if (ids.length === 0) return []

    return this.router.queryByIds(ids, async (db, shardIds) => {
      const placeholders = shardIds.map(() => '?').join(', ')
      const results = await db
        .prepare(`
        SELECT * FROM ${tableName} 
        WHERE id IN (${placeholders})
      `)
        .bind(...shardIds)
        .all<T>()

      return results.results
    })
  }

  async update<T extends Record<string, any>>(
    tableName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>,
    options?: { skipUniqueCheck?: boolean }
  ): Promise<boolean> {
    // Check unique constraints if enabled
    if (this.enforceUniqueConstraints && this.dedup && !options?.skipUniqueCheck) {
      const validation = await this.dedup.validateUniqueConstraints(tableName, data, id)
      if (!validation.valid) {
        throw new Error(`Unique constraint violation: ${validation.violations.join(', ')}`)
      }
    }

    // Get the correct shard for this ID
    const db = await this.router.getShardForId(id)

    // Prepare update statement
    const columns = Object.keys(data)
    const setClause = columns.map((col) => `${col} = ?`).join(', ')
    const values = columns.map((col) => data[col])

    const result = await db
      .prepare(`
      UPDATE ${tableName}
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `)
      .bind(...values, id)
      .run()

    return result.meta.changes > 0
  }

  async delete(tableName: string, id: string): Promise<boolean> {
    // Get the correct shard for this ID
    const db = await this.router.getShardForId(id)

    const result = await db
      .prepare(`
      DELETE FROM ${tableName} WHERE id = ?
    `)
      .bind(id)
      .run()

    return result.meta.changes > 0
  }

  async findAll<T>(
    tableName: string,
    options?: {
      where?: Record<string, any>
      orderBy?: string
      limit?: number
      offset?: number
      useGlobalSort?: boolean // New option to enable global sorting
    }
  ): Promise<T[]> {
    // Use cross-shard query orchestrator for global sorting/pagination
    if (options?.useGlobalSort && (options.orderBy || options.limit || options.offset)) {
      let query = `SELECT * FROM ${tableName}`
      const bindings: any[] = []

      // Add WHERE clause
      if (options.where && Object.keys(options.where).length > 0) {
        const whereConditions = Object.keys(options.where).map((key) => `${key} = ?`)
        query += ` WHERE ${whereConditions.join(' AND ')}`
        bindings.push(...Object.values(options.where))
      }

      // Parse orderBy to extract column and direction
      let orderByOptions: CrossShardQueryOptions['orderBy']
      if (options.orderBy) {
        const parts = options.orderBy.split(' ')
        orderByOptions = {
          column: parts[0],
          direction: (parts[1]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC',
        }
      }

      const result = await this.crossShardQuery.queryAllShardsWithGlobalSort<T>(query, bindings, {
        orderBy: orderByOptions,
        limit: options.limit,
        offset: options.offset,
      })

      return result.results
    }

    // Original implementation for backward compatibility
    return this.router.queryAll(async (db) => {
      let query = `SELECT * FROM ${tableName}`
      const bindings: any[] = []

      // Add WHERE clause
      if (options?.where && Object.keys(options.where).length > 0) {
        const whereConditions = Object.keys(options.where).map((key) => `${key} = ?`)
        query += ` WHERE ${whereConditions.join(' AND ')}`
        bindings.push(...Object.values(options.where))
      }

      // Add ORDER BY
      if (options?.orderBy) {
        query += ` ORDER BY ${options.orderBy}`
      }

      // Add LIMIT and OFFSET (applied per shard)
      if (options?.limit) {
        query += ` LIMIT ?`
        bindings.push(options.limit)
      }
      if (options?.offset) {
        query += ` OFFSET ?`
        bindings.push(options.offset)
      }

      const results = await db
        .prepare(query)
        .bind(...bindings)
        .all<T>()
      return results.results
    })
  }

  async count(tableName: string, where?: Record<string, any>): Promise<number> {
    const counts = await this.router.queryAll(async (db) => {
      let query = `SELECT COUNT(*) as count FROM ${tableName}`
      const bindings: any[] = []

      if (where && Object.keys(where).length > 0) {
        const whereConditions = Object.keys(where).map((key) => `${key} = ?`)
        query += ` WHERE ${whereConditions.join(' AND ')}`
        bindings.push(...Object.values(where))
      }

      const result = await db
        .prepare(query)
        .bind(...bindings)
        .first<{ count: number }>()
      return [result?.count || 0]
    })

    return counts.reduce((sum, count) => sum + count, 0)
  }

  async executeRaw<T>(
    query: string,
    bindings: any[],
    options?: {
      singleShard?: boolean
      shardId?: string
    }
  ): Promise<T[]> {
    if (options?.singleShard && options?.shardId) {
      // Execute on specific shard
      const db = (await this.router.getAllShards()).get(options.shardId)
      if (!db) {
        throw new Error(`Shard ${options.shardId} not found`)
      }
      const result = await db
        .prepare(query)
        .bind(...bindings)
        .all<T>()
      return result.results
    }

    // Execute across all shards
    return this.router.queryAll(async (db) => {
      const result = await db
        .prepare(query)
        .bind(...bindings)
        .all<T>()
      return result.results
    })
  }

  // Helper method to get shard statistics
  async getShardStats() {
    return this.router.getShardStats()
  }

  // Helper method to get active shard info
  getActiveShardInfo() {
    return {
      activeShardId: this.router.getActiveShardId(),
      totalShards: this.router.getAllShards().size,
    }
  }

  // Deduplication methods
  async checkUnique(
    table: string,
    column: string,
    value: any,
    excludeId?: string
  ): Promise<boolean> {
    if (!this.dedup) {
      throw new Error('Deduplication service not configured')
    }
    return this.dedup.checkUnique({ table, column, value, excludeId })
  }

  async findDuplicates(table: string, column: string) {
    if (!this.dedup) {
      throw new Error('Deduplication service not configured')
    }
    return this.dedup.findDuplicates(table, column)
  }

  async deduplicateTable(table: string, column: string, keepStrategy: 'first' | 'last' = 'first') {
    if (!this.dedup) {
      throw new Error('Deduplication service not configured')
    }
    return this.dedup.deduplicateTable(table, column, keepStrategy)
  }

  // Cross-shard query methods
  async queryWithGlobalSort<T>(
    query: string,
    params: unknown[] = [],
    options?: CrossShardQueryOptions
  ) {
    return this.crossShardQuery.queryAllShardsWithGlobalSort<T>(query, params, options)
  }

  async aggregate(tableName: string, options: CrossShardQueryOptions) {
    return this.crossShardQuery.aggregateAcrossShards(tableName, options)
  }

  async joinTables<T>(
    leftTable: string,
    rightTable: string,
    joinCondition: string,
    selectColumns: string[] = ['*'],
    where?: string,
    params: unknown[] = []
  ) {
    return this.crossShardQuery.joinAcrossShards<T>(
      leftTable,
      rightTable,
      joinCondition,
      selectColumns,
      where,
      params
    )
  }

  async executeDistributedTransaction(
    operations: Array<{
      shardId?: string
      query: string
      params: unknown[]
    }>
  ) {
    return this.crossShardQuery.executeDistributedTransaction(operations)
  }

  async *streamLargeDataset<T>(query: string, params: unknown[] = [], batchSize: number = 1000) {
    yield* this.crossShardQuery.streamFromAllShards<T>(query, params, batchSize)
  }
}
