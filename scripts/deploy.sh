#!/bin/bash

echo "🚀 Deploying to Cloudflare Workers"
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

# Check for required environment variables
echo -e "${YELLOW}Checking environment...${NC}"

if [ -z "$CLOUDFLARE_API_TOKEN" ] && [ ! -f "$HOME/.wrangler/config/default.toml" ]; then
    echo -e "${RED}Error: CLOUDFLARE_API_TOKEN not set and no wrangler auth found${NC}"
    echo "Please run: wrangler login"
    exit 1
fi

# Run the build process
echo ""
echo -e "${YELLOW}Building application...${NC}"
./scripts/build.sh
check_status "Build completed"

# Deploy to Cloudflare
echo ""
echo -e "${YELLOW}Deploying to Cloudflare Workers...${NC}"

cd apps/backend

# Use production config if it exists
if [ -f "wrangler.deploy.toml" ]; then
    echo -e "${BLUE}Using production configuration${NC}"
    wrangler deploy --config wrangler.deploy.toml
else
    wrangler deploy
fi

check_status "Backend deployed"

cd ../..

# Show deployment info
echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo -e "Your application is now live on Cloudflare's edge network!"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit your worker URL to see the app"
echo "2. Check the Cloudflare dashboard for analytics"
echo "3. Monitor logs with: wrangler tail"
echo ""

# Optional: Open the worker URL
if command -v open &> /dev/null; then
    echo -e "${BLUE}Opening your worker in browser...${NC}"
    # Extract worker URL from wrangler output or config
    # This is a placeholder - actual implementation would parse the URL
    # open "https://your-worker.workers.dev"
fi