# Changelog

All notable changes to the Cai Stack will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2024-12-19

### Changed
- Rebranded from T4 Stack to Cai Stack
- Updated all package names to use @cai namespace
- Cleaned up migration files and legacy documentation
- Simplified project structure and documentation

### Added
- Tauri 2.0 Desktop App support
- Vercel AI SDK integration (replaced OpenRouter)
- Turborepo for monorepo management
- Catalyst UI Kit components

### Features
- Universal apps (web, iOS, Android, desktop)
- Edge-first architecture with Cloudflare Workers
- Type-safe API with tRPC
- Tailwind CSS + NativeWind for universal styling
- Database sharding with Cloudflare D1
- Supabase authentication

## [2.0.0] - 2024-12-15

### Initial Cai Stack Release
- Complete rewrite with modern architecture
- Tailwind CSS + NativeWind instead of Tamagui
- Cloudflare D1 with automatic sharding
- Universal component library
- Full TypeScript support