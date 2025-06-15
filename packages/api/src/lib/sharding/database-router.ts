import { D1Database } from '@cloudflare/workers-types'
import { UniversalIdGenerator } from './universal-id'

export interface ShardMetadata {
  id: string
  bindingName: string
  currentSize: number
  maxSize: number
  recordCount: number
  createdAt: Date
  isActive: boolean
}

export interface DatabaseRouterConfig {
  maxShardSize: number // in bytes (default 8GB to leave room)
  shardPrefix: string // prefix for shard IDs
}

export class DatabaseRouter {
  private shards = new Map<string, D1Database>()
  private shardMetadata = new Map<string, ShardMetadata>()
  private activeShardId: string | null = null
  private idGenerator: UniversalIdGenerator
  private config: DatabaseRouterConfig

  constructor(
    env: Record<string, any>,
    idGenerator: UniversalIdGenerator,
    config?: Partial<DatabaseRouterConfig>
  ) {
    this.idGenerator = idGenerator
    this.config = {
      maxShardSize: config?.maxShardSize || 8 * 1024 * 1024 * 1024, // 8GB default
      shardPrefix: config?.shardPrefix || 'VOL',
    }
    this.initializeShards(env)
  }

  private initializeShards(env: Record<string, any>) {
    // Pattern: DB_VOL_<index>_<hash>
    const dbPattern = /^DB_VOL_(\d+)_([a-z0-9]+)$/

    for (const [key, value] of Object.entries(env)) {
      const match = key.match(dbPattern)
      if (match && value && typeof value === 'object') {
        const [, index, hash] = match
        const shardId = `${this.config.shardPrefix}_${index}_${hash}`

        this.shards.set(shardId, value as D1Database)

        // Initialize metadata (will be updated by monitoring)
        this.shardMetadata.set(shardId, {
          id: shardId,
          bindingName: key,
          currentSize: 0,
          maxSize: this.config.maxShardSize,
          recordCount: 0,
          createdAt: new Date(),
          isActive: true,
        })
      }
    }

    // Select the highest indexed shard as active
    const sortedShards = Array.from(this.shardMetadata.keys()).sort((a, b) => {
      const indexA = parseInt(a.split('_')[1])
      const indexB = parseInt(b.split('_')[1])
      return indexB - indexA
    })

    if (sortedShards.length > 0) {
      this.activeShardId = sortedShards[0]
    }
  }

  async updateShardMetadata(shardId: string): Promise<void> {
    const db = this.shards.get(shardId)
    if (!db) return

    try {
      // Get database size
      const sizeResult = await db
        .prepare(`
        SELECT page_count * page_size as size 
        FROM pragma_page_count(), pragma_page_size()
      `)
        .first<{ size: number }>()

      // Get total record count across all tables
      const tables = await db
        .prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `)
        .all()

      let totalRecords = 0
      for (const table of tables.results) {
        const countResult = await db
          .prepare(`
          SELECT COUNT(*) as count FROM ${table.name}
        `)
          .first<{ count: number }>()
        totalRecords += countResult?.count || 0
      }

      const metadata = this.shardMetadata.get(shardId)
      if (metadata) {
        metadata.currentSize = sizeResult?.size || 0
        metadata.recordCount = totalRecords

        // Check if shard should be marked inactive (>90% full)
        if (metadata.currentSize > metadata.maxSize * 0.9) {
          metadata.isActive = false
          if (this.activeShardId === shardId) {
            this.activeShardId = null
          }
        }
      }
    } catch (error) {
      console.error(`Failed to update metadata for shard ${shardId}:`, error)
    }
  }

  async getActiveShardForWrite(): Promise<{ shardId: string; db: D1Database }> {
    // Update metadata for active shard
    if (this.activeShardId) {
      await this.updateShardMetadata(this.activeShardId)
    }

    // Find an active shard with capacity
    for (const [shardId, metadata] of this.shardMetadata.entries()) {
      if (metadata.isActive && metadata.currentSize < metadata.maxSize * 0.9) {
        this.activeShardId = shardId
        return {
          shardId,
          db: this.shards.get(shardId)!,
        }
      }
    }

    throw new Error('No active shard available for writes. Please add a new shard.')
  }

  async getShardForId(id: string): Promise<D1Database> {
    const decoded = await this.idGenerator.decode(id)
    const db = this.shards.get(decoded.shardId)

    if (!db) {
      throw new Error(`Shard ${decoded.shardId} not found for ID ${id}`)
    }

    return db
  }

  async queryAll<T>(queryFn: (db: D1Database) => Promise<T[]>): Promise<T[]> {
    const results: T[] = []
    const promises: Promise<T[]>[] = []

    for (const [, db] of this.shards) {
      promises.push(queryFn(db))
    }

    const allResults = await Promise.all(promises)
    for (const result of allResults) {
      results.push(...result)
    }

    return results
  }

  async queryByIds<T>(
    ids: string[],
    queryFn: (db: D1Database, ids: string[]) => Promise<T[]>
  ): Promise<T[]> {
    // Group IDs by shard
    const idsByShhard = new Map<string, string[]>()

    for (const id of ids) {
      try {
        const decoded = await this.idGenerator.decode(id)
        const shardIds = idsByShhard.get(decoded.shardId) || []
        shardIds.push(id)
        idsByShhard.set(decoded.shardId, shardIds)
      } catch (error) {
        console.error(`Failed to decode ID ${id}:`, error)
      }
    }

    // Query each shard with its IDs
    const results: T[] = []
    const promises: Promise<T[]>[] = []

    for (const [shardId, shardIds] of idsByShhard) {
      const db = this.shards.get(shardId)
      if (db) {
        promises.push(queryFn(db, shardIds))
      }
    }

    const allResults = await Promise.all(promises)
    for (const result of allResults) {
      results.push(...result)
    }

    return results
  }

  getShardStats(): ShardMetadata[] {
    return Array.from(this.shardMetadata.values())
  }

  getAllShards(): Map<string, D1Database> {
    return new Map(this.shards)
  }

  getActiveShardId(): string | null {
    return this.activeShardId
  }
}
