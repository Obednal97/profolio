#!/bin/bash

# 🚀 Profolio Smart Install/Update Script
# Professional Proxmox-style wizard with configuration options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Default configuration values
DEFAULT_CONTAINER_NAME="Profolio"
DEFAULT_CPU_CORES="2"
DEFAULT_MEMORY="4096"
DEFAULT_STORAGE="20"
DEFAULT_NETWORK_MODE="dhcp"
DEFAULT_DB_PASSWORD=""

# Configuration variables
CONTAINER_NAME=""
CPU_CORES=""
MEMORY_MB=""
STORAGE_GB=""
NETWORK_MODE=""
STATIC_IP=""
GATEWAY=""
SUBNET_MASK=""
DNS_SERVERS=""
DNS_DOMAIN=""
IPV6_ENABLED=""
SSH_ENABLED=""
SSH_PORT=""
SSH_ROOT_LOGIN=""
SSH_PASSWORD_AUTH=""
SSH_KEY_ONLY=""
DB_PASSWORD=""
AUTO_INSTALL=false
GENERATE_SSH_KEY=""

# Banner with styling
show_banner() {
    clear
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🚀 PROFOLIO INSTALLER                    ║"
    echo "║              Professional Portfolio Management               ║"
    echo "║                  Proxmox Community Edition                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}Self-Hosted • Privacy-Focused • One-Command Setup${NC}"
    echo ""
}

# Progress indicator
show_progress() {
    local step=$1
    local total=$2
    local message=$3
    echo -e "${BLUE}[${step}/${total}]${NC} ${message}"
}

# Input validation functions
validate_ip() {
    local ip=$1
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        return 0
    fi
    return 1
}

validate_number() {
    local num=$1
    local min=$2
    local max=$3
    if [[ $num =~ ^[0-9]+$ ]] && [ "$num" -ge "$min" ] && [ "$num" -le "$max" ]; then
        return 0
    fi
    return 1
}

# Configuration wizard
run_configuration_wizard() {
    echo -e "${WHITE}🔧 PROFOLIO CONFIGURATION WIZARD${NC}"
    echo -e "${YELLOW}Configure your Profolio installation${NC}"
    echo ""
    
    # Auto-install option
    echo -e "${CYAN}Installation Mode:${NC}"
    echo "  1) ${GREEN}Quick Install${NC} (recommended defaults)"
    echo "  2) ${BLUE}Advanced Setup${NC} (custom configuration)"
    echo ""
    read -p "Select installation mode [1]: " install_mode
    install_mode=${install_mode:-1}
    
    if [ "$install_mode" = "1" ]; then
        AUTO_INSTALL=true
        use_defaults
        return
    fi
    
    # Container Configuration
    echo -e "\n${WHITE}📦 CONTAINER CONFIGURATION${NC}"
    echo "Configure your Profolio LXC container resources"
    echo ""
    
    # Container Name
    read -p "Container name [$DEFAULT_CONTAINER_NAME]: " CONTAINER_NAME
    CONTAINER_NAME=${CONTAINER_NAME:-$DEFAULT_CONTAINER_NAME}
    
    # CPU Cores
    while true; do
        read -p "CPU cores (1-16) [$DEFAULT_CPU_CORES]: " CPU_CORES
        CPU_CORES=${CPU_CORES:-$DEFAULT_CPU_CORES}
        if validate_number "$CPU_CORES" 1 16; then
            break
        fi
        echo -e "${RED}❌ Please enter a number between 1 and 16${NC}"
    done
    
    # Memory
    while true; do
        read -p "Memory in MB (1024-32768) [$DEFAULT_MEMORY]: " MEMORY_MB
        MEMORY_MB=${MEMORY_MB:-$DEFAULT_MEMORY}
        if validate_number "$MEMORY_MB" 1024 32768; then
            break
        fi
        echo -e "${RED}❌ Please enter a number between 1024 and 32768${NC}"
    done
    
    # Storage
    while true; do
        read -p "Storage in GB (10-500) [$DEFAULT_STORAGE]: " STORAGE_GB
        STORAGE_GB=${STORAGE_GB:-$DEFAULT_STORAGE}
        if validate_number "$STORAGE_GB" 10 500; then
            break
        fi
        echo -e "${RED}❌ Please enter a number between 10 and 500${NC}"
    done
    
    # Network Configuration
    echo -e "\n${WHITE}🌐 NETWORK CONFIGURATION${NC}"
    echo "Configure network settings for your container"
    echo ""
    
    echo "Network configuration:"
    echo "  1) ${GREEN}DHCP${NC} (automatic IP assignment)"
    echo "  2) ${BLUE}Static IP${NC} (manual configuration)"
    echo ""
    read -p "Select network mode [1]: " net_choice
    net_choice=${net_choice:-1}
    
    if [ "$net_choice" = "2" ]; then
        NETWORK_MODE="static"
        configure_static_network
    else
        NETWORK_MODE="dhcp"
    fi
    
    # IPv6 Configuration
    echo ""
    read -p "Enable IPv6? (y/n) [n]: " ipv6_choice
    if [[ "$ipv6_choice" =~ ^[Yy] ]]; then
        IPV6_ENABLED="yes"
    else
        IPV6_ENABLED="no"
    fi
    
    # DNS Configuration
    echo -e "\n${WHITE}🔍 DNS CONFIGURATION${NC}"
    read -p "DNS servers (comma-separated) [8.8.8.8,1.1.1.1]: " DNS_SERVERS
    DNS_SERVERS=${DNS_SERVERS:-"8.8.8.8,1.1.1.1"}
    
    read -p "DNS search domain [local]: " DNS_DOMAIN
    DNS_DOMAIN=${DNS_DOMAIN:-"local"}
    
    # SSH Configuration
    configure_ssh_access
    
    # Database Configuration
    echo -e "\n${WHITE}🗄️  DATABASE CONFIGURATION${NC}"
    while true; do
        read -s -p "Set database password (min 8 characters): " DB_PASSWORD
        echo ""
        if [ ${#DB_PASSWORD} -ge 8 ]; then
            read -s -p "Confirm password: " DB_PASSWORD_CONFIRM
            echo ""
            if [ "$DB_PASSWORD" = "$DB_PASSWORD_CONFIRM" ]; then
                break
            else
                echo -e "${RED}❌ Passwords don't match. Please try again.${NC}"
            fi
        else
            echo -e "${RED}❌ Password must be at least 8 characters long.${NC}"
        fi
    done
    
    # Configuration Summary
    show_configuration_summary
}

# Static network configuration
configure_static_network() {
    echo -e "\n${BLUE}Static IP Configuration:${NC}"
    
    while true; do
        read -p "Static IP address (e.g., 192.168.1.100): " STATIC_IP
        if validate_ip "$STATIC_IP"; then
            break
        fi
        echo -e "${RED}❌ Please enter a valid IP address${NC}"
    done
    
    while true; do
        read -p "Gateway IP (e.g., 192.168.1.1): " GATEWAY
        if validate_ip "$GATEWAY"; then
            break
        fi
        echo -e "${RED}❌ Please enter a valid gateway IP${NC}"
    done
    
    read -p "Subnet mask [255.255.255.0]: " SUBNET_MASK
    SUBNET_MASK=${SUBNET_MASK:-"255.255.255.0"}
}

# SSH Access Configuration
configure_ssh_access() {
    echo -e "\n${WHITE}🔐 SSH ACCESS CONFIGURATION${NC}"
    echo "Configure SSH access for remote administration"
    echo ""
    
    # Enable SSH
    echo "Enable SSH for remote access?"
    echo "  ${GREEN}Recommended:${NC} Yes - for remote management and troubleshooting"
    echo "  ${YELLOW}Note:${NC} SSH is essential for Proxmox LXC container management"
    echo ""
    read -p "Enable SSH access? (y/n) [y]: " ssh_choice
    if [[ "$ssh_choice" =~ ^[Nn] ]]; then
        SSH_ENABLED="no"
        echo -e "${YELLOW}⚠️  SSH disabled - you'll only have console access${NC}"
        return
    else
        SSH_ENABLED="yes"
    fi
    
    # SSH Port Configuration
    echo ""
    while true; do
        read -p "SSH port (1024-65535) [22]: " SSH_PORT
        SSH_PORT=${SSH_PORT:-22}
        if validate_number "$SSH_PORT" 1 65535; then
            if [ "$SSH_PORT" -ne 22 ]; then
                echo -e "${GREEN}✅ Using custom port $SSH_PORT for security${NC}"
            fi
            break
        fi
        echo -e "${RED}❌ Please enter a valid port number between 1 and 65535${NC}"
    done
    
    # Root Login Configuration
    echo ""
    echo "Allow direct root login via SSH?"
    echo "  ${RED}Security Risk:${NC} Direct root login increases attack surface"
    echo "  ${GREEN}Recommended:${NC} No - use sudo with regular user"
    echo ""
    read -p "Allow root login? (y/n) [n]: " root_choice
    if [[ "$root_choice" =~ ^[Yy] ]]; then
        SSH_ROOT_LOGIN="yes"
        echo -e "${YELLOW}⚠️  Root login enabled - ensure strong password${NC}"
    else
        SSH_ROOT_LOGIN="no"
        echo -e "${GREEN}✅ Root login disabled for security${NC}"
    fi
    
    # Authentication Method
    echo ""
    echo "SSH Authentication method:"
    echo "  1) ${YELLOW}Password + Key${NC} (both allowed - less secure)"
    echo "  2) ${GREEN}Key Only${NC} (recommended - most secure)"
    echo "  3) ${BLUE}Password Only${NC} (not recommended)"
    echo ""
    read -p "Select authentication method [2]: " auth_choice
    auth_choice=${auth_choice:-2}
    
    case $auth_choice in
        1)
            SSH_PASSWORD_AUTH="yes"
            SSH_KEY_ONLY="no"
            echo -e "${YELLOW}⚠️  Both password and key authentication enabled${NC}"
            ;;
        2)
            SSH_PASSWORD_AUTH="no"
            SSH_KEY_ONLY="yes"
            echo -e "${GREEN}✅ Key-only authentication - most secure${NC}"
            configure_ssh_keys
            ;;
        3)
            SSH_PASSWORD_AUTH="yes"
            SSH_KEY_ONLY="no"
            echo -e "${RED}⚠️  Password-only authentication - not recommended${NC}"
            ;;
    esac
}

# SSH Key Configuration
configure_ssh_keys() {
    echo ""
    echo "SSH Key Configuration:"
    echo "  ${GREEN}Recommended:${NC} Generate new SSH key pair for this server"
    echo "  ${BLUE}Alternative:${NC} You can add your existing public key later"
    echo ""
    
    read -p "Generate SSH key pair for profolio user? (y/n) [y]: " generate_key
    if [[ "$generate_key" =~ ^[Yy]?$ ]]; then
        echo -e "${GREEN}✅ SSH key pair will be generated during installation${NC}"
        GENERATE_SSH_KEY="yes"
        
        echo ""
        echo -e "${CYAN}📝 SSH Key Setup Instructions:${NC}"
        echo "After installation:"
        echo "1. SSH key pair will be in /home/profolio/.ssh/"
        echo "2. Copy the public key to your local machine"
        echo "3. Use: ssh -p $SSH_PORT profolio@YOUR_SERVER_IP"
        echo "4. Private key: /home/profolio/.ssh/id_rsa"
        echo "5. Public key: /home/profolio/.ssh/id_rsa.pub"
    else
        GENERATE_SSH_KEY="no"
        echo -e "${BLUE}ℹ️  You'll need to manually add your SSH public key later${NC}"
        echo "Add your key to: /home/profolio/.ssh/authorized_keys"
    fi
}

# Configure SSH Server
configure_ssh_server() {
    echo -e "${BLUE}🔐 Configuring SSH server...${NC}"
    
    # Backup original sshd_config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)
    
    # Configure SSH daemon
    cat > /etc/ssh/sshd_config << EOF
# Profolio SSH Configuration
# Generated by install-or-update.sh

# Network
Port $SSH_PORT
AddressFamily any
ListenAddress 0.0.0.0

# Authentication
PermitRootLogin $SSH_ROOT_LOGIN
MaxAuthTries 3
MaxSessions 10

# Password Authentication
PasswordAuthentication $SSH_PASSWORD_AUTH
PermitEmptyPasswords no

# Public Key Authentication
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Challenge Response Authentication
ChallengeResponseAuthentication no

# GSSAPI Authentication
GSSAPIAuthentication no

# X11 Forwarding
X11Forwarding no

# Print motd and last log
PrintMotd yes
PrintLastLog yes

# TCP Keep Alive
TCPKeepAlive yes
ClientAliveInterval 60
ClientAliveCountMax 3

# Use strong ciphers and MACs
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512

# Logging
SyslogFacility AUTH
LogLevel INFO

# Other Security Settings
Protocol 2
StrictModes yes
IgnoreRhosts yes
HostbasedAuthentication no
Banner none
DebianBanner no

# Subsystem
Subsystem sftp /usr/lib/openssh/sftp-server
EOF

    # Set proper permissions
    chmod 644 /etc/ssh/sshd_config
    
    # Configure profolio user for SSH access
    # Add profolio to sudo group if not root login
    if [ "$SSH_ROOT_LOGIN" = "no" ]; then
        usermod -aG sudo profolio
        echo -e "${GREEN}✅ Added profolio user to sudo group${NC}"
    fi
    
    # Generate SSH keys for profolio user if requested
    if [ "$GENERATE_SSH_KEY" = "yes" ]; then
        echo -e "${BLUE}🔑 Generating SSH key pair for profolio user...${NC}"
        
        # Create .ssh directory
        sudo -u profolio mkdir -p /home/profolio/.ssh
        chmod 700 /home/profolio/.ssh
        chown profolio:profolio /home/profolio/.ssh
        
        # Generate SSH key pair
        sudo -u profolio ssh-keygen -t rsa -b 4096 -f /home/profolio/.ssh/id_rsa -N "" -C "profolio@$(hostname)"
        
        # Set up authorized_keys with the new public key
        sudo -u profolio cp /home/profolio/.ssh/id_rsa.pub /home/profolio/.ssh/authorized_keys
        chmod 600 /home/profolio/.ssh/authorized_keys
        chown profolio:profolio /home/profolio/.ssh/authorized_keys
        
        echo -e "${GREEN}✅ SSH key pair generated for profolio user${NC}"
        echo -e "${YELLOW}📝 Private key: /home/profolio/.ssh/id_rsa${NC}"
        echo -e "${YELLOW}📝 Public key: /home/profolio/.ssh/id_rsa.pub${NC}"
    fi
    
    # Enable and start SSH service
    systemctl enable ssh
    systemctl restart ssh
    
    # Verify SSH service is running
    if systemctl is-active --quiet ssh; then
        echo -e "${GREEN}✅ SSH service started successfully on port $SSH_PORT${NC}"
        
        # Show connection info
        local_ip=$(hostname -I | awk '{print $1}')
        echo -e "${CYAN}📝 SSH Connection Info:${NC}"
        echo -e "   Command: ${WHITE}ssh -p $SSH_PORT profolio@$local_ip${NC}"
        
        if [ "$SSH_KEY_ONLY" = "yes" ]; then
            echo -e "   ${YELLOW}Note: Key-only authentication enabled${NC}"
            echo -e "   ${YELLOW}You'll need to copy the private key to connect${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to start SSH service${NC}"
        echo -e "${YELLOW}⚠️  Check SSH configuration: sudo journalctl -u ssh${NC}"
    fi
}

# Use default configuration
use_defaults() {
    CONTAINER_NAME="$DEFAULT_CONTAINER_NAME"
    CPU_CORES="$DEFAULT_CPU_CORES"
    MEMORY_MB="$DEFAULT_MEMORY"
    STORAGE_GB="$DEFAULT_STORAGE"
    NETWORK_MODE="dhcp"
    IPV6_ENABLED="no"
    DNS_SERVERS="8.8.8.8,1.1.1.1"
    DNS_DOMAIN="local"
    SSH_ENABLED="yes"
    SSH_PORT="22"
    SSH_ROOT_LOGIN="no"
    SSH_PASSWORD_AUTH="no"
    SSH_KEY_ONLY="yes"
    GENERATE_SSH_KEY="yes"
    DB_PASSWORD=$(openssl rand -base64 12)
    
    echo -e "${GREEN}✅ Using recommended default configuration${NC}"
    echo -e "${YELLOW}📝 Database password will be auto-generated${NC}"
    echo -e "${YELLOW}📝 SSH enabled with key-only authentication${NC}"
}

# Show configuration summary
show_configuration_summary() {
    echo -e "\n${WHITE}📋 CONFIGURATION SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo -e "${BLUE}Container:${NC} $CONTAINER_NAME"
    echo -e "${BLUE}CPU Cores:${NC} $CPU_CORES"
    echo -e "${BLUE}Memory:${NC} ${MEMORY_MB}MB"
    echo -e "${BLUE}Storage:${NC} ${STORAGE_GB}GB"
    echo -e "${BLUE}Network:${NC} $NETWORK_MODE"
    
    if [ "$NETWORK_MODE" = "static" ]; then
        echo -e "${BLUE}Static IP:${NC} $STATIC_IP"
        echo -e "${BLUE}Gateway:${NC} $GATEWAY"
        echo -e "${BLUE}Subnet:${NC} $SUBNET_MASK"
    fi
    
    echo -e "${BLUE}IPv6:${NC} $IPV6_ENABLED"
    echo -e "${BLUE}DNS:${NC} $DNS_SERVERS"
    echo -e "${BLUE}Domain:${NC} $DNS_DOMAIN"
    
    # SSH Configuration Summary
    echo -e "${BLUE}SSH Access:${NC} $SSH_ENABLED"
    if [ "$SSH_ENABLED" = "yes" ]; then
        echo -e "${BLUE}SSH Port:${NC} $SSH_PORT"
        echo -e "${BLUE}Root Login:${NC} $SSH_ROOT_LOGIN"
        if [ "$SSH_KEY_ONLY" = "yes" ]; then
            echo -e "${BLUE}Authentication:${NC} Key-only (secure)"
        elif [ "$SSH_PASSWORD_AUTH" = "yes" ]; then
            echo -e "${BLUE}Authentication:${NC} Password enabled"
        fi
        if [ "$GENERATE_SSH_KEY" = "yes" ]; then
            echo -e "${BLUE}SSH Keys:${NC} Will be generated"
        fi
    fi
    
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo ""
    
    read -p "Proceed with this configuration? (y/n) [y]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]?$ ]]; then
        echo -e "${YELLOW}⚠️  Installation cancelled by user${NC}"
        exit 0
    fi
}

# Update confirmation wizard
run_update_wizard() {
    echo -e "${WHITE}🔄 PROFOLIO UPDATE WIZARD${NC}"
    echo -e "${YELLOW}Update your existing Profolio installation${NC}"
    echo ""
    
    # Show current version info
    if [ -f "/opt/profolio/package.json" ]; then
        current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4)
        echo -e "${BLUE}Current Version:${NC} $current_version"
    fi
    
    echo -e "${BLUE}Latest Version:${NC} Checking..."
    
    echo ""
    echo -e "${CYAN}Update Process:${NC}"
    echo "  1. 💾 Create automatic backup"
    echo "  2. 🛑 Stop running services"
    echo "  3. 📥 Download latest version"
    echo "  4. 🔨 Update dependencies and rebuild"
    echo "  5. 🚀 Restart services"
    echo "  6. ✅ Verify update success"
    echo ""
    
    read -p "Proceed with update? (y/n) [y]: " update_confirm
    if [[ ! "$update_confirm" =~ ^[Yy]?$ ]]; then
        echo -e "${YELLOW}⚠️  Update cancelled by user${NC}"
        exit 0
    fi
    
    echo -e "${GREEN}✅ Update confirmed. Starting update process...${NC}"
}

# Backup management with 3 backup limit
manage_backups() {
    local backup_type=$1
    local backup_dir="/opt/profolio-backups"
    
    mkdir -p "$backup_dir"
    
    # Create new backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local new_backup_dir="$backup_dir/${backup_type}_${timestamp}"
    mkdir -p "$new_backup_dir"
    
    echo -e "${BLUE}💾 Creating backup...${NC}"
    
    # Backup database
    if sudo -u postgres pg_dump profolio > "$new_backup_dir/database.sql" 2>/dev/null; then
        echo -e "${GREEN}✅ Database backup created${NC}"
    else
        echo -e "${YELLOW}⚠️  Database backup failed (may not exist yet)${NC}"
    fi
    
    # Backup application
    if [ -d "/opt/profolio" ]; then
        cp -r /opt/profolio "$new_backup_dir/application"
        echo -e "${GREEN}✅ Application backup created${NC}"
    fi
    
    # Cleanup old backups (keep only 3 most recent)
    local backup_count=$(ls -1 "$backup_dir" | grep "^${backup_type}_" | wc -l)
    if [ "$backup_count" -gt 3 ]; then
        local backups_to_remove=$((backup_count - 3))
        ls -1 "$backup_dir" | grep "^${backup_type}_" | head -n "$backups_to_remove" | while read -r old_backup; do
            rm -rf "$backup_dir/$old_backup"
            echo -e "${YELLOW}🗑️  Removed old backup: $old_backup${NC}"
        done
    fi
    
    echo -e "${GREEN}📁 Backup created: $new_backup_dir${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ This script must be run as root${NC}"
        echo "Usage: sudo ./install-or-update.sh"
        exit 1
    fi
}

# Detect installation state
detect_installation_state() {
    if [ -d "/opt/profolio" ] && [ -f "/etc/systemd/system/profolio-backend.service" ]; then
        if systemctl is-active --quiet profolio-backend 2>/dev/null; then
            return 2  # Running installation
        else
            return 1  # Installed but not running
        fi
    else
        return 0  # Fresh system
    fi
}

# Fresh Installation Function
fresh_install() {
    echo -e "${GREEN}🆕 FRESH INSTALLATION${NC}"
    
    if [ "$AUTO_INSTALL" = false ]; then
        show_progress 1 9 "Configuration completed"
    else
        show_progress 1 9 "Using default configuration"
    fi
    
    # Create profolio user
    show_progress 2 9 "Creating profolio user..."
    useradd -r -s /bin/bash -d /home/profolio -m profolio 2>/dev/null || echo "User already exists"
    
    # Install system dependencies
    show_progress 3 9 "Installing system dependencies..."
    if [ "$SSH_ENABLED" = "yes" ]; then
        apt update
        apt install -y git nodejs npm postgresql postgresql-contrib curl wget openssl openssh-server
    else
        apt update
        apt install -y git nodejs npm postgresql postgresql-contrib curl wget openssl
    fi
    
    # Configure SSH if enabled
    if [ "$SSH_ENABLED" = "yes" ]; then
        show_progress 4 9 "Configuring SSH access..."
        configure_ssh_server
    else
        show_progress 4 9 "Skipping SSH configuration..."
    fi
    
    # Start PostgreSQL
    show_progress 5 9 "Setting up PostgreSQL..."
    systemctl enable postgresql
    systemctl start postgresql
    
    # Create database and user
    show_progress 6 9 "Setting up database..."
    sudo -u postgres psql << EOF
CREATE USER profolio WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE profolio OWNER profolio;
GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
\q
EOF
    
    # Clone repository
    show_progress 7 9 "Downloading Profolio..."
    if [ -d "/opt/profolio" ]; then
        rm -rf /opt/profolio
    fi
    
    cd /opt
    git clone https://github.com/Obednal97/profolio.git
    chown -R profolio:profolio /opt/profolio
    
    # Setup environment
    show_progress 8 9 "Configuring environment..."
    cd /opt/profolio
    setup_environment
    
    # Install dependencies and build
    build_application
    
    # Install and start services
    show_progress 9 9 "Starting services..."
    install_systemd_services
    systemctl enable profolio-backend profolio-frontend
    systemctl start profolio-backend profolio-frontend
    
    # Verify installation
    verify_installation
    
    echo -e "${GREEN}✅ Installation completed successfully!${NC}"
    show_access_info
}

# Update Installation Function
update_installation() {
    echo -e "${YELLOW}🔄 UPDATE INSTALLATION${NC}"
    
    # Create backup
    show_progress 1 6 "Creating backup..."
    manage_backups "update"
    
    # Stop services
    show_progress 2 6 "Stopping services..."
    systemctl stop profolio-frontend profolio-backend || true
    
    # Update code
    show_progress 3 6 "Downloading updates..."
    cd /opt/profolio
    sudo -u profolio git stash push -m "Auto-stash before update $(date)"
    sudo -u profolio git pull origin main
    
    # Update and rebuild
    show_progress 4 6 "Rebuilding application..."
    build_application
    
    # Update services and restart
    show_progress 5 6 "Updating services..."
    install_systemd_services
    systemctl daemon-reload
    systemctl start profolio-backend profolio-frontend
    
    # Verify update
    show_progress 6 6 "Verifying update..."
    verify_installation
    
    echo -e "${GREEN}✅ Update completed successfully!${NC}"
    show_access_info
}

# Repair Installation Function
repair_installation() {
    echo -e "${YELLOW}🔧 REPAIR INSTALLATION${NC}"
    
    show_progress 1 4 "Updating configuration..."
    cd /opt/profolio
    setup_environment
    
    show_progress 2 4 "Reinstalling services..."
    install_systemd_services
    systemctl daemon-reload
    
    show_progress 3 4 "Starting services..."
    systemctl start profolio-backend profolio-frontend
    
    show_progress 4 4 "Verifying repair..."
    verify_installation
    
    echo -e "${GREEN}✅ Repair completed successfully!${NC}"
    show_access_info
}

# Setup environment configuration
setup_environment() {
    # Generate secure JWT secret if needed
    local jwt_secret=$(openssl rand -base64 32)
    local api_key=$(openssl rand -base64 32)
    
    # Create backend .env
    cat > /opt/profolio/backend/.env << EOF
DATABASE_URL="postgresql://profolio:${DB_PASSWORD}@localhost:5432/profolio"
JWT_SECRET="${jwt_secret}"
API_ENCRYPTION_KEY="${api_key}"
PORT=3001
NODE_ENV=production
EOF

    # Create frontend .env
    cat > /opt/profolio/frontend/.env << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=production
EOF

    # Set proper permissions
    chown profolio:profolio /opt/profolio/backend/.env /opt/profolio/frontend/.env
    chmod 600 /opt/profolio/backend/.env /opt/profolio/frontend/.env
}

# Build application
build_application() {
    # Backend
    cd /opt/profolio/backend
    sudo -u profolio npm install
    sudo -u profolio npx prisma generate
    sudo -u profolio npx prisma migrate deploy
    sudo -u profolio npx nest build
    
    # Frontend
    cd /opt/profolio/frontend
    sudo -u profolio npm install
    sudo -u profolio npm run build
}

# Install systemd services
install_systemd_services() {
    # Backend service
    cat > /etc/systemd/system/profolio-backend.service << 'EOF'
[Unit]
Description=Profolio Backend
After=network.target postgresql.service

[Service]
Type=simple
User=profolio
Group=profolio
WorkingDirectory=/opt/profolio/backend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    cat > /etc/systemd/system/profolio-frontend.service << 'EOF'
[Unit]
Description=Profolio Frontend
After=network.target profolio-backend.service

[Service]
Type=simple
User=profolio
Group=profolio
WorkingDirectory=/opt/profolio/frontend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
}

# Verify installation
verify_installation() {
    echo -e "${BLUE}🔍 Verifying installation...${NC}"
    
    # Wait for services to start
    sleep 10
    
    # Check service status
    if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
        echo -e "${GREEN}✅ Services are running${NC}"
        
        # Test endpoints
        local max_attempts=30
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Backend API responding${NC}"
                break
            fi
            echo -e "${YELLOW}⏳ Waiting for backend... ($attempt/$max_attempts)${NC}"
            sleep 2
            ((attempt++))
        done
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend starting up...${NC}"
        fi
    else
        echo -e "${RED}❌ Services failed to start${NC}"
        echo "Check logs with: journalctl -u profolio-backend -u profolio-frontend -f"
        return 1
    fi
}

# Show access information
show_access_info() {
    local_ip=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 INSTALLATION COMPLETE                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${BLUE}🌐 Access your Profolio instance:${NC}"
    echo -e "   ${WHITE}Frontend:${NC} ${GREEN}http://$local_ip:3000${NC}"
    echo -e "   ${WHITE}Backend:${NC}  ${GREEN}http://$local_ip:3001${NC}"
    echo ""
    
    # SSH Access Information
    if [ "$SSH_ENABLED" = "yes" ]; then
        echo -e "${BLUE}🔐 SSH Access Information:${NC}"
        echo -e "   ${WHITE}SSH Command:${NC} ${CYAN}ssh -p $SSH_PORT profolio@$local_ip${NC}"
        
        if [ "$SSH_KEY_ONLY" = "yes" ]; then
            echo -e "   ${WHITE}Authentication:${NC} ${GREEN}Key-only (secure)${NC}"
            if [ "$GENERATE_SSH_KEY" = "yes" ]; then
                echo -e "   ${WHITE}Private Key:${NC} ${YELLOW}/home/profolio/.ssh/id_rsa${NC}"
                echo -e "   ${WHITE}Public Key:${NC} ${YELLOW}/home/profolio/.ssh/id_rsa.pub${NC}"
                echo ""
                echo -e "${CYAN}📝 To connect from your local machine:${NC}"
                echo -e "   ${WHITE}1.${NC} Copy the private key: ${CYAN}scp -P $SSH_PORT profolio@$local_ip:/home/profolio/.ssh/id_rsa ~/.ssh/profolio_key${NC}"
                echo -e "   ${WHITE}2.${NC} Set permissions: ${CYAN}chmod 600 ~/.ssh/profolio_key${NC}"
                echo -e "   ${WHITE}3.${NC} Connect: ${CYAN}ssh -i ~/.ssh/profolio_key -p $SSH_PORT profolio@$local_ip${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Add your public key to: /home/profolio/.ssh/authorized_keys${NC}"
            fi
        elif [ "$SSH_PASSWORD_AUTH" = "yes" ]; then
            echo -e "   ${WHITE}Authentication:${NC} ${YELLOW}Password enabled${NC}"
            echo -e "   ${YELLOW}⚠️  Use strong passwords for security${NC}"
        fi
        
        if [ "$SSH_ROOT_LOGIN" = "yes" ]; then
            echo -e "   ${WHITE}Root Access:${NC} ${RED}Enabled (security risk)${NC}"
        else
            echo -e "   ${WHITE}Root Access:${NC} ${GREEN}Disabled (use sudo)${NC}"
        fi
        echo ""
    fi
    
    echo -e "${BLUE}🔐 Security Information:${NC}"
    echo -e "   ${WHITE}Database Password:${NC} ${YELLOW}[Configured during setup]${NC}"
    echo -e "   ${WHITE}Default Login:${NC} ${YELLOW}Create account on first visit${NC}"
    echo ""
    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo -e "   ${WHITE}Status:${NC}  ${CYAN}sudo systemctl status profolio-backend profolio-frontend${NC}"
    echo -e "   ${WHITE}Logs:${NC}    ${CYAN}sudo journalctl -u profolio-backend -u profolio-frontend -f${NC}"
    echo -e "   ${WHITE}Restart:${NC} ${CYAN}sudo systemctl restart profolio-backend profolio-frontend${NC}"
    echo -e "   ${WHITE}Update:${NC}  ${CYAN}sudo ./install-or-update.sh${NC}"
    
    if [ "$SSH_ENABLED" = "yes" ]; then
        echo -e "   ${WHITE}SSH Status:${NC} ${CYAN}sudo systemctl status ssh${NC}"
        echo -e "   ${WHITE}SSH Logs:${NC}  ${CYAN}sudo journalctl -u ssh -f${NC}"
    fi
    
    echo ""
    echo -e "${PURPLE}📚 Documentation:${NC} https://github.com/Obednal97/profolio"
    echo ""
}

# Main execution logic
main() {
    show_banner
    check_root
    
    # Command line arguments
    case "${1:-}" in
        --auto|--unattended)
            AUTO_INSTALL=true
            ;;
        --help|-h)
            echo "Usage: $0 [--auto|--unattended]"
            echo "  --auto: Run with default configuration"
            exit 0
            ;;
    esac
    
    detect_installation_state
    case $? in
        0)
            # Fresh installation
            if [ "$AUTO_INSTALL" = false ]; then
                run_configuration_wizard
            else
                use_defaults
            fi
            fresh_install
            ;;
        1)
            # Repair needed
            repair_installation
            ;;
        2)
            # Update available
            run_update_wizard
            update_installation
            ;;
    esac
}

# Run main function
main "$@" 