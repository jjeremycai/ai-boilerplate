import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrossShardQueryService } from '../cross-shard-query.service';
import { DatabaseRouter } from '../../lib/database-router';
import { ShardedDbService } from '../sharded-db.service';

describe('CrossShardQueryService', () => {
  let service: CrossShardQueryService;
  let mockRouter: DatabaseRouter;
  let mockShardedDb: ShardedDbService;
  let mockShards: any[];

  beforeEach(() => {
    // Mock shards
    mockShards = [
      {
        id: 'shard1',
        db: {
          prepare: vi.fn().mockReturnThis(),
          bind: vi.fn().mockReturnThis(),
          all: vi.fn(),
          batch: vi.fn(),
        },
      },
      {
        id: 'shard2',
        db: {
          prepare: vi.fn().mockReturnThis(),
          bind: vi.fn().mockReturnThis(),
          all: vi.fn(),
          batch: vi.fn(),
        },
      },
    ];

    // Mock router
    mockRouter = {
      getAllShards: vi.fn().mockReturnValue(mockShards),
      getShardById: vi.fn((id) => mockShards.find(s => s.id === id)),
      getActiveShardForWrite: vi.fn().mockResolvedValue(mockShards[0]),
    } as any;

    // Mock sharded DB service
    mockShardedDb = {} as any;

    service = new CrossShardQueryService(mockRouter, mockShardedDb);
  });

  describe('queryAllShardsWithGlobalSort', () => {
    it('should query all shards and return combined results', async () => {
      // Mock shard responses
      mockShards[0].db.all.mockResolvedValue({
        results: [
          { id: '1', name: 'Item 1', value: 10 },
          { id: '2', name: 'Item 2', value: 20 },
        ],
      });

      mockShards[1].db.all.mockResolvedValue({
        results: [
          { id: '3', name: 'Item 3', value: 15 },
          { id: '4', name: 'Item 4', value: 25 },
        ],
      });

      const result = await service.queryAllShardsWithGlobalSort(
        'SELECT * FROM items',
        []
      );

      expect(result.results).toHaveLength(4);
      expect(result.meta.totalCount).toBe(4);
      expect(result.meta.shardCounts).toEqual({
        shard1: 2,
        shard2: 2,
      });
    });

    it('should apply global sorting', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: [
          { id: '1', value: 20 },
          { id: '2', value: 10 },
        ],
      });

      mockShards[1].db.all.mockResolvedValue({
        results: [
          { id: '3', value: 25 },
          { id: '4', value: 15 },
        ],
      });

      const result = await service.queryAllShardsWithGlobalSort(
        'SELECT * FROM items',
        [],
        { orderBy: { column: 'value', direction: 'ASC' } }
      );

      expect(result.results.map(r => r.value)).toEqual([10, 15, 20, 25]);
    });

    it('should apply global pagination', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: Array.from({ length: 10 }, (_, i) => ({ id: `s1-${i}`, value: i })),
      });

      mockShards[1].db.all.mockResolvedValue({
        results: Array.from({ length: 10 }, (_, i) => ({ id: `s2-${i}`, value: i + 10 })),
      });

      const result = await service.queryAllShardsWithGlobalSort(
        'SELECT * FROM items',
        [],
        { limit: 5, offset: 3 }
      );

      expect(result.results).toHaveLength(5);
      expect(result.meta.totalCount).toBe(20);
    });

    it('should handle shard errors gracefully', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: [{ id: '1', value: 10 }],
      });

      mockShards[1].db.all.mockRejectedValue(new Error('Shard error'));

      const result = await service.queryAllShardsWithGlobalSort(
        'SELECT * FROM items',
        []
      );

      expect(result.results).toHaveLength(1);
      expect(result.meta.shardCounts).toEqual({ shard1: 1 });
    });
  });

  describe('aggregateAcrossShards', () => {
    it('should calculate count across all shards', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: [{ count: 100 }],
      });

      mockShards[1].db.all.mockResolvedValue({
        results: [{ count: 150 }],
      });

      const result = await service.aggregateAcrossShards('items', {
        aggregations: { count: true },
      });

      expect(result.count).toBe(250);
    });

    it('should calculate sum across all shards', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: [{ sum_price: 1000, sum_quantity: 50 }],
      });

      mockShards[1].db.all.mockResolvedValue({
        results: [{ sum_price: 1500, sum_quantity: 75 }],
      });

      const result = await service.aggregateAcrossShards('items', {
        aggregations: { sum: ['price', 'quantity'] },
      });

      expect(result.sum).toEqual({
        price: 2500,
        quantity: 125,
      });
    });

    it('should find min/max values across shards', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: [{ min_price: 10, max_price: 100 }],
      });

      mockShards[1].db.all.mockResolvedValue({
        results: [{ min_price: 5, max_price: 150 }],
      });

      const result = await service.aggregateAcrossShards('items', {
        aggregations: { min: ['price'], max: ['price'] },
      });

      expect(result.min.price).toBe(5);
      expect(result.max.price).toBe(150);
    });

    it('should aggregate groups across shards', async () => {
      mockShards[0].db.all.mockResolvedValue({
        results: [
          { category: 'A', count: 10 },
          { category: 'B', count: 20 },
        ],
      });

      mockShards[1].db.all.mockResolvedValue({
        results: [
          { category: 'A', count: 15 },
          { category: 'C', count: 25 },
        ],
      });

      const result = await service.aggregateAcrossShards('items', {
        aggregations: { groupBy: ['category'] },
      });

      const groups = result.groups.sort((a: any, b: any) => 
        a.category.localeCompare(b.category)
      );

      expect(groups).toEqual([
        { category: 'A', count: 25 },
        { category: 'B', count: 20 },
        { category: 'C', count: 25 },
      ]);
    });
  });

  describe('joinAcrossShards', () => {
    it('should perform cross-shard join', async () => {
      // Mock left table data
      mockShards[0].db.all.mockResolvedValueOnce({
        results: [{ id: '1', name: 'User 1', user_id: 'u1' }],
      });
      mockShards[1].db.all.mockResolvedValueOnce({
        results: [{ id: '2', name: 'User 2', user_id: 'u2' }],
      });

      // Mock right table data
      mockShards[0].db.all.mockResolvedValueOnce({
        results: [{ id: 'o1', user_id: 'u1', amount: 100 }],
      });
      mockShards[1].db.all.mockResolvedValueOnce({
        results: [{ id: 'o2', user_id: 'u2', amount: 200 }],
      });

      const result = await service.joinAcrossShards(
        'users',
        'orders',
        'users.user_id = orders.user_id',
        ['*']
      );

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({
        name: 'User 1',
        amount: 100,
      });
    });
  });

  describe('executeDistributedTransaction', () => {
    it('should execute operations across multiple shards', async () => {
      mockShards[0].db.batch.mockResolvedValue([
        { success: true },
        { success: true },
      ]);

      mockShards[1].db.batch.mockResolvedValue([
        { success: true },
      ]);

      const result = await service.executeDistributedTransaction([
        { shardId: 'shard1', query: 'INSERT INTO items VALUES (?)', params: ['item1'] },
        { shardId: 'shard1', query: 'UPDATE items SET name = ?', params: ['updated'] },
        { shardId: 'shard2', query: 'DELETE FROM items WHERE id = ?', params: ['old'] },
      ]);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
    });

    it('should report failure if any shard fails', async () => {
      mockShards[0].db.batch.mockResolvedValue([{ success: true }]);
      mockShards[1].db.batch.mockRejectedValue(new Error('Transaction failed'));

      const result = await service.executeDistributedTransaction([
        { shardId: 'shard1', query: 'INSERT INTO items VALUES (?)', params: ['item1'] },
        { shardId: 'shard2', query: 'INSERT INTO items VALUES (?)', params: ['item2'] },
      ]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].shardId).toBe('shard2');
    });
  });

  describe('streamFromAllShards', () => {
    it('should stream results in batches from all shards', async () => {
      // Mock first shard batches
      mockShards[0].db.all
        .mockResolvedValueOnce({
          results: Array.from({ length: 3 }, (_, i) => ({ id: `s1-${i}` })),
        })
        .mockResolvedValueOnce({
          results: Array.from({ length: 2 }, (_, i) => ({ id: `s1-${i + 3}` })),
        })
        .mockResolvedValueOnce({ results: [] });

      // Mock second shard batches
      mockShards[1].db.all
        .mockResolvedValueOnce({
          results: Array.from({ length: 3 }, (_, i) => ({ id: `s2-${i}` })),
        })
        .mockResolvedValueOnce({ results: [] });

      const batches: any[] = [];
      for await (const batch of service.streamFromAllShards(
        'SELECT * FROM items',
        [],
        3
      )) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(3);
      expect(batches[1]).toHaveLength(2);
      expect(batches[2]).toHaveLength(3);
    });
  });
});