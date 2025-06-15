# Cai Stack

A modern, modular boilerplate for building **truly universal** applications that run everywhere - web, iOS, Android, and desktop - using a single codebase.

## Why Cai Stack?

Inspired by the excellent [T4 Stack](https://t4stack.com), Cai Stack takes a different approach by using **Tailwind CSS + NativeWind** instead of Tamagui. This provides:

- **True universality**: Write once, run everywhere with consistent styling
- **Modular architecture**: Pick and choose what you need
- **Familiar tooling**: Use Tailwind CSS knowledge across all platforms
- **Premium components**: Catalyst UI Kit for beautiful web experiences
- **Native feel**: Platform-specific optimizations when needed

## The Problem We Solve

Building apps for multiple platforms traditionally means:
- Different codebases for web and mobile
- Inconsistent UI/UX across platforms
- Duplicated business logic
- Slow development cycles
- High maintenance costs

**Cai Stack eliminates these pain points** by providing a unified development experience.

## Core Philosophy

1. **Write Once, Deploy Everywhere**: Share 95% of your code across all platforms
2. **Edge-First**: Built for Cloudflare's global network from day one
3. **Type Safety**: End-to-end type safety with TypeScript and tRPC
4. **Modern DX**: Fast builds, hot reload, and great tooling
5. **Production Ready**: Authentication, database, and deployment configured

## Features

### 🌍 Universal Platform Support
- **Web**: Next.js on Cloudflare Pages
- **Mobile**: React Native with Expo
- **Desktop**: Tauri 2.0 for native performance
- **PWA**: Progressive Web App support out of the box

### ⚡ Performance First
- **Edge Computing**: Cloudflare Workers for <50ms global latency
- **Optimized Builds**: Turborepo for fast, cached builds
- **Smart Bundling**: Million.js for React optimization
- **Database Sharding**: Scale beyond D1's limits automatically

### 🎨 Unified Design System
- **Tailwind CSS**: Industry-standard utility-first CSS
- **NativeWind**: Tailwind for React Native
- **Catalyst UI**: Premium components from Tailwind team
- **Platform Aware**: Automatic platform-specific adjustments

### 🛠 Developer Experience
- **Type Safety**: Full-stack type safety with tRPC
- **AI Ready**: Vercel AI SDK integrated
- **Auth Built-in**: Supabase authentication configured
- **Fast Refresh**: See changes instantly across all platforms

## Tech Stack

- **Frontend**: React Native (Expo), Next.js, Tauri
- **Styling**: Tailwind CSS, NativeWind v4, Catalyst UI
- **Backend**: Cloudflare Workers, tRPC, Hono
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: Supabase Auth
- **AI**: Vercel AI SDK
- **Build**: Turborepo, Bun

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
│   ├── app/           # Shared business logic
│   └── ui-tw/         # Universal UI components
└── turbo.json         # Monorepo config
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

## Performance

- **6 second** package installs with Bun
- **30 second** backend deployments to edge
- **90 second** frontend deployments
- **<50ms** global response times
- **95%** code reuse across platforms

## Comparison with T4 Stack

| Feature | Cai Stack | T4 Stack |
|---------|-----------|----------|
| UI Framework | Tailwind + NativeWind | Tamagui |
| Component Library | Catalyst UI Kit | Tamagui Components |
| Styling Approach | Utility-first | Style props |
| Learning Curve | Use existing Tailwind knowledge | Learn Tamagui |
| Bundle Size | Smaller with NativeWind v4 | Larger with animations |
| Web Components | Full Catalyst library | Tamagui web |
| Native Feel | Platform-specific when needed | Unified design |

## When to Use Cai Stack

Choose Cai Stack when you want to:
- Build apps for multiple platforms with one team
- Use Tailwind CSS across web and mobile
- Deploy on Cloudflare's edge network
- Have full type safety from database to UI
- Ship quickly without sacrificing quality

## Community

- [GitHub Issues](https://github.com/jjeremycai/boilerplate/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/jjeremycai/boilerplate/discussions) - General discussions

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

---

Built with ❤️ by the Cai Stack team. Inspired by [T4 Stack](https://t4stack.com) by [Tim Miller](https://twitter.com/ogtimothymiller).