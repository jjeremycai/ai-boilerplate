#!/bin/bash

echo "🔍 Verifying Build Configuration"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check for required files
echo "Checking required files..."

files=(
    "package.json"
    "bun.lockb"
    "scripts/build.sh"
    "apps/web/vite.config.ts"
    "apps/backend/wrangler.toml"
)

all_good=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file missing${NC}"
        all_good=false
    fi
done

echo ""
echo "Checking package scripts..."

# Check if key scripts exist
if command -v jq &> /dev/null; then
    scripts=("build" "test" "typecheck" "deploy")
    
    for script in "${scripts[@]}"; do
        if jq -e ".scripts.\"$script\"" package.json > /dev/null 2>&1; then
            echo -e "${GREEN}✓ '$script' script defined${NC}"
        else
            echo -e "${YELLOW}⚠ '$script' script not found${NC}"
        fi
    done
else
    echo -e "${YELLOW}⚠ jq not installed, skipping script checks${NC}"
fi

echo ""
if $all_good; then
    echo -e "${GREEN}✅ Build configuration looks good!${NC}"
else
    echo -e "${RED}❌ Some issues found, please fix before proceeding${NC}"
    exit 1
fi