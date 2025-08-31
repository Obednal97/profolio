#!/usr/bin/env bash

# Profolio Installer v2.0 - Proxmox Community Script Style
# Based on the architecture of Proxmox VE community scripts
# https://github.com/Obednal97/profolio

# Exit on error
set -euo pipefail

# Variables
PROFOLIO_VERSION="${PROFOLIO_VERSION:-latest}"
INSTALL_PATH="/opt/profolio"
TEMP_DIR="/tmp/profolio-$$"
GITHUB_REPO="Obednal97/profolio"
VERBOSE="${VERBOSE:-no}"
CT_TYPE="1"  # 1=Unprivileged, 0=Privileged

# Default resource allocation
CORE_COUNT="${CORE_COUNT:-2}"
RAM_SIZE="${RAM_SIZE:-4096}"
DISK_SIZE="${DISK_SIZE:-20}"
HN="${HN:-profolio}"

# Color codes
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[31m")
GN=$(echo "\033[32m")
CL=$(echo "\033[0m")
BFR="\\r\\033[K"
SPINNER="/-\\|"

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
    echo -e "${YW}Installer v2.0 - Proxmox Style${CL}\n"
}

# Message functions
function msg_info() {
    local msg="$1"
    printf " %s" "$msg..."
}

function msg_ok() {
    local msg="$1"
    echo -e "${BFR} ${GN}✓${CL} ${msg}"
}

function msg_error() {
    local msg="$1"
    echo -e "${BFR} ${RD}✗${CL} ${msg}"
}

# Run command with spinner animation
function run_with_spinner() {
    local msg="$1"
    shift
    
    # Print message
    printf " %s... " "$msg"
    
    # Run command in background
    if [ "$VERBOSE" == "yes" ]; then
        "$@" &
    else
        "$@" &>/dev/null &
    fi
    local pid=$!
    
    # Show spinner
    local spin='/-\|'
    local i=0
    while kill -0 $pid 2>/dev/null; do
        printf "\b${spin:i++%4:1}"
        sleep 0.1
    done
    
    # Check result
    wait $pid
    local result=$?
    
    # Clear spinner and show result
    printf "\b"
    
    if [ $result -eq 0 ]; then
        echo -e "${BFR} ${GN}✓${CL} ${msg}"
        return 0
    else
        echo -e "${BFR} ${RD}✗${CL} ${msg} (failed)"
        return $result
    fi
}

# Error handler
function catch_errors() {
    set -Eeuo pipefail
    trap 'error_handler $LINENO "$BASH_COMMAND" $?' ERR
}

function error_handler() {
    local exit_code=$3
    msg_error "An error occurred on line $1: $2 (exit code: $exit_code)"
    cleanup_on_error
    exit "$exit_code"
}

# Cleanup function
function cleanup_on_error() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    if systemctl is-active --quiet profolio-frontend 2>/dev/null; then
        systemctl stop profolio-frontend profolio-backend 2>/dev/null || true
    fi
}

# Check if running as root
function check_root() {
    if [[ $EUID -ne 0 ]]; then
        msg_error "This script must be run as root"
        echo -e "${YW}Please run: ${GN}sudo bash $0${CL}"
        exit 1
    fi
}

# Detect system
function detect_system() {
    msg_info "Detecting system"
    
    # Check if we're in a container
    local container_type="none"
    if [ -f /.dockerenv ]; then
        container_type="docker"
    elif [ -f /run/systemd/container ]; then
        container_type="systemd-nspawn"
    elif grep -qa container=lxc /proc/1/environ 2>/dev/null; then
        container_type="lxc"
    elif [ -f /etc/pve/.version ]; then
        container_type="proxmox-host"
    fi
    
    # Get OS information
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VER=$VERSION_ID
    else
        msg_error "Cannot detect OS"
        exit 1
    fi
    
    msg_ok "Detected: $OS $VER (Container: $container_type)"
}

# Update system
function update_os() {
    run_with_spinner "Updating package lists" apt-get update
    run_with_spinner "Upgrading system packages" apt-get upgrade -y
}

# Install dependencies
function install_dependencies() {
    # Install Node.js repository if needed
    if ! command -v node &>/dev/null; then
        msg_info "Setting up Node.js repository"
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - &>/dev/null
        msg_ok "Node.js repository configured"
    fi
    
    # Core dependencies
    run_with_spinner "Installing core tools" apt-get install -y curl wget git build-essential
    
    # Node.js and npm
    run_with_spinner "Installing Node.js" apt-get install -y nodejs
    
    # Database
    run_with_spinner "Installing PostgreSQL" apt-get install -y postgresql postgresql-contrib
    
    # Web server
    run_with_spinner "Installing Nginx" apt-get install -y nginx
    
    # SSL tools (optional, may fail)
    run_with_spinner "Installing SSL tools" apt-get install -y certbot python3-certbot-nginx || true
    
    # Install pnpm
    if ! command -v pnpm &>/dev/null; then
        run_with_spinner "Installing pnpm" npm install -g pnpm@latest
    fi
}

# Setup user
function setup_user() {
    if ! id -u profolio &>/dev/null; then
        run_with_spinner "Creating profolio user" useradd -r -s /bin/bash -d /home/profolio -m profolio
    else
        msg_ok "User already exists"
    fi
}

# Clone repository
function clone_repository() {
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    if [ "$PROFOLIO_VERSION" == "latest" ]; then
        run_with_spinner "Downloading Profolio (latest)" git clone --depth 1 "https://github.com/$GITHUB_REPO.git" .
    else
        run_with_spinner "Downloading Profolio ($PROFOLIO_VERSION)" git clone --depth 1 --branch "$PROFOLIO_VERSION" "https://github.com/$GITHUB_REPO.git" .
    fi
}

# Setup database
function setup_database() {
    # Generate password
    local db_password=$(openssl rand -base64 12)
    
    # Create database and user
    run_with_spinner "Creating database" sudo -u postgres psql <<EOF
CREATE USER profolio WITH PASSWORD '$db_password';
CREATE DATABASE profolio OWNER profolio;
GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
EOF
    
    # Save credentials
    echo "DATABASE_URL=postgresql://profolio:$db_password@localhost:5432/profolio" > "$TEMP_DIR/.env"
    msg_ok "Database credentials saved"
}

# Build application
function build_application() {
    echo -e "\n${YW}Building Profolio (this may take several minutes)${CL}"
    
    cd "$TEMP_DIR"
    
    # Install dependencies
    run_with_spinner "Installing project dependencies" pnpm install
    
    # Build frontend
    cd frontend
    run_with_spinner "Building frontend" pnpm build
    
    # Build backend
    cd ../backend
    run_with_spinner "Building backend" pnpm build
    run_with_spinner "Generating Prisma client" pnpm prisma generate
    run_with_spinner "Running database migrations" pnpm prisma migrate deploy
}

# Install application
function install_application() {
    # Create installation directory
    rm -rf "$INSTALL_PATH"
    mkdir -p "$INSTALL_PATH"
    
    # Copy files
    run_with_spinner "Installing to $INSTALL_PATH" cp -r "$TEMP_DIR"/* "$INSTALL_PATH/"
    
    # Set permissions
    run_with_spinner "Setting permissions" chown -R profolio:profolio "$INSTALL_PATH"
}

# Setup systemd services
function setup_services() {
    msg_info "Creating systemd services"
    
    # Frontend service
    cat > /etc/systemd/system/profolio-frontend.service <<EOF
[Unit]
Description=Profolio Frontend
After=network.target

[Service]
Type=simple
User=profolio
WorkingDirectory=$INSTALL_PATH/frontend
ExecStart=/usr/bin/pnpm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    # Backend service
    cat > /etc/systemd/system/profolio-backend.service <<EOF
[Unit]
Description=Profolio Backend
After=network.target postgresql.service

[Service]
Type=simple
User=profolio
WorkingDirectory=$INSTALL_PATH/backend
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
EOF

    # Reload and start services
    run_with_spinner "Reloading systemd" systemctl daemon-reload
    run_with_spinner "Enabling services" systemctl enable profolio-frontend profolio-backend
    run_with_spinner "Starting services" systemctl start profolio-frontend profolio-backend
    
    msg_ok "Services configured and started"
}

# Setup nginx
function setup_nginx() {
    local server_ip=$(hostname -I | awk '{print $1}')
    
    msg_info "Creating Nginx configuration"
    cat > /etc/nginx/sites-available/profolio <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    run_with_spinner "Enabling site configuration" ln -sf /etc/nginx/sites-available/profolio /etc/nginx/sites-enabled/
    run_with_spinner "Removing default site" rm -f /etc/nginx/sites-enabled/default
    run_with_spinner "Testing Nginx configuration" nginx -t
    run_with_spinner "Reloading Nginx" systemctl reload nginx
    
    msg_ok "Web server configured"
}

# Cleanup
function cleanup() {
    run_with_spinner "Cleaning up temporary files" rm -rf "$TEMP_DIR"
    msg_ok "Cleanup complete"
}

# Display completion message
function completion_message() {
    local server_ip=$(hostname -I | awk '{print $1}')
    
    echo -e "\n${GN}✓ Profolio has been successfully installed!${CL}\n"
    echo -e "${BL}Access your instance:${CL}"
    echo -e "  ${YW}➜${CL} Frontend: ${GN}http://$server_ip${CL}"
    echo -e "  ${YW}➜${CL} Backend:  ${GN}http://$server_ip/api${CL}"
    echo -e "\n${BL}Service Management:${CL}"
    echo -e "  ${YW}➜${CL} Status:  ${GN}systemctl status profolio-frontend${CL}"
    echo -e "  ${YW}➜${CL} Restart: ${GN}systemctl restart profolio-frontend${CL}"
    echo -e "  ${YW}➜${CL} Logs:    ${GN}journalctl -u profolio-frontend -f${CL}"
    echo -e "\n${YW}Default credentials have been generated in $INSTALL_PATH/.env${CL}\n"
}

# Main installation flow
function main() {
    catch_errors
    header_info
    check_root
    
    echo -e "${BL}Starting Profolio Installation${CL}\n"
    
    detect_system
    update_os
    install_dependencies
    setup_user
    clone_repository
    setup_database
    build_application
    install_application
    setup_services
    setup_nginx
    cleanup
    
    completion_message
}

# Run main function
main "$@"