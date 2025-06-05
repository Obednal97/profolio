#!/bin/bash
#
# Profolio Installer - SSH Hardening Feature Module
# 
# This module provides secure SSH configuration, key generation, and hardening
# features for remote access to the Profolio server.
#
# Version: 1.0.0
# Dependencies: utils/logging.sh, utils/ui.sh, utils/validation.sh
# Compatible: Ubuntu/Debian, Proxmox LXC, Docker

# Module information
SSH_MODULE_VERSION="1.0.0"
SSH_MODULE_NAME="SSH Hardening & Configuration"
SSH_MODULE_DESCRIPTION="Secure SSH server configuration with key-based authentication and hardening"

# Module dependencies
SSH_DEPENDENCIES=(
    "utils/logging.sh"
    "utils/ui.sh"
    "utils/validation.sh"
)

# Default SSH configuration variables
SSH_ENABLED="${SSH_ENABLED:-yes}"
SSH_PORT="${SSH_PORT:-22}"
SSH_ROOT_LOGIN="${SSH_ROOT_LOGIN:-no}"
SSH_PASSWORD_AUTH="${SSH_PASSWORD_AUTH:-no}"
SSH_KEY_ONLY="${SSH_KEY_ONLY:-yes}"
GENERATE_SSH_KEY="${GENERATE_SSH_KEY:-yes}"

# Verify dependencies are loaded
ssh_check_dependencies() {
    local missing_deps=()
    
    # Check for required functions from dependencies
    if ! declare -f info >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing info function)")
    fi
    if ! declare -f success >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing success function)")
    fi
    if ! declare -f warn >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing warn function)")
    fi
    if ! declare -f error >/dev/null 2>&1; then
        missing_deps+=("utils/logging.sh (missing error function)")
    fi
    if ! declare -f validation_validate_port >/dev/null 2>&1; then
        missing_deps+=("utils/validation.sh (missing validation_validate_port function)")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "ERROR: Missing dependencies for SSH hardening module:"
        printf " - %s\n" "${missing_deps[@]}"
        return 1
    fi
    
    return 0
}

# Get module information
ssh_get_info() {
    echo "Module: $SSH_MODULE_NAME"
    echo "Version: $SSH_MODULE_VERSION"
    echo "Description: $SSH_MODULE_DESCRIPTION"
    echo "Dependencies: ${SSH_DEPENDENCIES[*]}"
}

# Configure SSH access with security defaults
ssh_configure_access() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    info "🔐 Configuring SSH access with security defaults..."
    SSH_ENABLED="yes"
    SSH_PORT="22"
    SSH_ROOT_LOGIN="no"
    SSH_PASSWORD_AUTH="no"
    SSH_KEY_ONLY="yes"
    GENERATE_SSH_KEY="yes"
    
    success "SSH configured with secure defaults"
    info "   Port: $SSH_PORT"
    info "   Root login: $SSH_ROOT_LOGIN"
    info "   Password auth: $SSH_PASSWORD_AUTH"
    info "   Key-only auth: $SSH_KEY_ONLY"
    info "   Generate keys: $GENERATE_SSH_KEY"
}

# Interactive SSH key configuration
ssh_configure_keys() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
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

# Advanced SSH configuration with custom options
ssh_configure_advanced() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    echo -e "${CYAN}🔧 Advanced SSH Configuration${NC}"
    echo ""
    
    # SSH Port configuration
    echo -e "${BLUE}SSH Port Configuration:${NC}"
    echo "  Default: 22 (standard SSH port)"
    echo "  Alternative: Custom port for additional security"
    echo ""
    read -p "SSH Port [22]: " ssh_port_input
    ssh_port_input=${ssh_port_input:-22}
    
    if validation_validate_port "$ssh_port_input"; then
        SSH_PORT="$ssh_port_input"
        success "SSH port set to: $SSH_PORT"
    else
        warn "Invalid port, using default: 22"
        SSH_PORT="22"
    fi
    
    # Root login configuration
    echo ""
    echo -e "${BLUE}Root Login Configuration:${NC}"
    echo "  ${GREEN}Recommended: Disabled${NC} (more secure)"
    echo "  ${YELLOW}Alternative: Enabled${NC} (convenient but less secure)"
    echo ""
    read -p "Allow root login via SSH? (y/n) [n]: " root_login_input
    if [[ "$root_login_input" =~ ^[Yy]$ ]]; then
        SSH_ROOT_LOGIN="yes"
        warn "Root login enabled - consider using sudo instead"
    else
        SSH_ROOT_LOGIN="no"
        success "Root login disabled for security"
    fi
    
    # Authentication method configuration
    echo ""
    echo -e "${BLUE}Authentication Method:${NC}"
    echo "  1) ${GREEN}Key-only authentication${NC} (most secure, recommended)"
    echo "  2) ${YELLOW}Key + password fallback${NC} (convenient but less secure)"
    echo "  3) ${RED}Password-only authentication${NC} (not recommended)"
    echo ""
    read -p "Select authentication method [1]: " auth_method
    auth_method=${auth_method:-1}
    
    case $auth_method in
        1)
            SSH_KEY_ONLY="yes"
            SSH_PASSWORD_AUTH="no"
            success "Key-only authentication selected (most secure)"
            ;;
        2)
            SSH_KEY_ONLY="no"
            SSH_PASSWORD_AUTH="yes"
            warn "Key + password fallback selected"
            ;;
        3)
            SSH_KEY_ONLY="no"
            SSH_PASSWORD_AUTH="yes"
            warn "Password-only authentication selected (not recommended)"
            ;;
        *)
            SSH_KEY_ONLY="yes"
            SSH_PASSWORD_AUTH="no"
            success "Key-only authentication selected (default)"
            ;;
    esac
    
    # SSH key generation
    if [[ "$SSH_KEY_ONLY" == "yes" || "$auth_method" == "2" ]]; then
        ssh_configure_keys
    fi
}

# Configure hardened SSH server
ssh_configure_server() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    echo -e "${BLUE}🔐 Configuring hardened SSH server...${NC}"
    
    # Backup original sshd_config
    local backup_file="/etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)"
    cp /etc/ssh/sshd_config "$backup_file"
    success "SSH configuration backed up to: $backup_file"
    
    # Generate hardened SSH configuration
    cat > /etc/ssh/sshd_config << EOF
# Profolio Hardened SSH Configuration
# Generated by SSH hardening module v$SSH_MODULE_VERSION

# Network Configuration
Port $SSH_PORT
AddressFamily any
ListenAddress 0.0.0.0

# Authentication Settings
PermitRootLogin $SSH_ROOT_LOGIN
MaxAuthTries 3
MaxSessions 10
LoginGraceTime 60

# Password Authentication
PasswordAuthentication $SSH_PASSWORD_AUTH
PermitEmptyPasswords no

# Public Key Authentication
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Challenge Response Authentication
ChallengeResponseAuthentication no

# GSSAPI Authentication (disabled for security)
GSSAPIAuthentication no

# X11 Forwarding (disabled for security)
X11Forwarding no

# Agent and TCP Forwarding
AllowAgentForwarding yes
AllowTcpForwarding yes

# Print motd and last log
PrintMotd yes
PrintLastLog yes

# TCP Keep Alive
TCPKeepAlive yes
ClientAliveInterval 60
ClientAliveCountMax 3

# Use strong ciphers and MACs (modern cryptography)
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Host Key Algorithms (prefer Ed25519 and ECDSA)
HostKeyAlgorithms ssh-ed25519,ecdsa-sha2-nistp256,ecdsa-sha2-nistp384,ecdsa-sha2-nistp521,rsa-sha2-256,rsa-sha2-512

# Logging
SyslogFacility AUTH
LogLevel INFO

# Security Settings
Protocol 2
StrictModes yes
IgnoreRhosts yes
HostbasedAuthentication no
Banner none
DebianBanner no
PermitUserEnvironment no

# Disable unused features
PermitTunnel no
GatewayPorts no

# Subsystem
Subsystem sftp /usr/lib/openssh/sftp-server

# Additional hardening
MaxStartups 10:30:100
TCPKeepAlive yes
Compression delayed
EOF

    # Set proper permissions
    chmod 644 /etc/ssh/sshd_config
    success "SSH configuration file created with hardened settings"
    
    # Configure profolio user for SSH access
    if [[ "$SSH_ROOT_LOGIN" == "no" ]]; then
        usermod -aG sudo profolio 2>/dev/null || true
        success "Added profolio user to sudo group"
    fi
    
    # Generate SSH keys for profolio user if requested
    if [[ "$GENERATE_SSH_KEY" == "yes" ]]; then
        ssh_generate_user_keys
    fi
    
    # Regenerate SSH host keys for security
    ssh_regenerate_host_keys
    
    # Enable and start SSH service
    systemctl enable ssh
    systemctl restart ssh
    
    # Verify SSH service is running
    if systemctl is-active --quiet ssh; then
        local local_ip
        local_ip=$(hostname -I | awk '{print $1}')
        
        success "SSH service started successfully on port $SSH_PORT"
        echo ""
        echo -e "${CYAN}📝 SSH Connection Info:${NC}"
        echo -e "   Command: ${WHITE}ssh -p $SSH_PORT profolio@$local_ip${NC}"
        
        if [[ "$SSH_KEY_ONLY" == "yes" ]]; then
            echo -e "   ${YELLOW}Note: Key-only authentication enabled${NC}"
            echo -e "   ${YELLOW}You'll need to copy the private key to connect${NC}"
        fi
        
        if [[ "$SSH_PORT" != "22" ]]; then
            echo -e "   ${BLUE}Custom port: $SSH_PORT${NC}"
        fi
    else
        error "Failed to start SSH service"
        echo -e "${YELLOW}⚠️  Check SSH configuration: sudo journalctl -u ssh${NC}"
        return 1
    fi
}

# Generate SSH keys for profolio user
ssh_generate_user_keys() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    info "🔑 Generating SSH key pair for profolio user..."
    
    # Create .ssh directory
    sudo -u profolio mkdir -p /home/profolio/.ssh
    chmod 700 /home/profolio/.ssh
    chown profolio:profolio /home/profolio/.ssh
    
    # Generate SSH key pair (4096-bit RSA for maximum compatibility)
    sudo -u profolio ssh-keygen -t rsa -b 4096 -f /home/profolio/.ssh/id_rsa -N "" -C "profolio@$(hostname)-$(date +%Y%m%d)"
    
    # Set up authorized_keys with the new public key
    sudo -u profolio cp /home/profolio/.ssh/id_rsa.pub /home/profolio/.ssh/authorized_keys
    chmod 600 /home/profolio/.ssh/authorized_keys
    chown profolio:profolio /home/profolio/.ssh/authorized_keys
    
    # Generate Ed25519 key as well (more secure, modern)
    sudo -u profolio ssh-keygen -t ed25519 -f /home/profolio/.ssh/id_ed25519 -N "" -C "profolio@$(hostname)-ed25519-$(date +%Y%m%d)"
    
    # Add Ed25519 key to authorized_keys as well
    sudo -u profolio cat /home/profolio/.ssh/id_ed25519.pub >> /home/profolio/.ssh/authorized_keys
    
    success "SSH key pairs generated for profolio user"
    info "   RSA key: /home/profolio/.ssh/id_rsa"
    info "   Ed25519 key: /home/profolio/.ssh/id_ed25519"
    info "   Public keys: /home/profolio/.ssh/authorized_keys"
}

# Regenerate SSH host keys for security
ssh_regenerate_host_keys() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    info "🔑 Regenerating SSH host keys for enhanced security..."
    
    # Remove old host keys
    rm -f /etc/ssh/ssh_host_*
    
    # Generate new host keys with stronger algorithms
    ssh-keygen -t rsa -b 4096 -f /etc/ssh/ssh_host_rsa_key -N ""
    ssh-keygen -t ecdsa -b 521 -f /etc/ssh/ssh_host_ecdsa_key -N ""
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ""
    
    # Set proper permissions
    chmod 600 /etc/ssh/ssh_host_*_key
    chmod 644 /etc/ssh/ssh_host_*_key.pub
    
    success "SSH host keys regenerated with modern algorithms"
}

# Test SSH configuration
ssh_test_configuration() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    info "🧪 Testing SSH configuration..."
    
    # Test SSH configuration syntax
    if sshd -t 2>/dev/null; then
        success "SSH configuration syntax is valid"
    else
        error "SSH configuration has syntax errors"
        return 1
    fi
    
    # Test SSH service status
    if systemctl is-active --quiet ssh; then
        success "SSH service is running"
    else
        error "SSH service is not running"
        return 1
    fi
    
    # Test SSH port accessibility
    if ss -tlnp | grep -q ":$SSH_PORT "; then
        success "SSH is listening on port $SSH_PORT"
    else
        warn "SSH may not be listening on port $SSH_PORT"
    fi
    
    return 0
}

# Show SSH access information
ssh_show_access_info() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    if [[ "$SSH_ENABLED" != "yes" ]]; then
        return 0
    fi
    
    local local_ip
    local_ip=$(hostname -I | awk '{print $1}')
    
    echo -e "${BLUE}🔐 SSH Access Information:${NC}"
    echo -e "   ${WHITE}SSH Command:${NC} ${CYAN}ssh -p $SSH_PORT profolio@$local_ip${NC}"
    
    if [[ "$SSH_KEY_ONLY" == "yes" ]]; then
        echo -e "   ${WHITE}Authentication:${NC} ${GREEN}Key-only (secure)${NC}"
        if [[ "$GENERATE_SSH_KEY" == "yes" ]]; then
            echo -e "   ${WHITE}Private Key (RSA):${NC} ${YELLOW}/home/profolio/.ssh/id_rsa${NC}"
            echo -e "   ${WHITE}Private Key (Ed25519):${NC} ${YELLOW}/home/profolio/.ssh/id_ed25519${NC}"
            echo -e "   ${WHITE}Public Keys:${NC} ${YELLOW}/home/profolio/.ssh/authorized_keys${NC}"
            echo ""
            echo -e "${CYAN}📝 To connect from your local machine:${NC}"
            echo -e "   ${WHITE}1.${NC} Copy the private key: ${CYAN}scp -P $SSH_PORT profolio@$local_ip:/home/profolio/.ssh/id_rsa ~/.ssh/profolio_key${NC}"
            echo -e "   ${WHITE}2.${NC} Set permissions: ${CYAN}chmod 600 ~/.ssh/profolio_key${NC}"
            echo -e "   ${WHITE}3.${NC} Connect: ${CYAN}ssh -i ~/.ssh/profolio_key -p $SSH_PORT profolio@$local_ip${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Add your public key to: /home/profolio/.ssh/authorized_keys${NC}"
        fi
    elif [[ "$SSH_PASSWORD_AUTH" == "yes" ]]; then
        echo -e "   ${WHITE}Authentication:${NC} ${YELLOW}Password enabled${NC}"
        echo -e "   ${YELLOW}⚠️  Consider using key-based authentication for better security${NC}"
    fi
    
    if [[ "$SSH_ROOT_LOGIN" == "yes" ]]; then
        echo -e "   ${RED}⚠️  Root login is enabled - consider disabling for security${NC}"
    fi
    
    if [[ "$SSH_PORT" != "22" ]]; then
        echo -e "   ${BLUE}ℹ️  Custom SSH port: $SSH_PORT${NC}"
    fi
}

# Apply additional SSH hardening
ssh_apply_additional_hardening() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    info "🛡️ Applying additional SSH hardening measures..."
    
    # Install and configure fail2ban for SSH protection
    if command -v fail2ban-server >/dev/null 2>&1; then
        info "Configuring fail2ban for SSH protection..."
        
        cat > /etc/fail2ban/jail.local << EOF
[sshd]
enabled = true
port = $SSH_PORT
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
EOF
        
        systemctl enable fail2ban
        systemctl restart fail2ban
        success "fail2ban configured for SSH protection"
    else
        info "Installing fail2ban for SSH protection..."
        apt-get update -qq
        apt-get install -y fail2ban
        
        # Configure after installation
        ssh_apply_additional_hardening
        return $?
    fi
    
    # Configure SSH banner (optional security through obscurity)
    if [[ -n "${SSH_BANNER:-}" ]]; then
        echo "$SSH_BANNER" > /etc/ssh/ssh_banner
        echo "Banner /etc/ssh/ssh_banner" >> /etc/ssh/sshd_config
        success "SSH banner configured"
    fi
    
    # Set up SSH rate limiting with iptables (if available)
    if command -v iptables >/dev/null 2>&1; then
        info "Configuring iptables rate limiting for SSH..."
        
        # Allow SSH but rate limit new connections
        iptables -A INPUT -p tcp --dport "$SSH_PORT" -m state --state NEW -m recent --set --name SSH
        iptables -A INPUT -p tcp --dport "$SSH_PORT" -m state --state NEW -m recent --update --seconds 60 --hitcount 4 --rttl --name SSH -j DROP
        
        success "iptables rate limiting configured for SSH"
    fi
    
    success "Additional SSH hardening measures applied"
}

# Backup SSH configuration
ssh_backup_configuration() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    local backup_dir="/opt/profolio/backups/ssh"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    info "💾 Backing up SSH configuration..."
    
    mkdir -p "$backup_dir"
    
    # Backup SSH configuration files
    cp /etc/ssh/sshd_config "$backup_dir/sshd_config_$timestamp"
    cp -r /etc/ssh/ssh_host_* "$backup_dir/" 2>/dev/null || true
    
    # Backup user SSH keys
    if [[ -d "/home/profolio/.ssh" ]]; then
        cp -r /home/profolio/.ssh "$backup_dir/user_ssh_$timestamp"
    fi
    
    success "SSH configuration backed up to: $backup_dir"
}

# Restore SSH configuration from backup
ssh_restore_configuration() {
    if ! ssh_check_dependencies; then
        return 1
    fi
    
    local backup_dir="/opt/profolio/backups/ssh"
    
    if [[ ! -d "$backup_dir" ]]; then
        error "No SSH backup directory found: $backup_dir"
        return 1
    fi
    
    info "🔄 Restoring SSH configuration from backup..."
    
    # List available backups
    echo "Available SSH configuration backups:"
    ls -la "$backup_dir/"
    
    read -p "Enter backup timestamp to restore (or 'latest' for most recent): " backup_choice
    
    if [[ "$backup_choice" == "latest" ]]; then
        local latest_config
        latest_config=$(ls -t "$backup_dir"/sshd_config_* 2>/dev/null | head -1)
        if [[ -n "$latest_config" ]]; then
            cp "$latest_config" /etc/ssh/sshd_config
            success "SSH configuration restored from latest backup"
        else
            error "No SSH configuration backups found"
            return 1
        fi
    else
        if [[ -f "$backup_dir/sshd_config_$backup_choice" ]]; then
            cp "$backup_dir/sshd_config_$backup_choice" /etc/ssh/sshd_config
            success "SSH configuration restored from backup: $backup_choice"
        else
            error "Backup not found: $backup_dir/sshd_config_$backup_choice"
            return 1
        fi
    fi
    
    # Restart SSH service
    systemctl restart ssh
    
    if ssh_test_configuration; then
        success "SSH service restarted successfully with restored configuration"
    else
        error "SSH service failed to start with restored configuration"
        return 1
    fi
}

# Backward compatibility aliases
configure_ssh_access() { ssh_configure_access "$@"; }
configure_ssh_keys() { ssh_configure_keys "$@"; }
configure_ssh_server() { ssh_configure_server "$@"; }

# Module initialization check
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Profolio Installer - SSH Hardening Feature Module v$SSH_MODULE_VERSION"
    echo "This module should be sourced, not executed directly."
    exit 1
fi 