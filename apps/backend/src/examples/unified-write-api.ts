/**
 * Unified Write API Example
 * 
 * This example demonstrates how to create a service that works
 * seamlessly with both single database and sharded database modes.
 */

import { D1Database } from '@cloudflare/workers-types';
import { ShardedDbService } from '../services/sharded-db.service';

// Define your data types
interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

interface CreateProductInput {
  name: string;
  price: number;
  sku: string;
  stock: number;
}

// Base interface that both implementations follow
interface IProductService {
  create(input: CreateProductInput): Promise<Product>;
  update(id: string, input: Partial<CreateProductInput>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  listAll(): Promise<Product[]>;
}

// Single Database Implementation
export class ProductService implements IProductService {
  constructor(private db: D1Database) {}

  async create(input: CreateProductInput): Promise<Product> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Check SKU uniqueness
    const existing = await this.findBySku(input.sku);
    if (existing) {
      throw new Error('SKU already exists');
    }

    await this.db.prepare(`
      INSERT INTO products (id, name, price, sku, stock, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, input.name, input.price, input.sku, input.stock, now, now).run();

    return {
      id,
      ...input,
      created_at: now,
      updated_at: now
    };
  }

  async update(id: string, input: Partial<CreateProductInput>): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    // Check SKU uniqueness if updating
    if (input.sku && input.sku !== existing.sku) {
      const skuExists = await this.findBySku(input.sku);
      if (skuExists) {
        throw new Error('SKU already exists');
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    
    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.price !== undefined) {
      updates.push('price = ?');
      values.push(input.price);
    }
    if (input.sku !== undefined) {
      updates.push('sku = ?');
      values.push(input.sku);
    }
    if (input.stock !== undefined) {
      updates.push('stock = ?');
      values.push(input.stock);
    }
    
    if (updates.length === 0) return existing;

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.prepare(`
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM products WHERE id = ?')
      .bind(id)
      .run();
    return result.meta.changes > 0;
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.db.prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first<Product>();
    return result;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const result = await this.db.prepare('SELECT * FROM products WHERE sku = ?')
      .bind(sku)
      .first<Product>();
    return result;
  }

  async listAll(): Promise<Product[]> {
    const result = await this.db.prepare('SELECT * FROM products ORDER BY created_at DESC')
      .all<Product>();
    return result.results;
  }
}

// Sharded Database Implementation
export class ShardedProductService implements IProductService {
  constructor(private db: ShardedDbService) {
    // Register SKU as a unique constraint
    if (this.db['dedup']) {
      this.db['dedup'].addGlobalIndex({
        table: 'products',
        columns: ['sku'],
        name: 'products_sku_unique'
      });
    }
  }

  async create(input: CreateProductInput): Promise<Product> {
    const now = new Date().toISOString();
    
    // ShardedDbService automatically checks unique constraints
    const product = await this.db.create('products', {
      ...input,
      created_at: now,
      updated_at: now
    });

    return product as Product;
  }

  async update(id: string, input: Partial<CreateProductInput>): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    // ShardedDbService automatically checks unique constraints
    await this.db.update('products', id, input);
    
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    return this.db.delete('products', id);
  }

  async findById(id: string): Promise<Product | null> {
    return this.db.findById<Product>('products', id);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const results = await this.db.findAll<Product>('products', {
      where: { sku }
    });
    return results.length > 0 ? results[0] : null;
  }

  async listAll(): Promise<Product[]> {
    return this.db.findAll<Product>('products', {
      orderBy: 'created_at DESC'
    });
  }
}

// Usage in Routes
import { Hono } from 'hono';
import { getShardContext } from '../lib/shard-context';

export const productRoutes = new Hono();

// Factory function to get the right service
function getProductService(c: any): IProductService {
  const hasShards = Object.keys(c.env).some(key => key.startsWith('DB_VOL_'));
  
  if (hasShards) {
    const { db } = getShardContext(c);
    return new ShardedProductService(db);
  } else {
    return new ProductService(c.env.DB);
  }
}

// Routes work identically regardless of database mode
productRoutes.post('/', async (c) => {
  const input = await c.req.json<CreateProductInput>();
  const service = getProductService(c);
  
  try {
    const product = await service.create(input);
    return c.json({ data: product }, 201);
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      return c.json({ error: error.message }, 400);
    }
    throw error;
  }
});

productRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const input = await c.req.json<Partial<CreateProductInput>>();
  const service = getProductService(c);
  
  const product = await service.update(id, input);
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  return c.json({ data: product });
});

productRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const service = getProductService(c);
  
  const deleted = await service.delete(id);
  if (!deleted) {
    return c.json({ error: 'Product not found' }, 404);
  }
  
  return c.json({ success: true });
});

// Advanced: Bulk Operations
productRoutes.post('/bulk', async (c) => {
  const { products } = await c.req.json<{ products: CreateProductInput[] }>();
  const service = getProductService(c);
  
  const results = {
    created: [] as Product[],
    failed: [] as { input: CreateProductInput; error: string }[]
  };

  // Process each product
  for (const input of products) {
    try {
      const product = await service.create(input);
      results.created.push(product);
    } catch (error: any) {
      results.failed.push({ input, error: error.message });
    }
  }

  return c.json({ data: results });
});

/**
 * Key Takeaways:
 * 
 * 1. Define a common interface (IProductService) that both implementations follow
 * 2. Use a factory function to select the appropriate service
 * 3. Routes remain identical regardless of database mode
 * 4. Sharded mode automatically handles:
 *    - Shard selection for writes
 *    - Cross-shard queries for reads
 *    - Unique constraint validation
 * 5. Single database mode uses traditional SQL patterns
 * 6. Both modes throw the same errors for consistency
 */