#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER DEBUG SCRIPT
# =============================================================================
# Comprehensive debugging and testing script for installer issues
# Use this to diagnose problems with the Profolio installer
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test URLs
REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
INSTALLER_URL="$REPO_URL/install.sh"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               🔧 PROFOLIO INSTALLER DEBUGGER                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 1. System Information
log "Collecting system information..."
echo "Operating System: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'=' -f2 | tr -d '\"')"
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Shell: $SHELL"
echo "User: $(whoami)"
echo "Working Directory: $(pwd)"
echo ""

# 2. Check if running in container
log "Detecting container environment..."
if [ -f "/.dockerenv" ]; then
    success "Docker container detected"
elif [ -f "/proc/1/environ" ] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
    success "LXC container detected"
elif [ -d "/proc/vz" ] && [ ! -d "/proc/bc" ]; then
    success "OpenVZ/LXC container detected"
else
    log "No container environment detected (bare metal/VM)"
fi
echo ""

# 3. Check network connectivity
log "Testing network connectivity..."
if curl -fsSL --connect-timeout 5 https://github.com > /dev/null 2>&1; then
    success "GitHub connectivity: OK"
else
    error "GitHub connectivity: FAILED"
fi

if curl -fsSL --connect-timeout 5 "$REPO_URL/README.md" > /dev/null 2>&1; then
    success "Profolio repository connectivity: OK"
else
    error "Profolio repository connectivity: FAILED"
fi
echo ""

# 4. Test installer download
log "Testing installer download..."
TEMP_INSTALLER="/tmp/profolio-test-installer.sh"
if curl -fsSL "$INSTALLER_URL" -o "$TEMP_INSTALLER" 2>/dev/null; then
    success "Installer download: OK ($(wc -l < "$TEMP_INSTALLER") lines)"
    
    # Check installer version
    if grep -q "INSTALLER_VERSION=" "$TEMP_INSTALLER"; then
        local version=$(grep "INSTALLER_VERSION=" "$TEMP_INSTALLER" | head -1 | cut -d'=' -f2 | tr -d '"')
        log "Installer version: $version"
    fi
else
    error "Installer download: FAILED"
fi
echo ""

# 5. Test module downloads
log "Testing module downloads..."
TEMP_DIR="/tmp/profolio-debug-$$"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

modules=(
    "platforms/ubuntu.sh"
    "platforms/lxc-container.sh"
    "utils/logging.sh"
    "utils/platform-detection.sh"
)

for module in "${modules[@]}"; do
    if curl -fsSL "$REPO_URL/install/$module" -o "$module" 2>/dev/null; then
        success "Downloaded: $module ($(wc -l < "$module") lines)"
        
        # Create directory structure
        mkdir -p "$(dirname "$module")"
        mv "$module" "$module"
    else
        error "Failed to download: $module"
    fi
done
echo ""

# 6. Test platform detection
log "Testing platform detection..."
if [ -f "utils/platform-detection.sh" ]; then
    source "utils/platform-detection.sh" 2>/dev/null || true
    
    if command -v get_platform_type >/dev/null 2>&1; then
        local platform=$(get_platform_type)
        success "Platform detected: $platform"
        
        # Show platform info
        if command -v get_platform_info >/dev/null 2>&1; then
            get_platform_info
        fi
    else
        error "Platform detection function not available"
    fi
else
    error "Platform detection module not available"
fi
echo ""

# 7. Test LXC container wrapper
log "Testing LXC container wrapper..."
if [ -f "platforms/lxc-container.sh" ]; then
    # Test if it has the necessary functions
    if grep -q "handle_lxc-container_platform" "platforms/lxc-container.sh"; then
        success "LXC handler function found"
    else
        error "LXC handler function missing"
    fi
    
    # Test if it has color definitions
    if grep -q "WHITE=" "platforms/lxc-container.sh"; then
        success "Color definitions found in LXC wrapper"
    else
        warning "Color definitions missing in LXC wrapper"
    fi
    
    # Test if it has logging functions
    if grep -q "info()" "platforms/lxc-container.sh"; then
        success "Logging functions found in LXC wrapper"
    else
        warning "Logging functions missing in LXC wrapper"
    fi
else
    error "LXC container wrapper not available"
fi
echo ""

# 8. Test Ubuntu platform module
log "Testing Ubuntu platform module..."
if [ -f "platforms/ubuntu.sh" ]; then
    # Test if it has the necessary functions
    if grep -q "handle_ubuntu_platform" "platforms/ubuntu.sh"; then
        success "Ubuntu handler function found"
    else
        error "Ubuntu handler function missing"
    fi
    
    # Test if it has color definitions
    if grep -q "WHITE=" "platforms/ubuntu.sh"; then
        success "Color definitions found in Ubuntu platform"
    else
        warning "Color definitions missing in Ubuntu platform"
    fi
    
    # Test if it has logging functions
    if grep -q "info()" "platforms/ubuntu.sh"; then
        success "Logging functions found in Ubuntu platform"
    else
        warning "Logging functions missing in Ubuntu platform"
    fi
    
    # Check for the specific line that was causing issues
    local line_145=$(sed -n '145p' "platforms/ubuntu.sh" 2>/dev/null || echo "")
    if [[ "$line_145" == *"WHITE"* ]]; then
        log "Line 145 in Ubuntu platform: $line_145"
    fi
else
    error "Ubuntu platform module not available"
fi
echo ""

# 9. Simulate LXC container installation
log "Simulating LXC container installation process..."
if [[ -f "platforms/lxc-container.sh" && -f "platforms/ubuntu.sh" ]]; then
    log "Sourcing LXC container wrapper..."
    
    # Try to source the LXC wrapper
    if source "platforms/lxc-container.sh" 2>/dev/null; then
        success "LXC wrapper sourced successfully"
        
        # Check if functions are available
        if command -v handle_lxc-container_platform >/dev/null 2>&1; then
            success "LXC handler function available"
        else
            error "LXC handler function not available after sourcing"
        fi
        
        # Check if color variables are available
        if [[ -n "${WHITE:-}" ]]; then
            success "WHITE color variable available: $WHITE"
        else
            error "WHITE color variable not available"
        fi
        
        # Check if logging functions are available
        if command -v info >/dev/null 2>&1; then
            success "info() function available"
        else
            error "info() function not available"
        fi
    else
        error "Failed to source LXC wrapper"
    fi
else
    error "Required modules not available for simulation"
fi

# 10. Clean up
cd /
rm -rf "$TEMP_DIR" 2>/dev/null || true
rm -f "$TEMP_INSTALLER" 2>/dev/null || true

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🔍 DEBUG COMPLETE                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "If you're still experiencing issues, please share this debug output"
echo "when reporting the problem on GitHub Issues."
echo ""
echo "🚀 To try the installer again with maximum cache busting:"
echo ""
echo 'sudo rm -f /tmp/profolio-install-*'
echo 'sudo bash -c "$(curl -H '"'"'Cache-Control: no-cache'"'"' -H '"'"'Pragma: no-cache'"'"' -fsSL '"'"'https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh?nocache='"'"'$(date +%s%N))"'
echo "" 