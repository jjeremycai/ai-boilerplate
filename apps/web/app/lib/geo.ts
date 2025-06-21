import type { GeoLocation } from '../types/cloudflare'
import { H3Event, sendRedirect, getCookie, defineEventHandler } from 'h3'
import { getGeoLocation, getCfProperties } from '../utils/cf-env'

interface GeoRule {
  countries?: string[]
  continents?: string[]
  regions?: string[]
  redirect?: string
  block?: boolean
  customHandler?: (event: H3Event, geo: GeoLocation) => void | Promise<void>
}

interface GeoConfig {
  rules: GeoRule[]
  defaultBehavior?: 'allow' | 'block'
  cookieOverride?: string // Cookie name to override geo detection
}

/**
 * Geo-based routing and access control
 */
export class GeoRouter {
  constructor(private config: GeoConfig) {}
  
  /**
   * Check if location matches rule
   */
  private matchesRule(geo: GeoLocation, rule: GeoRule): boolean {
    if (rule.countries && geo.country) {
      if (!rule.countries.includes(geo.country)) return false
    }
    
    if (rule.continents && geo.continent) {
      if (!rule.continents.includes(geo.continent)) return false
    }
    
    if (rule.regions && geo.region) {
      if (!rule.regions.includes(geo.region)) return false
    }
    
    return true
  }
  
  /**
   * Process request based on geo rules
   */
  async process(event: H3Event): Promise<void> {
    // Check for cookie override
    if (this.config.cookieOverride) {
      const override = getCookie(event, this.config.cookieOverride)
      if (override) {
        // Parse override value (e.g., "US" or "EU")
        const [country, region] = override.split(':')
        const geo: GeoLocation = { country, region }
        return this.applyRules(event, geo)
      }
    }
    
    // Get actual geo location
    const geo = getGeoLocation(event)
    return this.applyRules(event, geo)
  }
  
  /**
   * Apply geo rules
   */
  private async applyRules(event: H3Event, geo: GeoLocation): Promise<void> {
    // Find matching rule
    for (const rule of this.config.rules) {
      if (this.matchesRule(geo, rule)) {
        // Apply custom handler
        if (rule.customHandler) {
          await rule.customHandler(event, geo)
          return
        }
        
        // Apply block
        if (rule.block) {
          event.node.res.statusCode = 403
          event.node.res.end('Access denied from your location')
          return
        }
        
        // Apply redirect
        if (rule.redirect) {
          await sendRedirect(event, rule.redirect, 302)
          return
        }
      }
    }
    
    // Apply default behavior
    if (this.config.defaultBehavior === 'block') {
      event.node.res.statusCode = 403
      event.node.res.end('Access denied from your location')
    }
  }
}

/**
 * Get user's preferred language based on location
 */
export function getPreferredLanguage(event: H3Event): string {
  const geo = getGeoLocation(event)
  
  // Language mapping by country
  const languageMap: Record<string, string> = {
    // Europe
    'DE': 'de',
    'FR': 'fr',
    'ES': 'es',
    'IT': 'it',
    'NL': 'nl',
    'PT': 'pt',
    'PL': 'pl',
    'RU': 'ru',
    // Asia
    'CN': 'zh',
    'JP': 'ja',
    'KR': 'ko',
    'IN': 'hi',
    // Americas
    'BR': 'pt',
    'MX': 'es',
    // Default
    'US': 'en',
    'GB': 'en',
    'CA': 'en',
    'AU': 'en'
  }
  
  // Check Accept-Language header first
  const acceptLanguage = event.node.req.headers['accept-language']
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]
    if (preferred) return preferred
  }
  
  // Use country-based language
  if (geo.country && languageMap[geo.country]) {
    return languageMap[geo.country]
  }
  
  return 'en' // Default to English
}

/**
 * Get nearest data center or region
 */
export function getNearestRegion(event: H3Event): string {
  const geo = getGeoLocation(event)
  const colo = geo.colo
  
  // Map Cloudflare colos to regions
  const regionMap: Record<string, string> = {
    // North America
    'IAD': 'us-east',
    'ORD': 'us-central',
    'DFW': 'us-central',
    'LAX': 'us-west',
    'SJC': 'us-west',
    'YYZ': 'ca-central',
    // Europe
    'LHR': 'eu-west',
    'CDG': 'eu-west',
    'FRA': 'eu-central',
    'AMS': 'eu-west',
    // Asia Pacific
    'NRT': 'ap-northeast',
    'HKG': 'ap-east',
    'SIN': 'ap-southeast',
    'SYD': 'ap-southeast',
    // Add more mappings as needed
  }
  
  if (colo && regionMap[colo]) {
    return regionMap[colo]
  }
  
  // Fallback to continent-based regions
  const continentMap: Record<string, string> = {
    'NA': 'us-central',
    'EU': 'eu-west',
    'AS': 'ap-southeast',
    'OC': 'ap-southeast',
    'SA': 'us-east',
    'AF': 'eu-west'
  }
  
  if (geo.continent && continentMap[geo.continent]) {
    return continentMap[geo.continent]
  }
  
  return 'us-central' // Default
}

/**
 * Currency detection based on location
 */
export function getPreferredCurrency(event: H3Event): string {
  const geo = getGeoLocation(event)
  
  // Currency mapping by country
  const currencyMap: Record<string, string> = {
    // Eurozone
    'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
    'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR',
    'FI': 'EUR', 'IE': 'EUR', 'GR': 'EUR', 'LU': 'EUR',
    // Other Europe
    'GB': 'GBP',
    'CH': 'CHF',
    'SE': 'SEK',
    'NO': 'NOK',
    'DK': 'DKK',
    'PL': 'PLN',
    'CZ': 'CZK',
    // Americas
    'US': 'USD',
    'CA': 'CAD',
    'MX': 'MXN',
    'BR': 'BRL',
    'AR': 'ARS',
    // Asia Pacific
    'JP': 'JPY',
    'CN': 'CNY',
    'KR': 'KRW',
    'IN': 'INR',
    'AU': 'AUD',
    'NZ': 'NZD',
    'SG': 'SGD',
    'HK': 'HKD',
    // Others
    'ZA': 'ZAR',
    'AE': 'AED',
    'SA': 'SAR',
    'IL': 'ILS',
    'RU': 'RUB'
  }
  
  if (geo.country && currencyMap[geo.country]) {
    return currencyMap[geo.country]
  }
  
  return 'USD' // Default to USD
}

/**
 * GDPR compliance check
 */
export function isGDPRCountry(event: H3Event): boolean {
  const geo = getGeoLocation(event)
  
  // EU countries + UK + EEA
  const gdprCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 'NO'
  ]
  
  return geo.country ? gdprCountries.includes(geo.country) : false
}

/**
 * Create geo-based middleware
 */
export function createGeoMiddleware(config: GeoConfig) {
  const router = new GeoRouter(config)
  
  return defineEventHandler(async (event: H3Event) => {
    await router.process(event)
  })
}

/**
 * Geo-based A/B testing
 */
export class GeoABTest {
  constructor(
    private variants: Record<string, {
      countries?: string[]
      percentage?: number
      handler: (event: H3Event) => void | Promise<void>
    }>
  ) {}
  
  async run(event: H3Event): Promise<void> {
    const geo = getGeoLocation(event)
    
    // Check country-specific variants first
    for (const [variant, config] of Object.entries(this.variants)) {
      if (config.countries && geo.country) {
        if (config.countries.includes(geo.country)) {
          await config.handler(event)
          event.node.res.setHeader('X-AB-Variant', variant)
          return
        }
      }
    }
    
    // Fall back to percentage-based selection
    let accumulated = 0
    const random = Math.random() * 100
    
    for (const [variant, config] of Object.entries(this.variants)) {
      if (!config.countries && config.percentage) {
        accumulated += config.percentage
        if (random <= accumulated) {
          await config.handler(event)
          event.node.res.setHeader('X-AB-Variant', variant)
          return
        }
      }
    }
  }
}

/**
 * Timezone detection
 */
export function getUserTimezone(event: H3Event): string {
  const geo = getGeoLocation(event)
  
  if (geo.timezone) {
    return geo.timezone
  }
  
  // Fallback to country-based timezone mapping
  const timezoneMap: Record<string, string> = {
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'AU': 'Australia/Sydney',
    'BR': 'America/Sao_Paulo',
    'IN': 'Asia/Kolkata',
    'RU': 'Europe/Moscow'
  }
  
  if (geo.country && timezoneMap[geo.country]) {
    return timezoneMap[geo.country]
  }
  
  return 'UTC'
}