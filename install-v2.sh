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
    echo -ne " ${YW}⚡${CL} ${msg}..."
}

function msg_ok() {
    local msg="$1"
    echo -e "${BFR} ${GN}✓${CL} ${msg}"
}

function msg_error() {
    local msg="$1"
    echo -e "${BFR} ${RD}✗${CL} ${msg}"
}

# Spinner function
function spinner() {
    local pid=$1
    local i=0
    while kill -0 "$pid" 2>/dev/null; do
        printf "\b${SPINNER:i++%${#SPINNER}:1}"
        sleep 0.1
    done
    printf "\b"
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
    msg_info "Updating system packages"
    
    if [ "$VERBOSE" == "yes" ]; then
        apt-get update
        apt-get upgrade -y
    else
        apt-get update &>/dev/null
        apt-get upgrade -y &>/dev/null
    fi
    
    msg_ok "System updated"
}

# Install dependencies
function install_dependencies() {
    msg_info "Installing dependencies"
    
    local deps="curl wget git build-essential nodejs npm postgresql postgresql-contrib nginx certbot python3-certbot-nginx"
    
    if [ "$VERBOSE" == "yes" ]; then
        apt-get install -y $deps
    else
        apt-get install -y $deps &>/dev/null
    fi
    
    # Install pnpm
    if ! command -v pnpm &>/dev/null; then
        npm install -g pnpm@latest &>/dev/null
    fi
    
    msg_ok "Dependencies installed"
}

# Setup user
function setup_user() {
    msg_info "Setting up profolio user"
    
    if ! id -u profolio &>/dev/null; then
        useradd -r -s /bin/bash -d /home/profolio -m profolio
    fi
    
    msg_ok "User configured"
}

# Clone repository
function clone_repository() {
    msg_info "Downloading Profolio"
    
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    if [ "$PROFOLIO_VERSION" == "latest" ]; then
        git clone --depth 1 "https://github.com/$GITHUB_REPO.git" . &>/dev/null
    else
        git clone --depth 1 --branch "$PROFOLIO_VERSION" "https://github.com/$GITHUB_REPO.git" . &>/dev/null
    fi
    
    msg_ok "Downloaded Profolio $PROFOLIO_VERSION"
}

# Setup database
function setup_database() {
    msg_info "Configuring database"
    
    # Generate password
    local db_password=$(openssl rand -base64 12)
    
    # Create database and user
    sudo -u postgres psql <<EOF &>/dev/null
CREATE USER profolio WITH PASSWORD '$db_password';
CREATE DATABASE profolio OWNER profolio;
GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
EOF
    
    # Save credentials
    echo "DATABASE_URL=postgresql://profolio:$db_password@localhost:5432/profolio" > "$TEMP_DIR/.env"
    
    msg_ok "Database configured"
}

# Build application
function build_application() {
    msg_info "Building Profolio (this may take several minutes)"
    
    cd "$TEMP_DIR"
    
    # Install dependencies
    if [ "$VERBOSE" == "yes" ]; then
        pnpm install
    else
        pnpm install &>/dev/null
    fi
    
    # Build frontend
    cd frontend
    if [ "$VERBOSE" == "yes" ]; then
        pnpm build
    else
        pnpm build &>/dev/null
    fi
    
    # Build backend
    cd ../backend
    if [ "$VERBOSE" == "yes" ]; then
        pnpm build
        pnpm prisma generate
        pnpm prisma migrate deploy
    else
        pnpm build &>/dev/null
        pnpm prisma generate &>/dev/null
        pnpm prisma migrate deploy &>/dev/null
    fi
    
    msg_ok "Build complete"
}

# Install application
function install_application() {
    msg_info "Installing to $INSTALL_PATH"
    
    # Create installation directory
    rm -rf "$INSTALL_PATH"
    mkdir -p "$INSTALL_PATH"
    
    # Copy files
    cp -r "$TEMP_DIR"/* "$INSTALL_PATH/"
    
    # Set permissions
    chown -R profolio:profolio "$INSTALL_PATH"
    
    msg_ok "Installation complete"
}

# Setup systemd services
function setup_services() {
    msg_info "Configuring services"
    
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
    systemctl daemon-reload
    systemctl enable profolio-frontend profolio-backend &>/dev/null
    systemctl start profolio-frontend profolio-backend
    
    msg_ok "Services configured and started"
}

# Setup nginx
function setup_nginx() {
    msg_info "Configuring web server"
    
    local server_ip=$(hostname -I | awk '{print $1}')
    
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

    ln -sf /etc/nginx/sites-available/profolio /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t &>/dev/null
    systemctl reload nginx
    
    msg_ok "Web server configured"
}

# Cleanup
function cleanup() {
    msg_info "Cleaning up"
    rm -rf "$TEMP_DIR"
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