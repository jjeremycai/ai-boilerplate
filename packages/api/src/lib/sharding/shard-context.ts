import { Context } from 'hono'
import { UniversalIdGenerator } from './universal-id'
import { DatabaseRouter } from './database-router'
import { ShardedDbService } from '../../services/sharded-db.service'
import { ShardMonitor } from './shard-monitor'
import { ShardDeduplicationService } from './shard-dedup'

export interface Env {
  [key: string]: any // For D1 database bindings like DB_VOL_0_xxx
  DB?: D1Database // Main DB if needed
}

let cachedIdGenerator: UniversalIdGenerator | null = null
let cachedRouter: DatabaseRouter | null = null
let cachedDbService: ShardedDbService | null = null
let cachedMonitor: ShardMonitor | null = null
let cachedDedup: ShardDeduplicationService | null = null

export interface ShardContext {
  idGenerator: UniversalIdGenerator
  router: DatabaseRouter
  db: ShardedDbService
  monitor: ShardMonitor
  dedup: ShardDeduplicationService
}

export function initializeSharding(env: Env): ShardContext {
  // Use cached instances if available (Workers persist between requests)
  if (cachedIdGenerator && cachedRouter && cachedDbService && cachedMonitor && cachedDedup) {
    return {
      idGenerator: cachedIdGenerator,
      router: cachedRouter,
      db: cachedDbService,
      monitor: cachedMonitor,
      dedup: cachedDedup,
    }
  }

  // Initialize components
  const idGenerator = new UniversalIdGenerator()
  const router = new DatabaseRouter(env, idGenerator)
  const dedup = new ShardDeduplicationService(router)
  const db = new ShardedDbService({
    idGenerator,
    router,
    dedup,
    enforceUniqueConstraints: true,
  })
  const monitor = new ShardMonitor(router)

  // Cache instances
  cachedIdGenerator = idGenerator
  cachedRouter = router
  cachedDbService = db
  cachedMonitor = monitor
  cachedDedup = dedup

  return { idGenerator, router, db, monitor, dedup }
}

export function getShardContext(c: Context<{ Bindings: Env }>): ShardContext {
  // Check if context already has sharding initialized
  const existing = c.get('sharding')
  if (existing) {
    return existing
  }

  // Initialize and store in context
  const sharding = initializeSharding(c.env)
  c.set('sharding', sharding)
  return sharding
}

// Middleware to inject sharding context
export async function shardingMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const sharding = initializeSharding(c.env)
  c.set('sharding', sharding)
  await next()
}
