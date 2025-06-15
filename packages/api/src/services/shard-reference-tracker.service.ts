import { DatabaseRouter } from '../lib/sharding/database-router'
import { ShardedDbService } from './sharded-db.service'

export interface ShardReference {
  sourceTable: string
  sourceId: string
  sourceShard: string
  targetTable: string
  targetId: string
  targetShard: string
  referenceType: 'foreign_key' | 'many_to_many' | 'soft_reference'
  created_at: Date
}

export interface ReferenceMap {
  [shardId: string]: {
    [table: string]: Set<string>
  }
}

export class ShardReferenceTracker {
  private referenceCache: Map<string, ShardReference[]> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(
    private router: DatabaseRouter,
    private shardedDb: ShardedDbService
  ) {}

  /**
   * Track a cross-shard reference when creating or updating records
   */
  async trackReference(reference: Omit<ShardReference, 'created_at'>): Promise<void> {
    const fullReference: ShardReference = {
      ...reference,
      created_at: new Date(),
    }

    // Store in a dedicated reference tracking table (if available)
    // For now, we'll maintain in-memory tracking with periodic persistence
    const cacheKey = `${reference.sourceTable}:${reference.sourceId}`

    const existing = this.referenceCache.get(cacheKey) || []
    existing.push(fullReference)
    this.referenceCache.set(cacheKey, existing)
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL)

    // Persist to database if we have a reference tracking table
    await this.persistReference(fullReference)
  }

  /**
   * Get all cross-shard references for a specific record
   */
  async getReferences(table: string, id: string): Promise<ShardReference[]> {
    const cacheKey = `${table}:${id}`

    // Check cache first
    if (this.referenceCache.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey) || 0
      if (Date.now() < expiry) {
        return this.referenceCache.get(cacheKey) || []
      }
    }

    // Load from database
    const references = await this.loadReferences(table, id)

    // Update cache
    this.referenceCache.set(cacheKey, references)
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL)

    return references
  }

  /**
   * Build a complete reference map showing which shards contain related data
   */
  async buildReferenceMap(rootTable: string, rootId: string): Promise<ReferenceMap> {
    const visited = new Set<string>()
    const referenceMap: ReferenceMap = {}

    await this.traverseReferences(rootTable, rootId, visited, referenceMap)

    return referenceMap
  }

  /**
   * Find all records that reference a specific record
   */
  async findInboundReferences(table: string, id: string): Promise<ShardReference[]> {
    const inboundRefs: ShardReference[] = []

    // Define relationships to check
    const relationships = this.getTableRelationships()

    for (const rel of relationships) {
      if (rel.targetTable === table) {
        // Query source table for references
        const query = `SELECT id FROM ${rel.sourceTable} WHERE ${rel.foreignKey} = ?`
        const results = await this.shardedDb.queryWithGlobalSort(query, [id])

        for (const record of results.results) {
          const reference: ShardReference = {
            sourceTable: rel.sourceTable,
            sourceId: record.id,
            sourceShard: this.getShardFromId(record.id),
            targetTable: table,
            targetId: id,
            targetShard: this.getShardFromId(id),
            referenceType: 'foreign_key',
            created_at: new Date(),
          }

          inboundRefs.push(reference)
        }
      }
    }

    return inboundRefs
  }

  /**
   * Validate all references for a record are still valid
   */
  async validateReferences(
    table: string,
    id: string
  ): Promise<{
    valid: boolean
    missingReferences: ShardReference[]
  }> {
    const references = await this.getReferences(table, id)
    const missingReferences: ShardReference[] = []

    for (const ref of references) {
      // Check if target record still exists
      const targetExists = await this.shardedDb.findById(ref.targetTable, ref.targetId)

      if (!targetExists) {
        missingReferences.push(ref)
      }
    }

    return {
      valid: missingReferences.length === 0,
      missingReferences,
    }
  }

  /**
   * Clean up stale references
   */
  async cleanupStaleReferences(): Promise<number> {
    let cleanedCount = 0

    // Go through cache and validate references
    for (const [key, references] of this.referenceCache) {
      const validReferences: ShardReference[] = []

      for (const ref of references) {
        const targetExists = await this.shardedDb.findById(ref.targetTable, ref.targetId)
        if (targetExists) {
          validReferences.push(ref)
        } else {
          cleanedCount++
        }
      }

      if (validReferences.length !== references.length) {
        this.referenceCache.set(key, validReferences)
      }
    }

    return cleanedCount
  }

  /**
   * Get shard distribution for related records
   */
  async getRelatedDataDistribution(
    table: string,
    id: string
  ): Promise<{
    shardDistribution: Record<string, number>
    totalRelatedRecords: number
    tables: Record<string, number>
  }> {
    const referenceMap = await this.buildReferenceMap(table, id)
    const shardDistribution: Record<string, number> = {}
    const tableCount: Record<string, number> = {}
    let totalRelatedRecords = 0

    for (const [shardId, tables] of Object.entries(referenceMap)) {
      let shardTotal = 0

      for (const [tableName, ids] of Object.entries(tables)) {
        const count = ids.size
        shardTotal += count
        tableCount[tableName] = (tableCount[tableName] || 0) + count
      }

      shardDistribution[shardId] = shardTotal
      totalRelatedRecords += shardTotal
    }

    return {
      shardDistribution,
      totalRelatedRecords,
      tables: tableCount,
    }
  }

  // Private helper methods

  private async traverseReferences(
    table: string,
    id: string,
    visited: Set<string>,
    referenceMap: ReferenceMap,
    depth: number = 0,
    maxDepth: number = 3
  ): Promise<void> {
    const key = `${table}:${id}`
    if (visited.has(key) || depth > maxDepth) {
      return
    }

    visited.add(key)

    // Add current record to map
    const shardId = this.getShardFromId(id)
    if (!referenceMap[shardId]) {
      referenceMap[shardId] = {}
    }
    if (!referenceMap[shardId][table]) {
      referenceMap[shardId][table] = new Set()
    }
    referenceMap[shardId][table].add(id)

    // Get all references from this record
    const references = await this.getReferences(table, id)

    // Traverse each reference
    for (const ref of references) {
      await this.traverseReferences(
        ref.targetTable,
        ref.targetId,
        visited,
        referenceMap,
        depth + 1,
        maxDepth
      )
    }
  }

  private async persistReference(reference: ShardReference): Promise<void> {
    // In a production system, you would store this in a dedicated table
    // For now, we'll just log it
    console.log('Tracking cross-shard reference:', {
      from: `${reference.sourceTable}:${reference.sourceId} (${reference.sourceShard})`,
      to: `${reference.targetTable}:${reference.targetId} (${reference.targetShard})`,
      type: reference.referenceType,
    })
  }

  private async loadReferences(table: string, id: string): Promise<ShardReference[]> {
    const references: ShardReference[] = []
    const record = await this.shardedDb.findById(table, id)

    if (!record) {
      return references
    }

    // Load references based on table relationships
    const relationships = this.getTableRelationships()

    for (const rel of relationships) {
      if (rel.sourceTable === table && record[rel.foreignKey]) {
        const targetId = record[rel.foreignKey]
        references.push({
          sourceTable: table,
          sourceId: id,
          sourceShard: this.getShardFromId(id),
          targetTable: rel.targetTable,
          targetId: targetId,
          targetShard: this.getShardFromId(targetId),
          referenceType: 'foreign_key',
          created_at: new Date(),
        })
      }
    }

    // Handle many-to-many relationships
    if (table === 'tasks') {
      // Load task_tags
      const taskTags = await this.shardedDb.queryWithGlobalSort(
        'SELECT tag_id FROM task_tags WHERE task_id = ?',
        [id]
      )

      for (const tt of taskTags.results) {
        references.push({
          sourceTable: 'tasks',
          sourceId: id,
          sourceShard: this.getShardFromId(id),
          targetTable: 'tags',
          targetId: tt.tag_id,
          targetShard: this.getShardFromId(tt.tag_id),
          referenceType: 'many_to_many',
          created_at: new Date(),
        })
      }
    }

    return references
  }

  private getTableRelationships(): Array<{
    sourceTable: string
    targetTable: string
    foreignKey: string
  }> {
    return [
      { sourceTable: 'projects', targetTable: 'users', foreignKey: 'user_id' },
      { sourceTable: 'tasks', targetTable: 'projects', foreignKey: 'project_id' },
      { sourceTable: 'tasks', targetTable: 'users', foreignKey: 'user_id' },
      { sourceTable: 'tags', targetTable: 'users', foreignKey: 'user_id' },
      { sourceTable: 'items', targetTable: 'users', foreignKey: 'userId' },
    ]
  }

  private getShardFromId(id: string): string {
    try {
      const UniversalIdGenerator = require('../lib/sharding/universal-id')
      const parsed = UniversalIdGenerator.parseId(id)
      return parsed?.shardId || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  /**
   * Export reference tracking data for analysis
   */
  async exportReferenceData(): Promise<{
    totalReferences: number
    crossShardReferences: number
    referencesByType: Record<string, number>
    hotSpots: Array<{ table: string; id: string; referenceCount: number }>
  }> {
    let totalReferences = 0
    let crossShardReferences = 0
    const referencesByType: Record<string, number> = {}
    const recordReferenceCounts: Map<string, number> = new Map()

    // Analyze all cached references
    for (const [key, references] of this.referenceCache) {
      totalReferences += references.length
      recordReferenceCounts.set(key, references.length)

      for (const ref of references) {
        if (ref.sourceShard !== ref.targetShard) {
          crossShardReferences++
        }

        referencesByType[ref.referenceType] = (referencesByType[ref.referenceType] || 0) + 1
      }
    }

    // Find hot spots (records with many references)
    const hotSpots = Array.from(recordReferenceCounts.entries())
      .map(([key, count]) => {
        const [table, id] = key.split(':')
        return { table, id, referenceCount: count }
      })
      .sort((a, b) => b.referenceCount - a.referenceCount)
      .slice(0, 10)

    return {
      totalReferences,
      crossShardReferences,
      referencesByType,
      hotSpots,
    }
  }
}
