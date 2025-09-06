#!/usr/bin/env bash

# Profolio Installation Wrapper - Proxmox Community Script Style
# This script downloads and executes the main installer with TUI options
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh)"

# Exit on error
set -e

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_RAW="https://raw.githubusercontent.com/Obednal97/profolio/main"
TEMP_DIR="/tmp/profolio-installer-$$"
INSTALLER_SCRIPT="install.sh"
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
    while true; do
        local choice
        choice=$($TUI_TOOL --title "🚀 Profolio Installer v1.16.0" \
            --menu "Select an option:" 20 70 12 \
            "1" "🔧 Install Profolio (Recommended)" \
            "2" "🔄 Update Existing Installation" \
            "3" "⚙️  Advanced Installation" \
            "4" "📋 System Tools & Diagnostics ▶" \
            "5" "🔍 Health Check" \
            "6" "💾 Config Management ▶" \
            "7" "📊 System Requirements" \
            "8" "📖 About Profolio" \
            "9" "🔙 Exit" 3>&1 1>&2 2>&3)
        
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
    done
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

# System Tools & Diagnostics Menu
function system_tools_menu {
    while true; do
        local choice
        choice=$($TUI_TOOL --title "System Tools & Diagnostics" \
            --menu "Select a tool:" 18 60 8 \
            "1" "🔍 Validate System Resources" \
            "2" "🌐 Detect Network Configuration" \
            "3" "📊 Collect Diagnostics" \
            "4" "🔧 Run Health Check" \
            "5" "📝 Generate Reports" \
            "6" "🔙 Back to Main Menu" 3>&1 1>&2 2>&3)
        
        case $choice in
            1) validate_resources ;;
            2) detect_network ;;
            3) collect_diagnostics ;;
            4) run_health_check ;;
            5) generate_reports ;;
            6) return ;;
            *) return ;;
        esac
    done
}

# Config Management Menu
function config_menu {
    while true; do
        local choice
        choice=$($TUI_TOOL --title "Configuration Management" \
            --menu "Select an option:" 16 60 7 \
            "1" "📤 Export Current Config" \
            "2" "📥 Import Config File" \
            "3" "✅ Validate Config" \
            "4" "📝 Generate Sample Config" \
            "5" "📋 List Saved Configs" \
            "6" "🔙 Back to Main Menu" 3>&1 1>&2 2>&3)
        
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
        "1" "Resource Report" \
        "2" "Health Report" \
        "3" "Network Report" \
        "4" "Full Diagnostic Report" \
        "5" "Back" 3>&1 1>&2 2>&3)
    
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
${CY}Profolio Installer v1.16.0${CL}

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