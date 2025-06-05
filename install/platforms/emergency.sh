#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - EMERGENCY RECOVERY MODULE v1.0.0
# =============================================================================
# 
# Emergency recovery functionality for failed installations
# Provides: Dependency fixing, system recovery, emergency installation
#
# Compatible: All platforms when normal installation fails
# Dependencies: utils/logging.sh, utils/ui.sh, core/profolio-installer.sh
# =============================================================================

# Module info function
emergency_recovery_info() {
    echo "Emergency Recovery Module v1.0.0"
    echo "  • Aggressive dependency fixing and system recovery"
    echo "  • Emergency installation when normal methods fail"
    echo "  • System cleanup and repair functionality"
    echo "  • Fallback installation methods"
}

# Check if this module is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    if [ -n "${INSTALLER_DEBUG:-}" ]; then
        echo "[DEBUG] Emergency recovery module loaded"
    fi
else
    # Being executed directly
    echo "Emergency Recovery Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    echo "Usage: source install/platforms/emergency.sh"
    exit 1
fi

# Emergency dependency fixing
emergency_fix_dependencies() {
    info "🚨 Emergency dependency fixing..."
    
    # Force configure all packages
    info "Force configuring all packages..."
    dpkg --configure -a --force-confold 2>/dev/null || warn "Some packages could not be configured"
    
    # Aggressive dependency fixing
    info "Aggressive dependency fixing..."
    apt-get --fix-broken install -y --force-yes 2>/dev/null || \
    apt-get --fix-broken install -y 2>/dev/null || \
    warn "Some dependencies could not be fixed"
    
    # Force install essential packages
    info "Force installing essential packages..."
    apt-get install -y --reinstall --force-yes \
        ca-certificates curl wget gnupg lsb-release git 2>/dev/null || \
    apt-get install -y --reinstall \
        ca-certificates curl wget gnupg lsb-release git 2>/dev/null || \
    warn "Some essential packages failed to install"
    
    # Clean and update
    apt-get clean
    apt-get autoclean
    apt-get autoremove -y 2>/dev/null || true
    
    # Force update
    apt-get update --fix-missing 2>/dev/null || warn "Package update had issues"
    
    success "Emergency dependency fixing completed"
    return 0
}

# Emergency system cleanup
emergency_cleanup_system() {
    info "🧹 Emergency system cleanup..."
    
    # Remove broken packages
    apt-get autoremove -y 2>/dev/null || true
    apt-get autoclean 2>/dev/null || true
    
    # Fix package database
    dpkg --clear-avail 2>/dev/null || true
    apt-cache gencaches 2>/dev/null || true
    
    # Remove lock files if they exist
    rm -f /var/lib/dpkg/lock-frontend 2>/dev/null || true
    rm -f /var/lib/dpkg/lock 2>/dev/null || true
    rm -f /var/cache/apt/archives/lock 2>/dev/null || true
    
    success "Emergency cleanup completed"
    return 0
}

# Emergency Node.js installation
emergency_install_nodejs() {
    info "🚨 Emergency Node.js installation..."
    
    # Remove any existing Node.js installations
    apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Install via NodeSource with fallbacks
    if ! curl -fsSL https://deb.nodesource.com/setup_20.x | bash -; then
        warn "NodeSource installation failed, trying alternative method"
        
        # Fallback: Install from Ubuntu repos
        apt-get update
        apt-get install -y nodejs npm
        
        # Upgrade npm
        npm install -g npm@latest 2>/dev/null || warn "npm upgrade failed"
    fi
    
    # Install pnpm with fallbacks
    if ! npm install -g pnpm@9.14.4; then
        warn "pnpm installation failed, trying alternative"
        curl -fsSL https://get.pnpm.io/install.sh | sh - || \
        warn "All pnpm installation methods failed"
    fi
    
    # Verify installation
    if command -v node >/dev/null 2>&1 && command -v pnpm >/dev/null 2>&1; then
        success "Node.js and pnpm installed successfully"
        info "Node.js version: $(node --version)"
        info "pnpm version: $(pnpm --version)"
        return 0
    else
        error "Node.js/pnpm installation verification failed"
        return 1
    fi
}

# Emergency PostgreSQL installation
emergency_install_postgresql() {
    info "🚨 Emergency PostgreSQL installation..."
    
    # Remove any broken PostgreSQL installations
    apt-get remove -y postgresql* 2>/dev/null || true
    apt-get autoremove -y 2>/dev/null || true
    
    # Clean PostgreSQL data if corrupted
    rm -rf /var/lib/postgresql/*/main 2>/dev/null || true
    
    # Fresh PostgreSQL installation
    apt-get update
    if apt-get install -y postgresql postgresql-contrib postgresql-client; then
        success "PostgreSQL installed successfully"
    else
        error "PostgreSQL installation failed"
        return 1
    fi
    
    # Start and enable PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql
    
    # Verify PostgreSQL is running
    if systemctl is-active --quiet postgresql; then
        success "PostgreSQL is running"
        return 0
    else
        error "PostgreSQL failed to start"
        return 1
    fi
}

# Emergency Profolio installation
emergency_install_profolio() {
    info "🚨 Starting emergency Profolio installation..."
    
    # Emergency system preparation
    emergency_cleanup_system
    emergency_fix_dependencies
    
    # Emergency dependency installation
    if ! emergency_install_nodejs; then
        error "Emergency Node.js installation failed"
        return 1
    fi
    
    if ! emergency_install_postgresql; then
        error "Emergency PostgreSQL installation failed"
        return 1
    fi
    
    # Create profolio user if not exists
    if ! id "profolio" &>/dev/null; then
        useradd -m -s /bin/bash profolio || warn "Failed to create profolio user"
    fi
    
    # Now try the normal installation process
    info "Attempting normal installation process after emergency preparation..."
    if install_profolio_application; then
        success "🎉 Emergency installation completed successfully!"
        return 0
    else
        error "❌ Emergency installation failed"
        return 1
    fi
}

# Emergency recovery for failed installations
emergency_recover_installation() {
    info "🚨 Emergency recovery for failed installation..."
    
    # Stop any running services
    systemctl stop profolio-backend profolio-frontend 2>/dev/null || true
    
    # Check if backup exists
    local backup_dir="/opt/profolio-rollback-$(date +%Y%m%d_%H%M%S)"
    if [[ -d "/opt/profolio-rollback-"* ]]; then
        local latest_backup
        latest_backup=$(ls -td /opt/profolio-rollback-* | head -1)
        info "Found backup: $latest_backup"
        
        # Restore from backup
        if [[ -d "$latest_backup" ]]; then
            info "Restoring from backup..."
            rm -rf /opt/profolio 2>/dev/null || true
            cp -r "$latest_backup" /opt/profolio
            chown -R profolio:profolio /opt/profolio
            
            # Try to restart services
            systemctl start profolio-backend profolio-frontend
            
            if systemctl is-active --quiet profolio-backend && \
               systemctl is-active --quiet profolio-frontend; then
                success "Recovery from backup successful"
                return 0
            fi
        fi
    fi
    
    # If backup recovery failed, try emergency installation
    warn "Backup recovery failed or no backup found, attempting emergency installation"
    emergency_install_profolio
}

# Main emergency handler
handle_emergency_installation() {
    info "🚨 Emergency installation mode activated"
    
    # Determine what type of emergency we're dealing with
    if [[ -f "/opt/profolio/package.json" ]]; then
        # Existing installation that's broken
        emergency_recover_installation
    else
        # Fresh installation that failed
        emergency_install_profolio
    fi
}

# Export main function
export -f handle_emergency_installation
export -f emergency_install_profolio
export -f emergency_recover_installation

# Module metadata
EMERGENCY_RECOVERY_VERSION="1.0.0"
EMERGENCY_RECOVERY_DEPENDENCIES="utils/logging.sh utils/ui.sh core/profolio-installer.sh" 