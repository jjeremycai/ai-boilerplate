# T4 Boilerplate - Modern Full-Stack TypeScript Template

<p align="center">
  <a href="https://t4stack.com" target="_blank" rel="noopener noreferrer">
    <picture>
      <img src="https://github.com/timothymiller/t4-app/blob/master/apps/next/public/t4-logo-large.png?raw=true" width="200" alt="Logo of T4 Stack">
    </picture>
  </a>
</p>

<h1 align="center">
  T4 Boilerplate with Tailwind + NativeWind
</h1>

<p align="center">
  A modern, typesafe, universal Expo & Next.js app built on the T4 Stack with Tailwind CSS + NativeWind instead of Tamagui.
</p>

## 🚀 Key Features

This boilerplate extends the T4 Stack with enterprise-ready features:

- **🎨 Tailwind CSS + NativeWind v4** - Universal styling solution for React Native and Web
- **💎 Catalyst UI Kit** - Beautiful, accessible components from Tailwind's premium UI kit (web-only)
- **🗄️ Cloudflare D1 Database Sharding** - Volume-based sharding architecture to handle D1's 10GB limit
- **🤖 AI SDK Integration** - Built-in AI capabilities with Vercel AI SDK (supports OpenAI, Anthropic, Google, and more)
- **🔐 Supabase Authentication** - Secure authentication across all platforms
- **⚡ Optimized Performance** - Million.js and PattyCake for React optimization
- **📱 Universal Components** - Share UI components between web and native

## 🏗️ Architecture Overview

### Frontend
- **Next.js** - React framework for web
- **Expo** - React Native framework for iOS/Android
- **Tailwind CSS + NativeWind** - Universal styling
- **Solito** - Navigation and routing
- **Jotai** - State management

### Backend
- **Hono** - Lightweight web framework
- **Cloudflare Workers** - Edge computing platform
- **Cloudflare D1** - SQLite at the edge with sharding
- **tRPC** - End-to-end typesafe APIs
- **Drizzle ORM** - TypeScript ORM

### Infrastructure
- **Database Sharding** - Automatic volume-based sharding for D1
- **AI SDK** - Multi-provider AI/LLM integration
- **Supabase** - Authentication and user management
- **Bun** - Fast JavaScript runtime and package manager
- **Turborepo** - High-performance build system for monorepos

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+ 
- [Node.js](https://nodejs.org) v18+
- [Cloudflare Account](https://cloudflare.com)
- [Supabase Account](https://supabase.com)
- [OpenAI API Key](https://platform.openai.com) (optional, or other AI provider)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/t4-boilerplate.git
cd t4-boilerplate

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your API keys and configuration
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_VERIFICATION_KEY=your_jwt_key

# AI Provider (optional)
OPENAI_API_KEY=your_openai_key

# Support
NEXT_PUBLIC_SUPPORT_EMAIL=support@yourapp.com
NEXT_PUBLIC_CUSTOMER_CARE_EMAIL=care@yourapp.com

# Metadata
NEXT_PUBLIC_METADATA_NAME=T4 Boilerplate
```

### Development

```bash
# Start all development servers (powered by Turborepo)
bun dev

# Or start specific platforms:
bun dev:web      # Next.js only
bun dev:mobile   # Expo only
bun dev:desktop  # Tauri only

# This runs:
# - Next.js web app on http://localhost:3000
# - Expo dev server
# - Tauri desktop app on http://localhost:1420
# - Cloudflare Workers API on http://localhost:8787
```

### Database Setup

```bash
# Generate database migrations
bun --filter @t4/api generate

# Apply migrations locally
bun --filter @t4/api migrate:local

# Seed the database (optional)
bun --filter @t4/api seed:local
```

## 📁 Project Structure

```
t4-boilerplate/
├── apps/
│   ├── next/              # Next.js web application
│   └── expo/              # Expo native application
├── packages/
│   ├── api/               # tRPC API & Cloudflare Workers
│   │   ├── src/
│   │   │   ├── lib/       # Core libraries
│   │   │   │   └── sharding/  # D1 database sharding
│   │   │   ├── routers/   # tRPC routers
│   │   │   └── services/  # Business logic
│   │   └── migrations/    # Database migrations
│   ├── app/               # Shared application code
│   │   ├── features/      # Feature modules
│   │   ├── provider/      # App providers
│   │   └── utils/         # Utilities
│   └── ui-tw/             # Tailwind/NativeWind components
│       └── src/
│           ├── components/  # Universal UI components
│           └── catalyst/   # Catalyst UI Kit (web-only)
└── tooling/               # Build tools and configs
```

## 🗄️ Database Sharding

This boilerplate includes a sophisticated sharding system for Cloudflare D1:

### Features
- **Automatic Shard Management** - Creates and manages database volumes
- **Universal ID Generation** - IDs contain shard information
- **Cross-Shard Queries** - Query across multiple shards
- **Migration Support** - Apply schema changes to all shards

### Usage

```typescript
// Example: Using sharded database
import { db } from '@t4/api/db'

// Insert data (automatically sharded)
const user = await db.users.create({
  email: 'user@example.com',
  name: 'John Doe'
})

// Query across shards
const allUsers = await db.users.findMany({
  where: { active: true }
})
```

## 🎨 UI Components

This boilerplate includes two sets of UI components:

### Universal Components (Web + Native)
Our custom components built with Tailwind CSS + NativeWind that work on both web and native:

```typescript
import { Button, Text, Container } from '@t4/ui-tw'

export function MyComponent() {
  return (
    <Container className="flex-1 justify-center items-center">
      <Text variant="h1" className="mb-4">
        Welcome to T4 Boilerplate
      </Text>
      <Button 
        onPress={() => console.log('Pressed')}
        variant="primary"
        size="lg"
      >
        Get Started
      </Button>
    </Container>
  )
}
```

### Catalyst UI Kit (Web Only)
Premium components from Tailwind's Catalyst UI Kit for web-only features:

```typescript
import { Catalyst } from '@t4/ui-tw'

export function WebOnlyComponent() {
  return (
    <Catalyst.FieldGroup>
      <Catalyst.Field>
        <Catalyst.Label>Email</Catalyst.Label>
        <Catalyst.Input type="email" />
      </Catalyst.Field>
      <Catalyst.Button color="blue">
        Submit
      </Catalyst.Button>
    </Catalyst.FieldGroup>
  )
}
```

**Catalyst includes:** Alerts, Avatars, Badges, Buttons, Checkboxes, Comboboxes, Dialogs, Dropdowns, Form fields, Tables, and more. 

View the demo at `http://localhost:3000/catalyst-demo` when running the dev server.

## 🤖 AI Integration

OpenRouter integration is built-in:

```typescript
// Example: Using AI SDK
const result = await trpc.ai.generateText.mutate({
  prompt: 'Hello, AI!',
  system: 'You are a helpful assistant',
})

// Or structured output
const data = await trpc.ai.generateStructured.mutate({
  prompt: 'Extract product info from: New iPhone 15 Pro, $999, in stock',
  schemaType: 'product',
})
```

## 🚀 Deployment

### Cloudflare Workers (API)

```bash
# Deploy to Cloudflare Workers
bun --filter @t4/api deploy
```

### Vercel (Next.js)

```bash
# Deploy to Vercel
bunx vercel --cwd apps/next
```

### Expo (Mobile Apps)

```bash
# Build for production
bun --filter expo build:ios
bun --filter expo build:android
```

## 📚 Documentation

- [T4 Stack Documentation](https://t4stack.com)
- [Tailwind CSS](https://tailwindcss.com)
- [NativeWind](https://www.nativewind.dev)
- [Cloudflare D1](https://developers.cloudflare.com/d1)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [T4 Stack](https://t4stack.com) by Tim Miller
- [NativeWind](https://www.nativewind.dev) team
- [Cloudflare](https://cloudflare.com) for the edge platform
- [Supabase](https://supabase.com) for authentication