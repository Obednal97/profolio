#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER/UPDATER - MODULAR ARCHITECTURE v1.0.0
# =============================================================================
# 
# Next-generation Profolio installer using modular architecture
# Reduces installer size by ~90% through shared modules
# Supports all platforms with unified codebase
#
# Usage: ./install-or-update-modular.sh [OPTIONS]
# =============================================================================

set -euo pipefail  # Enhanced error handling

# Installer metadata
INSTALLER_VERSION="1.0.0"
INSTALLER_DESCRIPTION="Profolio Modular Installer"

# Load the modular architecture
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/install/module-loader.sh" ]]; then
    # shellcheck source=install/module-loader.sh
    source "$SCRIPT_DIR/install/module-loader.sh"
elif [[ -f "./install/module-loader.sh" ]]; then
    # shellcheck source=install/module-loader.sh
    source "./install/module-loader.sh"
else
    echo "FATAL: Module loader not found"
    echo "Please ensure install/module-loader.sh exists"
    exit 1
fi

# Global variables for operation tracking
OPERATION_TYPE=""
OPERATION_SUCCESS=false
OPERATION_START_TIME=$(date +%s)

# Configuration variables (can be overridden by modules)
AUTO_INSTALL=false
TARGET_VERSION=""
FORCE_VERSION=false
ROLLBACK_ENABLED=true

# Show banner using modular UI
show_banner() {
    ui_show_banner "Profolio Installer" "$INSTALLER_VERSION" "Modular Architecture"
}

# Enhanced help with modular features
show_help() {
    echo -e "${CYAN}🚀 Profolio Modular Installer v$INSTALLER_VERSION${NC}"
    echo ""
    echo -e "${WHITE}DESCRIPTION:${NC}"
    echo "  Next-generation installer using modular architecture"
    echo "  Supports all platforms with unified codebase"
    echo ""
    echo -e "${WHITE}USAGE:${NC}"
    echo "  $0 [OPTIONS]"
    echo ""
    echo -e "${WHITE}OPTIONS:${NC}"
    echo -e "  ${GREEN}--auto, --unattended${NC}     Run with default configuration"
    echo -e "  ${GREEN}--version VERSION${NC}        Install/update to specific version"
    echo -e "  ${GREEN}--force-version VERSION${NC}  Force version (skip existence check)"
    echo -e "  ${GREEN}--no-rollback${NC}            Disable automatic rollback on failure"
    echo -e "  ${GREEN}--list-versions${NC}          Show available versions and exit"
    echo -e "  ${GREEN}--rollback${NC}               Execute manual rollback to previous version"
    echo -e "  ${GREEN}--platform-info${NC}          Show platform information and exit"
    echo -e "  ${GREEN}--modules${NC}                Show loaded modules and exit"
    echo -e "  ${GREEN}--help, -h${NC}               Show this help message"
    echo ""
    echo -e "${WHITE}PLATFORM SUPPORT:${NC}"
    echo -e "  • ${GREEN}Proxmox Host${NC}            Creates LXC containers for Profolio"
    echo -e "  • ${GREEN}Ubuntu/Debian${NC}           Direct installation on system"
    echo -e "  • ${GREEN}Docker Container${NC}        Container-optimized installation"
    echo -e "  • ${GREEN}Generic Linux${NC}           Fallback for other distributions"
    echo ""
    echo -e "${WHITE}MODULAR FEATURES:${NC}"
    echo -e "  • ${GREEN}Automatic platform detection${NC}"
    echo -e "  • ${GREEN}Unified configuration wizard${NC}"
    echo -e "  • ${GREEN}Advanced SSH hardening${NC}"
    echo -e "  • ${GREEN}Intelligent optimization${NC}"
    echo -e "  • ${GREEN}Git-based version control${NC}"
    echo -e "  • ${GREEN}Automated rollback system${NC}"
    echo ""
    echo -e "${WHITE}EXAMPLES:${NC}"
    echo -e "  ${CYAN}$0${NC}                        Interactive installation"
    echo -e "  ${CYAN}$0 --auto${NC}                 Quick installation with defaults"
    echo -e "  ${CYAN}$0 --version v1.0.3${NC}       Install specific version"
    echo -e "  ${CYAN}$0 --platform-info${NC}        Show platform capabilities"
    echo -e "  ${CYAN}$0 --modules${NC}              Show loaded modules"
    echo ""
}

# Check root permissions (skip for informational commands)
check_root() {
    # Allow informational commands without root
    for arg in "$@"; do
        case "$arg" in
            --help|-h|--platform-info|--modules|--list-versions)
                return 0
                ;;
        esac
    done
    
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        echo "Please run: sudo $0"
        exit 1
    fi
}

# Detect and handle platform-specific installation
handle_platform_installation() {
    local platform_type=$(get_platform_type)
    
    info "Platform detected: $platform_type"
    
    case "$platform_type" in
        "proxmox-host")
            handle_proxmox_installation
            ;;
        "lxc-container"|"generic-linux")
            handle_ubuntu_platform
            ;;
        "docker-container")
            handle_docker_platform
            ;;
        *)
            warn "Unknown platform: $platform_type"
            info "Attempting generic Linux installation..."
            handle_ubuntu_platform
            ;;
    esac
}

# Enhanced fresh installation using modular architecture
fresh_install() {
    OPERATION_TYPE="INSTALL"
    info "Starting fresh installation"
    
    # Use modular platform-specific installation
    if ! handle_platform_installation; then
        error "Platform-specific installation failed"
        OPERATION_SUCCESS=false
        return 1
    fi
    
    # Apply optimizations if requested
    if [[ "${OPTIMIZATION_LEVEL:-}" == "aggressive" ]]; then
        info "Applying aggressive optimization..."
        optimization_deploy_aggressive "/opt/profolio"
    elif [[ "${OPTIMIZATION_LEVEL:-}" == "safe" ]]; then
        info "Applying safe optimization..."
        optimization_deploy_safe "/opt/profolio"
    fi
    
    OPERATION_SUCCESS=true
    success "Fresh installation completed successfully"
}

# Enhanced update installation using modular architecture
update_installation() {
    OPERATION_TYPE="UPDATE"
    info "Starting update process"
    
    # Create rollback point
    if ! rollback_create_rollback_point; then
        error "Failed to create rollback point"
        return 1
    fi
    
    # Use modular version control for updates
    if [[ -n "$TARGET_VERSION" ]]; then
        if ! version_control_checkout_version "$TARGET_VERSION"; then
            error "Failed to checkout version $TARGET_VERSION"
            rollback_execute_rollback
            return 1
        fi
    else
        if ! version_control_update_to_latest; then
            error "Failed to update to latest version"
            rollback_execute_rollback
            return 1
        fi
    fi
    
    # Rebuild and restart services using platform modules
    if ! handle_platform_installation; then
        error "Platform update failed"
        rollback_execute_rollback
        return 1
    fi
    
    OPERATION_SUCCESS=true
    success "Update completed successfully"
}

# Repair installation using modular architecture
repair_installation() {
    OPERATION_TYPE="REPAIR"
    info "Starting repair process"
    
    # Use platform-specific repair procedures
    if ! handle_platform_installation; then
        error "Platform repair failed"
        OPERATION_SUCCESS=false
        return 1
    fi
    
    OPERATION_SUCCESS=true
    success "Repair completed successfully"
}

# Show completion status
show_completion_status() {
    local operation_type="$1"
    local success="$2"
    
    echo ""
    if [[ "$success" == "true" ]]; then
        ui_show_progress "✅ $operation_type COMPLETED SUCCESSFULLY" 100
    else
        ui_show_progress "❌ $operation_type FAILED" 100
    fi
    echo ""
}

# Main execution logic
main() {
    # Initialize operation tracking
    OPERATION_START_TIME=$(date +%s)
    
    show_banner
    check_root "$@"
    
    # Enhanced command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto|--unattended)
                AUTO_INSTALL=true
                shift
                ;;
            --version)
                TARGET_VERSION="$2"
                if [[ -z "$TARGET_VERSION" ]]; then
                    error "Version parameter requires a value"
                    echo "Usage: $0 --version v1.0.3"
                    exit 1
                fi
                shift 2
                ;;
            --force-version)
                TARGET_VERSION="$2"
                FORCE_VERSION=true
                if [[ -z "$TARGET_VERSION" ]]; then
                    error "Force version parameter requires a value"
                    echo "Usage: $0 --force-version v1.0.2"
                    exit 1
                fi
                shift 2
                ;;
            --no-rollback)
                ROLLBACK_ENABLED=false
                shift
                ;;
            --list-versions)
                echo -e "${CYAN}🚀 Profolio Available Versions${NC}"
                echo ""
                version_control_list_versions
                exit 0
                ;;
            --rollback)
                echo -e "${YELLOW}⚠️  Manual rollback requested${NC}"
                echo ""
                if rollback_execute_rollback; then
                    exit 0
                else
                    exit 1
                fi
                ;;
            --platform-info)
                echo -e "${CYAN}🖥️  Platform Information${NC}"
                echo ""
                get_platform_info
                exit 0
                ;;
            --modules)
                echo -e "${CYAN}📦 Loaded Modules${NC}"
                echo ""
                get_loaded_modules
                exit 0
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Version validation using modular validation
    if [[ -n "$TARGET_VERSION" ]]; then
        info "Target version specified: $TARGET_VERSION"
        
        if ! validation_validate_version "$TARGET_VERSION"; then
            error "Invalid version format: $TARGET_VERSION"
            echo "Valid formats: v1.0.3, 1.0.3, main, latest"
            exit 1
        fi
        
        if [[ "$FORCE_VERSION" == "false" ]]; then
            if ! version_control_version_exists "$TARGET_VERSION"; then
                error "Version $TARGET_VERSION does not exist"
                echo ""
                version_control_list_versions
                exit 1
            fi
        else
            warn "Force version enabled - skipping version existence check"
        fi
        
        success "Version $TARGET_VERSION validated"
    fi
    
    # Detect installation state and determine action
    local install_state
    if [[ -d "/opt/profolio" ]]; then
        if systemctl is-active profolio-backend profolio-frontend >/dev/null 2>&1; then
            install_state=2  # Running installation
        else
            install_state=1  # Stopped installation
        fi
    else
        install_state=0  # No installation
    fi
    
    case $install_state in
        0)
            info "Action: First installation"
            if [[ "$AUTO_INSTALL" == "false" ]]; then
                config_run_installation_wizard
            fi
            fresh_install
            ;;
        1|2)
            info "Action: Existing installation detected"
            if [[ "$AUTO_INSTALL" == "false" ]]; then
                config_run_update_wizard
            fi
            
            # Determine action based on user choice
            case "${USER_ACTION_CHOICE:-update}" in
                "repair")
                    repair_installation
                    ;;
                *)
                    update_installation
                    ;;
            esac
            ;;
        *)
            error "Unknown installation state: $install_state"
            exit 1
            ;;
    esac
    
    # Show completion status
    show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
}

# Run main function with all arguments
main "$@" 