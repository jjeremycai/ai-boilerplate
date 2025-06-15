import { OpenNextConfig } from '@opennextjs/cloudflare'

const config: OpenNextConfig = {
  // Cloudflare-specific configuration
  buildCommand: 'bun run build',
  outputDir: '.vercel/output',
  
  // Enable edge runtime for API routes
  functions: {
    api: {
      runtime: 'edge',
    },
  },
  
  // Cloudflare Workers settings
  cloudflare: {
    kvNamespace: 'CAI_CACHE',
    compatibility_date: '2024-12-18',
    compatibility_flags: ['nodejs_compat'],
  },
}

export default config