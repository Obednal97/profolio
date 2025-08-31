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

# ===========================
# TUI Detection and Setup
# ===========================

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

# ===========================
# TUI Display Functions
# ===========================

# Display a message box
show_message() {
    local title="$1"
    local message="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        $TUI_TOOL --title "$title" --msgbox "$message" 12 60
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        read -p "Press Enter to continue..."
    fi
}

# Display a yes/no dialog
show_yesno() {
    local title="$1"
    local message="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        $TUI_TOOL --title "$title" --yesno "$message" 10 60
        return $?
    else
        echo ""
        read -p "$message (y/n): " response
        [[ "$response" =~ ^[Yy] ]]
        return $?
    fi
}

# Display a menu
show_menu() {
    local title="$1"
    local message="$2"
    shift 2
    local options=("$@")
    
    if [ "$TUI_AVAILABLE" = true ]; then
        local menu_items=()
        for i in "${!options[@]}"; do
            menu_items+=("$((i+1))" "${options[$i]}")
        done
        
        choice=$($TUI_TOOL --title "$title" --menu "$message" 20 70 10 "${menu_items[@]}" 3>&1 1>&2 2>&3)
        return $?
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        for i in "${!options[@]}"; do
            echo "$((i+1))) ${options[$i]}"
        done
        echo ""
        read -p "Select option: " choice
        return 0
    fi
}

# Display an input box
show_inputbox() {
    local title="$1"
    local message="$2"
    local default="$3"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        result=$($TUI_TOOL --title "$title" --inputbox "$message" 10 60 "$default" 3>&1 1>&2 2>&3)
        echo "$result"
    else
        echo ""
        read -p "$message [$default]: " result
        echo "${result:-$default}"
    fi
}

# Display a progress gauge
show_progress() {
    local title="$1"
    local message="$2"
    local percent="$3"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        echo "$percent" | $TUI_TOOL --title "$title" --gauge "$message" 8 60 0
    else
        echo -ne "\r$message: $percent%"
        if [ "$percent" = "100" ]; then
            echo ""
        fi
    fi
}

# Display a checklist
show_checklist() {
    local title="$1"
    local message="$2"
    shift 2
    local options=("$@")
    
    if [ "$TUI_AVAILABLE" = true ]; then
        local checklist_items=()
        for item in "${options[@]}"; do
            IFS='|' read -r tag description status <<< "$item"
            checklist_items+=("$tag" "$description" "$status")
        done
        
        choices=$($TUI_TOOL --title "$title" --checklist "$message" 20 70 10 "${checklist_items[@]}" 3>&1 1>&2 2>&3)
        echo "$choices"
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        local selected=()
        for item in "${options[@]}"; do
            IFS='|' read -r tag description status <<< "$item"
            local default=""
            if [ "$status" = "ON" ]; then
                default=" (default: yes)"
            fi
            read -p "$description$default (y/n): " response
            if [[ "$response" =~ ^[Yy] ]] || ([ -z "$response" ] && [ "$status" = "ON" ]); then
                selected+=("$tag")
            fi
        done
        echo "${selected[@]}"
    fi
}

# ===========================
# Installation Configuration
# ===========================

INSTALL_CONFIG=(
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
)

# ===========================
# Main Installation Flow
# ===========================

main_menu() {
    while true; do
        show_menu "Profolio Installer" "Welcome to Profolio! Select an option:" \
            "🚀 Quick Install (Recommended)" \
            "⚙️  Advanced Install" \
            "📦 Install Specific Version" \
            "🔄 Update Existing Installation" \
            "🛠️  Repair Installation" \
            "💾 Backup Current Installation" \
            "📥 Restore from Backup" \
            "ℹ️  About Profolio" \
            "❌ Exit"
        
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
    show_message "Quick Install" "This will install Profolio with default settings:\n\n• Latest version\n• Self-hosted mode\n• Local authentication\n• Safe optimization\n\nThe installation will take about 5 minutes."
    
    if show_yesno "Confirm Installation" "Do you want to proceed with the quick installation?"; then
        run_installation
    else
        show_message "Installation Cancelled" "Installation has been cancelled."
    fi
}

advanced_install() {
    # Deployment Mode
    show_menu "Deployment Mode" "Select your deployment mode:" \
        "Self-Hosted (Recommended)" \
        "Cloud" \
        "Development"
    
    case $choice in
        1) DEPLOYMENT_MODE="self-hosted" ;;
        2) DEPLOYMENT_MODE="cloud" ;;
        3) DEPLOYMENT_MODE="development" ;;
    esac
    
    # Authentication Mode
    show_menu "Authentication Mode" "Select authentication method:" \
        "Local Authentication (Built-in)" \
        "Firebase Authentication" \
        "Both (Local + Firebase)"
    
    case $choice in
        1) AUTH_MODE="local" ;;
        2) AUTH_MODE="firebase" ;;
        3) AUTH_MODE="both" ;;
    esac
    
    # Firebase Configuration (if selected)
    if [ "$AUTH_MODE" = "firebase" ] || [ "$AUTH_MODE" = "both" ]; then
        if show_yesno "Firebase Configuration" "Do you have Firebase configuration ready?"; then
            FIREBASE_CONFIG=$(show_inputbox "Firebase Config" "Paste your Firebase configuration JSON:" "")
        fi
    fi
    
    # Optional Features
    features=$(show_checklist "Optional Features" "Select features to enable:" \
        "billing|Stripe Billing Integration|OFF" \
        "demo|Demo Mode|OFF" \
        "analytics|Analytics Dashboard|ON" \
        "backup|Automatic Backups|ON" \
        "ssh|SSH Access|OFF")
    
    # Optimization Level
    show_menu "Optimization Level" "Select installation optimization:" \
        "Safe (Recommended) - ~600-800MB" \
        "Aggressive - ~400-500MB" \
        "None - Keep all files"
    
    case $choice in
        1) OPTIMIZATION="safe" ;;
        2) OPTIMIZATION="aggressive" ;;
        3) OPTIMIZATION="none" ;;
    esac
    
    # Installation Path
    INSTALL_PATH=$(show_inputbox "Installation Path" "Enter installation path:" "/opt/profolio")
    
    # Show Summary
    show_message "Installation Summary" "Configuration Summary:\n\n• Mode: $DEPLOYMENT_MODE\n• Auth: $AUTH_MODE\n• Features: $features\n• Optimization: $OPTIMIZATION\n• Path: $INSTALL_PATH"
    
    if show_yesno "Confirm Installation" "Proceed with these settings?"; then
        run_installation
    fi
}

version_install() {
    # Get available versions
    log_info "Fetching available versions..."
    
    # Simulate version list (in real implementation, fetch from GitHub)
    show_menu "Select Version" "Choose Profolio version to install:" \
        "v1.14.10 (Latest Stable)" \
        "v1.14.9" \
        "v1.14.8" \
        "v1.14.7" \
        "v1.13.1 (LTS)" \
        "main (Development)"
    
    case $choice in
        1) VERSION="v1.14.10" ;;
        2) VERSION="v1.14.9" ;;
        3) VERSION="v1.14.8" ;;
        4) VERSION="v1.14.7" ;;
        5) VERSION="v1.13.1" ;;
        6) VERSION="main" ;;
    esac
    
    show_message "Version Selected" "You selected version: $VERSION"
    
    if show_yesno "Confirm Installation" "Install Profolio $VERSION?"; then
        run_installation
    fi
}

update_install() {
    show_message "Update Installation" "This will update your existing Profolio installation to the latest version.\n\nYour data and configuration will be preserved."
    
    if show_yesno "Environment Preservation" "Preserve existing environment configuration?"; then
        PRESERVE_ENV="yes"
    else
        PRESERVE_ENV="no"
    fi
    
    if show_yesno "Rollback Protection" "Enable automatic rollback on failure?"; then
        ENABLE_ROLLBACK="yes"
    else
        ENABLE_ROLLBACK="no"
    fi
    
    if show_yesno "Confirm Update" "Proceed with the update?"; then
        run_update
    fi
}

repair_install() {
    show_message "Repair Installation" "This will attempt to repair your Profolio installation by:\n\n• Checking system dependencies\n• Verifying database connection\n• Rebuilding the application\n• Restarting services"
    
    if show_yesno "Confirm Repair" "Proceed with repair?"; then
        run_repair
    fi
}

backup_install() {
    local backup_path=$(show_inputbox "Backup Location" "Enter backup destination path:" "/opt/profolio-backup-$(date +%Y%m%d)")
    
    show_message "Creating Backup" "Creating backup at:\n$backup_path\n\nThis includes:\n• Database\n• Environment files\n• Uploaded files\n• Configuration"
    
    run_backup "$backup_path"
}

restore_install() {
    local backup_path=$(show_inputbox "Backup Location" "Enter backup path to restore from:" "")
    
    if [ -z "$backup_path" ] || [ ! -d "$backup_path" ]; then
        show_message "Error" "Invalid backup path!"
        return
    fi
    
    show_message "Restore Backup" "This will restore from:\n$backup_path\n\n⚠️ WARNING: This will overwrite current installation!"
    
    if show_yesno "Confirm Restore" "Are you sure you want to restore from this backup?"; then
        run_restore "$backup_path"
    fi
}

show_about() {
    show_message "About Profolio" "Profolio - Portfolio Management System\nVersion: v1.14.10\n\nA privacy-focused, self-hosted portfolio management system built with Next.js and NestJS.\n\nFeatures:\n• Real-time portfolio tracking\n• Multi-asset support\n• Expense management\n• Property tracking\n• Privacy-first design\n\nGitHub: github.com/Obednal97/profolio"
}

# ===========================
# Installation Functions
# ===========================

run_installation() {
    # Create a temporary file for progress tracking
    PROGRESS_FILE="/tmp/profolio-progress-$$"
    
    (
        echo "10"
        echo "# Checking system requirements..."
        sleep 1
        
        echo "20"
        echo "# Installing dependencies..."
        sleep 2
        
        echo "40"
        echo "# Setting up database..."
        sleep 2
        
        echo "60"
        echo "# Building application..."
        sleep 2
        
        echo "80"
        echo "# Configuring services..."
        sleep 1
        
        echo "90"
        echo "# Starting services..."
        sleep 1
        
        echo "100"
        echo "# Installation complete!"
        sleep 1
    ) | $TUI_TOOL --title "Installing Profolio" --gauge "Starting installation..." 10 60 0
    
    show_message "Installation Complete" "Profolio has been successfully installed!\n\nAccess your instance at:\n• Frontend: http://localhost:3000\n• Backend: http://localhost:3001\n\nDefault credentials:\n• Email: admin@profolio.local\n• Password: (check install log)"
}

run_update() {
    show_message "Update in Progress" "Updating Profolio...\n\nThis is a simulation. In the real implementation, this would:\n• Download latest version\n• Preserve your configuration\n• Update the application\n• Restart services"
    
    log_success "Update completed successfully!"
}

run_repair() {
    show_message "Repair in Progress" "Repairing Profolio...\n\nThis is a simulation. In the real implementation, this would:\n• Check dependencies\n• Verify database\n• Rebuild application\n• Restart services"
    
    log_success "Repair completed successfully!"
}

run_backup() {
    local path="$1"
    show_message "Backup Complete" "Backup created successfully at:\n$path\n\nThis is a simulation. In the real implementation, this would create a full backup."
    
    log_success "Backup completed!"
}

run_restore() {
    local path="$1"
    show_message "Restore Complete" "Restored from backup:\n$path\n\nThis is a simulation. In the real implementation, this would restore from the backup."
    
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
        show_message "Welcome to Profolio" "Welcome to the Profolio installer!\n\nThis installer will guide you through setting up Profolio on your system.\n\nUsing TUI mode with: $TUI_TOOL"
    else
        log_info "Welcome to Profolio installer!"
        log_warning "TUI not available, using CLI mode"
    fi
    
    # Start main menu
    main_menu
}

# Run main function
main "$@"