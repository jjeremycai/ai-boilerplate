import { D1Database } from '@cloudflare/workers-types';
import { UniversalIdGenerator } from '../../lib/universal-id';
import { DatabaseRouter } from '../../lib/database-router';

export interface MigrationConfig {
  batchSize: number;
  tables: string[];
  idColumn: string;
  preserveTimestamps: boolean;
}

export class ShardMigration {
  private sourceDb: D1Database;
  private router: DatabaseRouter;
  private idGenerator: UniversalIdGenerator;
  private config: MigrationConfig;

  constructor(
    sourceDb: D1Database,
    router: DatabaseRouter,
    idGenerator: UniversalIdGenerator,
    config?: Partial<MigrationConfig>
  ) {
    this.sourceDb = sourceDb;
    this.router = router;
    this.idGenerator = idGenerator;
    this.config = {
      batchSize: config?.batchSize || 1000,
      tables: config?.tables || ['users', 'projects', 'tasks', 'items'],
      idColumn: config?.idColumn || 'id',
      preserveTimestamps: config?.preserveTimestamps !== false
    };
  }

  async migrateTable(tableName: string): Promise<{
    tableName: string;
    totalRecords: number;
    migratedRecords: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    console.log(`Starting migration for table: ${tableName}`);
    
    // Get total count
    const countResult = await this.sourceDb.prepare(
      `SELECT COUNT(*) as count FROM ${tableName}`
    ).first<{ count: number }>();
    
    const totalRecords = countResult?.count || 0;
    let migratedRecords = 0;
    const errors: Array<{ id: string; error: string }> = [];

    // Get table schema
    const schemaRows = await this.sourceDb.prepare(
      `PRAGMA table_info(${tableName})`
    ).all();

    const columns = schemaRows.results.map((row: any) => row.name);
    const columnsStr = columns.join(', ');

    // Process in batches
    let offset = 0;
    while (offset < totalRecords) {
      const batch = await this.sourceDb.prepare(
        `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`
      ).bind(this.config.batchSize, offset).all();

      for (const record of batch.results) {
        try {
          await this.migrateRecord(tableName, record, columns);
          migratedRecords++;
        } catch (error) {
          errors.push({
            id: record[this.config.idColumn] as string,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      offset += this.config.batchSize;
      console.log(`Migrated ${migratedRecords}/${totalRecords} records from ${tableName}`);
    }

    return {
      tableName,
      totalRecords,
      migratedRecords,
      errors
    };
  }

  private async migrateRecord(
    tableName: string,
    record: any,
    columns: string[]
  ): Promise<void> {
    const oldId = record[this.config.idColumn];
    
    // Get timestamp from record if available
    let timestamp: number | undefined;
    if (this.config.preserveTimestamps) {
      if (record.created_at) {
        timestamp = new Date(record.created_at).getTime();
      } else if (record.createdAt) {
        timestamp = new Date(record.createdAt).getTime();
      }
    }

    // Get active shard for writing
    const { shardId, db } = await this.router.getActiveShardForWrite();

    // Generate new ID with shard information
    const newId = await this.idGenerator.generate({
      shardId,
      recordType: tableName,
      timestamp
    });

    // Update record with new ID
    const updatedRecord = { ...record };
    updatedRecord[this.config.idColumn] = newId;

    // Build insert query
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(col => updatedRecord[col]);

    await db.prepare(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    ).bind(...values).run();

    // Store ID mapping for reference updates
    await this.storeIdMapping(tableName, oldId, newId);
  }

  private async storeIdMapping(tableName: string, oldId: string, newId: string): Promise<void> {
    // Create mapping table if it doesn't exist
    await this.sourceDb.prepare(`
      CREATE TABLE IF NOT EXISTS shard_migration_mappings (
        table_name TEXT,
        old_id TEXT,
        new_id TEXT,
        migrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (table_name, old_id)
      )
    `).run();

    await this.sourceDb.prepare(`
      INSERT OR REPLACE INTO shard_migration_mappings (table_name, old_id, new_id)
      VALUES (?, ?, ?)
    `).bind(tableName, oldId, newId).run();
  }

  async updateForeignKeys(): Promise<void> {
    console.log('Updating foreign key references...');

    // Define foreign key relationships
    const foreignKeys = [
      { table: 'tasks', column: 'project_id', referencesTable: 'projects' },
      { table: 'tasks', column: 'assigned_to', referencesTable: 'users' },
      { table: 'projects', column: 'owner_id', referencesTable: 'users' },
      // Add more foreign key relationships as needed
    ];

    for (const fk of foreignKeys) {
      await this.updateForeignKeyReferences(fk.table, fk.column, fk.referencesTable);
    }
  }

  private async updateForeignKeyReferences(
    tableName: string,
    columnName: string,
    referencedTable: string
  ): Promise<void> {
    console.log(`Updating ${tableName}.${columnName} references to ${referencedTable}`);

    // Get all mappings for the referenced table
    const mappings = await this.sourceDb.prepare(`
      SELECT old_id, new_id FROM shard_migration_mappings
      WHERE table_name = ?
    `).bind(referencedTable).all();

    // Group records by shard for efficient updates
    const updatesByShhard = new Map<string, Array<{ oldId: string; newId: string }>>();

    for (const mapping of mappings.results) {
      const decoded = await this.idGenerator.decode(mapping.new_id as string);
      const updates = updatesByShhard.get(decoded.shardId) || [];
      updates.push({
        oldId: mapping.old_id as string,
        newId: mapping.new_id as string
      });
      updatesByShhard.set(decoded.shardId, updates);
    }

    // Update each shard
    for (const [shardId, updates] of updatesByShhard) {
      const db = (await this.router.getAllShards()).get(shardId);
      if (!db) continue;

      // Update in batches
      for (const update of updates) {
        await db.prepare(`
          UPDATE ${tableName}
          SET ${columnName} = ?
          WHERE ${columnName} = ?
        `).bind(update.newId, update.oldId).run();
      }
    }
  }

  async runFullMigration(): Promise<{
    success: boolean;
    results: Array<{
      tableName: string;
      totalRecords: number;
      migratedRecords: number;
      errors: Array<{ id: string; error: string }>;
    }>;
  }> {
    const results = [];
    let success = true;

    // Ensure shard schemas match source
    await this.ensureShardSchemas();

    // Migrate each table
    for (const table of this.config.tables) {
      const result = await this.migrateTable(table);
      results.push(result);
      if (result.errors.length > 0) {
        success = false;
      }
    }

    // Update foreign keys
    await this.updateForeignKeys();

    return { success, results };
  }

  private async ensureShardSchemas(): Promise<void> {
    console.log('Ensuring shard schemas match source...');
    
    // Get schema from source database
    const schemaResult = await this.sourceDb.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name IN (${this.config.tables.map(() => '?').join(',')})
    `).bind(...this.config.tables).all();

    // Apply schema to all shards
    const shards = this.router.getAllShards();
    for (const [, db] of shards) {
      for (const row of schemaResult.results) {
        if (row.sql) {
          await db.prepare(row.sql as string).run();
        }
      }
    }
  }
}