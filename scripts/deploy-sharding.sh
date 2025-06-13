#!/bin/bash

echo "🚀 Deploying Volume-Based Sharding to Cloudflare Workers"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI not found${NC}"
    echo "Please install: npm install -g wrangler"
    exit 1
fi

echo -e "${YELLOW}=== Step 1: Create D1 Shard Databases ===${NC}"
echo ""

# Check if databases already exist
echo "Checking existing D1 databases..."
wrangler d1 list

echo ""
read -p "Do you need to create new shard databases? (y/N): " CREATE_DBS
if [[ $CREATE_DBS =~ ^[Yy]$ ]]; then
    echo ""
    echo "Creating shard databases..."
    
    # Create primary shard
    echo -e "${BLUE}Creating boilerplate-shard-001...${NC}"
    wrangler d1 create boilerplate-shard-001
    check_status "Shard 001 created"
    
    # Optional: Create additional shards
    read -p "Create additional shard (002)? (y/N): " CREATE_002
    if [[ $CREATE_002 =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Creating boilerplate-shard-002...${NC}"
        wrangler d1 create boilerplate-shard-002
        check_status "Shard 002 created"
    fi
fi

echo ""
echo -e "${YELLOW}=== Step 2: Update Database IDs ===${NC}"
echo ""
echo "Please update the database IDs in wrangler.toml with the IDs shown above."
echo "Look for lines with 'YOUR_SHARD_XXX_ID' and replace them."
echo ""
read -p "Press Enter when you've updated wrangler.toml..."

echo ""
echo -e "${YELLOW}=== Step 3: Initialize Shard Schemas ===${NC}"
echo ""

# Get schema file
SCHEMA_FILE="apps/backend/src/db/schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Error: Schema file not found at $SCHEMA_FILE${NC}"
    exit 1
fi

# Initialize shards
read -p "Initialize shard databases with schema? (y/N): " INIT_SHARDS
if [[ $INIT_SHARDS =~ ^[Yy]$ ]]; then
    echo ""
    
    # Read database names from wrangler.toml
    echo "Available shard databases:"
    grep -E "database_name.*shard" apps/backend/wrangler.toml | awk -F'"' '{print $2}'
    
    echo ""
    read -p "Enter shard database name (e.g., boilerplate-shard-001): " SHARD_NAME
    
    echo -e "${BLUE}Initializing $SHARD_NAME...${NC}"
    wrangler d1 execute "$SHARD_NAME" --file="$SCHEMA_FILE"
    check_status "Schema applied to $SHARD_NAME"
    
    # Additional shards
    read -p "Initialize another shard? (y/N): " INIT_MORE
    while [[ $INIT_MORE =~ ^[Yy]$ ]]; do
        read -p "Enter shard database name: " SHARD_NAME
        echo -e "${BLUE}Initializing $SHARD_NAME...${NC}"
        wrangler d1 execute "$SHARD_NAME" --file="$SCHEMA_FILE"
        check_status "Schema applied to $SHARD_NAME"
        read -p "Initialize another shard? (y/N): " INIT_MORE
    done
fi

echo ""
echo -e "${YELLOW}=== Step 4: Build Application ===${NC}"
echo ""

./scripts/build.sh
check_status "Build completed"

echo ""
echo -e "${YELLOW}=== Step 5: Deploy Worker ===${NC}"
echo ""

cd apps/backend

# Deploy with sharding support
echo -e "${BLUE}Deploying worker with sharding support...${NC}"
if [ -f "wrangler.deploy.toml" ]; then
    wrangler deploy --config wrangler.deploy.toml
else
    wrangler deploy
fi
check_status "Worker deployed"

cd ../..

echo ""
echo -e "${GREEN}=== Sharding Deployment Complete! ===${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Test shard health endpoint:"
echo "   curl https://your-worker.workers.dev/api/v1/shards/health"
echo ""
echo "2. Verify active shard:"
echo "   curl https://your-worker.workers.dev/api/v1/shards/active"
echo ""
echo "3. If migrating existing data, run:"
echo "   npm run migrate-to-shards"
echo ""
echo "4. Monitor shard usage regularly"
echo ""
echo -e "${BLUE}Tip:${NC} The system will automatically use sharding if DB_VOL_* bindings are found."
echo "     Your existing code will continue to work without modification!"
echo ""