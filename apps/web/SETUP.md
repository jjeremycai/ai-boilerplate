# Web App Setup Guide

This guide will help you set up the Remix web app for your project.

## Quick Start

### 1. Rename the App

Update `wrangler.toml`:
```toml
name = "your-app-name-web"  # Change from "my-app-web"

[env.preview]
name = "your-app-name-web-preview"  # Change from "my-app-web-preview"
```

### 2. Create Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create KV namespace for caching
wrangler kv:namespace create "CACHE"
# Note the ID that's returned

# (Optional) Create D1 database
wrangler d1 create your-app-db

# (Optional) Create R2 bucket
wrangler r2 bucket create your-app-storage
```

### 3. Update Configuration

Update the IDs in `wrangler.toml` with the values from step 2:
```toml
[[kv_namespaces]]
binding = "CAI_CACHE"
id = "paste-your-kv-namespace-id-here"

# Uncomment and update if using D1
# [[d1_databases]]
# binding = "DB"
# database_name = "your-app-db"
# database_id = "paste-your-d1-database-id-here"
```

### 4. Deploy

```bash
# Install dependencies (from monorepo root)
bun install

# Build the app
bun run build

# Deploy to Cloudflare Workers
bun run deploy
```

## Customization Checklist

- [ ] Update app name in `wrangler.toml`
- [ ] Create and configure KV namespace
- [ ] Update meta tags in `app/root.tsx`
- [ ] Replace favicon and PWA icons in `public/`
- [ ] Update colors in `tailwind.config.js`
- [ ] Remove example routes you don't need
- [ ] Add your own routes and features

## Common Tasks

### Add a New Page

Create `app/routes/your-page.tsx`:
```typescript
import type { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [{ title: "Your Page Title" }];
};

export default function YourPage() {
  return <h1>Your Page</h1>;
}
```

### Add an API Endpoint

Create `app/routes/api.your-endpoint.tsx`:
```typescript
import { json } from "@remix-run/cloudflare";
import type { ActionFunctionArgs } from "@remix-run/cloudflare";

export async function action({ request, context }: ActionFunctionArgs) {
  const data = await request.json();
  // Process data...
  return json({ success: true });
}
```

### Use Cloudflare KV

```typescript
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";

export async function loader({ context }: LoaderFunctionArgs) {
  // Read from KV
  const value = await context.env.CAI_CACHE.get("key");
  
  // Write to KV
  await context.env.CAI_CACHE.put("key", "value", {
    expirationTtl: 60 * 60 // 1 hour
  });
  
  return json({ value });
}
```

## Need Help?

- [Remix Docs](https://remix.run/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)