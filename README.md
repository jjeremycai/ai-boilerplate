# Cai Stack

A modern, production-ready boilerplate for building full-stack applications with React Native, Next.js, and Cloudflare Workers.

## Features

- **Universal Apps**: Build once, deploy everywhere - web, iOS, Android, and desktop
- **Edge-First Architecture**: Powered by Cloudflare Workers for global performance
- **Type-Safe API**: End-to-end type safety with tRPC
- **Modern UI**: Tailwind CSS with NativeWind for consistent styling across platforms
- **AI Integration**: Built-in Vercel AI SDK support
- **Database Sharding**: Volume-based sharding with Cloudflare D1
- **Authentication**: Supabase Auth integration
- **Monorepo**: Turborepo for efficient builds and dependency management

## Tech Stack

- **Frontend**: React Native (Expo), Next.js, Vite
- **Styling**: Tailwind CSS, NativeWind, Catalyst UI components
- **Backend**: Cloudflare Workers, tRPC
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: Supabase
- **AI**: Vercel AI SDK
- **Desktop**: Tauri 2.0
- **Build**: Turborepo, Bun

## Getting Started

### Prerequisites

- Bun (latest version)
- Node.js 18+
- Cloudflare account
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/jjeremycai/boilerplate.git
cd boilerplate

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
```

### Development

```bash
# Run all apps in development
bun dev

# Run specific app
bun dev --filter=next
bun dev --filter=expo
bun dev --filter=desktop

# Run API only
bun dev --filter=api
```

### Build

```bash
# Build all apps
bun build

# Build specific app
bun build --filter=next
bun build --filter=expo
```

## Project Structure

```
.
├── apps/
│   ├── next/          # Next.js web app
│   ├── expo/          # React Native mobile app
│   └── desktop/       # Desktop app (Vite + Tauri)
├── packages/
│   ├── api/           # tRPC API & Cloudflare Workers
│   ├── app/           # Shared app logic & screens
│   └── ui-tw/         # Shared UI components
└── turbo.json         # Turborepo configuration
```

## Key Concepts

### Universal Components

Components are written once and work across all platforms:

```tsx
// packages/ui-tw/src/components/Button.tsx
export { Button } from './Button.web'  // Web version
export { Button } from './Button.native' // Native version
```

### Database Sharding

Volume-based sharding ensures scalability:

```typescript
// Automatic shard routing based on volume
const shardId = getShardForVolume(volume)
const db = getDatabase(shardId)
```

### Type-Safe API

Full type safety from database to frontend:

```typescript
// Define once in API
export const userRouter = router({
  getUser: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getUser(input.id))
})

// Use anywhere with full types
const { data } = trpc.user.getUser.useQuery({ id: '123' })
```

## Deployment

### Web (Next.js on Cloudflare)

```bash
cd apps/next
bun run deploy
```

### Mobile (Expo)

```bash
cd apps/expo
eas build --platform all
```

### API (Cloudflare Workers)

```bash
cd packages/api
bun run deploy
```

## License

MIT