# Cai Stack Project Documentation

## Overview

The Cai Stack is a modern, production-ready boilerplate for building full-stack applications that run everywhere - web, mobile, and desktop. Built with performance and developer experience in mind.

## Architecture

### Frontend
- **Remix**: Full-stack web framework with native Cloudflare Workers support
- **Expo**: React Native framework for iOS and Android
- **Vite + Tauri**: Fast desktop applications
- **Tailwind CSS + NativeWind**: Universal styling across platforms

### Backend
- **Cloudflare Workers**: Edge computing for global performance
- **tRPC**: End-to-end type-safe APIs
- **Drizzle ORM**: Type-safe database queries
- **Cloudflare D1**: SQLite at the edge with automatic sharding

### Infrastructure
- **Turborepo**: Efficient monorepo builds
- **Bun**: Fast JavaScript runtime and package manager
- **TypeScript**: Full type safety across the stack
- **Biome**: Fast formatting and linting

## Key Features

### Database Sharding
Automatic volume-based sharding handles Cloudflare D1's 10GB limit:
- Universal ID generation with embedded shard information
- Transparent query routing
- Cross-shard aggregation
- Zero-downtime migrations

### Universal Components
Write once, run everywhere:
- Shared UI components work on web, iOS, Android, and desktop
- Platform-specific optimizations when needed
- Consistent design system with Catalyst UI

### AI Integration
Built-in Vercel AI SDK support:
- Multiple provider support (OpenAI, Anthropic, etc.)
- Streaming responses
- Structured output with schemas
- Token usage tracking

### Authentication
Supabase Auth integration:
- JWT verification at the edge
- Protected API routes
- Session management
- Social login support

## Project Structure

```
cai-stack/
├── apps/
│   ├── next/          # Next.js web application
│   ├── expo/          # React Native mobile app
│   └── desktop/       # Tauri desktop application
├── packages/
│   ├── api/           # tRPC API & Workers
│   ├── app/           # Shared app logic
│   └── ui-tw/         # UI component library
└── turbo.json         # Turborepo configuration
```

## Development Guide

### Prerequisites
- Bun (latest)
- Node.js 18+
- Cloudflare account
- Supabase account

### Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local

# Start development
bun dev
```

### Common Tasks

**Add a new API endpoint:**
```typescript
// packages/api/src/routes/example.ts
export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hello ${input.name}`)
})
```

**Create a universal component:**
```tsx
// packages/ui-tw/src/components/Card.tsx
export function Card({ children, className }) {
  return (
    <View className={cn("p-4 bg-white rounded-lg shadow", className)}>
      {children}
    </View>
  )
}
```

**Add a new database table:**
```typescript
// packages/api/src/db/schema.ts
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  authorId: text('author_id').references(() => users.id),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`)
})
```

## Deployment

### API (Cloudflare Workers)
```bash
cd packages/api
bun run deploy
```

### Web (Cloudflare Workers)
```bash
cd apps/next
bun run deploy
```

### Mobile (EAS Build)
```bash
cd apps/expo
eas build --platform all
```

### Desktop (Tauri)
```bash
cd apps/desktop
bun run build
```

## Best Practices

1. **Type Safety**: Always define types for API inputs/outputs
2. **Component Reuse**: Build universal components when possible
3. **Performance**: Use React.memo and useMemo appropriately
4. **Error Handling**: Implement proper error boundaries
5. **Testing**: Write tests for critical business logic

## Troubleshooting

**Module not found errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && bun install`
- Check import paths match package names

**Database connection issues:**
- Verify D1 database names in wrangler.toml
- Ensure environment variables are set correctly

**Build failures:**
- Run `bun clean` to clear build caches
- Check for TypeScript errors: `bun typecheck`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT