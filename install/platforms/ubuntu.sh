#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - UBUNTU/DEBIAN PLATFORM MODULE v1.0.0
# =============================================================================
# 
# Ubuntu/Debian platform-specific functionality for generic Linux installations
# Provides: Package management, service configuration, system optimization
#
# Compatible: Ubuntu 20.04+, Debian 11+, and derivatives
# Dependencies: common/definitions.sh
# =============================================================================

# Source common definitions if not already loaded
if [[ -z "${PROFOLIO_DEFINITIONS_LOADED:-}" ]]; then
    # Try to source from relative path first
    if [[ -f "$(dirname "${BASH_SOURCE[0]}")/../common/definitions.sh" ]]; then
        source "$(dirname "${BASH_SOURCE[0]}")/../common/definitions.sh"
    elif [[ -f "common/definitions.sh" ]]; then
        source "common/definitions.sh"
    else
        # Fallback: Define minimal requirements inline
        echo "[ERROR] Common definitions not found, using fallback" >&2
        RED='\033[0;31m'
        GREEN='\033[0;32m'
        YELLOW='\033[1;33m'
        BLUE='\033[0;34m'
        CYAN='\033[0;36m'
        WHITE='\033[1;37m'
        NC='\033[0m'
        
        info() { echo -e "${BLUE}[INFO]${NC} $*" >&2; }
        success() { echo -e "${GREEN}[SUCCESS]${NC} $*" >&2; }
        warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
        error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
    fi
fi

# Module info function
ubuntu_platform_info() {
    echo "Ubuntu/Debian Platform Module v1.0.0"
    echo "  • Generic Ubuntu/Debian system support"
    echo "  • APT package management optimization"
    echo "  • Systemd service configuration"
    echo "  • Standard Linux environment setup"
    echo "  • Direct Profolio installation"
}

# Check if this module is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    if [ -n "${INSTALLER_DEBUG:-}" ]; then
        echo "[DEBUG] Ubuntu platform module loaded"
    fi
else
    # Being executed directly
    echo "Ubuntu/Debian Platform Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    echo "Usage: source install/platforms/ubuntu.sh"
    exit 1
fi

# Detect Ubuntu/Debian version and variant
detect_ubuntu_version() {
    if [ -f "/etc/os-release" ]; then
        . /etc/os-release
        echo "$VERSION_ID"
    else
        echo "unknown"
    fi
}

# Get distribution name
get_distribution_name() {
    if [ -f "/etc/os-release" ]; then
        . /etc/os-release
        echo "$NAME"
    else
        echo "Unknown Linux"
    fi
}

# Check if distribution is supported
is_supported_distribution() {
    if [ -f "/etc/os-release" ]; then
        . /etc/os-release
        case "$ID" in
            ubuntu|debian|pop|elementary|linuxmint|zorin)
                return 0  # Supported
                ;;
            *)
                return 1  # Not supported
                ;;
        esac
    else
        return 1  # Unknown, not supported
    fi
}

# Fix broken package dependencies
fix_package_dependencies() {
    info "Fixing broken package dependencies..."
    
    # Try to fix broken packages first
    info "Configuring unconfigured packages..."
    dpkg --configure -a 2>/dev/null || warn "Some packages could not be configured"
    
    # Fix broken dependencies
    info "Fixing broken dependencies..."
    apt-get --fix-broken install -y 2>/dev/null || warn "Some dependencies could not be fixed automatically"
    
    # Force install essential packages if needed
    info "Installing essential tools..."
    apt-get install -y --reinstall ca-certificates curl wget gnupg lsb-release 2>/dev/null || warn "Some essential packages failed to install"
    
    # Clean package cache
    apt-get clean
    apt-get autoclean
    
    success "Package dependency fixing completed"
    return 0
}

# Update package repositories
update_package_repositories() {
    info "Package repository management..."
    
    # Ask user about system updates first
    echo ""
    echo -e "${CYAN}📦 System Update Options:${NC}"
    echo -e "${YELLOW}The installer can update your system packages before installing Profolio.${NC}"
    echo -e "${YELLOW}This downloads package lists and optionally upgrades existing packages.${NC}"
    echo ""
    echo -e "${WHITE}Options:${NC}"
    echo -e "   ${GREEN}1)${NC} Skip system updates (just install Profolio packages)"
    echo -e "   ${BLUE}2)${NC} Update package lists only (recommended)"
    echo -e "   ${YELLOW}3)${NC} Update package lists + upgrade existing packages"
    echo ""
    echo -e "${CYAN}Recommendation:${NC} Option 2 (update lists) is usually sufficient for Profolio installation."
    echo ""
    
    read -p "Select update option [2]: " update_choice
    update_choice=${update_choice:-2}
    
    case $update_choice in
        1)
            info "Skipping system updates as requested"
            echo -e "${YELLOW}⚠️  Note: If package installation fails, you may need to update package lists manually${NC}"
            return 0
            ;;
        2)
            info "Updating package lists only..."
            ;;
        3)
            info "Updating package lists and upgrading existing packages..."
            ;;
        *)
            warn "Invalid choice, defaulting to option 2 (update lists only)"
            update_choice=2
            ;;
    esac
    
    # Fix dependencies first if we're doing any updates
    if [ "$update_choice" != "1" ]; then
        fix_package_dependencies
        
        # Update package lists
        info "Updating package repository lists..."
        if apt-get update; then
            success "Package repository lists updated successfully"
        else
            error "Failed to update package repository lists"
            echo -e "${YELLOW}This may cause package installation to fail.${NC}"
            read -p "Continue anyway? (y/n) [y]: " continue_anyway
            if [[ ! "$continue_anyway" =~ ^[Yy]?$ ]]; then
                return 1
            fi
        fi
        
        # Upgrade existing packages if requested
        if [ "$update_choice" = "3" ]; then
            info "Upgrading existing system packages..."
            echo -e "${YELLOW}This may take several minutes and download significant data...${NC}"
            
            if apt-get upgrade -y; then
                success "System packages upgraded successfully"
            else
                warn "Some packages failed to upgrade, continuing anyway"
            fi
        fi
    fi
    
    return 0
}

# Install essential packages for Profolio
install_essential_packages() {
    info "Installing essential packages for Profolio..."
    
    # First, try to fix any broken packages
    echo -ne "${BLUE}Fixing package dependencies${NC} "
    {
        apt-get --fix-broken install -y &>/dev/null || true
        dpkg --configure -a &>/dev/null || true
    } &
    
    # Show spinner
    local spin='-\|/'
    local i=0
    local pid=$!
    while kill -0 $pid 2>/dev/null; do
        i=$(((i+1) % 4))
        printf "\r${BLUE}Fixing package dependencies${NC} ${YELLOW}${spin:$i:1}${NC}"
        sleep 0.1
    done
    printf "\r${BLUE}Fixing package dependencies${NC} ${GREEN}✓${NC}\n"
    
    local essential_packages=(
        "curl"
        "wget"
        "git"
        "build-essential"
        "software-properties-common"
        "apt-transport-https"
        "ca-certificates"
        "gnupg"
        "lsb-release"
        "unzip"
        "sudo"
        "ufw"
        "fail2ban"
        "htop"
        "nano"
        "vim"
        "openssl"
    )
    
    local postgresql_packages=(
        "postgresql"
        "postgresql-contrib"
        "postgresql-client"
    )
    
    # Note: We'll handle Node.js separately to avoid conflicts
    # NodeSource nodejs includes npm, so we don't install npm separately
    
    # Install essential packages with better error handling
    info "Installing essential system packages..."
    local failed_packages=()
    
    # Try to install all essential packages at once first
    if apt-get install -y "${essential_packages[@]}" 2>/dev/null; then
        success "Essential packages installed successfully"
    else
        warn "Batch installation failed, trying individual packages..."
        
        # Install packages individually to identify which ones fail
        for package in "${essential_packages[@]}"; do
            if apt-get install -y "$package" 2>/dev/null; then
                info "✓ Installed: $package"
            else
                warn "✗ Failed to install: $package"
                failed_packages+=("$package")
            fi
        done
        
        if [ ${#failed_packages[@]} -eq 0 ]; then
            success "All essential packages installed successfully"
        else
            warn "Some packages failed to install: ${failed_packages[*]}"
            warn "Continuing anyway - these may not be critical for Profolio"
        fi
    fi
    
    # Install PostgreSQL with error handling
    info "Installing PostgreSQL database..."
    if apt-get install -y "${postgresql_packages[@]}" 2>/dev/null; then
        success "PostgreSQL installed successfully"
    else
        warn "PostgreSQL batch installation failed, trying individual packages..."
        local pg_failed=()
        
        for package in "${postgresql_packages[@]}"; do
            if apt-get install -y "$package" 2>/dev/null; then
                info "✓ Installed: $package"
            else
                warn "✗ Failed to install: $package"
                pg_failed+=("$package")
            fi
        done
        
        if [ ${#pg_failed[@]} -eq ${#postgresql_packages[@]} ]; then
            error "Failed to install any PostgreSQL packages - this will prevent Profolio from working"
            return 1
        elif [ ${#pg_failed[@]} -gt 0 ]; then
            warn "Some PostgreSQL packages failed: ${pg_failed[*]}"
            warn "Continuing anyway - core PostgreSQL may still work"
        else
            success "PostgreSQL installed successfully"
        fi
    fi
    
    # Skip Node.js installation from Ubuntu repos to avoid conflicts
    # NodeSource repository will be used in the application installer
    info "Skipping Node.js installation from Ubuntu repositories"
    info "Node.js will be installed from NodeSource repository during application setup"
    
    # Clean up any package issues
    apt-get autoremove -y 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
    
    return 0
}

# Configure firewall for Profolio
configure_ubuntu_firewall() {
    info "Configuring UFW firewall for Profolio..."
    
    # Enable UFW
    if ! ufw --force enable; then
        warn "Failed to enable UFW firewall"
        return 1
    fi
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP/HTTPS for Profolio
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Profolio default port (3000) - can be changed later
    ufw allow 3000/tcp
    
    success "UFW firewall configured successfully"
    return 0
}

# Setup system user for Profolio
create_profolio_user() {
    local username="${1:-profolio}"
    
    info "Creating system user: $username"
    
    # Check if user already exists
    if id "$username" &>/dev/null; then
        info "User $username already exists"
        return 0
    fi
    
    # Create user with home directory
    if useradd -m -s /bin/bash "$username"; then
        success "User $username created successfully"
    else
        error "Failed to create user $username"
        return 1
    fi
    
    # Add user to sudo group
    if usermod -aG sudo "$username"; then
        info "User $username added to sudo group"
    else
        warn "Failed to add user $username to sudo group"
    fi
    
    return 0
}

# Configure systemd services for Profolio
setup_systemd_services() {
    info "Configuring systemd services..."
    
    # Enable and start PostgreSQL
    if systemctl enable postgresql && systemctl start postgresql; then
        success "PostgreSQL service configured"
    else
        error "Failed to configure PostgreSQL service"
        return 1
    fi
    
    # Create Profolio service file (placeholder - will be configured during installation)
    local service_file="/etc/systemd/system/profolio.service"
    if [ ! -f "$service_file" ]; then
        info "Creating Profolio service template..."
        cat > "$service_file" << 'EOF'
[Unit]
Description=Profolio Portfolio Management System
Documentation=https://github.com/Obednal97/profolio
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=profolio
WorkingDirectory=/home/profolio/profolio
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio

[Install]
WantedBy=multi-user.target
EOF
        
        # Reload systemd
        systemctl daemon-reload
        success "Profolio service template created"
    fi
    
    return 0
}

# Configure PostgreSQL for Profolio
configure_postgresql_ubuntu() {
    info "Configuring PostgreSQL for Profolio..."
    
    # Start PostgreSQL if not running
    if ! systemctl is-active --quiet postgresql; then
        systemctl start postgresql
    fi
    
    # Create Profolio database user and database
    local db_user="profolio"
    local db_name="profolio"
    local db_password
    
    # Generate random password
    db_password=$(openssl rand -base64 32)
    
    # Create database user and database
    sudo -u postgres psql << EOF
CREATE USER $db_user WITH ENCRYPTED PASSWORD '$db_password';
CREATE DATABASE $db_name OWNER $db_user;
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
\q
EOF
    
    if [ $? -eq 0 ]; then
        success "PostgreSQL configured for Profolio"
        
        # Save database credentials (will be used during Profolio installation)
        echo "Database configured:"
        echo "  User: $db_user"
        echo "  Database: $db_name"
        echo "  Password: $db_password"
        
        # Export for use in main installer
        export PROFOLIO_DB_USER="$db_user"
        export PROFOLIO_DB_NAME="$db_name"
        export PROFOLIO_DB_PASSWORD="$db_password"
    else
        error "Failed to configure PostgreSQL"
        return 1
    fi
    
    return 0
}

# Optimize system for Profolio
optimize_ubuntu_system() {
    info "Optimizing Ubuntu system for Profolio..."
    
    # Increase file descriptor limits
    echo "* soft nofile 65536" >> /etc/security/limits.conf
    echo "* hard nofile 65536" >> /etc/security/limits.conf
    
    # Optimize PostgreSQL configuration
    local pg_version
    pg_version=$(sudo -u postgres psql -t -c "SELECT version();" | awk '{print $2}' | cut -d. -f1)
    local pg_config="/etc/postgresql/$pg_version/main/postgresql.conf"
    
    if [ -f "$pg_config" ]; then
        info "Optimizing PostgreSQL configuration..."
        
        # Backup original config
        cp "$pg_config" "$pg_config.backup"
        
        # Apply basic optimizations
        sed -i "s/#shared_buffers = 128MB/shared_buffers = 256MB/" "$pg_config"
        sed -i "s/#effective_cache_size = 4GB/effective_cache_size = 1GB/" "$pg_config"
        sed -i "s/#random_page_cost = 4.0/random_page_cost = 1.1/" "$pg_config"
        
        # Restart PostgreSQL to apply changes
        systemctl restart postgresql
        success "PostgreSQL optimized"
    fi
    
    # Configure automatic security updates
    if apt-get install -y unattended-upgrades; then
        dpkg-reconfigure -plow unattended-upgrades
        success "Automatic security updates configured"
    fi
    
    return 0
}

# Main Ubuntu platform handler
handle_ubuntu_platform() {
    # Suppress verbose output for clean UI
    # info "Ubuntu/Debian platform detected"
    
    # Check if distribution is supported
    if ! is_supported_distribution; then
        warn "This distribution may not be fully supported"
        local distro_name
        distro_name=$(get_distribution_name)
        echo "Detected: $distro_name"
        echo "Supported: Ubuntu, Debian, Linux Mint, Elementary OS, Pop!_OS, Zorin OS"
        
        read -p "Continue anyway? (y/n) [n]: " continue_unsupported
        if [[ ! "$continue_unsupported" =~ ^[Yy]$ ]]; then
            error "Installation cancelled - unsupported distribution"
            return 1
        fi
    fi
    
    # Display system information
    local distro_name version_id
    distro_name=$(get_distribution_name)
    version_id=$(detect_ubuntu_version)
    
    # Suppress for clean UI
    # success "Supported distribution detected: $distro_name $version_id"
    
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        error "This script must be run as root (use sudo)"
        return 1
    fi
    
    # Update repositories and install packages
    if ! update_package_repositories; then
        error "Failed to update package repositories"
        return 1
    fi
    
    if ! install_essential_packages; then
        error "Failed to install essential packages"
        return 1
    fi
    
    # Configure firewall
    configure_ubuntu_firewall
    
    # Create Profolio user
    create_profolio_user "profolio"
    
    # Setup services
    setup_systemd_services
    
    # Configure PostgreSQL
    configure_postgresql_ubuntu
    
    # System optimizations
    optimize_ubuntu_system
    
    success "Ubuntu/Debian platform setup completed"
    
    # Now install the actual Profolio application
    info "Starting Profolio application installation..."
    
    # Check if function exists and try to source it if not
    if ! command -v install_profolio_application >/dev/null 2>&1; then
        warning "Profolio installer function not found, attempting to source..."
        
        # Try to source the installer module directly
        local installer_module
        for path in "/tmp/profolio-installer-$$/core/profolio-installer.sh" "core/profolio-installer.sh" "../core/profolio-installer.sh"; do
            if [[ -f "$path" ]]; then
                installer_module="$path"
                break
            fi
        done
        
        if [[ -n "$installer_module" ]] && source "$installer_module"; then
            success "Profolio installer module loaded"
        else
            error "Failed to load Profolio installer module"
            return 1
        fi
    fi
    
    if ! install_profolio_application; then
        error "Failed to install Profolio application"
        return 1
    fi
    
    success "Ubuntu/Debian platform installation completed successfully"
    return 0
}

# Check system requirements
check_ubuntu_requirements() {
    info "Checking Ubuntu system requirements..."
    
    local requirements_met=true
    
    # Check OS version
    local version_id
    version_id=$(detect_ubuntu_version)
    case "$version_id" in
        20.04|22.04|24.04|11|12)
            success "OS version supported: $version_id"
            ;;
        *)
            warn "OS version may not be fully supported: $version_id"
            requirements_met=false
            ;;
    esac
    
    # Check available memory
    local memory_gb
    memory_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$memory_gb" -ge 2 ]; then
        success "Memory requirement met: ${memory_gb}GB"
    else
        warn "Low memory detected: ${memory_gb}GB (recommended: 2GB+)"
        requirements_met=false
    fi
    
    # Check available disk space
    local disk_gb
    disk_gb=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$disk_gb" -ge 10 ]; then
        success "Disk space requirement met: ${disk_gb}GB available"
    else
        warn "Low disk space: ${disk_gb}GB (recommended: 10GB+)"
        requirements_met=false
    fi
    
    if [ "$requirements_met" = true ]; then
        success "All system requirements met"
        return 0
    else
        warn "Some system requirements not met - continue with caution"
        return 1
    fi
}

# Get installation recommendations for Ubuntu
get_ubuntu_recommendations() {
    echo "Ubuntu/Debian Installation Recommendations:"
    echo "  • Use LTS (Long Term Support) versions when possible"
    echo "  • Ensure system is up to date before installation"
    echo "  • Configure firewall (UFW) for security"
    echo "  • Use dedicated user account for Profolio"
    echo "  • Enable automatic security updates"
    echo "  • Monitor system resources during operation"
}

# Backward compatibility functions
handle_ubuntu_installation() {
    handle_ubuntu_platform "$@"
}

setup_ubuntu_environment() {
    handle_ubuntu_platform "$@"
}

# Module metadata
UBUNTU_PLATFORM_VERSION="1.0.0"
UBUNTU_PLATFORM_DEPENDENCIES="utils/logging.sh utils/ui.sh utils/validation.sh" 