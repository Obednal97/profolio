#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - UBUNTU/DEBIAN PLATFORM MODULE v1.0.0
# =============================================================================
# 
# Ubuntu/Debian platform-specific functionality for generic Linux installations
# Provides: Package management, service configuration, system optimization
#
# Compatible: Ubuntu 20.04+, Debian 11+, and derivatives
# Dependencies: utils/logging.sh, utils/ui.sh, utils/validation.sh
# =============================================================================

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

# Update package repositories
update_package_repositories() {
    info "Updating package repositories..."
    
    # Update package lists
    if apt-get update; then
        success "Package repositories updated successfully"
    else
        error "Failed to update package repositories"
        return 1
    fi
    
    # Optional: upgrade existing packages
    read -p "Upgrade existing packages? (recommended) (y/n) [y]: " upgrade_confirm
    if [[ "$upgrade_confirm" =~ ^[Yy]?$ ]]; then
        info "Upgrading existing packages..."
        if apt-get upgrade -y; then
            success "System packages upgraded successfully"
        else
            warn "Some packages failed to upgrade, continuing anyway"
        fi
    fi
    
    return 0
}

# Install essential packages for Profolio
install_essential_packages() {
    info "Installing essential packages for Profolio..."
    
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
    
    local nodejs_packages=(
        "nodejs"
        "npm"
    )
    
    # Install essential packages
    info "Installing essential system packages..."
    if apt-get install -y "${essential_packages[@]}"; then
        success "Essential packages installed successfully"
    else
        error "Failed to install essential packages"
        return 1
    fi
    
    # Install PostgreSQL
    info "Installing PostgreSQL database..."
    if apt-get install -y "${postgresql_packages[@]}"; then
        success "PostgreSQL installed successfully"
    else
        error "Failed to install PostgreSQL"
        return 1
    fi
    
    # Install Node.js (we'll upgrade to latest LTS later)
    info "Installing Node.js..."
    if apt-get install -y "${nodejs_packages[@]}"; then
        success "Node.js installed successfully"
    else
        error "Failed to install Node.js"
        return 1
    fi
    
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
    info "Ubuntu/Debian platform detected"
    
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
    
    success "Supported distribution detected: $distro_name $version_id"
    
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