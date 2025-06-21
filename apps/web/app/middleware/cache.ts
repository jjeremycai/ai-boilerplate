import { defineEventHandler, getCookie, getQuery, getRouterParam, readBody } from 'h3'
import type { H3Event } from 'h3'
import { withCache, getEdgeCache, setCacheHeaders, getKVCache } from '../lib/cache'
import { getCloudflareEnv, getCfProperties } from '../utils/cf-env'

interface CacheRule {
  pattern: RegExp
  ttl: number
  swr?: number
  tags?: string[]
  bypassCookie?: string
  varyBy?: string[]
}

// Define cache rules for different routes
const cacheRules: CacheRule[] = [
  // Static pages - long cache
  {
    pattern: /^\/(about|terms|privacy|contact)$/,
    ttl: 86400, // 24 hours
    swr: 604800, // 7 days
    tags: ['static-pages']
  },
  // API routes - shorter cache
  {
    pattern: /^\/api\/public\//,
    ttl: 300, // 5 minutes
    swr: 3600, // 1 hour
    tags: ['api-public']
  },
  // User-specific content - vary by cookie
  {
    pattern: /^\/api\/user\//,
    ttl: 60, // 1 minute
    bypassCookie: 'session',
    varyBy: ['cookie:session'],
    tags: ['api-user']
  },
  // Dynamic routes with params
  {
    pattern: /^\/posts\/\d+$/,
    ttl: 600, // 10 minutes
    swr: 3600, // 1 hour
    tags: ['posts']
  }
]

/**
 * Generate cache key from request
 */
async function generateRequestCacheKey(event: H3Event, varyBy: string[] = []): Promise<string> {
  const url = event.node.req.url || '/'
  const method = event.node.req.method || 'GET'
  
  // Base key components
  const components = [method, url]
  
  // Add vary components
  for (const vary of varyBy) {
    if (vary.startsWith('cookie:')) {
      const cookieName = vary.slice(7)
      const cookieValue = getCookie(event, cookieName)
      if (cookieValue) {
        components.push(`${cookieName}:${cookieValue}`)
      }
    } else if (vary === 'query') {
      const query = getQuery(event)
      const sortedQuery = Object.keys(query).sort().map(k => `${k}:${query[k]}`).join('&')
      if (sortedQuery) {
        components.push(`query:${sortedQuery}`)
      }
    } else if (vary.startsWith('header:')) {
      const headerName = vary.slice(7)
      const headerValue = event.node.req.headers[headerName.toLowerCase()]
      if (headerValue) {
        components.push(`${headerName}:${headerValue}`)
      }
    }
  }
  
  // Generate hash for long keys
  const keyString = components.join('|')
  if (keyString.length > 512) {
    // Use Web Crypto API instead of Node crypto
    const encoder = new TextEncoder()
    const data = encoder.encode(keyString)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return `req:${hash}`
  }
  
  return `req:${keyString}`
}

/**
 * Check if request should bypass cache
 */
function shouldBypassCache(event: H3Event, rule: CacheRule): boolean {
  // Bypass for non-GET requests
  if (event.node.req.method !== 'GET') return true
  
  // Bypass if required cookie is missing
  if (rule.bypassCookie) {
    const cookie = getCookie(event, rule.bypassCookie)
    if (!cookie) return true
  }
  
  // Bypass for authenticated requests (unless explicitly allowed)
  const authHeader = event.node.req.headers.authorization
  if (authHeader && !rule.varyBy?.includes('header:authorization')) {
    return true
  }
  
  // Check for cache-control headers
  const cacheControl = event.node.req.headers['cache-control']
  if (cacheControl?.includes('no-cache') || cacheControl?.includes('no-store')) {
    return true
  }
  
  return false
}

/**
 * HTML caching middleware
 */
export const htmlCacheMiddleware = defineEventHandler(async (event: H3Event) => {
  // Only handle GET requests
  if (event.node.req.method !== 'GET') return
  
  // Skip API routes
  if (event.node.req.url?.startsWith('/api/')) return
  
  const env = getCloudflareEnv(event)
  if (!env?.CAI_HTML_CACHE) return
  
  const cache = getKVCache(event, 'CAI_HTML_CACHE')
  if (!cache) return
  
  // Find matching cache rule
  const path = event.node.req.url || '/'
  const rule = cacheRules.find(r => r.pattern.test(path))
  
  if (!rule || shouldBypassCache(event, rule)) return
  
  // Generate cache key
  const cacheKey = await generateRequestCacheKey(event, rule.varyBy)
  
  // Try edge cache first
  const edgeCache = getEdgeCache()
  if (edgeCache) {
    const request = new Request(event.node.req.url!, {
      method: 'GET',
      headers: event.node.req.headers as HeadersInit
    })
    
    const cachedResponse = await edgeCache.match(request)
    if (cachedResponse) {
      // Return cached response
      event.node.res.statusCode = cachedResponse.status
      cachedResponse.headers.forEach((value, key) => {
        event.node.res.setHeader(key, value)
      })
      event.node.res.setHeader('X-Cache', 'HIT-EDGE')
      const body = await cachedResponse.text()
      event.node.res.end(body)
      return
    }
  }
  
  // Store original response methods
  const originalWrite = event.node.res.write
  const originalEnd = event.node.res.end
  
  let responseBody = ''
  let responseEnded = false
  
  // Intercept response
  event.node.res.write = function(chunk: any, ...args: any[]) {
    responseBody += chunk
    return originalWrite.apply(event.node.res, [chunk, ...args])
  }
  
  event.node.res.end = async function(chunk: any, ...args: any[]) {
    if (chunk) {
      responseBody += chunk
    }
    
    // Only cache successful responses
    const statusCode = event.node.res.statusCode || 200
    if (statusCode >= 200 && statusCode < 300 && !responseEnded) {
      responseEnded = true
      
      // Cache in KV
      await cache.set(cacheKey, {
        body: responseBody,
        headers: event.node.res.getHeaders(),
        statusCode
      }, {
        ttl: rule.ttl,
        tags: rule.tags
      })
      
      // Cache in edge cache
      if (edgeCache) {
        const request = new Request(event.node.req.url!, {
          method: 'GET',
          headers: event.node.req.headers as HeadersInit
        })
        
        const response = new Response(responseBody, {
          status: statusCode,
          headers: {
            ...event.node.res.getHeaders() as HeadersInit,
            'Cache-Control': `public, max-age=${rule.ttl}, stale-while-revalidate=${rule.swr || rule.ttl}`
          }
        })
        
        await edgeCache.put(request, response)
      }
    }
    
    // Set cache headers
    setCacheHeaders(event, {
      ttl: rule.ttl,
      swr: rule.swr,
      tags: rule.tags
    })
    event.node.res.setHeader('X-Cache', 'MISS')
    
    return originalEnd.apply(event.node.res, [chunk, ...args])
  }
})

/**
 * API caching middleware
 */
export const apiCacheMiddleware = defineEventHandler(async (event: H3Event) => {
  // Only handle API routes
  if (!event.node.req.url?.startsWith('/api/')) return
  
  // Only cache GET requests
  if (event.node.req.method !== 'GET') return
  
  const env = getCloudflareEnv(event)
  if (!env?.CAI_REQUEST_CACHE) return
  
  // Find matching cache rule
  const path = event.node.req.url
  const rule = cacheRules.find(r => r.pattern.test(path))
  
  if (!rule || shouldBypassCache(event, rule)) return
  
  // Generate cache key
  const cacheKey = await generateRequestCacheKey(event, rule.varyBy)
  
  // Use cache wrapper
  const cachedData = await withCache(
    event,
    cacheKey,
    async () => {
      // Continue with normal request processing
      return null // This will be handled by the next middleware
    },
    {
      ttl: rule.ttl,
      tags: rule.tags
    }
  )
  
  if (cachedData) {
    event.node.res.setHeader('Content-Type', 'application/json')
    event.node.res.end(JSON.stringify(cachedData))
  }
})

/**
 * Cache purge endpoint
 */
export const cachePurgeHandler = defineEventHandler(async (event: H3Event) => {
  if (!event.node.req.url?.startsWith('/api/cache/purge')) return
  
  // Verify authorization
  const authHeader = event.node.req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    event.node.res.statusCode = 401
    return { error: 'Unauthorized' }
  }
  
  const env = getCloudflareEnv(event)
  if (!env) {
    event.node.res.statusCode = 500
    return { error: 'Cloudflare environment not available' }
  }
  
  // Get purge parameters
  const { tags, keys } = await readBody(event)
  
  if (!tags && !keys) {
    event.node.res.statusCode = 400
    return { error: 'Either tags or keys must be provided' }
  }
  
  // Purge from all caches
  const caches = ['CAI_CACHE', 'CAI_HTML_CACHE', 'CAI_REQUEST_CACHE'] as const
  const results: Record<string, boolean> = {}
  
  for (const cacheName of caches) {
    const cache = getKVCache(event, cacheName)
    if (cache) {
      try {
        if (keys) {
          await Promise.all(keys.map((key: string) => cache.delete(key)))
        }
        if (tags) {
          await cache.deleteByTags(tags)
        }
        results[cacheName] = true
      } catch (error) {
        console.error(`Error purging ${cacheName}:`, error)
        results[cacheName] = false
      }
    }
  }
  
  // Also purge from edge cache
  const edgeCache = getEdgeCache()
  if (edgeCache && keys) {
    for (const key of keys) {
      try {
        const request = new Request(key)
        await edgeCache.delete(request)
        results.edge = true
      } catch (error) {
        console.error('Error purging edge cache:', error)
        results.edge = false
      }
    }
  }
  
  return { success: true, results }
})