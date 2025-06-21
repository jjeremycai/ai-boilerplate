export interface CloudflareEnv {
  // KV Namespaces
  CAI_CACHE: KVNamespace
  CAI_DEDUPE: KVNamespace
  CAI_HTML_CACHE: KVNamespace
  CAI_REQUEST_CACHE: KVNamespace
  
  // D1 Database (uncomment when needed)
  // DB: D1Database
  
  // R2 Storage (uncomment when needed)
  // BUCKET: R2Bucket
  
  // Environment variables (non-sensitive)
  NODE_ENV: string
  
  // Secrets (managed via wrangler secret)
  JWT_SECRET?: string
  DATABASE_URL?: string
  API_KEY?: string
  OPENAI_API_KEY?: string
  STRIPE_SECRET_KEY?: string
  SMTP_PASSWORD?: string
  
  // Add other bindings and secrets as needed
}

// Cache configuration types
export interface CacheConfig {
  ttl?: number
  swr?: number
  tags?: string[]
  key?: string
}

// Analytics event types
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
}

// Geo location types
export interface GeoLocation {
  country?: string
  region?: string
  city?: string
  continent?: string
  latitude?: string
  longitude?: string
  postalCode?: string
  timezone?: string
  colo?: string
}