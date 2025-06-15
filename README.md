# Cai Stack

A modern, production-ready boilerplate for building **truly universal** applications that run everywhere - web, iOS, Android, and desktop - using a single codebase.

## The Problem We Solve

Building apps for multiple platforms traditionally means:
- Different codebases for web and mobile
- Inconsistent UI/UX across platforms
- Duplicated business logic
- Slow development cycles
- High maintenance costs

**Cai Stack eliminates these pain points** by providing a unified development experience with enterprise-ready features out of the box.

## Core Features

### 🌍 Universal Platform Support
Write once, deploy everywhere with platform-specific optimizations when needed:
- **Web**: Next.js on Cloudflare Pages with PWA support
- **Mobile**: React Native with Expo (iOS & Android)
- **Desktop**: Tauri 2.0 for native performance
- **API**: Edge-first with Cloudflare Workers

### 🎨 Unified Design System
- **Tailwind CSS**: Industry-standard utility-first CSS
- **NativeWind v4**: Use Tailwind classes in React Native
- **Catalyst UI Kit**: Premium components from Tailwind team
- **Platform-aware**: Automatic adjustments for each platform

### 🗄️ Advanced Database Architecture

#### Automatic Sharding System
Built to scale beyond Cloudflare D1's 10GB limit:

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

### 🤖 AI Integration
Vercel AI SDK pre-configured with structured output support:

```typescript
// Text generation
const response = await ai.generateText({
  prompt: "Explain quantum computing",
  model: "gpt-4-turbo"
})

// Structured data extraction
const product = await ai.generateStructured({
  prompt: "Extract: iPhone 15 Pro, $999, in stock",
  schema: productSchema // Valibot schema
})
```

### 🔐 Authentication
Supabase Auth integrated across all platforms:
- Social login (Google, GitHub, Apple)
- Magic links
- JWT verification at the edge
- Session management
- Protected routes

### ⚡ Performance Optimizations
- **Million.js**: Automatic React optimization
- **Turborepo**: Cached builds and parallel execution
- **Edge Computing**: <50ms global response times
- **Smart Bundling**: Platform-specific code splitting

## Tech Stack

- **Frontend**: React Native (Expo), Next.js, Tauri
- **Styling**: Tailwind CSS, NativeWind v4, Catalyst UI
- **Backend**: Cloudflare Workers, tRPC, Hono
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: Supabase Auth
- **AI**: Vercel AI SDK
- **Build**: Turborepo, Bun, Biome

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- Node.js 18+
- Cloudflare account
- Supabase account (for auth)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jjeremycai/boilerplate.git cai-app
cd cai-app

# Install dependencies (6 second install with Bun!)
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development (all platforms)
bun dev
```

### Platform-Specific Development

```bash
# Web only
bun dev --filter=next

# Mobile only
bun dev --filter=expo

# Desktop only
bun dev --filter=desktop

# Backend API only
bun dev --filter=api
```

## Project Structure

```
cai-stack/
├── apps/
│   ├── next/          # Next.js web app
│   ├── expo/          # React Native app
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
│   │   ├── features/  # Feature modules
│   │   ├── provider/  # App providers
│   │   └── utils/     # Shared utilities
│   └── ui-tw/         # Universal UI components
│       ├── components/   # Universal components
│       └── catalyst/     # Web-only premium components
└── turbo.json         # Monorepo configuration
```

## Key Concepts

### Universal Components

Write components once, use everywhere:

```tsx
// Button.tsx - works on all platforms!
import { Button } from '@cai/ui-tw'

export function MyFeature() {
  return (
    <Button onPress={() => alert('Works everywhere!')}>
      Click me
    </Button>
  )
}
```

### Platform-Specific Code

When you need platform-specific behavior:

```tsx
// MyComponent.web.tsx - Web only
export const MyComponent = () => <div>Web Version</div>

// MyComponent.native.tsx - Mobile only  
export const MyComponent = () => <View>Mobile Version</View>
```

### Type-Safe API Calls

End-to-end type safety with tRPC:

```typescript
// Backend definition
const userRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.users.findById(input.id)
    })
})

// Frontend usage - fully typed!
const { data } = trpc.user.getUser.useQuery({ id: '123' })
```

### Database Sharding

Handle massive scale with automatic sharding:

```typescript
// Shard configuration
const shards = {
  'DB_VOL_1': 'volume1-db',  // 0-10GB
  'DB_VOL_2': 'volume2-db',  // 10-20GB
  'DB_VOL_3': 'volume3-db'   // 20-30GB
}

// Automatic routing based on volume
await dbRouter.insertWithSharding({
  volume: 'high-traffic-client',
  data: newUser
})
```

## Deployment

### 🚀 Backend (30 seconds!)

```bash
cd packages/api
bun run deploy
```

### 🌐 Web (90 seconds!)

```bash
cd apps/next
bun run deploy
```

### 📱 Mobile

```bash
cd apps/expo
eas build --platform all
```

### 💻 Desktop

```bash
cd apps/desktop
bun run build
```

## Performance Metrics

- **6 second** package installs with Bun
- **30 second** backend deployments to edge
- **90 second** frontend deployments
- **<50ms** global response times
- **95%** code reuse across platforms
- **99.9%** uptime with Cloudflare's edge network

## Use Cases

Cai Stack is perfect for:
- **SaaS Applications**: Full-stack apps with auth, billing, and analytics
- **Mobile-First Products**: Native mobile with web dashboard
- **Enterprise Tools**: Desktop apps with cloud sync
- **AI-Powered Apps**: Built-in AI SDK for LLM features
- **High-Traffic Apps**: Sharding system handles millions of users

## Why Choose Cai Stack?

### For Developers
- Use familiar tools (Tailwind, TypeScript, React)
- Single codebase for all platforms
- Type safety from database to UI
- Fast development cycle with hot reload
- Great documentation and examples

### For Businesses
- Ship 3x faster with one team
- Reduce maintenance costs by 70%
- Scale globally with edge deployment
- Enterprise-ready security with Supabase
- Pay fraction of AWS/Vercel costs

## Community

- [GitHub Issues](https://github.com/jjeremycai/boilerplate/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/jjeremycai/boilerplate/discussions) - General discussions

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

---

## Acknowledgments

Cai Stack takes a modular, Tailwind-first approach to universal app development. We chose **Tailwind CSS + NativeWind** over Tamagui to leverage the massive Tailwind ecosystem and provide a gentler learning curve for developers already familiar with Tailwind.

Special thanks to:
- [T4 Stack](https://t4stack.com) by [Tim Miller](https://twitter.com/ogtimothymiller) - For inspiration and showing what's possible with universal apps
- [Tailwind Labs](https://tailwindcss.com) - For Tailwind CSS and Catalyst UI Kit
- [Cloudflare](https://cloudflare.com) - For the amazing edge platform
- [Expo](https://expo.dev) - For making React Native development a joy