#!/bin/bash

# 🔄 Version Control Module
# =========================
# Handles software versioning, GitHub API interactions, and git operations
# Used by installer components for version management

# ==============================================================================
# DEPENDENCIES
# ==============================================================================

# Ensure required modules are available
if [[ "${LOGGING_MODULE_LOADED:-false}" != "true" ]]; then
    echo "⚠️  Warning: Version control module requires logging module" >&2
fi

if [[ "${VALIDATION_MODULE_LOADED:-false}" != "true" ]]; then
    echo "⚠️  Warning: Version control module requires validation module" >&2
fi

# ==============================================================================
# GLOBAL VARIABLES
# ==============================================================================

# GitHub API configuration
GITHUB_REPO_OWNER="Obednal97"
GITHUB_REPO_NAME="profolio"
GITHUB_API_BASE="https://api.github.com/repos/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME"

# Version control state
ROLLBACK_ENABLED="${ROLLBACK_ENABLED:-true}"
ROLLBACK_COMMIT=""
ROLLBACK_BACKUP_DIR=""
TARGET_VERSION=""
FORCE_VERSION=false

# Installation paths
INSTALL_PATH="${INSTALL_PATH:-/opt/profolio}"
PROFOLIO_USER="${PROFOLIO_USER:-profolio}"

# ==============================================================================
# VERSION LISTING & DISCOVERY
# ==============================================================================

# Get available versions from GitHub
version_control_get_available_versions() {
    logging_info "Fetching available versions..."
    
    # Get all release tags from GitHub API
    local versions=$(curl -s --connect-timeout 10 --max-time 30 \
        "$GITHUB_API_BASE/releases" | \
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
        logging_warn "Could not fetch version list from GitHub"
        echo -e "${CYAN}📋 Common versions:${NC}"
        echo "   • v1.10.3 (latest stable)"
        echo "   • v1.10.2"
        echo "   • v1.10.1"
        echo "   • main (latest development)"
        echo ""
        return 1
    fi
}

# Get latest stable version from GitHub
version_control_get_latest_version() {
    local latest=$(curl -s --connect-timeout 10 --max-time 30 \
        "$GITHUB_API_BASE/releases/latest" | \
        grep '"tag_name"' | \
        cut -d'"' -f4 2>/dev/null || echo "")
    
    if [[ -n "$latest" ]]; then
        echo "$latest"
        return 0
    else
        echo "v1.10.3"  # Fallback to known stable version
        return 1
    fi
}

# Check if version exists on GitHub
version_control_version_exists() {
    local version="$1"
    
    # Critical: Input validation for production reliability
    if [[ -z "$version" ]]; then
        return 1  # Fail silently for empty input
    fi
    
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
    
    # Check if tag exists on GitHub (suppress errors for clean output)
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 \
        "$GITHUB_API_BASE/releases/tags/$version" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
        return 0
    else
        # Fallback: check if it exists as a git tag (suppress errors)
        if git ls-remote --tags origin 2>/dev/null | grep -q "refs/tags/$version$"; then
            return 0
        else
            return 1
        fi
    fi
}

# Get version information (release notes, date, etc.)
version_control_get_version_info() {
    local version="$1"
    
    # Normalize version
    if [[ ! "$version" =~ ^v ]] && [[ "$version" != "main" ]] && [[ "$version" != "latest" ]]; then
        version="v$version"
    fi
    
    if [[ "$version" == "main" ]] || [[ "$version" == "latest" ]]; then
        echo "Development version - latest features and fixes"
        return 0
    fi
    
    local info=$(curl -s --connect-timeout 10 --max-time 30 \
        "$GITHUB_API_BASE/releases/tags/$version" 2>/dev/null)
    
    if [[ -n "$info" ]]; then
        local published_date=$(echo "$info" | grep '"published_at"' | cut -d'"' -f4 | cut -d'T' -f1)
        local release_notes=$(echo "$info" | grep '"body"' | cut -d'"' -f4 | head -1)
        
        echo "Released: $published_date"
        if [[ -n "$release_notes" ]]; then
            echo "Notes: $release_notes"
        fi
        return 0
    else
        return 1
    fi
}

# ==============================================================================
# GIT OPERATIONS
# ==============================================================================

# Checkout specific version
version_control_checkout_version() {
    local version="$1"
    
    if [ -z "$version" ] || [ "$version" = "main" ] || [ "$version" = "latest" ]; then
        logging_info "Using latest development version (main branch)"
        version="main"
    else
        # Normalize version (add 'v' prefix if not present)
        if [[ ! "$version" =~ ^v ]]; then
            version="v$version"
        fi
        
        logging_info "Switching to version: $version"
    fi
    
    cd "$INSTALL_PATH"
    
    # Fetch latest refs
    if ! sudo -u "$PROFOLIO_USER" git fetch origin; then
        logging_error "Failed to fetch latest updates from repository"
        return 1
    fi
    
    # Checkout the specified version
    if [ "$version" = "main" ]; then
        # Fetch latest changes first
        if ! sudo -u "$PROFOLIO_USER" git fetch origin main; then
            logging_error "Failed to fetch latest main branch"
            return 1
        fi
        
        # Checkout main and reset to match remote exactly
        if sudo -u "$PROFOLIO_USER" git checkout main && sudo -u "$PROFOLIO_USER" git reset --hard origin/main; then
            # Optimize installation size by removing non-essential directories (version checkout)
            logging_info "Optimizing installation size..."
            rm -rf docs/ .github/ www/ policies/ scripts/ .cursor/ || true
            rm -f CONTRIBUTING.md SECURITY.md README.md .DS_Store || true
            logging_success "Installation optimized (removed documentation and development files)"
            
            logging_success "Switched to main branch (latest development)"
            return 0
        else
            logging_error "Failed to checkout main branch"
            return 1
        fi
    else
        if sudo -u "$PROFOLIO_USER" git checkout "tags/$version"; then
            logging_success "Switched to version: $version"
            return 0
        else
            logging_error "Failed to checkout version: $version"
            return 1
        fi
    fi
}

# Get current version
version_control_get_current_version() {
    if [[ ! -d "$INSTALL_PATH/.git" ]]; then
        echo "unknown"
        return 1
    fi
    
    cd "$INSTALL_PATH"
    
    # Check if we're on a tagged commit
    local tag=$(git describe --exact-match --tags HEAD 2>/dev/null || echo "")
    
    if [[ -n "$tag" ]]; then
        echo "$tag"
        return 0
    fi
    
    # Check if we're on main branch
    local branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [[ "$branch" == "main" ]]; then
        echo "main"
        return 0
    fi
    
    # Get short commit hash
    local commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "$commit"
    return 0
}

# Check if git repository is dirty (has uncommitted changes)
version_control_is_dirty() {
    if [[ ! -d "$INSTALL_PATH/.git" ]]; then
        return 1
    fi
    
    cd "$INSTALL_PATH"
    ! git diff-index --quiet HEAD --
}

# ==============================================================================
# VERSION COMPARISON
# ==============================================================================

# Compare two semantic versions (returns: -1, 0, 1)
version_control_compare_versions() {
    local version1="$1"
    local version2="$2"
    
    # Normalize versions (remove 'v' prefix)
    version1=${version1#v}
    version2=${version2#v}
    
    # Handle special cases
    if [[ "$version1" == "main" ]] || [[ "$version1" == "latest" ]]; then
        echo "1"
        return 0
    fi
    
    if [[ "$version2" == "main" ]] || [[ "$version2" == "latest" ]]; then
        echo "-1"
        return 0
    fi
    
    # Split versions into components
    IFS='.' read -ra v1_parts <<< "$version1"
    IFS='.' read -ra v2_parts <<< "$version2"
    
    # Pad arrays to same length
    while [[ ${#v1_parts[@]} -lt 3 ]]; do v1_parts+=("0"); done
    while [[ ${#v2_parts[@]} -lt 3 ]]; do v2_parts+=("0"); done
    
    # Compare each component
    for i in {0..2}; do
        if [[ ${v1_parts[i]} -gt ${v2_parts[i]} ]]; then
            echo "1"
            return 0
        elif [[ ${v1_parts[i]} -lt ${v2_parts[i]} ]]; then
            echo "-1"
            return 0
        fi
    done
    
    echo "0"
    return 0
}

# Check if version update is available
version_control_update_available() {
    local current_version=$(version_control_get_current_version)
    local latest_version=$(version_control_get_latest_version)
    
    if [[ "$current_version" == "main" ]]; then
        # On main branch, check for newer commits
        cd "$INSTALL_PATH"
        sudo -u "$PROFOLIO_USER" git fetch origin main >/dev/null 2>&1
        local local_commit=$(git rev-parse HEAD)
        local remote_commit=$(git rev-parse origin/main)
        
        if [[ "$local_commit" != "$remote_commit" ]]; then
            echo "main"
            return 0
        else
            return 1
        fi
    else
        # On tagged version, compare with latest release
        local comparison=$(version_control_compare_versions "$current_version" "$latest_version")
        if [[ "$comparison" == "-1" ]]; then
            echo "$latest_version"
            return 0
        else
            return 1
        fi
    fi
}

# ==============================================================================
# DOWNLOAD & DEPLOYMENT
# ==============================================================================

# Download and extract release archive
version_control_download_release() {
    local version="$1"
    local target_dir="$2"
    
    # Normalize version
    if [[ ! "$version" =~ ^v ]] && [[ "$version" != "main" ]]; then
        version="v$version"
    fi
    
    if [[ "$version" == "main" ]]; then
        # Clone/pull main branch
        if [[ ! -d "$target_dir/.git" ]]; then
            logging_info "Cloning main branch..."
            git clone -b main "https://github.com/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME.git" "$target_dir"
        else
            logging_info "Updating main branch..."
            cd "$target_dir"
            git fetch origin main && git reset --hard origin/main
        fi
    else
        # Download release archive
        local archive_url="$GITHUB_API_BASE/archive/refs/tags/$version.tar.gz"
        local temp_file="/tmp/profolio-$version.tar.gz"
        
        logging_info "Downloading $version from GitHub..."
        if curl -L -o "$temp_file" "$archive_url"; then
            logging_info "Extracting archive..."
            mkdir -p "$target_dir"
            tar -xzf "$temp_file" -C "$target_dir" --strip-components=1
            rm -f "$temp_file"
            logging_success "Version $version downloaded and extracted"
        else
            logging_error "Failed to download version $version"
            return 1
        fi
    fi
    
    return 0
}

# ==============================================================================
# ALIASES FOR BACKWARD COMPATIBILITY
# ==============================================================================

# Maintain compatibility with existing installer code
get_available_versions() { version_control_get_available_versions "$@"; }
version_exists() { version_control_version_exists "$@"; }
checkout_version() { version_control_checkout_version "$@"; }

# ==============================================================================
# MODULE INFORMATION
# ==============================================================================

# Module version and info
VERSION_CONTROL_MODULE_VERSION="1.0.0"
VERSION_CONTROL_MODULE_LOADED=true

# Display module info
version_control_module_info() {
    echo "Version Control Module v$VERSION_CONTROL_MODULE_VERSION"
    echo "Provides: GitHub API integration, git operations, version management"
    echo "Status: Loaded and ready"
} 