#!/bin/bash

# Test script to verify TUI configuration passing

# Set test environment variables (simulating TUI)
export PROFOLIO_TUI_CONFIG="true"
export PROFOLIO_VERSION="v1.14.14"
export PROFOLIO_DEPLOYMENT_MODE="self-hosted"
export PROFOLIO_AUTH_MODE="local"
export PROFOLIO_INSTALL_PATH="/opt/profolio"
export PROFOLIO_PRESERVE_ENV="yes"
export PROFOLIO_ENABLE_ROLLBACK="yes"
export PROFOLIO_OPTIMIZATION="safe"
export PROFOLIO_FIREBASE_CONFIG=""
export PROFOLIO_STRIPE_CONFIG=""
export PROFOLIO_FEATURES="analytics backup"

echo "Testing TUI configuration passing..."
echo "======================================"
echo "Environment variables set:"
echo "  PROFOLIO_VERSION=$PROFOLIO_VERSION"
echo "  PROFOLIO_DEPLOYMENT_MODE=$PROFOLIO_DEPLOYMENT_MODE"
echo "  PROFOLIO_AUTH_MODE=$PROFOLIO_AUTH_MODE"
echo "  PROFOLIO_OPTIMIZATION=$PROFOLIO_OPTIMIZATION"
echo ""

# Test command line parsing (dry run)
echo "Testing if installer recognizes --tui-config flag..."
if grep -q "\-\-tui-config)" install.sh; then
    echo "✓ --tui-config flag is handled"
else
    echo "✗ --tui-config flag not found"
fi

echo ""
echo "Testing if installer reads environment variables..."
if grep -q "PROFOLIO_VERSION" install.sh && grep -q "PROFOLIO_DEPLOYMENT_MODE" install.sh; then
    echo "✓ Environment variables are read"
else
    echo "✗ Environment variables not properly read"
fi

echo ""
echo "Testing TUI installer exports..."
if grep -q "export PROFOLIO_TUI_CONFIG" install-tui.sh; then
    echo "✓ TUI installer exports configuration"
else
    echo "✗ TUI installer doesn't export configuration"
fi

echo ""
echo "All tests completed!"