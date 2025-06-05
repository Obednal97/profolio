#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER v1.12.1
# =============================================================================
# Modular installer with centralized definitions for reliable execution
# Uses common/definitions.sh to prevent variable scoping issues
# =============================================================================

set -euo pipefail

# Configuration (these will be loaded from common/definitions.sh)
INSTALLER_VERSION="1.12.1"
REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
readonly TEMP_DIR="/tmp/profolio-installer-$$"
readonly LOG_FILE="/tmp/profolio-install.log"

# Temporary colors (will be replaced by common/definitions.sh)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Platform detection
detect_platform() {
    # Check for LXC container first
    if [[ -f "/proc/1/environ" ]] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        echo "lxc-container"
    elif [[ -d "/proc/vz" ]] && [[ ! -d "/proc/bc" ]]; then
        echo "lxc-container"
    elif [[ -f "/etc/pve/version" ]]; then
        echo "proxmox"
    elif [[ -f "/.dockerenv" ]]; then
        echo "docker"
    elif command -v lsb_release >/dev/null 2>&1; then
        local distro=$(lsb_release -is 2>/dev/null | tr '[:upper:]' '[:lower:]')
        case "$distro" in
            ubuntu|debian) echo "$distro" ;;
            *) echo "ubuntu" ;;  # Default to ubuntu for unknown distros
        esac
    elif [[ -f "/etc/os-release" ]]; then
        local distro=$(grep -E '^ID=' /etc/os-release | cut -d'=' -f2 | tr -d '"' | tr '[:upper:]' '[:lower:]')
        case "$distro" in
            ubuntu|debian) echo "$distro" ;;
            *) echo "ubuntu" ;;  # Default to ubuntu
        esac
    else
        echo "ubuntu"  # Default fallback
    fi
}

# Download all modules
download_all_modules() {
    log "Downloading all Profolio installer modules..."
    
    # Create temp directory structure
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # All modules (including the new common definitions)
    local modules=(
        # Common definitions (MUST BE FIRST!)
        "common/definitions.sh"
        
        # Core modules
        "module-loader.sh"
        "bootstrap.sh"
        "core/profolio-installer.sh"
        "core/version-control.sh"
        "core/rollback.sh"
        
        # Utility modules
        "utils/logging.sh"
        "utils/ui.sh"
        "utils/validation.sh"
        "utils/platform-detection.sh"
        
        # Platform modules
        "platforms/ubuntu.sh"
        "platforms/proxmox.sh"
        "platforms/docker.sh"
        "platforms/emergency.sh"
        "platforms/lxc-container.sh"
        
        # Feature modules
        "features/optimization.sh"
        "features/ssh-hardening.sh"
        "features/configuration-wizard.sh"
        "features/backup-management.sh"
        "features/installation-reporting.sh"
    )
    
    for module in "${modules[@]}"; do
        local module_dir=$(dirname "$module")
        if [[ "$module_dir" != "." ]]; then
            mkdir -p "$module_dir"
        fi
        
        info "Downloading $module..."
        if curl -fsSL "$REPO_URL/install/$module" -o "$module" 2>/dev/null; then
            # Make executable if it's a shell script
            if [[ "$module" == *.sh ]]; then
                chmod +x "$module"
            fi
        else
            warning "Failed to download $module (continuing anyway)"
        fi
    done
    
    success "All modules downloaded ($(find . -name "*.sh" | wc -l) files)"
    return 0
}

# Load essential functions without complex validation
load_essential_functions() {
    # CRITICAL: Source common definitions FIRST!
    if [[ -f "common/definitions.sh" ]]; then
        info "Loading common definitions..."
        source "common/definitions.sh" || {
            error "Failed to load common definitions"
            return 1
        }
    fi
    
    # Source utility modules first
    for util in utils/*.sh; do
        if [[ -f "$util" ]]; then
            source "$util" 2>/dev/null || true
        fi
    done
    
    # Source core installer
    if [[ -f "core/profolio-installer.sh" ]]; then
        source "core/profolio-installer.sh" 2>/dev/null || true
    fi
    
    # Source additional core modules
    for core in core/*.sh; do
        if [[ -f "$core" && "$core" != "core/profolio-installer.sh" ]]; then
            source "$core" 2>/dev/null || true
        fi
    done
    
    # Source feature modules
    for feature in features/*.sh; do
        if [[ -f "$feature" ]]; then
            source "$feature" 2>/dev/null || true
        fi
    done
}

# Execute platform installation
install_for_platform() {
    local detected_platform="$1"
    shift  # Remove platform from arguments
    
    log "Starting installation for platform: $detected_platform"
    
    # Try direct platform file first
    local platform_file="platforms/${detected_platform}.sh"
    if [[ -f "$platform_file" ]]; then
        log "Using direct platform installer: $platform_file"
        source "$platform_file"
        
        # Call the platform handler function
        local handler_function="handle_${detected_platform}_platform"
        if command -v "$handler_function" >/dev/null 2>&1; then
            log "Executing $handler_function..."
            if "$handler_function" "$@"; then
                success "Platform installation completed successfully"
                return 0
            else
                warning "Platform installation failed"
                return 1
            fi
        else
            error "Platform handler function $handler_function not available"
            return 1
        fi
    else
        # Fallback mapping for older platforms
        local fallback_platform="ubuntu"
        case "$detected_platform" in
            generic-linux|debian) fallback_platform="ubuntu" ;;
            docker-container) fallback_platform="docker" ;;
            proxmox-host) fallback_platform="proxmox" ;;
        esac
        
        log "Direct platform file not found, using fallback: platforms/${fallback_platform}.sh"
        
        local fallback_file="platforms/${fallback_platform}.sh"
        if [[ -f "$fallback_file" ]]; then
            source "$fallback_file"
            
            local fallback_function="handle_${fallback_platform}_platform"
            if command -v "$fallback_function" >/dev/null 2>&1; then
                log "Executing fallback $fallback_function..."
                if "$fallback_function" "$@"; then
                    success "Fallback platform installation completed successfully"
                    return 0
                else
                    warning "Fallback platform installation failed"
                    return 1
                fi
            else
                error "Fallback platform handler $fallback_function not available"
                return 1
            fi
        else
            error "Neither direct platform file nor fallback found"
            return 1
        fi
    fi
}

# Emergency installation mode
install_emergency_mode() {
    warning "🚨 Activating emergency installation mode"
    
    if [[ -f "platforms/emergency.sh" ]]; then
        source "platforms/emergency.sh"
        
        if command -v handle_emergency_installation >/dev/null 2>&1; then
            if handle_emergency_installation "$@"; then
                success "🎉 Emergency installation completed successfully!"
                return 0
            else
                error "❌ Emergency installation also failed"
                return 1
            fi
        else
            error "Emergency installation function not available"
            return 1
        fi
    else
        error "Emergency installer not available"
        return 1
    fi
}

# Show help when installation fails
show_failure_help() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  INSTALLATION FAILED                      ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📞 Get Support:"
    echo "   • GitHub Issues: https://github.com/Obednal97/profolio/issues"
    echo "   • Include log file: $LOG_FILE"
    echo ""
    echo "🔧 Manual Installation:"
    echo "   • Clone repo: git clone https://github.com/Obednal97/profolio.git"
    echo "   • See documentation: docs/INSTALLATION.md"
    echo ""
}

# Main installer function
main() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 🚀 PROFOLIO INSTALLER v$INSTALLER_VERSION                 ║"
    echo "║              Self-Hosted Portfolio Management                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        echo ""
        echo "Please run with sudo:"
        echo "  sudo bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)\""
        exit 1
    fi
    
    # Install minimal dependencies
    if ! command -v curl >/dev/null 2>&1; then
        info "Installing curl..."
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update && apt-get install -y curl
        elif command -v yum >/dev/null 2>&1; then
            yum install -y curl
        else
            error "Please install curl manually"
            exit 1
        fi
    fi
    
    # Download all modules
    if ! download_all_modules; then
        error "Failed to download installer modules"
        exit 1
    fi
    
    # Load essential functions
    log "Loading installer functions..."
    load_essential_functions
    
    # Detect platform using the proper module function
    local platform
    if command -v get_platform_type >/dev/null 2>&1; then
        platform=$(get_platform_type)
    else
        platform=$(detect_platform)  # Fallback to built-in detection
    fi
    log "Platform detected: $platform"
    
    # Install for detected platform with emergency fallback
    if install_for_platform "$platform" "$@"; then
        success "🎉 Profolio installation completed successfully!"
    elif install_emergency_mode "$@"; then
        success "🎉 Emergency installation completed successfully!"
    else
        error "All installation methods failed"
        show_failure_help
        exit 1
    fi
    
    # Show completion message
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 INSTALLATION COMPLETE!                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Your Profolio instance is ready!"
    echo ""
    echo "📍 Access URLs:"
    local host_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "your-server-ip")
    echo "   • Frontend: http://${host_ip}:3000"
    echo "   • Backend:  http://${host_ip}:3001"
    echo ""
    echo "🔧 Service Management:"
    echo "   • Status:  systemctl status profolio-backend profolio-frontend"
    echo "   • Logs:    journalctl -u profolio-backend -u profolio-frontend -f"
    echo "   • Restart: systemctl restart profolio-backend profolio-frontend"
    echo ""
    echo "📚 Documentation & Support:"
    echo "   • GitHub: https://github.com/Obednal97/profolio"
    echo "   • Issues: https://github.com/Obednal97/profolio/issues"
    echo ""
}

# Show help
show_help() {
    echo "Profolio Installer v$INSTALLER_VERSION"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --version      Show version"
    echo "  --help         Show this help"
    echo ""
    echo "Examples:"
    echo "  # Standard installation"
    echo "  sudo bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)\""
    echo ""
}

# Parse arguments
case "${1:-}" in
    --version)
        echo "Profolio Installer v$INSTALLER_VERSION"
        exit 0
        ;;
    --help)
        show_help
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac 