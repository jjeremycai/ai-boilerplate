import type { CloudflareEnv, CacheConfig } from '../types/cloudflare'
import { H3Event } from 'h3'
import { getCloudflareEnv, getCacheStorage, getExecutionContext } from '../utils/cf-env'

const DEFAULT_TTL = 60 * 60 // 1 hour
const DEFAULT_SWR = 60 * 60 * 24 // 24 hours

/**
 * Generate a cache key with optional prefix and tags
 */
export function generateCacheKey(key: string, tags?: string[]): string {
  const baseKey = `cache:${key}`
  if (!tags || tags.length === 0) return baseKey
  return `${baseKey}:${tags.sort().join(':')}`
}

/**
 * Set cache headers for response
 */
export function setCacheHeaders(
  event: H3Event, 
  config: CacheConfig = {}
): void {
  const { ttl = DEFAULT_TTL, swr = DEFAULT_SWR } = config
  
  // Set Cache-Control header
  const cacheControl = [
    'public',
    `max-age=${ttl}`,
    `stale-while-revalidate=${swr}`
  ].join(', ')
  
  event.node.res.setHeader('Cache-Control', cacheControl)
  
  // Set CDN-Cache-Control for Cloudflare
  event.node.res.setHeader('CDN-Cache-Control', cacheControl)
  
  // Add cache tags if provided
  if (config.tags && config.tags.length > 0) {
    event.node.res.setHeader('Cache-Tag', config.tags.join(','))
  }
}

/**
 * Cache wrapper for KV storage
 */
export class KVCache {
  private kv: KVNamespace
  
  constructor(kv: KVNamespace) {
    this.kv = kv
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json')
      return value as T | null
    } catch (error) {
      console.error('KV get error:', error)
      return null
    }
  }
  
  async set<T>(
    key: string, 
    value: T, 
    options: { ttl?: number, tags?: string[] } = {}
  ): Promise<void> {
    try {
      const metadata = options.tags ? { tags: options.tags } : undefined
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: options.ttl,
        metadata
      })
    } catch (error) {
      console.error('KV set error:', error)
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key)
    } catch (error) {
      console.error('KV delete error:', error)
    }
  }
  
  async deleteByTags(tags: string[]): Promise<void> {
    // Note: This is a simple implementation. For production,
    // consider using Cloudflare's Cache Tags API
    try {
      const keys = await this.kv.list()
      
      for (const key of keys.keys) {
        const metadata = await this.kv.getWithMetadata(key.name)
        if (metadata.metadata && 
            'tags' in metadata.metadata &&
            Array.isArray(metadata.metadata.tags)) {
          const keyTags = metadata.metadata.tags as string[]
          if (tags.some(tag => keyTags.includes(tag))) {
            await this.kv.delete(key.name)
          }
        }
      }
    } catch (error) {
      console.error('KV delete by tags error:', error)
    }
  }
}

/**
 * Cache wrapper for Workers Cache API
 */
export class EdgeCache {
  private cache: Cache
  
  constructor(cache: Cache) {
    this.cache = cache
  }
  
  async match(request: Request): Promise<Response | undefined> {
    try {
      return await this.cache.match(request)
    } catch (error) {
      console.error('Cache match error:', error)
      return undefined
    }
  }
  
  async put(request: Request, response: Response): Promise<void> {
    try {
      await this.cache.put(request, response)
    } catch (error) {
      console.error('Cache put error:', error)
    }
  }
  
  async delete(request: Request): Promise<boolean> {
    try {
      return await this.cache.delete(request)
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }
}

/**
 * Get KV cache instance
 */
export function getKVCache(event: H3Event, namespace: keyof CloudflareEnv): KVCache | null {
  const env = getCloudflareEnv(event)
  if (!env) return null
  
  const kv = env[namespace] as KVNamespace | undefined
  if (!kv) return null
  
  return new KVCache(kv)
}

/**
 * Get edge cache instance
 */
export function getEdgeCache(): EdgeCache | null {
  const cache = getCacheStorage()
  if (!cache) return null
  
  return new EdgeCache(cache)
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  event: H3Event,
  key: string,
  fn: () => Promise<T>,
  config: CacheConfig = {}
): Promise<T> {
  const cache = getKVCache(event, 'CAI_CACHE')
  if (!cache) return fn()
  
  const cacheKey = generateCacheKey(config.key || key, config.tags)
  
  // Try to get from cache
  const cached = await cache.get<T>(cacheKey)
  if (cached !== null) {
    // Set cache headers to indicate a cache hit
    setCacheHeaders(event, { ...config, ttl: 0 })
    event.node.res.setHeader('X-Cache', 'HIT')
    return cached
  }
  
  // Execute function and cache result
  try {
    const result = await fn()
    
    // Don't cache null/undefined results
    if (result !== null && result !== undefined) {
      await cache.set(cacheKey, result, {
        ttl: config.ttl || DEFAULT_TTL,
        tags: config.tags
      })
    }
    
    // Set cache headers
    setCacheHeaders(event, config)
    event.node.res.setHeader('X-Cache', 'MISS')
    
    return result
  } catch (error) {
    // On error, try stale cache
    const stale = await cache.get<T>(cacheKey)
    if (stale !== null) {
      event.node.res.setHeader('X-Cache', 'STALE')
      return stale
    }
    
    throw error
  }
}

/**
 * Invalidate cache by keys or tags
 */
export async function invalidateCache(
  event: H3Event,
  options: { keys?: string[], tags?: string[] }
): Promise<void> {
  const cache = getKVCache(event, 'CAI_CACHE')
  if (!cache) return
  
  // Invalidate by keys
  if (options.keys) {
    await Promise.all(
      options.keys.map(key => cache.delete(generateCacheKey(key)))
    )
  }
  
  // Invalidate by tags
  if (options.tags) {
    await cache.deleteByTags(options.tags)
  }
  
  // Also purge from edge cache if available
  const edgeCache = getEdgeCache()
  if (edgeCache && options.keys) {
    await Promise.all(
      options.keys.map(key => {
        const url = new URL(key, 'https://example.com')
        const request = new Request(url.toString())
        return edgeCache.delete(request)
      })
    )
  }
}