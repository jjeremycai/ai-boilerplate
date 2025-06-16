import type { AppLoadContext } from "@react-router/cloudflare";

export interface Env {
  // KV Namespaces
  CAI_CACHE: KVNamespace;
  
  // D1 Database (uncomment when needed)
  // DB: D1Database;
  
  // R2 Storage (uncomment when needed)
  // BUCKET: R2Bucket;
  
  // Environment variables
  NODE_ENV: string;
  
  // Add other bindings as needed
}

declare module "@react-router/cloudflare" {
  export interface AppLoadContext {
    env: Env;
  }
}

export function getLoadContext(env: Env): AppLoadContext {
  return {
    env,
  } as AppLoadContext;
}
