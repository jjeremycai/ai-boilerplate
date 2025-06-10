# 🚀 Deployment Guide

## One-Click Deploy to Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jjeremycai/ai-boilerplate)

### What the One-Click Deploy Does

1. **Forks the repository** to your GitHub account
2. **Deploys the Worker** with basic AI functionality
3. **Sets up GitHub Actions** for continuous deployment
4. **Creates a live API** at `https://your-worker.your-subdomain.workers.dev`

### After One-Click Deploy

Your API will be live with basic endpoints:
- `GET /health` - Health check
- `GET /api/hello` - Hello world
- `POST /api/v1/ai/chat` - AI chat (requires auth setup)

## Manual Deployment

### Prerequisites

1. **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)
2. **Wrangler CLI** - `npm install -g wrangler`
3. **Node.js 18+** - [Download here](https://nodejs.org/)

### Step 1: Clone and Setup

```bash
git clone https://github.com/jjeremycai/ai-boilerplate.git
cd ai-boilerplate
npm install
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

### Step 3: Run Setup Wizard

```bash
npm run setup:wizard
```

This will:
- Create D1 database
- Create KV namespace  
- Generate wrangler.toml
- Set up environment files

### Step 4: Deploy

```bash
npm run deploy
```

## Environment Variables

### Required Secrets

```bash
# Authentication (for Standard+ templates)
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY

# AI Gateway (optional, for analytics)
wrangler secret put AI_GATEWAY_ACCOUNT_ID
wrangler secret put AI_GATEWAY_ID
```

### Optional Configuration

```bash
# Custom domain
wrangler secret put CUSTOM_DOMAIN

# Database encryption
wrangler secret put DB_ENCRYPTION_KEY
```

## Template-Specific Deployment

### Lite Template
```bash
# No database or auth required
wrangler deploy worker/src/index-lite.ts --name my-lite-api
```

### Standard Template
```bash
# Full setup with database
npm run setup:wizard  # Creates all resources
npm run deploy        # Deploys everything
```

### Enterprise Template
```bash
# Includes monitoring and CI/CD
npm run setup:wizard
npm run deploy:enterprise
```

## Custom Domain Setup

### 1. Add Domain to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Add your domain
3. Update nameservers

### 2. Configure Worker Route

```bash
# Add custom route
wrangler route put api.yourdomain.com/* your-worker-name
```

### 3. Update CORS Origins

Update `worker/src/index.ts`:
```typescript
cors({
  origin: ['https://yourdomain.com', 'https://api.yourdomain.com'],
  credentials: true,
})
```

## Database Setup

### Automatic (Recommended)

```bash
npm run setup:wizard
```

### Manual Setup

```bash
# Create database
wrangler d1 create my-database

# Run migrations  
wrangler d1 execute my-database --file=worker/src/db/schema.sql

# Seed demo data
npm run db:seed
```

## Monitoring and Analytics

### Built-in Observability

- **Worker Analytics** - Automatic in Cloudflare Dashboard
- **AI Gateway Analytics** - If configured
- **Real User Monitoring** - Available in Enterprise

### Custom Metrics

```typescript
// Add to your routes
app.get('/api/metrics', async (c) => {
  return c.json({
    requests: await c.env.KV.get('request_count'),
    ai_calls: await c.env.KV.get('ai_call_count'),
    // ... more metrics
  })
})
```

## Troubleshooting

### Common Issues

**"Repository not found"**
```bash
# Make sure repository is public or you have access
git clone https://github.com/jjeremycai/ai-boilerplate.git
```

**"Wrangler not authenticated"**
```bash
wrangler logout
wrangler login
```

**"D1 database not found"**
```bash
# Run setup wizard to create resources
npm run setup:wizard
```

**"AI binding not available"**
```bash
# Make sure wrangler.toml includes:
ai = { binding = "AI" }
```

### Getting Help

1. Check the [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
2. Review the [Troubleshooting Guide](./TROUBLESHOOTING.md)
3. Open an issue on [GitHub](https://github.com/jjeremycai/ai-boilerplate/issues)

## Performance Optimization

### Edge Caching

```typescript
// Cache static responses
app.get('/api/models', async (c) => {
  const response = c.json(models)
  response.headers.set('Cache-Control', 'public, max-age=3600')
  return response
})
```

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### AI Gateway Caching

Set up AI Gateway for:
- Response caching
- Rate limiting
- Analytics
- Cost optimization

## Security Best Practices

### 1. Environment Variables

```bash
# Never commit secrets to git
echo "*.env*" >> .gitignore
echo ".dev.vars" >> .gitignore
```

### 2. CORS Configuration

```typescript
cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173'],
  credentials: true,
})
```

### 3. Rate Limiting

```typescript
// Add rate limiting middleware
app.use('/api/*', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}))
```

---

**🎯 Goal: Deploy in under 5 minutes with one-click, or fully customize in under 60 minutes**