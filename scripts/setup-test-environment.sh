#!/bin/bash

# Setup Test Environment Script
# Installs all necessary dependencies for running tests

set -e

echo "🧪 Setting up test environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

echo "📦 Installing Playwright browsers..."
pnpm exec playwright install --with-deps
echo -e "${GREEN}✓${NC} Playwright browsers installed"
echo ""

echo "🔧 Setting up Chrome for Lighthouse..."
# Check if Chrome is installed
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if [ ! -f "$CHROME_PATH" ]; then
        echo -e "${YELLOW}⚠️${NC} Google Chrome not found. Installing..."
        # Use Playwright's Chromium as fallback
        echo "export CHROME_PATH=\"$(pnpm exec playwright show chromium | grep 'executable' | awk '{print $2}')\"" >> ~/.bashrc
        echo "export CHROME_PATH=\"$(pnpm exec playwright show chromium | grep 'executable' | awk '{print $2}')\"" >> ~/.zshrc
        echo -e "${GREEN}✓${NC} Using Playwright Chromium for Lighthouse"
    else
        echo -e "${GREEN}✓${NC} Google Chrome found"
    fi
else
    # Linux
    if ! command -v google-chrome &> /dev/null; then
        echo -e "${YELLOW}⚠️${NC} Google Chrome not found. Please install it or Lighthouse will use Playwright's Chromium"
    else
        echo -e "${GREEN}✓${NC} Google Chrome found"
    fi
fi

echo ""
echo "🎯 Verifying test setup..."
echo ""

# Run a simple Playwright test to verify
echo "Testing Playwright installation..."
cat > test-verify.spec.js << 'EOF'
const { test } = require('@playwright/test');
test('verify', async ({ page }) => {
  console.log('✓ Playwright is working!');
});
EOF

if pnpm exec playwright test test-verify.spec.js --reporter=list 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Playwright tests can run"
else
    echo -e "${YELLOW}⚠️${NC} Playwright verification failed"
fi

rm -f test-verify.spec.js

echo ""
echo "📊 Test environment setup complete!"
echo ""
echo "To run tests:"
echo "  E2E Tests:         pnpm run test:e2e"
echo "  E2E with UI:       pnpm run test:e2e:ui"
echo "  Performance:       pnpm run test:performance"
echo "  Security:          pnpm run test:security"
echo ""