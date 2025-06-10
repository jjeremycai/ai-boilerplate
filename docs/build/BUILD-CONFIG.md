# Build Configuration

This document outlines the build configuration for the Bun + Vite + Hono stack.

## Overview

The project uses:
- **Bun** as the JavaScript runtime and package manager
- **Vite** for frontend development and building
- **Hono** for the Cloudflare Workers backend
- **TypeScript** across all packages

## Build Scripts

### Root Level

```bash
# Full build process
bun run build         # Runs ./scripts/build.sh

# Individual builds
bun run build:web     # Build web app only
bun run build:backend # Build backend only
```

### Build Process

The main build script (`scripts/build.sh`) performs these steps:

1. **Install Dependencies** - Ensures all packages are installed
2. **Run Tests** - Executes all test suites
3. **Type Check** - Validates TypeScript across all packages
4. **Build Web App** - Creates optimized production build
5. **Prepare Backend** - Packages backend for deployment

## Package-Specific Configuration

### Web App (`apps/web`)

**Vite Configuration:**
- Output directory: `dist/`
- Source maps enabled for debugging
- Manual chunks for optimal loading:
  - `react-vendor`: React and ReactDOM
  - `router`: Wouter routing library
  - `ui`: Shared UI components
- Target: `esnext` for modern browsers
- Minification: `esbuild` for fast builds

### Backend (`apps/backend`)

- No build step required - TypeScript runs directly on Cloudflare Workers
- Uses `wrangler` for deployment
- Configuration in `wrangler.toml` and `wrangler.deploy.toml`

### Shared Packages

- **@boilerplate/ui**: TypeScript source, no build required
- **@boilerplate/types**: TypeScript definitions only

## CI/CD Integration

The GitHub Actions workflow uses the build script:

```yaml
- name: Build Application
  run: bun run build
```

This ensures consistency between local and CI builds.

## Optimization Features

1. **Code Splitting** - Automatic chunks for better caching
2. **Tree Shaking** - Removes unused code
3. **Asset Optimization** - Images and static files processed
4. **TypeScript Performance** - Uses Bun's native TypeScript support

## Environment Considerations

- **Development**: Fast HMR with Vite dev server
- **Production**: Optimized bundles with minimal size
- **Edge Runtime**: Backend optimized for Cloudflare Workers

## Troubleshooting

### Common Issues

1. **Missing bun.lockb**
   - Run `bun install` to generate lockfile
   - Required for CI/CD `--frozen-lockfile` flag

2. **Type Errors**
   - Run `bun run typecheck` to identify issues
   - Check `tsconfig.json` settings in each package

3. **Build Failures**
   - Ensure all dependencies are installed
   - Check for version conflicts
   - Verify environment variables are set

### Performance Tips

- Use `bun run build --filter=@boilerplate/web` to build specific packages
- Enable caching in CI/CD for faster builds
- Keep dependencies up to date for best performance