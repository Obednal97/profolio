#!/bin/bash

# 🚀 Profolio Smart Install/Update Script
# Professional Proxmox-style wizard with dynamic progress bars

# Note: Removed 'set -e' to prevent premature exit on minor errors
# Critical errors will be handled explicitly

# Colors for output - simplified for better compatibility
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    WHITE=''
    NC=''
fi

# Simple progress spinner - using basic ASCII characters for compatibility
SPINNER_CHARS="/-\|"
SPINNER_PID=""

# Simple spinner function that actually works
show_spinner() {
    local message="$1"
    local pid="$2"
    local spin='-\|/'
    local i=0
    
    echo -n "$message "
    while kill -0 $pid 2>/dev/null; do
        i=$(((i+1) % 4))
        printf "\r$message ${spin:$i:1}"
        sleep 0.1
    done
    printf "\r$message ✓\n"
}

# Enhanced progress function with simple, working progress indication
show_progress() {
    local step=$1
    local total=$2
    local message=$3
    local command="$4"
    
    printf "${BLUE}[$step/$total]${NC} $message"
    
    if [[ -n "$command" ]]; then
        # Run command in background and show spinner
        eval "$command" > /tmp/profolio_progress.log 2>&1 &
        local cmd_pid=$!
        
        # Simple ASCII spinner
        local spin='-\|/'
        local i=0
        while kill -0 $cmd_pid 2>/dev/null; do
            i=$(((i+1) % 4))
            printf "\r${BLUE}[$step/$total]${NC} $message ${spin:$i:1}"
            sleep 0.1
        done
        
        # Check if command succeeded
        wait $cmd_pid
        local exit_code=$?
        
        if [[ $exit_code -eq 0 ]]; then
            printf "\r${BLUE}[$step/$total]${NC} $message ${GREEN}✓${NC}\n"
            return 0
        else
            printf "\r${BLUE}[$step/$total]${NC} $message ${RED}✗${NC}\n"
            echo "${RED}Error details:${NC}"
            cat /tmp/profolio_progress.log
            return 1
        fi
    else
        printf "\n"
        return 0
    fi
}

# Multi-step execution with clean progress display
execute_steps() {
    local main_message="$1"
    shift
    local steps=("$@")
    
    echo -e "${CYAN}🚀 $main_message${NC}"
    
    local step_count=$((${#steps[@]} / 2))
    local current_step=1
    
    for ((i=0; i<${#steps[@]}; i+=2)); do
        local step_msg="${steps[i]}"
        local step_cmd="${steps[i+1]}"
        
        if ! show_progress "$current_step" "$step_count" "$step_msg" "$step_cmd"; then
            echo -e "${RED}❌ Failed: $step_msg${NC}"
            return 1
        fi
        
        ((current_step++))
    done
    
    echo -e "${GREEN}✅ $main_message completed successfully${NC}"
    return 0
}

# Simple info messages
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Simple warning messages  
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Simple error messages
error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Simple success messages
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

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

# Banner with simple, reliable styling
show_banner() {
    # Set TERM if not already set to prevent clear command failures
    if [ -z "$TERM" ]; then
        export TERM=xterm
    fi
    
    # Only clear if we have a proper terminal
    if [ -t 1 ]; then
        clear 2>/dev/null || true
    fi
    
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
    
    # For now, just use defaults for advanced setup too
    # TODO: Implement full configuration wizard
    echo -e "${YELLOW}⚠️  Advanced setup not yet implemented. Using defaults.${NC}"
    use_defaults
}

# SSH Access Configuration (simplified for now)
configure_ssh_access() {
    echo -e "${YELLOW}ℹ️  SSH configuration will use defaults for now${NC}"
    SSH_ENABLED="yes"
    SSH_PORT="22"
    SSH_ROOT_LOGIN="no"
    SSH_PASSWORD_AUTH="no"
    SSH_KEY_ONLY="yes"
    GENERATE_SSH_KEY="yes"
}

# Static network configuration (simplified)
configure_static_network() {
    echo -e "${YELLOW}ℹ️  Static network configuration not implemented yet. Using DHCP.${NC}"
    NETWORK_MODE="dhcp"
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

# Use default configuration with clear output
use_defaults() {
    CONTAINER_NAME="Profolio"
    CPU_CORES="2"
    MEMORY_MB="4096"
    STORAGE_GB="20"
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
    
    success "Using recommended default configuration"
    info "Database password: $DB_PASSWORD"
    info "SSH enabled with key-only authentication"
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

# Update confirmation wizard with cleaner output
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
        warn "Update cancelled by user"
        exit 0
    fi
    
    success "Update confirmed. Starting update process..."
}

# Manage backups with improved feedback
manage_backups() {
    local backup_type=$1
    local backup_dir="/opt/profolio-backups"
    
    mkdir -p "$backup_dir"
    
    # Create new backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local new_backup_dir="$backup_dir/${backup_type}_${timestamp}"
    mkdir -p "$new_backup_dir"
    
    info "Creating backup..."
    
    # Backup database
    if sudo -u postgres pg_dump profolio > "$new_backup_dir/database.sql" 2>/dev/null; then
        success "Database backup created"
    else
        warn "Database backup failed (may not exist yet)"
    fi
    
    # Backup application
    if [ -d "/opt/profolio" ]; then
        cp -r /opt/profolio "$new_backup_dir/application"
        success "Application backup created"
    fi
    
    # Cleanup old backups (keep only 3 most recent)
    local backup_count=$(ls -1 "$backup_dir" | grep "^${backup_type}_" | wc -l)
    if [ "$backup_count" -gt 3 ]; then
        local backups_to_remove=$((backup_count - 3))
        ls -1 "$backup_dir" | grep "^${backup_type}_" | head -n "$backups_to_remove" | while read -r old_backup; do
            rm -rf "$backup_dir/$old_backup"
            info "Removed old backup: $old_backup"
        done
    fi
    
    success "Backup created: $new_backup_dir"
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

# Build application with dynamic progress
build_application() {
    local steps=(
        "Installing backend dependencies" "cd /opt/profolio/backend && sudo -u profolio npm install"
        "Generating Prisma client" "cd /opt/profolio/backend && sudo -u profolio npx prisma generate"
        "Running database migrations" "cd /opt/profolio/backend && sudo -u profolio npx prisma migrate deploy"
        "Building NestJS backend" "cd /opt/profolio/backend && sudo -u profolio npx nest build"
        "Installing frontend dependencies" "cd /opt/profolio/frontend && sudo -u profolio npm install"
        "Building Next.js frontend" "cd /opt/profolio/frontend && sudo -u profolio npm run build"
    )
    
    execute_steps "Building Profolio Application" "${steps[@]}"
}

# Enhanced verification with better diagnostics
verify_installation() {
    info "Verifying installation..."
    
    # Give services a bit more time to fully start
    info "Waiting for services to fully initialize..."
    sleep 5
    
    # Check service status with better diagnostics
    printf "${BLUE}[1/3]${NC} Checking service status"
    
    # Check backend service
    if ! systemctl is-active --quiet profolio-backend; then
        printf "\r${BLUE}[1/3]${NC} Checking service status ${RED}✗${NC}\n"
        error "Backend service is not running"
        info "Backend service status:"
        systemctl status profolio-backend --no-pager -l
        info "Recent backend logs:"
        journalctl -u profolio-backend -n 15 --no-pager
        return 1
    fi
    
    # Check frontend service
    if ! systemctl is-active --quiet profolio-frontend; then
        printf "\r${BLUE}[1/3]${NC} Checking service status ${RED}✗${NC}\n"
        error "Frontend service is not running"
        info "Frontend service status:"
        systemctl status profolio-frontend --no-pager -l
        info "Recent frontend logs:"
        journalctl -u profolio-frontend -n 15 --no-pager
        return 1
    fi
    
    printf "\r${BLUE}[1/3]${NC} Checking service status ${GREEN}✓${NC}\n"
    
    # Test backend API with better feedback
    printf "${BLUE}[2/3]${NC} Testing backend API"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        printf "\r${BLUE}[2/3]${NC} Testing backend API (attempt $attempt/$max_attempts)"
        
        if curl -s --connect-timeout 5 --max-time 10 http://localhost:3001/api/health >/dev/null 2>&1; then
            printf "\r${BLUE}[2/3]${NC} Testing backend API ${GREEN}✓${NC}\n"
            break
        fi
        
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        printf "\r${BLUE}[2/3]${NC} Testing backend API ${YELLOW}⚠${NC}\n"
        warn "Backend API not responding after $max_attempts attempts"
        info "Backend might still be starting up. Check logs:"
        info "journalctl -u profolio-backend -f"
    fi
    
    # Test frontend with timeout
    printf "${BLUE}[3/3]${NC} Testing frontend"
    if curl -s --connect-timeout 5 --max-time 10 http://localhost:3000 >/dev/null 2>&1; then
        printf "\r${BLUE}[3/3]${NC} Testing frontend ${GREEN}✓${NC}\n"
    else
        printf "\r${BLUE}[3/3]${NC} Testing frontend ${YELLOW}⚠${NC}\n"
        warn "Frontend not responding yet - may still be building/starting"
        info "Frontend logs:"
        journalctl -u profolio-frontend -n 10 --no-pager
    fi
    
    success "Installation verification completed"
}

# Simplified fresh install
fresh_install() {
    success "Starting fresh installation"
    
    if [ "$AUTO_INSTALL" = false ]; then
        success "Configuration completed"
    else
        success "Using default configuration"
    fi
    
    # System setup phase
    local system_steps=(
        "Creating profolio user" "useradd -r -s /bin/bash -d /home/profolio -m profolio 2>/dev/null || true"
        "Updating package lists" "apt update"
        "Installing system dependencies" "apt install -y git nodejs npm postgresql postgresql-contrib curl wget openssl openssh-server"
    )
    
    if ! execute_steps "System Setup" "${system_steps[@]}"; then
        return 1
    fi
    
    # SSH configuration if enabled
    if [ "$SSH_ENABLED" = "yes" ]; then
        info "Configuring SSH access..."
        configure_ssh_server
        success "SSH configuration complete"
    fi
    
    # Database setup phase
    local db_steps=(
        "Starting PostgreSQL service" "systemctl enable postgresql && systemctl start postgresql"
        "Creating database and user" "sudo -u postgres psql -c \"CREATE USER profolio WITH PASSWORD '$DB_PASSWORD'; CREATE DATABASE profolio OWNER profolio; GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;\" || true"
    )
    
    if ! execute_steps "Database Setup" "${db_steps[@]}"; then
        return 1
    fi
    
    # Application download
    info "Downloading Profolio repository..."
    if [ -d "/opt/profolio" ]; then
        rm -rf /opt/profolio
    fi
    
    cd /opt
    if git clone https://github.com/Obednal97/profolio.git; then
        chown -R profolio:profolio /opt/profolio
        success "Repository downloaded"
    else
        error "Failed to download repository"
        return 1
    fi
    
    # Environment setup
    info "Setting up environment configuration..."
    cd /opt/profolio
    setup_environment
    success "Environment configured"
    
    # Build application
    if ! build_application; then
        return 1
    fi
    
    # Service installation with improved management
    local service_steps=(
        "Installing systemd services" "install_systemd_services"
        "Reloading systemd daemon" "systemctl daemon-reload"
        "Enabling services for auto-start" "systemctl enable profolio-backend profolio-frontend"
    )
    
    if ! execute_steps "Service Installation" "${service_steps[@]}"; then
        return 1
    fi
    
    # Start services with proper timing
    info "Starting backend service..."
    if systemctl start profolio-backend; then
        success "Backend service started"
        sleep 3  # Give backend time to start
    else
        error "Failed to start backend service"
        info "Backend logs:"
        journalctl -u profolio-backend -n 10 --no-pager
        return 1
    fi
    
    info "Starting frontend service..."
    if systemctl start profolio-frontend; then
        success "Frontend service started"
        sleep 2  # Give frontend time to start
    else
        error "Failed to start frontend service"
        info "Frontend logs:"
        journalctl -u profolio-frontend -n 10 --no-pager
        return 1
    fi
    
    # Final verification
    verify_installation
    
    success "Installation completed successfully!"
    show_access_info
}

# Simplified update installation
update_installation() {
    info "Starting update process"
    
    # Create backup
    info "Creating system backup..."
    manage_backups "update"
    success "Backup created"
    
    # Stop services properly
    info "Stopping services for update..."
    systemctl stop profolio-frontend profolio-backend 2>/dev/null || true
    systemctl reset-failed profolio-frontend profolio-backend 2>/dev/null || true
    success "Services stopped"
    
    # Update code
    info "Downloading latest updates..."
    cd /opt/profolio
    if sudo -u profolio git stash push -m "Auto-stash before update $(date)" && sudo -u profolio git pull origin main; then
        success "Code updated"
    else
        error "Failed to update code"
        return 1
    fi
    
    # Rebuild application
    if ! build_application; then
        return 1
    fi
    
    # Update service configurations
    local service_steps=(
        "Updating service configurations" "install_systemd_services"
        "Reloading systemd daemon" "systemctl daemon-reload"
        "Enabling services for auto-start" "systemctl enable profolio-backend profolio-frontend"
    )
    
    if ! execute_steps "Service Update" "${service_steps[@]}"; then
        return 1
    fi
    
    # Start services with proper timing
    info "Starting backend service..."
    if systemctl start profolio-backend; then
        success "Backend service started"
        sleep 3  # Give backend time to start
    else
        error "Failed to start backend service"
        info "Backend logs:"
        journalctl -u profolio-backend -n 10 --no-pager
        return 1
    fi
    
    info "Starting frontend service..."
    if systemctl start profolio-frontend; then
        success "Frontend service started"
        sleep 2  # Give frontend time to start
    else
        error "Failed to start frontend service"
        info "Frontend logs:"
        journalctl -u profolio-frontend -n 10 --no-pager
        return 1
    fi
    
    # Verify update
    verify_installation
    
    success "Update completed successfully!"
    show_access_info
}

# Simplified repair installation
repair_installation() {
    info "Starting repair process"
    
    # Configuration update
    info "Updating system configuration..."
    cd /opt/profolio
    setup_environment
    success "Configuration updated"
    
    # Service management with proper state handling
    info "Stopping any running services..."
    systemctl stop profolio-frontend profolio-backend 2>/dev/null || true
    systemctl reset-failed profolio-frontend profolio-backend 2>/dev/null || true
    
    local service_steps=(
        "Reinstalling systemd services" "install_systemd_services"
        "Reloading systemd daemon" "systemctl daemon-reload"
        "Enabling services for auto-start" "systemctl enable profolio-backend profolio-frontend"
    )
    
    if ! execute_steps "Service Configuration" "${service_steps[@]}"; then
        return 1
    fi
    
    # Start services with proper timing
    info "Starting backend service..."
    if systemctl start profolio-backend; then
        success "Backend service started"
        sleep 3  # Give backend time to start
    else
        error "Failed to start backend service"
        info "Backend logs:"
        journalctl -u profolio-backend -n 10 --no-pager
        return 1
    fi
    
    info "Starting frontend service..."
    if systemctl start profolio-frontend; then
        success "Frontend service started"
        sleep 2  # Give frontend time to start
    else
        error "Failed to start frontend service"
        info "Frontend logs:"
        journalctl -u profolio-frontend -n 10 --no-pager
        return 1
    fi
    
    # Final verification
    verify_installation
    
    success "Repair completed successfully!"
    show_access_info
}

# Setup environment configuration with feedback
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

# Main execution logic with cleaner output
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
    
    info "Detecting installation state..."
    detect_installation_state
    local install_state=$?
    
    info "Installation state: $install_state"
    case $install_state in
        0)
            success "Fresh system detected"
            if [ "$AUTO_INSTALL" = false ]; then
                run_configuration_wizard
            else
                use_defaults
            fi
            fresh_install
            ;;
        1)
            warn "Installed but not running - repair needed"
            repair_installation
            ;;
        2)
            info "Running installation detected - update available"
            run_update_wizard
            update_installation
            ;;
        *)
            error "Unknown installation state: $install_state"
            exit 1
            ;;
    esac
    
    success "Script execution completed!"
}

# Run main function
main "$@" 