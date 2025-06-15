import { ShardedDbService } from './sharded-db.service'
import { ShardReferenceTracker } from './shard-reference-tracker.service'

export interface FallbackStrategy {
  type: 'cache' | 'default' | 'proxy' | 'null'
  data?: any
}

export interface FallbackResult<T> {
  data: T | null
  fallbackUsed: boolean
  strategy: FallbackStrategy
  error?: Error
}

export class ShardFallbackService {
  private fallbackCache: Map<string, { data: any; expiry: number }> = new Map()
  private readonly CACHE_TTL = 10 * 60 * 1000 // 10 minutes

  constructor(
    private shardedDb: ShardedDbService,
    private referenceTracker: ShardReferenceTracker
  ) {}

  /**
   * Get a record with fallback handling for missing cross-shard references
   */
  async getWithFallback<T>(
    table: string,
    id: string,
    options?: {
      includeReferences?: boolean
      fallbackStrategy?: FallbackStrategy
      maxRetries?: number
    }
  ): Promise<FallbackResult<T>> {
    const maxRetries = options?.maxRetries || 3
    let lastError: Error | undefined

    // Try to get the record with retries
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const record = await this.shardedDb.findById<T>(table, id)

        if (record) {
          // Cache successful result
          this.cacheResult(table, id, record)

          // If including references, validate and handle missing ones
          if (options?.includeReferences) {
            await this.enrichWithReferences(table, id, record)
          }

          return {
            data: record,
            fallbackUsed: false,
            strategy: { type: 'null' },
          }
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt}/${maxRetries} failed for ${table}:${id}`, error)

        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt - 1) * 100)
        }
      }
    }

    // All attempts failed, use fallback
    return this.handleFallback<T>(table, id, options?.fallbackStrategy, lastError)
  }

  /**
   * Batch get with fallback handling
   */
  async batchGetWithFallback<T>(
    table: string,
    ids: string[],
    options?: {
      fallbackStrategy?: FallbackStrategy
      continueOnError?: boolean
    }
  ): Promise<Map<string, FallbackResult<T>>> {
    const results = new Map<string, FallbackResult<T>>()
    const continueOnError = options?.continueOnError ?? true

    // Try batch fetch first
    try {
      const records = await this.shardedDb.findByIds<T>(table, ids)
      const recordMap = new Map(records.map((r) => [(r as any).id, r]))

      // Process each requested ID
      for (const id of ids) {
        const record = recordMap.get(id)
        if (record) {
          results.set(id, {
            data: record,
            fallbackUsed: false,
            strategy: { type: 'null' },
          })
        } else {
          // Record not found, use fallback
          const fallback = await this.handleFallback<T>(table, id, options?.fallbackStrategy)
          results.set(id, fallback)
        }
      }
    } catch (error) {
      if (!continueOnError) {
        throw error
      }

      // Batch failed, fall back to individual fetches
      for (const id of ids) {
        const result = await this.getWithFallback<T>(table, id, {
          fallbackStrategy: options?.fallbackStrategy,
        })
        results.set(id, result)
      }
    }

    return results
  }

  /**
   * Handle missing foreign key references with fallback
   */
  async resolveReference<T>(
    sourceTable: string,
    sourceId: string,
    targetTable: string,
    targetField: string
  ): Promise<FallbackResult<T>> {
    // Get the source record
    const sourceResult = await this.getWithFallback<any>(sourceTable, sourceId)

    if (!sourceResult.data || !sourceResult.data[targetField]) {
      return {
        data: null,
        fallbackUsed: true,
        strategy: { type: 'null' },
      }
    }

    // Try to resolve the reference
    const targetId = sourceResult.data[targetField]
    return this.getWithFallback<T>(targetTable, targetId, {
      fallbackStrategy: { type: 'default', data: this.getDefaultRecord(targetTable) },
    })
  }

  /**
   * Create a proxy object that handles missing references gracefully
   */
  createReferenceProxy<T extends Record<string, any>>(
    record: T,
    references: Map<string, { table: string; field: string }>
  ): T {
    return new Proxy(record, {
      get: (target, prop: string) => {
        // Return existing property if available
        if (prop in target) {
          return target[prop]
        }

        // Check if this is a reference field
        const refConfig = references.get(prop)
        if (refConfig) {
          // Return a promise that resolves the reference
          return (async () => {
            const result = await this.resolveReference(
              refConfig.table,
              target.id,
              refConfig.table,
              refConfig.field
            )
            return result.data
          })()
        }

        return undefined
      },
    })
  }

  /**
   * Warm up fallback cache for frequently accessed records
   */
  async warmupCache(table: string, ids: string[], strategy?: FallbackStrategy): Promise<void> {
    const batchSize = 50

    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await this.batchGetWithFallback(table, batch, { fallbackStrategy: strategy })
    }
  }

  /**
   * Clear fallback cache
   */
  clearCache(table?: string, id?: string): void {
    if (table && id) {
      this.fallbackCache.delete(this.getCacheKey(table, id))
    } else if (table) {
      // Clear all entries for a table
      for (const [key] of this.fallbackCache) {
        if (key.startsWith(`${table}:`)) {
          this.fallbackCache.delete(key)
        }
      }
    } else {
      // Clear entire cache
      this.fallbackCache.clear()
    }
  }

  // Private helper methods

  private async handleFallback<T>(
    table: string,
    id: string,
    strategy?: FallbackStrategy,
    error?: Error
  ): Promise<FallbackResult<T>> {
    // Check cache first
    const cached = this.getCachedResult<T>(table, id)
    if (cached) {
      return {
        data: cached,
        fallbackUsed: true,
        strategy: { type: 'cache' },
        error,
      }
    }

    // Use provided strategy or default
    const fallbackStrategy = strategy || { type: 'default' }

    switch (fallbackStrategy.type) {
      case 'default':
        return {
          data: this.getDefaultRecord(table) as T,
          fallbackUsed: true,
          strategy: fallbackStrategy,
          error,
        }

      case 'proxy':
        // Return a proxy object that will lazy-load when accessed
        const proxy = this.createLazyProxy<T>(table, id)
        return {
          data: proxy,
          fallbackUsed: true,
          strategy: fallbackStrategy,
          error,
        }

      case 'null':
      default:
        return {
          data: null,
          fallbackUsed: true,
          strategy: { type: 'null' },
          error,
        }
    }
  }

  private async enrichWithReferences(table: string, id: string, record: any): Promise<void> {
    const validation = await this.referenceTracker.validateReferences(table, id)

    if (!validation.valid && validation.missingReferences.length > 0) {
      // Add metadata about missing references
      record._missingReferences = validation.missingReferences.map((ref) => ({
        table: ref.targetTable,
        id: ref.targetId,
        field: this.getFieldForReference(table, ref.targetTable),
      }))
    }
  }

  private getDefaultRecord(table: string): any {
    // Return sensible defaults based on table
    const defaults: Record<string, any> = {
      users: {
        id: 'deleted_user',
        email: 'deleted@example.com',
        first_name: 'Deleted',
        last_name: 'User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      projects: {
        id: 'deleted_project',
        name: 'Deleted Project',
        description: 'This project has been deleted',
        status: 'archived',
        color: '#808080',
      },
      tasks: {
        id: 'deleted_task',
        title: 'Deleted Task',
        description: 'This task has been deleted',
        status: 'cancelled',
        priority: 'low',
      },
      tags: {
        id: 'deleted_tag',
        name: 'deleted',
        color: '#808080',
      },
    }

    return defaults[table] || { id: 'deleted_record' }
  }

  private createLazyProxy<T>(table: string, id: string): T {
    const self = this
    let cachedData: T | null = null
    let loading = false

    return new Proxy({} as T, {
      get(target, prop) {
        if (prop === 'id') {
          return id
        }

        if (!cachedData && !loading) {
          loading = true
          // Trigger async load
          self.getWithFallback<T>(table, id).then((result) => {
            cachedData = result.data
            loading = false
          })
        }

        return cachedData ? (cachedData as any)[prop] : undefined
      },
    })
  }

  private getFieldForReference(sourceTable: string, targetTable: string): string {
    const referenceMap: Record<string, Record<string, string>> = {
      tasks: {
        projects: 'project_id',
        users: 'user_id',
      },
      projects: {
        users: 'user_id',
      },
      tags: {
        users: 'user_id',
      },
    }

    return referenceMap[sourceTable]?.[targetTable] || `${targetTable}_id`
  }

  private cacheResult(table: string, id: string, data: any): void {
    const key = this.getCacheKey(table, id)
    this.fallbackCache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    })
  }

  private getCachedResult<T>(table: string, id: string): T | null {
    const key = this.getCacheKey(table, id)
    const cached = this.fallbackCache.get(key)

    if (cached && Date.now() < cached.expiry) {
      return cached.data as T
    }

    // Remove expired entry
    if (cached) {
      this.fallbackCache.delete(key)
    }

    return null
  }

  private getCacheKey(table: string, id: string): string {
    return `${table}:${id}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get fallback statistics
   */
  getStats(): {
    cacheSize: number
    cacheHitRate: number
    fallbackTypes: Record<string, number>
  } {
    // In a production system, you would track these metrics
    return {
      cacheSize: this.fallbackCache.size,
      cacheHitRate: 0, // Would need to track hits/misses
      fallbackTypes: {
        cache: 0,
        default: 0,
        proxy: 0,
        null: 0,
      },
    }
  }
}
