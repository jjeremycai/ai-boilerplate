/**
 * Examples of using the Cross-Shard Query Orchestrator
 * 
 * This demonstrates various ways to query data across multiple database shards
 * with global sorting, pagination, aggregations, and joins.
 */

import { ShardedDbService } from '../services/sharded-db.service';

export async function crossShardQueryExamples(shardedDb: ShardedDbService) {
  
  // Example 1: Global Sorting and Pagination
  // Fetch products across all shards with global price sorting
  const sortedProducts = await shardedDb.findAll('products', {
    orderBy: 'price DESC',
    limit: 20,
    offset: 0,
    useGlobalSort: true // Enable cross-shard global sorting
  });
  console.log('Top 20 most expensive products across all shards:', sortedProducts);

  // Example 2: Custom Query with Global Sort
  // Find active users with custom conditions
  const activeUsers = await shardedDb.queryWithGlobalSort(
    `SELECT * FROM users WHERE status = ? AND created_at > ?`,
    ['active', '2024-01-01'],
    {
      orderBy: { column: 'created_at', direction: 'DESC' },
      limit: 50,
      offset: 0
    }
  );
  console.log('Recent active users:', activeUsers.results);
  console.log('Query metadata:', activeUsers.meta);

  // Example 3: Cross-Shard Aggregations
  // Calculate statistics across all shards
  const orderStats = await shardedDb.aggregate('orders', {
    aggregations: {
      count: true,
      sum: ['total_amount', 'item_count'],
      avg: ['total_amount'],
      min: ['created_at'],
      max: ['created_at'],
      groupBy: ['status']
    }
  });
  console.log('Order statistics:', orderStats);

  // Example 4: Cross-Shard Joins
  // Join users with their orders across shards
  const userOrders = await shardedDb.joinTables(
    'users',
    'orders',
    'users.id = orders.user_id',
    ['users.name', 'users.email', 'orders.total_amount', 'orders.created_at'],
    'users.status = ?',
    ['active']
  );
  console.log('User orders joined across shards:', userOrders.results);

  // Example 5: Distributed Transactions
  // Execute operations across multiple shards atomically
  const transactionResult = await shardedDb.executeDistributedTransaction([
    {
      query: 'INSERT INTO orders (id, user_id, total_amount) VALUES (?, ?, ?)',
      params: ['order123', 'user456', 99.99]
    },
    {
      query: 'UPDATE users SET last_order_date = ? WHERE id = ?',
      params: [new Date().toISOString(), 'user456']
    },
    {
      query: 'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
      params: ['order123', 'prod789', 2]
    }
  ]);
  
  if (transactionResult.success) {
    console.log('Distributed transaction completed successfully');
  } else {
    console.error('Transaction failed:', transactionResult.errors);
  }

  // Example 6: Streaming Large Datasets
  // Process large result sets in batches to avoid memory issues
  console.log('Streaming all products in batches...');
  for await (const batch of shardedDb.streamLargeDataset(
    'SELECT * FROM products WHERE category = ?',
    ['electronics'],
    500 // batch size
  )) {
    console.log(`Processing batch of ${batch.length} products`);
    // Process each batch
    for (const product of batch) {
      // Do something with each product
    }
  }

  // Example 7: Complex Aggregation with Multiple Tables
  // Revenue by category across all shards
  const revenueByCategory = await shardedDb.queryWithGlobalSort(
    `SELECT 
      p.category,
      COUNT(DISTINCT oi.order_id) as order_count,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.created_at >= ?
    GROUP BY p.category`,
    ['2024-01-01'],
    {
      orderBy: { column: 'total_revenue', direction: 'DESC' }
    }
  );
  console.log('Revenue by category:', revenueByCategory.results);

  // Example 8: Finding Records Across Specific Shards
  // Query only specific shards based on ID patterns
  const specificUserIds = ['usr_shard1_abc123', 'usr_shard2_def456'];
  const specificUsers = await shardedDb.findByIds('users', specificUserIds);
  console.log('Users from specific shards:', specificUsers);

  // Example 9: Global Search with Full-Text
  // Search across all shards with relevance scoring
  const searchResults = await shardedDb.queryWithGlobalSort(
    `SELECT *, 
     (CASE 
       WHEN name LIKE ? THEN 3
       WHEN description LIKE ? THEN 2
       WHEN tags LIKE ? THEN 1
       ELSE 0
     END) as relevance_score
    FROM products 
    WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
    HAVING relevance_score > 0`,
    ['%laptop%', '%laptop%', '%laptop%', '%laptop%', '%laptop%', '%laptop%'],
    {
      orderBy: { column: 'relevance_score', direction: 'DESC' },
      limit: 20
    }
  );
  console.log('Search results with relevance:', searchResults.results);

  // Example 10: Time-Based Aggregation Across Shards
  // Daily order counts for the last 30 days
  const dailyOrders = await shardedDb.queryWithGlobalSort(
    `SELECT 
      DATE(created_at) as order_date,
      COUNT(*) as order_count,
      SUM(total_amount) as daily_revenue
    FROM orders
    WHERE created_at >= date('now', '-30 days')
    GROUP BY DATE(created_at)`,
    [],
    {
      orderBy: { column: 'order_date', direction: 'DESC' }
    }
  );
  console.log('Daily order statistics:', dailyOrders.results);
}

// Performance considerations and best practices
export const crossShardBestPractices = {
  // 1. Use indexes on columns used in WHERE, ORDER BY, and JOIN conditions
  indexingStrategy: `
    CREATE INDEX idx_orders_user_id ON orders(user_id);
    CREATE INDEX idx_orders_created_at ON orders(created_at);
    CREATE INDEX idx_products_category ON products(category);
  `,

  // 2. Limit result sets when possible
  efficientQueries: {
    good: 'SELECT * FROM orders WHERE status = ? LIMIT 100',
    bad: 'SELECT * FROM orders' // Fetches all records from all shards
  },

  // 3. Use streaming for large datasets
  largeDatasetHandling: `
    // Instead of loading all at once
    const allRecords = await shardedDb.findAll('large_table');
    
    // Stream in batches
    for await (const batch of shardedDb.streamLargeDataset('SELECT * FROM large_table')) {
      processBatch(batch);
    }
  `,

  // 4. Be mindful of cross-shard joins
  joinConsiderations: {
    // In-memory joins work well for small-medium datasets
    smallDataset: 'Users (1000s) JOIN Orders (10,000s)',
    
    // For large datasets, consider denormalization or pre-aggregation
    largeDataset: 'Consider caching user data in order records'
  },

  // 5. Monitor shard distribution
  monitoring: async (shardedDb: ShardedDbService) => {
    const stats = await shardedDb.getShardStats();
    console.log('Shard distribution:', stats);
    
    // Check for uneven distribution
    const sizes = Object.values(stats).map((s: any) => s.size);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const maxDeviation = Math.max(...sizes.map(s => Math.abs(s - avgSize)));
    
    if (maxDeviation > avgSize * 0.2) {
      console.warn('Shard sizes are uneven, consider rebalancing');
    }
  }
};