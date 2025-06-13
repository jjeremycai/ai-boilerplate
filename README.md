# AI-First Full-Stack Development Boilerplate

**Launch production apps in under an hour** with AI assistance. Designed for developers to deploy with Claude/Cursor quickly and efficiently.

## 🎯 Purpose

This boilerplate serves as a zero-to-production starting point for AI-assisted development:
- **One-command setup** - From clone to deployed app in minutes
- **Production-ready** - Full-stack app with auth, database, and real-time features
- **AI-optimized** - Full MCP integration + structured docs for Claude/Cursor
- **Edge-first architecture** - Global deployment on Cloudflare's network
- **Scalable by design** - Built-in volume-based D1 sharding for growth
- **Real demo data** - See it working immediately
- **Minimal dependencies** - Clean codebase, no heavy component libraries

## 🚀 Quick Start

```bash
git clone https://github.com/jjeremycai/ai-boilerplate.git my-app
cd my-app
npm install
```

**⚠️ IMPORTANT: See [SETUP.md](./SETUP.md) for required configuration steps!**

The app needs:
- KV namespace for blog posts
- D1 database for items
- Clerk keys for authentication

Without these, features will show errors. Full setup takes ~10 minutes.

## 🎯 What's Included

This full-stack boilerplate includes everything you need for production:

### Core Features
- ✅ **API Backend** - Cloudflare Workers with Hono framework
- ✅ **Database** - D1 (SQLite) with automatic volume-based sharding
- ✅ **Authentication** - Clerk for web & mobile auth
- ✅ **Real-time** - WebSockets via Durable Objects
- ✅ **Storage** - KV for fast key-value storage
- ✅ **AI Integration** - Workers AI for text, chat, and image generation

### Frontend Apps
- ✅ **Web App** - React 19 + TypeScript + Vite + Tailwind CSS
- ✅ **Mobile App** - Expo + React Native + TypeScript
- ✅ **Desktop App** - Tauri (Rust) for native desktop

### Developer Experience
- ✅ **Type Safety** - End-to-end TypeScript
- ✅ **Hot Reload** - Fast development iteration
- ✅ **AI-Ready** - MCP integration + structured docs
- ✅ **One-Command Deploy** - Ship to production instantly

### Scalability Built-In
- ✅ **Volume-Based Sharding** - Automatically scale beyond D1's 10GB limit
- ✅ **Shard Monitoring** - Health checks and capacity tracking
- ✅ **Zero-Downtime Migration** - Move data without service interruption

## 🤖 AI-First Development

### MCP Integration (Model Context Protocol)
Full integration with Claude Desktop and Cursor:
- **Stripe MCP** - Payment processing
- **GitHub MCP** - Repository management  
- **All Cloudflare MCPs** - Workers, D1, KV, Analytics, etc.
- **Sequential Thinking** - Enhanced reasoning

```bash
npm run setup:mcp  # Copies config to Claude Desktop
```

### Code Generation Tools
```bash
npm run generate:endpoint  # Create new API endpoints
npm run generate:model     # Create database models
npm run generate:migration # Create DB migrations
```

## 🛠 Tech Stack

**Frontend**
- **Web**: React 19 + TypeScript + Vite (NO Next.js by design)
- **Mobile**: Expo + React Native + TypeScript
- Tailwind CSS v3 (minimal design, no external component libraries)
- Single Dashboard page with integrated tabs
- React Native styling (mobile)
- Clerk authentication across platforms

**Backend**
- Cloudflare Workers + Hono framework
- D1 Database (SQLite) + KV Store
- Durable Objects for stateful services
- Edge-native architecture

**Developer Experience**
- Auto-update notifications on install
- Type-safe API client
- Hot reload development
- One-command deployment

## 📁 Project Structure

```
/
├── src/                    # React web frontend
│   ├── components/         # Reusable UI components
│   │   └── chat/          # Real-time chat components
│   ├── pages/             # Dashboard page with tabs
│   ├── hooks/             # Custom React hooks
│   └── services/          # API client
├── mobile/                # Expo React Native app
│   ├── src/               # Mobile source code
│   │   ├── screens/       # Screen components
│   │   ├── navigation/    # Navigation setup
│   │   ├── services/      # API client
│   │   └── hooks/         # Custom hooks
│   ├── app.json          # Expo configuration
│   └── App.tsx           # App entry point
├── worker/                # Cloudflare Workers backend
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── durable-objects/   # Stateful services
│   └── db/                # Database schemas
├── shared/                # Shared TypeScript types
├── MODEL-INSTRUCTIONS.md  # AI assistant guide
├── .cursor/rules.md      # Cursor IDE rules
├── PROJECT.md            # Your project definition (edit this!)
└── TASKS.md              # Development task tracking
```

## 🚦 Development Commands

```bash
# Web Development
npm run dev:worker        # Start full-stack dev server
npm run dev              # Frontend only (Vite)

# Mobile Development
npm run mobile:start     # Start Expo development server
npm run mobile:ios       # Run on iOS simulator
npm run mobile:android   # Run on Android emulator
npm run mobile:web       # Run mobile app in web browser

# Database
npm run db:migrate       # Run D1 migrations

# Deployment
npm run deploy           # Deploy web to Cloudflare
npm run mobile:build     # Build mobile app
npm run mobile:build:ios # Build for iOS App Store
npm run mobile:build:android # Build for Google Play Store

# Maintenance
npm run check-updates    # Check for package updates
npm run update-packages  # Update all dependencies
npm run lint            # Run ESLint
npm run typecheck       # TypeScript check
```

## 🔧 Configuration

### Environment Setup

1. **Clone and Install**
   ```bash
   git clone <repo> my-project
   cd my-project
   npm install
   ```

2. **Run Setup Script**
   ```bash
   ./scripts/setup.sh
   ```
   This will:
   - Create D1 database
   - Create KV namespace
   - Update wrangler.toml
   - Guide you through configuration

3. **Add API Keys**
   ```bash
   # Web frontend
   cp .env.example .env
   
   # Worker backend
   cp .dev.vars.example .dev.vars
   
   # Add your Clerk keys to both files

   # Production secrets
   wrangler secret put CLERK_SECRET_KEY
   wrangler secret put CLERK_PUBLISHABLE_KEY
   ```

### AI Assistant Configuration

**For Claude/Cursor:**
- MODEL-INSTRUCTIONS.md provides comprehensive context
- .cursor/rules.md defines coding patterns and shortcuts
- Structured for optimal AI comprehension

**Key Rules:**
- NO Next.js - Vite + React only
- NO external component libraries - Pure Tailwind CSS
- Edge-first with Cloudflare Workers
- TypeScript strictly enforced
- Component-based architecture
- Minimal dependency footprint

## 🎨 Built-in Features

### API Endpoints

**Project Management**
- `GET/POST /api/v1/projects` - Manage projects
- `GET/PATCH/DELETE /api/v1/projects/:id` - Project operations
- `GET /api/v1/projects/:id/stats` - Project statistics

**Task Management**
- `GET/POST /api/v1/tasks` - Manage tasks
- `PATCH/DELETE /api/v1/tasks/:id` - Task operations
- `POST /api/v1/tasks/bulk-update` - Bulk operations

**Real-time Chat**
- `GET/POST /api/v1/chat/rooms` - Chat room management
- `GET /api/v1/chat/rooms/:id/websocket` - WebSocket connection
- `GET /api/v1/chat/rooms/:id/messages` - Message history

**User Management**
- `GET/PATCH /api/v1/users/me` - User profile
- `GET /api/v1/users/me/stats` - User statistics

### UI Components

- **Custom Tailwind components** - Clean, minimal UI without external libraries
- **Chat components** - Real-time messaging UI
- **Dashboard with tabs** - D1 Database, SEO Blog, Live Chat
- **Responsive layouts** - Mobile-first design

## 🤖 AI Development Workflow

### 1. Define Your Project
```bash
# Edit PROJECT.md to include:
- Project overview and goals
- Core features needed
- UI/UX requirements
- Success criteria
```

### 2. Track Your Progress
```bash
# Edit TASKS.md to manage:
- Current sprint tasks
- Backlog items
- Completed work
- Ideas and notes
```

### 3. Customize AI Behavior
```bash
# Edit .cursor/rules.md for:
- Code style preferences
- Custom shortcuts
- Project-specific patterns
```

### 4. Use AI Effectively
- **Start with high-level tasks** → AI understands context
- **Reference existing patterns** → Consistent codebase
- **Leverage built-in systems** → Faster development
- **Use TypeScript types** → Better AI suggestions

## 🚀 Deployment

```bash
# One-command deployment
npm run deploy

# Deploys:
- Frontend assets → Cloudflare CDN
- Worker API → Global edge network
- Durable Objects → Stateful services
- Database → D1 (SQLite at the edge)
```

### 📊 Volume-Based D1 Sharding

Built-in horizontal scaling for D1 databases:

```bash
# Deploy with sharding support
npm run deploy:sharding

# Check shard health
curl https://your-worker.workers.dev/api/v1/shards/health

# Migrate existing data to shards
npm run migrate-to-shards
```

**Features:**
- **Automatic capacity-based routing** - Records go to shards with space
- **No central coordination** - Shard info embedded in record IDs
- **Health monitoring** - Track usage and get alerts before limits
- **Zero-downtime migration** - Move data without service interruption

See [docs/VOLUME-SHARDING.md](./docs/VOLUME-SHARDING.md) for detailed setup.

### Build Troubleshooting

**Common Build Issues:**

1. **Platform-Specific Native Module Errors**
   - **Symptom**: `Cannot find module @rollup/rollup-linux-x64-gnu` or similar platform-specific errors
   - **Cause**: Missing native binaries for the deployment platform
   - **Solution**: Already handled via `optionalDependencies` in package.json

2. **TypeScript Strict Mode Errors**
   - **Symptom**: Unused variable/parameter errors in production but not locally
   - **Cause**: Different TypeScript settings between environments
   - **Check**: Ensure `tsconfig.app.json` strict settings match your development environment
   - **Settings**: `"noUnusedLocals": true`, `"noUnusedParameters": true`

3. **Infinite Build Loop "[custom build]"**
   - **Symptom**: Build gets stuck repeating "[custom build]" messages
   - **Cause**: LightningCSS native module failures in CI/CD
   - **Solution**: Use standard Tailwind CSS v3 instead of v4 (already configured)

4. **CSS Processing Errors**
   - **Symptom**: CSS import or processing failures
   - **Solution**: Ensure `postcss.config.js` and `tailwind.config.js` are properly configured for v3

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Hono Framework](https://hono.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Clerk Authentication](https://clerk.dev/)

## 🤝 Contributing

This boilerplate is designed to evolve with AI assistance:

1. **Enhance AI instructions** in MODEL-INSTRUCTIONS.md
2. **Add useful patterns** to .cursor/rules.md
3. **Create reusable components** following existing patterns
4. **Maintain TypeScript types** in shared/types

---

Built for developers who leverage AI to build faster and better. 🚀