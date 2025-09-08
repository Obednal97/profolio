#!/usr/bin/env bash

# Profolio Installation Wrapper - Proxmox Community Script Style
# This script downloads and executes the main installer with TUI options
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh)"

# Check Bash version (need 4.3+ for nameref support)
if [ "${BASH_VERSION%%.*}" -lt 4 ] || ( [ "${BASH_VERSION%%.*}" -eq 4 ] && [ "${BASH_VERSION#*.}" -lt 3 ] ); then
    echo "Error: This script requires Bash 4.3 or higher for advanced features."
    echo "Current version: $BASH_VERSION"
    echo "Please upgrade Bash or use basic installation mode only."
    exit 1
fi

# Exit on error
set -e

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_RAW="https://raw.githubusercontent.com/Obednal97/profolio/main"
TEMP_DIR="${TMPDIR:-/tmp}/profolio-installer-$$"
INSTALLER_SCRIPT="install.sh"
TUI_ENABLED=true

# Configurable paths
INSTALL_DIR="${INSTALL_DIR:-/opt/profolio}"
PROGRESS_FILE="${TMPDIR:-/tmp}/profolio-install-progress.log"
ERROR_FILE="${TMPDIR:-/tmp}/profolio-install-error.log"

# Cache variables
CACHED_LATEST_VERSION=""
CACHED_VERSION_TIME=0

# Colors
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[31m")
GN=$(echo "\033[32m")
CL=$(echo "\033[0m")

# Check for whiptail/dialog with tailbox support
if command -v whiptail >/dev/null 2>&1; then
    TUI_TOOL="whiptail"
    # Test if tailbox is supported
    if ! whiptail --help 2>&1 | grep -q "tailbox" 2>/dev/null; then
        TUI_TAILBOX_SUPPORTED=false
    else
        TUI_TAILBOX_SUPPORTED=true
    fi
elif command -v dialog >/dev/null 2>&1; then
    TUI_TOOL="dialog"
    # Test if tailbox is supported
    if ! dialog --help 2>&1 | grep -q "tailbox" 2>/dev/null; then
        TUI_TAILBOX_SUPPORTED=false
    else
        TUI_TAILBOX_SUPPORTED=true
    fi
else
    TUI_ENABLED=false
    TUI_TAILBOX_SUPPORTED=false
fi

# Get installer version (static)
function get_installer_version {
    echo "v2.1"  # This is the installer wrapper version, not the app version
}

# Get latest available app version (with caching)
function get_latest_app_version {
    local current_time
    current_time=$(date +%s)
    
    # Check if we have a cached version (cache for 5 minutes = 300 seconds)
    if [ -n "$CACHED_LATEST_VERSION" ] && [ $((current_time - CACHED_VERSION_TIME)) -lt 300 ]; then
        echo "$CACHED_LATEST_VERSION"
        return 0
    fi
    
    local version=""
    
    # Try to get latest stable version
    if command -v curl >/dev/null 2>&1; then
        version=$(curl -s --connect-timeout 5 "https://api.github.com/repos/Obednal97/profolio/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 2>/dev/null || echo "")
        if [ -n "$version" ]; then
            # Cache the result
            CACHED_LATEST_VERSION="$version"
            CACHED_VERSION_TIME="$current_time"
            echo "$version"
            return 0
        fi
    fi
    
    # Fallback to hardcoded version if API fails
    version="v1.18.0"
    CACHED_LATEST_VERSION="$version"
    CACHED_VERSION_TIME="$current_time"
    echo "$version"
    return 0
}

# Get current installed version
function get_installed_version {
    if [ -f "$INSTALL_DIR/frontend/package.json" ]; then
        grep '"version"' "$INSTALL_DIR/frontend/package.json" | cut -d'"' -f4 2>/dev/null || echo "Unknown"
        return 0
    else
        echo "Not Installed"
        return 0
    fi
}

# Header
function header_info {
    clear
    cat <<"EOF"
    ____             _____      _ _       
   |  _ \ _ __ ___  |  ___|__  | (_) ___  
   | |_) | '__/ _ \ | |_ / _ \ | | |/ _ \ 
   |  __/| | | (_) ||  _| (_) || | | (_) |
   |_|   |_|  \___/ |_|  \___/ |_|_|\___/ 
                                           
EOF
    echo -e "${BL}Professional Portfolio Management System${CL}"
    echo -e "${YW}Installer Wrapper $(get_installer_version)${CL}\n"
}

# Check root
function check_root {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RD}Error: This script must be run as root${CL}"
        echo -e "${YW}Please run: ${GN}sudo bash -c \"\$(curl -fsSL \"$GITHUB_RAW/profolio.sh\")\"${CL}"
        exit 1
    fi
}

# Non-TUI installation
function install_no_tui {
    echo -e "${YW}Installing Profolio...${CL}\n"
    
    # Download installer
    echo -e " ${BL}●${CL} Downloading installer..."
    mkdir -p "$TEMP_DIR"
    curl -fsSL "$GITHUB_RAW/$INSTALLER_SCRIPT" -o "$TEMP_DIR/$INSTALLER_SCRIPT" 2>/dev/null
    chmod +x "$TEMP_DIR/$INSTALLER_SCRIPT"
    
    # Run installer
    echo -e " ${BL}●${CL} Running installer...\n"
    bash "$TEMP_DIR/$INSTALLER_SCRIPT"
    
    # Cleanup
    rm -rf "$TEMP_DIR"
}

# Check if repair is needed
function needs_repair {
    # Check if Profolio is installed but services are down
    if [ -d "$INSTALL_DIR" ] && [ -f "/etc/systemd/system/profolio-backend.service" ]; then
        if ! systemctl is-active --quiet profolio-backend 2>/dev/null || ! systemctl is-active --quiet profolio-frontend 2>/dev/null; then
            return 0  # Needs repair
        fi
    fi
    return 1  # No repair needed
}

# TUI Main Menu
function main_menu {
    while true; do
        local choice
        local menu_items=(
            1 "Install Profolio (Recommended)"
            2 "Update Existing Installation"
            3 "Advanced Installation"
            4 "System Tools & Diagnostics >"
            5 "Health Check"
            6 "Config Management >"
        )
        
        # Check repair status once and cache the result
        local repair_needed
        if needs_repair; then
            repair_needed="yes"
        else
            repair_needed="no"
        fi
        
        # Add repair option if needed
        local menu_height=20
        if [ "$repair_needed" = "yes" ]; then
            menu_items+=(7 "🔧 Repair Installation (Services Down)")
            menu_items+=(8 "System Requirements")
            menu_items+=(9 "About Profolio")
            menu_items+=(10 "Exit")
            menu_height=22
        else
            menu_items+=(7 "System Requirements")
            menu_items+=(8 "About Profolio")
            menu_items+=(9 "Exit")
        fi
        
        # Calculate menu count dynamically from array
        local menu_count=$((${#menu_items[@]}/2))
        
        choice=$($TUI_TOOL --title "Profolio Installer $(get_installer_version)" \
            --menu "Select an option:" $menu_height 70 "$menu_count" \
            "${menu_items[@]}" 3>&1 1>&2 2>&3)
        
        # Handle menu choices dynamically based on repair option
        if [ "$repair_needed" = "yes" ]; then
            case $choice in
                1) install_profolio ;;
                2) update_profolio ;;
                3) advanced_install ;;
                4) system_tools_menu ;;
                5) run_health_check ;;
                6) config_menu ;;
                7) repair_installation ;;
                8) show_requirements ;;
                9) show_about ;;
                10) exit 0 ;;
                *) exit 0 ;;
            esac
        else
            case $choice in
                1) install_profolio ;;
                2) update_profolio ;;
                3) advanced_install ;;
                4) system_tools_menu ;;
                5) run_health_check ;;
                6) config_menu ;;
                7) show_requirements ;;
                8) show_about ;;
                9) exit 0 ;;
                *) exit 0 ;;
            esac
        fi
    done
}

# Standard Installation
function install_profolio {
    if $TUI_TOOL --title "Install Profolio" \
        --yesno "This will install Profolio with default settings:\n\n- 2 CPU cores\n- 2GB RAM\n- 20GB disk space\n- PostgreSQL database\n- Nginx reverse proxy\n\nDo you want to continue?" 14 50; then
        
        # Use enhanced installation with progress monitoring
        install_with_progress "Installation" ""
        
        # Show access information on success
        local ip_address=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
        $TUI_TOOL --title "Installation Complete" \
            --msgbox "Profolio has been successfully installed!\n\nAccess your instance at:\nhttp://$ip_address\n\nDefault admin credentials will be shown in the terminal output above." 12 60
    fi
    
    main_menu
}

# Update Installation
function update_profolio {
    if [ ! -d "$INSTALL_DIR" ]; then
        $TUI_TOOL --title "No Installation Found" \
            --msgbox "No existing Profolio installation found at $INSTALL_DIR.\n\nPlease use 'Install Profolio' option first." 10 50
        main_menu
        return 1
    fi
    
    if $TUI_TOOL --title "Update Profolio" \
        --yesno "This will update your existing Profolio installation.\n\nYour data will be preserved.\n\nDo you want to continue?" 12 50; then
        
        # Create update script
        cat > "$TEMP_DIR/update.sh" <<'EOF'
#!/bin/bash
set -e

echo "Updating Profolio..."

# Stop services
systemctl stop profolio-frontend profolio-backend

# Backup current installation
cp -r "$INSTALL_DIR" "$INSTALL_DIR.backup.$(date +%Y%m%d-%H%M%S)"

# Pull latest changes
cd "$INSTALL_DIR"
git pull

# Update dependencies and rebuild
cd frontend
pnpm install
pnpm build

cd ../backend
pnpm install
pnpm build
pnpm prisma migrate deploy

# Restart services
systemctl start profolio-frontend profolio-backend

echo "Update complete!"
EOF
        chmod +x "$TEMP_DIR/update.sh"
        
        clear
        bash "$TEMP_DIR/update.sh"
        rm -rf "$TEMP_DIR"
        
        $TUI_TOOL --title "Update Complete" \
            --msgbox "Profolio has been successfully updated!" 8 50
    fi
    
    main_menu
}

# Repair Installation
function repair_installation {
    if $TUI_TOOL --title "Repair Installation" \
        --yesno "This will attempt to repair your Profolio installation:\n\n✅ Rebuild application\n✅ Fix dependencies\n✅ Restart services\n✅ Verify functionality\n\nYour data will be preserved.\n\nDo you want to continue?" 14 60; then
        
        # Use enhanced installation with progress monitoring for repair
        install_with_progress "Repair" "--repair"
        
    fi
    
    main_menu
}

# Advanced Installation
function advanced_install {
    # Initialize configuration variables
    local target_version="latest"
    local optimization_level="safe"
    local preserve_env="yes"
    local enable_rollback="yes"
    local backup_dir="/opt"
    local custom_env_vars=""
    
    # Check if we're already inside a container
    local in_container=false
    if [ -f /.dockerenv ] || [ -f /run/systemd/container ] || grep -qa container=lxc /proc/1/environ 2>/dev/null; then
        in_container=true
    fi
    
    # Advanced Setup Menu Loop
    local main_menu=true
    while [ "$main_menu" = true ]; do
        local choice
        choice=$($TUI_TOOL --title "Advanced Installation Setup" \
            --menu "Configure your installation:" 18 70 8 \
            1 "Version Control Settings >" \
            2 "Optimization Settings >" \
            3 "Environment Configuration >" \
            4 "Rollback Protection >" \
            5 "Backup Configuration >" \
            6 "Review & Install" \
            7 "Return to Main Menu" 3>&1 1>&2 2>&3) || main_menu
        
        case $choice in
            1) configure_version_control_tui target_version ;;
            2) configure_optimization_tui optimization_level ;;
            3) configure_environment_tui custom_env_vars preserve_env ;;
            4) configure_rollback_tui enable_rollback ;;
            5) configure_backup_tui backup_dir ;;
            6) 
                show_advanced_summary "$target_version" "$optimization_level" "$preserve_env" "$enable_rollback" "$backup_dir"
                if confirm_advanced_install; then
                    execute_advanced_install "$target_version" "$optimization_level" "$preserve_env" "$enable_rollback" "$backup_dir" "$custom_env_vars"
                    main_menu=false
                fi
                ;;
            7) main_menu; return ;;
            *) main_menu; return ;;
        esac
    done
}

# Configure Version Control Settings
function configure_version_control_tui {
    local -n version_var=$1
    local latest_stable=$(get_latest_app_version)
    
    local choice
    choice=$($TUI_TOOL --title "Version Control Settings" \
        --menu "Select version to install:" 16 70 6 \
        1 "Latest Stable (${latest_stable}) - Recommended" \
        2 "Latest Development (main branch)" \
        3 "Specific Version" \
        4 "Restore from Backup" \
        5 "Back" 3>&1 1>&2 2>&3) || return
    
    case $choice in
        1) version_var="$latest_stable" ;;
        2) version_var="main" ;;
        3) 
            local custom_version
            custom_version=$($TUI_TOOL --title "Custom Version" \
                --inputbox "Enter version tag (e.g., v1.16.0) or branch:" 8 60 "" 3>&1 1>&2 2>&3)
            if [ -n "$custom_version" ]; then
                version_var="$custom_version"
            fi
            ;;
        4) 
            local backup_selected
            backup_selected=$(show_backup_selection_tui)
            if [ $? -eq 0 ]; then
                version_var="backup:$backup_selected"
            fi
            ;;
        5) return ;;
    esac
    
    $TUI_TOOL --title "Version Selected" \
        --msgbox "Selected version: $version_var" 8 50
}

# Configure Optimization Settings
function configure_optimization_tui {
    local -n opt_var=$1
    
    local choice
    choice=$($TUI_TOOL --title "Optimization Settings" \
        --menu "Choose optimization level:" 16 70 4 \
        1 "Safe Optimization (Recommended) - ~600MB" \
        2 "Aggressive Optimization - ~400MB (⚠️  Use with caution)" \
        3 "No Optimization - Full size" \
        4 "Back" 3>&1 1>&2 2>&3) || return
    
    case $choice in
        1) opt_var="safe" ;;
        2) 
            if $TUI_TOOL --title "Aggressive Optimization Warning" \
                --yesno "⚠️  Aggressive optimization removes additional packages and may affect debugging capabilities.\n\nThis is recommended only for production environments with storage constraints.\n\nProceed with aggressive optimization?" 12 70; then
                opt_var="aggressive"
            else
                opt_var="safe"
            fi
            ;;
        3) opt_var="none" ;;
        4) return ;;
    esac
    
    $TUI_TOOL --title "Optimization Selected" \
        --msgbox "Selected optimization: $opt_var" 8 50
}

# Configure Environment Settings
function configure_environment_tui {
    local -n env_var=$1
    local -n preserve_var=$2
    
    local choice
    choice=$($TUI_TOOL --title "Environment Configuration" \
        --menu "Environment options:" 14 70 4 \
        1 "Preserve existing environment (Recommended)" \
        2 "Reset environment completely" \
        3 "Add custom environment variables" \
        4 "Back" 3>&1 1>&2 2>&3) || return
    
    case $choice in
        1) preserve_var="yes" ;;
        2) preserve_var="no" ;;
        3) 
            local custom_env
            custom_env=$($TUI_TOOL --title "Custom Environment Variables" \
                --inputbox "Enter custom variables (KEY=value format, space-separated):" 8 70 "" 3>&1 1>&2 2>&3)
            if [ -n "$custom_env" ]; then
                env_var="$custom_env"
            fi
            ;;
        4) return ;;
    esac
    
    $TUI_TOOL --title "Environment Configured" \
        --msgbox "Environment preservation: $preserve_var\nCustom variables: ${env_var:-None}" 8 60
}

# Configure Rollback Protection
function configure_rollback_tui {
    local -n rollback_var=$1
    
    if $TUI_TOOL --title "Rollback Protection" \
        --yesno "Enable automatic rollback if installation fails?\n\nThis creates a backup and automatically restores if something goes wrong.\n\nRecommended: Yes" 10 60; then
        rollback_var="yes"
    else
        rollback_var="no"
    fi
}

# Configure Backup Settings
function configure_backup_tui {
    local -n backup_var=$1
    
    local choice
    choice=$($TUI_TOOL --title "Backup Configuration" \
        --menu "Backup options:" 12 60 4 \
        1 "Default backup location (/opt)" \
        2 "Custom backup location" \
        3 "Skip backup creation" \
        4 "Back" 3>&1 1>&2 2>&3) || return
    
    case $choice in
        1) backup_var="/opt" ;;
        2) 
            local custom_backup
            custom_backup=$($TUI_TOOL --title "Custom Backup Location" \
                --inputbox "Enter backup directory path:" 8 60 "/opt" 3>&1 1>&2 2>&3)
            if [ -n "$custom_backup" ]; then
                backup_var="$custom_backup"
            fi
            ;;
        3) backup_var="none" ;;
        4) return ;;
    esac
}

# Show Advanced Summary
function show_advanced_summary {
    local version="$1"
    local optimization="$2"
    local preserve_env="$3"
    local rollback="$4"
    local backup_dir="$5"
    
    $TUI_TOOL --title "Advanced Installation Summary" \
        --msgbox "Configuration Summary:\n\n• Version: $version\n• Optimization: $optimization\n• Preserve Environment: $preserve_env\n• Rollback Protection: $rollback\n• Backup Location: $backup_dir\n\nReady to proceed with installation." 14 60
}

# Confirm Advanced Installation
function confirm_advanced_install {
    $TUI_TOOL --title "Confirm Advanced Installation" \
        --yesno "Proceed with advanced installation using the configured settings?\n\nThis will:\n• Download the installer\n• Apply all your customizations\n• Install Profolio with advanced options\n\nContinue?" 12 60
}

# Execute Advanced Installation
function execute_advanced_install {
    local version="$1"
    local optimization="$2"
    local preserve_env="$3"
    local rollback="$4"
    local backup_dir="$5"
    local custom_env="$6"
    
    # Set environment variables for installer
    export PROFOLIO_VERSION="$version"
    export PROFOLIO_OPTIMIZATION="$optimization"
    export PROFOLIO_PRESERVE_ENV="$preserve_env"
    export PROFOLIO_ENABLE_ROLLBACK="$rollback"
    export PROFOLIO_BACKUP_DIR="$backup_dir"
    [ -n "$custom_env" ] && export PROFOLIO_CUSTOM_ENV="$custom_env"
    
    # Use enhanced installation with progress monitoring for advanced install
    local install_result
    install_with_progress "Advanced Installation" "--advanced"
    install_result=$?
    
    # Clean up environment variables after installation
    cleanup_environment_vars
    
    main_menu
    return $install_result
}

# Simplified Progress Monitoring (no TUI dialogs to avoid hanging)
function monitor_installation_progress {
    local operation_type="$1"
    
    # Simple terminal-based progress monitoring
    echo -e "${YW}$operation_type Progress:${CL}"
    echo "Progress will be shown below (this may take several minutes)..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Start a simple background monitor that shows dots
    (
        local start_time
        start_time=$(date +%s)
        local timeout=1800  # 30 minutes timeout
        local dot_count=0
        
        while true; do
            # Check for timeout
            local current_time
            current_time=$(date +%s)
            if [ $((current_time - start_time)) -gt $timeout ]; then
                echo -e "\n${RD}TIMEOUT: Installation taking too long (>30min)${CL}"
                break
            fi
            
            # Show progress dots
            printf "."
            dot_count=$((dot_count + 1))
            if [ $dot_count -ge 60 ]; then
                printf "\n"
                dot_count=0
            fi
            
            sleep 1
        done
    ) &
    local monitor_pid=$!
    
    # Return monitor PID (no tailbox PID needed)
    echo "0 $monitor_pid"
}

# Enhanced installation with progress monitoring
function install_with_progress {
    local operation_type="$1"
    local installer_args="$2"
    
    # Setup cleanup trap for this function
    trap 'cleanup_temp_files' EXIT INT TERM
    
    # Download installer with error checking
    mkdir -p "$TEMP_DIR"
    
    if ! curl -fsSL "$GITHUB_RAW/$INSTALLER_SCRIPT" -o "$TEMP_DIR/$INSTALLER_SCRIPT"; then
        $TUI_TOOL --title "Download Failed" \
            --msgbox "Failed to download installer script.\n\nPlease check your internet connection and try again." 8 60
        return 1
    fi
    
    # Verify download and make executable
    if [ ! -f "$TEMP_DIR/$INSTALLER_SCRIPT" ] || [ ! -s "$TEMP_DIR/$INSTALLER_SCRIPT" ]; then
        $TUI_TOOL --title "Download Failed" \
            --msgbox "Downloaded installer script is empty or missing.\n\nPlease try again." 8 60
        return 1
    fi
    
    chmod +x "$TEMP_DIR/$INSTALLER_SCRIPT"
    
    # Start simple progress monitoring
    local monitor_pids_string
    monitor_pids_string=$(monitor_installation_progress "$operation_type")
    
    # Convert to array for cleanup
    read -ra monitor_pids <<< "$monitor_pids_string"
    
    # Run installer directly without complex TUI integration
    clear
    echo -e "${GN}Starting $operation_type...${CL}\n"
    
    if [ -n "$installer_args" ]; then
        bash "$TEMP_DIR/$INSTALLER_SCRIPT" "$installer_args"
    else
        bash "$TEMP_DIR/$INSTALLER_SCRIPT"
    fi
    local install_result=$?
    
    # Cleanup monitoring processes
    for pid in "${monitor_pids[@]}"; do
        if [ "$pid" -gt 0 ] 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Remove temporary files
    rm -rf "$TEMP_DIR"
    
    # Show completion status
    if [ $install_result -eq 0 ]; then
        $TUI_TOOL --title "$operation_type Complete" \
            --msgbox "$operation_type completed successfully!\n\nProfolio should now be running properly." 8 60
    else
        $TUI_TOOL --title "$operation_type Failed" \
            --msgbox "$operation_type encountered errors.\n\nCheck the output above for details.\n\nYou may need to run a repair installation." 10 60
    fi
    
    return $install_result
}

# Cleanup environment variables
function cleanup_environment_vars {
    unset PROFOLIO_VERSION
    unset PROFOLIO_OPTIMIZATION
    unset PROFOLIO_PRESERVE_ENV
    unset PROFOLIO_ENABLE_ROLLBACK
    unset PROFOLIO_BACKUP_DIR
    unset PROFOLIO_CUSTOM_ENV
}

# Cleanup function for temporary files
function cleanup_temp_files {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Show Requirements
function show_requirements {
    $TUI_TOOL --title "System Requirements" \
        --msgbox "Minimum Requirements:\n- OS: Ubuntu 20.04+ / Debian 11+\n- CPU: 1 core\n- RAM: 1GB\n- Storage: 15GB\n- Network: Internet connection\n\nRecommended:\n- CPU: 2 cores\n- RAM: 2GB\n- Storage: 20GB\n- SSL certificate for production" 16 60
    
    main_menu
}

# Show About
function show_about {
    $TUI_TOOL --title "About Profolio" \
        --msgbox "Profolio - Professional Portfolio Management\n\nLatest Available: $(get_latest_app_version)\nInstalled Version: $(get_installed_version)\nInstaller Version: $(get_installer_version)\nLicense: MIT\nAuthor: Obednal97\n\nA privacy-focused, self-hosted portfolio management system with:\n- Real-time portfolio tracking\n- Multi-asset support\n- Expense management\n- Property tracking\n- Bank account integration\n\nGitHub: github.com/Obednal97/profolio" 22 65
    
    main_menu
}

# Show backup selection in TUI
function show_backup_selection_tui {
    # Scan for available backups
    local backups=()
    local backup_paths=()
    
    # Look for backup directories
    local parent_dir
    parent_dir="$(dirname "$INSTALL_DIR")"
    local base_name
    base_name="$(basename "$INSTALL_DIR")"
    
    for backup_dir in "${parent_dir}/${base_name}"-* "${parent_dir}/${base_name}"-backup-* "${parent_dir}/${base_name}"-rollback-*; do
        if [ -d "$backup_dir" ]; then
            local backup_name
            backup_name=$(basename "$backup_dir")
            local backup_date="Unknown"
            local backup_version="Unknown"
            
            # Try to extract date from directory name
            if [[ "$backup_name" =~ [0-9]{8}_[0-9]{6} ]]; then
                backup_date=$(echo "$backup_name" | grep -o '[0-9]\{8\}_[0-9]\{6\}' | sed 's/_/ /')
            fi
            
            # Try to get version from package.json
            if [ -f "$backup_dir/frontend/package.json" ]; then
                backup_version=$(grep '"version"' "$backup_dir/frontend/package.json" | cut -d'"' -f4 2>/dev/null || echo "Unknown")
            fi
            
            backups+=("$backup_dir")
            backups+=("$backup_name - v$backup_version ($backup_date)")
            backup_paths+=("$backup_dir")
        fi
    done
    
    if [ ${#backup_paths[@]} -eq 0 ]; then
        $TUI_TOOL --title "No Backups Found" \
            --msgbox "No backup directories found.\n\nBackup locations checked:\n- /opt/profolio-*\n- /opt/profolio-backup-*\n- /opt/profolio-rollback-*" 12 60
        return 1
    fi
    
    local selected_backup
    selected_backup=$($TUI_TOOL --title "Select Backup to Restore" \
        --menu "Choose backup to restore from:" 16 70 8 \
        "${backups[@]}" 3>&1 1>&2 2>&3) || return 1
    
    # Confirmation dialog
    local backup_info
    for i in "${!backup_paths[@]}"; do
        if [ "${backup_paths[$i]}" = "$selected_backup" ]; then
            backup_info="${backups[$((i*2+1))]}"
            break
        fi
    done
    
    $TUI_TOOL --title "Confirm Backup Restoration" \
        --yesno "Restore from this backup?\n\n$backup_info\n\nThis will replace your current installation!" 12 60 || return 1
    
    echo "$selected_backup"
}

# System Tools & Diagnostics Menu
function system_tools_menu {
    while true; do
        local choice
        choice=$($TUI_TOOL --title "System Tools & Diagnostics" \
            --menu "Select a tool:" 22 70 12 \
            1 "Validate System Resources" \
            2 "Detect Network Configuration" \
            3 "Collect Diagnostics" \
            4 "Run Health Check" \
            5 "Generate Reports" \
            6 "─── Maintenance Tools ───" \
            7 "Clean Dependencies (node_modules)" \
            8 "Reset Lock Files" \
            9 "Clear Build Artifacts" \
            10 "Installation Integrity Check" \
            11 "Run All Cleanup Tasks" \
            12 "Back to Main Menu" 3>&1 1>&2 2>&3)
        
        case $choice in
            1) validate_resources ;;
            2) detect_network ;;
            3) collect_diagnostics ;;
            4) run_health_check ;;
            5) generate_reports ;;
            6) return ;;
            7) clean_dependencies ;;
            8) reset_lock_files ;;
            9) clear_build_artifacts ;;
            10) integrity_check ;;
            11) run_all_cleanup ;;
            12) return ;;
            *) return ;;
        esac
    done
}

# Clean Dependencies Function
function clean_dependencies {
    if $TUI_TOOL --title "Clean Dependencies" \
        --yesno "This will remove all node_modules directories to free up space and resolve dependency conflicts.\n\nThis is safe and packages will be reinstalled on next run.\n\nProceed with dependency cleanup?" 12 60; then
        
        clear
        echo "Cleaning dependencies..."
        bash "$SCRIPT_DIR/install.sh" --advanced --tools-maintenance --clean-deps
        
        $TUI_TOOL --title "Dependency Cleanup Complete" \
            --msgbox "Dependencies have been cleaned successfully.\n\nRun update or start services to reinstall dependencies." 10 50
    fi
    
    read -p "Press Enter to continue..."
}

# Reset Lock Files Function
function reset_lock_files {
    if $TUI_TOOL --title "Reset Lock Files" \
        --yesno "This will remove package lock files to resolve version conflicts and dependency issues.\n\nThis is safe and lock files will be regenerated on next install.\n\nProceed with lock file reset?" 12 60; then
        
        clear
        echo "Resetting lock files..."
        bash "$SCRIPT_DIR/install.sh" --advanced --tools-maintenance --reset-locks
        
        $TUI_TOOL --title "Lock File Reset Complete" \
            --msgbox "Lock files have been reset successfully.\n\nRun update or start services to regenerate lock files." 10 50
    fi
    
    read -p "Press Enter to continue..."
}

# Clear Build Artifacts Function
function clear_build_artifacts {
    if $TUI_TOOL --title "Clear Build Artifacts" \
        --yesno "This will remove all build artifacts and compiled files to free up space and force fresh builds.\n\nThis includes dist/, build/, .next/ directories.\n\nProceed with artifact cleanup?" 12 60; then
        
        clear
        echo "Clearing build artifacts..."
        bash "$SCRIPT_DIR/install.sh" --advanced --tools-maintenance --clear-artifacts
        
        $TUI_TOOL --title "Build Artifacts Cleared" \
            --msgbox "Build artifacts have been cleared successfully.\n\nRun update or start services to rebuild artifacts." 10 50
    fi
    
    read -p "Press Enter to continue..."
}

# Installation Integrity Check Function
function integrity_check {
    clear
    echo "Running installation integrity check..."
    bash "$SCRIPT_DIR/install.sh" --advanced --tools-maintenance --integrity-check
    
    $TUI_TOOL --title "Integrity Check Complete" \
        --msgbox "Installation integrity check completed.\n\nCheck the output above for any issues found." 10 50
    
    read -p "Press Enter to continue..."
}

# Run All Cleanup Tasks Function
function run_all_cleanup {
    if $TUI_TOOL --title "Run All Cleanup Tasks" \
        --yesno "This will run all maintenance tasks:\n\n• Clean Dependencies (node_modules)\n• Reset Lock Files\n• Clear Build Artifacts\n• Integrity Check\n\nThis may take several minutes.\n\nProceed with full cleanup?" 14 60; then
        
        clear
        echo "Running all cleanup tasks..."
        bash "$SCRIPT_DIR/install.sh" --advanced --tools-maintenance --run-all-cleanup
        
        $TUI_TOOL --title "Full Cleanup Complete" \
            --msgbox "All cleanup tasks completed successfully.\n\nYour installation has been thoroughly cleaned." 10 50
    fi
    
    read -p "Press Enter to continue..."
}

# Config Management Menu
function config_menu {
    while true; do
        local choice
        choice=$($TUI_TOOL --title "Configuration Management" \
            --menu "Select an option:" 16 60 7 \
            1 "Export Current Config" \
            2 "Import Config File" \
            3 "Validate Config" \
            4 "Generate Sample Config" \
            5 "List Saved Configs" \
            6 "Back to Main Menu" 3>&1 1>&2 2>&3)
        
        case $choice in
            1) export_configuration ;;
            2) import_configuration ;;
            3) validate_configuration ;;
            4) generate_sample ;;
            5) list_configurations ;;
            6) return ;;
            *) return ;;
        esac
    done
}

# Validate Resources
function validate_resources {
    clear
    echo "Validating system resources..."
    
    # Source the resource validator
    if [ -f "$SCRIPT_DIR/lib/resource-validator.sh" ]; then
        source "$SCRIPT_DIR/lib/resource-validator.sh"
        validate_all
    else
        # Fallback to basic check
        echo "CPU Cores: $(nproc)"
        echo "Memory: $(free -h | awk '/^Mem:/{print $2}')"
        echo "Disk Space: $(df -h /opt | awk 'NR==2{print $4}')"
    fi
    
    read -p "Press Enter to continue..."
}

# Detect Network Configuration
function detect_network {
    clear
    echo "Detecting network configuration..."
    
    # Source the network detector
    if [ -f "$SCRIPT_DIR/lib/network-detector.sh" ]; then
        source "$SCRIPT_DIR/lib/network-detector.sh"
        detect_all
    else
        # Fallback to basic detection
        echo "IP Address: $(ip -4 addr show | grep inet | grep -v 127.0.0.1 | head -1 | awk '{print $2}')"
        echo "Gateway: $(ip route | grep default | awk '{print $3}')"
        echo "DNS: $(grep nameserver /etc/resolv.conf | head -1 | awk '{print $2}')"
    fi
    
    read -p "Press Enter to continue..."
}

# Collect Diagnostics
function collect_diagnostics {
    clear
    
    if [ -f "$SCRIPT_DIR/lib/diagnostics.sh" ]; then
        source "$SCRIPT_DIR/lib/diagnostics.sh"
        run_diagnostics
    else
        echo "Diagnostics module not available"
    fi
    
    read -p "Press Enter to continue..."
}

# Run Health Check
function run_health_check {
    clear
    echo "Running health check..."
    
    if [ -f "$SCRIPT_DIR/lib/health-checks.sh" ]; then
        source "$SCRIPT_DIR/lib/health-checks.sh"
        check_all
    else
        # Basic health check
        echo "Checking services..."
        systemctl is-active --quiet profolio-backend && echo "✓ Backend: Running" || echo "✗ Backend: Not running"
        systemctl is-active --quiet profolio-frontend && echo "✓ Frontend: Running" || echo "✗ Frontend: Not running"
        systemctl is-active --quiet postgresql && echo "✓ Database: Running" || echo "✗ Database: Not running"
        systemctl is-active --quiet nginx && echo "✓ Nginx: Running" || echo "✗ Nginx: Not running"
    fi
    
    read -p "Press Enter to continue..."
}

# Export Configuration
function export_configuration {
    clear
    
    if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
        source "$SCRIPT_DIR/lib/config-manager.sh"
        export_config
        echo -e "\nConfiguration exported successfully!"
    else
        echo "Config manager not available"
    fi
    
    read -p "Press Enter to continue..."
}

# Import Configuration
function import_configuration {
    local config_file
    config_file=$($TUI_TOOL --title "Import Configuration" \
        --inputbox "Enter config file path:" 8 60 "/opt/profolio/config/profolio.conf" 3>&1 1>&2 2>&3)
    
    if [ -n "$config_file" ] && [ -f "$config_file" ]; then
        if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
            source "$SCRIPT_DIR/lib/config-manager.sh"
            import_config "$config_file"
            echo -e "\nConfiguration imported successfully!"
        else
            echo "Config manager not available"
        fi
    else
        echo "Config file not found: $config_file"
    fi
    
    read -p "Press Enter to continue..."
}

# Validate Configuration
function validate_configuration {
    local config_file
    config_file=$($TUI_TOOL --title "Validate Configuration" \
        --inputbox "Enter config file path:" 8 60 "/opt/profolio/config/profolio.conf" 3>&1 1>&2 2>&3)
    
    if [ -n "$config_file" ] && [ -f "$config_file" ]; then
        if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
            source "$SCRIPT_DIR/lib/config-manager.sh"
            validate_config "$config_file"
        else
            echo "Config manager not available"
        fi
    else
        echo "Config file not found: $config_file"
    fi
    
    read -p "Press Enter to continue..."
}

# Generate Sample Configuration
function generate_sample {
    clear
    
    if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
        source "$SCRIPT_DIR/lib/config-manager.sh"
        generate_sample_config
        echo -e "\nSample configuration generated!"
    else
        echo "Config manager not available"
    fi
    
    read -p "Press Enter to continue..."
}

# List Configurations
function list_configurations {
    clear
    
    if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
        source "$SCRIPT_DIR/lib/config-manager.sh"
        list_configs
    else
        echo "Config manager not available"
    fi
    
    read -p "Press Enter to continue..."
}

# Generate Reports
function generate_reports {
    local report_type
    report_type=$($TUI_TOOL --title "Generate Reports" \
        --menu "Select report type:" 14 50 5 \
        1 "Resource Report" \
        2 "Health Report" \
        3 "Network Report" \
        4 "Full Diagnostic Report" \
        5 "Back" 3>&1 1>&2 2>&3)
    
    case $report_type in
        1)
            if [ -f "$SCRIPT_DIR/lib/resource-validator.sh" ]; then
                source "$SCRIPT_DIR/lib/resource-validator.sh"
                generate_report "/tmp/profolio-resource-report.txt"
                echo "Report saved to: /tmp/profolio-resource-report.txt"
            fi
            ;;
        2)
            if [ -f "$SCRIPT_DIR/lib/health-checks.sh" ]; then
                source "$SCRIPT_DIR/lib/health-checks.sh"
                generate_report "/tmp/profolio-health-report.txt"
                echo "Report saved to: /tmp/profolio-health-report.txt"
            fi
            ;;
        3)
            if [ -f "$SCRIPT_DIR/lib/network-detector.sh" ]; then
                source "$SCRIPT_DIR/lib/network-detector.sh"
                detect_all
                generate_network_config "/tmp/profolio-network-report.txt"
                echo "Report saved to: /tmp/profolio-network-report.txt"
            fi
            ;;
        4)
            if [ -f "$SCRIPT_DIR/lib/diagnostics.sh" ]; then
                source "$SCRIPT_DIR/lib/diagnostics.sh"
                COLLECT_SYSTEM=true
                COLLECT_NETWORK=true
                COLLECT_SERVICES=true
                COLLECT_LOGS=true
                COLLECT_CONFIG=true
                COLLECT_PERFORMANCE=true
                run_diagnostics
            fi
            ;;
        5)
            return
            ;;
    esac
    
    read -p "Press Enter to continue..."
}

# Parse command line arguments
function parse_arguments {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --import-config)
                shift
                if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
                    source "$SCRIPT_DIR/lib/config-manager.sh"
                    import_config "$1"
                    echo -e "${GN}Configuration imported successfully${CL}"
                    exit 0
                else
                    echo -e "${RD}Config manager not found${CL}"
                    exit 1
                fi
                ;;
            --export-config)
                shift
                if [ -f "$SCRIPT_DIR/lib/config-manager.sh" ]; then
                    source "$SCRIPT_DIR/lib/config-manager.sh"
                    export_config "$1"
                    echo -e "${GN}Configuration exported to $1${CL}"
                    exit 0
                else
                    echo -e "${RD}Config manager not found${CL}"
                    exit 1
                fi
                ;;
            --validate-only)
                if [ -f "$SCRIPT_DIR/lib/resource-validator.sh" ]; then
                    source "$SCRIPT_DIR/lib/resource-validator.sh"
                    validate_all
                    exit $?
                else
                    echo -e "${RD}Resource validator not found${CL}"
                    exit 1
                fi
                ;;
            --health-check)
                if [ -f "$SCRIPT_DIR/lib/health-checks.sh" ]; then
                    source "$SCRIPT_DIR/lib/health-checks.sh"
                    run_all_checks
                    exit $?
                else
                    echo -e "${RD}Health check module not found${CL}"
                    exit 1
                fi
                ;;
            --diagnostics)
                if [ -f "$SCRIPT_DIR/lib/diagnostics.sh" ]; then
                    source "$SCRIPT_DIR/lib/diagnostics.sh"
                    COLLECT_SYSTEM=true
                    COLLECT_NETWORK=true
                    COLLECT_SERVICES=true
                    COLLECT_LOGS=true
                    COLLECT_CONFIG=true
                    COLLECT_PERFORMANCE=true
                    run_diagnostics
                    exit $?
                else
                    echo -e "${RD}Diagnostics module not found${CL}"
                    exit 1
                fi
                ;;
            --network-detect)
                if [ -f "$SCRIPT_DIR/lib/network-detector.sh" ]; then
                    source "$SCRIPT_DIR/lib/network-detector.sh"
                    detect_all
                    print_summary
                    exit 0
                else
                    echo -e "${RD}Network detector not found${CL}"
                    exit 1
                fi
                ;;
            *)
                echo -e "${RD}Unknown option: $1${CL}"
                show_help
                exit 1
                ;;
        esac
        shift
    done
}

# Show help message
function show_help {
    cat << EOF
${CY}Profolio Installer $(get_installer_version)${CL}

${YW}Usage:${CL}
  sudo $0 [OPTIONS]

${YW}Options:${CL}
  --help, -h              Show this help message
  --import-config FILE    Import configuration from JSON file
  --export-config FILE    Export current configuration to JSON file
  --validate-only         Run system validation without installing
  --health-check          Run health checks on existing installation
  --diagnostics           Collect diagnostic information
  --network-detect        Run network auto-detection

${YW}Examples:${CL}
  # Interactive installation with TUI
  sudo $0

  # Automated installation with config file
  sudo $0 --import-config production.json

  # Check system before installation
  sudo $0 --validate-only

  # Monitor existing installation
  sudo $0 --health-check

${YW}For more information:${CL}
  https://github.com/Obednal97/profolio

EOF
}

# Main execution
function main {
    # Parse command-line arguments first
    if [ $# -gt 0 ]; then
        parse_arguments "$@"
    fi
    
    header_info
    check_root
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    trap "rm -rf \"$TEMP_DIR\"" EXIT
    
    if [ "$TUI_ENABLED" = true ]; then
        main_menu
    else
        echo -e "${YW}TUI not available. Running standard installation...${CL}\n"
        install_no_tui
    fi
}

# Run main
main "$@"