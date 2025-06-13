import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseRouter } from '../database-router';
import { UniversalIdGenerator } from '../universal-id';

// Mock D1Database
const createMockDb = (name: string) => ({
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn(async () => ({ size: 1000000, count: 100 })),
      all: vi.fn(async () => ({ 
        results: [
          { name: 'users' },
          { name: 'projects' },
          { name: 'tasks' }
        ] 
      })),
      run: vi.fn(async () => ({ meta: { changes: 1 } }))
    }))
  }))
});

describe('DatabaseRouter', () => {
  let router: DatabaseRouter;
  let idGenerator: UniversalIdGenerator;
  let mockEnv: Record<string, any>;

  beforeEach(() => {
    idGenerator = new UniversalIdGenerator();
    mockEnv = {
      DB_VOL_001_abc123: createMockDb('shard1'),
      DB_VOL_002_def456: createMockDb('shard2'),
      DB_VOL_003_ghi789: createMockDb('shard3'),
      OTHER_BINDING: 'should be ignored'
    };
    
    router = new DatabaseRouter(mockEnv, idGenerator);
  });

  describe('initialization', () => {
    it('should identify and initialize all shard bindings', () => {
      const shards = router.getAllShards();
      expect(shards.size).toBe(3);
      expect(shards.has('VOL_001_abc123')).toBe(true);
      expect(shards.has('VOL_002_def456')).toBe(true);
      expect(shards.has('VOL_003_ghi789')).toBe(true);
    });

    it('should select the highest indexed shard as active', () => {
      const activeShardId = router.getActiveShardId();
      expect(activeShardId).toBe('VOL_003_ghi789');
    });
  });

  describe('getActiveShardForWrite', () => {
    it('should return active shard with capacity', async () => {
      const { shardId, db } = await router.getActiveShardForWrite();
      expect(shardId).toBe('VOL_003_ghi789');
      expect(db).toBeDefined();
    });

    it('should throw error when no active shards available', async () => {
      // Mock all shards as over 90% full
      mockEnv.DB_VOL_001_abc123.prepare().bind().first.mockResolvedValue({ 
        size: 9 * 1024 * 1024 * 1024 // 9GB 
      });
      mockEnv.DB_VOL_002_def456.prepare().bind().first.mockResolvedValue({ 
        size: 9 * 1024 * 1024 * 1024 
      });
      mockEnv.DB_VOL_003_ghi789.prepare().bind().first.mockResolvedValue({ 
        size: 9 * 1024 * 1024 * 1024 
      });

      const newRouter = new DatabaseRouter(mockEnv, idGenerator);
      await newRouter.updateShardMetadata('VOL_003_ghi789');
      
      await expect(newRouter.getActiveShardForWrite()).rejects.toThrow('No active shard available');
    });
  });

  describe('getShardForId', () => {
    it('should return correct shard for given ID', async () => {
      const id = await idGenerator.generate({
        shardId: 'VOL_002_def456',
        recordType: 'users'
      });

      const db = await router.getShardForId(id);
      expect(db).toBe(mockEnv.DB_VOL_002_def456);
    });

    it('should throw error for unknown shard', async () => {
      // Create ID with unknown shard
      const otherGenerator = new UniversalIdGenerator();
      const id = await otherGenerator.generate({
        shardId: 'VOL_999_unknown',
        recordType: 'users'
      });

      await expect(router.getShardForId(id)).rejects.toThrow();
    });
  });

  describe('queryAll', () => {
    it('should execute query across all shards', async () => {
      const queryFn = vi.fn(async () => [{ id: '1', name: 'test' }]);
      
      const results = await router.queryAll(queryFn);
      
      expect(queryFn).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });
  });

  describe('queryByIds', () => {
    it('should group IDs by shard and query efficiently', async () => {
      // Generate IDs for different shards
      const id1 = await idGenerator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users'
      });
      const id2 = await idGenerator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users'
      });
      const id3 = await idGenerator.generate({
        shardId: 'VOL_002_def456',
        recordType: 'users'
      });

      const queryFn = vi.fn(async (db, ids) => 
        ids.map(id => ({ id, name: 'test' }))
      );

      const results = await router.queryByIds([id1, id2, id3], queryFn);

      // Should have made 2 queries (one for each shard with IDs)
      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(3);
    });
  });

  describe('getShardStats', () => {
    it('should return metadata for all shards', () => {
      const stats = router.getShardStats();
      expect(stats).toHaveLength(3);
      
      const shard1 = stats.find(s => s.id === 'VOL_001_abc123');
      expect(shard1).toBeDefined();
      expect(shard1?.bindingName).toBe('DB_VOL_001_abc123');
      expect(shard1?.isActive).toBe(true);
    });
  });
});