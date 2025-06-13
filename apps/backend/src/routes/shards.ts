import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import { getShardContext } from '../lib/shard-context'
import type { Env } from '../index'

export const shardRoutes = new Hono<{ Bindings: Env }>()

// Get shard health status (admin only)
shardRoutes.get('/health', requireAuth, async (c) => {
  const user = c.get('user')
  
  // Check if sharding is enabled
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  if (!hasShards) {
    return c.json({ 
      error: 'Sharding not enabled', 
      code: 'SHARDING_DISABLED' 
    }, 400)
  }

  try {
    const { monitor } = getShardContext(c);
    const reports = await monitor.checkAllShards();
    const allocation = await monitor.getShardAllocationReport();

    return c.json({
      data: {
        shards: reports,
        summary: allocation,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    throw error;
  }
})

// Get specific shard details
shardRoutes.get('/health/:shardId', requireAuth, async (c) => {
  const user = c.get('user')
  const shardId = c.req.param('shardId')
  
  // Check if sharding is enabled
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  if (!hasShards) {
    return c.json({ 
      error: 'Sharding not enabled', 
      code: 'SHARDING_DISABLED' 
    }, 400)
  }

  try {
    const { monitor, router } = getShardContext(c);
    const shards = router.getAllShards();
    const db = shards.get(shardId);
    
    if (!db) {
      return c.json({ 
        error: 'Shard not found', 
        code: 'NOT_FOUND' 
      }, 404)
    }

    const report = await monitor.checkShardHealth(shardId, db);
    
    return c.json({ data: report });
  } catch (error) {
    throw error;
  }
})

// Get active shard info
shardRoutes.get('/active', requireAuth, async (c) => {
  const user = c.get('user')
  
  // Check if sharding is enabled
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  if (!hasShards) {
    return c.json({ 
      error: 'Sharding not enabled', 
      code: 'SHARDING_DISABLED' 
    }, 400)
  }

  try {
    const { db } = getShardContext(c);
    const info = db.getActiveShardInfo();
    
    return c.json({ data: info });
  } catch (error) {
    throw error;
  }
})

// Check for duplicates across shards
shardRoutes.post('/duplicates/check', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ table: string; column: string }>();
  
  // Check if sharding is enabled
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  if (!hasShards) {
    return c.json({ 
      error: 'Sharding not enabled', 
      code: 'SHARDING_DISABLED' 
    }, 400)
  }

  if (!body.table || !body.column) {
    return c.json({ 
      error: 'Table and column are required', 
      code: 'VALIDATION_ERROR' 
    }, 400)
  }

  try {
    const { db } = getShardContext(c);
    const duplicates = await db.findDuplicates(body.table, body.column);
    
    return c.json({ 
      data: {
        table: body.table,
        column: body.column,
        duplicates,
        totalDuplicates: duplicates.length
      }
    });
  } catch (error) {
    throw error;
  }
})

// Check if a value is unique across shards
shardRoutes.post('/unique/check', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ 
    table: string; 
    column: string; 
    value: any;
    excludeId?: string;
  }>();
  
  // Check if sharding is enabled
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  if (!hasShards) {
    return c.json({ 
      error: 'Sharding not enabled', 
      code: 'SHARDING_DISABLED' 
    }, 400)
  }

  if (!body.table || !body.column || body.value === undefined) {
    return c.json({ 
      error: 'Table, column, and value are required', 
      code: 'VALIDATION_ERROR' 
    }, 400)
  }

  try {
    const { db } = getShardContext(c);
    const isUnique = await db.checkUnique(
      body.table, 
      body.column, 
      body.value, 
      body.excludeId
    );
    
    return c.json({ 
      data: {
        table: body.table,
        column: body.column,
        value: body.value,
        isUnique
      }
    });
  } catch (error) {
    throw error;
  }
})

// Clean up duplicates
shardRoutes.post('/duplicates/cleanup', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ 
    table: string; 
    column: string;
    keepStrategy?: 'first' | 'last';
  }>();
  
  // Check if sharding is enabled
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  if (!hasShards) {
    return c.json({ 
      error: 'Sharding not enabled', 
      code: 'SHARDING_DISABLED' 
    }, 400)
  }

  if (!body.table || !body.column) {
    return c.json({ 
      error: 'Table and column are required', 
      code: 'VALIDATION_ERROR' 
    }, 400)
  }

  try {
    const { db } = getShardContext(c);
    const result = await db.deduplicateTable(
      body.table, 
      body.column, 
      body.keepStrategy || 'first'
    );
    
    return c.json({ 
      data: {
        table: body.table,
        column: body.column,
        ...result
      }
    });
  } catch (error) {
    throw error;
  }
})