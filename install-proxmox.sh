#!/bin/bash

# ===============================================
# PROFOLIO - PROXMOX LXC INSTALLER SCRIPT
# ===============================================
# Proxmox-optimized entry point for container installations
# Downloads modular architecture and executes Proxmox-specific installation

set -euo pipefail

# Color definitions for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly NC='\033[0m' # No Color

# Configuration
readonly REPO_URL="https://github.com/Obednal97/profolio.git"
readonly REPO_BRANCH="main"
readonly INSTALLER_DIR="/tmp/profolio-installer"
readonly LOG_FILE="/tmp/profolio-proxmox-install.log"

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

proxmox_info() {
    echo -e "${PURPLE}[PROXMOX]${NC} $1" | tee -a "$LOG_FILE"
}

# ===============================================
# PROXMOX DETECTION & VALIDATION
# ===============================================

detect_proxmox() {
    if [[ -f /etc/pve/local/pve-ssl.pem ]] || [[ -f /proc/vz/version ]]; then
        return 0  # Running on Proxmox host
    elif [[ -f /proc/1/environ ]] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        return 0  # Running in LXC container
    elif [[ -f /.dockerenv ]]; then
        warning "Detected Docker container - Proxmox features will be limited"
        return 1
    else
        return 1  # Not Proxmox environment
    fi
}

# ===============================================
# MAIN INSTALLATION FUNCTION
# ===============================================

main() {
    echo "==============================================="
    echo "🏠 PROFOLIO - PROXMOX LXC INSTALLER"
    echo "==============================================="
    echo "🐳 Container-optimized installation"
    echo "🔧 Enhanced Proxmox management features"
    echo "🚀 Auto-start and resource optimization"
    echo "📦 Modular installer system v1.0.0"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    # Detect Proxmox environment
    if detect_proxmox; then
        proxmox_info "Proxmox environment detected - enabling container optimizations"
    else
        warning "Proxmox environment not detected - installing with standard optimizations"
        info "This installer works on any Linux system but provides additional features for Proxmox LXC containers"
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
    
    log "Starting Profolio Proxmox modular installation..."
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
    
    # Set Proxmox-specific environment variables before loading modules
    export PROFOLIO_PLATFORM="proxmox"
    export PROFOLIO_CONTAINER_OPTIMIZED="true"
    export PROFOLIO_AUTO_START="true"
    
    # Source the module loader to initialize the modular architecture
    log "Loading modular installer architecture with Proxmox optimizations..."
    if ! source module-loader.sh; then
        error "Failed to load modular installer architecture"
        exit 1
    fi
    
    # Force Proxmox platform detection and run Proxmox-specific installer
    log "Running Proxmox-optimized installation..."
    if ! handle_proxmox_installation "$@"; then
        error "Proxmox installation failed"
        
        echo ""
        echo "🔧 Troubleshooting Proxmox Issues:"
        echo "   • Ensure container has internet access"
        echo "   • Check container resource allocation (min 2GB RAM)"
        echo "   • Verify container features: nesting=1,keyctl=1"
        echo "   • Review Proxmox container logs"
        echo ""
        exit 1
    fi
    
    # Installation completed successfully
    log "✅ Profolio Proxmox installation completed successfully!"
    echo ""
    echo "==============================================="
    echo "🎉 Proxmox Installation Complete!"
    echo "==============================================="
    echo ""
    echo "🏠 Container Features Enabled:"
    echo "   ✅ Auto-start on container boot"
    echo "   ✅ Resource-optimized configuration"
    echo "   ✅ Container-specific logging"
    echo "   ✅ Proxmox management integration"
    echo ""
    echo "📍 Your Profolio instance is ready at:"
    echo "   Frontend: http://$(hostname -I | awk '{print $1}'):3000"
    echo "   Backend:  http://$(hostname -I | awk '{print $1}'):3001"
    echo ""
    echo "🔧 Proxmox Management:"
    echo "   • Container snapshots: Create instant backups via Proxmox UI"
    echo "   • Resource allocation: Adjust CPU/memory via container settings"
    echo "   • Migration: Move container between Proxmox nodes seamlessly"
    echo "   • Monitoring: View performance in Proxmox dashboard"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Visit the frontend URL to set up your account"
    echo "   2. Configure SSL/HTTPS for production use"
    echo "   3. Set up Proxmox backup schedules"
    echo "   4. Configure resource limits in Proxmox UI"
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
    echo "Profolio Proxmox LXC Installer"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Proxmox-specific options:"
    echo "  --update-installer    Update only the installer script (not the application)"
    echo "  --container-info      Show container optimization details"
    echo "  --help               Show this help message"
    echo ""
    echo "Standard options:"
    echo "  --version VERSION    Install specific version"
    echo "  --auto              Unattended installation"
    echo "  --rollback          Emergency rollback"
    echo "  --list-versions     List all available versions"
    echo ""
    echo "Examples:"
    echo "  $0                           # Install latest version with Proxmox optimizations"
    echo "  $0 --version v1.11.1         # Install specific version"
    echo "  $0 --auto                    # Unattended installation for automation"
    echo "  $0 --update-installer        # Update installer only"
    echo ""
}

show_container_info() {
    echo "🐳 Proxmox LXC Container Optimizations"
    echo ""
    echo "Resource Recommendations:"
    echo "  • RAM: 2GB minimum, 4GB recommended"
    echo "  • CPU: 1 core minimum, 2 cores recommended"
    echo "  • Storage: 10GB minimum, 20GB recommended"
    echo ""
    echo "Container Features (required):"
    echo "  • nesting=1        # Required for Docker operations"
    echo "  • keyctl=1         # Required for systemd services"
    echo "  • fuse=1           # Optional: for advanced filesystem operations"
    echo ""
    echo "Network Configuration:"
    echo "  • Bridge: vmbr0 (default)"
    echo "  • Firewall: Enabled with ports 3000,3001 open"
    echo "  • DHCP or static IP configuration"
    echo ""
    echo "Backup Strategy:"
    echo "  • Snapshot before major updates"
    echo "  • Schedule daily backups via Proxmox"
    echo "  • Test restore procedures regularly"
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
    --container-info)
        show_container_info
        exit 0
        ;;
    --update-installer)
        log "Updating Proxmox installer script only..."
        curl -fsSL "$REPO_URL/install-proxmox.sh" -o /tmp/install-proxmox-new.sh
        chmod +x /tmp/install-proxmox-new.sh
        cp /tmp/install-proxmox-new.sh "$0"
        log "✅ Proxmox installer updated successfully!"
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