# Cai Stack

A modern, production-ready boilerplate for building **truly universal** applications that run everywhere - web, iOS, Android, and desktop - using a single codebase.

> **This is a template repository** - Use it as a starting point for your own projects. Click "Use this template" on GitHub or clone and customize it for your needs.

> **🚀 Now powered by React Router v7!** We've migrated from Remix v2 to React Router v7 (the evolution of Remix) for better Cloudflare Workers integration, improved performance, and native edge computing support with full SSR.

## Why Cai Stack?

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
- **Web**: React Router v7 on Cloudflare Workers with SSR and PWA support
- **Mobile**: React Native with Expo (iOS & Android)
- **Desktop**: Tauri 2.0 for native performance
- **API**: Edge-first with Cloudflare Workers

### 🎨 Unified Design System
- **Tailwind CSS v4**: Latest version with improved performance and features
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
Better Auth - A lightweight, type-safe authentication library:
- Social login (Google, GitHub, Apple)
- Email/password authentication
- Magic links via Resend
- Session management
- Protected routes
- Built for edge environments

### 💳 Payments & Billing
Stripe integration for monetization:
- Subscription management
- One-time payments
- Usage-based billing
- Webhook handling
- Customer portal

### 📧 Email Infrastructure
Resend for transactional emails:
- Authentication emails
- Password resets
- Welcome emails
- Custom templates
- Email analytics

### ⚡ Performance Optimizations
- **Million.js**: Automatic React optimization
- **Turborepo**: Cached builds and parallel execution
- **Edge Computing**: <50ms global response times
- **Smart Bundling**: Platform-specific code splitting

## Tech Stack

- **Frontend**: React Native (Expo SDK 51), React Router v7 (Vite), Tauri 2.0
- **Styling**: Tailwind CSS v4, NativeWind v4, Catalyst UI
- **Backend**: Cloudflare Workers, tRPC v11, Hono
- **Database**: Cloudflare D1 with Drizzle ORM
- **Auth**: Better Auth
- **Email**: Resend
- **Payments**: Stripe
- **AI**: Vercel AI SDK v4
- **Deployment**: Native Cloudflare Workers (no adapters needed)
- **Build**: Turborepo, Bun, Biome

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- Node.js 18+
- Cloudflare account
- Resend account (for emails)
- Stripe account (optional, for payments)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/jjeremycai/cai-stack.git
cd cai-stack

# Install dependencies (6 second install with Bun!)
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development (all platforms)
bun dev
```

### Environment Variables

Create a `.env.local` file with:

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

# Or Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Stripe (optional)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Platform-Specific Development

```bash
# Web only
bun dev --filter=web

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
│   ├── web/           # Remix web app
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

### Authentication Flow

```typescript
// Sign up
const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "secure-password",
  name: "John Doe"
})

// Sign in
const session = await authClient.signIn.email({
  email: "user@example.com",
  password: "secure-password"
})

// OAuth
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/dashboard"
})
```

### Email Sending

```typescript
// Send transactional email
await resend.emails.send({
  from: 'Cai Stack <noreply@caistack.com>',
  to: ['user@example.com'],
  subject: 'Welcome to Cai Stack!',
  react: WelcomeEmail({ name: 'John' }),
})
```

### Payment Processing

```typescript
// Create subscription
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_monthly' }],
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent'],
})

// Handle webhooks
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
```

## Deployment

### 🚀 Backend (30 seconds!)

```bash
cd packages/api
bun run deploy
```

### 🌐 Web (60 seconds!)

```bash
cd apps/web
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
- **60 second** web deployments to Workers
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

## Migration Guide

### From Supabase Auth to Better Auth

1. Update environment variables
2. Replace Supabase client with Better Auth client
3. Update auth hooks and providers
4. Migrate user data (Better Auth provides migration tools)

### From AWS/Vercel to Cloudflare

1. Set up Cloudflare account
2. Configure D1 databases
3. Update deployment scripts
4. Migrate data to D1
5. Update API endpoints

## Troubleshooting

### Common Issues

**Module not found errors:**
- Clear node_modules: `rm -rf node_modules && bun install`
- Check import paths match package names

**Auth not working:**
- Verify AUTH_SECRET is set
- Check OAuth redirect URLs
- Ensure cookies are enabled

**Database connection issues:**
- Verify D1 database names in wrangler.toml
- Check environment variables are loaded
- Ensure migrations are applied

**Build failures:**
- Run `bun clean` to clear caches
- Check for TypeScript errors: `bun typecheck`
- Verify all dependencies are installed

## Best Practices

1. **Type Safety**: Always define types for API inputs/outputs
2. **Component Reuse**: Build universal components when possible
3. **Performance**: Use React.memo and useMemo appropriately
4. **Error Handling**: Implement proper error boundaries
5. **Testing**: Write tests for critical business logic
6. **Security**: Never expose sensitive keys in client code
7. **Monitoring**: Use Cloudflare Analytics for insights

## Roadmap

- [ ] React Native New Architecture support
- [ ] Offline-first capabilities
- [ ] Advanced caching strategies
- [ ] GraphQL API option
- [ ] Admin dashboard template
- [ ] Component library documentation
- [ ] E2E testing setup
- [ ] CI/CD templates

## Community

- [GitHub Issues](https://github.com/jjeremycai/cai-stack/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/jjeremycai/cai-stack/discussions) - General discussions

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

## Acknowledgments

Cai Stack takes a modular, Tailwind-first approach to universal app development. We chose **Tailwind CSS + NativeWind** over Tamagui to leverage the massive Tailwind ecosystem and provide a gentler learning curve for developers already familiar with Tailwind.

Special thanks to:
- [T4 Stack](https://t4stack.com) by [Tim Miller](https://twitter.com/ogtimothymiller) - For inspiration and showing what's possible with universal apps
- [Better Auth](https://better-auth.com) - For the lightweight, edge-ready auth solution
- [Tailwind Labs](https://tailwindcss.com) - For Tailwind CSS and Catalyst UI Kit
- [Cloudflare](https://cloudflare.com) - For the amazing edge platform
- [Expo](https://expo.dev) - For making React Native development a joy
- [Resend](https://resend.com) - For modern email infrastructure
- [Stripe](https://stripe.com) - For payment processing