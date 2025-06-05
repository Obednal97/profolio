#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER v1.11.5
# =============================================================================
# Simple, reliable installer that works without complex module systems
# Downloads and directly executes platform-specific installers
# =============================================================================

set -euo pipefail

# Configuration
readonly INSTALLER_VERSION="1.11.5"
readonly REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
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

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Platform detection
detect_platform() {
    if [[ -f "/etc/pve/version" ]]; then
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

# Download and execute platform installer
install_for_platform() {
    local platform="$1"
    local temp_installer="/tmp/profolio-platform-installer.sh"
    
    log "Downloading platform installer for: $platform"
    
    # Map platform to installer URL
    local installer_url
    case "$platform" in
        proxmox)
            installer_url="$REPO_URL/install/platforms/proxmox.sh"
            ;;
        docker)
            installer_url="$REPO_URL/install/platforms/docker.sh"
            ;;
        ubuntu|debian)
            installer_url="$REPO_URL/install/platforms/ubuntu.sh"
            ;;
        *)
            installer_url="$REPO_URL/install/platforms/ubuntu.sh"  # Fallback
            ;;
    esac
    
    # Download the platform installer
    if curl -fsSL "$installer_url" -o "$temp_installer"; then
        chmod +x "$temp_installer"
        success "Platform installer downloaded"
        
        # Source required utility functions first
        download_utilities
        
        # Execute the platform installer
        log "Executing $platform platform installation..."
        if source "$temp_installer" && handle_${platform}_platform "$@"; then
            success "Platform installation completed successfully"
            return 0
        else
            warning "Platform installation failed, trying emergency mode"
            install_emergency_mode "$@"
        fi
    else
        error "Failed to download platform installer"
        install_emergency_mode "$@"
    fi
}

# Download utility functions
download_utilities() {
    local utils_dir="/tmp/profolio-utils"
    mkdir -p "$utils_dir"
    
    # Download essential utility functions
    local util_files=(
        "utils/logging.sh"
        "utils/ui.sh"
        "utils/platform-detection.sh"
        "core/profolio-installer.sh"
    )
    
    for util_file in "${util_files[@]}"; do
        local util_path="$utils_dir/$(basename "$util_file")"
        if curl -fsSL "$REPO_URL/install/$util_file" -o "$util_path" 2>/dev/null; then
            source "$util_path" 2>/dev/null || true
        fi
    done
}

# Emergency installation mode
install_emergency_mode() {
    warning "🚨 Activating emergency installation mode"
    
    local emergency_installer="/tmp/profolio-emergency-installer.sh"
    
    if curl -fsSL "$REPO_URL/install/platforms/emergency.sh" -o "$emergency_installer"; then
        chmod +x "$emergency_installer"
        log "Emergency installer downloaded"
        
        if source "$emergency_installer" && handle_emergency_installation "$@"; then
            success "🎉 Emergency installation completed successfully!"
            return 0
        else
            error "❌ Emergency installation also failed"
            show_failure_help
            exit 1
        fi
    else
        error "Failed to download emergency installer"
        show_failure_help
        exit 1
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
    
    # Detect platform
    local platform
    platform=$(detect_platform)
    log "Platform detected: $platform"
    
    # Install for detected platform
    if install_for_platform "$platform" "$@"; then
        success "🎉 Profolio installation completed successfully!"
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
    else
        error "Installation failed"
        exit 1
    fi
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