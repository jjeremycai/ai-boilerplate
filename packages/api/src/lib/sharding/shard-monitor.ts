import { D1Database } from '@cloudflare/workers-types'
import { DatabaseRouter } from './database-router'

export interface ShardMonitorConfig {
  checkIntervalMinutes: number
  sizeThresholdPercent: number
  alertThresholdPercent: number
}

export interface ShardHealthReport {
  shardId: string
  bindingName: string
  sizeBytes: number
  sizePercent: number
  recordCount: number
  tablesInfo: TableInfo[]
  healthStatus: 'healthy' | 'warning' | 'critical'
  recommendations: string[]
  checkedAt: Date
}

interface TableInfo {
  tableName: string
  recordCount: number
  estimatedSize: number
}

export class ShardMonitor {
  private router: DatabaseRouter
  private config: ShardMonitorConfig

  constructor(router: DatabaseRouter, config?: Partial<ShardMonitorConfig>) {
    this.router = router
    this.config = {
      checkIntervalMinutes: config?.checkIntervalMinutes || 60,
      sizeThresholdPercent: config?.sizeThresholdPercent || 80,
      alertThresholdPercent: config?.alertThresholdPercent || 90,
    }
  }

  async checkShardHealth(shardId: string, db: D1Database): Promise<ShardHealthReport> {
    const shardStats = this.router.getShardStats().find((s) => s.id === shardId)
    if (!shardStats) {
      throw new Error(`Shard ${shardId} not found`)
    }

    // Get database size
    const sizeResult = await db
      .prepare(`
      SELECT page_count * page_size as size 
      FROM pragma_page_count(), pragma_page_size()
    `)
      .first<{ size: number }>()

    const sizeBytes = sizeResult?.size || 0
    const sizePercent = (sizeBytes / shardStats.maxSize) * 100

    // Get table information
    const tables = await db
      .prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `)
      .all()

    const tablesInfo: TableInfo[] = []
    let totalRecords = 0

    for (const table of tables.results) {
      const countResult = await db
        .prepare(`
        SELECT COUNT(*) as count FROM ${table.name}
      `)
        .first<{ count: number }>()

      const count = countResult?.count || 0
      totalRecords += count

      // Estimate table size (rough approximation)
      const tablePages = await db
        .prepare(`
        SELECT COUNT(*) * (SELECT page_size FROM pragma_page_size()) as size
        FROM pragma_table_info('${table.name}')
      `)
        .first<{ size: number }>()

      tablesInfo.push({
        tableName: table.name as string,
        recordCount: count,
        estimatedSize: tablePages?.size || 0,
      })
    }

    // Determine health status
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy'
    const recommendations: string[] = []

    if (sizePercent >= this.config.alertThresholdPercent) {
      healthStatus = 'critical'
      recommendations.push('Shard is critically full. Add new shard immediately.')
      recommendations.push('Consider archiving old data if possible.')
    } else if (sizePercent >= this.config.sizeThresholdPercent) {
      healthStatus = 'warning'
      recommendations.push('Shard approaching capacity. Plan for new shard soon.')
      recommendations.push(`Current usage: ${sizePercent.toFixed(1)}%`)
    }

    // Check for imbalanced tables
    const largestTable = tablesInfo.reduce(
      (prev, current) => (prev.recordCount > current.recordCount ? prev : current),
      tablesInfo[0]
    )

    if (largestTable && largestTable.recordCount > totalRecords * 0.7) {
      recommendations.push(
        `Table '${largestTable.tableName}' contains ${((largestTable.recordCount / totalRecords) * 100).toFixed(1)}% of records. Consider partitioning.`
      )
    }

    return {
      shardId,
      bindingName: shardStats.bindingName,
      sizeBytes,
      sizePercent,
      recordCount: totalRecords,
      tablesInfo,
      healthStatus,
      recommendations,
      checkedAt: new Date(),
    }
  }

  async checkAllShards(): Promise<ShardHealthReport[]> {
    const reports: ShardHealthReport[] = []
    const shards = this.router.getAllShards()

    for (const [shardId, db] of shards) {
      try {
        const report = await this.checkShardHealth(shardId, db)
        reports.push(report)
      } catch (error) {
        console.error(`Failed to check shard ${shardId}:`, error)
      }
    }

    return reports
  }

  async getShardAllocationReport(): Promise<{
    totalShards: number
    activeShards: number
    totalSizeBytes: number
    totalRecords: number
    averageUtilization: number
    criticalShards: string[]
    warningShards: string[]
    nextShardNeeded: boolean
  }> {
    const reports = await this.checkAllShards()
    const shardStats = this.router.getShardStats()

    const criticalShards = reports
      .filter((r) => r.healthStatus === 'critical')
      .map((r) => r.shardId)

    const warningShards = reports.filter((r) => r.healthStatus === 'warning').map((r) => r.shardId)

    const totalSizeBytes = reports.reduce((sum, r) => sum + r.sizeBytes, 0)
    const totalRecords = reports.reduce((sum, r) => sum + r.recordCount, 0)
    const averageUtilization = reports.reduce((sum, r) => sum + r.sizePercent, 0) / reports.length

    const activeShards = shardStats.filter((s) => s.isActive).length
    const nextShardNeeded = activeShards === 0 || criticalShards.length > 0

    return {
      totalShards: reports.length,
      activeShards,
      totalSizeBytes,
      totalRecords,
      averageUtilization,
      criticalShards,
      warningShards,
      nextShardNeeded,
    }
  }

  // Cron job handler for scheduled monitoring
  async scheduledCheck(): Promise<void> {
    console.log('Starting scheduled shard health check...')

    const report = await this.getShardAllocationReport()

    // Log summary
    console.log('Shard Health Summary:', {
      totalShards: report.totalShards,
      activeShards: report.activeShards,
      averageUtilization: `${report.averageUtilization.toFixed(1)}%`,
      criticalShards: report.criticalShards.length,
      warningShards: report.warningShards.length,
    })

    // Alert on critical conditions
    if (report.criticalShards.length > 0) {
      console.error('CRITICAL: Shards need immediate attention:', report.criticalShards)
      // Here you could send alerts via email, Slack, etc.
    }

    if (report.nextShardNeeded) {
      console.warn('New shard needed. No active shards available for writes.')
      // Trigger automated shard provisioning or alert administrators
    }

    // Update shard metadata in router
    for (const [shardId] of this.router.getAllShards()) {
      await this.router.updateShardMetadata(shardId)
    }
  }
}
