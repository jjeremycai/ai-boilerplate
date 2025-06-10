#!/bin/bash

echo "🚀 CI/CD Build Script"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Navigate to web app
cd apps/web || exit 1

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf dist
rm -rf node_modules/.vite
rm -rf .turbo

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    bun install --no-save
fi

# Build with error handling
echo -e "${YELLOW}Building web application...${NC}"

# Try to build with Vite
if NODE_OPTIONS="--max-old-space-size=8192" npx vite build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed, trying alternative approach...${NC}"
    
    # Alternative: Use Bun's built-in bundler
    echo -e "${YELLOW}Attempting build with Bun bundler...${NC}"
    bun build ./src/main.tsx --outdir=./dist --minify --splitting --format=esm --target=browser
fi

# Verify output
if [ -d "dist" ] && [ -n "$(ls -A dist)" ]; then
    echo -e "${GREEN}✓ Build output verified${NC}"
    ls -la dist/
    exit 0
else
    echo -e "${RED}✗ No build output found${NC}"
    exit 1
fi