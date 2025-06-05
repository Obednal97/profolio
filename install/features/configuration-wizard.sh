#!/bin/bash
#
# Profolio Installer - Configuration Wizard Feature Module
# 
# This module provides interactive configuration wizards for both new installations
# and updates, allowing users to choose between quick defaults or advanced customization.
#
# Version: 1.0.0
# Dependencies: utils/logging.sh, utils/ui.sh, utils/validation.sh
# Compatible: Ubuntu/Debian, Proxmox LXC, Docker

# Module information
CONFIG_MODULE_VERSION="1.0.0"
CONFIG_MODULE_NAME="Configuration Wizard"
CONFIG_MODULE_DESCRIPTION="Interactive configuration wizards for installation and updates"

# Module dependencies
CONFIG_DEPENDENCIES=(
    "utils/logging.sh"
    "utils/ui.sh"
    "utils/validation.sh"
)

# Configuration variables (set by wizards)
AUTO_INSTALL="${AUTO_INSTALL:-false}"
OPTIMIZATION_LEVEL="${OPTIMIZATION_LEVEL:-safe}"
INSTALLATION_MODE="${INSTALLATION_MODE:-quick}"

# Verify dependencies are loaded
config_check_dependencies() {
    local missing_deps=()
    
    # Check for required functions from dependencies
    if ! declare -f info >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing info function)")
    fi
    if ! declare -f success >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing success function)")
    fi
    if ! declare -f warn >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing warn function)")
    fi
    if ! declare -f error >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing error function)")
    fi
    if ! declare -f ui_show_banner >/dev/null 2>&1; then
        missing_deps+=("utils/ui.sh (missing ui_show_banner function)")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "ERROR: Missing dependencies for configuration wizard module:"
        printf " - %s\n" "${missing_deps[@]}"
        return 1
    fi
    
    return 0
}

# Get module information
config_get_info() {
    echo "Module: $CONFIG_MODULE_NAME"
    echo "Version: $CONFIG_MODULE_VERSION"
    echo "Description: $CONFIG_MODULE_DESCRIPTION"
    echo "Dependencies: ${CONFIG_DEPENDENCIES[*]}"
}

# Main installation configuration wizard
config_run_installation_wizard() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo -e "${WHITE}🔧 PROFOLIO CONFIGURATION WIZARD${NC}"
    echo -e "${YELLOW}Configure your Profolio installation${NC}"
    echo ""
    
    # Installation mode selection
    echo -e "${CYAN}Installation Mode:${NC}"
    echo "  1) ${GREEN}Quick Install${NC} (recommended defaults)"
    echo "  2) ${BLUE}Advanced Setup${NC} (custom configuration)"
    echo ""
    read -p "Select installation mode [1]: " install_mode
    install_mode=${install_mode:-1}
    
    if [ "$install_mode" = "1" ]; then
        config_run_quick_install
    else
        config_run_advanced_setup
    fi
}

# Quick installation with defaults
config_run_quick_install() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    AUTO_INSTALL=true
    OPTIMIZATION_LEVEL="safe"
    INSTALLATION_MODE="quick"
    
    echo ""
    echo -e "${GREEN}📋 Quick Install Mode Selected${NC}"
    echo -e "${CYAN}Final Settings:${NC}"
    echo -e "  • Installation: Default configuration"
    echo -e "  • Optimization: Safe (recommended)"
    echo -e "  • SSH: Enabled with key-only authentication"
    echo -e "  • Network: DHCP (automatic)"
    echo -e "  • Database: Auto-generated secure password"
    echo ""
    
    config_use_defaults
    success "Quick installation configured successfully"
}

# Advanced setup with customization options
config_run_advanced_setup() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo ""
    echo -e "${BLUE}🔧 Advanced Mode Selected${NC}"
    echo ""
    
    # Optimization level selection
    config_select_optimization_level
    
    # Additional advanced options can be added here
    echo ""
    echo -e "${BLUE}📋 Advanced Mode Configuration:${NC}"
    echo -e "${CYAN}Final Settings:${NC}"
    echo -e "  • Installation: Advanced configuration"
    echo -e "  • Optimization: $OPTIMIZATION_LEVEL"
    echo -e "  • SSH: Enabled with key-only authentication"
    echo -e "  • Network: DHCP (automatic)"
    echo ""
    
    # For now, use defaults with the chosen optimization
    # TODO: Implement full advanced configuration options
    echo -e "${YELLOW}⚠️  Full advanced setup coming soon. Using secure defaults with $OPTIMIZATION_LEVEL optimization.${NC}"
    config_use_defaults
}

# Optimization level selection
config_select_optimization_level() {
    if ! config_check_dependencies; then
        return 1
    fi
    
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
    
    if [ "$opt_choice" = "2" ]; then
        config_confirm_aggressive_optimization
    else
        OPTIMIZATION_LEVEL="safe"
        success "Safe optimization selected"
    fi
}

# Confirm aggressive optimization with detailed warning
config_confirm_aggressive_optimization() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo ""
    echo -e "${RED}⚠️  AGGRESSIVE OPTIMIZATION WARNING${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}This mode applies ultra-aggressive size reduction techniques:${NC}"
    echo ""
    echo -e "${RED}What it does:${NC}"
    echo -e "  • Safe removal of ALL development dependencies"
    echo -e "  • Docker-style aggressive cleanup and deduplication"
    echo -e "  • Removes source maps, debug info, and test files"
    echo -e "  • Compresses assets and removes platform-specific binaries"
    echo -e "  • Cleans caches and temporary build artifacts"
    echo ""
    echo -e "${YELLOW}Potential trade-offs:${NC}"
    echo -e "  • May remove dependencies needed for edge-case features"
    echo -e "  • Debugging and development tools removed"
    echo -e "  • Some advanced troubleshooting capabilities lost"
    echo -e "  • Harder to diagnose issues if they occur"
    echo ""
    echo -e "${GREEN}Best for:${NC}"
    echo -e "  • Production environments with storage constraints"
    echo -e "  • Docker containers where size matters"
    echo -e "  • VPS with limited disk space"
    echo -e "  • When you prioritise disk usage over debugging capability"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    read -p "Proceed with aggressive optimization? (y/n) [n]: " aggressive_confirm
    if [[ "$aggressive_confirm" =~ ^[Yy]$ ]]; then
        OPTIMIZATION_LEVEL="aggressive"
        warn "Aggressive optimization confirmed - proceed with caution"
    else
        OPTIMIZATION_LEVEL="safe"
        success "Using safe optimization instead"
    fi
}

# Update wizard for existing installations
config_run_update_wizard() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo -e "${WHITE}🔄 PROFOLIO UPDATE WIZARD${NC}"
    echo -e "${YELLOW}Update your existing Profolio installation${NC}"
    echo ""
    
    # Show current version info
    local current_version="unknown"
    local latest_version="checking..."
    
    if [ -f "/opt/profolio/package.json" ]; then
        current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
        echo -e "${BLUE}Current Version:${NC} $current_version"
    fi
    
    # Get latest version
    info "Checking for updates..."
    latest_version=$(curl -s --connect-timeout 5 --max-time 10 "https://api.github.com/repos/Obednal97/profolio/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//' 2>/dev/null || echo "unknown")
    
    if [ "$latest_version" != "unknown" ]; then
        echo -e "${BLUE}Latest Stable Version:${NC} $latest_version"
    else
        echo -e "${BLUE}Latest Stable Version:${NC} Unable to check"
    fi
    echo ""
    
    # Experience level selection
    echo -e "${CYAN}🎛️ Choose Your Experience:${NC}"
    echo -e "  1) ${GREEN}Default Mode${NC} (recommended - quick update with sensible defaults)"
    echo -e "  2) ${BLUE}Advanced Mode${NC} (full control over all options)"
    echo ""
    read -p "Select mode [1]: " experience_mode
    experience_mode=${experience_mode:-1}
    
    if [ "$experience_mode" = "1" ]; then
        config_run_default_update "$current_version" "$latest_version"
    else
        config_run_advanced_update "$current_version" "$latest_version"
    fi
}

# Default update mode with sensible defaults
config_run_default_update() {
    local current_version="$1"
    local latest_version="$2"
    
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo -e "${GREEN}📋 Default Mode Selected${NC}"
    echo ""
    
    # Set default action based on current state
    if [ "$current_version" = "$latest_version" ]; then
        UPDATE_ACTION="rebuild"
        UPDATE_VERSION="$current_version"
        echo -e "${YELLOW}ℹ️  You have the latest stable version${NC}"
        echo -e "${CYAN}Default Action:${NC} Rebuild current version"
    else
        UPDATE_ACTION="update"
        UPDATE_VERSION="$latest_version"
        echo -e "${CYAN}Default Action:${NC} Update to latest stable version ($latest_version)"
    fi
    
    echo -e "${CYAN}Environment Preservation:${NC} Yes (Firebase credentials preserved)"
    echo -e "${CYAN}Rollback Protection:${NC} Yes (automatic rollback on failure)"
    echo -e "${CYAN}Optimization Level:${NC} Safe (recommended)"
    echo ""
    
    # Default mode automatically uses safe optimization
    OPTIMIZATION_LEVEL="safe"
    PRESERVE_ENV="yes"
    ENABLE_ROLLBACK="yes"
    
    read -p "Proceed with default settings? (y/n) [y]: " default_confirm
    if [[ ! "$default_confirm" =~ ^[Yy]?$ ]]; then
        info "Update cancelled by user"
        return 1
    fi
    
    success "Default update configuration selected"
}

# Advanced update mode with full customization
config_run_advanced_update() {
    local current_version="$1"
    local latest_version="$2"
    
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo -e "${BLUE}🔧 Advanced Mode Selected${NC}"
    echo ""
    
    # Action selection
    config_select_update_action "$current_version" "$latest_version"
    
    # Environment preservation selection
    config_select_environment_preservation
    
    # Rollback protection selection
    config_select_rollback_protection
    
    # Optimization level selection
    config_select_optimization_level
    
    # Show summary
    config_show_update_summary
}

# Select update action
config_select_update_action() {
    local current_version="$1"
    local latest_version="$2"
    
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo -e "${CYAN}Choose Update Action:${NC}"
    
    # Check if services are running to offer repair option
    local services_running=false
    if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
        services_running=true
    fi
    
    if [ "$current_version" = "$latest_version" ]; then
        echo -e "  1) ${YELLOW}Rebuild current version${NC} (recommended - you have latest stable)"
        echo -e "  2) ${BLUE}Update to specific version${NC} (upgrade/downgrade)"
        echo -e "  3) ${PURPLE}Update to development version${NC} (main branch)"
        if [ "$services_running" = false ]; then
            echo -e "  4) ${CYAN}Repair installation${NC} (fix services and rebuild)"
        fi
        echo ""
        read -p "Select action [1]: " action_input
        action_input=${action_input:-1}
        
        case $action_input in
            1) UPDATE_ACTION="rebuild"; UPDATE_VERSION="$current_version" ;;
            2) UPDATE_ACTION="select"; config_select_specific_version ;;
            3) UPDATE_ACTION="development"; UPDATE_VERSION="main" ;;
            4) if [ "$services_running" = false ]; then UPDATE_ACTION="repair"; UPDATE_VERSION="$current_version"; fi ;;
            *) UPDATE_ACTION="rebuild"; UPDATE_VERSION="$current_version" ;;
        esac
    else
        echo -e "  1) ${GREEN}Update to latest stable${NC} (recommended - $latest_version)"
        echo -e "  2) ${BLUE}Select specific version${NC} (upgrade/downgrade)"
        echo -e "  3) ${PURPLE}Update to development version${NC} (main branch)"
        echo -e "  4) ${YELLOW}Rebuild current version${NC} (keep $current_version)"
        if [ "$services_running" = false ]; then
            echo -e "  5) ${CYAN}Repair installation${NC} (fix services and rebuild)"
        fi
        echo ""
        read -p "Select action [1]: " action_input
        action_input=${action_input:-1}
        
        case $action_input in
            1) UPDATE_ACTION="update"; UPDATE_VERSION="$latest_version" ;;
            2) UPDATE_ACTION="select"; config_select_specific_version ;;
            3) UPDATE_ACTION="development"; UPDATE_VERSION="main" ;;
            4) UPDATE_ACTION="rebuild"; UPDATE_VERSION="$current_version" ;;
            5) if [ "$services_running" = false ]; then UPDATE_ACTION="repair"; UPDATE_VERSION="$current_version"; fi ;;
            *) UPDATE_ACTION="update"; UPDATE_VERSION="$latest_version" ;;
        esac
    fi
}

# Select specific version
config_select_specific_version() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo ""
    echo -e "${CYAN}📋 Available Versions:${NC}"
    echo "  • latest (current stable release)"
    echo "  • main (development branch)"
    echo "  • v1.10.3, v1.10.2, v1.10.1, etc. (specific releases)"
    echo ""
    read -p "Enter version to install (e.g., v1.10.2, main): " version_input
    if [ -z "$version_input" ]; then
        error "No version specified"
        return 1
    fi
    UPDATE_VERSION="$version_input"
}

# Select environment preservation
config_select_environment_preservation() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo ""
    echo -e "${CYAN}Environment Configuration:${NC}"
    echo -e "  Do you want to preserve existing Firebase credentials and settings?"
    echo -e "  ${GREEN}Recommended: Yes${NC} (prevents authentication breaking)"
    echo ""
    read -p "Preserve environment configuration? (y/n) [y]: " preserve_input
    preserve_input=${preserve_input:-y}
    if [[ "$preserve_input" =~ ^[Yy] ]]; then
        PRESERVE_ENV="yes"
    else
        PRESERVE_ENV="no"
        SKIP_ENV_PRESERVATION="true"
    fi
}

# Select rollback protection
config_select_rollback_protection() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo ""
    echo -e "${CYAN}Rollback Protection:${NC}"
    echo -e "  Enable automatic rollback if update fails?"
    echo -e "  ${GREEN}Recommended: Yes${NC} (safer updates)"
    echo ""
    read -p "Enable rollback protection? (y/n) [y]: " rollback_input
    rollback_input=${rollback_input:-y}
    if [[ "$rollback_input" =~ ^[Yy] ]]; then
        ENABLE_ROLLBACK="yes"
    else
        ENABLE_ROLLBACK="no"
    fi
}

# Show update summary
config_show_update_summary() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo ""
    echo -e "${WHITE}📋 UPDATE SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    
    case "${UPDATE_ACTION:-update}" in
        "update") echo -e "${BLUE}Action:${NC} Update to latest stable version" ;;
        "rebuild") echo -e "${BLUE}Action:${NC} Rebuild current version" ;;
        "development") echo -e "${BLUE}Action:${NC} Update to development version" ;;
        "select") echo -e "${BLUE}Action:${NC} Install specific version" ;;
        "repair") echo -e "${BLUE}Action:${NC} Repair installation" ;;
    esac
    
    echo -e "${BLUE}Target Version:${NC} ${UPDATE_VERSION:-latest}"
    echo -e "${BLUE}Environment Preservation:${NC} ${PRESERVE_ENV:-yes}"
    echo -e "${BLUE}Rollback Protection:${NC} ${ENABLE_ROLLBACK:-yes}"
    echo -e "${BLUE}Optimization Level:${NC} ${OPTIMIZATION_LEVEL:-safe}"
    echo ""
    
    echo -e "${CYAN}Update Process:${NC}"
    if [ "${ENABLE_ROLLBACK:-yes}" = "yes" ]; then
        echo "  1. 🛡️  Create rollback point (automatic)"
        echo "  2. ⬇️  Download and verify new version"
        echo "  3. 🔄 Update application files"
        echo "  4. 🔧 Apply optimizations ($OPTIMIZATION_LEVEL level)"
        echo "  5. 🚀 Restart services and verify"
        echo "  6. ✅ Complete (rollback available if needed)"
    else
        echo "  1. ⬇️  Download and verify new version"
        echo "  2. 🔄 Update application files"
        echo "  3. 🔧 Apply optimizations ($OPTIMIZATION_LEVEL level)"
        echo "  4. 🚀 Restart services and verify"
        echo "  5. ✅ Complete"
    fi
    
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo ""
    
    read -p "Proceed with this configuration? (y/n) [y]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]?$ ]]; then
        echo -e "${YELLOW}⚠️  Update cancelled by user${NC}"
        return 1
    fi
    
    success "Update configuration confirmed"
}

# Set default configuration values
config_use_defaults() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    # Container/System configuration
    CONTAINER_NAME="${CONTAINER_NAME:-Profolio}"
    CPU_CORES="${CPU_CORES:-2}"
    MEMORY_MB="${MEMORY_MB:-4096}"
    STORAGE_GB="${STORAGE_GB:-20}"
    
    # Network configuration
    NETWORK_MODE="${NETWORK_MODE:-dhcp}"
    IPV6_ENABLED="${IPV6_ENABLED:-no}"
    DNS_SERVERS="${DNS_SERVERS:-8.8.8.8,1.1.1.1}"
    DNS_DOMAIN="${DNS_DOMAIN:-local}"
    
    # SSH configuration
    SSH_ENABLED="${SSH_ENABLED:-yes}"
    SSH_PORT="${SSH_PORT:-22}"
    SSH_ROOT_LOGIN="${SSH_ROOT_LOGIN:-no}"
    SSH_PASSWORD_AUTH="${SSH_PASSWORD_AUTH:-no}"
    SSH_KEY_ONLY="${SSH_KEY_ONLY:-yes}"
    GENERATE_SSH_KEY="${GENERATE_SSH_KEY:-yes}"
    
    # Database configuration
    if [ -z "${DB_PASSWORD:-}" ]; then
        DB_PASSWORD=$(openssl rand -base64 12)
        info "Generated new database password"
    fi
    
    success "Using recommended default configuration"
    info "SSH enabled with key-only authentication"
}

# Show configuration summary
config_show_summary() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    echo -e "\n${WHITE}📋 CONFIGURATION SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo -e "${BLUE}Container:${NC} ${CONTAINER_NAME:-Profolio}"
    echo -e "${BLUE}CPU Cores:${NC} ${CPU_CORES:-2}"
    echo -e "${BLUE}Memory:${NC} ${MEMORY_MB:-4096}MB"
    echo -e "${BLUE}Storage:${NC} ${STORAGE_GB:-20}GB"
    echo -e "${BLUE}Network:${NC} ${NETWORK_MODE:-dhcp}"
    
    if [ "${NETWORK_MODE:-dhcp}" = "static" ]; then
        echo -e "${BLUE}Static IP:${NC} ${STATIC_IP:-not set}"
        echo -e "${BLUE}Gateway:${NC} ${GATEWAY:-not set}"
        echo -e "${BLUE}Subnet:${NC} ${SUBNET_MASK:-not set}"
    fi
    
    echo -e "${BLUE}IPv6:${NC} ${IPV6_ENABLED:-no}"
    echo -e "${BLUE}DNS:${NC} ${DNS_SERVERS:-8.8.8.8,1.1.1.1}"
    echo -e "${BLUE}Domain:${NC} ${DNS_DOMAIN:-local}"
    
    # SSH Configuration Summary
    echo -e "${BLUE}SSH Access:${NC} ${SSH_ENABLED:-yes}"
    if [ "${SSH_ENABLED:-yes}" = "yes" ]; then
        echo -e "${BLUE}SSH Port:${NC} ${SSH_PORT:-22}"
        echo -e "${BLUE}Root Login:${NC} ${SSH_ROOT_LOGIN:-no}"
        if [ "${SSH_KEY_ONLY:-yes}" = "yes" ]; then
            echo -e "${BLUE}Authentication:${NC} Key-only (secure)"
        elif [ "${SSH_PASSWORD_AUTH:-no}" = "yes" ]; then
            echo -e "${BLUE}Authentication:${NC} Password enabled"
        fi
        if [ "${GENERATE_SSH_KEY:-yes}" = "yes" ]; then
            echo -e "${BLUE}SSH Keys:${NC} Will be generated"
        fi
    fi
    
    echo -e "${BLUE}Optimization:${NC} ${OPTIMIZATION_LEVEL:-safe}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo ""
    
    read -p "Proceed with this configuration? (y/n) [y]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]?$ ]]; then
        echo -e "${YELLOW}⚠️  Configuration cancelled by user${NC}"
        return 1
    fi
    
    return 0
}

# Check if update is available
config_check_version_update() {
    if ! config_check_dependencies; then
        return 1
    fi
    
    local current_version=""
    local latest_version=""
    
    # Get current version if installed
    if [ -f "/opt/profolio/package.json" ]; then
        current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
    fi
    
    # Get latest version from GitHub (with timeout)
    latest_version=$(curl -s --connect-timeout 5 --max-time 10 "https://api.github.com/repos/Obednal97/profolio/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//' 2>/dev/null || echo "unknown")
    
    # Compare versions
    if [ "$current_version" != "unknown" ] && [ "$latest_version" != "unknown" ]; then
        if [ "$current_version" = "$latest_version" ]; then
            return 1  # No update available
        else
            return 0  # Update available
        fi
    fi
    
    return 0  # Assume update available if we can't determine
}

# Backward compatibility aliases
run_configuration_wizard() { config_run_installation_wizard "$@"; }
run_update_wizard() { config_run_update_wizard "$@"; }
use_defaults() { config_use_defaults "$@"; }
show_configuration_summary() { config_show_summary "$@"; }
check_version_update_available() { config_check_version_update "$@"; }

# Module initialization check
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Profolio Installer - Configuration Wizard Feature Module v$CONFIG_MODULE_VERSION"
    echo "This module should be sourced, not executed directly."
    exit 1
fi 