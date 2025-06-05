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

# Define color variables if not already defined
if [[ -z "${RED:-}" ]]; then
    readonly RED='\033[0;31m'
    readonly GREEN='\033[0;32m'
    readonly YELLOW='\033[1;33m'
    readonly BLUE='\033[0;34m'
    readonly CYAN='\033[0;36m'
    readonly WHITE='\033[1;37m'
    readonly NC='\033[0m'
fi

# LXC container platform handler
handle_lxc-container_platform() {
    info "🐧 LXC Container detected - using Ubuntu installer"
    
    # Source the Ubuntu platform installer
    local ubuntu_installer="platforms/ubuntu.sh"
    if [[ -f "$ubuntu_installer" ]]; then
        source "$ubuntu_installer"
        
        # Call the Ubuntu platform handler
        if command -v handle_ubuntu_platform >/dev/null 2>&1; then
            info "Executing Ubuntu platform installation for LXC container..."
            handle_ubuntu_platform "$@"
        else
            error "Ubuntu platform handler not available after sourcing"
            return 1
        fi
    else
        error "Ubuntu platform installer not found: $ubuntu_installer"
        return 1
    fi
}

# Export the handler function
export -f handle_lxc-container_platform

# Module metadata
LXC_CONTAINER_VERSION="1.0.0"
LXC_CONTAINER_DEPENDENCIES="platforms/ubuntu.sh" 