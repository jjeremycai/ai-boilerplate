import type { CloudflareEnv, GeoLocation } from '../types/cloudflare'
import { H3Event } from 'h3'

/**
 * Get Cloudflare request properties including geo information
 */
export function getCfProperties(event: H3Event): IncomingRequestCfProperties | undefined {
  return event.context.cloudflare?.cf
}

/**
 * Get geo location information from Cloudflare request
 */
export function getGeoLocation(event: H3Event): GeoLocation {
  const cf = getCfProperties(event)
  
  return {
    country: cf?.country as string | undefined,
    region: cf?.region as string | undefined,
    city: cf?.city as string | undefined,
    continent: cf?.continent as string | undefined,
    latitude: cf?.latitude as string | undefined,
    longitude: cf?.longitude as string | undefined,
    postalCode: cf?.postalCode as string | undefined,
    timezone: cf?.timezone as string | undefined,
    colo: cf?.colo as string | undefined,
  }
}

/**
 * Get the Cloudflare execution context
 */
export function getExecutionContext(event: H3Event): ExecutionContext | undefined {
  return event.context.cloudflare?.ctx
}

/**
 * Get the Cloudflare environment bindings
 */
export function getCloudflareEnv(event: H3Event): CloudflareEnv | undefined {
  return event.context.cloudflare?.env
}

/**
 * Check if we're running in Cloudflare Workers environment
 */
export function isCloudflareWorker(): boolean {
  return typeof globalThis.caches !== 'undefined' && 
         'default' in globalThis.caches
}

/**
 * Get cache storage (Workers Cache API)
 */
export function getCacheStorage(): Cache | undefined {
  if (!isCloudflareWorker()) return undefined
  return caches.default
}