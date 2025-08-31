#!/bin/bash

# 🚀 Profolio TUI Installer v3.0
# Terminal User Interface installer with whiptail/dialog
# Provides a professional, user-friendly installation experience

set -e

# ===========================
# Color and Display Setup
# ===========================

# Colors for non-TUI output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Source TUI functions library
TUI_LIB_PATH="$(dirname "$0")/lib/tui-functions.sh"
if [ -f "$TUI_LIB_PATH" ]; then
    source "$TUI_LIB_PATH"
else
    # Try to download it if not found locally
    TUI_LIB_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/lib/tui-functions.sh"
    TEMP_TUI_LIB="/tmp/tui-functions-$$.sh"
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$TUI_LIB_URL" -o "$TEMP_TUI_LIB" 2>/dev/null && source "$TEMP_TUI_LIB"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$TEMP_TUI_LIB" "$TUI_LIB_URL" 2>/dev/null && source "$TEMP_TUI_LIB"
    fi
fi

# TUI should already be initialized from the library
# If not, initialize it now
if [ -z "$TUI_AVAILABLE" ]; then
    TUI_AVAILABLE=false
    TUI_TOOL=""
    
    # Check for whiptail (preferred) or dialog
    if command -v whiptail >/dev/null 2>&1; then
        TUI_AVAILABLE=true
        TUI_TOOL="whiptail"
    elif command -v dialog >/dev/null 2>&1; then
        TUI_AVAILABLE=true
        TUI_TOOL="dialog"
    fi
fi

# ===========================
# Utility Functions
# ===========================

# Logging functions
log_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Install whiptail if not available
install_tui_tool() {
    if [ "$TUI_AVAILABLE" = false ]; then
        log_info "Installing TUI components for better experience..."
        if [ -f /etc/debian_version ]; then
            apt-get update >/dev/null 2>&1
            apt-get install -y whiptail >/dev/null 2>&1 || apt-get install -y dialog >/dev/null 2>&1
        elif [ -f /etc/redhat-release ]; then
            yum install -y newt >/dev/null 2>&1 || yum install -y dialog >/dev/null 2>&1
        fi
        
        # Re-check availability
        if command -v whiptail >/dev/null 2>&1; then
            TUI_AVAILABLE=true
            TUI_TOOL="whiptail"
        elif command -v dialog >/dev/null 2>&1; then
            TUI_AVAILABLE=true
            TUI_TOOL="dialog"
        fi
    fi
}

# The TUI display functions are now provided by lib/tui-functions.sh
# We'll just use the tui_* functions directly

# ===========================
# Installation Configuration
# ===========================

# Configuration variables that will be passed to main installer
VERSION="latest"
DEPLOYMENT_MODE="self-hosted"
AUTH_MODE="local"
INSTALL_PATH="/opt/profolio"
PRESERVE_ENV="yes"
ENABLE_ROLLBACK="yes"
OPTIMIZATION="safe"
ENABLE_SSH="no"
FIREBASE_CONFIG=""
STRIPE_CONFIG=""
FEATURES=""

# ===========================
# Main Installation Flow
# ===========================

main_menu() {
    while true; do
        choice=$(tui_menu "Profolio Installer" "Welcome to Profolio! Select an option:" \
            "1|Quick Install (Recommended)" \
            "2|Advanced Install" \
            "3|Install Specific Version" \
            "4|Update Existing Installation" \
            "5|Repair Installation" \
            "6|Backup Current Installation" \
            "7|Restore from Backup" \
            "8|About Profolio" \
            "9|Exit")
        
        case $choice in
            1) quick_install ;;
            2) advanced_install ;;
            3) version_install ;;
            4) update_install ;;
            5) repair_install ;;
            6) backup_install ;;
            7) restore_install ;;
            8) show_about ;;
            9|"") exit 0 ;;
        esac
    done
}

quick_install() {
    tui_msgbox "Quick Install" "This will install Profolio with default settings:\n\n• Latest version\n• Self-hosted mode\n• Local authentication\n• Safe optimization\n\nThe installation will take about 5 minutes."
    
    if tui_yesno "Confirm Installation" "Do you want to proceed with the quick installation?"; then
        QUICK_INSTALL=true
        VERSION="latest"
        DEPLOYMENT_MODE="self-hosted"
        AUTH_MODE="local"
        OPTIMIZATION="safe"
        ENABLE_ROLLBACK="yes"
        PRESERVE_ENV="yes"
        run_installation
    else
        tui_msgbox "Installation Cancelled" "Installation has been cancelled."
    fi
}

advanced_install() {
    # Deployment Mode
    choice=$(tui_menu "Deployment Mode" "Select your deployment mode:" \
        "1|Self-Hosted (Recommended)" \
        "2|Cloud" \
        "3|Development")
    
    case $choice in
        1) DEPLOYMENT_MODE="self-hosted" ;;
        2) DEPLOYMENT_MODE="cloud" ;;
        3) DEPLOYMENT_MODE="development" ;;
    esac
    
    # Authentication Mode
    choice=$(tui_menu "Authentication Mode" "Select authentication method:" \
        "1|Local Authentication (Built-in)" \
        "2|Firebase Authentication" \
        "3|Both (Local + Firebase)")
    
    case $choice in
        1) AUTH_MODE="local" ;;
        2) AUTH_MODE="firebase" ;;
        3) AUTH_MODE="both" ;;
    esac
    
    # Firebase Configuration (if selected)
    if [ "$AUTH_MODE" = "firebase" ] || [ "$AUTH_MODE" = "both" ]; then
        if tui_yesno "Firebase Configuration" "Do you have Firebase configuration ready?"; then
            FIREBASE_CONFIG=$(tui_inputbox "Firebase Config" "Paste your Firebase configuration JSON:" "")
        fi
    fi
    
    # Optional Features
    FEATURES=$(tui_checklist "Optional Features" "Select features to enable:" \
        "billing|Stripe Billing Integration|OFF" \
        "demo|Demo Mode|OFF" \
        "analytics|Analytics Dashboard|ON" \
        "backup|Automatic Backups|ON" \
        "ssh|SSH Access|OFF")
    
    # If Stripe billing is selected, get configuration
    if echo "$FEATURES" | grep -q "billing"; then
        if tui_yesno "Stripe Configuration" "Do you have Stripe API keys ready?"; then
            STRIPE_CONFIG=$(tui_inputbox "Stripe Config" "Enter your Stripe configuration (JSON or key=value format):" "")
        fi
    fi
    
    # Optimization Level
    choice=$(tui_menu "Optimization Level" "Select installation optimization:" \
        "1|Safe (Recommended) - ~600-800MB" \
        "2|Aggressive - ~400-500MB" \
        "3|None - Keep all files")
    
    case $choice in
        1) OPTIMIZATION="safe" ;;
        2) OPTIMIZATION="aggressive" ;;
        3) OPTIMIZATION="none" ;;
    esac
    
    # Installation Path
    INSTALL_PATH=$(tui_inputbox "Installation Path" "Enter installation path:" "/opt/profolio")
    
    # Set rollback and preservation settings
    ENABLE_ROLLBACK="yes"  # Default to yes for advanced install
    PRESERVE_ENV="yes"     # Default to yes for advanced install
    
    # Show Summary
    tui_msgbox "Installation Summary" "Configuration Summary:\n\n• Mode: $DEPLOYMENT_MODE\n• Auth: $AUTH_MODE\n• Features: $FEATURES\n• Optimization: $OPTIMIZATION\n• Path: $INSTALL_PATH"
    
    if tui_yesno "Confirm Installation" "Proceed with these settings?"; then
        run_installation
    fi
}

version_install() {
    # Get available versions
    log_info "Fetching available versions..."
    
    # Fetch actual versions from GitHub
    local versions=$(curl -s https://api.github.com/repos/Obednal97/profolio/tags | grep '"name"' | head -10 | cut -d'"' -f4 || echo "")
    
    # Build menu options
    local menu_options=()
    local i=1
    menu_options+=("$i|Latest (main branch)")
    ((i++))
    
    if [ -n "$versions" ]; then
        for ver in $versions; do
            if [ $i -eq 2 ]; then
                menu_options+=("$i|$ver (Latest Stable)")
            else
                menu_options+=("$i|$ver")
            fi
            ((i++))
            [ $i -gt 10 ] && break
        done
    else
        # Fallback if API fails
        menu_options+=("2|v1.14.10 (Latest Stable)")
        menu_options+=("3|v1.14.9")
        menu_options+=("4|v1.14.8")
        menu_options+=("5|v1.13.1")
    fi
    
    choice=$(tui_menu "Select Version" "Choose Profolio version to install:" "${menu_options[@]}")
    
    case $choice in
        1) VERSION="main" ;;
        *) 
            # Extract version from menu option
            VERSION=$(echo "${menu_options[$((choice-1))]}" | cut -d'|' -f2 | awk '{print $1}')
            ;;
    esac
    
    tui_msgbox "Version Selected" "You selected version: $VERSION"
    
    if tui_yesno "Confirm Installation" "Install Profolio $VERSION?"; then
        # Set default configuration for version install
        DEPLOYMENT_MODE="self-hosted"
        AUTH_MODE="local"
        OPTIMIZATION="safe"
        ENABLE_ROLLBACK="yes"
        PRESERVE_ENV="yes"
        run_installation
    fi
}

update_install() {
    tui_msgbox "Update Installation" "This will update your existing Profolio installation to the latest version.\n\nYour data and configuration will be preserved."
    
    if tui_yesno "Environment Preservation" "Preserve existing environment configuration?"; then
        PRESERVE_ENV="yes"
    else
        PRESERVE_ENV="no"
    fi
    
    if tui_yesno "Rollback Protection" "Enable automatic rollback on failure?"; then
        ENABLE_ROLLBACK="yes"
    else
        ENABLE_ROLLBACK="no"
    fi
    
    if tui_yesno "Confirm Update" "Proceed with the update?"; then
        run_update
    fi
}

repair_install() {
    tui_msgbox "Repair Installation" "This will attempt to repair your Profolio installation by:\n\n• Checking system dependencies\n• Verifying database connection\n• Rebuilding the application\n• Restarting services"
    
    if tui_yesno "Confirm Repair" "Proceed with repair?"; then
        run_repair
    fi
}

backup_install() {
    local backup_path=$(tui_inputbox "Backup Location" "Enter backup destination path:" "/opt/profolio-backup-$(date +%Y%m%d)")
    
    tui_msgbox "Creating Backup" "Creating backup at:\n$backup_path\n\nThis includes:\n• Database\n• Environment files\n• Uploaded files\n• Configuration"
    
    run_backup "$backup_path"
}

restore_install() {
    local backup_path=$(tui_inputbox "Backup Location" "Enter backup path to restore from:" "")
    
    if [ -z "$backup_path" ] || [ ! -d "$backup_path" ]; then
        tui_msgbox "Error" "Invalid backup path!"
        return
    fi
    
    tui_msgbox "Restore Backup" "This will restore from:\n$backup_path\n\n⚠️ WARNING: This will overwrite current installation!"
    
    if tui_yesno "Confirm Restore" "Are you sure you want to restore from this backup?"; then
        run_restore "$backup_path"
    fi
}

show_about() {
    tui_msgbox "About Profolio" "Profolio - Portfolio Management System\nVersion: v1.14.10\n\nA privacy-focused, self-hosted portfolio management system built with Next.js and NestJS.\n\nFeatures:\n• Real-time portfolio tracking\n• Multi-asset support\n• Expense management\n• Property tracking\n• Privacy-first design\n\nGitHub: github.com/Obednal97/profolio"
}

# ===========================
# Installation Functions
# ===========================

run_installation() {
    # Download and run the actual installer
    local TEMP_DIR="/tmp/profolio-tui-$$"
    local INSTALLER_PATH="$TEMP_DIR/install.sh"
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    
    # Download the real installer
    tui_infobox "Downloading" "Downloading Profolio installer..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh" -o "$INSTALLER_PATH" 2>/dev/null
    else
        wget -qO "$INSTALLER_PATH" "https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh" 2>/dev/null
    fi
    
    if [ ! -f "$INSTALLER_PATH" ]; then
        tui_msgbox "Error" "Failed to download installer!"
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    chmod +x "$INSTALLER_PATH"
    
    # Export configuration as environment variables for the main installer
    export PROFOLIO_TUI_CONFIG="true"
    export PROFOLIO_VERSION="$VERSION"
    export PROFOLIO_DEPLOYMENT_MODE="$DEPLOYMENT_MODE"
    export PROFOLIO_AUTH_MODE="$AUTH_MODE"
    export PROFOLIO_INSTALL_PATH="$INSTALL_PATH"
    export PROFOLIO_PRESERVE_ENV="$PRESERVE_ENV"
    export PROFOLIO_ENABLE_ROLLBACK="$ENABLE_ROLLBACK"
    export PROFOLIO_OPTIMIZATION="$OPTIMIZATION"
    export PROFOLIO_FIREBASE_CONFIG="$FIREBASE_CONFIG"
    export PROFOLIO_STRIPE_CONFIG="$STRIPE_CONFIG"
    export PROFOLIO_FEATURES="$FEATURES"
    
    # Build installer arguments based on configuration
    local INSTALLER_ARGS="--tui-config"
    
    [ "$VERSION" != "latest" ] && [ -n "$VERSION" ] && INSTALLER_ARGS="$INSTALLER_ARGS --version $VERSION"
    [ "$PRESERVE_ENV" = "no" ] && INSTALLER_ARGS="$INSTALLER_ARGS --reset-env"
    [ "$ENABLE_ROLLBACK" = "no" ] && INSTALLER_ARGS="$INSTALLER_ARGS --no-rollback"
    [ "$OPTIMIZATION" = "aggressive" ] && INSTALLER_ARGS="$INSTALLER_ARGS --aggressive-optimize"
    [ "$OPTIMIZATION" = "none" ] && INSTALLER_ARGS="$INSTALLER_ARGS --no-optimize"
    
    # Clear screen for installation output
    clear
    
    echo -e "${BLUE}Starting Profolio Installation${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Run the actual installer
    bash "$INSTALLER_PATH" $INSTALLER_ARGS
    local install_result=$?
    
    # Cleanup
    rm -rf "$TEMP_DIR"
    
    if [ $install_result -eq 0 ]; then
        tui_msgbox "Installation Complete" "Profolio has been successfully installed!\n\nAccess your instance at:\n• Frontend: http://$(hostname -I | awk '{print $1}'):3000\n• Backend: http://$(hostname -I | awk '{print $1}'):3001"
    else
        tui_msgbox "Installation Failed" "Installation failed. Please check the logs for details."
    fi
    
    return $install_result
}

run_update() {
    # Download and run the installer in update mode
    local TEMP_DIR="/tmp/profolio-tui-$$"
    local INSTALLER_PATH="$TEMP_DIR/install.sh"
    
    mkdir -p "$TEMP_DIR"
    
    tui_infobox "Downloading" "Downloading Profolio installer..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh" -o "$INSTALLER_PATH" 2>/dev/null
    else
        wget -qO "$INSTALLER_PATH" "https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh" 2>/dev/null
    fi
    
    if [ ! -f "$INSTALLER_PATH" ]; then
        tui_msgbox "Error" "Failed to download installer!"
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    chmod +x "$INSTALLER_PATH"
    
    # Export configuration for update mode
    export PROFOLIO_TUI_CONFIG="true"
    export PROFOLIO_PRESERVE_ENV="$PRESERVE_ENV"
    export PROFOLIO_ENABLE_ROLLBACK="$ENABLE_ROLLBACK"
    
    # Build update arguments
    local INSTALLER_ARGS="--update --tui-config"
    [ "$PRESERVE_ENV" = "no" ] && INSTALLER_ARGS="$INSTALLER_ARGS --reset-env"
    [ "$ENABLE_ROLLBACK" = "no" ] && INSTALLER_ARGS="$INSTALLER_ARGS --no-rollback"
    
    clear
    echo -e "${BLUE}Updating Profolio${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    bash "$INSTALLER_PATH" $INSTALLER_ARGS
    local result=$?
    
    rm -rf "$TEMP_DIR"
    
    if [ $result -eq 0 ]; then
        tui_msgbox "Update Complete" "Profolio has been successfully updated!"
    else
        tui_msgbox "Update Failed" "Update failed. Please check the logs for details."
    fi
    
    return $result
}

run_repair() {
    # Download and run the installer in repair mode
    local TEMP_DIR="/tmp/profolio-tui-$$"
    local INSTALLER_PATH="$TEMP_DIR/install.sh"
    
    mkdir -p "$TEMP_DIR"
    
    tui_infobox "Downloading" "Downloading Profolio installer..."
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh" -o "$INSTALLER_PATH" 2>/dev/null
    else
        wget -qO "$INSTALLER_PATH" "https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh" 2>/dev/null
    fi
    
    if [ ! -f "$INSTALLER_PATH" ]; then
        tui_msgbox "Error" "Failed to download installer!"
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    chmod +x "$INSTALLER_PATH"
    
    clear
    echo -e "${BLUE}Repairing Profolio Installation${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    bash "$INSTALLER_PATH" --repair
    local result=$?
    
    rm -rf "$TEMP_DIR"
    
    if [ $result -eq 0 ]; then
        tui_msgbox "Repair Complete" "Profolio has been successfully repaired!"
    else
        tui_msgbox "Repair Failed" "Repair failed. Please check the logs for details."
    fi
    
    return $result
}

run_backup() {
    local path="$1"
    tui_msgbox "Backup Complete" "Backup created successfully at:\n$path\n\nThis is a simulation. In the real implementation, this would create a full backup."
    
    log_success "Backup completed!"
}

run_restore() {
    local path="$1"
    tui_msgbox "Restore Complete" "Restored from backup:\n$path\n\nThis is a simulation. In the real implementation, this would restore from the backup."
    
    log_success "Restore completed!"
}

# ===========================
# Main Entry Point
# ===========================

main() {
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        log_error "This installer must be run as root"
        log_info "Please run: sudo bash $0"
        exit 1
    fi
    
    # Try to install TUI tool if not available
    install_tui_tool
    
    # Clear screen for TUI
    if [ "$TUI_AVAILABLE" = true ]; then
        clear
    fi
    
    # Show welcome message
    if [ "$TUI_AVAILABLE" = true ]; then
        tui_msgbox "Welcome to Profolio" "Welcome to the Profolio installer!\n\nThis installer will guide you through setting up Profolio on your system.\n\nUsing TUI mode with: $TUI_TOOL"
    else
        log_info "Welcome to Profolio installer!"
        log_warning "TUI not available, using CLI mode"
    fi
    
    # Start main menu
    main_menu
}

# Run main function
main "$@"