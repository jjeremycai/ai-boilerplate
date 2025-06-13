import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import { clerkMiddleware } from './middleware/clerk'
import { errorHandler } from './middleware/error'
import { apiRoutes } from './routes'

export interface Env {
  DB: D1Database
  KV: KVNamespace
  CLERK_SECRET_KEY: string
  CLERK_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  STRIPE_PUBLISHABLE_KEY: string
  ENVIRONMENT: string
  ASSETS: Fetcher
  CHAT_ROOMS: DurableObjectNamespace
  USER_SESSIONS: DurableObjectNamespace
  AGENT_CHAT_ROOMS: DurableObjectNamespace
  AI: any // Cloudflare Workers AI
  AI_GATEWAY_ACCOUNT_ID?: string
  AI_GATEWAY_ID?: string
  // Volume-based shard bindings
  [key: string]: any // Allow dynamic shard bindings like DB_VOL_001_*
}

const app = new Hono<{ Bindings: Env }>()

// Global middleware
app.use('*', logger())
app.use('*', cors({
  origin: (origin) => {
    // In production, replace with your actual domain
    const allowedOrigins = ['http://localhost:5173', 'https://yourdomain.com']
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  },
  credentials: true,
}))

// Error handling
app.onError(errorHandler)

// Health check
app.get('/health', async (c) => {
  const checks = {
    db: false,
    kv: false,
    clerk: !!c.env.CLERK_SECRET_KEY,
    durableObjects: !!(c.env.CHAT_ROOMS && c.env.USER_SESSIONS),
  };

  try {
    // Test database connection
    if (c.env.DB) {
      await c.env.DB.prepare('SELECT 1').first();
      checks.db = true;
    }
  } catch (error) {
    console.error('DB health check failed:', error);
  }

  try {
    // Test KV connection
    if (c.env.KV) {
      await c.env.KV.put('health-check', 'ok', { expirationTtl: 60 });
      checks.kv = true;
    }
  } catch (error) {
    console.error('KV health check failed:', error);
  }

  const allHealthy = Object.values(checks).every(Boolean);
  
  return c.json({ 
    status: allHealthy ? 'ok' : 'partial',
    timestamp: new Date().toISOString(),
    checks,
    environment: c.env.ENVIRONMENT || 'development'
  }, allHealthy ? 200 : 503);
})

// API routes
app.route('/api/v1', apiRoutes)

// Serve static assets for SPA
app.get('*', async (c) => {
  // Try to serve the requested file
  try {
    return await c.env.ASSETS.fetch(c.req.raw)
  } catch {
    // If file not found, serve index.html for SPA routing
    const indexUrl = new URL('/index.html', c.req.url)
    return c.env.ASSETS.fetch(new Request(indexUrl.toString(), c.req.raw))
  }
})

export default app

// Export Durable Objects
export { ChatRoom } from './durable-objects/ChatRoom'
export { UserSession } from './durable-objects/UserSession'
export { AgentChatRoom } from './durable-objects/AgentChatRoom'

// Export scheduled handler for shard monitoring
export { default as scheduled } from './scheduled'