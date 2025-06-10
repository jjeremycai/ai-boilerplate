# Deployment Guide

This guide covers deploying your application to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Note your Account ID from the dashboard

2. **Wrangler CLI**
   - Installed automatically with Bun
   - Authenticate: `wrangler login`

3. **Environment Variables**
   - Set up Clerk authentication keys
   - Configure any other required secrets

## Quick Deploy

```bash
# One-command deployment
bun run deploy
```

This runs the deployment script that:
1. Builds the entire application
2. Runs tests to ensure quality
3. Deploys to Cloudflare Workers
4. Provides deployment URLs

## Manual Deployment Steps

### 1. Build Application

```bash
bun run build
```

### 2. Deploy Backend

```bash
cd apps/backend
wrangler deploy --config wrangler.deploy.toml
```

### 3. Verify Deployment

```bash
# Check deployment status
wrangler tail

# View worker metrics
wrangler metrics
```

## Production Configuration

### Environment Variables

Set production secrets:

```bash
# Clerk Authentication
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY

# Other secrets as needed
wrangler secret put DATABASE_URL
```

### Database Setup

1. **Create D1 Database**
   ```bash
   wrangler d1 create boilerplate-db
   ```

2. **Update Configuration**
   - Add database ID to `wrangler.deploy.toml`
   - Uncomment the D1 configuration section

3. **Run Migrations**
   ```bash
   wrangler d1 execute boilerplate-db --file=./apps/backend/src/db/schema.sql
   ```

### KV Namespace Setup

1. **Create KV Namespace**
   ```bash
   wrangler kv:namespace create "KV"
   ```

2. **Update Configuration**
   - Add namespace ID to `wrangler.deploy.toml`
   - Uncomment the KV configuration section

## GitHub Actions Deployment

The repository includes automated deployment via GitHub Actions.

### Setup

1. **Add GitHub Secrets**
   - `CLOUDFLARE_API_TOKEN`: Your API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your account ID

2. **Push to Main Branch**
   - Deployments trigger automatically
   - Check Actions tab for status

### Manual Trigger

```yaml
# Trigger deployment manually
workflow_dispatch
```

## Custom Domains

### Add Custom Domain

1. **In Cloudflare Dashboard**
   - Workers & Pages → Your Worker
   - Custom Domains → Add
   - Enter your domain

2. **DNS Configuration**
   - Automatically configured if domain is on Cloudflare
   - Otherwise, add CNAME record

### SSL/TLS

- Automatic SSL certificates
- Full end-to-end encryption
- No additional configuration needed

## Monitoring

### Real-time Logs

```bash
# Stream live logs
wrangler tail

# Filter logs
wrangler tail --search "error"
```

### Analytics

- View in Cloudflare dashboard
- Request counts, errors, latency
- Geographic distribution

### Error Tracking

Consider integrating:
- Sentry for error tracking
- Custom error handling
- Structured logging

## Rollback

### Quick Rollback

```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback
```

### Version Management

- Tag releases in Git
- Use deployment annotations
- Maintain deployment log

## Performance Optimization

1. **Edge Caching**
   - Configure cache headers
   - Use KV for static data
   - Implement stale-while-revalidate

2. **Bundle Size**
   - Monitor with `wrangler metrics`
   - Optimize imports
   - Use code splitting

3. **Global Distribution**
   - Automatic via Cloudflare network
   - 200+ data centers worldwide
   - <50ms latency for most users

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check `bun.lockb` exists
   - Verify all dependencies installed
   - Review TypeScript errors

2. **Deployment Errors**
   - Check wrangler authentication
   - Verify account permissions
   - Review error logs

3. **Runtime Errors**
   - Use `wrangler tail` for logs
   - Check environment variables
   - Verify service bindings

### Debug Mode

```bash
# Local development with production config
wrangler dev --config wrangler.deploy.toml
```

## Security Checklist

- [ ] Environment variables set as secrets
- [ ] Authentication configured
- [ ] CORS headers appropriate
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages sanitized

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Community Discord](https://discord.cloudflare.com)