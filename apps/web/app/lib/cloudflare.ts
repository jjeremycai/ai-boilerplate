import { createServerFn } from '@tanstack/start'
import { H3Event } from 'h3'
import type { CloudflareEnv } from '../types/cloudflare'

export function getCloudflareContext(event: H3Event): {
  env: CloudflareEnv
  cf: IncomingRequestCfProperties
  ctx: ExecutionContext
} {
  return event.context.cloudflare
}

// Helper to get Cloudflare environment bindings
export const getEnv = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    const { env } = getCloudflareContext(event)
    return env
  }
)

// Re-export utilities for convenience
export * from './cache'
export * from './dedupe'
export * from './analytics'
export * from './geo'
export * from '../utils/cf-env'