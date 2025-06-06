#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER v1.11.8
# =============================================================================
# Modular installer with centralized definitions for reliable execution
# Uses common/definitions.sh to prevent variable scoping issues
# Fixed: Database password updates, Node.js conflicts, proper module loading
# =============================================================================

set -eo pipefail

# Configuration (these will be loaded from common/definitions.sh)
INSTALLER_VERSION="1.11.13"
REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
readonly TEMP_DIR="/tmp/profolio-installer-$$"
readonly LOG_FILE="/tmp/profolio-install.log"

# Temporary colors (will be replaced by common/definitions.sh)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
MAGENTA='\033[0;35m'
PURPLE='\033[0;35m'
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

# Enhanced cleanup function with error handling
cleanup() {
    local exit_code=$?
    
    # Log cleanup start
    if [[ $exit_code -ne 0 ]]; then
        warning "Installation interrupted with exit code $exit_code"
    fi
    
    # Clean up temporary directory
    if [[ -d "$TEMP_DIR" ]]; then
        if rm -rf "$TEMP_DIR" 2>/dev/null; then
            debug "Temporary directory cleaned up successfully"
        else
            warning "Failed to clean up temporary directory: $TEMP_DIR"
        fi
    fi
    
    # Clean up temporary loading files
    rm -f /tmp/loading_complete /tmp/download_progress.log* 2>/dev/null || true
    
    # If installation failed, provide helpful information
    if [[ $exit_code -ne 0 ]] && [[ "${INSTALLATION_STARTED:-false}" == "true" ]]; then
        echo ""
        warning "Installation was interrupted. To resume or troubleshoot:"
        echo -e "${BLUE}• Check log file:${NC} $LOG_FILE"
        echo -e "${BLUE}• Try emergency mode:${NC} Run the installer again"
        if command -v rollback_list_rollback_points >/dev/null 2>&1; then
            echo -e "${BLUE}• Rollback if needed:${NC} Use rollback system"
        fi
    fi
    
    exit $exit_code
}

# Enhanced trap handling
trap cleanup EXIT
trap 'exit 130' INT  # Handle Ctrl+C gracefully
trap 'exit 143' TERM # Handle termination gracefully

# Platform detection - now using centralized module
# Note: The actual detection logic is in utils/platform-detection.sh
# This is just a fallback if the module isn't loaded yet
detect_platform() {
    # Fallback detection if utils/platform-detection.sh not available
    if [[ -f "/proc/1/environ" ]] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        echo "lxc_container"
    elif [[ -f "/etc/pve/version" ]]; then
        echo "proxmox"
    elif [[ -f "/.dockerenv" ]]; then
        echo "docker"
    else
        echo "ubuntu"  # Simple fallback
    fi
}

# Download all modules with enhanced UI
download_all_modules() {
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
        "platforms/lxc_container.sh"
        
        # Feature modules
        "features/optimization.sh"
        "features/ssh-hardening.sh"
        "features/configuration-wizard.sh"
        "features/backup-management.sh"
        "features/installation-reporting.sh"
    )
    
    local total=${#modules[@]}
    local temp_log="/tmp/download_progress.log"
    
    # Start the download process with spinner
    echo -ne "${BLUE}Downloading $total installer modules${NC} "
    
    # Download in background with progress
    {
        for module in "${modules[@]}"; do
            local module_dir=$(dirname "$module")
            if [[ "$module_dir" != "." ]]; then
                mkdir -p "$module_dir"
            fi
            
            curl -fsSL "$REPO_URL/install/$module" -o "$module" 2>/dev/null || echo "Failed: $module" >> "$temp_log"
            
            # Make executable if it's a shell script
            if [[ "$module" == *.sh ]]; then
                chmod +x "$module"
            fi
        done
        echo "DONE" > "$temp_log.complete"
    } &
    
    local download_pid=$!
    
    # Show spinner while downloading
    local spin='-\|/'
    local i=0
    while ! [[ -f "$temp_log.complete" ]]; do
        i=$(((i+1) % 4))
        printf "\r${BLUE}Downloading $total installer modules${NC} ${YELLOW}${spin:$i:1}${NC}"
        sleep 0.1
    done
    
    printf "\r\033[K${BLUE}Downloading $total installer modules${NC} ${GREEN}✓${NC}\n"
    echo -e "${GREEN}[SUCCESS]${NC} All modules downloaded ($total files)"
    
    # Clean up temp files
    rm -f "$temp_log" "$temp_log.complete"
    
    return 0
}

# Load essential functions without complex validation
load_essential_functions() {
    echo -ne "${BLUE}Loading installer functions${NC} "
    
    # Start spinner
    local spin='-\|/'
    local i=0
    
    {
        # CRITICAL: Source common definitions FIRST!
        if [[ -f "common/definitions.sh" ]]; then
            source "common/definitions.sh" 2>/dev/null || return 1
        fi
        
        # Priority utility modules (load these first for best experience)
        local priority_utils=(
            "utils/logging.sh"           # Professional logging system
            "utils/platform-detection.sh" # Comprehensive platform detection
            "utils/validation.sh"        # Enterprise validation
            "utils/ui.sh"               # Enhanced UI components
        )
        
        for util in "${priority_utils[@]}"; do
            if [[ -f "$util" ]]; then
                source "$util" 2>/dev/null || true
            fi
        done
        
        # Load remaining utility modules
        for util in utils/*.sh; do
            if [[ -f "$util" ]]; then
                source "$util" 2>/dev/null || true
            fi
        done
        
        # Priority feature modules (excellent professional features)
        local priority_features=(
            "features/configuration-wizard.sh" # Outstanding user experience
            "features/backup-management.sh"    # Enterprise backup system
            "features/installation-reporting.sh" # Professional reporting
        )
        
        for feature in "${priority_features[@]}"; do
            if [[ -f "$feature" ]]; then
                source "$feature" 2>/dev/null || true
            fi
        done
        
        # Source core installer (the main application installer)
        if [[ -f "core/profolio-installer.sh" ]]; then
            source "core/profolio-installer.sh" 2>/dev/null || true
        fi
        
        # Source additional core modules
        for core in core/*.sh; do
            if [[ -f "$core" && "$core" != "core/profolio-installer.sh" ]]; then
                source "$core" 2>/dev/null || true
            fi
        done
        
        # Load remaining feature modules
        for feature in features/*.sh; do
            if [[ -f "$feature" ]]; then
                source "$feature" 2>/dev/null || true
            fi
        done
        
        # Source platform modules (including emergency)
        for platform in platforms/*.sh; do
            if [[ -f "$platform" ]]; then
                source "$platform" 2>/dev/null || true
            fi
        done
        
        echo "LOADED" > /tmp/loading_complete
    } &
    
    local load_pid=$!
    
    # Show spinner while loading
    while ! [[ -f /tmp/loading_complete ]]; do
        i=$(((i+1) % 4))
        printf "\r${BLUE}Loading installer functions${NC} ${YELLOW}${spin:$i:1}${NC}"
        sleep 0.1
    done
    
    printf "\r${BLUE}Loading installer functions${NC} ${GREEN}✓${NC}\n"
    rm -f /tmp/loading_complete
    
    # Export critical functions after loading with verification
    local critical_functions=(
        # Core installation functions
        "install_profolio_application"
        
        # Platform handlers  
        "handle_ubuntu_platform" 
        "handle_lxc_container_platform"
        "handle_proxmox_installation"
        
        # Professional feature functions
        "run_configuration_wizard"
        "config_run_installation_wizard"
        "backup_create_backup"
        "backup_list_backups"
        "reporting_show_installation_summary"
        
        # Advanced feature functions
        "version_control_get_latest_version"
        "version_control_get_current_version"
        "version_control_switch_version"
        "rollback_create_rollback_point"
        "rollback_list_rollback_points"
        "optimization_deploy_safe"
        "ssh_configure_server"
        
        # Enhanced platform detection
        "get_platform_type"
        "detect_proxmox_host"
        "detect_lxc_container"
        
        # Validation functions
        "validation_validate_version"
        "validation_validate_ip"
    )
    
    local exported_count=0
    for func in "${critical_functions[@]}"; do
        if command -v "$func" >/dev/null 2>&1; then
            export -f "$func"
            exported_count=$((exported_count + 1))
            debug "Exported function: $func"
        else
            debug "Function not available for export: $func"
        fi
    done
    
    info "Professional modules loaded: $exported_count/${#critical_functions[@]} functions available"
    
    # Report on professional and advanced features availability
    echo ""
    echo -e "${WHITE}🏆 Available Features${NC}"
    echo "────────────────────────────────────────────────────────────────"
    
    # Core professional features
    local core_features=()
    if command -v run_configuration_wizard >/dev/null 2>&1; then
        core_features+=("🧙 Configuration Wizard")
    fi
    if command -v backup_create_backup >/dev/null 2>&1; then
        core_features+=("🛡️ Backup Management")
    fi
    if command -v get_platform_type >/dev/null 2>&1; then
        core_features+=("🎯 Enhanced Detection")
    fi
    if command -v validation_validate_version >/dev/null 2>&1; then
        core_features+=("✅ Enterprise Validation")
    fi
    
    # Advanced features
    local advanced_features=()
    if command -v version_control_get_latest_version >/dev/null 2>&1; then
        advanced_features+=("🔄 Version Control")
    fi
    if command -v rollback_create_rollback_point >/dev/null 2>&1; then
        advanced_features+=("⏪ Rollback System")
    fi
    if command -v optimization_deploy_safe >/dev/null 2>&1; then
        advanced_features+=("⚡ Performance Optimization")
    fi
    if command -v ssh_configure_server >/dev/null 2>&1; then
        advanced_features+=("🔐 SSH Hardening")
    fi
    
    # Display core features
    if [[ ${#core_features[@]} -gt 0 ]]; then
        echo -e "${BLUE}Core Features:${NC} ${core_features[*]}"
    fi
    
    # Display advanced features
    if [[ ${#advanced_features[@]} -gt 0 ]]; then
        echo -e "${BLUE}Advanced Features:${NC} ${advanced_features[*]}"
    fi
    
    # Summary
    local total_features=$((${#core_features[@]} + ${#advanced_features[@]}))
    if [[ $total_features -gt 0 ]]; then
        echo -e "${GREEN}✓${NC} $total_features professional features loaded"
    else
        echo -e "${YELLOW}⚠${NC} Running in basic mode - advanced features not available"
    fi
    
    # Also export all color variables and logging functions for subshells
    export RED GREEN YELLOW BLUE CYAN WHITE GRAY MAGENTA PURPLE NC
    export -f log error info success warning warn debug 2>/dev/null || true
}

# Execute platform installation
install_for_platform() {
    local detected_platform="$1"
    shift  # Remove platform from arguments
    
    # Suppress verbose logging for clean UI
    # log "Starting installation for platform: $detected_platform"
    
    # Try direct platform file first
    local platform_file="platforms/${detected_platform}.sh"
    if [[ -f "$platform_file" ]]; then
        # log "Using direct platform installer: $platform_file"
        source "$platform_file"
        
        # Call the platform handler function
        local handler_function="handle_${detected_platform}_platform"
        if command -v "$handler_function" >/dev/null 2>&1; then
            # log "Executing $handler_function..."
            if "$handler_function" "$@"; then
                # success "Platform installation completed successfully"
                return 0
            else
                # warning "Platform installation failed"
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

# Enhanced emergency installation mode
install_emergency_mode() {
    warning "🚨 Activating emergency installation mode"
    echo ""
    
    # Try to download emergency installer if not available
    if [[ ! -f "platforms/emergency.sh" ]]; then
        info "Downloading emergency installer..."
        if curl -fsSL "$REPO_URL/install/platforms/emergency.sh" -o "platforms/emergency.sh" 2>/dev/null; then
            chmod +x "platforms/emergency.sh"
            success "Emergency installer downloaded"
        else
            warning "Failed to download emergency installer"
        fi
    fi
    
    # Try emergency installer
    if [[ -f "platforms/emergency.sh" ]]; then
        source "platforms/emergency.sh"
        
        if command -v handle_emergency_installation >/dev/null 2>&1; then
            info "Running emergency installation with minimal dependencies..."
            if handle_emergency_installation "$@"; then
                success "🎉 Emergency installation completed successfully!"
                echo ""
                info "Emergency mode installed basic functionality only"
                warning "Some advanced features may not be available"
                return 0
            else
                error "❌ Emergency installation also failed"
            fi
        else
            error "Emergency installation function not available after loading"
        fi
    fi
    
    # Final fallback - try basic Ubuntu installation directly
    warning "Attempting final fallback installation..."
    if [[ -f "platforms/ubuntu.sh" ]]; then
        source "platforms/ubuntu.sh" 2>/dev/null || true
        if command -v handle_ubuntu_platform >/dev/null 2>&1; then
            info "Using basic Ubuntu platform installer..."
            if handle_ubuntu_platform "$@"; then
                success "🎉 Basic installation completed!"
                echo ""
                warning "Installation completed in basic mode - some features may be limited"
                return 0
            fi
        fi
    fi
    
    error "❌ All installation methods exhausted"
    echo ""
    echo -e "${WHITE}Final troubleshooting steps:${NC}"
    echo -e "${BLUE}1.${NC} Check internet connectivity: ping github.com"
    echo -e "${BLUE}2.${NC} Verify sufficient disk space: df -h"
    echo -e "${BLUE}3.${NC} Check system requirements: Ubuntu 20.04+ with 2GB RAM"
    echo -e "${BLUE}4.${NC} Try manual installation from repository"
    return 1
}

# Show enhanced help when installation fails
show_failure_help() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    ⚠️  INSTALLATION FAILED                      ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Show diagnostic information
    echo -e "${WHITE}🔍 Diagnostic Information${NC}"
    echo "────────────────────────────────────────────────────────────────"
    
    # Platform info
    echo -e "${BLUE}Platform:${NC} ${platform:-unknown}"
    
    # Available space
    if command -v df >/dev/null 2>&1; then
        local disk_space=$(df -h /opt 2>/dev/null | tail -1 | awk '{print $4}' || echo "Unknown")
        echo -e "${BLUE}Available Space:${NC} $disk_space"
    fi
    
    # Memory info
    if command -v free >/dev/null 2>&1; then
        local memory=$(free -h | grep Mem | awk '{print $7}' || echo "Unknown")
        echo -e "${BLUE}Available Memory:${NC} $memory"
    fi
    
    # Check if modules were loaded
    local modules_loaded=0
    if command -v install_profolio_application >/dev/null 2>&1; then modules_loaded=$((modules_loaded + 1)); fi
    if command -v run_configuration_wizard >/dev/null 2>&1; then modules_loaded=$((modules_loaded + 1)); fi
    if command -v backup_create_backup >/dev/null 2>&1; then modules_loaded=$((modules_loaded + 1)); fi
    echo -e "${BLUE}Modules Loaded:${NC} $modules_loaded professional modules available"
    
    # Check internet connectivity
    if ping -c 1 github.com >/dev/null 2>&1; then
        echo -e "${BLUE}Internet:${NC} ${GREEN}Connected${NC}"
    else
        echo -e "${BLUE}Internet:${NC} ${RED}Connection issues detected${NC}"
    fi
    
    echo ""
    echo -e "${WHITE}📋 Common Solutions${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}•${NC} Ensure sufficient disk space (>2GB recommended)"
    echo -e "${BLUE}•${NC} Check internet connectivity for package downloads"
    echo -e "${BLUE}•${NC} Run as root user: ${GRAY}sudo bash install.sh${NC}"
    echo -e "${BLUE}•${NC} Try emergency mode: Install manually and run emergency installer"
    echo ""
    
    echo -e "${WHITE}📞 Get Support${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}GitHub Issues:${NC} https://github.com/Obednal97/profolio/issues"
    echo -e "${BLUE}Log File:${NC} $LOG_FILE"
    echo -e "${BLUE}Installation Mode:${NC} ${INSTALLATION_MODE:-standard}"
    echo ""
    
    echo -e "${WHITE}🔧 Manual Installation${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}1.${NC} Clone repository: ${GRAY}git clone https://github.com/Obednal97/profolio.git${NC}"
    echo -e "${BLUE}2.${NC} See documentation: ${GRAY}docs/INSTALLATION.md${NC}"
    echo -e "${BLUE}3.${NC} Try emergency installer: ${GRAY}bash install/platforms/emergency.sh${NC}"
    echo ""
}

# Main installer function
main() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                 🚀 PROFOLIO INSTALLER v$INSTALLER_VERSION                 ║"
    echo "║              Self-Hosted Portfolio Management                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Mark installation as started for cleanup handling
    export INSTALLATION_STARTED="true"
    
    # Log installation start
    info "Installation started at $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Enhanced security checks
    echo ""
    info "🔒 Performing security validation..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root for system-level installation"
        echo ""
        echo -e "${BLUE}Please run with sudo:${NC}"
        echo "  sudo bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)\""
        exit 1
    fi
    
    # Validate system security basics
    local security_warnings=()
    
    # Check if we're in a secure environment
    if [[ -n "${SSH_CONNECTION:-}" ]] && [[ "${ENABLE_SSH_HARDENING:-false}" != "true" ]]; then
        security_warnings+=("Running over SSH without hardening enabled")
    fi
    
    # Check for existing weak configurations
    if [[ -f "/etc/ssh/sshd_config" ]] && grep -q "PermitRootLogin yes" /etc/ssh/sshd_config 2>/dev/null; then
        security_warnings+=("SSH root login is enabled")
    fi
    
    # Check firewall status
    if command -v ufw >/dev/null 2>&1 && ! ufw status | grep -q "Status: active" 2>/dev/null; then
        security_warnings+=("UFW firewall is not active")
    fi
    
    # Report security warnings
    if [[ ${#security_warnings[@]} -gt 0 ]]; then
        warning "Security recommendations:"
        for warning in "${security_warnings[@]}"; do
            echo -e "   ${YELLOW}•${NC} $warning"
        done
        echo ""
        if [[ "${INSTALLATION_MODE:-}" == "advanced" ]]; then
            echo -e "${BLUE}These can be addressed through SSH hardening and optimization features.${NC}"
        fi
        echo ""
    fi
    
    success "Security validation completed"
    
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
    
    # Download all modules (with bootstrap integration)
    if ! download_all_modules; then
        error "Failed to download installer modules"
        
        # Try bootstrap system if available
        if [[ -f "bootstrap.sh" ]] || curl -fsSL "$REPO_URL/install/bootstrap.sh" -o "bootstrap.sh" 2>/dev/null; then
            info "Trying bootstrap system..."
            if source "bootstrap.sh" && initialize_bootstrap; then
                success "Bootstrap system activated - modules will be auto-downloaded as needed"
            else
                error "Bootstrap system also failed"
                exit 1
            fi
        else
            exit 1
        fi
    fi
    
    # Export all color variables to ensure they're available in all subshells
    export RED GREEN YELLOW BLUE CYAN WHITE GRAY MAGENTA PURPLE NC
    
    # Load essential functions with enhanced error recovery
    if ! load_essential_functions; then
        warning "Enhanced module loading failed, trying emergency module loading..."
        
        # Emergency simplified loading
        if [[ -f "common/definitions.sh" ]]; then
            source "common/definitions.sh" 2>/dev/null || true
        fi
        
        # Load minimal required modules
        for essential in "core/profolio-installer.sh" "platforms/ubuntu.sh" "platforms/lxc_container.sh"; do
            if [[ -f "$essential" ]]; then
                source "$essential" 2>/dev/null || true
            fi
        done
        
        warning "Running with minimal modules - some advanced features may not be available"
    fi
    
    # Export critical functions to ensure they're available in all subshells
    if command -v install_profolio_application >/dev/null 2>&1; then
        export -f install_profolio_application
    fi
    
    # Detect platform using the comprehensive module function
    local platform
    if command -v get_platform_type >/dev/null 2>&1; then
        platform=$(get_platform_type)
        info "Using enhanced platform detection module"
    else
        platform=$(detect_platform)  # Fallback to built-in detection
        warning "Using fallback platform detection (module not loaded)"
    fi
    
    # Validate platform detection result
    if [[ -z "$platform" ]]; then
        error "Platform detection failed"
        platform="ubuntu"  # Safe fallback
        warning "Defaulting to Ubuntu platform"
    fi
    
    # Show enhanced system information
    echo ""
    echo -e "${WHITE}🖥️  System Information${NC}"
    echo "────────────────────────────────────────────────────────────────"
    
    # Platform with enhanced detection info
    if command -v get_platform_info >/dev/null 2>&1; then
        get_platform_info | head -3
    else
        echo -e "${BLUE}Platform:${NC} $platform"
    fi
    
    # Installation status with service status
    local install_status="Fresh Installation"
    local backend_status="Not installed"
    local frontend_status="Not installed"
    
    if [[ -d "/opt/profolio" ]]; then
        if systemctl is-active --quiet profolio-backend 2>/dev/null; then
            install_status="Update (Services Running)"
            backend_status="Active"
        else
            install_status="Repair/Rebuild (Services Stopped)"
            backend_status="Stopped"
        fi
        
        if systemctl is-active --quiet profolio-frontend 2>/dev/null; then
            frontend_status="Active"
        else
            frontend_status="Stopped"
        fi
    fi
    
    echo -e "${BLUE}Installation Status:${NC} $install_status"
    if [[ -d "/opt/profolio" ]]; then
        echo -e "${BLUE}Backend Service:${NC} $backend_status"
        echo -e "${BLUE}Frontend Service:${NC} $frontend_status"
    fi
    
    # Distribution info
    local distro="Unknown"
    if [[ -f "/etc/os-release" ]]; then
        distro=$(grep '^PRETTY_NAME=' /etc/os-release | cut -d'"' -f2 2>/dev/null || echo "Ubuntu/Debian")
    fi
    echo -e "${BLUE}Distribution:${NC} $distro"
    
    # Show available disk space
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
    
    # Get user choice and process it
    echo -n "Select installation type [1]: "
    read install_choice
    install_choice=${install_choice:-1}
    
    # Validate input using professional validation if available
    if command -v validation_validate_choice >/dev/null 2>&1; then
        if ! validation_validate_choice "$install_choice" "1" "2"; then
            warning "Invalid choice '$install_choice', using default"
            install_choice="1"
        fi
    else
        # Basic validation fallback
        case "$install_choice" in
            1|2) ;; # Valid choices
            *) 
                warning "Invalid choice '$install_choice', using default"
                install_choice="1"
                ;;
        esac
    fi
    
    # Process the user's choice
    case $install_choice in
        1)
            echo -e "${GREEN}✓${NC} Quick installation selected"
            INSTALLATION_MODE="quick"
            ;;
        2)
            echo -e "${BLUE}✓${NC} Advanced installation selected"
            INSTALLATION_MODE="advanced"
            
            # Start configuration wizard
            echo -e "${CYAN}🧙 Starting Configuration Wizard...${NC}"
            echo ""
            
            # Try to run the configuration wizard (simplified logic)
            if command -v run_configuration_wizard >/dev/null 2>&1; then
                if ! run_configuration_wizard; then
                    warning "Configuration wizard failed, proceeding with enhanced defaults"
                fi
            elif command -v config_run_installation_wizard >/dev/null 2>&1; then
                if ! config_run_installation_wizard; then
                    warning "Configuration wizard failed, proceeding with enhanced defaults"
                fi
            else
                info "Configuration wizard not available, using enhanced defaults with optional features"
                echo -e "${BLUE}• Latest stable version${NC}"
                echo -e "${BLUE}• Balanced optimization${NC}"
                echo -e "${BLUE}• Automatic backup before installation${NC}"
                
                # Offer optional advanced features if available
                echo ""
                echo -e "${WHITE}Optional Security & Performance Features:${NC}"
                
                # SSH Hardening option
                if command -v ssh_configure_server >/dev/null 2>&1; then
                    echo -n "Enable SSH security hardening? [y/N]: "
                    read -r ssh_hardening_choice
                    if [[ "$ssh_hardening_choice" =~ ^[Yy]$ ]]; then
                        export ENABLE_SSH_HARDENING="true"
                        echo -e "${GREEN}✓${NC} SSH hardening will be applied"
                    fi
                fi
                
                # Performance optimization option
                if command -v optimization_deploy_safe >/dev/null 2>&1; then
                    echo -n "Apply performance optimizations? [Y/n]: "
                    read -r optimization_choice
                    optimization_choice=${optimization_choice:-Y}
                    if [[ "$optimization_choice" =~ ^[Yy]$ ]]; then
                        export ENABLE_OPTIMIZATION="true"
                        echo -e "${GREEN}✓${NC} Performance optimizations will be applied"
                    fi
                fi
                
                # Rollback point creation
                if command -v rollback_create_rollback_point >/dev/null 2>&1; then
                    echo -n "Create rollback point before installation? [Y/n]: "
                    read -r rollback_choice
                    rollback_choice=${rollback_choice:-Y}
                    if [[ "$rollback_choice" =~ ^[Yy]$ ]]; then
                        export CREATE_ROLLBACK_POINT="true"
                        echo -e "${GREEN}✓${NC} Rollback point will be created"
                    fi
                fi
            fi
            ;;
        *)
            echo -e "${YELLOW}⚠${NC} Invalid choice, defaulting to quick installation"
            INSTALLATION_MODE="quick"
            ;;
    esac
    echo ""
    
    # Create rollback point if requested and available
    if [[ "${CREATE_ROLLBACK_POINT:-false}" == "true" ]] && command -v rollback_create_rollback_point >/dev/null 2>&1; then
        info "⏪ Creating rollback point..."
        if rollback_create_rollback_point "pre-installation-$(date +%Y%m%d-%H%M%S)"; then
            success "Rollback point created successfully"
        else
            warning "Rollback point creation failed, continuing with installation"
        fi
        echo ""
    fi
    
    # Create backup before installation if Profolio already exists
    if [[ -d "/opt/profolio" ]] && command -v backup_create_backup >/dev/null 2>&1; then
        info "🛡️ Creating backup before installation..."
        if backup_create_backup "pre-installation-$(date +%Y%m%d-%H%M%S)"; then
            success "Backup created successfully"
        else
            warning "Backup creation failed, continuing with installation"
        fi
        echo ""
    fi
    
    # Install for detected platform with emergency fallback
    if install_for_platform "$platform" "$@"; then
        # Validate installation before declaring success
        echo ""
        info "🔍 Validating installation..."
        
        local validation_passed=true
        local validation_issues=()
        
        # Check if Profolio directory exists
        if [[ ! -d "/opt/profolio" ]]; then
            validation_passed=false
            validation_issues+=("Profolio directory not found")
        fi
        
        # Check if backend service is available
        if ! systemctl list-unit-files | grep -q profolio-backend; then
            validation_passed=false
            validation_issues+=("Backend service not installed")
        fi
        
        # Check if frontend service is available
        if ! systemctl list-unit-files | grep -q profolio-frontend; then
            validation_passed=false
            validation_issues+=("Frontend service not installed")
        fi
        
        # Check if services are enabled
        if ! systemctl is-enabled --quiet profolio-backend 2>/dev/null; then
            validation_issues+=("Backend service not enabled")
        fi
        
        if ! systemctl is-enabled --quiet profolio-frontend 2>/dev/null; then
            validation_issues+=("Frontend service not enabled")
        fi
        
        # Check if Node.js and pnpm are available
        if ! command -v node >/dev/null 2>&1; then
            validation_issues+=("Node.js not found")
        fi
        
        if ! command -v pnpm >/dev/null 2>&1; then
            validation_issues+=("pnpm not found")
        fi
        
        # Report validation results
        if [[ "$validation_passed" == "true" ]]; then
            success "✅ Installation validation passed!"
        else
            warning "⚠️ Installation validation found issues:"
            for issue in "${validation_issues[@]}"; do
                echo -e "   ${RED}•${NC} $issue"
            done
            echo ""
            info "Installation may still be functional despite these issues"
        fi
        
        success "🎉 Profolio installation completed!"
        
        # Apply post-installation advanced features
        echo ""
        info "🔧 Applying post-installation enhancements..."
        
        # Apply performance optimizations if requested
        if [[ "${ENABLE_OPTIMIZATION:-false}" == "true" ]] && command -v optimization_deploy_safe >/dev/null 2>&1; then
            echo ""
            info "⚡ Applying performance optimizations..."
            if optimization_deploy_safe; then
                success "Performance optimizations applied successfully"
            else
                warning "Some performance optimizations failed, but installation is functional"
            fi
        fi
        
        # Apply SSH hardening if requested
        if [[ "${ENABLE_SSH_HARDENING:-false}" == "true" ]] && command -v ssh_configure_server >/dev/null 2>&1; then
            echo ""
            info "🔐 Applying SSH security hardening..."
            if ssh_configure_server; then
                success "SSH security hardening applied successfully"
                warning "SSH configuration updated - ensure you have alternative access before disconnecting"
            else
                warning "SSH hardening failed, but installation is functional"
            fi
        fi
        
        # Create post-installation backup if backup system available
        if command -v backup_create_backup >/dev/null 2>&1; then
            echo ""
            info "🛡️ Creating post-installation backup..."
            if backup_create_backup "post-installation-$(date +%Y%m%d-%H%M%S)"; then
                success "Post-installation backup created"
            else
                warning "Post-installation backup failed"
            fi
        fi
        
        # Show installation summary if reporting module available
        if command -v reporting_show_installation_summary >/dev/null 2>&1; then
            echo ""
            reporting_show_installation_summary
        fi
    elif install_emergency_mode "$@"; then
        success "🎉 Emergency installation completed successfully!"
    else
        error "All installation methods failed"
        show_failure_help
        exit 1
    fi
    
    # Show enhanced completion message
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 INSTALLATION COMPLETE!                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}🌐 Your Profolio instance is ready!${NC}"
    echo ""
    
    # Enhanced access information
    echo -e "${WHITE}📍 Access Information${NC}"
    echo "────────────────────────────────────────────────────────────────"
    local host_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "your-server-ip")
    echo -e "${BLUE}Frontend:${NC} http://${host_ip}:3000"
    echo -e "${BLUE}Backend API:${NC} http://${host_ip}:3001"
    
            # Enhanced service status and health monitoring
        echo ""
        echo -e "${WHITE}🔧 Service Status & Health Monitoring${NC}"
        echo "────────────────────────────────────────────────────────────────"
        
        # Backend service comprehensive check
        if systemctl is-active --quiet profolio-backend 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Backend service: Running"
            
            # Check if backend is responding
            if curl -s http://localhost:3001/health >/dev/null 2>&1; then
                echo -e "${GREEN}✓${NC} Backend health: Responsive"
            else
                echo -e "${YELLOW}⚠${NC} Backend health: Service running but not responding"
            fi
        else
            echo -e "${RED}✗${NC} Backend service: Not running"
        fi
        
        # Frontend service comprehensive check
        if systemctl is-active --quiet profolio-frontend 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Frontend service: Running"
            
            # Check if frontend is responding
            if curl -s http://localhost:3000 >/dev/null 2>&1; then
                echo -e "${GREEN}✓${NC} Frontend health: Responsive"
            else
                echo -e "${YELLOW}⚠${NC} Frontend health: Service running but not responding"
            fi
        else
            echo -e "${RED}✗${NC} Frontend service: Not running"
        fi
        
        # Database connectivity check
        if command -v sudo >/dev/null 2>&1 && sudo -u postgres psql -l >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Database: PostgreSQL accessible"
        else
            echo -e "${YELLOW}⚠${NC} Database: PostgreSQL connection issues"
        fi
        
        # Performance indicators
        if command -v systemctl >/dev/null 2>&1; then
            local backend_memory=$(systemctl show profolio-backend --property=MemoryCurrent 2>/dev/null | cut -d= -f2 || echo "unknown")
            local frontend_memory=$(systemctl show profolio-frontend --property=MemoryCurrent 2>/dev/null | cut -d= -f2 || echo "unknown")
            
            if [[ "$backend_memory" != "unknown" ]] && [[ "$backend_memory" != "" ]]; then
                local backend_mb=$((backend_memory / 1024 / 1024))
                echo -e "${BLUE}Backend Memory:${NC} ${backend_mb}MB"
            fi
            
            if [[ "$frontend_memory" != "unknown" ]] && [[ "$frontend_memory" != "" ]]; then
                local frontend_mb=$((frontend_memory / 1024 / 1024))
                echo -e "${BLUE}Frontend Memory:${NC} ${frontend_mb}MB"
            fi
        fi
    
    echo ""
    echo -e "${WHITE}🛠️ Management Commands${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}Status:${NC} systemctl status profolio-backend profolio-frontend"
    echo -e "${BLUE}Logs:${NC} journalctl -u profolio-backend -u profolio-frontend -f"
    echo -e "${BLUE}Restart:${NC} systemctl restart profolio-backend profolio-frontend"
    echo -e "${BLUE}Stop:${NC} systemctl stop profolio-backend profolio-frontend"
    
    # Show backup information if backup module available
    if command -v backup_list_backups >/dev/null 2>&1; then
        echo ""
        echo -e "${WHITE}🛡️ Backup Information${NC}"
        echo "────────────────────────────────────────────────────────────────"
        echo -e "${BLUE}List backups:${NC} Available via backup management system"
        echo -e "${BLUE}Create backup:${NC} Manual backup available before updates"
    fi
    
    echo ""
    echo -e "${WHITE}📚 Support & Resources${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}Repository:${NC} https://github.com/Obednal97/profolio"
    echo -e "${BLUE}Issues:${NC} https://github.com/Obednal97/profolio/issues"
    echo -e "${BLUE}Installation Type:${NC} ${INSTALLATION_MODE:-standard}"
    
    # Show applied advanced features
    local applied_features=()
    if [[ "${ENABLE_SSH_HARDENING:-false}" == "true" ]]; then
        applied_features+=("SSH Hardening")
    fi
    if [[ "${ENABLE_OPTIMIZATION:-false}" == "true" ]]; then
        applied_features+=("Performance Optimization")
    fi
    if [[ "${CREATE_ROLLBACK_POINT:-false}" == "true" ]]; then
        applied_features+=("Rollback Point Created")
    fi
    
    if [[ ${#applied_features[@]} -gt 0 ]]; then
        echo -e "${BLUE}Applied Features:${NC} ${applied_features[*]}"
    fi
    
    echo ""
    echo -e "${WHITE}🎯 Next Steps & Recommendations${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}1.${NC} Access your Profolio instance at http://${host_ip}:3000"
    echo -e "${BLUE}2.${NC} Complete initial setup and create your first portfolio"
    echo -e "${BLUE}3.${NC} Configure regular backups using the backup management system"
    
    if [[ "${ENABLE_SSH_HARDENING:-false}" == "true" ]]; then
        echo -e "${BLUE}4.${NC} ${YELLOW}Important:${NC} SSH configuration has been hardened - test access before disconnecting"
    fi
    
    # Monitoring recommendations
    echo ""
    echo -e "${WHITE}📊 Monitoring & Maintenance${NC}"
    echo "────────────────────────────────────────────────────────────────"
    echo -e "${BLUE}Health Check:${NC} curl http://localhost:3001/health"
    echo -e "${BLUE}Service Logs:${NC} journalctl -u profolio-backend -u profolio-frontend -f"
    echo -e "${BLUE}Resource Usage:${NC} systemctl status profolio-backend profolio-frontend"
    
    if command -v backup_list_backups >/dev/null 2>&1; then
        echo -e "${BLUE}Backup Status:${NC} List available backups via backup management system"
    fi
    
    if command -v rollback_list_rollback_points >/dev/null 2>&1; then
        echo -e "${BLUE}Rollback Points:${NC} List available rollback points for system recovery"
    fi
    
    # Security recommendations
    if [[ "${ENABLE_SSH_HARDENING:-false}" != "true" ]] && [[ -n "${SSH_CONNECTION:-}" ]]; then
        echo ""
        echo -e "${WHITE}🔐 Security Recommendations${NC}"
        echo "────────────────────────────────────────────────────────────────"
        echo -e "${YELLOW}•${NC} Consider running SSH hardening: Re-run installer in advanced mode"
        echo -e "${YELLOW}•${NC} Enable UFW firewall: ufw enable"
        echo -e "${YELLOW}•${NC} Regular security updates: apt update && apt upgrade"
    fi
    
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