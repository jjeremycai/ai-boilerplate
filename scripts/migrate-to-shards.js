#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 D1 Volume-Based Sharding Migration Tool\n');

// Check if wrangler is installed
try {
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Wrangler CLI not found. Please install it first:');
  console.error('   npm install -g wrangler');
  process.exit(1);
}

async function main() {
  console.log('📋 Pre-migration checklist:');
  console.log('   1. Backup your existing D1 database');
  console.log('   2. Create new D1 databases for shards');
  console.log('   3. Update wrangler.toml with shard database IDs');
  console.log('   4. Deploy your Worker with sharding support\n');

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  const proceed = await question('Have you completed all steps? (y/N): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n⚠️  Migration cancelled. Complete the checklist first.');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting migration...\n');

  // Create migration worker script
  const migrationScript = `
import { ShardMigration } from './src/db/migrations/migrate-to-shards';
import { UniversalIdGenerator } from './src/lib/universal-id';
import { DatabaseRouter } from './src/lib/database-router';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST' || !request.url.endsWith('/migrate')) {
      return new Response('Migration endpoint: POST /migrate', { status: 404 });
    }

    try {
      // Initialize components
      const idGenerator = new UniversalIdGenerator();
      const router = new DatabaseRouter(env, idGenerator);
      
      // Run migration from legacy DB to shards
      const migration = new ShardMigration(env.DB, router, idGenerator, {
        batchSize: 500,
        tables: ['users', 'projects', 'tasks', 'items']
      });

      const result = await migration.runFullMigration();

      return Response.json({
        success: result.success,
        summary: result.results.map(r => ({
          table: r.tableName,
          total: r.totalRecords,
          migrated: r.migratedRecords,
          failed: r.errors.length
        })),
        details: result.results
      });
    } catch (error) {
      return Response.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }
};
`;

  // Write temporary migration worker
  const tempWorkerPath = path.join(__dirname, '..', 'apps', 'backend', 'migration-worker.js');
  fs.writeFileSync(tempWorkerPath, migrationScript);

  try {
    // Deploy migration worker
    console.log('📦 Deploying migration worker...');
    execSync('wrangler deploy migration-worker.js --name boilerplate-migration', {
      cwd: path.join(__dirname, '..', 'apps', 'backend'),
      stdio: 'inherit'
    });

    console.log('\n✅ Migration worker deployed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: curl -X POST https://boilerplate-migration.<your-account>.workers.dev/migrate');
    console.log('   2. Monitor the migration progress in the response');
    console.log('   3. Verify data in new shards');
    console.log('   4. Update your application to use sharded architecture');
    console.log('   5. Delete the migration worker when done\n');

  } catch (error) {
    console.error('❌ Migration deployment failed:', error.message);
  } finally {
    // Clean up
    if (fs.existsSync(tempWorkerPath)) {
      fs.unlinkSync(tempWorkerPath);
    }
    rl.close();
  }
}

main().catch(console.error);