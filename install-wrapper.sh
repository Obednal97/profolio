#!/bin/bash

# Profolio Installer Wrapper v2.0
# This lightweight wrapper downloads and executes the Proxmox-style installer
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Now uses new Proxmox-style installer
PROXMOX_INSTALLER_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh"
INSTALLER_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh"
TUI_INSTALLER_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/install-tui.sh"
TUI_LIB_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/lib/tui-functions.sh"
TEMP_DIR="/tmp/profolio-installer-$$"
INSTALLER_PATH="$TEMP_DIR/install.sh"
TUI_INSTALLER_PATH="$TEMP_DIR/install-tui.sh"
TUI_LIB_PATH="$TEMP_DIR/lib/tui-functions.sh"

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
mkdir -p "$TEMP_DIR/lib"

# Parse arguments
USE_TUI=false
USE_PROXMOX_STYLE=true  # Default to new Proxmox-style
for arg in "$@"; do
    case $arg in
        --tui) USE_TUI=true; USE_PROXMOX_STYLE=false ;;
        --no-tui) USE_TUI=false; USE_PROXMOX_STYLE=false ;;
        --legacy) USE_PROXMOX_STYLE=false ;;
        --proxmox) USE_PROXMOX_STYLE=true ;;
    esac
done

# Auto-detect TUI preference if not specified
if [ "$USE_PROXMOX_STYLE" = false ] && [ "$USE_TUI" = false ] && [ -z "$*" ]; then
    # Check if whiptail or dialog is available
    if command -v whiptail >/dev/null 2>&1 || command -v dialog >/dev/null 2>&1; then
        USE_TUI=true
    fi
fi

echo -e "${BLUE}🚀 Profolio Installer${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Use Proxmox-style installer if requested
if [ "$USE_PROXMOX_STYLE" = true ]; then
    echo -e "${GREEN}⬇️  Downloading Proxmox-style installer...${NC}"
    
    PROXMOX_PATH="$TEMP_DIR/profolio.sh"
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$PROXMOX_INSTALLER_URL" -o "$PROXMOX_PATH" 2>/dev/null
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$PROXMOX_PATH" "$PROXMOX_INSTALLER_URL" 2>/dev/null
    else
        echo -e "${RED}Error: Neither curl nor wget is installed${NC}"
        exit 1
    fi
    
    if [ -f "$PROXMOX_PATH" ]; then
        chmod +x "$PROXMOX_PATH"
        echo -e "${GREEN}✓ Proxmox-style installer ready${NC}"
        echo ""
        exec bash "$PROXMOX_PATH" "$@"
    else
        echo -e "${YELLOW}Proxmox-style installer not available, falling back to TUI${NC}"
        USE_TUI=true
        USE_PROXMOX_STYLE=false
    fi
fi

# Download appropriate installer
if [ "$USE_TUI" = true ] && [ "$USE_PROXMOX_STYLE" = false ]; then
    echo -e "${GREEN}⬇️  Downloading TUI installer...${NC}"
    
    # Download TUI library
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$TUI_LIB_URL" -o "$TUI_LIB_PATH" 2>/dev/null || true
        curl -fsSL "$TUI_INSTALLER_URL" -o "$TUI_INSTALLER_PATH"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$TUI_LIB_PATH" "$TUI_LIB_URL" 2>/dev/null || true
        wget -qO "$TUI_INSTALLER_PATH" "$TUI_INSTALLER_URL"
    else
        echo -e "${RED}Error: Neither curl nor wget is installed${NC}"
        exit 1
    fi
    
    if [ ! -f "$TUI_INSTALLER_PATH" ]; then
        echo -e "${YELLOW}TUI installer not available, falling back to standard installer${NC}"
        USE_TUI=false
    else
        chmod +x "$TUI_INSTALLER_PATH"
        [ -f "$TUI_LIB_PATH" ] && chmod +x "$TUI_LIB_PATH"
        echo -e "${GREEN}✓ TUI installer downloaded successfully${NC}"
        echo ""
        exec bash "$TUI_INSTALLER_PATH" "$@"
    fi
fi

# Standard installer fallback
if [ "$USE_TUI" = false ]; then
    echo -e "${GREEN}⬇️  Downloading standard installer...${NC}"
    
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$INSTALLER_URL" -o "$INSTALLER_PATH"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$INSTALLER_PATH" "$INSTALLER_URL"
    else
        echo -e "${RED}Error: Neither curl nor wget is installed${NC}"
        exit 1
    fi
    
    if [ ! -f "$INSTALLER_PATH" ]; then
        echo -e "${RED}Error: Failed to download installer${NC}"
        exit 1
    fi
    
    chmod +x "$INSTALLER_PATH"
    echo -e "${GREEN}✓ Standard installer downloaded successfully${NC}"
    echo ""
    
    exec bash "$INSTALLER_PATH" "$@"
fi