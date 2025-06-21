# Edge Optimization Guide

This guide documents the edge caching and optimization features implemented for Cloudflare Workers in this TanStack application.

## Overview

The edge optimization system provides:
- **KV-based caching** with tag-based invalidation
- **Request deduplication** to prevent duplicate work during SSR
- **HTML fragment caching** for static content
- **Geo-based routing** and content personalization
- **Edge analytics** for performance monitoring
- **Automatic cache warming** and invalidation strategies

## Setup

### 1. Create KV Namespaces

Run these commands to create the required KV namespaces:

```bash
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "DEDUPE"
wrangler kv:namespace create "HTML_CACHE"
wrangler kv:namespace create "REQUEST_CACHE"
```

### 2. Update wrangler.jsonc

Replace the placeholder IDs in `wrangler.jsonc` with the actual namespace IDs from step 1.

### 3. Configure Middleware

Add the caching middleware to your application:

```typescript
// In your app configuration
import { htmlCacheMiddleware, apiCacheMiddleware } from './app/middleware/cache'

// Register middleware
app.use(htmlCacheMiddleware)
app.use(apiCacheMiddleware)
```

## Features

### 1. Edge Caching

Cache responses at the edge using Cloudflare KV and Cache API:

```typescript
import { withCache } from './app/lib/cache'

// Cache a server function
export const getData = createServerFn('GET', async (_, { request }) => {
  const event = request as H3Event
  
  return withCache(
    event,
    'my-cache-key',
    async () => {
      // Expensive operation
      return await fetchDataFromDatabase()
    },
    {
      ttl: 300, // 5 minutes
      swr: 3600, // 1 hour stale-while-revalidate
      tags: ['products', 'catalog']
    }
  )
})
```

### 2. Request Deduplication

Prevent duplicate requests during SSR:

```typescript
import { withDedupe } from './app/lib/dedupe'

// Deduplicate concurrent requests
export const getUser = createServerFn('GET', async (userId: string, { request }) => {
  const event = request as H3Event
  
  return withDedupe(
    event,
    `user:${userId}`,
    async () => {
      return await db.users.findById(userId)
    },
    { distributed: true } // Use KV for distributed deduplication
  )
})
```

### 3. Batch Request Handling

Batch multiple requests into a single operation:

```typescript
import { BatchDedupe } from './app/lib/dedupe'

const userBatcher = new BatchDedupe(
  async (userIds: string[]) => {
    const users = await db.users.findMany({ id: { in: userIds } })
    return new Map(users.map(u => [u.id, u]))
  },
  { batchSize: 50, batchDelay: 10 }
)

// Use in your server function
const user = await userBatcher.get(userId)
```

### 4. HTML Fragment Caching

Cache HTML fragments for better performance:

```typescript
// Configure in middleware/cache.ts
const cacheRules: CacheRule[] = [
  {
    pattern: /^\/static-page$/,
    ttl: 86400, // 24 hours
    swr: 604800, // 7 days
    tags: ['static-pages']
  }
]
```

### 5. Geo-Based Features

Personalize content based on user location:

```typescript
import { getPreferredLanguage, getPreferredCurrency, isGDPRCountry } from './app/lib/geo'

export const getPersonalizedContent = createServerFn('GET', async (_, { request }) => {
  const event = request as H3Event
  
  const language = getPreferredLanguage(event)
  const currency = getPreferredCurrency(event)
  const showCookieBanner = isGDPRCountry(event)
  
  return {
    language,
    currency,
    showCookieBanner
  }
})
```

### 6. Cache Invalidation

Invalidate caches by tags or keys:

```typescript
import { invalidateCache } from './app/lib/cache'

// After updating data
await invalidateCache(event, {
  tags: ['products'], // Invalidate all caches tagged with 'products'
  keys: ['specific-key'] // Invalidate specific cache keys
})
```

### 7. Analytics

Track performance and user behavior:

```typescript
import { getAnalytics } from './app/lib/analytics'

const analytics = getAnalytics(event)

// Track page views
await analytics.trackPageView(event)

// Track API performance
await analytics.trackApiRequest(event, {
  endpoint: '/api/users',
  method: 'GET'
})

// Track errors
await analytics.trackError(event, error)
```

## Performance Best Practices

1. **Cache Key Design**: Use hierarchical keys for easy invalidation
   ```typescript
   const key = `products:category:${categoryId}:page:${page}`
   ```

2. **Tag Strategy**: Use consistent tags for related content
   ```typescript
   tags: ['products', `category-${categoryId}`, `user-${userId}`]
   ```

3. **TTL Guidelines**:
   - Static content: 24 hours
   - Product listings: 5-10 minutes
   - User-specific data: 1-2 minutes
   - Real-time data: No caching

4. **Stale-While-Revalidate**: Always set SWR for better perceived performance

5. **Distributed Deduplication**: Use for high-traffic endpoints to prevent thundering herd

## Monitoring

Monitor cache performance using headers:
- `X-Cache`: HIT, MISS, STALE, HIT-EDGE
- `Cache-Control`: Actual cache headers
- `X-Cache-Tags`: Applied cache tags

## Troubleshooting

### Cache Not Working
1. Check KV namespace bindings in wrangler.jsonc
2. Verify cache rules match your URL patterns
3. Check for cache-busting headers (no-cache, no-store)

### High Cache Miss Rate
1. Review cache key generation logic
2. Check TTL values - too short?
3. Monitor invalidation patterns

### Deduplication Issues
1. Ensure consistent key generation
2. Check KV namespace for distributed dedupe
3. Monitor timeout settings

## Security Considerations

1. **Cache Key Security**: Never include sensitive data in cache keys
2. **Geo Blocking**: Implement country-based access control carefully
3. **GDPR Compliance**: Use geo detection for cookie consent
4. **Rate Limiting**: Implement alongside caching to prevent abuse

## Future Enhancements

1. **Cloudflare Analytics Engine**: When available, integrate for better analytics
2. **Cache Warming**: Implement scheduled workers for cache warming
3. **A/B Testing**: Use geo and cache features for edge-side A/B tests
4. **WebSocket Support**: Add caching for WebSocket connection setup