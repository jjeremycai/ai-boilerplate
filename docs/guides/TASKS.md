# Development Tasks

## ✅ Completed

### Repository Cleanup
- [x] Remove pglevy as contributor by creating fresh git history
- [x] Reorganize folder structure into clean monorepo
- [x] Move apps to `/apps` directory (web, mobile, backend)
- [x] Move shared code to `/packages` directory
- [x] Update all import paths

### Technology Migration
- [x] Migrate from npm to Bun as JavaScript runtime
- [x] Keep Vite for frontend development (works great with Bun)
- [x] Keep Hono for backend (Cloudflare Workers)
- [x] Update all package.json scripts to use Bun
- [x] Update CI/CD to use Bun with `oven-sh/setup-bun@v2`
- [x] Fix all TypeScript version inconsistencies (5.7.2)

### Documentation Updates
- [x] Update README to reflect actual features
- [x] Remove misleading template tiers
- [x] Document Bun + Vite + Hono stack
- [x] Update all command examples to use `bun`

### Missing Features Added
- [x] Create blog routes with KV storage
- [x] Create items routes with D1 database
- [x] Create agent chat routes for AI workflows
- [x] Fix database schema for items table

## 🚧 In Progress

None currently.

## 📋 Backlog

### Infrastructure
- [ ] Set up staging environment
- [ ] Configure preview deployments
- [ ] Add database migrations system
- [ ] Set up monitoring and logging

### Features
- [ ] Add user profile management
- [ ] Implement file upload to R2
- [ ] Add email notifications
- [ ] Create admin dashboard

### Developer Experience
- [ ] Add E2E testing setup
- [ ] Create component documentation
- [ ] Add performance monitoring
- [ ] Set up error tracking

### Mobile App
- [ ] Implement push notifications
- [ ] Add offline support
- [ ] Create app store assets
- [ ] Set up OTA updates

## 💡 Ideas

- GraphQL API layer
- Redis/Upstash for caching
- Stripe integration for payments
- Analytics dashboard
- A/B testing framework
- Internationalization (i18n)

## 📝 Notes

### Stack Decisions
- **Bun**: Chosen for speed and modern JavaScript runtime
- **Vite**: Best DX for frontend development, works perfectly with Bun
- **Hono**: Lightweight and edge-first, perfect for Cloudflare Workers
- **No Next.js**: Intentionally avoided for simplicity and edge-first approach

### Architecture Notes
- Monorepo managed with Bun workspaces
- Shared types in `/packages/types`
- UI components in `/packages/ui`
- Each app has its own package.json

---

Last updated: June 9, 2025