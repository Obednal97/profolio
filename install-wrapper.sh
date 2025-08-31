#!/bin/bash

# Profolio Installer Wrapper
# This lightweight wrapper downloads and executes the main installer
# Solves the "Argument list too long" issue while maintaining interactivity

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALLER_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh"
TEMP_DIR="/tmp/profolio-installer-$$"
INSTALLER_PATH="$TEMP_DIR/install.sh"

# Cleanup function
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Set up trap to ensure cleanup on exit
trap cleanup EXIT

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Download installer
echo -e "${BLUE}🚀 Profolio Installer${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}⬇️  Downloading installer...${NC}"

if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$INSTALLER_URL" -o "$INSTALLER_PATH"
elif command -v wget >/dev/null 2>&1; then
    wget -qO "$INSTALLER_PATH" "$INSTALLER_URL"
else
    echo -e "${RED}Error: Neither curl nor wget is installed${NC}"
    exit 1
fi

# Verify download
if [ ! -f "$INSTALLER_PATH" ]; then
    echo -e "${RED}Error: Failed to download installer${NC}"
    exit 1
fi

# Make executable
chmod +x "$INSTALLER_PATH"

echo -e "${GREEN}✓ Installer downloaded successfully${NC}"
echo ""

# Pass all arguments to the installer
exec bash "$INSTALLER_PATH" "$@"