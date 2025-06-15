# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2024-12-15

### Added

#### Tauri 2.0 Desktop App
- 🖥️ Created desktop app structure in `apps/desktop`
- ✨ Tauri 2.0 for native desktop experience
- 🔧 Vite + React setup for desktop UI
- 🎨 Shares UI components with web/mobile

### Changed

#### AI Integration
- 🔄 Replaced OpenRouter with Vercel AI SDK
- 🤖 Support for multiple AI providers (OpenAI, Anthropic, Google)
- 📝 Structured output generation with Valibot schemas
- 🌊 Streaming support for real-time responses
- 🎯 New AI endpoints: generateText, streamText, summarize, extractData

#### Monorepo Management
- 🚀 Added Turborepo for efficient monorepo management
- ⚡ Parallel task execution and smart caching
- 📋 Task orchestration with dependency management
- 🎯 Filtering for targeted builds

### Recommendations

- **Keep Valibot** over Zod - smaller bundle, tree-shakeable, already integrated
- **Keep Jotai** over Zustand - better React Suspense support, atomic design
- **Added Turborepo** - Essential for managing multi-app monorepo efficiently

## [2.1.0] - 2024-12-15

### Added

#### Catalyst UI Kit Integration
- 💎 Premium Catalyst UI Kit components from Tailwind UI
- 🎨 27+ beautifully designed components for web applications
- 📦 Components include: Alerts, Avatars, Badges, Buttons, Checkboxes, Comboboxes, Dialogs, Dropdowns, Forms, Tables, and more
- 🌐 Web-only components using Headless UI for maximum accessibility
- 📄 Demo page at `/catalyst-demo` to showcase all components
- 🎯 Organized in separate `catalyst/` folder for easy management

### Native Implementation
- 🎯 Created CatalystNative components for React Native
- 🎨 Maintains Catalyst's design tokens and color palette
- 📱 Platform-specific implementations with same API
- 📄 Comprehensive integration guide

### Dependencies
- ⬆️ Added @headlessui/react for Catalyst components
- ⬆️ Added framer-motion for animations

## [2.0.0] - 2024-12-15

### 🚀 Major Architecture Update

This release represents a complete architectural overhaul, migrating from the original boilerplate to the T4 Stack with significant enhancements.

### Added

#### UI Framework
- ✨ Tailwind CSS + NativeWind v4 for universal styling
- 📦 New `@t4/ui-tw` component library with:
  - Button (with variants: primary, secondary, ghost, destructive)
  - Text (with typography variants: h1, h2, h3, h4, body, caption)
  - Container
  - ScrollView  
  - Input (with error states)
  - Card
  - Modal
  - Spinner
- 🎨 Utility-first CSS approach for better performance

#### Backend & Infrastructure
- 🗄️ Cloudflare D1 database sharding system
  - Volume-based sharding to handle 10GB limit
  - Universal ID generator with shard information
  - Cross-shard query orchestration
  - Automatic shard management
- 🤖 OpenRouter AI integration service
- ⚡ Cloudflare Workers for edge computing
- 🔧 Hono web framework
- 📊 Drizzle ORM with sharding support

#### Authentication
- 🔐 Supabase authentication integration
- 🔑 JWT verification on edge
- 👤 User hooks and context providers

#### Developer Experience
- 📦 Bun package manager for faster installs
- 🏗️ Turborepo monorepo setup
- 🔍 Biome for fast linting and formatting
- 📝 Comprehensive TypeScript configuration
- 🔄 Environment variable propagation system

#### Performance
- ⚡ Million.js for React optimization
- 🎂 PattyCake for zero-runtime pattern matching
- 📦 Optimized bundle sizes

### Changed

#### UI Migration
- 🔄 Replaced Tamagui with Tailwind CSS + NativeWind
- 🎨 All components rewritten with utility classes
- 📱 Better cross-platform consistency

#### Project Structure
- 📁 Migrated from separate frontend/backend to monorepo:
  ```
  Before: frontend/, backend/, mobile/
  After: apps/next, apps/expo, packages/api, packages/app, packages/ui-tw
  ```

#### Authentication
- 🔐 Migrated from WorkOS/Clerk to Supabase Auth
- 🔄 Updated auth context and providers

#### API Architecture
- 🚀 Migrated from Express to Hono + tRPC
- 📡 Type-safe API with automatic TypeScript types
- 🌍 Edge-first deployment model

#### Dependencies
- ⬆️ Updated all packages to latest versions:
  - React 18.3.1
  - React Native 0.75.4
  - Next.js 15.1.5
  - Expo SDK 51
  - tRPC v11
  - TypeScript 5.7.2

### Removed

#### Tamagui
- ❌ Removed all Tamagui dependencies
- ❌ Removed tamagui.config.ts files
- ❌ Removed @tamagui/lucide-icons
- ❌ Removed Tamagui TypeScript plugin
- ❌ Removed TAMAGUI_TARGET environment variables

#### Legacy Code
- ❌ Removed WorkOS/Clerk authentication
- ❌ Removed Express backend
- ❌ Removed legacy mobile app structure

### Fixed

- 🐛 Dependency version conflicts
- 🐛 TypeScript path resolution issues
- 🐛 React Native Web compatibility
- 🐛 Environment variable handling

### Security

- 🔒 JWT verification on edge
- 🔒 Secure environment variable management
- 🔒 CORS configuration for API routes
- 🔒 Input validation with Valibot

## [1.0.0] - Previous Version

### Initial Release

- Basic Express backend
- React Native mobile app
- Next.js frontend
- WorkOS/Clerk authentication
- Basic D1 integration

---

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions from v1.0.0 to v2.0.0.

## Upgrade Instructions

1. **Backup your data** - Ensure all data is backed up before migration
2. **Update dependencies** - Run `bun install` after pulling latest changes
3. **Environment variables** - Update `.env.local` with new Supabase credentials
4. **Database migration** - Run migration scripts for D1 sharding
5. **Component updates** - Update imports from `@t4/ui` to `@t4/ui-tw`

## Breaking Changes

- UI components have completely different APIs
- Authentication system changed from WorkOS/Clerk to Supabase
- API routes migrated from Express to Hono + tRPC
- Environment variable names have changed
- Import paths updated for new package structure