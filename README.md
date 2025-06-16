# TanStack D1 Stack

A modern, production-ready boilerplate for building **full-stack universal applications** using TanStack Start for the frontend and Cloudflare D1 for the database, with native support for web, mobile, and desktop platforms.

> **This is a template repository** - Use it as a starting point for your own projects. Click "Use this template" on GitHub or clone and customize it for your needs.

## Why TanStack D1 Stack?

This stack combines the best of modern web development:
- **TanStack Start**: Full-stack React framework with SSR, streaming, and server functions
- **Cloudflare D1**: SQLite database at the edge with automatic replication
- **Cloudflare Workers**: Edge deployment for <50ms global response times
- **Universal Components**: Write once, deploy everywhere

## Core Features

### 🌍 Universal Platform Support
- **Web**: TanStack Start on Cloudflare Workers with SSR
- **Mobile**: React Native with Expo (iOS & Android)
- **Desktop**: Tauri 2.0 for native performance
- **API**: Edge-first with Cloudflare Workers and tRPC

### 🎨 Unified Design System
- **Tailwind CSS v4**: Latest version with improved performance
- **Catalyst UI Kit**: Premium components from Tailwind team
- **Platform-aware**: Automatic adjustments for each platform

### 🗄️ Advanced Database Architecture

#### Cloudflare D1 with Automatic Sharding
Built to scale beyond D1's 10GB limit per database:

```typescript
// Automatic volume-based sharding
const shardId = getShardForVolume('high-volume-client')
const db = getDatabase(shardId)

// Transparent cross-shard queries
const results = await dbRouter.executeAcrossShards(async (db) => {
  return db.select().from(users).where(eq(users.active, true))
})
```

#### Universal ID Generation
IDs contain embedded shard information for efficient routing:

```typescript
// ID Format: [timestamp(41) | shardId(10) | sequence(12) | machineId(1)]
const id = generateUniversalId(shardId)
// Example: "1234567890123-001-0001-0"
```

### 🔐 Authentication
Better Auth - Lightweight, type-safe authentication:
- Email/password authentication
- Social login (Google, GitHub)
- Magic links via Resend
- Session management
- Protected routes
- Edge-optimized

### 🤖 AI Integration
Vercel AI SDK with structured output:
```typescript
// AI conversations with context
const response = await ai.generateText({
  prompt: "Explain quantum computing",
  model: "gpt-4-turbo"
})

// Structured data extraction
const product = await ai.generateStructured({
  prompt: "Extract: iPhone 15 Pro, $999",
  schema: productSchema
})
```

### ⚡ Performance Features
- **Server-side Rendering**: With streaming support
- **Edge Computing**: Global deployment on Cloudflare
- **Smart Caching**: KV storage for sessions and cache
- **Optimized Queries**: With Drizzle ORM
- **Type Safety**: End-to-end with tRPC

## Tech Stack

- **Frontend**: TanStack Start, React, Tailwind CSS v4, Catalyst UI
- **Backend**: Cloudflare Workers, D1, tRPC, Hono
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Auth**: Better Auth
- **Mobile**: React Native (Expo SDK 51)
- **Desktop**: Tauri 2.0
- **AI**: Vercel AI SDK v4
- **Email**: Resend
- **Build**: Turborepo, Bun, Vinxi

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- Node.js 18+
- Cloudflare account
- Resend account (for emails)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jjeremycai/tanstack-d1.git
cd tanstack-d1

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
bun migrate:local

# Start development
bun dev
```

### Environment Setup

Create `.env.local`:
```env
# API Configuration
PUBLIC_API_URL=http://localhost:8787
PUBLIC_APP_URL=http://localhost:3000

# Better Auth
AUTH_SECRET=your-auth-secret-here
AUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# AI (OpenAI)
OPENAI_API_KEY=your-openai-api-key

# Cloudflare KV
KV_NAMESPACE_ID=your-kv-namespace-id
```

## Project Structure

```
tanstack-d1/
├── apps/
│   ├── web/           # TanStack Start web app
│   ├── expo/          # React Native mobile app
│   └── desktop/       # Tauri desktop app
├── packages/
│   ├── api/           # tRPC API & Workers
│   │   ├── src/
│   │   │   ├── db/    # Database schemas
│   │   │   ├── lib/   # Core libraries
│   │   │   │   └── sharding/  # D1 sharding system
│   │   │   ├── routes/   # API endpoints
│   │   │   └── services/ # Business logic
│   │   └── migrations/   # Database migrations
│   ├── app/           # Shared business logic
│   └── ui-tw/         # Universal UI components
└── turbo.json         # Monorepo configuration
```

## Key Concepts

### TanStack Start Features

#### Server Functions
Type-safe server functions with automatic RPC:
```typescript
// app/server/functions.ts
export const getUser = createServerFn(
  'GET',
  async (userId: string) => {
    const user = await db.users.findById(userId)
    return user
  }
)

// app/routes/profile.tsx
export default function Profile() {
  const user = await getUser(params.userId)
  return <UserProfile user={user} />
}
```

#### File-based Routing
```
app/routes/
├── __root.tsx         # Root layout
├── _index.tsx         # Home page
├── about.tsx          # /about
├── blog/
│   ├── _index.tsx     # /blog
│   └── $slug.tsx      # /blog/:slug
└── (auth)/            # Route groups
    ├── login.tsx      # /login
    └── register.tsx   # /register
```

### Database Operations

#### With Drizzle ORM
```typescript
// Define schema
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
})

// Query data
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.active, true))
  .limit(10)
```

#### Cross-shard Queries
```typescript
// Query across all shards
const allUsers = await dbRouter.executeAcrossShards(
  async (db) => db.select().from(users),
  { merge: true }
)
```

## Development Workflow

### Commands

```bash
# Start everything
bun dev

# Platform-specific
bun dev:web      # Web only
bun dev:api      # API only
bun dev:mobile   # Mobile only
bun dev:desktop  # Desktop only

# Database
bun migrate:local     # Run migrations locally
bun seed:local        # Seed local database
bun studio           # Open Drizzle Studio

# Build & Deploy
bun build:web    # Build web app
bun deploy       # Deploy everything
```

## Deployment

### Deploy to Cloudflare

1. **Create D1 Databases**:
```bash
wrangler d1 create tanstack-d1-db
```

2. **Update wrangler.toml** with your database IDs

3. **Run migrations**:
```bash
bun migrate
```

4. **Deploy**:
```bash
bun deploy
```

### Deploy Mobile Apps

```bash
cd apps/expo
eas build --platform all
eas submit
```

## Performance

- **Edge deployment**: <50ms response times globally
- **Smart sharding**: Scale beyond single database limits
- **Optimized queries**: Indexed and cached
- **Code splitting**: Load only what's needed
- **Image optimization**: Automatic with Cloudflare

## Best Practices

1. **Use Server Functions**: Keep sensitive logic on the server
2. **Optimize Queries**: Use indexes and pagination
3. **Cache Aggressively**: Leverage KV for frequent data
4. **Type Everything**: Full type safety with TypeScript
5. **Test Cross-platform**: Ensure UI works everywhere

## Troubleshooting

**Database connection issues:**
- Check D1 database names in wrangler.toml
- Ensure migrations are applied
- Verify environment variables

**Build errors:**
- Clear cache: `rm -rf .output .turbo node_modules`
- Check TypeScript errors: `bun typecheck`
- Ensure all dependencies installed

**Auth not working:**
- Verify AUTH_SECRET is set
- Check OAuth redirect URLs
- Ensure cookies are enabled

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT

---

## Acknowledgments

- [TanStack](https://tanstack.com) - For the amazing full-stack framework
- [Cloudflare](https://cloudflare.com) - For D1 and Workers platform
- [Tailwind Labs](https://tailwindcss.com) - For Tailwind CSS and Catalyst
- [Better Auth](https://better-auth.com) - For edge-ready authentication
- [Expo](https://expo.dev) - For React Native tooling