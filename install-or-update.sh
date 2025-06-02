#!/bin/bash

# 🚀 Profolio Smart Install/Update Script v2.0
# Professional Proxmox-style wizard with rollback and version control

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

# Rollback and version control variables
ROLLBACK_ENABLED=true
ROLLBACK_COMMIT=""
ROLLBACK_BACKUP_DIR=""
TARGET_VERSION=""
FORCE_VERSION=false

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

# Rollback and version control functions
# =====================================

# Validate version format (supports v1.0.0, 1.0.0, main, latest)
validate_version() {
    local version="$1"
    
    # Allow special keywords
    case "$version" in
        "main"|"latest"|"")
            return 0
            ;;
        *)
            # Check if it's a valid version tag format
            if [[ "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
    esac
}

# Get available versions from GitHub
get_available_versions() {
    info "Fetching available versions..."
    
    # Get all release tags from GitHub API
    local versions=$(curl -s --connect-timeout 10 --max-time 30 \
        "https://api.github.com/repos/Obednal97/profolio/releases" | \
        grep '"tag_name"' | \
        cut -d'"' -f4 | \
        sort -V -r 2>/dev/null || echo "")
    
    if [ -n "$versions" ]; then
        echo -e "${CYAN}📋 Available versions:${NC}"
        echo "$versions" | head -10 | while read -r version; do
            echo "   • $version"
        done
        if [ $(echo "$versions" | wc -l) -gt 10 ]; then
            echo "   ... and $(($(echo "$versions" | wc -l) - 10)) more"
        fi
        echo "   • main (latest development)"
        echo ""
        return 0
    else
        warn "Could not fetch version list from GitHub"
        echo -e "${CYAN}📋 Common versions:${NC}"
        echo "   • v1.0.3 (latest stable)"
        echo "   • v1.0.2"
        echo "   • v1.0.1"
        echo "   • main (latest development)"
        echo ""
        return 1
    fi
}

# Check if version exists
version_exists() {
    local version="$1"
    
    # Special cases
    case "$version" in
        "main"|"latest"|"")
            return 0
            ;;
    esac
    
    # Normalize version (add 'v' prefix if not present)
    if [[ ! "$version" =~ ^v ]]; then
        version="v$version"
    fi
    
    # Check if tag exists on GitHub
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 \
        "https://api.github.com/repos/Obednal97/profolio/releases/tags/$version")
    
    if [ "$status_code" = "200" ]; then
        return 0
    else
        # Fallback: check if it exists as a git tag
        if git ls-remote --tags origin | grep -q "refs/tags/$version$"; then
            return 0
        else
            return 1
        fi
    fi
}

# Create rollback point
create_rollback_point() {
    if [ "$ROLLBACK_ENABLED" = false ]; then
        return 0
    fi
    
    info "Creating rollback point..."
    
    # Get current git commit
    if [ -d "/opt/profolio/.git" ]; then
        cd /opt/profolio
        ROLLBACK_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
        
        if [ -n "$ROLLBACK_COMMIT" ]; then
            success "Rollback point created: ${ROLLBACK_COMMIT:0:8}"
        else
            warn "Could not determine current git commit"
        fi
    fi
    
    # Create backup directory
    local timestamp=$(date +%Y%m%d_%H%M%S)
    ROLLBACK_BACKUP_DIR="/opt/profolio-rollback-$timestamp"
    
    if [ -d "/opt/profolio" ]; then
        info "Creating rollback backup..."
        cp -r /opt/profolio "$ROLLBACK_BACKUP_DIR" 2>/dev/null || {
            warn "Failed to create rollback backup"
            ROLLBACK_BACKUP_DIR=""
        }
        
        if [ -n "$ROLLBACK_BACKUP_DIR" ]; then
            success "Rollback backup created: $ROLLBACK_BACKUP_DIR"
        fi
    fi
}

# Execute rollback
execute_rollback() {
    if [ "$ROLLBACK_ENABLED" = false ]; then
        error "Rollback is disabled"
        return 1
    fi
    
    warn "🔄 EXECUTING AUTOMATIC ROLLBACK..."
    echo ""
    
    # Stop services
    info "Stopping services..."
    systemctl stop profolio-frontend profolio-backend 2>/dev/null || true
    systemctl reset-failed profolio-frontend profolio-backend 2>/dev/null || true
    
    local rollback_success=false
    
    # Try git rollback first
    if [ -n "$ROLLBACK_COMMIT" ] && [ -d "/opt/profolio/.git" ]; then
        info "Rolling back to git commit: ${ROLLBACK_COMMIT:0:8}"
        cd /opt/profolio
        
        if sudo -u profolio git reset --hard "$ROLLBACK_COMMIT"; then
            success "Git rollback successful"
            rollback_success=true
        else
            error "Git rollback failed"
        fi
    fi
    
    # Fallback to backup restoration
    if [ "$rollback_success" = false ] && [ -n "$ROLLBACK_BACKUP_DIR" ] && [ -d "$ROLLBACK_BACKUP_DIR" ]; then
        info "Restoring from backup: $ROLLBACK_BACKUP_DIR"
        
        if [ -d "/opt/profolio" ]; then
            rm -rf /opt/profolio.failed
            mv /opt/profolio /opt/profolio.failed
        fi
        
        if cp -r "$ROLLBACK_BACKUP_DIR" /opt/profolio; then
            chown -R profolio:profolio /opt/profolio
            success "Backup restoration successful"
            rollback_success=true
        else
            error "Backup restoration failed"
            
            # Try to restore the failed directory
            if [ -d "/opt/profolio.failed" ]; then
                mv /opt/profolio.failed /opt/profolio
                warn "Restored to failed state"
            fi
        fi
    fi
    
    if [ "$rollback_success" = true ]; then
        # Rebuild with previous version
        info "Rebuilding previous version..."
        cd /opt/profolio
        setup_environment
        
        if build_application; then
            # Restart services
            info "Restarting services with previous version..."
            systemctl start profolio-backend
            sleep 3
            systemctl start profolio-frontend
            sleep 2
            
            # Quick verification
            if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
                success "🎉 ROLLBACK COMPLETED SUCCESSFULLY"
                echo ""
                echo -e "${GREEN}✅ Services restored to previous working version${NC}"
                echo -e "${YELLOW}⚠️  Please check logs and investigate the update failure${NC}"
                
                # Clean up rollback files
                cleanup_rollback_files
                return 0
            else
                error "Services failed to start after rollback"
            fi
        else
            error "Failed to rebuild after rollback"
        fi
    fi
    
    error "❌ ROLLBACK FAILED"
    echo ""
    echo -e "${RED}Manual intervention required:${NC}"
    echo -e "   ${WHITE}1.${NC} Check service logs: journalctl -u profolio-backend -u profolio-frontend -f"
    echo -e "   ${WHITE}2.${NC} Restore manually from: $ROLLBACK_BACKUP_DIR"
    echo -e "   ${WHITE}3.${NC} Contact support if needed"
    
    return 1
}

# Clean up rollback files
cleanup_rollback_files() {
    if [ -n "$ROLLBACK_BACKUP_DIR" ] && [ -d "$ROLLBACK_BACKUP_DIR" ]; then
        info "Cleaning up rollback backup..."
        rm -rf "$ROLLBACK_BACKUP_DIR"
        success "Rollback backup cleaned up"
    fi
    
    # Keep only 2 most recent rollback backups
    local rollback_count=$(ls -1 /opt/ | grep "^profolio-rollback-" | wc -l)
    if [ "$rollback_count" -gt 2 ]; then
        local backups_to_remove=$((rollback_count - 2))
        ls -1t /opt/ | grep "^profolio-rollback-" | tail -n "$backups_to_remove" | while read -r old_backup; do
            rm -rf "/opt/$old_backup"
            info "Removed old rollback backup: $old_backup"
        done
    fi
}

# Checkout specific version
checkout_version() {
    local version="$1"
    
    if [ -z "$version" ] || [ "$version" = "main" ] || [ "$version" = "latest" ]; then
        info "Using latest development version (main branch)"
        version="main"
    else
        # Normalize version (add 'v' prefix if not present)
        if [[ ! "$version" =~ ^v ]]; then
            version="v$version"
        fi
        
        info "Switching to version: $version"
    fi
    
    cd /opt/profolio
    
    # Fetch latest refs
    if ! sudo -u profolio git fetch origin; then
        error "Failed to fetch latest updates from repository"
        return 1
    fi
    
    # Checkout the specified version
    if [ "$version" = "main" ]; then
        # Fetch latest changes first
        if ! sudo -u profolio git fetch origin main; then
            error "Failed to fetch latest main branch"
            return 1
        fi
        
        # Checkout main and reset to match remote exactly
        if sudo -u profolio git checkout main && sudo -u profolio git reset --hard origin/main; then
            success "Switched to main branch (latest development)"
            return 0
        else
            error "Failed to checkout main branch"
            return 1
        fi
    else
        if sudo -u profolio git checkout "tags/$version"; then
            success "Switched to version: $version"
            return 0
        else
            error "Failed to checkout version: $version"
            return 1
        fi
    fi
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

# Global variable to track operation type and success
OPERATION_TYPE="install"
OPERATION_SUCCESS=false

# Banner with improved centering
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
    echo "║             🚀 PROFOLIO INSTALLER/UPDATER v2.0               ║"
    echo "║              Professional Portfolio Management               ║"
    echo "║           🛡️  With Rollback & Version Control 🎯              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${CYAN}Self-Hosted • Privacy-Focused • Production-Ready${NC}"
    if [ "$ROLLBACK_ENABLED" = true ]; then
        echo -e "${GREEN}✅ Rollback Protection Enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Rollback Protection Disabled${NC}"
    fi
    if [ -n "$TARGET_VERSION" ]; then
        echo -e "${PURPLE}🎯 Target Version: $TARGET_VERSION${NC}"
    fi
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

# Use default configuration with improved logic
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
    
    # Only generate new password if not already set (for fresh installs)
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 12)
        info "Generated new database password: $DB_PASSWORD"
    fi
    
    success "Using recommended default configuration"
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

# Check for actual version updates
check_version_update_available() {
    local current_version=""
    local latest_version=""
    
    # Get current version if installed
    if [ -f "/opt/profolio/package.json" ]; then
        current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
    fi
    
    # Get latest version from GitHub (with timeout)
    latest_version=$(curl -s --connect-timeout 5 --max-time 10 "https://api.github.com/repos/Obednal97/profolio/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//' 2>/dev/null || echo "unknown")
    
    # Compare versions
    if [ "$current_version" != "unknown" ] && [ "$latest_version" != "unknown" ]; then
        if [ "$current_version" = "$latest_version" ]; then
            return 1  # No update available
        else
            return 0  # Update available
        fi
    fi
    
    return 0  # Assume update available if we can't determine
}

# Enhanced update wizard with proper version checking
run_update_wizard() {
    echo -e "${WHITE}🔄 PROFOLIO UPDATE WIZARD${NC}"
    echo -e "${YELLOW}Update your existing Profolio installation${NC}"
    echo ""
    
    # Show current version info
    local current_version="unknown"
    local latest_version="checking..."
    
    if [ -f "/opt/profolio/package.json" ]; then
        current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
        echo -e "${BLUE}Current Version:${NC} $current_version"
    fi
    
    # If version is specified via command line, use it
    if [ -n "$TARGET_VERSION" ]; then
        echo -e "${BLUE}Target Version:${NC} $TARGET_VERSION"
        
        if [ "$current_version" = "$TARGET_VERSION" ] || [ "$current_version" = "v$TARGET_VERSION" ]; then
            warn "Target version ($TARGET_VERSION) is same as current version ($current_version)"
            echo ""
            read -p "Continue anyway? (y/n) [n]: " force_same_version
            if [[ ! "$force_same_version" =~ ^[Yy]$ ]]; then
                info "Update cancelled - same version"
                exit 0
            fi
        fi
    else
        # Check for latest version if no target specified
        info "Checking for updates..."
        latest_version=$(curl -s --connect-timeout 5 --max-time 10 "https://api.github.com/repos/Obednal97/profolio/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//' 2>/dev/null || echo "unknown")
        
        if [ "$latest_version" != "unknown" ]; then
            echo -e "${BLUE}Latest Version:${NC} $latest_version"
            
            if [ "$current_version" = "$latest_version" ]; then
                warn "You already have the latest version ($current_version)"
                echo ""
                echo -e "${CYAN}Available options:${NC}"
                echo -e "  1) ${YELLOW}Force update${NC} (rebuild current version)"
                echo -e "  2) ${BLUE}Select different version${NC} (upgrade/downgrade)"
                echo -e "  3) ${RED}Cancel${NC}"
                echo ""
                read -p "Select option [3]: " update_option
                update_option=${update_option:-3}
                
                case $update_option in
                    1)
                        info "Force updating current version"
                        ;;
                    2)
                        echo ""
                        get_available_versions
                        read -p "Enter version to install (e.g., v1.0.2): " TARGET_VERSION
                        if [ -z "$TARGET_VERSION" ]; then
                            info "Update cancelled - no version specified"
                            exit 0
                        fi
                        if ! validate_version "$TARGET_VERSION"; then
                            error "Invalid version format: $TARGET_VERSION"
                            exit 1
                        fi
                        ;;
                    *)
                        info "Update cancelled"
                        exit 0
                        ;;
                esac
            else
                success "Update available: $current_version → $latest_version"
            fi
        else
            echo -e "${BLUE}Latest Version:${NC} Unable to check (proceeding anyway)"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}Update Process:${NC}"
    if [ "$ROLLBACK_ENABLED" = true ]; then
        echo "  1. 🛡️  Create rollback point (automatic)"
    fi
    echo "  2. 💾 Create backup"
    echo "  3. 🛑 Stop running services"
    if [ -n "$TARGET_VERSION" ]; then
        echo "  4. 📥 Download version $TARGET_VERSION"
    else
        echo "  4. 📥 Download latest version"
    fi
    echo "  5. 🔨 Update dependencies and rebuild"
    echo "  6. 🚀 Restart services"
    echo "  7. ✅ Verify update success"
    
    echo ""
    echo -e "${GREEN}🔧 Environment Configuration Protection:${NC}"
    echo -e "   ${YELLOW}•${NC} ${GREEN}Firebase credentials${NC} will be preserved automatically"
    echo -e "   ${YELLOW}•${NC} ${GREEN}Authentication settings${NC} will be maintained"
    echo -e "   ${YELLOW}•${NC} ${GREEN}API configurations${NC} will be kept intact"
    echo -e "   ${YELLOW}•${NC} You'll be prompted before any environment changes"
    echo -e "   ${CYAN}Note:${NC} This prevents Firebase authentication breaking during updates"
    
    if [ "$ROLLBACK_ENABLED" = true ]; then
        echo ""
        echo -e "${GREEN}🛡️  Rollback Protection:${NC} Enabled"
        echo -e "   ${YELLOW}•${NC} Automatic rollback on failure"
        echo -e "   ${YELLOW}•${NC} Git-based restoration with backup fallback"
        echo -e "   ${YELLOW}•${NC} Manual rollback available: ${CYAN}$0 --rollback${NC}"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Rollback Protection:${NC} Disabled"
    fi
    echo ""
    
    read -p "Proceed with update? (y/n) [y]: " update_confirm
    if [[ ! "$update_confirm" =~ ^[Yy]?$ ]]; then
        warn "Update cancelled by user"
        exit 0
    fi
    
    if [ -n "$TARGET_VERSION" ]; then
        success "Update confirmed. Installing version: $TARGET_VERSION"
    else
        success "Update confirmed. Installing latest version"
    fi
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

# Setup environment configuration with proper credential preservation and database sync
setup_environment() {
    # Check if we're updating an existing installation
    local existing_db_password=""
    local existing_jwt_secret=""
    local existing_api_key=""
    local credentials_preserved=false
    
    # Check for existing frontend environment variables
    local existing_frontend_env=""
    local preserve_frontend_env=false
    local frontend_env_file=""
    
    # Determine which frontend env file to check (prioritize .env.production, then .env.local, then .env)
    if [ -f "/opt/profolio/frontend/.env.production" ]; then
        frontend_env_file="/opt/profolio/frontend/.env.production"
    elif [ -f "/opt/profolio/frontend/.env.local" ]; then
        frontend_env_file="/opt/profolio/frontend/.env.local"
    elif [ -f "/opt/profolio/frontend/.env" ]; then
        frontend_env_file="/opt/profolio/frontend/.env"
    fi
    
    # Check for existing Firebase and other frontend environment variables
    if [ -n "$frontend_env_file" ] && [ -f "$frontend_env_file" ]; then
        local has_firebase_config=false
        local has_auth_mode=false
        local has_api_url=false
        
        # Check for Firebase configuration
        if grep -q "NEXT_PUBLIC_FIREBASE_" "$frontend_env_file"; then
            has_firebase_config=true
        fi
        
        # Check for auth mode
        if grep -q "NEXT_PUBLIC_AUTH_MODE=" "$frontend_env_file"; then
            has_auth_mode=true
        fi
        
        # Check for API URL
        if grep -q "NEXT_PUBLIC_API_URL=" "$frontend_env_file"; then
            has_api_url=true
        fi
        
        # If we have any existing environment configuration, ask user
        if [ "$has_firebase_config" = true ] || [ "$has_auth_mode" = true ] || [ "$has_api_url" = true ]; then
            echo ""
            info "Existing frontend environment configuration detected in: $frontend_env_file"
            
            if [ "$has_firebase_config" = true ]; then
                echo -e "   ${GREEN}✅ Firebase configuration found${NC}"
            fi
            if [ "$has_auth_mode" = true ]; then
                echo -e "   ${GREEN}✅ Authentication mode configured${NC}"
            fi
            if [ "$has_api_url" = true ]; then
                echo -e "   ${GREEN}✅ API URL configured${NC}"
            fi
            
            echo ""
            echo -e "${YELLOW}🤔 Would you like to preserve your existing frontend environment configuration?${NC}"
            echo -e "   ${WHITE}This includes Firebase credentials, authentication mode, and API settings.${NC}"
            echo -e "   ${GREEN}Recommended: Keep existing configuration (press Enter)${NC}"
            echo ""
            
            if [ "$AUTO_INSTALL" = true ]; then
                echo -e "${CYAN}Auto-install mode: Preserving existing environment configuration${NC}"
                preserve_frontend_env=true
            else
                read -p "Preserve existing environment configuration? [Y/n]: " -r preserve_env_choice
                preserve_env_choice=${preserve_env_choice:-Y}  # Default to Y if empty
                
                case "$preserve_env_choice" in
                    [Yy]*|"")
                        preserve_frontend_env=true
                        success "Will preserve existing frontend environment configuration"
                        ;;
                    [Nn]*)
                        preserve_frontend_env=false
                        warn "Will reset frontend environment configuration to defaults"
                        ;;
                    *)
                        info "Invalid choice, defaulting to preserve existing configuration"
                        preserve_frontend_env=true
                        ;;
                esac
            fi
            
            if [ "$preserve_frontend_env" = true ]; then
                # Read existing environment variables
                existing_frontend_env=$(cat "$frontend_env_file")
                info "Preserving existing frontend environment configuration"
            fi
        fi
    fi
    
    # Try to preserve existing credentials during updates/repairs
    if [ -f "/opt/profolio/backend/.env" ]; then
        info "Checking for existing credentials..."
        existing_db_password=$(grep "^DATABASE_URL=" /opt/profolio/backend/.env | sed 's/.*:\/\/profolio:\([^@]*\)@.*/\1/' 2>/dev/null || echo "")
        existing_jwt_secret=$(grep "^JWT_SECRET=" /opt/profolio/backend/.env | cut -d'=' -f2 | tr -d '"' 2>/dev/null || echo "")
        existing_api_key=$(grep "^API_ENCRYPTION_KEY=" /opt/profolio/backend/.env | cut -d'=' -f2 | tr -d '"' 2>/dev/null || echo "")
        
        if [ -n "$existing_db_password" ] && [ -n "$existing_jwt_secret" ] && [ -n "$existing_api_key" ]; then
            credentials_preserved=true
        fi
    fi
    
    # Use existing credentials if available, otherwise generate new ones
    local db_password
    local jwt_secret
    local api_key
    
    if [ "$credentials_preserved" = true ]; then
        db_password="$existing_db_password"
        jwt_secret="$existing_jwt_secret"
        api_key="$existing_api_key"
        info "Preserving existing credentials"
        
        # FIXED: Test if profolio user can actually authenticate with the preserved password
        info "Testing preserved database credentials..."
        if PGPASSWORD="$db_password" psql -h localhost -U profolio -d profolio -c "SELECT 1;" >/dev/null 2>&1; then
            success "Existing database credentials are valid"
        else
            warn "Existing database credentials are invalid, updating PostgreSQL password..."
            # Update PostgreSQL password to match .env
            if sudo -u postgres psql -c "ALTER USER profolio WITH PASSWORD '$db_password';" 2>/dev/null; then
                success "Database password synchronized with existing credentials"
                # Test again after sync
                if PGPASSWORD="$db_password" psql -h localhost -U profolio -d profolio -c "SELECT 1;" >/dev/null 2>&1; then
                    success "Database credentials now working"
                else
                    error "Failed to synchronize database credentials - will regenerate"
                    credentials_preserved=false
                fi
            else
                error "Failed to synchronize database password - will regenerate"
                credentials_preserved=false
            fi
        fi
    fi
    
    # Generate new credentials if preservation failed or not available
    if [ "$credentials_preserved" = false ]; then
        db_password="${DB_PASSWORD:-$(openssl rand -base64 12)}"
        jwt_secret="$(openssl rand -base64 32)"
        api_key="$(openssl rand -base64 32)"
        info "Generating new credentials"
        
        # Create/update PostgreSQL user with new password
        info "Creating/updating database user with new password..."
        if sudo -u postgres psql -c "DROP USER IF EXISTS profolio; CREATE USER profolio WITH PASSWORD '$db_password';" 2>/dev/null; then
            success "Database user created with new password"
        elif sudo -u postgres psql -c "ALTER USER profolio WITH PASSWORD '$db_password';" 2>/dev/null; then
            success "Database user password updated"
        else
            error "Failed to create/update database user password"
            return 1
        fi
        
        # Ensure database exists and grant permissions
        sudo -u postgres psql -c "CREATE DATABASE profolio OWNER profolio;" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;" 2>/dev/null || true
        
        # Test new credentials work
        info "Testing new database credentials..."
        if PGPASSWORD="$db_password" psql -h localhost -U profolio -d profolio -c "SELECT 1;" >/dev/null 2>&1; then
            success "New database credentials verified"
        else
            error "New database credentials failed verification"
            return 1
        fi
    fi
    
    # Update global DB_PASSWORD variable for consistency
    DB_PASSWORD="$db_password"
    
    info "Setting up environment configuration..."
    
    # Create backend .env
    cat > /opt/profolio/backend/.env << EOF
DATABASE_URL="postgresql://profolio:${db_password}@localhost:5432/profolio"
JWT_SECRET="${jwt_secret}"
API_ENCRYPTION_KEY="${api_key}"
PORT=3001
NODE_ENV=production
EOF

    # Create frontend environment configuration
    if [ "$preserve_frontend_env" = true ] && [ -n "$existing_frontend_env" ]; then
        # Preserve existing frontend environment configuration
        info "Preserving existing frontend environment configuration"
        
        # Use the same file that we detected (preserve the original filename)
        local target_frontend_env="$frontend_env_file"
        
        # Write preserved configuration to the same file
        echo "$existing_frontend_env" > "$target_frontend_env"
        
        # Ensure API URL is updated to current server if it's using old localhost
        local current_ip=$(hostname -I | awk '{print $1}')
        if grep -q "NEXT_PUBLIC_API_URL=http://localhost:3001" "$target_frontend_env"; then
            sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:3001|NEXT_PUBLIC_API_URL=http://$current_ip:3001|g" "$target_frontend_env"
            info "Updated API URL to current server IP: $current_ip"
        fi
        
        success "Frontend environment configuration preserved in $target_frontend_env"
    else
        # Create new frontend .env configuration
        info "Creating new frontend environment configuration"
        local current_ip=$(hostname -I | awk '{print $1}')
        
        # For new configurations, prefer .env.production for production environments
        cat > /opt/profolio/frontend/.env.production << EOF
# Authentication mode
NEXT_PUBLIC_AUTH_MODE=local

# Backend API URL (your server's URL)
NEXT_PUBLIC_API_URL=http://$current_ip:3001

# Node environment
NODE_ENV=production

# Firebase configuration (add your Firebase project details here)
# Uncomment and configure these lines if using Firebase authentication:
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
# NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
EOF
        
        success "Created new frontend environment configuration with local authentication"
        info "To use Firebase authentication, edit /opt/profolio/frontend/.env.production with your Firebase project details"
    fi

    # Set proper permissions
    chown profolio:profolio /opt/profolio/backend/.env 2>/dev/null || true
    # Handle permissions for different possible frontend env files
    chown profolio:profolio /opt/profolio/frontend/.env.production 2>/dev/null || true
    chown profolio:profolio /opt/profolio/frontend/.env.local 2>/dev/null || true
    chown profolio:profolio /opt/profolio/frontend/.env 2>/dev/null || true
    chmod 600 /opt/profolio/backend/.env
    chmod 600 /opt/profolio/frontend/.env.production 2>/dev/null || true
    chmod 600 /opt/profolio/frontend/.env.local 2>/dev/null || true
    chmod 600 /opt/profolio/frontend/.env 2>/dev/null || true
    
    if [ "$credentials_preserved" = true ]; then
        success "Preserved existing database credentials"
    else
        success "Generated new database credentials"
        info "Database password: $db_password"
    fi
    
    if [ "$preserve_frontend_env" = true ]; then
        success "Preserved existing frontend environment configuration"
    else
        success "Created new frontend environment configuration"
    fi
}

# Show access information - removed hardcoded banner (handled by show_completion_status)
show_access_info() {
    local_ip=$(hostname -I | awk '{print $1}')
    
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

# Show completion status with proper operation type and status checking
show_completion_status() {
    local operation_name="$1"
    local operation_success="$2"
    
    echo ""
    if [ "$operation_success" = true ]; then
        echo -e "${GREEN}"
        echo "╔══════════════════════════════════════════════════════════════╗"
        
        # Dynamic centering based on operation name
        case "$operation_name" in
            "INSTALLATION")
                echo "║                  🎉 INSTALLATION COMPLETE                    ║"
                ;;
            "UPDATE")
                echo "║                     🎉 UPDATE COMPLETE                       ║"
                ;;
            "REPAIR")
                echo "║                     🎉 REPAIR COMPLETE                       ║"
                ;;
            *)
                echo "║                   🎉 OPERATION COMPLETE                      ║"
                ;;
        esac
        
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        show_access_info
    else
        echo -e "${RED}"
        echo "╔══════════════════════════════════════════════════════════════╗"
        
        # Dynamic centering based on operation name
        case "$operation_name" in
            "INSTALLATION")
                echo "║                   ❌ INSTALLATION FAILED                     ║"
                ;;
            "UPDATE")
                echo "║                      ❌ UPDATE FAILED                        ║"
                ;;
            "REPAIR")
                echo "║                      ❌ REPAIR FAILED                        ║"
                ;;
            *)
                echo "║                    ❌ OPERATION FAILED                       ║"
                ;;
        esac
        
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        error "Operation failed. Check the logs above for details."
        echo ""
        echo -e "${CYAN}Troubleshooting commands:${NC}"
        echo -e "   ${WHITE}Check service status:${NC} systemctl status profolio-backend profolio-frontend"
        echo -e "   ${WHITE}View logs:${NC} journalctl -u profolio-backend -u profolio-frontend -f"
        echo -e "   ${WHITE}Try manual restart:${NC} systemctl restart profolio-backend profolio-frontend"
    fi
}

# Main execution logic with improved terminology
main() {
    show_banner
    check_root
    
    # Enhanced command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --auto|--unattended)
                AUTO_INSTALL=true
                shift
                ;;
            --version)
                TARGET_VERSION="$2"
                if [ -z "$TARGET_VERSION" ]; then
                    error "Version parameter requires a value"
                    echo "Usage: $0 --version v1.0.3"
                    exit 1
                fi
                shift 2
                ;;
            --force-version)
                TARGET_VERSION="$2"
                FORCE_VERSION=true
                if [ -z "$TARGET_VERSION" ]; then
                    error "Force version parameter requires a value"
                    echo "Usage: $0 --force-version v1.0.2"
                    exit 1
                fi
                shift 2
                ;;
            --no-rollback)
                ROLLBACK_ENABLED=false
                shift
                ;;
            --list-versions)
                echo -e "${CYAN}🚀 Profolio Available Versions${NC}"
                echo ""
                get_available_versions
                exit 0
                ;;
            --rollback)
                if [ ! -d "/opt/profolio" ]; then
                    error "No Profolio installation found to rollback"
                    exit 1
                fi
                echo -e "${YELLOW}⚠️  Manual rollback requested${NC}"
                echo ""
                if execute_rollback; then
                    exit 0
                else
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Version validation if specified
    if [ -n "$TARGET_VERSION" ]; then
        info "Target version specified: $TARGET_VERSION"
        
        if ! validate_version "$TARGET_VERSION"; then
            error "Invalid version format: $TARGET_VERSION"
            echo "Valid formats: v1.0.3, 1.0.3, main, latest"
            exit 1
        fi
        
        if [ "$FORCE_VERSION" = false ]; then
            if ! version_exists "$TARGET_VERSION"; then
                error "Version $TARGET_VERSION does not exist"
                echo ""
                get_available_versions
                exit 1
            fi
        else
            warn "Force version enabled - skipping version existence check"
        fi
        
        success "Version $TARGET_VERSION validated"
    fi
    
    info "Detecting application state..."
    detect_installation_state
    local install_state=$?
    
    case $install_state in
        0)
            info "Application action: First install"
            if [ "$AUTO_INSTALL" = false ]; then
                run_configuration_wizard
            else
                use_defaults
            fi
            fresh_install
            ;;
        1)
            info "Application action: Repair (installed but not running)"
            repair_installation
            ;;
        2)
            info "Application action: Update (running installation detected)"
            run_update_wizard
            update_installation
            ;;
        *)
            error "Unknown application state: $install_state"
            exit 1
            ;;
    esac
}

# Show enhanced help
show_help() {
    echo -e "${CYAN}🚀 Profolio Installer/Updater v2.0${NC}"
    echo ""
    echo -e "${WHITE}USAGE:${NC}"
    echo "  $0 [OPTIONS]"
    echo ""
    echo -e "${WHITE}OPTIONS:${NC}"
    echo -e "  ${GREEN}--auto, --unattended${NC}     Run with default configuration"
    echo -e "  ${GREEN}--version VERSION${NC}        Install/update to specific version"
    echo -e "  ${GREEN}--force-version VERSION${NC}  Force version (skip existence check)"
    echo -e "  ${GREEN}--no-rollback${NC}            Disable automatic rollback on failure"
    echo -e "  ${GREEN}--list-versions${NC}          Show available versions and exit"
    echo -e "  ${GREEN}--rollback${NC}               Execute manual rollback to previous version"
    echo -e "  ${GREEN}--help, -h${NC}               Show this help message"
    echo ""
    echo -e "${WHITE}VERSION FORMATS:${NC}"
    echo -e "  ${YELLOW}v1.0.3${NC}                   Install specific release version"
    echo -e "  ${YELLOW}1.0.3${NC}                    Install specific release version (without 'v')"
    echo -e "  ${YELLOW}main${NC}                     Install latest development version"
    echo -e "  ${YELLOW}latest${NC}                   Install latest stable release"
    echo ""
    echo -e "${WHITE}EXAMPLES:${NC}"
    echo -e "  ${CYAN}$0${NC}                        Interactive installation"
    echo -e "  ${CYAN}$0 --auto${NC}                 Quick installation with defaults"
    echo -e "  ${CYAN}$0 --version v1.0.3${NC}       Install specific version"
    echo -e "  ${CYAN}$0 --version main${NC}         Install latest development"
    echo -e "  ${CYAN}$0 --list-versions${NC}        Show available versions"
    echo -e "  ${CYAN}$0 --rollback${NC}             Rollback to previous version"
    echo ""
    echo -e "${WHITE}ROLLBACK FEATURES:${NC}"
    echo -e "  • ${GREEN}Automatic rollback${NC} on failed updates"
    echo -e "  • ${GREEN}Git-based restoration${NC} with backup fallback"
    echo -e "  • ${GREEN}Service state preservation${NC}"
    echo -e "  • ${GREEN}Manual rollback${NC} command available"
    echo ""
    echo -e "${WHITE}SAFETY FEATURES:${NC}"
    echo -e "  • ${GREEN}Pre-update backups${NC} created automatically"
    echo -e "  • ${GREEN}Version validation${NC} before installation"
    echo -e "  • ${GREEN}Service verification${NC} after updates"
    echo -e "  • ${GREEN}Credential preservation${NC} during updates"
    echo ""
}

# Improved update installation with proper completion tracking
update_installation() {
    OPERATION_TYPE="UPDATE"
    info "Starting update process"
    
    # Create rollback point before making any changes
    create_rollback_point
    
    # Create backup
    info "Creating system backup..."
    manage_backups "update"
    success "Backup created"
    
    # Stop services properly
    info "Stopping services for update..."
    systemctl stop profolio-frontend profolio-backend 2>/dev/null || true
    systemctl reset-failed profolio-frontend profolio-backend 2>/dev/null || true
    success "Services stopped"
    
    # Update code with version control
    info "Downloading updates..."
    cd /opt/profolio
    
    # Stash any local changes
    if ! sudo -u profolio git stash push -m "Auto-stash before update $(date)"; then
        error "Failed to stash local changes"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Checkout specific version or pull latest
    if [ -n "$TARGET_VERSION" ]; then
        if ! checkout_version "$TARGET_VERSION"; then
            error "Failed to checkout version $TARGET_VERSION"
            if [ "$ROLLBACK_ENABLED" = true ]; then
                execute_rollback
            fi
            OPERATION_SUCCESS=false
            show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
            return 1
        fi
    else
        # Fetch latest changes first
        if ! sudo -u profolio git fetch origin main; then
            error "Failed to fetch updates"
            if [ "$ROLLBACK_ENABLED" = true ]; then
                execute_rollback
            fi
            OPERATION_SUCCESS=false
            show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
            return 1
        fi
        
        # Reset to exactly match remote (handles divergent branches)
        if ! sudo -u profolio git reset --hard origin/main; then
            error "Failed to update code"
            if [ "$ROLLBACK_ENABLED" = true ]; then
                execute_rollback
            fi
            OPERATION_SUCCESS=false
            show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
            return 1
        fi
    fi
    
    success "Code updated successfully"
    
    # Setup environment (preserving existing credentials)
    if ! setup_environment; then
        error "Failed to setup environment"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Rebuild application
    if ! build_application; then
        error "Failed to build application"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Update service configurations
    local service_steps=(
        "Updating service configurations" "install_systemd_services"
        "Reloading systemd daemon" "systemctl daemon-reload"
        "Enabling services for auto-start" "systemctl enable profolio-backend profolio-frontend"
    )
    
    if ! execute_steps "Service Update" "${service_steps[@]}"; then
        error "Failed to update services"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Verify update - this sets OPERATION_SUCCESS
    if ! verify_installation; then
        error "Update verification failed"
        if [ "$ROLLBACK_ENABLED" = true ]; then
            execute_rollback
        fi
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # If we got here, the update was successful
    OPERATION_SUCCESS=true
    
    # Clean up rollback files on successful update
    cleanup_rollback_files
    
    # Show current version info
    if [ -f "/opt/profolio/package.json" ]; then
        local current_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
        success "Successfully updated to version: $current_version"
    fi
    
    show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
}

# Repair installation with proper completion tracking and missing build step
repair_installation() {
    OPERATION_TYPE="REPAIR"
    info "Starting repair process"
    
    # Stop any running services first
    info "Stopping any running services..."
    systemctl stop profolio-frontend profolio-backend 2>/dev/null || true
    systemctl reset-failed profolio-frontend profolio-backend 2>/dev/null || true
    
    # Configuration update (preserving existing credentials)
    cd /opt/profolio
    setup_environment
    
    # CRITICAL FIX: Add missing build step for repairs
    info "Rebuilding application components..."
    if ! build_application; then
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Service management
    local service_steps=(
        "Reinstalling systemd services" "install_systemd_services"
        "Reloading systemd daemon" "systemctl daemon-reload"
        "Enabling services for auto-start" "systemctl enable profolio-backend profolio-frontend"
    )
    
    if ! execute_steps "Service Configuration" "${service_steps[@]}"; then
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Final verification - this sets OPERATION_SUCCESS
    verify_installation
    show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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

# Enhanced verification with proper error handling and detailed diagnostics
verify_installation() {
    info "Verifying installation..."
    
    # Give services time to fully start
    info "Waiting for services to fully initialize..."
    sleep 5
    
    local verification_success=true
    local backend_running=false
    local frontend_running=false
    
    # Check service status with detailed diagnostics
    printf "${BLUE}[1/4]${NC} Checking backend service status"
    
    if systemctl is-active --quiet profolio-backend; then
        printf "\r${BLUE}[1/4]${NC} Checking backend service status ${GREEN}✓${NC}\n"
        backend_running=true
    else
        printf "\r${BLUE}[1/4]${NC} Checking backend service status ${RED}✗${NC}\n"
        error "Backend service is not running"
        info "Backend service status:"
        systemctl status profolio-backend --no-pager -l
        info "Recent backend logs:"
        journalctl -u profolio-backend -n 20 --no-pager
        verification_success=false
    fi
    
    # Check frontend service
    printf "${BLUE}[2/4]${NC} Checking frontend service status"
    
    if systemctl is-active --quiet profolio-frontend; then
        printf "\r${BLUE}[2/4]${NC} Checking frontend service status ${GREEN}✓${NC}\n"
        frontend_running=true
    else
        printf "\r${BLUE}[2/4]${NC} Checking frontend service status ${RED}✗${NC}\n"
        error "Frontend service is not running"
        info "Frontend service status:"
        systemctl status profolio-frontend --no-pager -l
        info "Recent frontend logs:"
        journalctl -u profolio-frontend -n 15 --no-pager
        verification_success=false
    fi
    
    # Test backend API connectivity (only if backend service is running)
    if [ "$backend_running" = true ]; then
        printf "${BLUE}[3/4]${NC} Testing backend API connectivity"
        local max_attempts=30
        local attempt=1
        local api_success=false
        
        while [ $attempt -le $max_attempts ]; do
            printf "\r${BLUE}[3/4]${NC} Testing backend API connectivity (attempt $attempt/$max_attempts)"
            
            if curl -s --connect-timeout 5 --max-time 10 http://localhost:3001/api/health >/dev/null 2>&1; then
                printf "\r${BLUE}[3/4]${NC} Testing backend API connectivity ${GREEN}✓${NC}\n"
                api_success=true
                break
            fi
            
            sleep 2
            ((attempt++))
        done
        
        if [ "$api_success" = false ]; then
            printf "\r${BLUE}[3/4]${NC} Testing backend API connectivity ${RED}✗${NC}\n"
            error "Backend API not responding after $max_attempts attempts"
            info "Common causes: database connection issues, missing dependencies, port conflicts"
            verification_success=false
        fi
    else
        printf "${BLUE}[3/4]${NC} Testing backend API connectivity ${RED}SKIPPED${NC} (service not running)\n"
        verification_success=false
    fi
    
    # Test frontend connectivity (only if both backend and frontend services are running)
    if [ "$backend_running" = true ] && [ "$frontend_running" = true ]; then
        printf "${BLUE}[4/4]${NC} Testing frontend connectivity"
        if curl -s --connect-timeout 5 --max-time 10 http://localhost:3000 >/dev/null 2>&1; then
            printf "\r${BLUE}[4/4]${NC} Testing frontend connectivity ${GREEN}✓${NC}\n"
        else
            printf "\r${BLUE}[4/4]${NC} Testing frontend connectivity ${YELLOW}⚠${NC}\n"
            warn "Frontend not responding yet - may still be building/starting"
            # Frontend connectivity issues are less critical, don't fail verification
        fi
    else
        printf "${BLUE}[4/4]${NC} Testing frontend connectivity ${RED}SKIPPED${NC} (dependencies not running)\n"
        verification_success=false
    fi
    
    # Set global success status
    OPERATION_SUCCESS="$verification_success"
    
    if [ "$verification_success" = true ]; then
        success "Installation verification completed successfully"
    else
        error "Installation verification failed"
        echo ""
        echo -e "${CYAN}🔧 Quick diagnostics:${NC}"
        echo -e "   ${WHITE}Database status:${NC} $(systemctl is-active postgresql 2>/dev/null || echo 'inactive')"
        echo -e "   ${WHITE}Disk space:${NC} $(df -h /opt | tail -1 | awk '{print $4}') available"
        echo -e "   ${WHITE}Memory usage:${NC} $(free -h | grep '^Mem' | awk '{print $3"/"$2}')"
    fi
    
    return $([ "$verification_success" = true ] && echo 0 || echo 1)
}

# Simplified fresh install with proper completion tracking
fresh_install() {
    OPERATION_TYPE="INSTALLATION"
    success "Starting fresh installation"
    
    if [ "$AUTO_INSTALL" = false ]; then
        success "Configuration completed"
    else
        success "Using default configuration"
    fi
    
    # Show version info if specified
    if [ -n "$TARGET_VERSION" ]; then
        info "Installing Profolio version: $TARGET_VERSION"
    else
        info "Installing latest Profolio version"
    fi
    
    # System setup phase
    local system_steps=(
        "Creating profolio user" "useradd -r -s /bin/bash -d /home/profolio -m profolio 2>/dev/null || true"
        "Updating package lists" "apt update"
        "Installing system dependencies" "apt install -y git nodejs npm postgresql postgresql-contrib curl wget openssl openssh-server"
    )
    
    if ! execute_steps "System Setup" "${system_steps[@]}"; then
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Application download with version control
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
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Checkout specific version if requested
    if [ -n "$TARGET_VERSION" ]; then
        cd /opt/profolio
        if ! checkout_version "$TARGET_VERSION"; then
            error "Failed to checkout version $TARGET_VERSION"
            OPERATION_SUCCESS=false
            show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
            return 1
        fi
    fi
    
    # Environment setup (for fresh installs, will generate new credentials)
    cd /opt/profolio
    if ! setup_environment; then
        error "Failed to setup environment"
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Build application
    if ! build_application; then
        error "Failed to build application"
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Service installation with improved management
    local service_steps=(
        "Installing systemd services" "install_systemd_services"
        "Reloading systemd daemon" "systemctl daemon-reload"
        "Enabling services for auto-start" "systemctl enable profolio-backend profolio-frontend"
    )
    
    if ! execute_steps "Service Installation" "${service_steps[@]}"; then
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
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
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # Final verification - this sets OPERATION_SUCCESS
    if ! verify_installation; then
        error "Installation verification failed"
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    # If we got here, the installation was successful
    OPERATION_SUCCESS=true
    
    # Show installed version info
    if [ -f "/opt/profolio/package.json" ]; then
        local installed_version=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
        success "Successfully installed Profolio version: $installed_version"
    fi
    
    show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
}

# Run main function
main "$@" 