# CLAUDE.md - AI Assistant Instructions

## Project Overview
This is a full-stack application with universal app support using:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui (NO Next.js)
- **Native Apps**: Tauri 2.0 for iOS, Android, macOS, Windows, Linux
- **Backend**: Cloudflare Workers (edge-first, not Node.js)
- **Database**: Cloudflare D1 (SQL) and KV (key-value store)
- **Authentication**: Clerk (works on all platforms)
- **Real-time**: WebSocket chat with Durable Objects
- **Deployment**: Cloudflare (web + backend), Native app stores

## Critical Rules
1. **NO Next.js** - This is a Vite + React project by design
2. **Edge-first** - Use Cloudflare Workers patterns, not traditional Node.js
3. **Type safety** - No `any` types, maintain strict TypeScript
4. **Component-based** - Small, focused, reusable components

## Project Structure
```
/
├── src/                    # Web frontend (React + Vite)
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── pages/             # Page components
│   ├── hooks/             # React hooks
│   ├── lib/               # Utilities and helpers
│   └── services/          # API client services
├── src-tauri/             # Tauri native code
│   ├── src/               # Rust source files
│   ├── capabilities/      # App permissions
│   └── Cargo.toml         # Rust dependencies
├── worker/                # Cloudflare Workers backend
│   ├── src/               # Worker source code
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Middleware (auth, cors, etc.)
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database schemas and migrations
│   │   ├── durable-objects/ # Durable Objects (chat rooms, sessions)
│   │   └── index.ts       # Worker entry point
│   └── tests/             # Backend tests
├── shared/                # Shared types and utilities
│   └── types/             # TypeScript types used by web, mobile, and backend
└── scripts/               # Build and deployment scripts
```

## Key Commands
Web:
- `npm run dev` - Start web frontend dev server (Vite)
- `npm run dev:worker` - Start full-stack dev server (Worker + Assets)
- `npm run build` - Build web frontend for production
- `npm run deploy` - Deploy web + backend to Cloudflare

Mobile:
- `npm run mobile:install` - Install mobile dependencies
- `npm run dev:mobile` - Start Expo dev server
- `npm run dev:mobile:ios` - Run on iOS simulator
- `npm run dev:mobile:android` - Run on Android emulator

Common:
- `npm run db:migrate` - Run D1 migrations
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run check-updates` - Check for package updates

## Development Guidelines

### Web Frontend
1. Use the existing UI components from `src/components/ui/`
2. Create new pages in `src/pages/`
3. API calls should go through service functions in `src/services/`
4. Use TypeScript strictly - no `any` types
5. Follow the existing component patterns

### Mobile App
1. Use React Native components and APIs
2. Create screens in `mobile/src/screens/`
3. Share types from `shared/types/`
4. Use the same API client pattern as web
5. Follow React Native best practices

### Backend (Cloudflare Workers)
1. All routes should be defined in `worker/src/routes/`
2. Use middleware for cross-cutting concerns
3. Database queries should be in service layer
4. Always validate input data
5. Return consistent error responses

### Database
1. D1 for relational data (projects, tasks, users)
2. KV for caching and session data
3. All migrations in `worker/src/db/migrations/`
4. Use prepared statements for D1 queries

### Authentication
1. Clerk handles all auth flows
2. Verify JWT tokens in worker middleware
3. User context available via `c.get('user')`
4. Protected routes require valid session

## API Conventions
- RESTful endpoints: `/api/v1/resource`
- JSON request/response bodies
- Consistent error format: `{ error: string, code: string }`
- Use proper HTTP status codes
- Include CORS headers

## Testing
- Frontend: Vitest + React Testing Library
- Backend: Vitest + Miniflare
- E2E: Playwright (if needed)

## Environment Variables
Frontend (.env):
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8787
```

Worker Development (.dev.vars):
```
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

Worker Production (use wrangler secret):
```bash
wrangler secret put CLERK_SECRET_KEY
wrangler secret put CLERK_PUBLISHABLE_KEY
```

## Common Tasks

### Adding a new API endpoint
1. Create route handler in `worker/src/routes/`
2. Add TypeScript types in `shared/types/`
3. Create service function in `src/services/`
4. Update API client if needed

### Adding a new page
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Use existing UI components
4. Connect to backend via services

### Database changes
1. Create migration in `worker/src/db/migrations/`
2. Update types in `shared/types/`
3. Run `npm run db:migrate`
4. Update relevant services

### Working with Durable Objects
1. Define DO class in `worker/src/durable-objects/`
2. Export from `worker/src/index.ts`
3. Add binding in `wrangler.toml`
4. Use via `c.env.BINDING_NAME.get(id)`

### Implementing real-time features
1. Use ChatRoom DO for room-based features
2. Handle WebSocket upgrade in DO fetch
3. Use `useWebSocket` hook in frontend
4. Implement reconnection logic

## Important Notes
- Always use TypeScript
- Follow existing code patterns
- Test your changes
- Keep components small and focused
- Use proper error handling
- Validate all user input
- Keep sensitive data in environment variables