#!/usr/bin/env bash

# Profolio Installation Wrapper - Proxmox Community Script Style
# This script downloads and executes the main installer with TUI options
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh)"

# Exit on error
set -e

# Variables
GITHUB_RAW="https://raw.githubusercontent.com/Obednal97/profolio/main"
TEMP_DIR="/tmp/profolio-installer-$$"
INSTALLER_SCRIPT="install-v2.sh"
TUI_ENABLED=true

# Colors
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[31m")
GN=$(echo "\033[32m")
CL=$(echo "\033[0m")

# Check for whiptail/dialog
if command -v whiptail >/dev/null 2>&1; then
    TUI_TOOL="whiptail"
elif command -v dialog >/dev/null 2>&1; then
    TUI_TOOL="dialog"
else
    TUI_ENABLED=false
fi

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
    echo -e "${YW}Installer Wrapper v2.0${CL}\n"
}

# Check root
function check_root {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RD}Error: This script must be run as root${CL}"
        echo -e "${YW}Please run: ${GN}sudo bash -c \"\$(curl -fsSL $GITHUB_RAW/profolio.sh)\"${CL}"
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

# TUI Main Menu
function main_menu {
    local choice
    choice=$($TUI_TOOL --title "Profolio Installer" \
        --menu "Select an installation option:" 15 60 6 \
        "1" "Install Profolio (Recommended)" \
        "2" "Update Existing Installation" \
        "3" "Advanced Installation" \
        "4" "System Requirements" \
        "5" "About Profolio" \
        "6" "Exit" 3>&1 1>&2 2>&3)
    
    case $choice in
        1) install_profolio ;;
        2) update_profolio ;;
        3) advanced_install ;;
        4) show_requirements ;;
        5) show_about ;;
        6) exit 0 ;;
        *) exit 0 ;;
    esac
}

# Standard Installation
function install_profolio {
    if $TUI_TOOL --title "Install Profolio" \
        --yesno "This will install Profolio with default settings:\n\n- 2 CPU cores\n- 4GB RAM\n- 20GB disk space\n- PostgreSQL database\n- Nginx reverse proxy\n\nDo you want to continue?" 14 50; then
        
        # Download and run installer
        mkdir -p "$TEMP_DIR"
        curl -fsSL "$GITHUB_RAW/$INSTALLER_SCRIPT" -o "$TEMP_DIR/$INSTALLER_SCRIPT" 2>/dev/null
        chmod +x "$TEMP_DIR/$INSTALLER_SCRIPT"
        
        clear
        bash "$TEMP_DIR/$INSTALLER_SCRIPT"
        rm -rf "$TEMP_DIR"
        
        $TUI_TOOL --title "Installation Complete" \
            --msgbox "Profolio has been successfully installed!\n\nAccess your instance at:\nhttp://$(hostname -I | awk '{print $1}')" 10 50
    fi
    
    main_menu
}

# Update Installation
function update_profolio {
    if [ ! -d "/opt/profolio" ]; then
        $TUI_TOOL --title "No Installation Found" \
            --msgbox "No existing Profolio installation found.\n\nPlease use 'Install Profolio' option first." 10 50
        main_menu
        return
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
cp -r /opt/profolio /opt/profolio.backup.$(date +%Y%m%d-%H%M%S)

# Pull latest changes
cd /opt/profolio
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

# Advanced Installation
function advanced_install {
    # Check if we're already inside a container
    local in_container=false
    if [ -f /.dockerenv ] || [ -f /run/systemd/container ] || grep -qa container=lxc /proc/1/environ 2>/dev/null; then
        in_container=true
    fi
    
    # Skip resource questions if already in container
    local cores="2"
    local ram="4096"
    local disk="20"
    
    if [ "$in_container" = false ]; then
        # Only ask for resources if not in a container
        # CPU Cores
        cores=$($TUI_TOOL --title "CPU Cores" \
            --inputbox "Enter number of CPU cores (1-8):" 8 50 "2" 3>&1 1>&2 2>&3) || main_menu
        
        # RAM Size
        ram=$($TUI_TOOL --title "RAM Size" \
            --inputbox "Enter RAM size in MB (1024-16384):" 8 50 "4096" 3>&1 1>&2 2>&3) || main_menu
        
        # Disk Size
        disk=$($TUI_TOOL --title "Disk Size" \
            --inputbox "Enter disk size in GB (10-100):" 8 50 "20" 3>&1 1>&2 2>&3) || main_menu
    fi
    
    # Version Selection
    local version
    version=$($TUI_TOOL --title "Version" \
        --menu "Select Profolio version:" 12 50 4 \
        "latest" "Latest (Recommended)" \
        "v1.14.16" "Stable Release" \
        "main" "Development Branch" \
        "custom" "Enter Custom Version" 3>&1 1>&2 2>&3) || main_menu
    
    if [ "$version" == "custom" ]; then
        version=$($TUI_TOOL --title "Custom Version" \
            --inputbox "Enter version tag or branch:" 8 50 "" 3>&1 1>&2 2>&3) || main_menu
    fi
    
    # Verbose Mode
    local verbose="no"
    if $TUI_TOOL --title "Verbose Mode" \
        --yesno "Enable verbose output during installation?" 8 50; then
        verbose="yes"
    fi
    
    # Confirmation
    local confirm_msg
    if [ "$in_container" = true ]; then
        confirm_msg="Install Profolio with these settings?\n\n- Version: $version\n- Verbose: $verbose\n\n(Using container's existing resources)"
    else
        confirm_msg="Install Profolio with these settings?\n\n- CPU: $cores cores\n- RAM: $ram MB\n- Disk: $disk GB\n- Version: $version\n- Verbose: $verbose"
    fi
    
    if $TUI_TOOL --title "Confirm Installation" \
        --yesno "$confirm_msg" 14 50; then
        
        # Download and run installer with parameters
        mkdir -p "$TEMP_DIR"
        curl -fsSL "$GITHUB_RAW/$INSTALLER_SCRIPT" -o "$TEMP_DIR/$INSTALLER_SCRIPT" 2>/dev/null
        chmod +x "$TEMP_DIR/$INSTALLER_SCRIPT"
        
        clear
        CORE_COUNT="$cores" RAM_SIZE="$ram" DISK_SIZE="$disk" \
            PROFOLIO_VERSION="$version" VERBOSE="$verbose" \
            bash "$TEMP_DIR/$INSTALLER_SCRIPT"
        
        rm -rf "$TEMP_DIR"
        
        $TUI_TOOL --title "Installation Complete" \
            --msgbox "Profolio has been successfully installed!" 8 50
    fi
    
    main_menu
}

# Show Requirements
function show_requirements {
    $TUI_TOOL --title "System Requirements" \
        --msgbox "Minimum Requirements:\n- OS: Ubuntu 20.04+ / Debian 11+\n- CPU: 2 cores\n- RAM: 4GB\n- Storage: 20GB\n- Network: Internet connection\n\nRecommended:\n- CPU: 4 cores\n- RAM: 8GB\n- Storage: 50GB\n- SSL certificate for production" 16 60
    
    main_menu
}

# Show About
function show_about {
    $TUI_TOOL --title "About Profolio" \
        --msgbox "Profolio - Professional Portfolio Management\n\nVersion: 1.14.16\nLicense: MIT\nAuthor: Obednal97\n\nA privacy-focused, self-hosted portfolio management system with:\n- Real-time portfolio tracking\n- Multi-asset support\n- Expense management\n- Property tracking\n- Bank account integration\n\nGitHub: github.com/Obednal97/profolio" 18 60
    
    main_menu
}

# Main execution
function main {
    header_info
    check_root
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    trap "rm -rf $TEMP_DIR" EXIT
    
    if [ "$TUI_ENABLED" = true ]; then
        main_menu
    else
        echo -e "${YW}TUI not available. Running standard installation...${CL}\n"
        install_no_tui
    fi
}

# Run main
main "$@"