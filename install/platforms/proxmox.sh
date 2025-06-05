#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - PROXMOX PLATFORM MODULE v1.0.0
# =============================================================================
# 
# Proxmox VE platform-specific functionality for LXC container management
# Provides: Container creation, configuration, networking, template management
#
# Compatible: Proxmox VE Host only
# Dependencies: utils/logging.sh, utils/ui.sh, utils/platform-detection.sh
# =============================================================================

# Module info function
proxmox_platform_info() {
    echo "Proxmox Platform Module v1.0.0"
    echo "  • LXC container creation and management"
    echo "  • Automated template download and configuration"
    echo "  • Network configuration with DHCP/static options"
    echo "  • Container resource allocation and optimization"
    echo "  • Automated Profolio installation in containers"
}

# Check if this module is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    if [ -n "${INSTALLER_DEBUG:-}" ]; then
        echo "[DEBUG] Proxmox platform module loaded"
    fi
else
    # Being executed directly
    echo "Proxmox Platform Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    echo "Usage: source install/platforms/proxmox.sh"
    exit 1
fi

# Proxmox LXC container configuration defaults
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

# Get next available VMID for new container
get_next_vmid() {
    local vmid=100
    while pct status $vmid >/dev/null 2>&1 || qm status $vmid >/dev/null 2>&1; do
        vmid=$((vmid + 1))
    done
    echo $vmid
}

# List available storage pools
list_proxmox_storage() {
    if ! command -v pvesm >/dev/null 2>&1; then
        echo "ERROR: pvesm command not found. Not running on Proxmox host?"
        return 1
    fi
    
    echo "Available storage pools:"
    pvesm status | grep -E "^[[:space:]]*[^[:space:]]+[[:space:]]+[^[:space:]]+[[:space:]]+active" | awk '{print "   • " $1 " (" $2 ")"}'
}

# List available network bridges
list_network_bridges() {
    echo "Available network bridges:"
    ip link show | grep -E "^[0-9]+: vmbr[0-9]+" | awk -F': ' '{print "   • " $2}' | cut -d'@' -f1
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
    local suggested_vmid
    suggested_vmid=$(get_next_vmid)
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
            
            # Ask about system updates before installation
            echo -e "${CYAN}📦 Container System Update Options:${NC}"
            echo -e "${YELLOW}Update container packages before installing Profolio?${NC}"
            echo ""
            echo -e "${WHITE}Options:${NC}"
            echo -e "   ${GREEN}1)${NC} Skip system updates (just install Profolio packages)"
            echo -e "   ${BLUE}2)${NC} Update package lists only (recommended)"  
            echo -e "   ${YELLOW}3)${NC} Full system update (lists + upgrade packages)"
            echo ""
            read -p "Select update option [2]: " container_update_choice
            container_update_choice=${container_update_choice:-2}
            
            # Build update command based on choice
            local update_cmd=""
            case $container_update_choice in
                1)
                    info "Skipping container system updates"
                    update_cmd=""
                    ;;
                2)
                    info "Updating container package lists only"
                    update_cmd="apt update &&"
                    ;;
                3)
                    info "Performing full container system update"
                    update_cmd="apt update && apt upgrade -y &&"
                    ;;
            esac
            
            # Download and execute installer in container
            pct exec $PROXMOX_VMID -- bash -c "
                ${update_cmd} apt install -y git nodejs npm postgresql postgresql-contrib curl wget openssl openssh-server && npm install -g pnpm@9.14.4
                curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | bash
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
        
        # Install Profolio application inside the container
        info "Starting Profolio application installation in LXC container..."
        if ! install_profolio_application; then
            error "Failed to install Profolio application in container"
            return 1
        fi
        
        success "Profolio installation in LXC container completed successfully"
        return 0
    else
        # Regular Linux system
        return 0  # Continue with normal installation
    fi
}

# Backward compatibility aliases
proxmox_container_creation_wizard() {
    proxmox_container_wizard
}

create_lxc_container() {
    create_proxmox_container
}

# Module metadata
PROXMOX_PLATFORM_VERSION="1.0.0"
PROXMOX_PLATFORM_DEPENDENCIES="utils/logging.sh utils/ui.sh utils/platform-detection.sh" 