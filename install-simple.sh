#!/bin/bash

# =============================================================================
# PROFOLIO SIMPLE INSTALLER v1.12.0
# =============================================================================
# Single-script installer that just works - no complex module dependencies
# Includes everything needed for reliable installation
# =============================================================================

set -euo pipefail

# Configuration
readonly INSTALLER_VERSION="1.12.0"
readonly REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"

# Colors (defined once, used everywhere)
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# Logging functions (simple and reliable)
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Platform detection (inline, no external dependencies)
detect_platform() {
    if [[ -f "/etc/pve/version" ]]; then
        echo "proxmox"
    elif [[ -f "/.dockerenv" ]]; then
        echo "docker"
    elif [[ -f "/proc/1/environ" ]] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        echo "lxc-container"
    elif [[ -d "/proc/vz" ]] && [[ ! -d "/proc/bc" ]]; then
        echo "lxc-container"
    else
        # Default to Ubuntu for any Linux system
        echo "ubuntu"
    fi
}

# Check if distribution is supported
is_supported_distribution() {
    if [[ -f "/etc/os-release" ]]; then
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

# Get distribution info
get_distribution_info() {
    if [[ -f "/etc/os-release" ]]; then
        . /etc/os-release
        echo "$NAME $VERSION_ID"
    else
        echo "Unknown Linux"
    fi
}

# Update package repositories with user choice
update_package_repositories() {
    info "Package repository management..."
    
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
    
    # Fix any broken packages first
    if [[ "$update_choice" != "1" ]]; then
        info "Fixing any broken package dependencies first..."
        dpkg --configure -a 2>/dev/null || warn "Some packages could not be configured"
        apt-get --fix-broken install -y 2>/dev/null || warn "Some dependencies could not be fixed automatically"
        
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
        if [[ "$update_choice" = "3" ]]; then
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

# Install essential packages with robust error handling
install_essential_packages() {
    info "Installing essential packages for Profolio..."
    
    local essential_packages=(
        "curl" "wget" "git" "build-essential" "software-properties-common"
        "apt-transport-https" "ca-certificates" "gnupg" "lsb-release" 
        "unzip" "sudo" "ufw" "htop" "nano" "vim" "openssl"
    )
    
    local postgresql_packages=(
        "postgresql" "postgresql-contrib" "postgresql-client"
    )
    
    # Install essential packages with fallback
    info "Installing essential system packages..."
    local failed_packages=()
    
    if apt-get install -y "${essential_packages[@]}" 2>/dev/null; then
        success "Essential packages installed successfully"
    else
        warn "Batch installation failed, trying individual packages..."
        for package in "${essential_packages[@]}"; do
            if apt-get install -y "$package" 2>/dev/null; then
                info "✓ Installed: $package"
            else
                warn "✗ Failed to install: $package"
                failed_packages+=("$package")
            fi
        done
        
        if [[ ${#failed_packages[@]} -gt 0 ]]; then
            warn "Some packages failed: ${failed_packages[*]} (continuing anyway)"
        fi
    fi
    
    # Install PostgreSQL
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
        
        if [[ ${#pg_failed[@]} -eq ${#postgresql_packages[@]} ]]; then
            error "Failed to install any PostgreSQL packages - this will prevent Profolio from working"
            return 1
        fi
    fi
    
    # Install Node.js from NodeSource (more reliable)
    info "Installing Node.js from NodeSource repository..."
    if install_nodejs; then
        success "Node.js installed successfully"
    else
        warn "Node.js installation failed, will retry during application installation"
    fi
    
    # Clean up
    apt-get autoremove -y 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
    
    return 0
}

# Install Node.js from NodeSource
install_nodejs() {
    # Remove any existing Node.js installations
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 2>/dev/null || return 1
    
    # Install Node.js
    apt-get install -y nodejs 2>/dev/null || return 1
    
    return 0
}

# Configure PostgreSQL for Profolio
configure_postgresql() {
    info "Configuring PostgreSQL for Profolio..."
    
    # Start PostgreSQL if not running
    systemctl enable postgresql 2>/dev/null || true
    systemctl start postgresql 2>/dev/null || true
    
    # Create database and user
    local db_user="profolio"
    local db_name="profolio"
    local db_password
    db_password=$(openssl rand -base64 32)
    
    # Create database user and database
    if sudo -u postgres psql << EOF
CREATE USER $db_user WITH ENCRYPTED PASSWORD '$db_password';
CREATE DATABASE $db_name OWNER $db_user;
GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;
\q
EOF
    then
        success "PostgreSQL configured for Profolio"
        
        # Export for use in application installation
        export PROFOLIO_DB_USER="$db_user"
        export PROFOLIO_DB_NAME="$db_name"
        export PROFOLIO_DB_PASSWORD="$db_password"
        
        echo "Database credentials:"
        echo "  User: $db_user"
        echo "  Database: $db_name"
        echo "  Password: $db_password"
    else
        error "Failed to configure PostgreSQL"
        return 1
    fi
    
    return 0
}

# Install the actual Profolio application
install_profolio_application() {
    info "Installing Profolio application..."
    
    # Create profolio user
    if ! id "profolio" &>/dev/null; then
        useradd -m -s /bin/bash profolio || warn "Failed to create profolio user"
        usermod -aG sudo profolio 2>/dev/null || true
    fi
    
    # Clone repository
    local install_dir="/home/profolio/profolio"
    if [[ -d "$install_dir" ]]; then
        warn "Profolio directory already exists, updating..."
        cd "$install_dir"
        sudo -u profolio git pull origin main || warn "Failed to update repository"
    else
        info "Cloning Profolio repository..."
        sudo -u profolio git clone https://github.com/Obednal97/profolio.git "$install_dir" || {
            error "Failed to clone repository"
            return 1
        }
        cd "$install_dir"
    fi
    
    # Install dependencies
    info "Installing application dependencies..."
    
    # Frontend dependencies
    if [[ -d "frontend" ]]; then
        cd frontend
        sudo -u profolio npm install || {
            error "Failed to install frontend dependencies"
            return 1
        }
        cd ..
    fi
    
    # Backend dependencies
    if [[ -d "backend" ]]; then
        cd backend
        sudo -u profolio npm install || {
            error "Failed to install backend dependencies"
            return 1
        }
        cd ..
    fi
    
    # Create environment files
    create_environment_files "$install_dir"
    
    # Build application
    info "Building Profolio application..."
    cd frontend
    sudo -u profolio npm run build || warn "Frontend build failed"
    cd ../backend
    sudo -u profolio npm run build || warn "Backend build failed"
    cd ..
    
    # Create systemd services
    create_systemd_services "$install_dir"
    
    success "Profolio application installed successfully"
    return 0
}

# Create environment configuration files
create_environment_files() {
    local install_dir="$1"
    
    info "Creating environment configuration files..."
    
    # Frontend environment
    cat > "$install_dir/frontend/.env.local" << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF
    
    # Backend environment
    cat > "$install_dir/backend/.env" << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://${PROFOLIO_DB_USER:-profolio}:${PROFOLIO_DB_PASSWORD:-profolio}@localhost:5432/${PROFOLIO_DB_NAME:-profolio}
JWT_SECRET=$(openssl rand -base64 32)
EOF
    
    # Set ownership
    chown -R profolio:profolio "$install_dir"
    
    success "Environment files created"
}

# Create systemd services
create_systemd_services() {
    local install_dir="$1"
    
    info "Creating systemd services..."
    
    # Backend service
    cat > /etc/systemd/system/profolio-backend.service << EOF
[Unit]
Description=Profolio Backend API
Documentation=https://github.com/Obednal97/profolio
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=profolio
WorkingDirectory=$install_dir/backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio-backend

[Install]
WantedBy=multi-user.target
EOF
    
    # Frontend service
    cat > /etc/systemd/system/profolio-frontend.service << EOF
[Unit]
Description=Profolio Frontend
Documentation=https://github.com/Obednal97/profolio
After=network.target profolio-backend.service
Wants=profolio-backend.service

[Service]
Type=simple
User=profolio
WorkingDirectory=$install_dir/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio-frontend

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable services
    systemctl daemon-reload
    systemctl enable profolio-backend profolio-frontend
    
    success "Systemd services created"
}

# Configure firewall
configure_firewall() {
    info "Configuring firewall..."
    
    # Enable UFW
    ufw --force enable 2>/dev/null || {
        warn "Failed to enable UFW firewall"
        return 0
    }
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow Profolio ports
    ufw allow 3000/tcp  # Frontend
    ufw allow 3001/tcp  # Backend
    
    success "Firewall configured"
}

# Start services
start_services() {
    info "Starting Profolio services..."
    
    # Start backend first
    if systemctl start profolio-backend; then
        success "Backend service started"
    else
        warn "Failed to start backend service"
    fi
    
    # Wait a moment for backend to initialize
    sleep 3
    
    # Start frontend
    if systemctl start profolio-frontend; then
        success "Frontend service started"
    else
        warn "Failed to start frontend service"
    fi
    
    # Check status
    sleep 2
    systemctl status profolio-backend profolio-frontend --no-pager || true
}

# Main installation function
main() {
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               🚀 PROFOLIO SIMPLE INSTALLER v$INSTALLER_VERSION               ║"
    echo "║              Self-Hosted Portfolio Management                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        echo ""
        echo "Please run with sudo:"
        echo "  sudo bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-simple.sh)\""
        exit 1
    fi
    
    # Detect platform
    local platform
    platform=$(detect_platform)
    log "Platform detected: $platform"
    
    # Show distribution info
    local distro_info
    distro_info=$(get_distribution_info)
    success "Distribution: $distro_info"
    
    # Check distribution support
    if ! is_supported_distribution; then
        warn "This distribution may not be fully supported"
        read -p "Continue anyway? (y/n) [n]: " continue_unsupported
        if [[ ! "$continue_unsupported" =~ ^[Yy]$ ]]; then
            error "Installation cancelled"
            exit 1
        fi
    fi
    
    # Install minimal dependencies if needed
    if ! command -v curl >/dev/null 2>&1; then
        info "Installing curl..."
        apt-get update && apt-get install -y curl
    fi
    
    # Execute installation steps
    log "Starting Profolio installation..."
    
    if ! update_package_repositories; then
        error "Failed to update package repositories"
        exit 1
    fi
    
    if ! install_essential_packages; then
        error "Failed to install essential packages"
        exit 1
    fi
    
    if ! configure_postgresql; then
        error "Failed to configure PostgreSQL"
        exit 1
    fi
    
    if ! install_profolio_application; then
        error "Failed to install Profolio application"
        exit 1
    fi
    
    # Optional steps (don't fail installation if they fail)
    configure_firewall || warn "Firewall configuration failed (continuing)"
    start_services || warn "Service startup failed (can be started manually)"
    
    # Show completion message
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 INSTALLATION COMPLETE!                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Your Profolio instance is ready!"
    echo ""
    echo "📍 Access URLs:"
    local host_ip
    host_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "your-server-ip")
    echo "   • Frontend: http://${host_ip}:3000"
    echo "   • Backend:  http://${host_ip}:3001"
    echo ""
    echo "🔧 Service Management:"
    echo "   • Status:  systemctl status profolio-backend profolio-frontend"
    echo "   • Logs:    journalctl -u profolio-backend -u profolio-frontend -f"
    echo "   • Restart: systemctl restart profolio-backend profolio-frontend"
    echo ""
    echo "📚 Documentation:"
    echo "   • GitHub: https://github.com/Obednal97/profolio"
    echo ""
    
    success "🎉 Profolio installation completed successfully!"
}

# Parse arguments
case "${1:-}" in
    --version)
        echo "Profolio Simple Installer v$INSTALLER_VERSION"
        exit 0
        ;;
    --help)
        echo "Profolio Simple Installer v$INSTALLER_VERSION"
        echo ""
        echo "Usage: $0"
        echo ""
        echo "A simplified, single-script installer that just works."
        echo "No complex module dependencies or variable scoping issues."
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac 