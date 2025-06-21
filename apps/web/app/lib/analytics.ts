import type { CloudflareEnv, AnalyticsEvent } from '../types/cloudflare'
import { H3Event, defineEventHandler } from 'h3'
import { getCloudflareEnv, getCfProperties, getGeoLocation } from '../utils/cf-env'

interface AnalyticsConfig {
  sampleRate?: number // 0-1, percentage of events to track
  enableGeo?: boolean
  enableUserAgent?: boolean
  enableReferer?: boolean
  customDimensions?: Record<string, any>
}

interface AnalyticsContext {
  timestamp: number
  url: string
  method: string
  statusCode?: number
  duration?: number
  geo?: Record<string, any>
  userAgent?: string
  referer?: string
  ip?: string
  colo?: string
}

/**
 * Analytics client for Cloudflare Workers Analytics Engine
 */
export class EdgeAnalytics {
  private env: CloudflareEnv
  private config: AnalyticsConfig
  
  constructor(env: CloudflareEnv, config: AnalyticsConfig = {}) {
    this.env = env
    this.config = {
      sampleRate: 1,
      enableGeo: true,
      enableUserAgent: true,
      enableReferer: true,
      ...config
    }
  }
  
  /**
   * Check if event should be tracked based on sample rate
   */
  private shouldTrack(): boolean {
    if (this.config.sampleRate === 1) return true
    if (this.config.sampleRate === 0) return false
    return Math.random() < (this.config.sampleRate || 1)
  }
  
  /**
   * Get analytics context from request
   */
  private getContext(event: H3Event): AnalyticsContext {
    const context: AnalyticsContext = {
      timestamp: Date.now(),
      url: event.node.req.url || '/',
      method: event.node.req.method || 'GET',
    }
    
    // Add geo information
    if (this.config.enableGeo) {
      context.geo = getGeoLocation(event)
      context.colo = getCfProperties(event)?.colo as string | undefined
    }
    
    // Add user agent
    if (this.config.enableUserAgent) {
      context.userAgent = event.node.req.headers['user-agent'] as string
    }
    
    // Add referer
    if (this.config.enableReferer) {
      context.referer = event.node.req.headers.referer as string
    }
    
    // Add IP (hashed for privacy)
    const cf = getCfProperties(event)
    if (cf?.clientIpAddress) {
      // Hash IP for privacy
      context.ip = await this.hashIP(cf.clientIpAddress)
    }
    
    return context
  }
  
  /**
   * Hash IP address for privacy
   */
  private async hashIP(ip: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(ip)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * Track page view
   */
  async trackPageView(event: H3Event, properties?: Record<string, any>): Promise<void> {
    if (!this.shouldTrack()) return
    
    const context = this.getContext(event)
    
    await this.track({
      name: 'page_view',
      properties: {
        ...context,
        ...properties,
        ...this.config.customDimensions
      }
    })
  }
  
  /**
   * Track API request
   */
  async trackApiRequest(
    event: H3Event, 
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.shouldTrack()) return
    
    const context = this.getContext(event)
    const startTime = Date.now()
    
    // Track request start
    await this.track({
      name: 'api_request',
      properties: {
        ...context,
        ...properties,
        phase: 'start',
        ...this.config.customDimensions
      }
    })
    
    // Return a function to track request end
    return async (statusCode: number, error?: Error) => {
      const duration = Date.now() - startTime
      
      await this.track({
        name: 'api_request',
        properties: {
          ...context,
          ...properties,
          phase: 'end',
          statusCode,
          duration,
          error: error?.message,
          ...this.config.customDimensions
        }
      })
    }
  }
  
  /**
   * Track custom event
   */
  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.shouldTrack()) return
    
    try {
      // Log to console in development
      if (this.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event)
      }
      
      // TODO: Send to Workers Analytics Engine when available
      // For now, we can store in KV or send to external service
      
      // Example: Store in KV for batch processing
      if (this.env.CAI_CACHE) {
        const key = `analytics:${Date.now()}:${Math.random()}`
        await this.env.CAI_CACHE.put(
          key,
          JSON.stringify(event),
          { expirationTtl: 86400 } // 24 hours
        )
      }
    } catch (error) {
      console.error('Analytics error:', error)
    }
  }
  
  /**
   * Track performance metrics
   */
  async trackPerformance(
    event: H3Event,
    metrics: {
      ttfb?: number // Time to first byte
      fcp?: number  // First contentful paint
      lcp?: number  // Largest contentful paint
      cls?: number  // Cumulative layout shift
      fid?: number  // First input delay
    }
  ): Promise<void> {
    if (!this.shouldTrack()) return
    
    await this.track({
      name: 'performance',
      properties: {
        url: event.node.req.url,
        ...metrics,
        ...this.config.customDimensions
      }
    })
  }
  
  /**
   * Track error
   */
  async trackError(
    event: H3Event,
    error: Error,
    properties?: Record<string, any>
  ): Promise<void> {
    // Always track errors (ignore sample rate)
    const context = this.getContext(event)
    
    await this.track({
      name: 'error',
      properties: {
        ...context,
        ...properties,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        ...this.config.customDimensions
      }
    })
  }
  
  /**
   * Track cache performance
   */
  async trackCache(
    event: H3Event,
    hit: boolean,
    key: string,
    duration?: number
  ): Promise<void> {
    if (!this.shouldTrack()) return
    
    await this.track({
      name: 'cache',
      properties: {
        url: event.node.req.url,
        hit,
        key,
        duration,
        ...this.config.customDimensions
      }
    })
  }
}

/**
 * Get analytics instance
 */
export function getAnalytics(
  event: H3Event, 
  config?: AnalyticsConfig
): EdgeAnalytics | null {
  const env = getCloudflareEnv(event)
  if (!env) return null
  
  return new EdgeAnalytics(env, config)
}

/**
 * Analytics middleware
 */
export const analyticsMiddleware = defineEventHandler(async (event: H3Event) => {
  const analytics = getAnalytics(event)
  if (!analytics) return
  
  const startTime = Date.now()
  
  // Track page view for non-API routes
  if (!event.node.req.url?.startsWith('/api/')) {
    await analytics.trackPageView(event)
  }
  
  // Add response tracking
  const originalEnd = event.node.res.end
  event.node.res.end = function(...args: any[]) {
    const duration = Date.now() - startTime
    const statusCode = event.node.res.statusCode || 200
    
    // Track API request completion
    if (event.node.req.url?.startsWith('/api/')) {
      analytics.trackApiRequest(event, {
        duration,
        statusCode
      })
    }
    
    // Track slow requests
    if (duration > 1000) {
      analytics.track({
        name: 'slow_request',
        properties: {
          url: event.node.req.url,
          duration,
          statusCode
        }
      })
    }
    
    return originalEnd.apply(event.node.res, args)
  }
})

/**
 * Client-side analytics snippet
 */
export function getAnalyticsSnippet(): string {
  return `
<script>
(function() {
  // Performance observer for Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Send metrics to analytics endpoint
        fetch('/api/analytics/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: entry.name,
            value: entry.value,
            metric: entry.entryType
          })
        }).catch(() => {})
      }
    })
    
    // Observe different metrics
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      observer.observe({ entryTypes: ['first-input'] })
      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {}
  }
  
  // Track page views on navigation
  let lastPath = window.location.pathname
  const trackPageView = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname
      fetch('/api/analytics/pageview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: window.location.pathname,
          referrer: document.referrer
        })
      }).catch(() => {})
    }
  }
  
  // Listen for navigation
  window.addEventListener('popstate', trackPageView)
  
  // Track errors
  window.addEventListener('error', (event) => {
    fetch('/api/analytics/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      })
    }).catch(() => {})
  })
})()
</script>
  `.trim()
}