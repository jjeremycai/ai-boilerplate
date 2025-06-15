import { DatabaseRouter } from './database-router'
import { D1Database } from '@cloudflare/workers-types'

export interface UniqueConstraint {
  table: string
  column: string
  value: any
  excludeId?: string // For updates, exclude current record
}

export interface GlobalUniqueIndex {
  table: string
  columns: string[]
  name: string
}

export class ShardDeduplicationService {
  private router: DatabaseRouter
  private globalIndexes: Map<string, GlobalUniqueIndex> = new Map()

  constructor(router: DatabaseRouter) {
    this.router = router
    this.initializeGlobalIndexes()
  }

  private initializeGlobalIndexes() {
    // Define global unique constraints here
    this.addGlobalIndex({
      table: 'users',
      columns: ['email'],
      name: 'users_email_unique',
    })

    this.addGlobalIndex({
      table: 'users',
      columns: ['username'],
      name: 'users_username_unique',
    })

    // Add more global indexes as needed
  }

  addGlobalIndex(index: GlobalUniqueIndex) {
    this.globalIndexes.set(index.name, index)
  }

  /**
   * Check if a value already exists across all shards
   */
  async checkUnique(constraint: UniqueConstraint): Promise<boolean> {
    const { table, column, value, excludeId } = constraint

    // Query all shards in parallel
    const results = await this.router.queryAll(async (db: D1Database) => {
      let query = `SELECT id FROM ${table} WHERE ${column} = ?`
      const bindings: any[] = [value]

      if (excludeId) {
        query += ' AND id != ?'
        bindings.push(excludeId)
      }

      query += ' LIMIT 1'

      const result = await db
        .prepare(query)
        .bind(...bindings)
        .first()
      return result ? [result] : []
    })

    // If any shard has a matching record, it's not unique
    return results.length === 0
  }

  /**
   * Check multiple unique constraints at once
   */
  async checkMultipleUnique(constraints: UniqueConstraint[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()

    // Group constraints by table for efficiency
    const constraintsByTable = new Map<string, UniqueConstraint[]>()
    for (const constraint of constraints) {
      const existing = constraintsByTable.get(constraint.table) || []
      existing.push(constraint)
      constraintsByTable.set(constraint.table, existing)
    }

    // Check each table's constraints
    for (const [table, tableConstraints] of constraintsByTable) {
      const uniqueChecks = await Promise.all(
        tableConstraints.map(async (constraint) => {
          const isUnique = await this.checkUnique(constraint)
          return { constraint, isUnique }
        })
      )

      for (const { constraint, isUnique } of uniqueChecks) {
        const key = `${constraint.table}.${constraint.column}:${constraint.value}`
        results.set(key, isUnique)
      }
    }

    return results
  }

  /**
   * Find duplicates across all shards
   */
  async findDuplicates(
    table: string,
    column: string
  ): Promise<
    Array<{
      value: any
      count: number
      shardIds: string[]
    }>
  > {
    // Collect all values from all shards
    const valueMap = new Map<any, { count: number; shardIds: Set<string> }>()

    const shards = this.router.getAllShards()

    for (const [shardId, db] of shards) {
      const query = `
        SELECT ${column}, COUNT(*) as count 
        FROM ${table} 
        GROUP BY ${column} 
        HAVING COUNT(*) > 1
      `

      const results = await db.prepare(query).all()

      for (const row of results.results) {
        const value = row[column]
        const count = row.count as number

        if (!valueMap.has(value)) {
          valueMap.set(value, { count: 0, shardIds: new Set() })
        }

        const entry = valueMap.get(value)!
        entry.count += count
        entry.shardIds.add(shardId)
      }
    }

    // Also check for cross-shard duplicates
    const allValues = await this.getAllValues(table, column)
    const valueCounts = new Map<any, { count: number; shardIds: Set<string> }>()

    for (const { value, shardId } of allValues) {
      if (!valueCounts.has(value)) {
        valueCounts.set(value, { count: 0, shardIds: new Set() })
      }
      const entry = valueCounts.get(value)!
      entry.count++
      entry.shardIds.add(shardId)
    }

    // Merge results
    for (const [value, data] of valueCounts) {
      if (data.count > 1 && !valueMap.has(value)) {
        valueMap.set(value, data)
      }
    }

    // Convert to array
    return Array.from(valueMap.entries()).map(([value, data]) => ({
      value,
      count: data.count,
      shardIds: Array.from(data.shardIds),
    }))
  }

  /**
   * Get all values for a column across all shards
   */
  private async getAllValues(
    table: string,
    column: string
  ): Promise<
    Array<{
      value: any
      shardId: string
    }>
  > {
    const allValues: Array<{ value: any; shardId: string }> = []
    const shards = this.router.getAllShards()

    for (const [shardId, db] of shards) {
      const query = `SELECT DISTINCT ${column} FROM ${table}`
      const results = await db.prepare(query).all()

      for (const row of results.results) {
        allValues.push({
          value: row[column],
          shardId,
        })
      }
    }

    return allValues
  }

  /**
   * Validate that a record doesn't violate any global unique constraints
   */
  async validateUniqueConstraints(
    table: string,
    data: Record<string, any>,
    excludeId?: string
  ): Promise<{ valid: boolean; violations: string[] }> {
    const violations: string[] = []

    // Check each global index for this table
    for (const [, index] of this.globalIndexes) {
      if (index.table !== table) continue

      for (const column of index.columns) {
        if (column in data) {
          const isUnique = await this.checkUnique({
            table,
            column,
            value: data[column],
            excludeId,
          })

          if (!isUnique) {
            violations.push(`${column} '${data[column]}' already exists`)
          }
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    }
  }

  /**
   * Clean up duplicates by keeping only one copy
   */
  async deduplicateTable(
    table: string,
    column: string,
    keepStrategy: 'first' | 'last' = 'first'
  ): Promise<{ removed: number; kept: number }> {
    const duplicates = await this.findDuplicates(table, column)
    let removed = 0
    let kept = 0

    for (const duplicate of duplicates) {
      // Get all records with this duplicate value
      const records = await this.router.queryAll(async (db) => {
        const query = `
          SELECT id, created_at 
          FROM ${table} 
          WHERE ${column} = ?
          ORDER BY created_at ${keepStrategy === 'first' ? 'ASC' : 'DESC'}
        `
        const results = await db.prepare(query).bind(duplicate.value).all()
        return results.results
      })

      // Keep the first/last record, delete the rest
      const [keepRecord, ...deleteRecords] = records
      kept++

      // Delete duplicates
      for (const record of deleteRecords) {
        const db = await this.router.getShardForId(record.id as string)
        await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(record.id).run()
        removed++
      }
    }

    return { removed, kept }
  }
}
