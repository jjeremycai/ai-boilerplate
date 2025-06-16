/**
 * TODO: This is a WIP. The goal is to have a single source of truth for all environment variables.
 * Different prefixes for public environments across Expo & Remix currently block this.
 */

import { object, parse, string } from 'valibot'

const envSchema = object({
  NODE_ENV: string(),
  // Routing
  PUBLIC_API_URL: string(),
  PUBLIC_APP_URL: string(),
  // Customer Support
  PUBLIC_SUPPORT_EMAIL: string(),
  // Web Metadata
  PUBLIC_METADATA_NAME: string(),
})

export const env = parse(envSchema, process.env)
