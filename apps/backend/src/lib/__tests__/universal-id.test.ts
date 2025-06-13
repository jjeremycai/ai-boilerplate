import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalIdGenerator } from '../universal-id';

describe('UniversalIdGenerator', () => {
  let generator: UniversalIdGenerator;

  beforeEach(() => {
    generator = new UniversalIdGenerator();
  });

  describe('generate', () => {
    it('should generate IDs with correct length', async () => {
      const id = await generator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users',
      });

      expect(id).toHaveLength(32);
    });

    it('should generate unique IDs', async () => {
      const ids = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const id = await generator.generate({
          shardId: 'VOL_001_abc123',
          recordType: 'users',
        });
        ids.add(id);
      }

      expect(ids.size).toBe(100);
    });

    it('should use provided timestamp', async () => {
      const timestamp = Date.now() - 86400000; // 1 day ago
      const id = await generator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users',
        timestamp,
      });

      const decoded = await generator.decode(id);
      expect(decoded.timestamp).toBe(timestamp);
    });

    it('should generate consistent shard hashes', async () => {
      const id1 = await generator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users',
      });

      const id2 = await generator.generate({
        shardId: 'VOL_001_abc123',
        recordType: 'users',
      });

      // Extract shard hash portion (characters 10-20)
      const shardHash1 = id1.substring(10, 20);
      const shardHash2 = id2.substring(10, 20);

      expect(shardHash1).toBe(shardHash2);
    });
  });

  describe('decode', () => {
    it('should decode generated IDs correctly', async () => {
      const metadata = {
        shardId: 'VOL_001_abc123',
        recordType: 'projects',
        timestamp: Date.now(),
      };

      const id = await generator.generate(metadata);
      const decoded = await generator.decode(id);

      expect(decoded.shardId).toBe(metadata.shardId);
      expect(decoded.recordType).toBe(metadata.recordType);
      expect(decoded.timestamp).toBe(metadata.timestamp);
      expect(decoded.random).toHaveLength(8);
    });

    it('should throw error for invalid ID length', async () => {
      await expect(generator.decode('short')).rejects.toThrow('Invalid ID length');
    });

    it('should throw error for unknown shard or type', async () => {
      // Create an ID with a different generator instance
      const otherGenerator = new UniversalIdGenerator();
      const id = await otherGenerator.generate({
        shardId: 'VOL_999_unknown',
        recordType: 'unknown',
      });

      // Try to decode with our generator (which doesn't have the mapping cached)
      await expect(generator.decode(id)).rejects.toThrow('Unable to decode ID');
    });
  });

  describe('cache management', () => {
    it('should report cache statistics', async () => {
      // Generate some IDs to populate cache
      for (let i = 0; i < 5; i++) {
        await generator.generate({
          shardId: `VOL_00${i}_test`,
          recordType: `type_${i}`,
        });
      }

      const stats = generator.getCacheStats();
      expect(stats.shardCacheSize).toBe(5);
      expect(stats.typeCacheSize).toBe(5);
      expect(stats.reverseShardCacheSize).toBe(5);
      expect(stats.reverseTypeCacheSize).toBe(5);
      expect(stats.maxCacheSize).toBe(1000);
    });
  });
});