#!/bin/bash

# ===============================================
# PROFOLIO - MAIN INSTALLER SCRIPT
# ===============================================
# Entry point for the modular installer system
# Downloads modular architecture and executes installation

set -euo pipefail

# Color definitions for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly REPO_URL="https://github.com/Obednal97/profolio.git"
readonly REPO_BRANCH="main"
readonly INSTALLER_DIR="/tmp/profolio-installer"
readonly LOG_FILE="/tmp/profolio-install.log"

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

# ===============================================
# MAIN INSTALLATION FUNCTION
# ===============================================

main() {
    echo "==============================================="
    echo "🚀 PROFOLIO - Self-Hosted Portfolio Management"
    echo "==============================================="
    echo "📦 Modular installer system v1.0.0"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Check for git
    if ! command -v git >/dev/null 2>&1; then
        error "Git is required for installation"
        info "Installing git..."
        if command -v apt-get >/dev/null 2>&1; then
            apt-get update && apt-get install -y git
        elif command -v yum >/dev/null 2>&1; then
            yum install -y git
        else
            error "Please install git manually and try again"
            exit 1
        fi
    fi
    
    log "Starting Profolio modular installation..."
    log "Installation directory: $INSTALLER_DIR"
    log "Log file: $LOG_FILE"
    
    # Clean up any existing installer directory
    rm -rf "$INSTALLER_DIR"
    mkdir -p "$INSTALLER_DIR"
    cd "$INSTALLER_DIR"
    
    # Clone the repository to get the modular installer
    log "Downloading Profolio modular installer system..."
    if ! git clone --depth=1 --single-branch --branch "$REPO_BRANCH" \
                   "$REPO_URL" profolio --quiet 2>/dev/null; then
        error "Failed to download installer from repository"
        error "Please check your internet connection and try again"
        exit 1
    fi
    
    # Change to the install directory
    cd "$INSTALLER_DIR/profolio/install"
    
    # Source the module loader to initialize the modular architecture
    log "Loading modular installer architecture..."
    if ! source module-loader.sh; then
        error "Failed to load modular installer architecture"
        exit 1
    fi
    
    # Detect platform and run appropriate installer
    log "Detecting platform and running installation..."
    local platform_type
    platform_type=$(get_platform_type)
    
         case "$platform_type" in
         ubuntu|debian)
             log "Ubuntu/Debian platform detected"
             if ! handle_ubuntu_platform "$@"; then
                 error "Ubuntu platform installation failed"
                 exit 1
             fi
             ;;
         proxmox)
             log "Proxmox environment detected"
             if ! handle_proxmox_installation "$@"; then
                 error "Proxmox installation failed"
                 exit 1
             fi
             ;;
         docker)
             log "Docker environment detected"
             if ! handle_docker_platform "$@"; then
                 error "Docker installation failed"
                 exit 1
             fi
             ;;
         *)
             warning "Platform '$platform_type' not specifically supported"
             log "Attempting generic Ubuntu/Debian installation..."
             if ! handle_ubuntu_platform "$@"; then
                 error "Generic installation failed"
                 exit 1
             fi
             ;;
     esac
    
    # Installation completed successfully
    log "✅ Profolio installation completed successfully!"
    echo ""
    echo "==============================================="
    echo "🎉 Installation Complete!"
    echo "==============================================="
    echo ""
    echo "📍 Your Profolio instance is ready at:"
    echo "   Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    echo "   Backend:  http://$(hostname -I | awk '{print $1}'):3001"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Visit the frontend URL to set up your account"
    echo "   2. Configure SSL/HTTPS for production use"
    echo "   3. Set up regular backups"
    echo ""
    echo "📚 Documentation: https://github.com/Obednal97/profolio"
    echo "🛡️ Support: https://github.com/Obednal97/profolio/discussions"
    echo ""
    
    # Cleanup
    cd /tmp
    rm -rf "$INSTALLER_DIR"
}

# ===============================================
# HELP FUNCTION
# ===============================================

show_help() {
    echo "Profolio Main Installer"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --version VERSION    Install specific version"
    echo "  --auto              Unattended installation"
    echo "  --rollback          Emergency rollback"
    echo "  --list-versions     List all available versions"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Install latest version"
    echo "  $0 --version v1.11.1         # Install specific version"
    echo "  $0 --auto                    # Unattended installation for automation"
    echo ""
}

# ===============================================
# ARGUMENT HANDLING
# ===============================================

case "${1:-}" in
    --help|-h)
        show_help
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