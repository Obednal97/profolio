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

# Track service downtime start
start_service_downtime() {
    SERVICE_DOWNTIME_START=$(date +%s)
}

# Track service downtime end
end_service_downtime() {
    if [ -n "$SERVICE_DOWNTIME_START" ]; then
        SERVICE_DOWNTIME_END=$(date +%s)
    fi
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
        setup_environment true  # Pass true to indicate rollback mode (prevents re-prompting)
        
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
            # Optimize installation size by removing non-essential directories (version checkout)
            info "Optimizing installation size..."
            rm -rf docs/ .github/ www/ policies/ scripts/ .cursor/ || true
            rm -f CONTRIBUTING.md SECURITY.md README.md .DS_Store || true
            success "Installation optimized (removed documentation and development files)"
            
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
DEFAULT_MEMORY="2048"
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

# Statistics tracking variables
OPERATION_START_TIME=""
OPERATION_END_TIME=""
SERVICE_DOWNTIME_START=""
SERVICE_DOWNTIME_END=""
PREVIOUS_VERSION=""
NEW_VERSION=""
FILES_CHANGED_COUNT=""
DISK_SPACE_BEFORE=""
DISK_SPACE_AFTER=""
MEMORY_USAGE_PEAK=""
DATABASE_MIGRATIONS_COUNT=""
BACKUP_SIZE=""
DOWNLOAD_SIZE=""
APP_SIZE=""

# UX Flow Variables (set by wizard)
USER_ACTION_CHOICE=""
SKIP_ENV_PRESERVATION=false

# Proxmox Container Management
# =========================

# Proxmox LXC container configuration
PROXMOX_VMID=""
PROXMOX_TEMPLATE="ubuntu-24.04-standard_24.04-2_amd64.tar.zst"
PROXMOX_STORAGE="local-lvm"
PROXMOX_MEMORY="4096"
PROXMOX_SWAP="512"
PROXMOX_DISK="20"
PROXMOX_CORES="2"
PROXMOX_NETWORK_BRIDGE="vmbr0"
PROXMOX_NETWORK_MODE="dhcp"
PROXMOX_PASSWORD=""
CONTAINER_NAME="profolio"

# Detect if we're running on Proxmox host
detect_proxmox_host() {
    if [ -f "/etc/pve/local/pve-ssl.pem" ] && command -v pct >/dev/null 2>&1; then
        return 0  # Running on Proxmox host
    else
        return 1  # Not on Proxmox host
    fi
}

# Check if we're inside an LXC container
detect_lxc_container() {
    if [ -f "/.dockerenv" ]; then
        return 1  # Docker container, not LXC
    elif [ -f "/proc/1/environ" ] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        return 0  # Inside LXC container
    elif [ -d "/proc/vz" ] && [ ! -d "/proc/bc" ]; then
        return 0  # OpenVZ/LXC container
    else
        return 1  # Not in container
    fi
}

# Get next available VMID
get_next_vmid() {
    local vmid=100
    while pct status $vmid >/dev/null 2>&1 || qm status $vmid >/dev/null 2>&1; do
        vmid=$((vmid + 1))
    done
    echo $vmid
}

# Proxmox container creation wizard
proxmox_container_wizard() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║          🏗️  PROXMOX CONTAINER CREATION WIZARD               ║"
    echo "║             Optimal LXC Container for Profolio              ║"
    echo "╚══════════════════════════════════════════════════════════════╗"
    echo -e "${NC}"
    echo ""
    
    # Get next available VMID
    local suggested_vmid=$(get_next_vmid)
    echo -e "${CYAN}📋 Container Configuration:${NC}"
    
    read -p "Container ID [$suggested_vmid]: " input_vmid
    PROXMOX_VMID=${input_vmid:-$suggested_vmid}
    
    read -p "Container Name [$CONTAINER_NAME]: " input_name
    CONTAINER_NAME=${input_name:-$CONTAINER_NAME}
    
    # Storage selection
    echo ""
    echo -e "${CYAN}💾 Available Storage:${NC}"
    pvesm status | grep -E "^[[:space:]]*[^[:space:]]+[[:space:]]+[^[:space:]]+[[:space:]]+active" | awk '{print "   • " $1 " (" $2 ")"}'
    echo ""
    read -p "Storage [$PROXMOX_STORAGE]: " input_storage
    PROXMOX_STORAGE=${input_storage:-$PROXMOX_STORAGE}
    
    # Hardware configuration
    echo ""
    echo -e "${CYAN}⚙️ Hardware Configuration:${NC}"
    echo -e "${YELLOW}Recommended specs for Profolio:${NC}"
    echo -e "   ${GREEN}Memory:${NC} 4GB (minimum 2GB)"
    echo -e "   ${GREEN}CPU Cores:${NC} 2 (minimum 1)"
    echo -e "   ${GREEN}Disk:${NC} 20GB (minimum 15GB)"
    echo ""
    
    read -p "Memory in MB [$PROXMOX_MEMORY]: " input_memory
    PROXMOX_MEMORY=${input_memory:-$PROXMOX_MEMORY}
    
    read -p "CPU Cores [$PROXMOX_CORES]: " input_cores
    PROXMOX_CORES=${input_cores:-$PROXMOX_CORES}
    
    read -p "Disk Size in GB [$PROXMOX_DISK]: " input_disk
    PROXMOX_DISK=${input_disk:-$PROXMOX_DISK}
    
    # Network configuration
    echo ""
    echo -e "${CYAN}🌐 Network Configuration:${NC}"
    echo -e "${YELLOW}Available bridges:${NC}"
    ip link show | grep -E "^[0-9]+: vmbr[0-9]+" | awk -F': ' '{print "   • " $2}' | cut -d'@' -f1
    echo ""
    
    read -p "Network Bridge [$PROXMOX_NETWORK_BRIDGE]: " input_bridge
    PROXMOX_NETWORK_BRIDGE=${input_bridge:-$PROXMOX_NETWORK_BRIDGE}
    
    echo -e "${YELLOW}Network Mode:${NC}"
    echo -e "   ${GREEN}1)${NC} DHCP (automatic IP assignment)"
    echo -e "   ${BLUE}2)${NC} Static IP"
    echo ""
    read -p "Select network mode [1]: " network_choice
    
    if [ "$network_choice" = "2" ]; then
        read -p "Static IP (e.g., 192.168.1.100/24): " static_ip
        read -p "Gateway (e.g., 192.168.1.1): " gateway
        PROXMOX_NETWORK_MODE="ip=$static_ip,gw=$gateway"
    else
        PROXMOX_NETWORK_MODE="dhcp"
    fi
    
    # Security
    echo ""
    echo -e "${CYAN}🔐 Security Configuration:${NC}"
    echo -e "${YELLOW}Set root password for container:${NC}"
    while true; do
        read -s -p "Root password: " password1
        echo ""
        read -s -p "Confirm password: " password2
        echo ""
        if [ "$password1" = "$password2" ]; then
            PROXMOX_PASSWORD="$password1"
            break
        else
            echo -e "${RED}Passwords don't match. Please try again.${NC}"
        fi
    done
    
    # Template selection
    echo ""
    echo -e "${CYAN}📦 OS Template:${NC}"
    echo -e "${GREEN}Using:${NC} Ubuntu 24.04 LTS (recommended for Profolio)"
    
    # Summary
    echo ""
    echo -e "${WHITE}📋 CONTAINER SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo -e "${BLUE}Container ID:${NC} $PROXMOX_VMID"
    echo -e "${BLUE}Name:${NC} $CONTAINER_NAME"
    echo -e "${BLUE}Template:${NC} Ubuntu 24.04 LTS"
    echo -e "${BLUE}Memory:${NC} ${PROXMOX_MEMORY}MB"
    echo -e "${BLUE}CPU Cores:${NC} $PROXMOX_CORES"
    echo -e "${BLUE}Disk:${NC} ${PROXMOX_DISK}GB"
    echo -e "${BLUE}Storage:${NC} $PROXMOX_STORAGE"
    echo -e "${BLUE}Network:${NC} $PROXMOX_NETWORK_BRIDGE ($PROXMOX_NETWORK_MODE)"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    echo ""
    
    read -p "Create container with these settings? (y/n) [y]: " confirm
    if [[ ! "$confirm" =~ ^[Yy]?$ ]]; then
        echo -e "${YELLOW}⚠️  Container creation cancelled${NC}"
        exit 0
    fi
}

# Create Proxmox LXC container
create_proxmox_container() {
    echo -e "${BLUE}🏗️  Creating Proxmox LXC container...${NC}"
    
    # Check if template exists
    local template_path="/var/lib/vz/template/cache/$PROXMOX_TEMPLATE"
    if [ ! -f "$template_path" ]; then
        echo -e "${YELLOW}📥 Downloading Ubuntu 24.04 template...${NC}"
        pveam update
        pveam download local $PROXMOX_TEMPLATE
    fi
    
    # Create container
    local create_cmd="pct create $PROXMOX_VMID $template_path"
    create_cmd="$create_cmd --hostname $CONTAINER_NAME"
    create_cmd="$create_cmd --memory $PROXMOX_MEMORY"
    create_cmd="$create_cmd --swap $PROXMOX_SWAP"
    create_cmd="$create_cmd --cores $PROXMOX_CORES"
    create_cmd="$create_cmd --rootfs $PROXMOX_STORAGE:$PROXMOX_DISK"
    create_cmd="$create_cmd --net0 name=eth0,bridge=$PROXMOX_NETWORK_BRIDGE,$PROXMOX_NETWORK_MODE"
    create_cmd="$create_cmd --features nesting=1"
    create_cmd="$create_cmd --unprivileged 1"
    create_cmd="$create_cmd --onboot 1"
    create_cmd="$create_cmd --startup order=1"
    
    info "Creating container with command:"
    info "$create_cmd"
    
    if eval "$create_cmd"; then
        success "Container $PROXMOX_VMID created successfully"
    else
        error "Failed to create container"
        exit 1
    fi
    
    # Set root password
    echo -e "${BLUE}🔐 Setting container password...${NC}"
    echo "root:$PROXMOX_PASSWORD" | pct exec $PROXMOX_VMID -- chpasswd
    
    # Start container
    echo -e "${BLUE}▶️  Starting container...${NC}"
    if pct start $PROXMOX_VMID; then
        success "Container started successfully"
    else
        error "Failed to start container"
        exit 1
    fi
    
    # Wait for container to be ready
    echo -e "${BLUE}⏳ Waiting for container to be ready...${NC}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pct exec $PROXMOX_VMID -- test -f /bin/bash; then
            success "Container is ready"
            break
        fi
        sleep 2
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Container failed to become ready"
        exit 1
    fi
    
    # Get container IP
    echo -e "${BLUE}🌐 Getting container IP address...${NC}"
    sleep 5  # Give network time to configure
    
    local container_ip=""
    for i in {1..10}; do
        container_ip=$(pct exec $PROXMOX_VMID -- hostname -I | awk '{print $1}')
        if [ -n "$container_ip" ] && [ "$container_ip" != "127.0.0.1" ]; then
            break
        fi
        sleep 2
    done
    
    if [ -n "$container_ip" ]; then
        success "Container IP: $container_ip"
        echo ""
        echo -e "${GREEN}✅ Container created successfully!${NC}"
        echo -e "${CYAN}📋 Container Details:${NC}"
        echo -e "   ${WHITE}Container ID:${NC} $PROXMOX_VMID"
        echo -e "   ${WHITE}Name:${NC} $CONTAINER_NAME"
        echo -e "   ${WHITE}IP Address:${NC} $container_ip"
        echo -e "   ${WHITE}Access:${NC} pct enter $PROXMOX_VMID"
        echo ""
        
        # Offer to continue with Profolio installation
        echo -e "${CYAN}🚀 Ready to install Profolio!${NC}"
        read -p "Continue with Profolio installation in this container? (y/n) [y]: " install_confirm
        if [[ "$install_confirm" =~ ^[Yy]?$ ]]; then
            echo -e "${BLUE}📦 Entering container to install Profolio...${NC}"
            echo ""
            
            # Download and execute installer in container
            pct exec $PROXMOX_VMID -- bash -c "
                apt update && apt install -y curl wget
                curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | bash
            "
        else
            echo -e "${YELLOW}ℹ️  Container ready. To install Profolio later:${NC}"
            echo -e "   ${WHITE}1.${NC} Enter container: ${CYAN}pct enter $PROXMOX_VMID${NC}"
            echo -e "   ${WHITE}2.${NC} Run installer: ${CYAN}curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | bash${NC}"
        fi
    else
        warn "Could not determine container IP address"
        echo -e "${YELLOW}ℹ️  Container created but IP not detected. Check with: pct list${NC}"
    fi
}

# Main Proxmox handling function
handle_proxmox_installation() {
    if detect_proxmox_host; then
        echo -e "${BLUE}🏠 Proxmox Host Detected${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  You're running this on a Proxmox host!${NC}"
        echo ""
        echo -e "${CYAN}Recommended approach:${NC}"
        echo -e "   ${GREEN}1.${NC} Create dedicated LXC container for Profolio"
        echo -e "   ${GREEN}2.${NC} Install Profolio inside the container"
        echo -e "   ${GREEN}3.${NC} Better isolation, resource management, and backups"
        echo ""
        echo -e "${CYAN}Your options:${NC}"
        echo -e "   ${WHITE}1)${NC} ${GREEN}Create LXC container${NC} (recommended)"
        echo -e "   ${WHITE}2)${NC} ${YELLOW}Install directly on host${NC} (not recommended)"
        echo -e "   ${WHITE}3)${NC} ${RED}Cancel installation${NC}"
        echo ""
        
        read -p "Select option [1]: " proxmox_choice
        proxmox_choice=${proxmox_choice:-1}
        
        case $proxmox_choice in
            1)
                proxmox_container_wizard
                create_proxmox_container
                exit 0  # Installation will continue inside container
                ;;
            2)
                warn "Installing directly on Proxmox host"
                echo "Continuing with host installation..."
                return 0  # Continue with normal installation
                ;;
            *)
                info "Installation cancelled"
                exit 0
                ;;
        esac
    elif detect_lxc_container; then
        info "Running inside LXC container - perfect for Profolio!"
        return 0  # Continue with normal installation
    else
        # Regular Linux system
        return 0  # Continue with normal installation
    fi
}

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

# Enhanced update wizard with improved UX flow - collect all preferences upfront
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
    
    # Get latest version
    info "Checking for updates..."
    latest_version=$(curl -s --connect-timeout 5 --max-time 10 "https://api.github.com/repos/Obednal97/profolio/releases/latest" | grep '"tag_name"' | cut -d'"' -f4 | sed 's/^v//' 2>/dev/null || echo "unknown")
    
    if [ "$latest_version" != "unknown" ]; then
        echo -e "${BLUE}Latest Stable Version:${NC} $latest_version"
    else
        echo -e "${BLUE}Latest Stable Version:${NC} Unable to check"
    fi
    echo ""
    
    # STEP 1: Choose Experience Level
    echo -e "${CYAN}🎛️ Choose Your Experience:${NC}"
    echo -e "  1) ${GREEN}Default Mode${NC} (recommended - quick update with sensible defaults)"
    echo -e "  2) ${BLUE}Advanced Mode${NC} (full control over all options)"
    echo ""
    read -p "Select mode [1]: " experience_mode
    experience_mode=${experience_mode:-1}
    
    # Initialize preferences with defaults
    local action_choice=""
    local version_choice=""
    local preserve_env="yes"
    local enable_rollback="yes"
    
    if [ "$experience_mode" = "1" ]; then
        # DEFAULT MODE - Set sensible defaults based on current state
        echo -e "${GREEN}📋 Default Mode Selected${NC}"
        echo ""
        
        if [ "$current_version" = "$latest_version" ]; then
            action_choice="rebuild"
            version_choice="$current_version"
            echo -e "${YELLOW}ℹ️  You have the latest stable version${NC}"
            echo -e "${CYAN}Default Action:${NC} Rebuild current version"
        else
            action_choice="update"
            version_choice="$latest_version"
            echo -e "${CYAN}Default Action:${NC} Update to latest stable version ($latest_version)"
        fi
        
        echo -e "${CYAN}Environment Preservation:${NC} Yes (Firebase credentials preserved)"
        echo -e "${CYAN}Rollback Protection:${NC} Yes (automatic rollback on failure)"
        echo ""
        
        read -p "Proceed with default settings? (y/n) [y]: " default_confirm
        if [[ ! "$default_confirm" =~ ^[Yy]?$ ]]; then
            info "Update cancelled by user"
            exit 0
        fi
        
    else
        # ADVANCED MODE - Collect all preferences
        echo -e "${BLUE}🔧 Advanced Mode Selected${NC}"
        echo ""
        
        # STEP 2: Choose Action
        echo -e "${CYAN}Choose Update Action:${NC}"
        
        # Check if services are running to offer repair option
        local services_running=false
        if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
            services_running=true
        fi
        
        if [ "$current_version" = "$latest_version" ]; then
            echo -e "  1) ${YELLOW}Rebuild current version${NC} (recommended - you have latest stable)"
            echo -e "  2) ${BLUE}Update to specific version${NC} (upgrade/downgrade)"
            echo -e "  3) ${PURPLE}Update to development version${NC} (main branch)"
            if [ "$services_running" = false ]; then
                echo -e "  4) ${CYAN}Repair installation${NC} (fix services and rebuild)"
            fi
            echo ""
            read -p "Select action [1]: " action_input
            action_input=${action_input:-1}
            
            case $action_input in
                1) action_choice="rebuild"; version_choice="$current_version" ;;
                2) action_choice="select" ;;
                3) action_choice="development"; version_choice="main" ;;
                4) if [ "$services_running" = false ]; then action_choice="repair"; version_choice="$current_version"; fi ;;
                *) action_choice="rebuild"; version_choice="$current_version" ;;
            esac
        else
            echo -e "  1) ${GREEN}Update to latest stable${NC} (recommended - $latest_version)"
            echo -e "  2) ${BLUE}Select specific version${NC} (upgrade/downgrade)"
            echo -e "  3) ${PURPLE}Update to development version${NC} (main branch)"
            echo -e "  4) ${YELLOW}Rebuild current version${NC} (keep $current_version)"
            if [ "$services_running" = false ]; then
                echo -e "  5) ${CYAN}Repair installation${NC} (fix services and rebuild)"
            fi
            echo ""
            read -p "Select action [1]: " action_input
            action_input=${action_input:-1}
            
            case $action_input in
                1) action_choice="update"; version_choice="$latest_version" ;;
                2) action_choice="select" ;;
                3) action_choice="development"; version_choice="main" ;;
                4) action_choice="rebuild"; version_choice="$current_version" ;;
                5) if [ "$services_running" = false ]; then action_choice="repair"; version_choice="$current_version"; fi ;;
                *) action_choice="update"; version_choice="$latest_version" ;;
            esac
        fi
        
        # STEP 3: Version Selection (if needed)
        if [ "$action_choice" = "select" ]; then
            echo ""
            echo -e "${CYAN}📋 Available Versions:${NC}"
            get_available_versions
            read -p "Enter version to install (e.g., v1.0.2, main): " version_input
            if [ -z "$version_input" ]; then
                error "No version specified"
                exit 1
            fi
            version_choice="$version_input"
        fi
        
        # STEP 4: Environment Preservation
        echo ""
        echo -e "${CYAN}Environment Configuration:${NC}"
        echo -e "  Do you want to preserve existing Firebase credentials and settings?"
        echo -e "  ${GREEN}Recommended: Yes${NC} (prevents authentication breaking)"
        echo ""
        read -p "Preserve environment configuration? (y/n) [y]: " preserve_input
        preserve_env=${preserve_input:-y}
        if [[ "$preserve_env" =~ ^[Yy] ]]; then
            preserve_env="yes"
        else
            preserve_env="no"
        fi
        
        # STEP 5: Rollback Protection
        echo ""
        echo -e "${CYAN}Rollback Protection:${NC}"
        echo -e "  Enable automatic rollback if update fails?"
        echo -e "  ${GREEN}Recommended: Yes${NC} (safer updates)"
        echo ""
        read -p "Enable rollback protection? (y/n) [y]: " rollback_input
        enable_rollback=${rollback_input:-y}
        if [[ "$enable_rollback" =~ ^[Yy] ]]; then
            enable_rollback="yes"
        else
            enable_rollback="no"
        fi
    fi
    
    # STEP 6: Show Summary and Confirm
    echo ""
    echo -e "${WHITE}📋 UPDATE SUMMARY${NC}"
    echo -e "${CYAN}════════════════════════════════════════${NC}"
    
    case "$action_choice" in
        "update") echo -e "${BLUE}Action:${NC} Update to latest stable version" ;;
        "rebuild") echo -e "${BLUE}Action:${NC} Rebuild current version" ;;
        "development") echo -e "${BLUE}Action:${NC} Update to development version" ;;
        "select") echo -e "${BLUE}Action:${NC} Install specific version" ;;
        "repair") echo -e "${BLUE}Action:${NC} Repair installation" ;;
    esac
    
    echo -e "${BLUE}Target Version:${NC} $version_choice"
    echo -e "${BLUE}Environment Preservation:${NC} $preserve_env"
    echo -e "${BLUE}Rollback Protection:${NC} $enable_rollback"
    echo ""
    
    echo -e "${CYAN}Update Process:${NC}"
    if [ "$enable_rollback" = "yes" ]; then
        echo "  1. 🛡️  Create rollback point (automatic)"
    fi
    echo "  2. 💾 Create backup"
    echo "  3. 🛑 Stop running services"
    echo "  4. 📥 Download version $version_choice"
    echo "  5. 🔨 Update dependencies and rebuild"
    echo "  6. 🚀 Restart services"
    echo "  7. ✅ Verify update success"
    echo ""
    
    # Final confirmation with options
    echo -e "${CYAN}What would you like to do?${NC}"
    echo -e "  1) ${GREEN}Proceed${NC} with update"
    echo -e "  2) ${YELLOW}Change${NC} settings"
    echo -e "  3) ${RED}Cancel${NC}"
    echo ""
    read -p "Select option [1]: " final_choice
    final_choice=${final_choice:-1}
    
    case $final_choice in
        1)
            # Set global variables for the update process
            TARGET_VERSION="$version_choice"
            if [ "$enable_rollback" = "no" ]; then
                ROLLBACK_ENABLED=false
            fi
            
            # Store environment preference for later use
            if [ "$preserve_env" = "no" ]; then
                SKIP_ENV_PRESERVATION=true
            else
                SKIP_ENV_PRESERVATION=false
            fi
            
            # Store action choice for main function
            USER_ACTION_CHOICE="$action_choice"
            
            success "Update confirmed. Installing version: $version_choice"
            ;;
        2)
            info "Restarting configuration..."
            run_update_wizard  # Recursive call to restart
            return
            ;;
        *)
            info "Update cancelled by user"
            exit 0
            ;;
    esac
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

# Build application with production optimizations and space efficiency
build_application() {
    # Clean up any existing build artifacts with permission issues
    info "Cleaning build directories..."
    rm -rf /opt/profolio/frontend/.next /opt/profolio/backend/dist 2>/dev/null || true
    
    # Ensure proper ownership of the entire project
    chown -R profolio:profolio /opt/profolio
    
    local steps=(
        "Installing backend dependencies (dev mode for build)" "cd /opt/profolio/backend && sudo -u profolio npm install"
        "Generating Prisma client" "cd /opt/profolio/backend && sudo -u profolio npx prisma generate"
        "Running database migrations" "cd /opt/profolio/backend && sudo -u profolio npx prisma migrate deploy"
        "Building NestJS backend" "cd /opt/profolio/backend && sudo -u profolio npx nest build"
        "Installing frontend dependencies (dev mode for build)" "cd /opt/profolio/frontend && sudo -u profolio npm install"
        "Building Next.js frontend" "cd /opt/profolio/frontend && sudo -u profolio npm run build"
        "Optimizing production dependencies" "optimize_production_dependencies"
        "Cleaning build artifacts and cache" "cleanup_build_artifacts"
    )
    
    execute_steps "Building Profolio Application (Production Optimized)" "${steps[@]}"
}

# Optimize dependencies for production deployment
optimize_production_dependencies() {
    info "Optimizing for production deployment..."
    
    # Backend: Clean install with production-only dependencies
    info "  → Backend: Installing production-only dependencies..."
    cd /opt/profolio/backend
    
    # Remove node_modules and reinstall production only
    sudo -u profolio rm -rf node_modules
    sudo -u profolio npm ci --production --silent
    
    # Frontend: Clean install with production-only dependencies  
    info "  → Frontend: Installing production-only dependencies..."
    cd /opt/profolio/frontend
    
    # Remove node_modules and reinstall production only
    sudo -u profolio rm -rf node_modules
    sudo -u profolio npm ci --production --silent
    
    success "Production dependencies optimized"
}

# Clean up build artifacts and unnecessary cache
cleanup_build_artifacts() {
    info "Cleaning up build artifacts and cache..."
    
    cd /opt/profolio
    
    # Frontend cleanup - remove Next.js cache and unnecessary build files
    info "  → Cleaning frontend build artifacts..."
    sudo -u profolio rm -rf frontend/.next/cache 2>/dev/null || true
    sudo -u profolio rm -rf frontend/.next/trace 2>/dev/null || true
    sudo -u profolio rm -rf frontend/.next/server/vendor-chunks 2>/dev/null || true
    sudo -u profolio rm -rf frontend/.next/static/chunks/*.map 2>/dev/null || true
    
    # Remove TypeScript build info files
    sudo -u profolio find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
    
    # Backend cleanup - remove unnecessary files
    info "  → Cleaning backend build artifacts..."
    sudo -u profolio rm -rf backend/node_modules/.cache 2>/dev/null || true
    sudo -u profolio rm -rf backend/dist/*.map 2>/dev/null || true
    
    # Remove package manager cache
    info "  → Cleaning package manager cache..."
    sudo -u profolio npm cache clean --force 2>/dev/null || true
    
    # Remove any remaining dev-only files
    info "  → Removing development files..."
    sudo -u profolio find . -name "*.test.js" -delete 2>/dev/null || true
    sudo -u profolio find . -name "*.spec.js" -delete 2>/dev/null || true
    sudo -u profolio find . -name "*.test.ts" -delete 2>/dev/null || true
    sudo -u profolio find . -name "*.spec.ts" -delete 2>/dev/null || true
    
    # Calculate space saved
    local final_size=$(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")
    info "  → Final application size: $final_size"
    
    success "Build artifacts cleaned up successfully"
}

# Update the installer script itself to latest version
update_installer_script() {
    info "🔄 Updating installer script to latest version..."
    
    # Create backup of current installer script
    local installer_backup="/opt/profolio/installer-backup-$(date +%Y%m%d-%H%M%S).sh"
    if [ -f "/opt/profolio/install-or-update.sh" ]; then
        cp "/opt/profolio/install-or-update.sh" "$installer_backup" 2>/dev/null || true
        success "Current installer backed up to: $(basename $installer_backup)"
    fi
    
    # Download latest installer script
    local temp_installer="/tmp/install-or-update-new.sh"
    if curl -fsSL "https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh" -o "$temp_installer"; then
        # Verify the downloaded script is valid bash
        if bash -n "$temp_installer" 2>/dev/null; then
            # Check if the new script is actually different
            if ! cmp -s "$temp_installer" "/opt/profolio/install-or-update.sh" 2>/dev/null; then
                # Replace the current installer
                cp "$temp_installer" "/opt/profolio/install-or-update.sh"
                chmod +x "/opt/profolio/install-or-update.sh"
                chown profolio:profolio "/opt/profolio/install-or-update.sh" 2>/dev/null || true
                rm -f "$temp_installer"
                success "✅ Installer script updated to latest version"
                return 0
            else
                rm -f "$temp_installer"
                success "✅ Installer script already at latest version"
                return 0
            fi
        else
            error "Downloaded installer script failed syntax check - keeping current version"
            rm -f "$temp_installer"
            return 1
        fi
    else
        error "Failed to download latest installer script - keeping current version"
        return 1
    fi
}

# Setup environment configuration with proper credential preservation and database sync
setup_environment() {
    local is_rollback_mode="${1:-false}"  # Parameter to indicate if called during rollback
    
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
        
        # If we have any existing environment configuration, handle preservation
        if [ "$has_firebase_config" = true ] || [ "$has_auth_mode" = true ] || [ "$has_api_url" = true ]; then
            
            if [ "$is_rollback_mode" = true ]; then
                # During rollback, automatically preserve without prompting
                preserve_frontend_env=true
                info "Rollback mode: Automatically preserving existing environment configuration"
            elif [ "${SKIP_ENV_PRESERVATION:-false}" = true ]; then
                # User chose not to preserve environment during wizard
                preserve_frontend_env=false
                info "User selected: Reset environment configuration to defaults"
            else
                # User chose to preserve environment (or default behavior)
                preserve_frontend_env=true
                info "Preserving existing environment configuration as selected in wizard"
                
                # Show what we detected for transparency
                echo -e "   ${GREEN}✅ Environment configuration detected in: $frontend_env_file${NC}"
                if [ "$has_firebase_config" = true ]; then
                    echo -e "   ${GREEN}✅ Firebase configuration will be preserved${NC}"
                fi
                if [ "$has_auth_mode" = true ]; then
                    echo -e "   ${GREEN}✅ Authentication mode will be preserved${NC}"
                fi
                if [ "$has_api_url" = true ]; then
                    echo -e "   ${GREEN}✅ API URL will be preserved${NC}"
                fi
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
    
    # Finalize statistics tracking
    OPERATION_END_TIME=$(date +%s)
    DISK_SPACE_AFTER=$(df /opt 2>/dev/null | tail -1 | awk '{print $3}' || echo "0")
    
    # Get new version
    if [ -f "/opt/profolio/package.json" ]; then
        NEW_VERSION=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
    else
        NEW_VERSION="unknown"
    fi
    
    # Count changed files
    if [ -d "/opt/profolio/.git" ]; then
        cd /opt/profolio
        FILES_CHANGED_COUNT=$(git diff --name-only HEAD~1 2>/dev/null | wc -l || echo "0")
        if [ "$FILES_CHANGED_COUNT" = "0" ]; then
            FILES_CHANGED_COUNT=$(find . -type f -not -path "./.git/*" -not -path "./node_modules/*" | wc -l || echo "0")
        fi
    else
        if [ -d "/opt/profolio" ]; then
            FILES_CHANGED_COUNT=$(find /opt/profolio -type f -not -path "/opt/profolio/.git/*" -not -path "/opt/profolio/node_modules/*" | wc -l || echo "0")
        else
            FILES_CHANGED_COUNT="0"
        fi
    fi
    
    # Get backup size
    if [ -n "$ROLLBACK_BACKUP_DIR" ] && [ -d "$ROLLBACK_BACKUP_DIR" ]; then
        BACKUP_SIZE=$(du -sh "$ROLLBACK_BACKUP_DIR" 2>/dev/null | cut -f1 || echo "unknown")
    else
        BACKUP_SIZE="none"
    fi
    
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
        
        # Show comprehensive statistics
        show_operation_statistics "$operation_name" "$operation_success"
        
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
        
        # Show statistics even for failed operations
        show_operation_statistics "$operation_name" "$operation_success"
        
        error "Operation failed. Check the logs above for details."
        echo ""
        echo -e "${CYAN}Troubleshooting commands:${NC}"
        echo -e "   ${WHITE}Check service status:${NC} systemctl status profolio-backend profolio-frontend"
        echo -e "   ${WHITE}View logs:${NC} journalctl -u profolio-backend -u profolio-frontend -f"
        echo -e "   ${WHITE}Try manual restart:${NC} systemctl restart profolio-backend profolio-frontend"
    fi
}

# Show comprehensive statistics summary
show_operation_statistics() {
    local operation_name="$1"
    local operation_success="$2"
    
    # Helper function to format table rows with proper alignment
    format_stat_row() {
        local label="$1"
        local value="$2"
        local label_color="$3"
        local padding_length=60
        
        # Strip color codes from value for length calculation
        local clean_value=$(echo "$value" | sed 's/\x1b\[[0-9;]*m//g')
        local content_length=$((${#label} + ${#clean_value} + 4))  # 4 for spaces and colons
        local spaces_needed=$((padding_length - content_length))
        
        if [ $spaces_needed -lt 1 ]; then
            spaces_needed=1
        fi
        
        local padding=$(printf "%*s" $spaces_needed "")
        echo -e "${CYAN}║${NC}   ${label_color}${label}:${NC} ${value}${padding}${CYAN}║${NC}"
    }
    
    # Calculate operation duration
    local duration=""
    if [ -n "$OPERATION_START_TIME" ] && [ -n "$OPERATION_END_TIME" ]; then
        local total_time=$((OPERATION_END_TIME - OPERATION_START_TIME))
        local hours=$((total_time / 3600))
        local minutes=$(((total_time % 3600) / 60))
        local seconds=$((total_time % 60))
        
        if [ $hours -gt 0 ]; then
            duration="${hours}h ${minutes}m ${seconds}s"
        elif [ $minutes -gt 0 ]; then
            duration="${minutes}m ${seconds}s"
        else
            duration="${seconds}s"
        fi
    else
        duration="unknown"
    fi
    
    # Calculate service downtime
    local downtime=""
    if [ -n "$SERVICE_DOWNTIME_START" ] && [ -n "$SERVICE_DOWNTIME_END" ]; then
        local downtime_seconds=$((SERVICE_DOWNTIME_END - SERVICE_DOWNTIME_START))
        local d_hours=$((downtime_seconds / 3600))
        local d_minutes=$(((downtime_seconds % 3600) / 60))
        local d_secs=$((downtime_seconds % 60))
        
        if [ $d_hours -gt 0 ]; then
            downtime="${d_hours}h ${d_minutes}m ${d_secs}s"
        elif [ $d_minutes -gt 0 ]; then
            downtime="${d_minutes}m ${d_secs}s"
        else
            downtime="${d_secs}s"
        fi
    else
        downtime="none"
    fi
    
    # Calculate disk space change
    local space_change="unknown"
    if [ "$DISK_SPACE_BEFORE" != "0" ] && [ "$DISK_SPACE_AFTER" != "0" ]; then
        local diff=$((DISK_SPACE_AFTER - DISK_SPACE_BEFORE))
        if [ $diff -gt 0 ]; then
            space_change="+$(echo $diff | awk '{printf "%.1f", $1/1024}')MB"
        elif [ $diff -lt 0 ]; then
            space_change="$(echo $diff | awk '{printf "%.1f", $1/1024}')MB"
        else
            space_change="no change"
        fi
    fi
    
    # Calculate current app size on disk
    local app_size="unknown"
    if [ -d "/opt/profolio" ]; then
        app_size=$(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")
    fi
    
    echo ""
    echo -e "${CYAN}📊 Operation Statistics${NC}"
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    
    # Time Statistics
    echo -e "${CYAN}║${NC} ${WHITE}⏱️  Timing Statistics${NC}                                        ${CYAN}║${NC}"
    format_stat_row "Total Runtime" "$duration" "${GREEN}"
    if [ "$downtime" != "none" ]; then
        format_stat_row "Service Downtime" "$downtime" "${YELLOW}"
    fi
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    
    # Version Information
    echo -e "${CYAN}║${NC} ${WHITE}📦 Version Information${NC}                                       ${CYAN}║${NC}"
    if [ "$operation_name" = "INSTALLATION" ]; then
        format_stat_row "Installed Version" "$NEW_VERSION" "${GREEN}"
    else
        format_stat_row "Previous Version" "$PREVIOUS_VERSION" "${BLUE}"
        format_stat_row "Updated Version" "$NEW_VERSION" "${GREEN}"
    fi
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    
    # File and Data Statistics  
    echo -e "${CYAN}║${NC} ${WHITE}📁 Data Statistics${NC}                                           ${CYAN}║${NC}"
    format_stat_row "Files Processed" "$FILES_CHANGED_COUNT" "${GREEN}"
    format_stat_row "Actual Download" "$DOWNLOAD_SIZE" "${BLUE}"
    format_stat_row "Total App Size" "${APP_SIZE:-$app_size}" "${CYAN}"
    if [ "$BACKUP_SIZE" != "none" ]; then
        format_stat_row "Backup Created" "$BACKUP_SIZE" "${YELLOW}"
    fi
    format_stat_row "Disk Space Change" "$space_change" "${PURPLE}"
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    
    # System Resource Usage
    echo -e "${CYAN}║${NC} ${WHITE}💾 System Resources${NC}                                         ${CYAN}║${NC}"
    format_stat_row "Peak Memory Usage" "${MEMORY_USAGE_PEAK}%" "${GREEN}"
    
    # Current system status
    local current_disk=$(df -h /opt 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")
    format_stat_row "Available Disk Space" "$current_disk" "${BLUE}"
    echo -e "${CYAN}║${NC}                                                              ${CYAN}║${NC}"
    
    # Operation Summary
    echo -e "${CYAN}║${NC} ${WHITE}✅ Operation Summary${NC}                                         ${CYAN}║${NC}"
    if [ "$operation_success" = true ]; then
        format_stat_row "Status" "✅ Completed Successfully" "${GREEN}"
        format_stat_row "Services" "✅ Running" "${GREEN}"
    else
        format_stat_row "Status" "❌ Failed" "${RED}"
        format_stat_row "Services" "⚠️  Check Required" "${YELLOW}"
    fi
    
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
}

# Main execution logic with improved terminology
main() {
    # Initialize operation tracking
    OPERATION_START_TIME=$(date +%s)
    DISK_SPACE_BEFORE=$(df /opt 2>/dev/null | tail -1 | awk '{print $3}' || echo "0")
    
    # Get previous version if it exists
    if [ -f "/opt/profolio/package.json" ]; then
        PREVIOUS_VERSION=$(grep '"version"' /opt/profolio/package.json | cut -d'"' -f4 2>/dev/null || echo "unknown")
    else
        PREVIOUS_VERSION="none"
    fi
    
    # Initialize memory tracking
    MEMORY_USAGE_PEAK=$(free | grep '^Mem' | awk '{printf "%.1f", $3/$2 * 100}' 2>/dev/null || echo "0")
    
    show_banner
    check_root
    
    # Handle Proxmox container creation if needed
    handle_proxmox_installation
    
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
            info "Application action: Existing installation detected (services not running)"
            run_update_wizard  # Use same wizard for both running and non-running
            
            # Determine action based on user choice
            if [ "${USER_ACTION_CHOICE:-}" = "repair" ]; then
                repair_installation
            else
                update_installation
            fi
            ;;
        2)
            info "Application action: Existing installation detected (services running)"
            run_update_wizard
            
            # Determine action based on user choice  
            if [ "${USER_ACTION_CHOICE:-}" = "repair" ]; then
                repair_installation
            else
                update_installation
            fi
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
    
    # Update installer script to latest version
    update_installer_script
    
    # Stop services properly
    info "Stopping services for update..."
    start_service_downtime
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
        
        # Optimize installation size by removing non-essential directories (update scenario)
        info "Optimizing installation size..."
        rm -rf docs/ .github/ www/ policies/ scripts/ || true
        rm -f CONTRIBUTING.md SECURITY.md README.md .DS_Store || true
        success "Installation optimized (removed documentation and development files)"
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
        end_service_downtime
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
    
    # Set download size for repair (no new downloads)
    DOWNLOAD_SIZE="0 bytes (rebuild only)"
    
    # Set app size for statistics
    if [ -d "/opt/profolio" ]; then
        APP_SIZE=$(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")
    fi
    
    # Update installer script to latest version
    update_installer_script
    
    # Stop any running services first
    info "Stopping any running services..."
    start_service_downtime
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
        end_service_downtime
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

# Simplified fresh install with optimized download system
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
    
    # Application download with optimized system
    info "Downloading Profolio with optimized incremental system..."
    
    if ! download_profolio_incremental "$TARGET_VERSION" "true"; then
        error "Failed to download repository"
        OPERATION_SUCCESS=false
        show_completion_status "$OPERATION_TYPE" "$OPERATION_SUCCESS"
        return 1
    fi
    
    success "Repository downloaded and optimized"
    
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
        end_service_downtime
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

# Incremental download and update system
# =====================================

# Configure git for efficient downloads
configure_git_efficiency() {
    info "Configuring git for efficient downloads..."
    
    # Configure git for better performance
    git config --global pack.windowMemory "100m"
    git config --global pack.packSizeLimit "100m"
    git config --global pack.threads "1"
    git config --global core.preloadindex true
    git config --global core.fscache true
    git config --global gc.auto 256
    
    success "Git optimized for efficient downloads"
}

# Setup sparse checkout to exclude unnecessary files
setup_sparse_checkout() {
    local repo_dir="$1"
    
    info "Setting up sparse checkout to reduce download size..."
    cd "$repo_dir"
    
    # Enable sparse checkout
    git config core.sparseCheckout true
    
    # Define what to include (exclude docs, policies, etc.)
    cat > .git/info/sparse-checkout << 'EOF'
# Include essential application files
/backend/
/frontend/
/install-or-update.sh
/package.json
/README.md

# Exclude documentation and development files
!docs/
!.github/
!www/
!policies/
!scripts/
!.cursor/
!CONTRIBUTING.md
!SECURITY.md
!.DS_Store
!*.md
EOF

    # Apply sparse checkout
    git read-tree -m -u HEAD
    
    success "Sparse checkout configured - reduced download size significantly"
}

# Calculate download statistics for transparency
calculate_download_stats() {
    local repo_dir="$1"
    local is_incremental="$2"
    local actual_download_size="$3"  # New parameter for actual download size
    
    if [ -d "$repo_dir" ]; then
        # Calculate total application size (includes node_modules, builds, etc.)
        local total_app_size=$(du -sh "$repo_dir" 2>/dev/null | cut -f1 || echo "unknown")
        
        # Calculate git repository size (bare git data)
        local git_size="unknown"
        if [ -d "$repo_dir/.git" ]; then
            git_size=$(du -sh "$repo_dir/.git" 2>/dev/null | cut -f1 || echo "unknown")
        fi
        
        if [ "$is_incremental" = true ]; then
            info "📊 Incremental Update Statistics:"
            echo "   Actual download: ${actual_download_size:-"~3-5 KiB (incremental)"}"
            echo "   Total app size: $total_app_size"
            echo "   Git data size: $git_size"
            echo "   ✅ Only downloaded changes (efficient!)"
            
            # Set accurate download size for statistics
            if [ -n "$actual_download_size" ]; then
                DOWNLOAD_SIZE="$actual_download_size"
            else
                DOWNLOAD_SIZE="~3-5 KiB"  # Estimate for incremental
            fi
        else
            info "📊 Download Statistics:"
            echo "   Repository download: ${actual_download_size:-$git_size}"
            echo "   Total app size: $total_app_size"
            echo "   ✅ Optimized with sparse checkout"
            
            # For fresh downloads, use git size as download size
            DOWNLOAD_SIZE="${actual_download_size:-$git_size}"
        fi
        
        # Track application size separately for statistics
        APP_SIZE="$total_app_size"
    fi
}

# Enhanced incremental download function
download_profolio_incremental() {
    local target_version="${1:-main}"
    local force_fresh="${2:-false}"
    
    # Configure git for efficiency
    configure_git_efficiency
    
    if [ -d "/opt/profolio" ] && [ -d "/opt/profolio/.git" ] && [ "$force_fresh" != true ]; then
        # Existing repository - do incremental update
        info "🚀 Performing incremental update (downloading only changes)..."
        cd /opt/profolio
        
        # Stash any local changes
        sudo -u profolio git stash push -m "Auto-stash before incremental update $(date)" 2>/dev/null || true
        
        # Configure sparse checkout if not already configured
        if ! git config core.sparseCheckout >/dev/null 2>&1; then
            setup_sparse_checkout "/opt/profolio"
        fi
        
        # Fetch only the changes (incremental!) and capture the output to estimate download size
        info "Fetching incremental changes from repository..."
        local fetch_output=$(sudo -u profolio git fetch origin main --progress 2>&1)
        local actual_download_size="~3-5 KiB"  # Default estimate
        
        # Try to extract download size from git fetch output
        if echo "$fetch_output" | grep -q "KiB\|MiB\|GiB"; then
            actual_download_size=$(echo "$fetch_output" | grep -o '[0-9.]\+ [KMG]iB' | tail -1)
        elif echo "$fetch_output" | grep -q "objects:.*done"; then
            local objects_count=$(echo "$fetch_output" | grep -o 'objects: [0-9]\+' | grep -o '[0-9]\+')
            if [ -n "$objects_count" ] && [ "$objects_count" -gt 0 ]; then
                actual_download_size="${objects_count} objects (~${objects_count} KiB)"
            fi
        fi
        
        if [ $? -eq 0 ]; then
            success "✅ Incremental fetch completed"
            
            # Show what's being updated
            local changes_count=$(git log --oneline HEAD..origin/main | wc -l)
            if [ "$changes_count" -gt 0 ]; then
                info "📈 Found $changes_count new commits to apply"
                echo "Recent changes:"
                git log --oneline --graph HEAD..origin/main | head -5
                if [ "$changes_count" -gt 5 ]; then
                    echo "   ... and $((changes_count - 5)) more commits"
                fi
            else
                success "✅ Already up to date - no download needed!"
                calculate_download_stats "/opt/profolio" true "0 bytes"
                return 0
            fi
            
            # Apply the changes
            if sudo -u profolio git reset --hard origin/main; then
                success "✅ Incremental update applied successfully"
                calculate_download_stats "/opt/profolio" true "$actual_download_size"
                return 0
            else
                error "Failed to apply incremental changes"
                return 1
            fi
        else
            warn "Incremental fetch failed, falling back to full download..."
            # Fall through to fresh download
        fi
    fi
    
    # Fresh download or fallback
    info "📥 Performing optimized download..."
    
    # Remove existing directory if needed
    if [ -d "/opt/profolio" ]; then
        rm -rf /opt/profolio
    fi
    
    cd /opt
    
    # Use shallow clone to reduce initial download size
    info "Starting optimized repository download..."
    local clone_output=$(git clone --depth=1 --single-branch --branch main https://github.com/Obednal97/profolio.git --progress 2>&1)
    local clone_download_size="unknown"
    
    # Try to extract download size from git clone output
    if echo "$clone_output" | grep -q "KiB\|MiB\|GiB"; then
        clone_download_size=$(echo "$clone_output" | grep -o '[0-9.]\+ [KMG]iB' | tail -1)
    elif echo "$clone_output" | grep -q "objects:.*done"; then
        local objects_count=$(echo "$clone_output" | grep -o 'objects: [0-9]\+' | grep -o '[0-9]\+')
        if [ -n "$objects_count" ] && [ "$objects_count" -gt 0 ]; then
            clone_download_size="${objects_count} objects"
        fi
    fi
    
    if [ $? -eq 0 ]; then
        success "✅ Repository downloaded successfully"
        
        # Get actual repository size before building
        if [ -d "/opt/profolio/.git" ]; then
            local repo_size=$(du -sh /opt/profolio/.git 2>/dev/null | cut -f1 || echo "unknown")
            if [ "$clone_download_size" = "unknown" ]; then
                clone_download_size="$repo_size"
            fi
        fi
        
        # Setup sparse checkout for future efficiency
        setup_sparse_checkout "/opt/profolio"
        
        # Remove unnecessary files that might still be there
        cd /opt/profolio
        info "Removing unnecessary files to save space..."
        rm -rf docs/ .github/ www/ policies/ scripts/ .cursor/ || true
        rm -f CONTRIBUTING.md SECURITY.md .DS_Store || true
        
        # Set ownership
        chown -R profolio:profolio /opt/profolio
        
        success "✅ Installation optimized for production"
        calculate_download_stats "/opt/profolio" false "$clone_download_size"
        return 0
    else
        error "Failed to download repository"
        return 1
    fi
}

# Run main function
main "$@" 