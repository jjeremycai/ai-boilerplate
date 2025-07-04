#!/usr/bin/env bun

/**
 * This script generates .env.local files for each app/package
 * based on the root .env.local file
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const rootDir = process.cwd()
const envFile = join(rootDir, '.env.local')

// Packages that need .dev.vars for Cloudflare Workers
const devVarsPackages = ['packages/api']

// Packages that need .env.local
const envLocalPackages = ['apps/web', 'apps/expo']

if (!existsSync(envFile)) {
  console.log('🛑 .env.local file does not exist')
  process.exit(0)
}

console.log('🔥 Generating .env.local files')

const envContent = readFileSync(envFile, 'utf-8')

// Generate .dev.vars files
for (const pkg of devVarsPackages) {
  const targetPath = join(rootDir, pkg, '.dev.vars')
  const header = '# This file is autogenerated. To make changes, modify the root level .env.local file and run bun install\n\n'
  writeFileSync(targetPath, header + envContent + '\nNO_D1_WARNING=true')
}

// Generate .env.local files
for (const pkg of envLocalPackages) {
  const targetPath = join(rootDir, pkg, '.env.local')
  const header = '# This file is autogenerated. To make changes, modify the root level .env.local file and run bun install\n\n'
  writeFileSync(targetPath, header + envContent)
}