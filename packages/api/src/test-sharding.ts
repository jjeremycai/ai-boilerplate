import { initializeSharding } from './lib/sharding/shard-context'

// Example test to verify sharding setup
export async function testSharding() {
  // Mock environment with shard bindings
  const mockEnv = {
    DB_VOL_0_abc123: {} as D1Database, // Mock D1 database
    DB_VOL_1_def456: {} as D1Database, // Mock D1 database
  }

  const shardContext = initializeSharding(mockEnv)

  console.log('Sharding initialized with components:')
  console.log('- ID Generator:', shardContext.idGenerator)
  console.log('- Router:', shardContext.router)
  console.log('- DB Service:', shardContext.db)
  console.log('- Monitor:', shardContext.monitor)
  console.log('- Dedup Service:', shardContext.dedup)

  // Test ID generation
  const testId = await shardContext.idGenerator.generate({
    shardId: 'VOL_0_abc123',
    recordType: 'users',
  })

  console.log('Generated test ID:', testId)
  console.log('Active shard info:', shardContext.db.getActiveShardInfo())
  console.log('Shard stats:', shardContext.router.getShardStats())
}
