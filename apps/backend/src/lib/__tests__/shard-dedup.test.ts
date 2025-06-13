import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShardDeduplicationService } from '../shard-dedup';
import { DatabaseRouter } from '../database-router';
import { UniversalIdGenerator } from '../universal-id';

// Mock D1Database
const createMockDb = (shardId: string) => ({
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn(async () => null),
      all: vi.fn(async () => ({ results: [] })),
      run: vi.fn(async () => ({ meta: { changes: 1 } }))
    }))
  }))
});

describe('ShardDeduplicationService', () => {
  let dedup: ShardDeduplicationService;
  let router: DatabaseRouter;
  let mockEnv: Record<string, any>;

  beforeEach(() => {
    mockEnv = {
      DB_VOL_001_abc123: createMockDb('shard1'),
      DB_VOL_002_def456: createMockDb('shard2'),
    };
    
    const idGenerator = new UniversalIdGenerator();
    router = new DatabaseRouter(mockEnv, idGenerator);
    dedup = new ShardDeduplicationService(router);
  });

  describe('checkUnique', () => {
    it('should return true when value is unique across all shards', async () => {
      const isUnique = await dedup.checkUnique({
        table: 'users',
        column: 'email',
        value: 'test@example.com'
      });

      expect(isUnique).toBe(true);
    });

    it('should return false when value exists in any shard', async () => {
      // Mock one shard having the value
      mockEnv.DB_VOL_001_abc123.prepare().bind().first.mockResolvedValue({
        id: 'existing-id'
      });

      const isUnique = await dedup.checkUnique({
        table: 'users',
        column: 'email',
        value: 'existing@example.com'
      });

      expect(isUnique).toBe(false);
    });

    it('should exclude specified ID when checking', async () => {
      const isUnique = await dedup.checkUnique({
        table: 'users',
        column: 'email',
        value: 'test@example.com',
        excludeId: 'current-id'
      });

      // Verify the query includes the exclude clause
      const mockDb = mockEnv.DB_VOL_001_abc123;
      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining('AND id != ?')
      );
    });
  });

  describe('validateUniqueConstraints', () => {
    it('should validate multiple constraints', async () => {
      const result = await dedup.validateUniqueConstraints('users', {
        email: 'new@example.com',
        username: 'newuser'
      });

      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should report violations when constraints fail', async () => {
      // Mock email already exists
      mockEnv.DB_VOL_001_abc123.prepare = vi.fn((query) => ({
        bind: vi.fn(() => ({
          first: vi.fn(async () => 
            query.includes('email') ? { id: 'existing' } : null
          ),
          all: vi.fn(async () => ({ results: [] })),
          run: vi.fn(async () => ({ meta: { changes: 1 } }))
        }))
      }));

      const result = await dedup.validateUniqueConstraints('users', {
        email: 'existing@example.com',
        username: 'newuser'
      });

      expect(result.valid).toBe(false);
      expect(result.violations).toContain("email 'existing@example.com' already exists");
    });
  });

  describe('findDuplicates', () => {
    it('should find duplicates within shards', async () => {
      // Mock duplicates in shard 1
      mockEnv.DB_VOL_001_abc123.prepare = vi.fn((query) => ({
        bind: vi.fn(() => ({
          all: vi.fn(async () => {
            if (query.includes('GROUP BY')) {
              return {
                results: [
                  { email: 'dup@example.com', count: 2 }
                ]
              };
            }
            return { results: [] };
          })
        }))
      }));

      const duplicates = await dedup.findDuplicates('users', 'email');

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toEqual({
        value: 'dup@example.com',
        count: 2,
        shardIds: ['VOL_001_abc123']
      });
    });

    it('should find cross-shard duplicates', async () => {
      // Mock same value in different shards
      mockEnv.DB_VOL_001_abc123.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn(async () => ({
            results: [{ email: 'cross@example.com' }]
          }))
        }))
      }));

      mockEnv.DB_VOL_002_def456.prepare = vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn(async () => ({
            results: [{ email: 'cross@example.com' }]
          }))
        }))
      }));

      const duplicates = await dedup.findDuplicates('users', 'email');

      const crossShardDup = duplicates.find(d => d.value === 'cross@example.com');
      expect(crossShardDup).toBeDefined();
      expect(crossShardDup?.shardIds).toHaveLength(2);
    });
  });

  describe('deduplicateTable', () => {
    it('should remove duplicates keeping first occurrence', async () => {
      // Mock finding duplicates
      const mockIdGenerator = new UniversalIdGenerator();
      const id1 = await mockIdGenerator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users'
      });

      mockEnv.DB_VOL_001_abc123.prepare = vi.fn((query) => ({
        bind: vi.fn(() => ({
          all: vi.fn(async () => {
            if (query.includes('GROUP BY')) {
              return {
                results: [{ email: 'dup@example.com', count: 2 }]
              };
            }
            if (query.includes('ORDER BY')) {
              return {
                results: [
                  { id: id1, created_at: '2024-01-01' },
                  { id: 'id2', created_at: '2024-01-02' }
                ]
              };
            }
            return { results: [] };
          }),
          run: vi.fn(async () => ({ meta: { changes: 1 } }))
        }))
      }));

      const result = await dedup.deduplicateTable('users', 'email', 'first');

      expect(result.kept).toBe(1);
      expect(result.removed).toBe(1);
    });
  });
});