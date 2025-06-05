#!/bin/bash

# ===============================================
# PROFOLIO - OPTIMIZED MODULAR INSTALLER v2.0.0
# ===============================================
# Implements local caching, incremental downloads, and smart module loading
# Downloads only what's needed instead of entire repository

set -euo pipefail

# ===============================================
# CONFIGURATION
# ===============================================

readonly INSTALLER_VERSION="2.0.0"
readonly MODULE_VERSION="1.0.0"
readonly REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
readonly CACHE_DIR="/var/cache/profolio-installer"
readonly LOG_FILE="/tmp/profolio-install.log"
readonly STATE_FILE="/var/lib/profolio/installer.state"

# Color definitions
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# ===============================================
# UTILITY FUNCTIONS
# ===============================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# ===============================================
# LOCAL CACHING SYSTEM
# ===============================================

# Initialize cache directory
init_cache() {
    if [[ ! -d "$CACHE_DIR" ]]; then
        mkdir -p "$CACHE_DIR"
        log "Initialized installer cache directory: $CACHE_DIR"
    fi
    
    # Create state directory
    mkdir -p "$(dirname "$STATE_FILE")"
}

# Check if local module exists and is current version
check_local_module() {
    local module="$1"
    local cache_file="$CACHE_DIR/$module"
    
    if [[ -f "$cache_file" ]]; then
        # Check if module is current version
        if grep -q "MODULE_VERSION=\"$MODULE_VERSION\"" "$cache_file" 2>/dev/null || \
           grep -q "_VERSION=\"$MODULE_VERSION\"" "$cache_file" 2>/dev/null; then
            log "Using cached module: $module"
            return 0  # Use local
        else
            info "Module $module is outdated, will download latest"
        fi
    else
        info "Module $module not found locally, will download"
    fi
    return 1  # Download needed
}

# Download individual module
download_module() {
    local module="$1"
    local url="$REPO_URL/install/$module"
    local cache_file="$CACHE_DIR/$module"
    
    info "Downloading module: $module"
    
    # Create directory structure in cache
    mkdir -p "$(dirname "$cache_file")"
    
    if curl -fsSL "$url" -o "$cache_file"; then
        chmod +x "$cache_file" 2>/dev/null || true  # Make executable if it's a script
        success "Downloaded: $module"
        return 0
    else
        error "Failed to download module: $module"
        return 1
    fi
}

# Get module with local cache fallback
get_module() {
    local module="$1"
    
    if check_local_module "$module"; then
        echo "$CACHE_DIR/$module"
        return 0
    else
        if download_module "$module"; then
            echo "$CACHE_DIR/$module"
            return 0
        else
            return 1
        fi
    fi
}

# ===============================================
# SYSTEM DETECTION
# ===============================================

# Step 2: System detection with local cache
detect_system() {
    local detection_module="utils/platform-detection.sh"
    local detection_file
    
    log "Step 2: System detection with local cache"
    
    # Get platform detection module
    if detection_file=$(get_module "$detection_module"); then
        source "$detection_file"
        
        # Detect platform
        local platform
        platform=$(get_platform_type)
        
        # Detect installation state
        local state="first-install"
        if [[ -f "/opt/profolio/package.json" ]]; then
            state="update"
        fi
        
        log "Detected platform: $platform"
        log "Installation state: $state"
        
        # Save state for future reference
        cat > "$STATE_FILE" <<EOF
PLATFORM="$platform"
STATE="$state"
DETECTION_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
INSTALLER_VERSION="$INSTALLER_VERSION"
EOF
        
        echo "$platform:$state"
        return 0
    else
        error "Failed to get platform detection module"
        return 1
    fi
}

# ===============================================
# SMART MODULE LOADING
# ===============================================

# Step 4-5: Smart module loader with local cache
load_installer_modules() {
    local platform="$1"
    local state="$2"
    
    log "Step 4-5: Loading installer modules for platform: $platform, state: $state"
    
    # Get module loader
    local loader_module="module-loader.sh"
    local loader_file
    
    if loader_file=$(get_module "$loader_module"); then
        # Before sourcing, we need to set up the environment for selective loading
        export SELECTIVE_LOADING="true"
        export TARGET_PLATFORM="$platform"
        export INSTALLATION_STATE="$state"
        export MODULE_BASE_PATH="$CACHE_DIR"
        
        # Source the enhanced module loader
        source "$loader_file"
        
        success "Modules loaded successfully for $platform platform"
        return 0
    else
        error "Failed to get module loader"
        return 1
    fi
}

# Download only required modules for platform
download_platform_modules() {
    local platform="$1"
    local modules_needed=()
    
    # Core modules (always needed)
    modules_needed+=(
        "utils/logging.sh"
        "utils/ui.sh" 
        "utils/validation.sh"
        "utils/platform-detection.sh"
        "core/profolio-installer.sh"
    )
    
    # Platform-specific modules
    case "$platform" in
        ubuntu|debian|lxc-container)
            modules_needed+=(
                "platforms/ubuntu.sh"
            )
            ;;
        proxmox)
            modules_needed+=(
                "platforms/proxmox.sh"
            )
            ;;
        docker)
            modules_needed+=(
                "platforms/docker.sh"
            )
            ;;
        emergency)
            modules_needed+=(
                "platforms/emergency.sh"
            )
            ;;
    esac
    
    # Always include emergency module as fallback
    modules_needed+=(
        "platforms/emergency.sh"
    )
    
    # Download each required module
    log "Downloading required modules for $platform platform..."
    for module in "${modules_needed[@]}"; do
        if ! get_module "$module" >/dev/null; then
            error "Failed to download required module: $module"
            return 1
        fi
    done
    
    success "All required modules downloaded/cached"
    return 0
}

# ===============================================
# INSTALLATION STATE MANAGEMENT
# ===============================================

# Check if this is first install or update
get_installation_state() {
    if [[ -f "/opt/profolio/package.json" ]] && \
       systemctl is-active --quiet profolio-backend 2>/dev/null; then
        echo "update"
    else
        echo "first-install"
    fi
}

# Get current installed version
get_current_version() {
    if [[ -f "/opt/profolio/package.json" ]]; then
        grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 | head -1
    else
        echo "none"
    fi
}

# ===============================================
# MAIN INSTALLATION PROCESS
# ===============================================

main() {
    echo "==============================================="
    echo "🚀 PROFOLIO - OPTIMIZED MODULAR INSTALLER"
    echo "==============================================="
    echo "📦 Version: $INSTALLER_VERSION"
    echo "🔧 Local caching enabled"
    echo "⚡ Smart module loading"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Step 1: Initialize
    log "Step 1: Initializing optimized installer"
    init_cache
    
    # Check for git (minimal requirement)
    if ! command -v git >/dev/null 2>&1; then
        info "Installing git..."
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update && apt-get install -y git curl
        elif command -v yum >/dev/null 2>&1; then
            yum install -y git curl
        else
            error "Please install git and curl manually"
            exit 1
        fi
    fi
    
    # Step 2-3: System detection
    local platform_state
    if platform_state=$(detect_system); then
        local platform="${platform_state%:*}"
        local state="${platform_state#*:}"
        
        log "System: $platform, State: $state"
    else
        error "System detection failed"
        exit 1
    fi
    
    # Download required modules for this platform
    if ! download_platform_modules "$platform"; then
        error "Failed to download required modules"
        exit 1
    fi
    
    # Step 4-5: Load modules
    if ! load_installer_modules "$platform" "$state"; then
        error "Failed to load installer modules"
        exit 1
    fi
    
    # Step 6: Verify core installer is available
    if ! command -v install_profolio_application >/dev/null 2>&1; then
        error "Core installer function not available after module loading"
        exit 1
    fi
    
         # Execute platform-specific installation with emergency fallback
     log "Executing installation for $platform platform..."
     
     local installation_success=false
     
     case "$platform" in
         ubuntu|debian|lxc-container)
             if handle_ubuntu_platform "$@"; then
                 installation_success=true
             else
                 warning "Ubuntu platform installation failed, trying emergency mode..."
             fi
             ;;
         proxmox)
             if handle_proxmox_installation "$@"; then
                 installation_success=true
             else
                 warning "Proxmox installation failed, trying emergency mode..."
             fi
             ;;
         docker)
             if handle_docker_platform "$@"; then
                 installation_success=true
             else
                 warning "Docker installation failed, trying emergency mode..."
             fi
             ;;
         *)
             warning "Platform '$platform' not specifically supported"
             log "Attempting generic Ubuntu/Debian installation..."
             if handle_ubuntu_platform "$@"; then
                 installation_success=true
             else
                 warning "Generic installation failed, trying emergency mode..."
             fi
             ;;
     esac
     
     # Emergency fallback if normal installation failed
     if [[ "$installation_success" != "true" ]]; then
         warning "🚨 Normal installation failed, activating emergency mode..."
         
         # Load emergency module if not already loaded
         if ! command -v handle_emergency_installation >/dev/null 2>&1; then
             log "Loading emergency recovery module..."
             export TARGET_PLATFORM="emergency"
             export INSTALLATION_STATE="emergency"
             if ! load_installer_modules "emergency" "emergency"; then
                 error "Failed to load emergency modules"
                 exit 1
             fi
         fi
         
         # Try emergency installation
         if handle_emergency_installation "$@"; then
             warning "🎉 Emergency installation completed successfully!"
         else
             error "❌ Emergency installation also failed"
             error "Please check logs and contact support"
             exit 1
         fi
     fi
    
    # Installation completed successfully
    success "✅ Profolio installation completed successfully!"
    echo ""
    echo "==============================================="
    echo "🎉 Installation Complete!"
    echo "==============================================="
    echo ""
    echo "📍 Your Profolio instance is ready at:"
    echo "   Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    echo "   Backend:  http://$(hostname -I | awk '{print $1}'):3001"
    echo ""
    echo "🔧 Service Management:"
    echo "   Status:  systemctl status profolio-backend profolio-frontend"
    echo "   Logs:    journalctl -u profolio-backend -u profolio-frontend -f"
    echo "   Restart: systemctl restart profolio-backend profolio-frontend"
    echo ""
    echo "📦 Installer Cache: $CACHE_DIR"
    echo "🔄 State File: $STATE_FILE"
    echo ""
    echo "📚 Documentation: https://github.com/Obednal97/profolio"
    echo "🛡️ Support: https://github.com/Obednal97/profolio/discussions"
    echo ""
    
    # Update state file with completion
    cat >> "$STATE_FILE" <<EOF
INSTALLATION_COMPLETED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
INSTALLED_VERSION="$(get_current_version)"
EOF
}

# ===============================================
# HELP & VERSION INFO
# ===============================================

show_help() {
    echo "Profolio Optimized Modular Installer v$INSTALLER_VERSION"
    echo ""
    echo "Features:"
    echo "  🔧 Local module caching for faster installations"
    echo "  ⚡ Downloads only required modules (~100KB vs 50MB)"
    echo "  🔄 Smart update detection and state management"
    echo "  🎯 Platform-specific optimizations"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --version           Show installer version"
    echo "  --clear-cache       Clear local module cache"
    echo "  --status           Show installation status"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Smart installation (first-install or update)"
    echo "  $0 --clear-cache   # Clear cache and reinstall modules"
    echo "  $0 --status        # Check current installation status"
    echo ""
}

show_status() {
    echo "🔍 Profolio Installation Status"
    echo "================================="
    
    if [[ -f "$STATE_FILE" ]]; then
        echo "📄 State File: $STATE_FILE"
        cat "$STATE_FILE"
        echo ""
    else
        echo "❌ No installation state found"
    fi
    
    if [[ -d "$CACHE_DIR" ]]; then
        echo "📦 Cache Directory: $CACHE_DIR"
        echo "Cached modules: $(find "$CACHE_DIR" -name "*.sh" | wc -l)"
        echo "Cache size: $(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1)"
        echo ""
    else
        echo "❌ No cache directory found"
    fi
    
    if [[ -f "/opt/profolio/package.json" ]]; then
        echo "📋 Installed Version: $(get_current_version)"
        echo "🔧 Services:"
        systemctl is-active profolio-backend profolio-frontend 2>/dev/null | \
            sed 's/^/   /' || echo "   ❌ Services not found"
    else
        echo "❌ Profolio not installed"
    fi
}

clear_cache() {
    if [[ -d "$CACHE_DIR" ]]; then
        log "Clearing installer cache: $CACHE_DIR"
        rm -rf "$CACHE_DIR"
        success "Cache cleared successfully"
    else
        info "No cache to clear"
    fi
}

# ===============================================
# ARGUMENT HANDLING
# ===============================================

case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --version|-v)
        echo "Profolio Optimized Modular Installer v$INSTALLER_VERSION"
        exit 0
        ;;
    --status|-s)
        show_status
        exit 0
        ;;
    --clear-cache)
        clear_cache
        exit 0
        ;;
esac

# ===============================================
# SCRIPT EXECUTION
# ===============================================

# Handle script termination
trap 'error "Installation interrupted"; exit 130' INT TERM

# Execute main function with all arguments
main "$@" 