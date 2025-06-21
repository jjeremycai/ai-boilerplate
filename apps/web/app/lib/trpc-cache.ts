import type { ProcedureParams } from '@trpc/server'
import { H3Event } from 'h3'
import { withCache } from './cache'
import { withDedupe } from './dedupe'
import { generateDedupeKey } from './dedupe'
import type { CacheConfig } from '../types/cloudflare'

/**
 * Create a cached tRPC procedure wrapper
 */
export function createCachedProcedure<TParams extends ProcedureParams>(
  procedure: TParams,
  cacheConfig?: CacheConfig
) {
  return procedure.use(async ({ ctx, next, path, rawInput }) => {
    // Get H3 event from context
    const event = ctx.event as H3Event
    
    // Generate cache key based on procedure path and input
    const cacheKey = `trpc:${path}:${JSON.stringify(rawInput || {})}`
    
    // Wrap procedure execution with cache
    const result = await withCache(
      event,
      cacheKey,
      () => next({ ctx }),
      cacheConfig
    )
    
    return result
  })
}

/**
 * Create a deduplicated tRPC procedure wrapper
 */
export function createDedupedProcedure<TParams extends ProcedureParams>(
  procedure: TParams,
  options?: { distributed?: boolean }
) {
  return procedure.use(async ({ ctx, next, path, rawInput }) => {
    // Get H3 event from context
    const event = ctx.event as H3Event
    
    // Generate dedupe key
    const dedupeKey = generateDedupeKey(`trpc:${path}`, rawInput as Record<string, any>)
    
    // Wrap procedure execution with deduplication
    const result = await withDedupe(
      event,
      dedupeKey,
      () => next({ ctx }),
      options
    )
    
    return result
  })
}

/**
 * Create a cached and deduplicated tRPC procedure
 */
export function createOptimizedProcedure<TParams extends ProcedureParams>(
  procedure: TParams,
  options?: {
    cache?: CacheConfig
    dedupe?: { distributed?: boolean }
  }
) {
  let optimized = procedure
  
  // Apply deduplication first
  if (options?.dedupe) {
    optimized = createDedupedProcedure(optimized, options.dedupe)
  }
  
  // Then apply caching
  if (options?.cache) {
    optimized = createCachedProcedure(optimized, options.cache)
  }
  
  return optimized
}

/**
 * Example usage with tRPC router
 */
export const exampleUsage = `
import { router, publicProcedure } from '@/trpc'
import { createOptimizedProcedure } from '@/lib/trpc-cache'
import { z } from 'zod'

export const productRouter = router({
  // Cache product list for 5 minutes
  list: createOptimizedProcedure(publicProcedure, {
    cache: {
      ttl: 300, // 5 minutes
      tags: ['products'],
    },
    dedupe: {
      distributed: true
    }
  })
    .input(z.object({
      limit: z.number().default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Expensive database query
      return await db.products.findMany({
        take: input.limit,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      })
    }),
    
  // Cache individual product for 10 minutes
  byId: createOptimizedProcedure(publicProcedure, {
    cache: {
      ttl: 600, // 10 minutes
      tags: ['products'],
    }
  })
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.products.findUnique({
        where: { id: input.id }
      })
    }),
    
  // Mutation to update product (invalidates cache)
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().optional(),
        price: z.number().optional(),
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const updated = await db.products.update({
        where: { id: input.id },
        data: input.data,
      })
      
      // Invalidate cache
      await invalidateCache(ctx.event, {
        tags: ['products'],
        keys: [\`trpc:product.byId:\${JSON.stringify({ id: input.id })}\`]
      })
      
      return updated
    })
})
`