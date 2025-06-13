# Deploying Volume-Based Sharding

Follow these steps to deploy the volume-based sharding implementation to Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers and D1 access
- Wrangler CLI installed and authenticated
- Project dependencies installed

## Step 1: Create D1 Shard Databases

Create the shard databases in Cloudflare:

```bash
# Create primary shard
wrangler d1 create boilerplate-shard-001

# Optional: Create additional shards
wrangler d1 create boilerplate-shard-002
wrangler d1 create boilerplate-shard-003
```

Save the database IDs that are returned.

## Step 2: Update wrangler.toml

Update the database IDs in `apps/backend/wrangler.toml`:

```toml
# Replace YOUR_SHARD_001_ID with actual ID from step 1
[[d1_databases]]
binding = "DB_VOL_001_abc123def"
database_name = "boilerplate-shard-001"
database_id = "YOUR_ACTUAL_SHARD_001_ID"  # <-- Update this

# Repeat for additional shards if created
```

## Step 3: Initialize Database Schemas

Run the schema on each shard:

```bash
# Initialize shard 001
wrangler d1 execute boilerplate-shard-001 \
  --file=./apps/backend/src/db/schema.sql

# Repeat for additional shards
wrangler d1 execute boilerplate-shard-002 \
  --file=./apps/backend/src/db/schema.sql
```

## Step 4: Build the Application

```bash
# From project root
bun run build
```

## Step 5: Deploy to Cloudflare

```bash
# Deploy the worker
cd apps/backend
wrangler deploy

# Or use the deployment script
cd ../..
bun run deploy
```

## Step 6: Verify Deployment

Test the shard endpoints:

```bash
# Check shard health
curl https://your-worker.workers.dev/api/v1/shards/health

# Check active shard
curl https://your-worker.workers.dev/api/v1/shards/active
```

## Optional: Migrate Existing Data

If you have existing data in the non-sharded database:

```bash
# Run migration script
bun run migrate-to-shards
```

## Monitoring

The system includes automated monitoring that runs every 2 hours. You can also manually check shard health at any time via the API endpoints.

## Troubleshooting

### "Sharding not enabled" error
- Ensure DB_VOL_* bindings exist in wrangler.toml
- Verify the worker was deployed with the updated configuration

### "No active shard available" error
- All shards are over 90% full
- Add a new shard immediately following steps 1-3

### Database not found errors
- Verify database IDs are correct in wrangler.toml
- Ensure databases were created in the same Cloudflare account

## Next Steps

1. Monitor shard usage regularly
2. Add new shards before reaching 80% capacity
3. Set up alerts for critical shard conditions
4. Consider automating shard provisioning