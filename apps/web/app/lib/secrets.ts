import { createServerFn } from '@tanstack/start'
import { getCloudflareContext } from './cloudflare'
import type { H3Event } from 'h3'

/**
 * Get a secret from Cloudflare environment
 * Secrets are encrypted at rest and only available in the worker runtime
 */
export const getSecret = createServerFn(
  'GET',
  async (secretName: string, { request }) => {
    const event = request as unknown as H3Event
    const { env } = getCloudflareContext(event)
    
    // Access secret from environment
    const secret = env[secretName as keyof typeof env]
    
    if (!secret) {
      throw new Error(`Secret ${secretName} not found`)
    }
    
    return secret as string
  }
)

/**
 * Example: Get JWT secret for authentication
 */
export const getJWTSecret = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    const { env } = getCloudflareContext(event)
    
    if (!env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured')
    }
    
    return env.JWT_SECRET
  }
)

/**
 * Example: Get database connection string
 */
export const getDatabaseUrl = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    const { env } = getCloudflareContext(event)
    
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured')
    }
    
    return env.DATABASE_URL
  }
)