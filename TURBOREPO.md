# Turborepo Setup Guide

This monorepo uses Turborepo for efficient task orchestration and caching across all apps and packages.

## Architecture

```
t4-boilerplate/
├── apps/
│   ├── @t4/web (Next.js)
│   ├── @t4/expo (React Native)
│   └── @t4/desktop (Tauri)
├── packages/
│   ├── @t4/api (Cloudflare Workers)
│   ├── @t4/ui-tw (Shared UI components)
│   └── app (Shared app logic)
└── turbo.json (Turborepo config)
```

## Key Benefits

1. **Parallel Execution** - Builds all packages simultaneously
2. **Smart Caching** - Only rebuilds what changed
3. **Task Dependencies** - Ensures correct build order
4. **Remote Caching** - Share cache across team (optional)

## Common Commands

### Development
```bash
# Start all dev servers
bun dev

# Start specific apps
bun dev:web      # Next.js only
bun dev:mobile   # Expo only
bun dev:desktop  # Tauri only
```

### Building
```bash
# Build everything
bun build

# Build specific apps
bun build:web
bun build:mobile
bun build:desktop
```

### Other Tasks
```bash
# Type checking
bun typecheck

# Linting
bun lint

# Database operations
bun generate      # Generate migrations
bun migrate:local # Apply migrations locally
bun seed:local    # Seed database locally
```

## Task Pipeline

Turborepo understands task dependencies:

```
build: depends on ^build (build dependencies first)
dev: depends on ^build (build dependencies first)
migrate: depends on generate
seed: depends on migrate
```

## Filtering

Run tasks for specific packages:

```bash
# Run dev for API and its dependencies
turbo dev --filter=@t4/api...

# Run build for web app only
turbo build --filter=@t4/web

# Run typecheck for all packages
turbo typecheck
```

## Caching

Turborepo caches task outputs to speed up subsequent runs:

- ✅ `build` - Cached (outputs: .next/**, dist/**, etc.)
- ✅ `lint` - Cached
- ✅ `typecheck` - Cached
- ❌ `dev` - Not cached (persistent task)
- ❌ `generate` - Not cached (may have side effects)

## Environment Variables

Turborepo is aware of these env var patterns:
- `NODE_ENV`
- `NEXT_PUBLIC_*` (Next.js)
- `EXPO_PUBLIC_*` (Expo)
- `VITE_*` (Vite/Tauri)
- `TAURI_*` (Tauri)

## Performance Tips

1. **Use filters** - Don't rebuild everything if you're only working on one app
2. **Leverage cache** - Turborepo's cache is your friend
3. **Parallel tasks** - Tasks run in parallel when possible
4. **Remote caching** - Enable Vercel Remote Cache for team sharing

## Troubleshooting

### Clear cache
```bash
bun clean
```

### Force rebuild
```bash
turbo build --force
```

### Debug mode
```bash
turbo build --dry-run  # See what would run
turbo build --graph    # Visualize task dependencies
```

## Integration with CI/CD

```yaml
# Example GitHub Actions
- name: Build
  run: bun install && bun build
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

## Learn More

- [Turborepo Docs](https://turbo.build/repo/docs)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)