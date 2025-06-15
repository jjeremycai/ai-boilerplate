# Migration Guide: From Original Boilerplate to T4 Stack

This guide helps you migrate from the original boilerplate to the modernized T4 stack with Tailwind/NativeWind, while preserving your D1 sharding architecture.

## Overview of Changes

### Stack Updates
- **UI Framework**: Tamagui → Tailwind CSS + NativeWind
- **Web Framework**: Remix → Next.js 15 (with Cloudflare Pages support)
- **Mobile Navigation**: React Navigation → Expo Router v4
- **State Management**: Zustand → Jotai
- **Authentication**: WorkOS/Clerk → Supabase Auth
- **AI Integration**: Added OpenRouter support
- **Package Manager**: npm/yarn → Bun
- **Versions**: All packages updated to latest versions

### Preserved Features
- Cloudflare D1 sharding architecture
- Universal ID generation system
- Cross-shard query capabilities
- Shard monitoring and health checks
- Durable Objects for real-time features

## Step-by-Step Migration

### 1. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_VERIFICATION_KEY=your_jwt_key

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key

# App
APP_URL=http://localhost:3000
```

### 2. Database Migration

#### Update Wrangler Configuration

1. Update `packages/api/wrangler.toml` with your shard database IDs:

```toml
[[d1_databases]]
binding = "DB_VOL_001_abc123"
database_name = "production_shard_001"
database_id = "YOUR_ACTUAL_SHARD_001_ID"

[[d1_databases]]
binding = "DB_VOL_002_def456"
database_name = "production_shard_002"
database_id = "YOUR_ACTUAL_SHARD_002_ID"
```

#### Generate Migrations

```bash
cd packages/api
bun generate
```

#### Apply Migrations

```bash
# Local development
bun migrate:local

# Production
bun migrate
```

### 3. Code Migration

#### UI Components

Replace Tamagui imports with Tailwind components:

```typescript
// Before (Tamagui)
import { Button, Text, YStack } from '@t4/ui'

// After (Tailwind/NativeWind)
import { Button, Text, Container } from '@t4/ui-tw'
```

#### Styling

Replace Tamagui styled components with Tailwind classes:

```tsx
// Before
<YStack space="$4" padding="$4">
  <Text fontSize="$6">Hello</Text>
</YStack>

// After
<Container className="space-y-4 p-4">
  <Text variant="h2">Hello</Text>
</Container>
```

#### Authentication

Update auth imports and usage:

```typescript
// Before (WorkOS/Clerk)
import { useAuth } from '@clerk/nextjs'

// After (Supabase)
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
```

### 4. API Routes

The tRPC structure remains similar, but with added context:

```typescript
// New context includes sharding and AI
export const myRouter = router({
  create: protectedProcedure
    .input(schema)
    .mutation(async ({ ctx, input }) => {
      // Access sharding
      const { shardContext } = ctx
      const shardedDb = shardContext.getShardedDb()
      
      // Access AI
      const completion = await ctx.openrouter.createChatCompletion({
        messages: [{ role: 'user', content: 'Hello' }]
      })
      
      // Your logic here
    })
})
```

### 5. Sharding Usage

The sharding system works the same but with improved TypeScript support:

```typescript
// Create with sharding
const project = await shardedDb.create('Project', {
  name: 'My Project',
  ownerId: ctx.user.id,
})

// Query across shards
const allProjects = await shardedDb.queryAll('Project', {
  where: { ownerId: ctx.user.id }
})

// Cross-shard references
await shardedDb.createWithReference('Task', {
  projectId: project.id,
  title: 'My Task',
}, {
  table: 'Project',
  id: project.id,
})
```

### 6. Build and Deploy

#### Development

```bash
# Start all services
bun dev

# Or individually
bun api    # API server
bun web    # Next.js
bun native # Expo
```

#### Production Build

```bash
# Build all
bun run build

# Deploy API
cd packages/api
bun deploy

# Deploy Web (Cloudflare Pages)
cd apps/next
bun run build
wrangler pages deploy .vercel/output/static
```

### 7. Mobile App Updates

#### iOS
```bash
cd apps/expo
bun ios
```

#### Android
```bash
cd apps/expo
bun android
```

## Common Issues and Solutions

### Issue: Tamagui components not found
**Solution**: Replace all Tamagui imports with Tailwind components from `@t4/ui-tw`

### Issue: Authentication errors
**Solution**: Ensure Supabase environment variables are set correctly

### Issue: Sharding not working
**Solution**: Check that all shard database IDs are correctly configured in wrangler.toml

### Issue: TypeScript errors
**Solution**: Run `bun check-types` and fix any type issues

## Additional Resources

- [T4 Stack Documentation](https://t4stack.com)
- [NativeWind Documentation](https://www.nativewind.dev)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [OpenRouter Documentation](https://openrouter.ai/docs)

## Support

For issues specific to:
- **T4 Stack**: [GitHub Issues](https://github.com/timothymiller/t4-app/issues)
- **Sharding**: Check the implementation in `packages/api/src/lib/sharding/`
- **UI Components**: See examples in `packages/ui-tw/src/components/`