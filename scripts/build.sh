#!/bin/bash

echo "🚀 Building Full-Stack Application with Bun + Vite + Hono"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# 1. Install dependencies if needed
if [ ! -f "bun.lockb" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    bun install
    check_status "Dependencies installed"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# 2. Run tests
echo ""
echo -e "${YELLOW}Running tests...${NC}"
bun test
check_status "All tests passed"

# 3. Type check
echo ""
echo -e "${YELLOW}Running type check...${NC}"
bun run typecheck
check_status "Type check passed"

# 4. Build web app
echo ""
echo -e "${YELLOW}Building web application...${NC}"
cd apps/web
bun run build
check_status "Web app built"
cd ../..

# 5. Prepare backend for deployment
echo ""
echo -e "${YELLOW}Preparing backend for deployment...${NC}"
cd apps/backend

# Create a deployment package
if [ -d "dist" ]; then
    rm -rf dist
fi
mkdir -p dist

# Copy necessary files for deployment
cp -r src/* dist/
cp wrangler.toml dist/
cp package.json dist/

check_status "Backend prepared"
cd ../..

# 6. Build summary
echo ""
echo -e "${GREEN}=== Build Complete ===${NC}"
echo -e "Web app built to: ${YELLOW}apps/web/dist${NC}"
echo -e "Backend ready in: ${YELLOW}apps/backend/dist${NC}"
echo ""
echo -e "To deploy:"
echo -e "  ${YELLOW}bun run deploy${NC}"
echo ""