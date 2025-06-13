import { D1Database } from '@cloudflare/workers-types';
import { UniversalIdGenerator } from '../lib/universal-id';
import { DatabaseRouter } from '../lib/database-router';

export interface ShardedDbConfig {
  idGenerator: UniversalIdGenerator;
  router: DatabaseRouter;
}

export class ShardedDbService {
  private idGenerator: UniversalIdGenerator;
  private router: DatabaseRouter;

  constructor(config: ShardedDbConfig) {
    this.idGenerator = config.idGenerator;
    this.router = config.router;
  }

  async create<T extends Record<string, any>>(
    tableName: string,
    data: Omit<T, 'id'>,
    options?: { timestamp?: number }
  ): Promise<T & { id: string }> {
    // Get active shard for writing
    const { shardId, db } = await this.router.getActiveShardForWrite();

    // Generate new ID with shard information
    const id = await this.idGenerator.generate({
      shardId,
      recordType: tableName,
      timestamp: options?.timestamp
    });

    // Prepare columns and values
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => data[col]);

    // Insert record
    await db.prepare(`
      INSERT INTO ${tableName} (id, ${columns.join(', ')})
      VALUES (?, ${placeholders})
    `).bind(id, ...values).run();

    return { id, ...data } as T & { id: string };
  }

  async findById<T>(
    tableName: string,
    id: string
  ): Promise<T | null> {
    // Get the correct shard for this ID
    const db = await this.router.getShardForId(id);

    const result = await db.prepare(`
      SELECT * FROM ${tableName} WHERE id = ?
    `).bind(id).first<T>();

    return result || null;
  }

  async findByIds<T>(
    tableName: string,
    ids: string[]
  ): Promise<T[]> {
    if (ids.length === 0) return [];

    return this.router.queryByIds(ids, async (db, shardIds) => {
      const placeholders = shardIds.map(() => '?').join(', ');
      const results = await db.prepare(`
        SELECT * FROM ${tableName} 
        WHERE id IN (${placeholders})
      `).bind(...shardIds).all<T>();

      return results.results;
    });
  }

  async update<T extends Record<string, any>>(
    tableName: string,
    id: string,
    data: Partial<Omit<T, 'id'>>
  ): Promise<boolean> {
    // Get the correct shard for this ID
    const db = await this.router.getShardForId(id);

    // Prepare update statement
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = columns.map(col => data[col]);

    const result = await db.prepare(`
      UPDATE ${tableName}
      SET ${setClause}, updated_at = datetime('now')
      WHERE id = ?
    `).bind(...values, id).run();

    return result.meta.changes > 0;
  }

  async delete(
    tableName: string,
    id: string
  ): Promise<boolean> {
    // Get the correct shard for this ID
    const db = await this.router.getShardForId(id);

    const result = await db.prepare(`
      DELETE FROM ${tableName} WHERE id = ?
    `).bind(id).run();

    return result.meta.changes > 0;
  }

  async findAll<T>(
    tableName: string,
    options?: {
      where?: Record<string, any>;
      orderBy?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<T[]> {
    // For queries that span all shards
    return this.router.queryAll(async (db) => {
      let query = `SELECT * FROM ${tableName}`;
      const bindings: any[] = [];

      // Add WHERE clause
      if (options?.where && Object.keys(options.where).length > 0) {
        const whereConditions = Object.keys(options.where)
          .map(key => `${key} = ?`);
        query += ` WHERE ${whereConditions.join(' AND ')}`;
        bindings.push(...Object.values(options.where));
      }

      // Add ORDER BY
      if (options?.orderBy) {
        query += ` ORDER BY ${options.orderBy}`;
      }

      // Add LIMIT and OFFSET (applied per shard)
      if (options?.limit) {
        query += ` LIMIT ?`;
        bindings.push(options.limit);
      }
      if (options?.offset) {
        query += ` OFFSET ?`;
        bindings.push(options.offset);
      }

      const results = await db.prepare(query).bind(...bindings).all<T>();
      return results.results;
    });
  }

  async count(
    tableName: string,
    where?: Record<string, any>
  ): Promise<number> {
    const counts = await this.router.queryAll(async (db) => {
      let query = `SELECT COUNT(*) as count FROM ${tableName}`;
      const bindings: any[] = [];

      if (where && Object.keys(where).length > 0) {
        const whereConditions = Object.keys(where)
          .map(key => `${key} = ?`);
        query += ` WHERE ${whereConditions.join(' AND ')}`;
        bindings.push(...Object.values(where));
      }

      const result = await db.prepare(query).bind(...bindings).first<{ count: number }>();
      return [result?.count || 0];
    });

    return counts.reduce((sum, count) => sum + count, 0);
  }

  async executeRaw<T>(
    query: string,
    bindings: any[],
    options?: { 
      singleShard?: boolean;
      shardId?: string;
    }
  ): Promise<T[]> {
    if (options?.singleShard && options?.shardId) {
      // Execute on specific shard
      const db = (await this.router.getAllShards()).get(options.shardId);
      if (!db) {
        throw new Error(`Shard ${options.shardId} not found`);
      }
      const result = await db.prepare(query).bind(...bindings).all<T>();
      return result.results;
    }

    // Execute across all shards
    return this.router.queryAll(async (db) => {
      const result = await db.prepare(query).bind(...bindings).all<T>();
      return result.results;
    });
  }

  // Helper method to get shard statistics
  async getShardStats() {
    return this.router.getShardStats();
  }

  // Helper method to get active shard info
  getActiveShardInfo() {
    return {
      activeShardId: this.router.getActiveShardId(),
      totalShards: this.router.getAllShards().size
    };
  }
}