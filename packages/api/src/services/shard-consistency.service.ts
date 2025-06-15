import { DatabaseRouter } from '../lib/sharding/database-router'
import { ShardedDbService } from './sharded-db.service'

interface ConsistencyCheckResult {
  checkType: string
  status: 'passed' | 'failed' | 'warning'
  details: any
  timestamp: Date
}

interface IntegrityViolation {
  type: string
  shardId: string
  recordId: string
  details: string
}

export class ShardConsistencyService {
  constructor(
    private router: DatabaseRouter,
    private shardedDb: ShardedDbService
  ) {}

  /**
   * Run comprehensive consistency checks across all shards
   */
  async runConsistencyChecks(): Promise<ConsistencyCheckResult[]> {
    const results: ConsistencyCheckResult[] = []

    // Check 1: Foreign key integrity across shards
    results.push(await this.checkCrossShardForeignKeys())

    // Check 2: Unique constraint violations across shards
    results.push(await this.checkCrossShardUniqueConstraints())

    // Check 3: Orphaned records check
    results.push(await this.checkOrphanedRecords())

    // Check 4: Data distribution balance
    results.push(await this.checkShardBalance())

    // Check 5: Timestamp consistency
    results.push(await this.checkTimestampConsistency())

    // Check 6: ID format consistency
    results.push(await this.checkIdFormatConsistency())

    return results
  }

  /**
   * Check foreign key integrity across shards
   */
  private async checkCrossShardForeignKeys(): Promise<ConsistencyCheckResult> {
    const violations: IntegrityViolation[] = []
    const startTime = Date.now()

    try {
      // Check tasks -> projects relationships
      const tasksWithProjects = await this.shardedDb.queryWithGlobalSort(
        `SELECT t.id as task_id, t.project_id, p.id as project_exists
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id`,
        []
      )

      for (const record of tasksWithProjects.results) {
        if (!record.project_exists && record.project_id) {
          // Project doesn't exist, check if it's on another shard
          const projectOnOtherShard = await this.shardedDb.findById('projects', record.project_id)

          if (!projectOnOtherShard) {
            violations.push({
              type: 'missing_foreign_key',
              shardId: this.getShardFromId(record.task_id),
              recordId: record.task_id,
              details: `Task references non-existent project: ${record.project_id}`,
            })
          }
        }
      }

      // Check tasks -> users relationships
      const tasksWithUsers = await this.shardedDb.queryWithGlobalSort(
        `SELECT t.id as task_id, t.user_id, u.id as user_exists
         FROM tasks t
         LEFT JOIN users u ON t.user_id = u.id`,
        []
      )

      for (const record of tasksWithUsers.results) {
        if (!record.user_exists && record.user_id) {
          const userOnOtherShard = await this.shardedDb.findById('users', record.user_id)

          if (!userOnOtherShard) {
            violations.push({
              type: 'missing_foreign_key',
              shardId: this.getShardFromId(record.task_id),
              recordId: record.task_id,
              details: `Task references non-existent user: ${record.user_id}`,
            })
          }
        }
      }

      return {
        checkType: 'foreign_key_integrity',
        status: violations.length === 0 ? 'passed' : 'failed',
        details: {
          violationCount: violations.length,
          violations: violations.slice(0, 10), // Limit to first 10
          executionTime: Date.now() - startTime,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: 'foreign_key_integrity',
        status: 'failed',
        details: { error: error.message },
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check for unique constraint violations across shards
   */
  private async checkCrossShardUniqueConstraints(): Promise<ConsistencyCheckResult> {
    const violations: IntegrityViolation[] = []
    const startTime = Date.now()

    try {
      // Check email uniqueness in users table
      const emailDuplicates = await this.shardedDb.queryWithGlobalSort(
        `SELECT email, COUNT(*) as count, GROUP_CONCAT(id) as ids
         FROM users
         GROUP BY email
         HAVING count > 1`,
        []
      )

      for (const dup of emailDuplicates.results) {
        violations.push({
          type: 'unique_constraint_violation',
          shardId: 'multiple',
          recordId: dup.ids,
          details: `Email ${dup.email} exists ${dup.count} times`,
        })
      }

      // Check user_id + name uniqueness in tags table
      const tagDuplicates = await this.shardedDb.queryWithGlobalSort(
        `SELECT user_id, name, COUNT(*) as count, GROUP_CONCAT(id) as ids
         FROM tags
         GROUP BY user_id, name
         HAVING count > 1`,
        []
      )

      for (const dup of tagDuplicates.results) {
        violations.push({
          type: 'unique_constraint_violation',
          shardId: 'multiple',
          recordId: dup.ids,
          details: `Tag "${dup.name}" for user ${dup.user_id} exists ${dup.count} times`,
        })
      }

      return {
        checkType: 'unique_constraints',
        status: violations.length === 0 ? 'passed' : 'failed',
        details: {
          violationCount: violations.length,
          violations: violations.slice(0, 10),
          executionTime: Date.now() - startTime,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: 'unique_constraints',
        status: 'failed',
        details: { error: error.message },
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check for orphaned records
   */
  private async checkOrphanedRecords(): Promise<ConsistencyCheckResult> {
    const orphans: IntegrityViolation[] = []
    const startTime = Date.now()

    try {
      // Check for task_tags referencing non-existent tasks
      const orphanedTaskTags = await this.shardedDb.queryWithGlobalSort(
        `SELECT tt.task_id, tt.tag_id
         FROM task_tags tt
         LEFT JOIN tasks t ON tt.task_id = t.id
         WHERE t.id IS NULL`,
        []
      )

      for (const orphan of orphanedTaskTags.results) {
        orphans.push({
          type: 'orphaned_junction_record',
          shardId: this.getShardFromId(orphan.task_id),
          recordId: `${orphan.task_id}-${orphan.tag_id}`,
          details: `task_tags record references non-existent task: ${orphan.task_id}`,
        })
      }

      // Check for task_tags referencing non-existent tags
      const orphanedTagRefs = await this.shardedDb.queryWithGlobalSort(
        `SELECT tt.task_id, tt.tag_id
         FROM task_tags tt
         LEFT JOIN tags tg ON tt.tag_id = tg.id
         WHERE tg.id IS NULL`,
        []
      )

      for (const orphan of orphanedTagRefs.results) {
        orphans.push({
          type: 'orphaned_junction_record',
          shardId: this.getShardFromId(orphan.tag_id),
          recordId: `${orphan.task_id}-${orphan.tag_id}`,
          details: `task_tags record references non-existent tag: ${orphan.tag_id}`,
        })
      }

      return {
        checkType: 'orphaned_records',
        status: orphans.length === 0 ? 'passed' : orphans.length < 10 ? 'warning' : 'failed',
        details: {
          orphanCount: orphans.length,
          orphans: orphans.slice(0, 10),
          executionTime: Date.now() - startTime,
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: 'orphaned_records',
        status: 'failed',
        details: { error: error.message },
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check shard balance and distribution
   */
  private async checkShardBalance(): Promise<ConsistencyCheckResult> {
    try {
      const stats = await this.shardedDb.getShardStats()
      const shardSizes = Object.values(stats).map((s: any) => s.size)

      if (shardSizes.length === 0) {
        return {
          checkType: 'shard_balance',
          status: 'warning',
          details: { message: 'No shards found' },
          timestamp: new Date(),
        }
      }

      const avgSize = shardSizes.reduce((a, b) => a + b, 0) / shardSizes.length
      const maxSize = Math.max(...shardSizes)
      const minSize = Math.min(...shardSizes)
      const imbalanceRatio = avgSize > 0 ? (maxSize - minSize) / avgSize : 0

      const tableDistribution: Record<string, any> = {}
      const tables = ['users', 'projects', 'tasks', 'tags', 'items']

      for (const table of tables) {
        const distribution = await this.getTableDistribution(table)
        tableDistribution[table] = distribution
      }

      return {
        checkType: 'shard_balance',
        status: imbalanceRatio < 0.2 ? 'passed' : imbalanceRatio < 0.5 ? 'warning' : 'failed',
        details: {
          shardCount: shardSizes.length,
          averageSize: avgSize,
          maxSize,
          minSize,
          imbalanceRatio: (imbalanceRatio * 100).toFixed(2) + '%',
          tableDistribution,
          recommendation:
            imbalanceRatio > 0.5
              ? 'Consider rebalancing shards or adjusting write distribution'
              : 'Shard distribution is acceptable',
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: 'shard_balance',
        status: 'failed',
        details: { error: error.message },
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check timestamp consistency
   */
  private async checkTimestampConsistency(): Promise<ConsistencyCheckResult> {
    const issues: any[] = []

    try {
      // Check for future timestamps
      const tables = ['users', 'projects', 'tasks', 'items']

      for (const table of tables) {
        const futureRecords = await this.shardedDb.queryWithGlobalSort(
          `SELECT id, created_at, updated_at
           FROM ${table}
           WHERE created_at > datetime('now') 
              OR updated_at > datetime('now')
              OR updated_at < created_at`,
          [],
          { limit: 10 }
        )

        for (const record of futureRecords.results) {
          issues.push({
            table,
            recordId: record.id,
            issue: 'Invalid timestamps',
            details: {
              created_at: record.created_at,
              updated_at: record.updated_at,
              now: new Date().toISOString(),
            },
          })
        }
      }

      return {
        checkType: 'timestamp_consistency',
        status: issues.length === 0 ? 'passed' : 'warning',
        details: {
          issueCount: issues.length,
          issues: issues.slice(0, 10),
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: 'timestamp_consistency',
        status: 'failed',
        details: { error: error.message },
        timestamp: new Date(),
      }
    }
  }

  /**
   * Check ID format consistency
   */
  private async checkIdFormatConsistency(): Promise<ConsistencyCheckResult> {
    const issues: any[] = []

    try {
      // Check that all IDs follow the universal ID format
      const tables = ['users', 'projects', 'tasks', 'tags', 'items']

      for (const table of tables) {
        const invalidIds = await this.shardedDb.queryWithGlobalSort(
          `SELECT id FROM ${table} WHERE length(id) != 32`,
          [],
          { limit: 10 }
        )

        for (const record of invalidIds.results) {
          issues.push({
            table,
            recordId: record.id,
            issue: 'Invalid ID format',
            expectedLength: 32,
            actualLength: record.id.length,
          })
        }
      }

      return {
        checkType: 'id_format_consistency',
        status: issues.length === 0 ? 'passed' : 'warning',
        details: {
          issueCount: issues.length,
          issues: issues.slice(0, 10),
        },
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        checkType: 'id_format_consistency',
        status: 'failed',
        details: { error: error.message },
        timestamp: new Date(),
      }
    }
  }

  /**
   * Fix common consistency issues
   */
  async repairConsistencyIssues(dryRun: boolean = true): Promise<any> {
    const repairs: any[] = []

    // Fix 1: Remove orphaned task_tags
    const orphanedTaskTags = await this.shardedDb.queryWithGlobalSort(
      `SELECT tt.task_id, tt.tag_id
       FROM task_tags tt
       LEFT JOIN tasks t ON tt.task_id = t.id
       WHERE t.id IS NULL`,
      []
    )

    if (orphanedTaskTags.results.length > 0) {
      repairs.push({
        type: 'remove_orphaned_task_tags',
        count: orphanedTaskTags.results.length,
        dryRun,
      })

      if (!dryRun) {
        for (const orphan of orphanedTaskTags.results) {
          await this.shardedDb.executeRaw(
            'DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?',
            [orphan.task_id, orphan.tag_id]
          )
        }
      }
    }

    // Fix 2: Update invalid timestamps
    const tablesWithTimestamps = ['users', 'projects', 'tasks', 'items']

    for (const table of tablesWithTimestamps) {
      const invalidTimestamps = await this.shardedDb.queryWithGlobalSort(
        `SELECT id FROM ${table} WHERE updated_at < created_at`,
        []
      )

      if (invalidTimestamps.results.length > 0) {
        repairs.push({
          type: `fix_timestamps_${table}`,
          count: invalidTimestamps.results.length,
          dryRun,
        })

        if (!dryRun) {
          await this.shardedDb.executeRaw(
            `UPDATE ${table} SET updated_at = created_at WHERE updated_at < created_at`,
            []
          )
        }
      }
    }

    return {
      repairs,
      dryRun,
      timestamp: new Date(),
    }
  }

  // Helper methods

  private getShardFromId(id: string): string {
    try {
      const UniversalIdGenerator = require('../lib/sharding/universal-id')
      const parsed = UniversalIdGenerator.parseId(id)
      return parsed?.shardId || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  private async getTableDistribution(tableName: string): Promise<any> {
    const shards = this.router.getAllShards()
    const distribution: Record<string, number> = {}

    for (const [shardId, db] of shards) {
      const count = await db
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .first<{ count: number }>()
      distribution[shardId] = count?.count || 0
    }

    return distribution
  }
}
