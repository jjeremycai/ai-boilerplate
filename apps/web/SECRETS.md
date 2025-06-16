# Cloudflare Secrets Management

This app uses Cloudflare's built-in secrets management for sensitive configuration values.

## Why Use Cloudflare Secrets?

- **Encrypted at rest**: Secrets are encrypted and only decrypted in the worker runtime
- **Not exposed in code**: Secrets are never committed to version control
- **Environment-specific**: Different secrets for development, staging, and production
- **Audit trail**: Cloudflare logs secret access for security monitoring

## Setting Secrets

Use the `wrangler secret` command to manage secrets:

```bash
# Set a secret (you'll be prompted to enter the value)
wrangler secret put JWT_SECRET

# Set a secret with a value from a file
wrangler secret put DATABASE_URL < database-url.txt

# List all secrets (shows names only, not values)
wrangler secret list

# Delete a secret
wrangler secret delete OLD_SECRET
```

## Common Secrets

Add these secrets for a typical application:

```bash
# Authentication
wrangler secret put JWT_SECRET

# Database
wrangler secret put DATABASE_URL

# External APIs
wrangler secret put OPENAI_API_KEY
wrangler secret put STRIPE_SECRET_KEY

# Email
wrangler secret put SMTP_PASSWORD
```

## Using Secrets in Code

Secrets are available in your server functions via the Cloudflare environment:

```typescript
import { createServerFn } from '@tanstack/start'
import { getJWTSecret } from '~/lib/secrets'

// Use the helper function
const authenticateUser = createServerFn(
  'POST',
  async ({ token }) => {
    const secret = await getJWTSecret()
    // Use secret to verify JWT...
  }
)

// Or access directly in server functions
const myServerFn = createServerFn(
  'GET',
  async (_, { request }) => {
    const event = request as unknown as H3Event
    const { env } = getCloudflareContext(event)
    
    const apiKey = env.API_KEY
    // Use the API key...
  }
)
```

## Development vs Production

### Local Development

For local development with `wrangler dev`, create a `.dev.vars` file:

```bash
# .dev.vars (DO NOT COMMIT THIS FILE)
JWT_SECRET=dev-secret-key
DATABASE_URL=postgresql://localhost:5432/myapp
API_KEY=dev-api-key
```

Add `.dev.vars` to your `.gitignore`!

### Production

In production, use `wrangler secret put` to set real secrets. These are encrypted and only accessible in the Cloudflare Workers runtime.

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** (update with `wrangler secret put`)
4. **Limit secret access** to only the functions that need them
5. **Monitor secret usage** in Cloudflare dashboard

## TypeScript Support

Update `app/types/cloudflare.ts` to include your secrets for type safety:

```typescript
export interface CloudflareEnv {
  // ... other bindings
  
  // Secrets
  JWT_SECRET?: string
  DATABASE_URL?: string
  API_KEY?: string
  // Add your secrets here
}
```