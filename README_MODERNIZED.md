# T4 Boilerplate with D1 Sharding

A modern, production-ready boilerplate built on the T4 stack with Cloudflare D1 sharding, Tailwind/NativeWind styling, and AI integration.

## Features

### Core Stack
- 🚀 **T4 Stack**: Next.js, Expo, tRPC, TypeScript
- 🎨 **Styling**: Tailwind CSS + NativeWind (replacing Tamagui)
- 🔐 **Auth**: Supabase Authentication
- 🤖 **AI**: OpenRouter integration for multiple LLM providers
- 📦 **Package Manager**: Bun for fast installs

### Database & Sharding
- 🗄️ **Cloudflare D1**: SQLite at the edge
- 🔀 **Automatic Sharding**: Handle D1's 10GB limit seamlessly
- 🔍 **Cross-Shard Queries**: Query data across multiple shards
- 🆔 **Universal IDs**: Shard-aware ID generation
- 📊 **Shard Monitoring**: Health checks and capacity tracking

### Performance
- ⚡ **6 second package installs** with Bun
- 🚅 **30 second backend deployments**
- 🎯 **Million.js**: React optimization
- 🍰 **PattyCake**: Zero-runtime pattern matching

### Developer Experience
- 🔧 **Type Safety**: End-to-end TypeScript with tRPC
- 🏗️ **Monorepo**: Organized with workspaces
- 🔄 **Hot Reload**: Fast refresh on all platforms
- 📱 **Cross-Platform**: iOS, Android, Web, PWA

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) v1.0+
- [Node.js](https://nodejs.org) v18+
- [Cloudflare Account](https://dash.cloudflare.com)
- [Supabase Account](https://supabase.com)
- [OpenRouter API Key](https://openrouter.ai) (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/t4-boilerplate.git
cd t4-boilerplate

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Development

```bash
# Start all services
bun dev

# Or run individually
bun api     # Cloudflare Workers API
bun web     # Next.js web app
bun native  # Expo mobile app
```

## Project Structure

```
├── apps/
│   ├── expo/          # React Native mobile app
│   └── next/          # Next.js web app
├── packages/
│   ├── api/           # tRPC API with D1 sharding
│   ├── app/           # Shared app logic
│   └── ui-tw/         # Tailwind/NativeWind components
```

## Sharding Architecture

### How It Works

1. **Universal IDs**: Each record gets a globally unique ID with embedded shard information
2. **Automatic Routing**: Writes go to active shards with available capacity
3. **Cross-Shard Queries**: Transparently query across all shards
4. **Reference Tracking**: Maintain relationships across shards

### Example Usage

```typescript
// Create a sharded record
const project = await shardedDb.create('Project', {
  name: 'My Project',
  ownerId: userId,
})

// Query across all shards
const allTasks = await shardedDb.queryAll('Task', {
  where: { projectId: project.id }
})

// Handle cross-shard references
await shardedDb.createWithReference('Task', {
  projectId: project.id,
  title: 'New Task',
}, {
  table: 'Project',
  id: project.id,
})
```

## Configuration

### Database Shards

Configure shards in `packages/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB_VOL_001_abc123"
database_name = "production_shard_001"
database_id = "your-shard-id-here"

# Add more shards as needed
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_VERIFICATION_KEY=

# OpenRouter (optional)
OPENROUTER_API_KEY=

# Cloudflare
APP_URL=https://your-app.com
```

## Deployment

### API (Cloudflare Workers)

```bash
cd packages/api
bun deploy
```

### Web (Cloudflare Pages)

```bash
cd apps/next
bun run build
wrangler pages deploy .vercel/output/static
```

### Mobile

```bash
cd apps/expo

# iOS
bun build:ios

# Android
bun build:android
```

## Key Differences from Standard T4

1. **UI Framework**: Uses Tailwind/NativeWind instead of Tamagui
2. **Database**: Cloudflare D1 with sharding instead of standard D1
3. **Auth**: Supabase instead of built-in JWT
4. **AI Integration**: OpenRouter for LLM access
5. **Additional Features**: Shard monitoring, cross-shard queries, universal IDs

## Performance Benchmarks

- **Package Install**: ~6 seconds
- **API Deploy**: ~30 seconds
- **Web Build**: ~90 seconds
- **Shard Query**: <50ms per shard
- **Cross-Shard Query**: <200ms for 5 shards

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Tim Miller](https://github.com/timothymiller) for the T4 Stack
- [Cloudflare](https://cloudflare.com) for D1 and Workers
- [NativeWind](https://nativewind.dev) team
- [Supabase](https://supabase.com) team