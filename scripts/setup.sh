#!/bin/bash

echo "Setting up Full-Stack Cloudflare Boilerplate..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Create D1 database
echo "Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create boilerplate-db 2>&1)
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$DB_ID" ]; then
    echo "Error creating D1 database. It may already exist."
else
    echo "D1 database created with ID: $DB_ID"
    # Update wrangler.toml with database ID
    sed -i.bak "s/YOUR_DATABASE_ID/$DB_ID/g" wrangler.toml
fi

# Create KV namespace
echo "Creating KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create boilerplate-kv 2>&1)
KV_ID=$(echo "$KV_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$KV_ID" ]; then
    echo "Error creating KV namespace. It may already exist."
else
    echo "KV namespace created with ID: $KV_ID"
    # Update wrangler.toml with KV ID
    sed -i.bak "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
fi

# Clean up backup files
rm -f wrangler.toml.bak

echo ""
echo "Setup almost complete! Next steps:"
echo "1. Copy .env.example to .env and add your Clerk publishable key"
echo "2. Set Clerk secrets:"
echo "   wrangler secret put CLERK_SECRET_KEY"
echo "   wrangler secret put CLERK_PUBLISHABLE_KEY"
echo "3. Run database migrations:"
echo "   npm run db:migrate"
echo "4. Start development:"
echo "   npm run dev (frontend)"
echo "   npm run dev:worker (backend)"