# T4 Boilerplate Project Documentation

## Project Overview

This is a modern full-stack TypeScript boilerplate built on the T4 Stack (Tauri, tRPC, Tailwind, TypeScript) with significant architectural enhancements:

- **Tailwind + NativeWind** instead of Tamagui for universal styling
- **Cloudflare D1 Sharding** for handling database size limitations
- **OpenRouter AI Integration** for LLM capabilities
- **Supabase Authentication** for secure user management

## Architecture

### Tech Stack

#### Frontend
- **Next.js 15** - React framework for web
- **Expo SDK 51** - React Native for mobile
- **Tailwind CSS + NativeWind v4** - Universal styling solution
- **Solito** - Universal navigation
- **Jotai** - State management
- **Million.js** - React optimization
- **PattyCake** - Pattern matching

#### Backend
- **Cloudflare Workers** - Edge computing
- **Hono** - Lightweight web framework
- **tRPC v11** - Type-safe APIs
- **Drizzle ORM** - TypeScript-first ORM
- **Cloudflare D1** - SQLite at the edge
- **Valibot** - Schema validation

#### Infrastructure
- **Bun** - JavaScript runtime and package manager
- **Turborepo** - Monorepo build system
- **TypeScript 5.7** - Type safety
- **Biome** - Fast formatter and linter

### Key Features

1. **Database Sharding System**
   - Automatic volume-based sharding for D1's 10GB limit
   - Universal ID generation with shard information
   - Cross-shard query orchestration
   - Transparent migration support

2. **Universal UI Components**
   - Shared components work on both web and native
   - Consistent styling with Tailwind utilities
   - Type-safe component props
   - Platform-specific optimizations

3. **AI Integration**
   - OpenRouter service for multiple LLM providers
   - Streaming support
   - Token usage tracking
   - Error handling and retries

4. **Authentication**
   - Supabase Auth integration
   - JWT verification on edge
   - Protected routes
   - Session management

## Project Structure

```
t4-boilerplate/
├── apps/
│   ├── next/                 # Next.js web application
│   │   ├── pages/           # Page routes
│   │   ├── public/          # Static assets
│   │   └── styles/          # Global styles
│   │
│   └── expo/                # Expo native application
│       ├── app/             # App routes
│       └── assets/          # Native assets
│
├── packages/
│   ├── api/                 # Backend API
│   │   ├── src/
│   │   │   ├── db/         # Database schemas
│   │   │   ├── lib/        # Core libraries
│   │   │   │   └── sharding/  # D1 sharding system
│   │   │   ├── routers/    # tRPC routers
│   │   │   ├── services/   # Business logic
│   │   │   └── worker.ts   # Cloudflare Worker entry
│   │   ├── migrations/     # Database migrations
│   │   └── wrangler.toml   # Cloudflare config
│   │
│   ├── app/                 # Shared application code
│   │   ├── features/       # Feature modules
│   │   ├── provider/       # App providers
│   │   └── utils/          # Shared utilities
│   │
│   └── ui-tw/              # UI component library
│       └── src/
│           ├── components/ # Reusable components
│           └── lib/        # UI utilities
│
└── tooling/                # Build tools and configs
    ├── typescript/         # TypeScript configs
    └── github/            # GitHub Actions
```

## Development Workflow

### Getting Started

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd t4-boilerplate
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Database Setup**
   ```bash
   # Generate migrations
   bun --filter @t4/api generate
   
   # Apply locally
   bun --filter @t4/api migrate:local
   ```

4. **Start Development**
   ```bash
   bun dev
   ```

### Available Scripts

- `bun dev` - Start all development servers
- `bun build` - Build all packages
- `bun lint` - Run linting
- `bun typecheck` - Type checking
- `bun test` - Run tests

### Adding Features

1. **New UI Component**
   - Create in `packages/ui-tw/src/components/`
   - Use Tailwind classes with NativeWind
   - Export from package index
   - Add TypeScript types

2. **New API Route**
   - Add router in `packages/api/src/routers/`
   - Update root router
   - Add service logic if needed
   - Generate TypeScript types

3. **New Database Table**
   - Define schema in `packages/api/src/db/schema.ts`
   - Run `bun --filter @t4/api generate`
   - Apply migrations

## Database Sharding

### How It Works

1. **Shard Detection**
   - Scans environment for `DB_VOL_*` databases
   - Initializes shard metadata
   - Sets up routing table

2. **ID Generation**
   - Timestamp (41 bits)
   - Shard ID (10 bits)  
   - Sequence (12 bits)
   - Machine ID (1 bit)

3. **Query Routing**
   - Extracts shard from ID
   - Routes to correct database
   - Handles cross-shard queries

### Usage Example

```typescript
// Single shard query
const user = await dbRouter.executeOnShard(userId, async (db) => {
  return db.select().from(users).where(eq(users.id, userId)).get()
})

// Cross-shard query
const allUsers = await dbRouter.executeAcrossShards(async (db) => {
  return db.select().from(users).all()
})
```

## Deployment

### Cloudflare Workers (API)

1. Configure `wrangler.toml` with D1 databases
2. Set secrets: `wrangler secret put <KEY>`
3. Deploy: `bun --filter @t4/api deploy`

### Vercel (Next.js)

1. Connect GitHub repository
2. Set environment variables
3. Deploy: `bunx vercel --cwd apps/next`

### Expo (Mobile)

1. Configure EAS Build
2. Set up app credentials
3. Build: `eas build --platform ios/android`

## Best Practices

1. **Type Safety**
   - Use TypeScript strictly
   - Leverage tRPC for API types
   - Validate with Valibot schemas

2. **Performance**
   - Use Million.js optimization
   - Implement code splitting
   - Optimize images with Solito

3. **Styling**
   - Use Tailwind utilities
   - Create reusable components
   - Maintain consistency

4. **Database**
   - Design for sharding
   - Use efficient queries
   - Index appropriately

## Troubleshooting

### Common Issues

1. **Module Resolution**
   - Ensure correct import paths
   - Use `@t4/ui-tw` not `@t4/ui`
   - Check tsconfig paths

2. **Database Errors**
   - Verify D1 bindings in wrangler.toml
   - Check shard configuration
   - Ensure migrations are applied

3. **Build Failures**
   - Clear caches: `bun clean`
   - Reinstall deps: `bun install`
   - Check Node/Bun versions

## Future Enhancements

- [ ] Add comprehensive test suite
- [ ] Implement dark mode
- [ ] Add i18n support
- [ ] Create component documentation
- [ ] Add monitoring and analytics
- [ ] Implement caching strategies
- [ ] Add WebSocket support
- [ ] Create admin dashboard