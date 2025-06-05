#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - BOOTSTRAP SYSTEM v1.0.0
# =============================================================================
# 
# Bootstrap system for downloading modular architecture from repository
# Handles first-time installations and module updates
#
# Usage: source install/bootstrap.sh
# =============================================================================

# Bootstrap configuration
BOOTSTRAP_VERSION="1.0.0"
BOOTSTRAP_REPO_URL="https://github.com/Obednal97/profolio.git"
BOOTSTRAP_BRANCH="main"
BOOTSTRAP_DEBUG="${BOOTSTRAP_DEBUG:-false}"

# Bootstrap logging
bootstrap_log() {
    if [[ "$BOOTSTRAP_DEBUG" == "true" ]]; then
        echo "[BOOTSTRAP] $1" >&2
    fi
}

# Check if bootstrap is needed
bootstrap_needed() {
    local script_dir="$(dirname "${BASH_SOURCE[0]}")"
    local required_modules=(
        "utils/logging.sh"
        "utils/ui.sh"
        "utils/validation.sh"
        "utils/platform-detection.sh"
        "core/version-control.sh"
        "core/rollback.sh"
        "features/optimization.sh"
        "features/ssh-hardening.sh"
        "features/configuration-wizard.sh"
        "platforms/proxmox.sh"
        "platforms/ubuntu.sh"
        "platforms/docker.sh"
    )
    
    for module in "${required_modules[@]}"; do
        if [[ ! -f "$script_dir/$module" ]]; then
            bootstrap_log "Missing module: $module"
            return 0  # Bootstrap needed
        fi
    done
    
    bootstrap_log "All modules present, no bootstrap needed"
    return 1  # Bootstrap not needed
}

# Download modules from repository
bootstrap_download_modules() {
    local temp_dir
    temp_dir=$(mktemp -d)
    local script_dir="$(dirname "${BASH_SOURCE[0]}")"
    
    bootstrap_log "Starting bootstrap download..."
    bootstrap_log "Temp directory: $temp_dir"
    bootstrap_log "Target directory: $script_dir"
    
    # Clone repository to temporary directory
    echo "🚀 Downloading Profolio modular architecture..."
    if git clone --depth=1 --single-branch --branch "$BOOTSTRAP_BRANCH" \
                 "$BOOTSTRAP_REPO_URL" "$temp_dir/profolio" --quiet 2>/dev/null; then
        bootstrap_log "Repository cloned successfully"
    else
        echo "❌ Failed to download modular architecture from repository"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Copy install directory to current location
    if [[ -d "$temp_dir/profolio/install" ]]; then
        echo "📦 Installing modular architecture..."
        
        # Create install directory structure if it doesn't exist
        mkdir -p "$script_dir"/{utils,core,features,platforms}
        
        # Copy all modules
        if cp -r "$temp_dir/profolio/install/"* "$script_dir/"; then
            bootstrap_log "Modules copied successfully"
            echo "✅ Modular architecture installed successfully"
        else
            echo "❌ Failed to copy modules"
            rm -rf "$temp_dir"
            return 1
        fi
    else
        echo "❌ Install directory not found in repository"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    bootstrap_log "Bootstrap cleanup completed"
    return 0
}

# Update existing modules from repository
bootstrap_update_modules() {
    local temp_dir
    temp_dir=$(mktemp -d)
    local script_dir="$(dirname "${BASH_SOURCE[0]}")"
    
    echo "🔄 Updating modular architecture..."
    
    # Clone latest version
    if git clone --depth=1 --single-branch --branch "$BOOTSTRAP_BRANCH" \
                 "$BOOTSTRAP_REPO_URL" "$temp_dir/profolio" --quiet 2>/dev/null; then
        bootstrap_log "Latest repository version downloaded"
    else
        echo "❌ Failed to download latest version"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Backup existing modules
    local backup_dir="$script_dir/backup-$(date +%Y%m%d-%H%M%S)"
    if mkdir -p "$backup_dir"; then
        cp -r "$script_dir"/{utils,core,features,platforms} "$backup_dir/" 2>/dev/null || true
        bootstrap_log "Existing modules backed up to $backup_dir"
    fi
    
    # Update modules
    if [[ -d "$temp_dir/profolio/install" ]]; then
        if cp -r "$temp_dir/profolio/install/"* "$script_dir/"; then
            echo "✅ Modular architecture updated successfully"
            bootstrap_log "Modules updated successfully"
        else
            echo "❌ Failed to update modules"
            rm -rf "$temp_dir"
            return 1
        fi
    else
        echo "❌ Install directory not found in repository"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    return 0
}

# Get module versions from repository
bootstrap_get_available_versions() {
    echo "🔍 Checking available versions..."
    
    # Use git ls-remote to get available tags/branches
    if command -v git >/dev/null 2>&1; then
        echo ""
        echo "Available versions:"
        git ls-remote --tags --heads "$BOOTSTRAP_REPO_URL" 2>/dev/null | \
            sed 's/.*\///g' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$|^main$|^latest$' | \
            sort -V | tail -10 | sed 's/^/  • /'
    else
        echo "❌ Git not available for version checking"
        return 1
    fi
}

# Validate downloaded modules
bootstrap_validate_modules() {
    local script_dir="$(dirname "${BASH_SOURCE[0]}")"
    local required_modules=(
        "utils/logging.sh"
        "utils/ui.sh" 
        "utils/validation.sh"
        "utils/platform-detection.sh"
        "core/version-control.sh"
        "core/rollback.sh"
        "features/optimization.sh"
        "features/ssh-hardening.sh"
        "features/configuration-wizard.sh"
        "platforms/proxmox.sh"
        "platforms/ubuntu.sh"
        "platforms/docker.sh"
    )
    
    local missing_modules=()
    
    for module in "${required_modules[@]}"; do
        if [[ ! -f "$script_dir/$module" ]]; then
            missing_modules+=("$module")
        fi
    done
    
    if [[ ${#missing_modules[@]} -eq 0 ]]; then
        bootstrap_log "All required modules validated successfully"
        return 0
    else
        echo "❌ Missing modules after bootstrap: ${missing_modules[*]}"
        return 1
    fi
}

# Auto-bootstrap if needed
bootstrap_auto() {
    if bootstrap_needed; then
        echo "🚨 Modular architecture not found locally"
        echo "📥 Downloading from repository..."
        
        if bootstrap_download_modules; then
            if bootstrap_validate_modules; then
                echo "✅ Bootstrap completed successfully"
                return 0
            else
                echo "❌ Bootstrap validation failed"
                return 1
            fi
        else
            echo "❌ Bootstrap download failed"
            return 1
        fi
    else
        bootstrap_log "Bootstrap not needed - all modules present"
        return 0
    fi
}

# Bootstrap info function
bootstrap_info() {
    echo "Bootstrap System v$BOOTSTRAP_VERSION"
    echo "  • Auto-downloads modular architecture from repository"
    echo "  • Handles first-time installations and updates"
    echo "  • Validates module integrity after download"
    echo "  • Provides backup functionality for updates"
}

# Main bootstrap function
initialize_bootstrap() {
    bootstrap_log "Initializing bootstrap system..."
    
    # Check if git is available
    if ! command -v git >/dev/null 2>&1; then
        echo "❌ Git is required for bootstrap functionality"
        echo "Please install git: apt update && apt install -y git"
        return 1
    fi
    
    # Auto-bootstrap if needed
    if ! bootstrap_auto; then
        echo "❌ Bootstrap initialization failed"
        return 1
    fi
    
    bootstrap_log "Bootstrap system ready"
    return 0
}

# Export functions for use by main installer
export -f bootstrap_needed
export -f bootstrap_download_modules
export -f bootstrap_update_modules
export -f bootstrap_get_available_versions
export -f bootstrap_validate_modules
export -f bootstrap_auto
export -f bootstrap_info
export -f initialize_bootstrap 