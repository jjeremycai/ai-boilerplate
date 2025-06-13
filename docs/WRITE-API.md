# Database Write API Guide

This guide explains how to write data to the database in both single and sharded modes.

## Overview

The boilerplate supports two database modes that are automatically detected:

1. **Single Database** - Traditional D1 database (default)
2. **Sharded Database** - Multiple D1 databases with automatic routing

## Write API Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Routes    │────▶│   Service    │────▶│   Database    │
│  (Hono)     │     │  (Business   │     │  (D1 or       │
│             │     │   Logic)     │     │   Sharded)    │
└─────────────┘     └──────────────┘     └───────────────┘
```

## Service Pattern

All database writes go through a service layer that:
- Validates business rules
- Handles both database modes
- Enforces unique constraints
- Manages transactions

### Basic Write Operations

```typescript
// CREATE
const newRecord = await service.create(data);

// UPDATE
const updated = await service.update(id, changes);

// DELETE
const deleted = await service.delete(id);
```

## Sharded Write API

When sharding is enabled (`DB_VOL_*` bindings exist), the `ShardedDbService` provides:

### 1. Create Operation

```typescript
const { db } = getShardContext(c);

// Simple create
const user = await db.create('users', {
  email: 'user@example.com',
  name: 'John Doe'
});
// Returns: { id: 'shard-aware-id', email: '...', name: '...', ... }

// With timestamp override
const historicalRecord = await db.create('events', eventData, {
  timestamp: Date.parse('2024-01-01')
});

// Skip unique checks (dangerous!)
const logEntry = await db.create('logs', logData, {
  skipUniqueCheck: true
});
```

**Features:**
- Automatically selects shard with available capacity
- Generates Universal IDs with embedded shard info
- Validates unique constraints across ALL shards
- Adds timestamps automatically

### 2. Update Operation

```typescript
// Update specific fields
const success = await db.update('users', userId, {
  name: 'Jane Doe',
  status: 'active'
});
// Returns: boolean

// Update with unique constraint check
await db.update('users', userId, {
  email: 'newemail@example.com' // Checked across all shards
});
```

**Features:**
- Routes to correct shard based on ID
- Validates unique constraints for changed fields
- Updates `updated_at` timestamp
- Returns success boolean

### 3. Delete Operation

```typescript
// Simple delete
const deleted = await db.delete('users', userId);
// Returns: boolean

// Cascading delete (manual)
const userPosts = await db.findAll('posts', {
  where: { user_id: userId }
});
for (const post of userPosts) {
  await db.delete('posts', post.id);
}
await db.delete('users', userId);
```

**Features:**
- Routes to correct shard
- No automatic cascading (must handle manually)
- Returns success boolean

### 4. Bulk Operations

```typescript
// Create multiple records
const users = await Promise.all([
  db.create('users', user1Data),
  db.create('users', user2Data),
  db.create('users', user3Data)
]);
// Each may go to different shards

// Update multiple records
const results = await db.queryByIds(
  ['id1', 'id2', 'id3'],
  async (db, ids) => {
    // Custom update logic per shard
  }
);
```

## Single Database Write API

For non-sharded mode, use traditional D1 patterns:

### 1. Create with SQL

```typescript
const id = crypto.randomUUID();
const result = await db.prepare(`
  INSERT INTO users (id, email, name, created_at)
  VALUES (?, ?, ?, datetime('now'))
`).bind(id, email, name).run();

if (result.meta.changes === 0) {
  throw new Error('Insert failed');
}
```

### 2. Update with SQL

```typescript
const result = await db.prepare(`
  UPDATE users 
  SET name = ?, updated_at = datetime('now')
  WHERE id = ?
`).bind(newName, userId).run();

return result.meta.changes > 0;
```

### 3. Transactions

```typescript
// Single database supports transactions
const results = await db.batch([
  db.prepare('INSERT INTO orders (id, user_id) VALUES (?, ?)').bind(orderId, userId),
  db.prepare('INSERT INTO order_items (order_id, product_id) VALUES (?, ?)').bind(orderId, productId),
  db.prepare('UPDATE inventory SET stock = stock - 1 WHERE product_id = ?').bind(productId)
]);
```

## Implementing Dual-Mode Services

### 1. Define Common Interface

```typescript
interface IUserService {
  create(data: CreateUserInput): Promise<User>;
  update(id: string, data: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  findByEmail(email: string): Promise<User | null>;
}
```

### 2. Implement Both Modes

```typescript
// Single DB implementation
class UserService implements IUserService {
  constructor(private db: D1Database) {}
  // ... SQL-based implementation
}

// Sharded implementation
class ShardedUserService implements IUserService {
  constructor(private db: ShardedDbService) {}
  // ... ShardedDbService-based implementation
}
```

### 3. Auto-Detection in Routes

```typescript
function getUserService(c: Context): IUserService {
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  
  if (hasShards) {
    const { db } = getShardContext(c);
    return new ShardedUserService(db);
  } else {
    return new UserService(c.env.DB);
  }
}

// Usage in route
userRoutes.post('/', async (c) => {
  const service = getUserService(c);
  const user = await service.create(userData);
  return c.json({ data: user });
});
```

## Unique Constraints

### Sharded Mode

Automatically enforced across ALL shards:

```typescript
// Define global constraints
dedup.addGlobalIndex({
  table: 'products',
  columns: ['sku'],
  name: 'products_sku_unique'
});

// Automatic validation on write
try {
  await db.create('products', {
    sku: 'EXISTING-SKU' // Fails if exists in ANY shard
  });
} catch (error) {
  // "Unique constraint violation: sku 'EXISTING-SKU' already exists"
}
```

### Single Database Mode

Use SQL constraints:

```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL
);
```

## Best Practices

### 1. Always Use Services

```typescript
// ❌ Bad: Direct database access in routes
routerPost('/', async (c) => {
  const db = c.env.DB;
  await db.prepare('INSERT...').run();
});

// ✅ Good: Service layer
routerPost('/', async (c) => {
  const service = getProductService(c);
  await service.create(data);
});
```

### 2. Handle Both Modes

```typescript
// ❌ Bad: Hardcoded for one mode
const service = new ProductService(c.env.DB);

// ✅ Good: Mode detection
const service = getProductService(c); // Auto-detects
```

### 3. Consistent Error Handling

```typescript
// Both modes should throw similar errors
if (emailExists) {
  throw new Error('Email already exists');
}

// Handle in routes consistently
try {
  const user = await service.create(data);
  return c.json({ data: user }, 201);
} catch (error) {
  if (error.message.includes('already exists')) {
    return c.json({ error: error.message }, 400);
  }
  throw error;
}
```

### 4. Validate Before Writing

```typescript
// Validate business rules first
if (!isValidEmail(email)) {
  throw new Error('Invalid email format');
}

if (price < 0) {
  throw new Error('Price cannot be negative');
}

// Then write to database
await service.create({ email, price });
```

## Performance Considerations

### Sharded Mode

- **Writes**: O(1) - Direct to active shard
- **Single ID reads**: O(1) - Direct to shard
- **Cross-shard queries**: O(n) - Queries all shards
- **Unique checks**: O(n) - Checks all shards

### Optimization Tips

1. **Batch by Shard**: Group operations by shard when possible
2. **Cache Shard Mappings**: ID generator caches shard locations
3. **Avoid Cross-Shard Queries**: Design to minimize full scans
4. **Use Indexes**: Add indexes on frequently queried columns

## Migration Guide

To add sharding support to existing services:

1. **Create Sharded Service**
   ```typescript
   export class ShardedProductService {
     constructor(private db: ShardedDbService) {}
     // Implement using db.create(), db.update(), etc.
   }
   ```

2. **Update Routes**
   ```typescript
   function getProductService(c) {
     // Add detection logic
   }
   ```

3. **Test Both Modes**
   - Test with `DB` binding only (single mode)
   - Test with `DB_VOL_*` bindings (sharded mode)

4. **Deploy**
   - Deploy without shard bindings first
   - Add shard bindings when ready to scale

## Examples

See `/apps/backend/src/examples/unified-write-api.ts` for a complete example implementing a product service that works in both modes.

## Summary

- **Single Mode**: Direct SQL with D1Database
- **Sharded Mode**: Abstract API with ShardedDbService
- **Auto-Detection**: Based on environment bindings
- **Consistent Interface**: Services work the same in both modes
- **Transparent Scaling**: No code changes needed to enable sharding