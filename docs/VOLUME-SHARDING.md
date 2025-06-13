# Volume-Based D1 Sharding Implementation

This implementation provides a volume-based sharding solution for Cloudflare D1 databases that automatically distributes data across multiple database instances based on storage capacity rather than time.

## Overview

The sharding system consists of:

1. **Universal ID Generator** - Creates IDs that embed shard location metadata
2. **Database Router** - Routes queries to the appropriate shard based on volume
3. **Shard Monitor** - Tracks database sizes and health
4. **Sharded Services** - Database access layer that handles cross-shard operations

## Key Features

- **Automatic shard selection** based on available capacity
- **No central coordination** - shard info embedded in IDs
- **Backward compatible** - works alongside non-sharded deployments
- **Health monitoring** - tracks shard usage and capacity
- **Migration tools** - move existing data to sharded architecture
- **Cross-shard deduplication** - enforce unique constraints across all shards
- **Duplicate detection** - find and clean up duplicates across shards

## Architecture

### Universal ID Format

```
<timestamp(10)><shardHash(10)><typeHash(4)><random(8)>
```

- **timestamp**: Base-28 encoded timestamp
- **shardHash**: Hashed shard identifier
- **typeHash**: Hashed record type
- **random**: Random characters for uniqueness

### Shard Naming Convention

```
DB_VOL_<index>_<hash>
```

Example: `DB_VOL_001_abc123def`

## Setup

### 1. Update wrangler.toml

```toml
# Primary database (for backward compatibility)
[[d1_databases]]
binding = "DB"
database_name = "boilerplate-db"
database_id = "YOUR_DATABASE_ID"

# Volume-based Shards
[[d1_databases]]
binding = "DB_VOL_001_abc123def"
database_name = "boilerplate-shard-001"
database_id = "YOUR_SHARD_001_ID"

# Add more shards as needed...
```

### 2. Create D1 Databases

```bash
# Create shard databases
wrangler d1 create boilerplate-shard-001
wrangler d1 create boilerplate-shard-002
# ... etc
```

### 3. Initialize Schema

Run the schema on each shard:

```bash
wrangler d1 execute boilerplate-shard-001 --file=./src/db/schema.sql
```

## Usage

### Automatic Mode

The system automatically detects if sharding is enabled by looking for `DB_VOL_*` bindings:

```typescript
// In routes/projects.ts
function getProjectService(c: any) {
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  
  if (hasShards) {
    const { db } = getShardContext(c);
    return new ShardedProjectService(db);
  } else {
    return new ProjectService(c.env.DB);
  }
}
```

### Manual Usage

```typescript
import { getShardContext } from '../lib/shard-context';

// In your route handler
const { db, monitor } = getShardContext(c);

// Create a record (automatically selects active shard)
const user = await db.create('users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Query by ID (automatically routes to correct shard)
const foundUser = await db.findById('users', user.id);

// Query across all shards
const allUsers = await db.findAll('users', {
  where: { status: 'active' },
  orderBy: 'created_at DESC'
});
```

## Monitoring

### Health Check Endpoint

```bash
# Get overall shard health
GET /api/v1/shards/health

# Get specific shard details
GET /api/v1/shards/health/VOL_001_abc123

# Get active shard info
GET /api/v1/shards/active
```

### Automated Monitoring

The system includes a cron job that runs every 2 hours to check shard health:

```toml
[[triggers.crons]]
cron = "0 */2 * * *"
```

## Migration

### Migrate Existing Data

```bash
# Run the migration script
npm run migrate-to-shards

# Or manually trigger via API
curl -X POST https://your-worker.workers.dev/migrate
```

### Migration Process

1. Creates ID mappings table
2. Copies data with new shard-aware IDs
3. Updates foreign key references
4. Validates data integrity

## Scaling Strategy

### When to Add Shards

- When any shard reaches 80% capacity (warning)
- When any shard reaches 90% capacity (critical)
- Before hitting the 10GB D1 limit

### Adding New Shards

1. Create new D1 database
2. Add binding to wrangler.toml
3. Deploy updated Worker
4. System automatically uses new shard

## Deduplication & Unique Constraints

The sharding system includes built-in support for enforcing unique constraints across all shards.

### Check for Duplicates

```bash
# Find duplicates across all shards
curl -X POST https://your-worker.workers.dev/api/v1/shards/duplicates/check \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "column": "email"}'

# Check if a value is unique
curl -X POST https://your-worker.workers.dev/api/v1/shards/unique/check \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "column": "email", "value": "test@example.com"}'
```

### Clean Up Duplicates

```bash
# Remove duplicates, keeping the first occurrence
curl -X POST https://your-worker.workers.dev/api/v1/shards/duplicates/cleanup \
  -H "Content-Type: application/json" \
  -d '{"table": "users", "column": "email", "keepStrategy": "first"}'
```

### Automatic Enforcement

By default, the sharded database service enforces unique constraints on:
- `users.email`
- `users.username`

Add more constraints in `lib/shard-dedup.ts`:

```typescript
this.addGlobalIndex({
  table: 'your_table',
  columns: ['your_column'],
  name: 'your_unique_index_name'
});
```

## Best Practices

1. **Start Simple**: Begin with 1-2 shards and add more as needed
2. **Monitor Regularly**: Check shard health dashboard weekly
3. **Plan Ahead**: Add new shards before hitting capacity limits
4. **Test Migrations**: Always test in development first
5. **Backup Data**: Keep backups before major migrations
6. **Run Dedup Checks**: Periodically check for duplicates after migrations
7. **Define Constraints Early**: Set up unique constraints before data grows

## Troubleshooting

### Common Issues

1. **"No active shard available"**
   - All shards are over 90% full
   - Add a new shard immediately

2. **"Unable to decode ID"**
   - ID was created by different instance
   - Ensure consistent deployment

3. **Slow cross-shard queries**
   - Normal for queries spanning all shards
   - Consider adding indexes or caching

### Debug Commands

```bash
# Check shard bindings
wrangler dev --local

# Test shard health locally
curl http://localhost:8787/api/v1/shards/health

# View shard stats
wrangler d1 execute DB_VOL_001_abc123 --command="SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()"
```

## Performance Considerations

- **Single shard queries**: Same performance as non-sharded
- **Cross-shard queries**: Linear with number of shards
- **ID generation**: Negligible overhead (~1ms)
- **Routing overhead**: Minimal (<1ms)

## Future Enhancements

- [ ] Automatic shard provisioning
- [ ] Read replicas for each shard
- [ ] Shard rebalancing tools
- [ ] Query optimization hints
- [ ] Shard-aware caching layer