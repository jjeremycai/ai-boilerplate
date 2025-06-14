# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+
- Cloudflare account
- GitHub account (for deployment)

## 1. Clone and Install
```bash
git clone https://github.com/YOUR_USERNAME/ai-boilerplate.git
cd ai-boilerplate
npm install
```

## 2. Create Cloudflare Resources

### Create KV Namespace
```bash
# Create KV namespace for blog posts
npx wrangler kv:namespace create "KV"

# Output will look like:
# ✨ Successfully created KV namespace "KV"
# id = "abcd1234..."
```

### Create D1 Database
```bash
# Create D1 database for items
npx wrangler d1 create ai-boilerplate-db

# Output will look like:
# ✨ Successfully created D1 database "ai-boilerplate-db"
# database_id = "xyz789..."

# Run migrations
npx wrangler d1 execute ai-boilerplate-db --file=./worker/src/db/schema.sql
```

## 3. Update Configuration

Edit `wrangler.toml` and replace the placeholder IDs:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_ACTUAL_KV_ID_HERE"  # From step 2

[[d1_databases]]
binding = "DB"
database_name = "ai-boilerplate-db"
database_id = "YOUR_ACTUAL_D1_ID_HERE"  # From step 2
```

## 4. Set Up Authentication

### Get WorkOS Keys
1. Sign up at https://workos.com
2. Create a new organization
3. Navigate to Authentication > Configure
4. Copy your Client ID and API Key

### Add to .env (local development)
```bash
cp .env.example .env
# Edit .env and add:
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Add to .dev.vars (worker development)
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars and add:
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Add to GitHub Secrets (deployment)
```bash
# Using GitHub CLI
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
```

Or manually at: https://github.com/YOUR_USERNAME/ai-boilerplate/settings/secrets/actions

## 5. Deploy

### Local Development
```bash
npm run dev        # Frontend at http://localhost:5173
npm run dev:worker # Full stack at http://localhost:8787
```

### Production Deployment
```bash
git push main  # Auto-deploys via GitHub Actions
```

## Features That Need Resources

| Feature | Required Resource | Setup Command |
|---------|------------------|---------------|
| Blog Posts | KV Namespace | `wrangler kv:namespace create "KV"` |
| Items CRUD | D1 Database | `wrangler d1 create ai-boilerplate-db` |
| AI Chat | Workers AI | Enabled by default |
| Auth | Clerk Keys | Get from https://clerk.dev |

## Troubleshooting

### "KV namespace 'YOUR_KV_NAMESPACE_ID' is not valid"
→ You need to create the KV namespace and update the ID in wrangler.toml

### "Cannot find binding DB"
→ You need to create the D1 database and update the ID in wrangler.toml

### "Missing Clerk Publishable Key"
→ Add VITE_CLERK_PUBLISHABLE_KEY to .env file

### Build taking forever
→ We've optimized dependencies, but first install might take 2-3 minutes

## What's Included

- **Single Dashboard** with 3 features:
  - D1 Database for items management
  - KV Store for SEO blog posts
  - AI Chat with persistent history (Durable Objects)
- **Volume-Based D1 Sharding** - Scale beyond 10GB limit automatically
- **Minimal dependencies** - only essentials
- **Fast builds** - optimized for quick deployment
- **Production-ready** - Built to scale from day one

## Optional: Enable Sharding

If you expect to scale beyond D1's 10GB limit:

```bash
# Deploy with sharding support
npm run deploy:sharding

# Check shard health
curl https://your-worker.workers.dev/api/v1/shards/health
```

See [docs/VOLUME-SHARDING.md](./docs/VOLUME-SHARDING.md) for full setup.

Ready to build! 🚀