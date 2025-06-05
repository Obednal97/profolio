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

# Enhanced configuration variables for full feature parity
USER_ACTION_CHOICE=""
OPTIMIZATION_LEVEL="safe"
SKIP_ENV_PRESERVATION=false
EXPERIENCE_MODE="default"

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
        "unraid")
            info "Unraid detected - using Docker container approach"
            echo -e "${CYAN}🐳 Unraid Docker Installation${NC}"
            echo -e "${YELLOW}For Unraid, we recommend using Docker containers via Unraid's web interface.${NC}"
            echo -e "${BLUE}Please use the Community Applications plugin to install Profolio,${NC}"
            echo -e "${BLUE}or create a custom Docker container with the following settings:${NC}"
            echo ""
            echo -e "${WHITE}Docker Run Command:${NC}"
            echo -e "${GREEN}docker run -d --name=profolio \\${NC}"
            echo -e "${GREEN}  -p 3000:3000 -p 3001:3001 \\${NC}"
            echo -e "${GREEN}  -v /mnt/user/appdata/profolio:/opt/profolio/data \\${NC}"
            echo -e "${GREEN}  -e NODE_ENV=production \\${NC}"
            echo -e "${GREEN}  --restart unless-stopped \\${NC}"
            echo -e "${GREEN}  profolio:latest${NC}"
            echo ""
            echo -e "${YELLOW}Note: This installer is designed for direct Linux installation.${NC}"
            echo -e "${YELLOW}For Unraid, please use the Docker method above.${NC}"
            return 1
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

# Manage backups with improved feedback
manage_backups() {
    local backup_type=$1
    local backup_dir="/opt/profolio-backups"
    
    mkdir -p "$backup_dir"
    
    # Create new backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local new_backup_dir="$backup_dir/${backup_type}_${timestamp}"
    mkdir -p "$new_backup_dir"
    
    info "Creating backup..."
    
    # Backup database
    if sudo -u postgres pg_dump profolio > "$new_backup_dir/database.sql" 2>/dev/null; then
        success "Database backup created"
    else
        warn "Database backup failed (may not exist yet)"
    fi
    
    # Backup application
    if [[ -d "/opt/profolio" ]]; then
        cp -r /opt/profolio "$new_backup_dir/application"
        success "Application backup created"
    fi
    
    # Cleanup old backups (keep only 3 most recent)
    local backup_count=$(ls -1 "$backup_dir" | grep "^${backup_type}_" | wc -l)
    if [[ "$backup_count" -gt 3 ]]; then
        local backups_to_remove=$((backup_count - 3))
        ls -1 "$backup_dir" | grep "^${backup_type}_" | head -n "$backups_to_remove" | while read -r old_backup; do
            rm -rf "$backup_dir/$old_backup"
            info "Removed old backup: $old_backup"
        done
    fi
    
    success "Backup created: $new_backup_dir"
}

# Enhanced configuration wizard with default/advanced modes
run_enhanced_configuration_wizard() {
    echo -e "${WHITE}🔧 PROFOLIO CONFIGURATION WIZARD${NC}"
    echo -e "${YELLOW}Configure your Profolio installation${NC}"
    echo ""
    
    # Installation Mode Selection
    echo -e "${CYAN}Installation Mode:${NC}"
    echo "  1) ${GREEN}Quick Install${NC} (recommended defaults)"
    echo "  2) ${BLUE}Advanced Setup${NC} (custom configuration)"
    echo ""
    read -p "Select installation mode [1]: " install_mode
    install_mode=${install_mode:-1}
    
    if [[ "$install_mode" == "1" ]]; then
        # Quick install mode
        AUTO_INSTALL=true
        OPTIMIZATION_LEVEL="safe"
        EXPERIENCE_MODE="default"
        
        echo ""
        echo -e "${GREEN}📋 Quick Install Mode Selected${NC}"
        echo -e "${CYAN}Final Settings:${NC}"
        echo -e "  • Installation: Default configuration"
        echo -e "  • Optimization: Safe (recommended)"
        echo -e "  • SSH: Enabled with key-only authentication"
        echo -e "  • Network: DHCP (automatic)"
        echo ""
        return
    fi
    
    # Advanced Mode
    EXPERIENCE_MODE="advanced"
    echo ""
    echo -e "${BLUE}🔧 Advanced Mode Selected${NC}"
    echo ""
    
    # Optimization Level Selection
    echo -e "${CYAN}🔧 Optimization Level Choice:${NC}"
    echo -e "  Choose how aggressively to optimize the installation size:"
    echo ""
    echo -e "  1) ${GREEN}Safe Optimization${NC} (recommended - ~600-800MB)"
    echo -e "     • Removes only development dependencies after build"
    echo -e "     • Preserves all production-needed packages"
    echo -e "     • ${GREEN}Safest option - all features guaranteed to work${NC}"
    echo ""
    echo -e "  2) ${YELLOW}Aggressive Optimization${NC} (⚠️  ~400-500MB - use with caution)"
    echo -e "     • Removes development dependencies + Docker-style cleanup"
    echo -e "     • Ultra-aggressive space reduction"
    echo -e "     • ${YELLOW}May affect debugging capabilities${NC}"
    echo ""
    read -p "Select optimization level [1]: " opt_choice
    opt_choice=${opt_choice:-1}
    
    if [[ "$opt_choice" == "2" ]]; then
        echo ""
        echo -e "${RED}⚠️  AGGRESSIVE OPTIMIZATION WARNING${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}This mode applies ultra-aggressive size reduction techniques${NC}"
        echo ""
        read -p "Proceed with aggressive optimization? (y/n) [n]: " aggressive_confirm
        if [[ "$aggressive_confirm" =~ ^[Yy]$ ]]; then
            OPTIMIZATION_LEVEL="aggressive"
            warn "Aggressive optimization confirmed"
        else
            OPTIMIZATION_LEVEL="safe"
            success "Using safe optimization instead"
        fi
    else
        OPTIMIZATION_LEVEL="safe"
        success "Safe optimization selected"
    fi
    
    echo ""
    echo -e "${BLUE}📋 Advanced Mode Configuration:${NC}"
    echo -e "${CYAN}Final Settings:${NC}"
    echo -e "  • Installation: Advanced configuration"
    echo -e "  • Optimization: $OPTIMIZATION_LEVEL"
    echo -e "  • SSH: Enabled with key-only authentication"
    echo -e "  • Network: DHCP (automatic)"
    echo ""
}

# Enhanced update wizard with comprehensive options
run_enhanced_update_wizard() {
    echo -e "${WHITE}🔄 PROFOLIO UPDATE WIZARD${NC}"
    echo -e "${YELLOW}Update your existing Profolio installation${NC}"
    echo ""
    
    # Show current version info
    local current_version="unknown"
    local latest_version="checking..."
    
    if [[ -f "/opt/profolio/package.json" ]]; then
        current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
        echo -e "${BLUE}Current Version:${NC} $current_version"
    fi
    
    # Get latest version
    info "Checking for updates..."
    latest_version=$(version_control_get_latest_version)
    
    if [[ "$latest_version" != "unknown" ]]; then
        echo -e "${BLUE}Latest Stable Version:${NC} $latest_version"
    else
        echo -e "${BLUE}Latest Stable Version:${NC} Unable to check"
    fi
    echo ""
    
    # Experience Level Selection
    echo -e "${CYAN}🎛️ Choose Your Experience:${NC}"
    echo -e "  1) ${GREEN}Default Mode${NC} (recommended - quick update with sensible defaults)"
    echo -e "  2) ${BLUE}Advanced Mode${NC} (full control over all options)"
    echo ""
    read -p "Select mode [1]: " experience_mode
    experience_mode=${experience_mode:-1}
    
    # Initialize preferences
    local action_choice=""
    local version_choice=""
    local preserve_env="yes"
    local enable_rollback="yes"
    
    if [[ "$experience_mode" == "1" ]]; then
        # Default Mode
        EXPERIENCE_MODE="default"
        echo -e "${GREEN}📋 Default Mode Selected${NC}"
        echo ""
        
        if [[ "$current_version" == "$latest_version" ]]; then
            action_choice="rebuild"
            version_choice="$current_version"
            echo -e "${YELLOW}ℹ️  You have the latest stable version${NC}"
            echo -e "${CYAN}Default Action:${NC} Rebuild current version"
        else
            action_choice="update"
            version_choice="$latest_version"
            echo -e "${CYAN}Default Action:${NC} Update to latest stable version ($latest_version)"
        fi
        
        OPTIMIZATION_LEVEL="safe"
        echo -e "${CYAN}Environment Preservation:${NC} Yes (credentials preserved)"
        echo -e "${CYAN}Rollback Protection:${NC} Yes (automatic rollback on failure)"
        echo -e "${CYAN}Optimization Level:${NC} Safe (recommended)"
        echo ""
        
        read -p "Proceed with default settings? (y/n) [y]: " default_confirm
        if [[ ! "$default_confirm" =~ ^[Yy]?$ ]]; then
            info "Update cancelled by user"
            exit 0
        fi
    else
        # Advanced Mode
        EXPERIENCE_MODE="advanced"
        echo -e "${BLUE}🔧 Advanced Mode Selected${NC}"
        echo ""
        
        # Action Selection
        echo -e "${CYAN}Choose Update Action:${NC}"
        if [[ "$current_version" == "$latest_version" ]]; then
            echo -e "  1) ${YELLOW}Rebuild current version${NC} (recommended - you have latest stable)"
            echo -e "  2) ${BLUE}Update to specific version${NC} (upgrade/downgrade)"
            echo -e "  3) ${PURPLE}Update to development version${NC} (main branch)"
            echo -e "  4) ${CYAN}Repair installation${NC} (fix services and rebuild)"
            echo ""
            read -p "Select action [1]: " action_input
            action_input=${action_input:-1}
            
            case $action_input in
                1) action_choice="rebuild"; version_choice="$current_version" ;;
                2) action_choice="select" ;;
                3) action_choice="development"; version_choice="main" ;;
                4) action_choice="repair"; version_choice="$current_version" ;;
                *) action_choice="rebuild"; version_choice="$current_version" ;;
            esac
        else
            echo -e "  1) ${GREEN}Update to latest stable${NC} (recommended - $latest_version)"
            echo -e "  2) ${BLUE}Select specific version${NC} (upgrade/downgrade)"
            echo -e "  3) ${PURPLE}Update to development version${NC} (main branch)"
            echo -e "  4) ${YELLOW}Rebuild current version${NC} (keep $current_version)"
            echo -e "  5) ${CYAN}Repair installation${NC} (fix services and rebuild)"
            echo ""
            read -p "Select action [1]: " action_input
            action_input=${action_input:-1}
            
            case $action_input in
                1) action_choice="update"; version_choice="$latest_version" ;;
                2) action_choice="select" ;;
                3) action_choice="development"; version_choice="main" ;;
                4) action_choice="rebuild"; version_choice="$current_version" ;;
                5) action_choice="repair"; version_choice="$current_version" ;;
                *) action_choice="update"; version_choice="$latest_version" ;;
            esac
        fi
        
        # Version Selection if needed
        if [[ "$action_choice" == "select" ]]; then
            echo ""
            echo -e "${CYAN}📋 Available Versions:${NC}"
            version_control_list_versions
            read -p "Enter version to install (e.g., v1.0.2, main): " version_input
            if [[ -z "$version_input" ]]; then
                error "No version specified"
                exit 1
            fi
            version_choice="$version_input"
        fi
        
        # Environment Preservation
        echo ""
        echo -e "${CYAN}Environment Configuration:${NC}"
        echo -e "  Do you want to preserve existing Firebase credentials and settings?"
        echo ""
        read -p "Preserve environment configuration? (y/n) [y]: " preserve_input
        preserve_env=${preserve_input:-y}
        if [[ "$preserve_env" =~ ^[Yy] ]]; then
            preserve_env="yes"
            SKIP_ENV_PRESERVATION=false
        else
            preserve_env="no"
            SKIP_ENV_PRESERVATION=true
        fi
        
        # Rollback Protection
        echo ""
        echo -e "${CYAN}Rollback Protection:${NC}"
        echo -e "  Enable automatic rollback if update fails?"
        echo ""
        read -p "Enable rollback protection? (y/n) [y]: " rollback_input
        enable_rollback=${rollback_input:-y}
        if [[ "$enable_rollback" =~ ^[Yy] ]]; then
            enable_rollback="yes"
            ROLLBACK_ENABLED=true
        else
            enable_rollback="no"
            ROLLBACK_ENABLED=false
        fi
        
        # Optimization Level
        echo ""
        echo -e "${CYAN}🔧 Optimization Level:${NC}"
        echo -e "  1) ${GREEN}Safe Optimization${NC} (recommended)"
        echo -e "  2) ${YELLOW}Aggressive Optimization${NC} (⚠️  use with caution)"
        echo ""
        read -p "Select optimization level [1]: " opt_level_input
        opt_level_input=${opt_level_input:-1}
        
        if [[ "$opt_level_input" == "2" ]]; then
            echo ""
            echo -e "${RED}⚠️  AGGRESSIVE OPTIMIZATION WARNING${NC}"
            read -p "Proceed with aggressive optimization? (y/n) [n]: " aggressive_confirm
            if [[ "$aggressive_confirm" =~ ^[Yy]$ ]]; then
                OPTIMIZATION_LEVEL="aggressive"
                warn "Aggressive optimization confirmed"
            else
                OPTIMIZATION_LEVEL="safe"
                success "Using safe optimization instead"
            fi
        else
            OPTIMIZATION_LEVEL="safe"
        fi
    fi
    
    # Show Summary
    echo ""
    echo -e "${WHITE}📋 UPDATE SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    
    case "$action_choice" in
        "update") echo -e "${BLUE}Action:${NC} Update to latest stable version" ;;
        "rebuild") echo -e "${BLUE}Action:${NC} Rebuild current version" ;;
        "development") echo -e "${BLUE}Action:${NC} Update to development version" ;;
        "select") echo -e "${BLUE}Action:${NC} Install specific version" ;;
        "repair") echo -e "${BLUE}Action:${NC} Repair installation" ;;
    esac
    
    echo -e "${BLUE}Target Version:${NC} $version_choice"
    echo -e "${BLUE}Environment Preservation:${NC} $preserve_env"
    echo -e "${BLUE}Rollback Protection:${NC} $enable_rollback"
    echo -e "${BLUE}Optimization Level:${NC} $OPTIMIZATION_LEVEL"
    echo ""
    
    # Final confirmation
    read -p "Proceed with update? (y/n) [y]: " final_confirm
    if [[ ! "$final_confirm" =~ ^[Yy]?$ ]]; then
        info "Update cancelled by user"
        exit 0
    fi
    
    # Set global variables
    TARGET_VERSION="$version_choice"
    USER_ACTION_CHOICE="$action_choice"
    
    success "Update confirmed. Installing version: $version_choice"
}

# Enhanced fresh installation using modular architecture
fresh_install() {
    OPERATION_TYPE="INSTALL"
    info "Starting fresh installation"
    
    # Create backup before installation
    manage_backups "install"
    
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

# Show completion status with comprehensive reporting
show_completion_status() {
    local operation_type="$1"
    local success="$2"
    
    echo ""
    echo -e "${WHITE}════════════════════════════════════════════════════════════════${NC}"
    
    if [[ "$success" == "true" ]]; then
        echo -e "${GREEN}✅ $operation_type COMPLETED SUCCESSFULLY${NC}"
        echo -e "${WHITE}════════════════════════════════════════════════════════════════${NC}"
        
        # Show installation summary
        show_installation_summary
        
        # Show access information
        show_access_information
        
        # Show next steps
        show_next_steps "$operation_type"
    else
        echo -e "${RED}❌ $operation_type FAILED${NC}"
        echo -e "${WHITE}════════════════════════════════════════════════════════════════${NC}"
        
        # Show failure information
        echo -e "${YELLOW}⚠️  Installation failed. Check the logs above for details.${NC}"
        if [[ "$ROLLBACK_ENABLED" == "true" ]]; then
            echo -e "${CYAN}🔄 Rollback protection was enabled. System should be restored to previous state.${NC}"
        fi
        echo -e "${BLUE}💡 For support, please check the installation logs and documentation.${NC}"
    fi
    
    echo -e "${WHITE}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Show installation summary
show_installation_summary() {
    echo -e "${CYAN}📊 INSTALLATION SUMMARY${NC}"
    echo -e "${CYAN}────────────────────────────────────────${NC}"
    
    # Version information
    if [[ -f "/opt/profolio/package.json" ]]; then
        local current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
        echo -e "${BLUE}Version:${NC} $current_version"
    fi
    
    # Platform information
    echo -e "${BLUE}Platform:${NC} $CURRENT_PLATFORM"
    
    # Optimization level
    echo -e "${BLUE}Optimization:${NC} ${OPTIMIZATION_LEVEL^}"
    
    # Installation size
    if [[ -d "/opt/profolio" ]]; then
        local app_size=$(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")
        echo -e "${BLUE}Installation Size:${NC} $app_size"
    fi
    
    # Service status
    echo -e "${BLUE}Services:${NC}"
    if systemctl is-active --quiet profolio-backend profolio-frontend 2>/dev/null; then
        echo -e "  ✅ Backend and Frontend services running"
    elif systemctl is-active --quiet profolio-backend 2>/dev/null; then
        echo -e "  ⚠️  Backend running, Frontend stopped"
    elif systemctl is-active --quiet profolio-frontend 2>/dev/null; then
        echo -e "  ⚠️  Frontend running, Backend stopped"
    else
        echo -e "  ❌ Services not running"
    fi
    
    echo ""
}

# Show access information
show_access_information() {
    echo -e "${CYAN}🌐 ACCESS INFORMATION${NC}"
    echo -e "${CYAN}────────────────────────────────────────${NC}"
    
    # Get local IP address
    local local_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    
    echo -e "${GREEN}🚀 Profolio Application:${NC}"
    echo -e "   ${WHITE}http://$local_ip:3000${NC}"
    echo -e "   ${WHITE}https://$local_ip:3000${NC} (if SSL configured)"
    echo ""
    
    echo -e "${GREEN}🔧 Management:${NC}"
    echo -e "   ${WHITE}Backend API: http://$local_ip:3001${NC}"
    echo -e "   ${WHITE}Health Check: http://$local_ip:3001/health${NC}"
    echo ""
    
    # SSH information
    echo -e "${GREEN}🔐 SSH Access:${NC}"
    echo -e "   ${WHITE}ssh profolio@$local_ip${NC}"
    if [[ -f "/home/profolio/.ssh/id_rsa" ]]; then
        echo -e "   ${YELLOW}Note: SSH key-only authentication enabled${NC}"
        echo -e "   ${YELLOW}Private key location: /home/profolio/.ssh/id_rsa${NC}"
    fi
    echo ""
}

# Show next steps based on operation type
show_next_steps() {
    local operation_type="$1"
    
    echo -e "${CYAN}📋 NEXT STEPS${NC}"
    echo -e "${CYAN}────────────────────────────────────────${NC}"
    
    case "$operation_type" in
        "INSTALL")
            echo -e "${GREEN}1. Configure Authentication:${NC}"
            echo -e "   • Set up Firebase authentication in the web interface"
            echo -e "   • Configure user accounts and permissions"
            echo ""
            echo -e "${GREEN}2. Initial Setup:${NC}"
            echo -e "   • Add your first portfolio and accounts"
            echo -e "   • Configure market data sources"
            echo -e "   • Set up backup schedules"
            ;;
        "UPDATE")
            echo -e "${GREEN}1. Verify Update:${NC}"
            echo -e "   • Check that all features are working correctly"
            echo -e "   • Verify data integrity"
            echo -e "   • Test authentication and access"
            echo ""
            echo -e "${GREEN}2. Post-Update Tasks:${NC}"
            echo -e "   • Review new features and capabilities"
            echo -e "   • Update any custom configurations if needed"
            ;;
        "REPAIR")
            echo -e "${GREEN}1. Verify Repair:${NC}"
            echo -e "   • Check that services are running properly"
            echo -e "   • Test application functionality"
            echo -e "   • Verify database connectivity"
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}📚 Documentation:${NC}"
    echo -e "   • Installation Guide: https://github.com/Obednal97/profolio/docs"
    echo -e "   • User Manual: https://github.com/Obednal97/profolio/wiki"
    echo -e "   • Support: https://github.com/Obednal97/profolio/issues"
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
                run_enhanced_configuration_wizard
            fi
            fresh_install
            ;;
        1|2)
            info "Action: Existing installation detected"
            if [[ "$AUTO_INSTALL" == "false" ]]; then
                run_enhanced_update_wizard
            fi
            
            # Determine action based on user choice
            case "${USER_ACTION_CHOICE:-update}" in
                "repair")
                    repair_installation
                    ;;
                "rebuild")
                    update_installation  # Rebuild is essentially an update to same version
                    ;;
                "development")
                    update_installation  # Update to development version
                    ;;
                "select")
                    update_installation  # Update to selected version
                    ;;
                *)
                    update_installation  # Default to update
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