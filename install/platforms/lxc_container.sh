#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - LXC CONTAINER PLATFORM WRAPPER v1.0.0
# =============================================================================
# 
# LXC Container platform wrapper that redirects to Ubuntu installer
# LXC containers typically run Ubuntu/Debian, so we use the Ubuntu installer
#
# Compatible: All LXC containers (Proxmox, LXD, etc.)
# Dependencies: platforms/ubuntu.sh
# =============================================================================

# Check if this module is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced - this is correct
    if [ -n "${INSTALLER_DEBUG:-}" ]; then
        echo "[DEBUG] LXC container platform wrapper loaded"
    fi
else
    # Being executed directly
    echo "LXC Container Platform Wrapper v1.0.0"
    echo "This module should be sourced, not executed directly."
    echo "Usage: source install/platforms/lxc-container.sh"
    exit 1
fi

# Source common definitions if not already loaded
if [[ -z "${PROFOLIO_DEFINITIONS_LOADED:-}" ]]; then
    # Try to source from relative path first
    if [[ -f "$(dirname "${BASH_SOURCE[0]}")/../common/definitions.sh" ]]; then
        source "$(dirname "${BASH_SOURCE[0]}")/../common/definitions.sh"
    elif [[ -f "common/definitions.sh" ]]; then
        source "common/definitions.sh"
    else
        # Fallback: Define minimal requirements inline
        echo "[ERROR] Common definitions not found, using fallback" >&2
        RED='\033[0;31m'
        GREEN='\033[0;32m'
        YELLOW='\033[1;33m'
        BLUE='\033[0;34m'
        CYAN='\033[0;36m'
        WHITE='\033[1;37m'
        NC='\033[0m'
        
        info() { echo -e "${BLUE}[INFO]${NC} $*" >&2; }
        success() { echo -e "${GREEN}[SUCCESS]${NC} $*" >&2; }
        warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
        error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
    fi
fi

# LXC container platform handler
handle_lxc_container_platform() {
    # Minimal output for clean UI
    
    # Export color variables and functions to ensure they're available in sourced modules
    export RED GREEN YELLOW BLUE CYAN WHITE NC
    export -f info success warn error
    
    # Source the Ubuntu platform installer
    local ubuntu_installer="platforms/ubuntu.sh"
    if [[ -f "$ubuntu_installer" ]]; then
        # info "Executing Ubuntu platform installation for LXC container..."
        
        # Source and execute in the same subshell to preserve context
        if source "$ubuntu_installer" && handle_ubuntu_platform "$@"; then
            # success "LXC container installation completed successfully"
            return 0
        else
            # error "Ubuntu platform installation failed"
            return 1
        fi
    else
        error "Ubuntu platform installer not found: $ubuntu_installer"
        return 1
    fi
}

# Export the handler function
export -f handle_lxc_container_platform

# Module metadata
LXC_CONTAINER_VERSION="1.0.0"
LXC_CONTAINER_DEPENDENCIES="platforms/ubuntu.sh" 