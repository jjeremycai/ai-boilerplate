export interface CloudflareEnv {
  // KV Namespaces
  CAI_CACHE: KVNamespace
  
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