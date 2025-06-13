# Database Write Patterns

This guide explains how to write data in both sharded and non-sharded modes.

## Overview

The application supports two database modes:
1. **Single Database Mode** - Uses a single D1 database (default)
2. **Sharded Mode** - Distributes data across multiple D1 databases

## Detecting Sharding Mode

Services automatically detect sharding based on environment bindings:

```typescript
// In route handlers
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

## Write API Patterns

### 1. Sharded Database Writes

When sharding is enabled, use `ShardedDbService`:

```typescript
import { getShardContext } from '../lib/shard-context';

// In your route handler
const { db } = getShardContext(c);

// CREATE - Automatically selects shard with available space
const newUser = await db.create('users', {
  email: 'user@example.com',
  name: 'John Doe',
  created_at: new Date().toISOString()
});
// Returns: { id: 'shard-aware-id', ...data }

// UPDATE - Routes to correct shard based on ID
const updated = await db.update('users', userId, {
  name: 'Jane Doe',
  updated_at: new Date().toISOString()
});
// Returns: boolean

// DELETE - Routes to correct shard
const deleted = await db.delete('users', userId);
// Returns: boolean
```

### 2. Single Database Writes

For non-sharded mode, use direct D1 database:

```typescript
// CREATE
const id = crypto.randomUUID();
await db.prepare(`
  INSERT INTO users (id, email, name, created_at)
  VALUES (?, ?, ?, datetime('now'))
`).bind(id, email, name).run();

// UPDATE
await db.prepare(`
  UPDATE users 
  SET name = ?, updated_at = datetime('now')
  WHERE id = ?
`).bind(name, id).run();

// DELETE
await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
```

## Creating a Dual-Mode Service

Here's a template for services that support both modes:

```typescript
// services/example.service.ts
export class ExampleService {
  constructor(private db: D1Database) {}
  
  async create(data: CreateExampleInput) {
    const id = crypto.randomUUID();
    // Direct SQL implementation
  }
}

// services/sharded-example.service.ts
export class ShardedExampleService {
  constructor(private db: ShardedDbService) {}
  
  async create(data: CreateExampleInput) {
    return this.db.create('examples', data);
  }
}

// routes/examples.ts
function getExampleService(c: any) {
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  
  if (hasShards) {
    const { db } = getShardContext(c);
    return new ShardedExampleService(db);
  } else {
    return new ExampleService(c.env.DB);
  }
}
```

## Unique Constraints

In sharded mode, unique constraints are enforced across all shards:

```typescript
// This will check ALL shards before inserting
try {
  await db.create('users', {
    email: 'existing@example.com', // Fails if exists in ANY shard
    username: 'existinguser'       // Also checked across shards
  });
} catch (error) {
  // "Unique constraint violation: email 'existing@example.com' already exists"
}

// Skip unique checks for performance (use with caution!)
await db.create('logs', logData, { skipUniqueCheck: true });
```

## Bulk Operations

### Sharded Mode
```typescript
// Insert multiple records (each may go to different shards)
const records = await Promise.all(
  items.map(item => db.create('items', item))
);

// Query across all shards
const allUsers = await db.findAll('users', {
  where: { status: 'active' },
  orderBy: 'created_at DESC'
});
```

### Single Database Mode
```typescript
// Bulk insert with transaction
await db.batch([
  db.prepare('INSERT INTO items (id, name) VALUES (?, ?)').bind(id1, name1),
  db.prepare('INSERT INTO items (id, name) VALUES (?, ?)').bind(id2, name2)
]);
```

## Best Practices

1. **Always use the service pattern** - Don't access databases directly in routes
2. **Check sharding mode once** - Cache the service instance
3. **Handle both modes** - Your service should work with and without sharding
4. **Validate before writing** - Check business rules before database operations
5. **Use transactions carefully** - Sharded mode only supports transactions within a single shard

## Common Patterns

### Upsert Pattern
```typescript
// Sharded mode (manual check)
const existing = await db.findAll('users', { 
  where: { email: 'user@example.com' } 
});
if (existing.length === 0) {
  await db.create('users', userData);
} else {
  await db.update('users', existing[0].id, userData);
}

// Single database mode
await db.prepare(`
  INSERT OR REPLACE INTO users (id, email, name)
  VALUES (?, ?, ?)
`).bind(id, email, name).run();
```

### Cascading Deletes
```typescript
// Sharded mode - must handle manually
const tasks = await db.findAll('tasks', { 
  where: { project_id: projectId } 
});
for (const task of tasks) {
  await db.delete('tasks', task.id);
}
await db.delete('projects', projectId);

// Single database mode - use foreign key constraints
await db.prepare('DELETE FROM projects WHERE id = ?').bind(projectId).run();
// Tasks deleted automatically via ON DELETE CASCADE
```

## Migration Path

To convert existing services to support sharding:

1. Create a sharded version of your service
2. Implement the service detection pattern in routes
3. Test both modes thoroughly
4. Deploy with sharding disabled (seamless transition)
5. Enable sharding when ready to scale

Remember: The application automatically detects and uses the appropriate mode based on your deployment configuration!