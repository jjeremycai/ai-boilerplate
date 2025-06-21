/**
 * Example integration of edge caching and optimization features
 * This file demonstrates how to use all the edge optimization utilities
 */

import { createServerFn } from '@tanstack/start'
import { H3Event } from 'h3'
import { z } from 'zod'
import { withCache, invalidateCache, setCacheHeaders } from './cache'
import { withDedupe, BatchDedupe } from './dedupe'
import { getAnalytics } from './analytics'
import { getPreferredLanguage, getPreferredCurrency, isGDPRCountry, createGeoMiddleware } from './geo'
import { getCloudflareContext } from './cloudflare'

/**
 * Example: Cached server function with deduplication
 */
export const getCachedProducts = createServerFn(
  'GET',
  async (params: { category?: string }, { request }) => {
    const event = request as unknown as H3Event
    
    // Use both caching and deduplication
    return withDedupe(
      event,
      `products:${params.category || 'all'}`,
      async () => {
        return withCache(
          event,
          `products:${params.category || 'all'}`,
          async () => {
            // Simulate expensive database query
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            return [
              { id: '1', name: 'Product 1', category: params.category },
              { id: '2', name: 'Product 2', category: params.category },
            ]
          },
          {
            ttl: 300, // 5 minutes
            swr: 3600, // 1 hour
            tags: ['products', params.category || 'all']
          }
        )
      },
      { distributed: true }
    )
  }
)

/**
 * Example: Geo-based content personalization
 */
export const getPersonalizedContent = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    
    // Get user preferences based on location
    const language = getPreferredLanguage(event)
    const currency = getPreferredCurrency(event)
    const isGDPR = isGDPRCountry(event)
    
    // Track analytics
    const analytics = getAnalytics(event)
    if (analytics) {
      await analytics.track({
        name: 'content_personalization',
        properties: {
          language,
          currency,
          gdpr: isGDPR
        }
      })
    }
    
    return {
      language,
      currency,
      showCookieBanner: isGDPR,
      content: `Welcome! Prices shown in ${currency}`,
    }
  }
)

/**
 * Example: Batch data fetching with deduplication
 */
const userBatcher = new BatchDedupe(
  async (userIds: string[]) => {
    // Simulate batch database query
    const users = await Promise.all(
      userIds.map(id => ({
        id,
        name: `User ${id}`,
        email: `user${id}@example.com`
      }))
    )
    
    return new Map(users.map(user => [user.id, user]))
  },
  { batchSize: 50, batchDelay: 10 }
)

export const getUser = createServerFn(
  'GET',
  async (params: { userId: string }, { request }) => {
    const event = request as unknown as H3Event
    
    // Use batch deduplication
    const user = await userBatcher.get(params.userId)
    
    // Track analytics
    const analytics = getAnalytics(event)
    if (analytics) {
      await analytics.trackApiRequest(event, {
        endpoint: 'getUser',
        userId: params.userId
      })
    }
    
    return user
  }
)

/**
 * Example: Cache invalidation on mutation
 */
export const updateProduct = createServerFn(
  'POST',
  async (params: { id: string, name: string }, { request }) => {
    const event = request as unknown as H3Event
    
    // Update product (simulated)
    const updated = { id: params.id, name: params.name }
    
    // Invalidate related caches
    await invalidateCache(event, {
      tags: ['products'],
      keys: [`products:${params.id}`]
    })
    
    return updated
  }
)

/**
 * Example: HTML fragment caching
 */
export const getCachedHTMLFragment = createServerFn(
  'GET',
  async (params: { component: string }, { request }) => {
    const event = request as unknown as H3Event
    
    return withCache(
      event,
      `html:${params.component}`,
      async () => {
        // Generate HTML (expensive operation)
        const html = `
          <div class="component-${params.component}">
            <h2>Cached Component</h2>
            <p>Generated at: ${new Date().toISOString()}</p>
          </div>
        `
        
        return html
      },
      {
        ttl: 3600, // 1 hour
        tags: ['html-fragments', params.component]
      }
    )
  }
)

/**
 * Example: Geo-based middleware configuration
 */
export const geoMiddleware = createGeoMiddleware({
  rules: [
    // Block specific countries
    {
      countries: ['XX', 'YY'], // Replace with actual country codes
      block: true
    },
    // Redirect EU users to GDPR-compliant version
    {
      continents: ['EU'],
      customHandler: async (event, geo) => {
        event.node.res.setHeader('X-GDPR-Region', 'true')
        // Could redirect to eu.example.com
      }
    },
    // A/B test for US users
    {
      countries: ['US'],
      customHandler: async (event, geo) => {
        const variant = Math.random() > 0.5 ? 'A' : 'B'
        event.node.res.setHeader('X-AB-Test', variant)
      }
    }
  ],
  defaultBehavior: 'allow',
  cookieOverride: 'geo-override'
})

/**
 * Example: Performance monitoring
 */
export const monitoredEndpoint = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    const analytics = getAnalytics(event)
    
    const startTime = performance.now()
    
    try {
      // Do some work
      const result = await someExpensiveOperation()
      
      // Track performance
      if (analytics) {
        await analytics.track({
          name: 'endpoint_performance',
          properties: {
            duration: performance.now() - startTime,
            success: true
          }
        })
      }
      
      return result
    } catch (error) {
      // Track error
      if (analytics && error instanceof Error) {
        await analytics.trackError(event, error)
      }
      
      throw error
    }
  }
)

// Helper function
async function someExpensiveOperation() {
  await new Promise(resolve => setTimeout(resolve, 100))
  return { data: 'result' }
}

/**
 * Example: Cache warming script
 */
export async function warmCache(event: H3Event) {
  const endpoints = [
    { fn: getCachedProducts, params: { category: 'electronics' } },
    { fn: getCachedProducts, params: { category: 'books' } },
    { fn: getCachedHTMLFragment, params: { component: 'header' } },
    { fn: getCachedHTMLFragment, params: { component: 'footer' } },
  ]
  
  // Warm cache by calling endpoints
  await Promise.all(
    endpoints.map(({ fn, params }) => 
      fn(params, { request: event as any }).catch(console.error)
    )
  )
}

/**
 * Example: Edge-side includes (ESI) pattern
 */
export const getPageWithESI = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    
    // Set appropriate cache headers for the main page
    setCacheHeaders(event, {
      ttl: 300, // 5 minutes
      swr: 3600, // 1 hour
    })
    
    // Return HTML with ESI tags
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Page with ESI</title>
        </head>
        <body>
          <esi:include src="/api/cached-fragment/header" />
          
          <main>
            <h1>Main Content</h1>
            <p>This part is cached for 5 minutes</p>
          </main>
          
          <esi:include src="/api/cached-fragment/footer" />
        </body>
      </html>
    `
  }
)