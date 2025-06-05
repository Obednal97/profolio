#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER v1.11.4
# =============================================================================
# Single entry point for Profolio installation with modular architecture
# Downloads and executes the comprehensive modular installer system
# =============================================================================

set -euo pipefail

# Configuration
readonly INSTALLER_VERSION="1.11.4"
readonly REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
readonly TEMP_DIR="/tmp/profolio-installer-$$"
readonly LOG_FILE="/tmp/profolio-install.log"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

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

# Cleanup function
cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Download modular installer
download_installer() {
    log "Downloading Profolio modular installer..."
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Download essential modules
    local modules=(
        "module-loader.sh"
        "utils/logging.sh"
        "utils/ui.sh"
        "utils/validation.sh"
        "utils/platform-detection.sh"
        "core/profolio-installer.sh"
        "platforms/ubuntu.sh"
        "platforms/proxmox.sh"
        "platforms/docker.sh"
        "platforms/emergency.sh"
    )
    
    for module in "${modules[@]}"; do
        local module_dir=$(dirname "$module")
        if [[ "$module_dir" != "." ]]; then
            mkdir -p "$module_dir"
        fi
        
        info "Downloading $module..."
        if ! curl -fsSL "$REPO_URL/install/$module" -o "$module"; then
            error "Failed to download $module"
            return 1
        fi
        
        # Make executable if it's a shell script
        if [[ "$module" == *.sh ]]; then
            chmod +x "$module"
        fi
    done
    
    success "Modular installer downloaded successfully"
    return 0
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
    
    # Download modular installer
    if ! download_installer; then
        error "Failed to download installer modules"
        exit 1
    fi
    
    # Change to temp directory with modules
    cd "$TEMP_DIR"
    
    # Load the modular architecture
    log "Loading modular installer architecture..."
    if ! source "module-loader.sh"; then
        error "Failed to load modular installer"
        exit 1
    fi
    
    # Detect platform
    local platform
    if ! platform=$(get_platform_type); then
        error "Platform detection failed"
        exit 1
    fi
    
    log "Platform detected: $platform"
    
    # Execute platform-specific installation
    case "$platform" in
        ubuntu|debian|lxc-container)
            log "Starting Ubuntu/Debian installation..."
            if ! handle_ubuntu_platform "$@"; then
                error "Ubuntu installation failed, trying emergency mode..."
                handle_emergency_installation "$@"
            fi
            ;;
        proxmox)
            log "Starting Proxmox installation..."
            if ! handle_proxmox_installation "$@"; then
                error "Proxmox installation failed, trying emergency mode..."
                handle_emergency_installation "$@"
            fi
            ;;
        docker)
            log "Starting Docker installation..."
            if ! handle_docker_platform "$@"; then
                error "Docker installation failed, trying emergency mode..."
                handle_emergency_installation "$@"
            fi
            ;;
        *)
            log "Unknown platform '$platform', trying Ubuntu installation..."
            if ! handle_ubuntu_platform "$@"; then
                error "Generic installation failed, trying emergency mode..."
                handle_emergency_installation "$@"
            fi
            ;;
    esac
    
    success "🎉 Profolio installation completed successfully!"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 INSTALLATION COMPLETE!                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Your Profolio instance is ready!"
    echo ""
    echo "📍 Access URLs:"
    local host_ip=$(hostname -I | awk '{print $1}')
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
    echo "  # Proxmox LXC container"
    echo "  sudo bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-proxmox.sh)\""
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