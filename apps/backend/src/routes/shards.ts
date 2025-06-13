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