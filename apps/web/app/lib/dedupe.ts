import type { CloudflareEnv } from '../types/cloudflare'
import { H3Event } from 'h3'
import { getCloudflareEnv, getExecutionContext } from '../utils/cf-env'

interface DedupedRequest<T> {
  promise: Promise<T>
  timestamp: number
  subscribers: number
}

// In-memory cache for request deduplication
const pendingRequests = new Map<string, DedupedRequest<any>>()

// Cleanup interval (5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
const REQUEST_TIMEOUT = 30 * 1000 // 30 seconds

/**
 * Generate a deduplication key from request parameters
 */
export function generateDedupeKey(
  endpoint: string,
  params?: Record<string, any>
): string {
  const sortedParams = params 
    ? Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|')
    : ''
  return `dedupe:${endpoint}:${sortedParams}`
}

/**
 * Cleanup old pending requests
 */
function cleanupPendingRequests(): void {
  const now = Date.now()
  for (const [key, request] of pendingRequests) {
    if (now - request.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(key)
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupPendingRequests, CLEANUP_INTERVAL)
}

/**
 * Deduplicate concurrent requests during SSR
 */
export async function dedupeRequest<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  // Check if request is already in progress
  const existing = pendingRequests.get(key)
  if (existing) {
    existing.subscribers++
    return existing.promise
  }
  
  // Create new deduped request
  const promise = fn().finally(() => {
    // Clean up after completion
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
    subscribers: 1
  })
  
  return promise
}

/**
 * KV-based request deduplication for distributed environments
 */
export class DistributedDedupe {
  private kv: KVNamespace
  private localCache = new Map<string, Promise<any>>()
  
  constructor(kv: KVNamespace) {
    this.kv = kv
  }
  
  async dedupe<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 5 // 5 seconds default
  ): Promise<T> {
    // Check local cache first
    const local = this.localCache.get(key)
    if (local) return local
    
    // Try to acquire lock in KV
    const lockKey = `lock:${key}`
    const lockValue = crypto.randomUUID()
    
    try {
      // Try to set lock with CAS (compare-and-swap)
      const existing = await this.kv.get(lockKey)
      if (existing) {
        // Lock exists, wait and retry
        await new Promise(resolve => setTimeout(resolve, 100))
        return this.dedupe(key, fn, ttl)
      }
      
      // Set lock
      await this.kv.put(lockKey, lockValue, { expirationTtl: ttl })
      
      // Execute function
      const promise = fn().finally(async () => {
        // Release lock
        const currentLock = await this.kv.get(lockKey)
        if (currentLock === lockValue) {
          await this.kv.delete(lockKey)
        }
        this.localCache.delete(key)
      })
      
      this.localCache.set(key, promise)
      return promise
      
    } catch (error) {
      // On error, ensure lock is released
      const currentLock = await this.kv.get(lockKey)
      if (currentLock === lockValue) {
        await this.kv.delete(lockKey)
      }
      throw error
    }
  }
}

/**
 * Get distributed dedupe instance
 */
export function getDistributedDedupe(event: H3Event): DistributedDedupe | null {
  const env = getCloudflareEnv(event)
  if (!env?.CAI_DEDUPE) return null
  
  return new DistributedDedupe(env.CAI_DEDUPE)
}

/**
 * Request coalescing wrapper for tRPC or API calls
 */
export async function withDedupe<T>(
  event: H3Event,
  key: string,
  fn: () => Promise<T>,
  options: { distributed?: boolean, ttl?: number } = {}
): Promise<T> {
  if (options.distributed) {
    const dedupe = getDistributedDedupe(event)
    if (dedupe) {
      return dedupe.dedupe(key, fn, options.ttl)
    }
  }
  
  // Fall back to in-memory deduplication
  return dedupeRequest(key, fn)
}

/**
 * Create a deduped function wrapper
 */
export function createDedupedFunction<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyGenerator: (...args: TArgs) => string
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => {
    const key = keyGenerator(...args)
    return dedupeRequest(key, () => fn(...args))
  }
}

/**
 * Batch request deduplication for multiple keys
 */
export class BatchDedupe {
  private batch = new Map<string, Set<(value: any) => void>>()
  private timeout: NodeJS.Timeout | null = null
  private batchSize: number
  private batchDelay: number
  
  constructor(
    private fetcher: (keys: string[]) => Promise<Map<string, any>>,
    options: { batchSize?: number, batchDelay?: number } = {}
  ) {
    this.batchSize = options.batchSize || 100
    this.batchDelay = options.batchDelay || 10
  }
  
  async get(key: string): Promise<any> {
    return new Promise((resolve) => {
      // Add to batch
      if (!this.batch.has(key)) {
        this.batch.set(key, new Set())
      }
      this.batch.get(key)!.add(resolve)
      
      // Schedule batch execution
      if (!this.timeout) {
        this.timeout = setTimeout(() => this.executeBatch(), this.batchDelay)
      }
      
      // Execute immediately if batch is full
      if (this.batch.size >= this.batchSize) {
        this.executeBatch()
      }
    })
  }
  
  private async executeBatch(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    
    if (this.batch.size === 0) return
    
    // Get all keys and callbacks
    const keys = Array.from(this.batch.keys())
    const callbacks = new Map(this.batch)
    this.batch.clear()
    
    try {
      // Fetch all values
      const results = await this.fetcher(keys)
      
      // Resolve all promises
      for (const [key, resolvers] of callbacks) {
        const value = results.get(key)
        for (const resolve of resolvers) {
          resolve(value)
        }
      }
    } catch (error) {
      // Reject all promises on error
      for (const resolvers of callbacks.values()) {
        for (const resolve of resolvers) {
          resolve(Promise.reject(error))
        }
      }
    }
  }
}