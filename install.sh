#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER v1.11.17
# =============================================================================
# Fixed input handling issue where script exited before waiting for user input
# Added proper error handling around read commands to prevent early exit
# =============================================================================

set -eo pipefail

# Configuration
INSTALLER_VERSION="1.11.17"
REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
readonly TEMP_DIR="/tmp/profolio-installer-$$"
readonly LOG_FILE="/tmp/profolio-install.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'

# Logging functions
info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

# Platform detection
detect_platform() {
    if [[ -f "/proc/1/environ" ]] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        echo "lxc_container"
    elif [[ -f "/etc/pve/version" ]]; then
        echo "proxmox"
    elif [[ -f "/.dockerenv" ]]; then
        echo "docker"
    else
        echo "ubuntu"
    fi
}

# Cleanup function
cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        warning "Installation interrupted with exit code $exit_code"
    fi
    
    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR" 2>/dev/null || true
    fi
    
    exit $exit_code
}

trap cleanup EXIT

# Download modules
download_all_modules() {
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    local modules=(
        "common/definitions.sh"
        "core/profolio-installer.sh"
        "platforms/ubuntu.sh"
        "platforms/lxc_container.sh"
        "platforms/proxmox.sh"
        "features/configuration-wizard.sh"
        "features/backup-management.sh"
        "utils/platform-detection.sh"
        "utils/validation.sh"
    )
    
    echo -ne "${BLUE}Downloading ${#modules[@]} installer modules${NC} "
    
    for module in "${modules[@]}"; do
        local module_dir=$(dirname "$module")
        if [[ "$module_dir" != "." ]]; then
            mkdir -p "$module_dir"
        fi
        
        if ! curl -fsSL "$REPO_URL/install/$module" -o "$module" 2>/dev/null; then
            warning "Failed to download $module"
        fi
        
        if [[ "$module" == *.sh ]]; then
            chmod +x "$module"
        fi
    done
    
    echo -e " ${GREEN}✓${NC}"
    success "All modules downloaded"
    return 0
}

# Load essential functions
load_essential_functions() {
    echo -ne "${BLUE}Loading installer functions${NC} "
    
    # Source common definitions first
    if [[ -f "common/definitions.sh" ]]; then
        source "common/definitions.sh" 2>/dev/null || true
    fi
    
    # Load core modules
    for module in core/*.sh utils/*.sh features/*.sh platforms/*.sh; do
        if [[ -f "$module" ]]; then
            source "$module" 2>/dev/null || true
        fi
    done
    
    echo -e " ${GREEN}✓${NC}"
    
    # Count available functions
    local available_functions=0
    local critical_functions=(
        "install_profolio_application"
        "handle_ubuntu_platform" 
        "handle_lxc_container_platform"
    )
    
    for func in "${critical_functions[@]}"; do
        if command -v "$func" >/dev/null 2>&1; then
            ((available_functions++))
        fi
    done
    
    info "Professional modules loaded: $available_functions/${#critical_functions[@]} functions available"
    
    return 0
}

# Install for platform
install_for_platform() {
    local detected_platform="$1"
    shift
    
    local platform_file="platforms/${detected_platform}.sh"
    if [[ -f "$platform_file" ]]; then
        source "$platform_file" 2>/dev/null || return 1
        
        local handler_function="handle_${detected_platform}_platform"
        if command -v "$handler_function" >/dev/null 2>&1; then
            "$handler_function" "$@"
            return $?
        fi
    fi
    
    # Fallback to Ubuntu
    if [[ -f "platforms/ubuntu.sh" ]]; then
        source "platforms/ubuntu.sh" 2>/dev/null || return 1
        if command -v handle_ubuntu_platform >/dev/null 2>&1; then
            handle_ubuntu_platform "$@"
            return $?
        fi
    fi
    
    return 1
}

# Main function
main() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 🚀 PROFOLIO INSTALLER v$INSTALLER_VERSION                 ║"
    echo "║              Self-Hosted Portfolio Management                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    info "Installation started at $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Security checks
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
    
    # Install curl if needed
    if ! command -v curl >/dev/null 2>&1; then
        info "Installing curl..."
        apt-get update && apt-get install -y curl
    fi
    
    # Download modules
    if ! download_all_modules; then
        error "Failed to download installer modules"
        exit 1
    fi
    
    # Load functions
    if ! load_essential_functions; then
        warning "Module loading failed, continuing with basic mode"
    fi
    
    # Detect platform
    local platform=$(detect_platform)
    if [[ -z "$platform" ]]; then
        platform="ubuntu"
    fi
    
    # Show system information
    echo ""
    echo -e "${WHITE}🖥️  System Information${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}Platform:${NC} $platform"
    
    if [[ -d "/opt/profolio" ]]; then
        echo -e "${BLUE}Installation Status:${NC} Update/Repair"
    else
        echo -e "${BLUE}Installation Status:${NC} Fresh Installation"
    fi
    
    local distro="Unknown"
    if [[ -f "/etc/os-release" ]]; then
        distro=$(grep '^PRETTY_NAME=' /etc/os-release | cut -d'"' -f2 2>/dev/null || echo "Ubuntu/Debian")
    fi
    echo -e "${BLUE}Distribution:${NC} $distro"
    
    if command -v df >/dev/null 2>&1; then
        local disk_space=$(df -h /opt 2>/dev/null | tail -1 | awk '{print $4}' || echo "Unknown")
        echo -e "${BLUE}Available Space:${NC} $disk_space"
    fi
    
    echo ""
    
    # Show installation options
    echo -e "${WHITE}📦 Installation Options${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    echo -e "${GREEN}1)${NC} 🚀 Quick Installation (Recommended)"
    echo -e "   ${GRAY}• Default settings with latest stable version${NC}"
    echo -e "   ${GRAY}• Includes backup protection and safe optimization${NC}"
    echo ""
    echo -e "${BLUE}2)${NC} 🔧 Advanced Installation"
    echo -e "   ${GRAY}• Choose version, optimization level, and features${NC}"
    echo -e "   ${GRAY}• Configure backup and rollback options${NC}"
    echo ""
    
    # CRITICAL FIX: Get user choice with proper error handling
    echo -n "Select installation type [1]: "
    
    # Temporarily disable exit on error for input handling
    set +e
    read install_choice
    exit_code=$?
    set -e
    
    # Handle read command failure gracefully
    if [[ $exit_code -ne 0 ]] || [[ -z "$install_choice" ]]; then
        install_choice="1"
        info "Using default choice: 1"
    fi
    install_choice=${install_choice:-1}
    
    # Validate input
    case "$install_choice" in
        1|2) ;; # Valid choices
        *) 
            warning "Invalid choice '$install_choice', using default"
            install_choice="1"
            ;;
    esac
    
    # Process the user's choice
    case $install_choice in
        1)
            echo -e "${GREEN}✓${NC} Quick installation selected"
            INSTALLATION_MODE="quick"
            ;;
        2)
            echo -e "${BLUE}✓${NC} Advanced installation selected"
            INSTALLATION_MODE="advanced"
            
            if command -v run_configuration_wizard >/dev/null 2>&1; then
                echo -e "${CYAN}🧙 Starting Configuration Wizard...${NC}"
                if ! run_configuration_wizard; then
                    warning "Configuration wizard failed, proceeding with defaults"
                fi
            else
                info "Configuration wizard not available, using defaults"
            fi
            ;;
        *)
            warning "Invalid choice, defaulting to quick installation"
            INSTALLATION_MODE="quick"
            ;;
    esac
    echo ""
    
    # Create backup if available
    if [[ -d "/opt/profolio" ]] && command -v backup_create_backup >/dev/null 2>&1; then
        info "🛡️ Creating backup before installation..."
        if backup_create_backup "pre-installation-$(date +%Y%m%d-%H%M%S)"; then
            success "Backup created successfully"
        else
            warning "Backup creation failed, continuing"
        fi
        echo ""
    fi
    
    # Install for platform
    if install_for_platform "$platform" "$@"; then
        success "🎉 Profolio installation completed!"
        
        echo ""
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                     🎉 INSTALLATION COMPLETE!                 ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo ""
        
        local host_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "your-server-ip")
        echo -e "${GREEN}🌐 Your Profolio instance is ready!${NC}"
        echo ""
        echo -e "${WHITE}📍 Access Information${NC}"
        echo "────────────────────────────────────────────────────────────────"
        echo -e "${BLUE}Frontend:${NC} http://${host_ip}:3000"
        echo -e "${BLUE}Backend API:${NC} http://${host_ip}:3001"
        echo ""
        
    else
        error "Installation failed"
        exit 1
    fi
}

# Parse arguments and run
case "${1:-}" in
    --version)
        echo "Profolio Installer v$INSTALLER_VERSION"
        exit 0
        ;;
    --help)
        echo "Profolio Installer v$INSTALLER_VERSION"
        echo "Usage: $0 [--help] [--version]"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac