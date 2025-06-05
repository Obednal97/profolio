#!/bin/bash
#
# Profolio Installer - Optimization Feature Module
# 
# This module provides production optimization functions for reducing deployment size
# and cleaning up development dependencies and files after installation.
#
# Version: 1.0.0
# Dependencies: utils/logging.sh, utils/ui.sh
# Compatible: Ubuntu/Debian, Proxmox LXC, Docker

# Module information
OPTIMIZATION_MODULE_VERSION="1.0.0"
OPTIMIZATION_MODULE_NAME="Production Optimization"
OPTIMIZATION_MODULE_DESCRIPTION="Safe and aggressive production optimizations for deployment size reduction"

# Module dependencies
OPTIMIZATION_DEPENDENCIES=(
    "utils/logging.sh"
    "utils/ui.sh"
)

# Verify dependencies are loaded
optimization_check_dependencies() {
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
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "ERROR: Missing dependencies for optimization module:"
        printf " - %s\n" "${missing_deps[@]}"
        return 1
    fi
    
    return 0
}

# Get module information
optimization_get_info() {
    echo "Module: $OPTIMIZATION_MODULE_NAME"
    echo "Version: $OPTIMIZATION_MODULE_VERSION"
    echo "Description: $OPTIMIZATION_MODULE_DESCRIPTION"
    echo "Dependencies: ${OPTIMIZATION_DEPENDENCIES[*]}"
}

# Main production optimization dispatcher
# Chooses between safe or aggressive optimization based on OPTIMIZATION_LEVEL variable
optimization_deploy_production() {
    if ! optimization_check_dependencies; then
        return 1
    fi
    
    info "🚀 Starting production optimization..."
    info "   Selected level: ${OPTIMIZATION_LEVEL:-safe}"
    
    if [[ "${OPTIMIZATION_LEVEL:-safe}" == "aggressive" ]]; then
        warn "⚠️  Applying AGGRESSIVE optimization (maximum space reduction)"
        optimization_deploy_aggressive
    else
        info "✅ Applying SAFE optimization (recommended)"
        optimization_deploy_safe
    fi
}

# Safe production optimization - only removes actual devDependencies from package.json
# This method precisely removes packages listed in devDependencies while preserving
# all production functionality and debugging capabilities
optimization_deploy_safe() {
    if ! optimization_check_dependencies; then
        return 1
    fi
    
    info "🛡️  SAFE production optimization (precise selective removal)..."
    
    # Backend: Remove only packages that are in devDependencies
    info "  → Backend: Removing packages listed in devDependencies..."
    if ! cd /opt/profolio/backend; then
        error "Could not access backend directory"
        return 1
    fi
    
    # Extract devDependencies from package.json and remove them
    if [[ -f "package.json" ]]; then
        # Get list of devDependencies (excluding ones needed for runtime)
        local backend_dev_packages
        backend_dev_packages=$(node -e "
            const pkg = require('./package.json');
            const devDeps = pkg.devDependencies || {};
            // Keep essential packages even if in devDependencies
            const keep = ['prisma']; // Keep prisma for potential runtime needs
            const toRemove = Object.keys(devDeps).filter(dep => !keep.includes(dep));
            console.log(toRemove.join(' '));
        " 2>/dev/null || echo "")
        
        if [[ -n "$backend_dev_packages" ]]; then
            for package in $backend_dev_packages; do
                sudo -u profolio pnpm remove "$package" --silent 2>/dev/null || true
            done
            success "  ✅ Backend: Removed devDependencies: $backend_dev_packages"
        else
            success "  ✅ Backend: No devDependencies to remove"
        fi
    fi
    
    # Frontend: Remove only packages that are in devDependencies  
    info "  → Frontend: Removing packages listed in devDependencies..."
    if ! cd /opt/profolio/frontend; then
        error "Could not access frontend directory"
        return 1
    fi
    
    # Extract devDependencies from package.json and remove them
    if [[ -f "package.json" ]]; then
        # Get list of devDependencies (excluding ones needed for runtime)
        local frontend_dev_packages
        frontend_dev_packages=$(node -e "
            const pkg = require('./package.json');
            const devDeps = pkg.devDependencies || {};
            // Keep essential packages even if in devDependencies (none needed for frontend)
            const keep = [];
            const toRemove = Object.keys(devDeps).filter(dep => !keep.includes(dep));
            console.log(toRemove.join(' '));
        " 2>/dev/null || echo "")
        
        if [[ -n "$frontend_dev_packages" ]]; then
            for package in $frontend_dev_packages; do
                sudo -u profolio pnpm remove "$package" --silent 2>/dev/null || true
            done
            success "  ✅ Frontend: Removed devDependencies: $frontend_dev_packages"
        else
            success "  ✅ Frontend: No devDependencies to remove"
        fi
    fi
    
    # Basic cleanup only
    info "  → Basic cleanup (caches and temporary files)..."
    sudo -u profolio rm -rf frontend/.next/cache backend/node_modules/.cache 2>/dev/null || true
    sudo -u profolio rm -rf frontend/node_modules/.cache backend/.npm 2>/dev/null || true
    sudo -u profolio pnpm store prune 2>/dev/null || true
    
    # Calculate and show results
    if ! cd /opt/profolio; then
        error "Could not access profolio directory"
        return 1
    fi
    
    local final_size frontend_nm_size backend_nm_size
    final_size=$(du -sh . 2>/dev/null | cut -f1 || echo "unknown")
    frontend_nm_size=$(du -sh frontend/node_modules 2>/dev/null | cut -f1 || echo "unknown")
    backend_nm_size=$(du -sh backend/node_modules 2>/dev/null | cut -f1 || echo "unknown")
    
    success "✅ SAFE production optimization completed"
    info "    Final application size: $final_size"
    info "    Frontend node_modules: $frontend_nm_size"
    info "    Backend node_modules: $backend_nm_size"
    info "    Optimization level: SAFE (all features preserved)"
}

# Aggressive production optimization - applies ultra-aggressive cleanup
# This method performs Docker-style optimization removing test files, documentation,
# source maps, examples, platform-specific binaries, and large assets
optimization_deploy_aggressive() {
    if ! optimization_check_dependencies; then
        return 1
    fi
    
    info "☢️  AGGRESSIVE production optimization (ultra-aggressive cleanup)..."
    
    # First do safe optimization
    info "  → Step 1: Safe removal of devDependencies..."
    optimization_deploy_safe
    
    if ! cd /opt/profolio; then
        error "Could not access profolio directory"
        return 1
    fi
    
    # Ultra-aggressive cleanup
    info "  → Step 2: Ultra-aggressive cleanup (Docker-style optimization)..."
    
    # Remove duplicate packages and deduplicate node_modules
    info "    • Deduplicating node_modules..."
    cd frontend && sudo -u profolio pnpm install --frozen-lockfile 2>/dev/null || true
    cd ../backend && sudo -u profolio pnpm install --frozen-lockfile 2>/dev/null || true
    cd ..
    
    # Remove source maps and debug files
    info "    • Removing source maps and debug files..."
    sudo -u profolio find . -name "*.map" -delete 2>/dev/null || true
    sudo -u profolio find . -name "*.d.ts.map" -delete 2>/dev/null || true
    sudo -u profolio find . -name "tsconfig.tsbuildinfo" -delete 2>/dev/null || true
    
    # Remove test files and documentation
    info "    • Removing test files and documentation..."
    sudo -u profolio find ./node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.test.js" -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.spec.js" -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "README*" -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "CHANGELOG*" -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.md" -delete 2>/dev/null || true
    
    # Remove example and demo files
    info "    • Removing examples and demo files..."
    sudo -u profolio find ./node_modules -name "example*" -type d -exec rm -rf {} + 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "demo*" -type d -exec rm -rf {} + 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "sample*" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove platform-specific binaries for other architectures
    info "    • Removing platform-specific binaries..."
    local current_arch
    current_arch=$(uname -m)
    if [[ "$current_arch" == "x86_64" ]]; then
        # Remove ARM binaries if we're on x86_64
        sudo -u profolio find ./node_modules -path "*/prebuilds/linux-arm*" -exec rm -rf {} + 2>/dev/null || true
        sudo -u profolio find ./node_modules -path "*/prebuilds/darwin-*" -exec rm -rf {} + 2>/dev/null || true
        sudo -u profolio find ./node_modules -path "*/prebuilds/win32-*" -exec rm -rf {} + 2>/dev/null || true
    fi
    
    # Remove unnecessary locale files
    info "    • Removing unnecessary locale files..."
    sudo -u profolio find ./node_modules -path "*/locales/*" ! -name "en*" -delete 2>/dev/null || true
    
    # Remove font files that aren't being used
    info "    • Cleaning up unused font files..."
    sudo -u profolio find ./node_modules -name "*.woff" -size +100k -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.woff2" -size +100k -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.ttf" -size +100k -delete 2>/dev/null || true
    
    # Remove large image files in node_modules
    info "    • Removing large image files..."
    sudo -u profolio find ./node_modules -name "*.png" -size +50k -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.jpg" -size +50k -delete 2>/dev/null || true
    sudo -u profolio find ./node_modules -name "*.jpeg" -size +50k -delete 2>/dev/null || true
    
    # Aggressive cache cleanup
    info "    • Aggressive cache and temporary file cleanup..."
    sudo -u profolio rm -rf frontend/.next/trace frontend/.next/static/chunks/*.map 2>/dev/null || true
    sudo -u profolio rm -rf backend/dist/*.map backend/.tsbuildinfo 2>/dev/null || true
    sudo -u profolio rm -rf ~/.npm ~/.cache/npm ~/.config/npm 2>/dev/null || true
    sudo -u profolio find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
    sudo -u profolio find . -name "*.log" -delete 2>/dev/null || true
    
    # Final calculations and warnings
    local final_size frontend_nm_size backend_nm_size
    final_size=$(du -sh . 2>/dev/null | cut -f1 || echo "unknown")
    frontend_nm_size=$(du -sh frontend/node_modules 2>/dev/null | cut -f1 || echo "unknown")
    backend_nm_size=$(du -sh backend/node_modules 2>/dev/null | cut -f1 || echo "unknown")
    
    success "✅ AGGRESSIVE production optimization completed"
    warn "    Final application size: $final_size"
    warn "    Frontend node_modules: $frontend_nm_size"  
    warn "    Backend node_modules: $backend_nm_size"
    warn "    Optimization level: AGGRESSIVE (debugging capabilities reduced)"
    echo ""
    echo -e "${YELLOW}⚠️  AGGRESSIVE OPTIMIZATION APPLIED${NC}"
    echo -e "${RED}Note: Some debugging and development capabilities have been removed${NC}"
    echo -e "${RED}If you encounter issues, consider reinstalling with safe optimization${NC}"
}

# Calculate optimization savings
optimization_calculate_savings() {
    if ! optimization_check_dependencies; then
        return 1
    fi
    
    if [[ ! -d "/opt/profolio" ]]; then
        error "Profolio installation not found"
        return 1
    fi
    
    local current_size
    current_size=$(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")
    
    info "📊 Current installation size: $current_size"
    
    if [[ -d "/opt/profolio/frontend/node_modules" ]]; then
        local frontend_size
        frontend_size=$(du -sh /opt/profolio/frontend/node_modules 2>/dev/null | cut -f1 || echo "unknown")
        info "   Frontend node_modules: $frontend_size"
    fi
    
    if [[ -d "/opt/profolio/backend/node_modules" ]]; then
        local backend_size
        backend_size=$(du -sh /opt/profolio/backend/node_modules 2>/dev/null | cut -f1 || echo "unknown")
        info "   Backend node_modules: $backend_size"
    fi
}

# Estimate potential savings from optimization
optimization_estimate_savings() {
    if ! optimization_check_dependencies; then
        return 1
    fi
    
    if [[ ! -d "/opt/profolio" ]]; then
        error "Profolio installation not found"
        return 1
    fi
    
    info "📈 Estimating optimization savings..."
    
    local dev_deps_size test_files_size doc_files_size
    
    # Estimate devDependencies size (backend)
    if [[ -f "/opt/profolio/backend/package.json" ]]; then
        local backend_dev_packages
        backend_dev_packages=$(node -e "
            const pkg = require('/opt/profolio/backend/package.json');
            const devDeps = pkg.devDependencies || {};
            console.log(Object.keys(devDeps).length);
        " 2>/dev/null || echo "0")
        info "   Backend devDependencies: $backend_dev_packages packages"
    fi
    
    # Estimate devDependencies size (frontend)
    if [[ -f "/opt/profolio/frontend/package.json" ]]; then
        local frontend_dev_packages
        frontend_dev_packages=$(node -e "
            const pkg = require('/opt/profolio/frontend/package.json');
            const devDeps = pkg.devDependencies || {};
            console.log(Object.keys(devDeps).length);
        " 2>/dev/null || echo "0")
        info "   Frontend devDependencies: $frontend_dev_packages packages"
    fi
    
    # Estimate test files
    test_files_size=$(find /opt/profolio -name "*test*" -o -name "*spec*" | wc -l 2>/dev/null || echo "0")
    info "   Test files found: $test_files_size files"
    
    # Estimate documentation files
    doc_files_size=$(find /opt/profolio -name "*.md" -o -name "README*" -o -name "CHANGELOG*" | wc -l 2>/dev/null || echo "0")
    info "   Documentation files: $doc_files_size files"
    
    info ""
    info "💡 Optimization will:"
    info "   SAFE: Remove devDependencies, basic cache cleanup"
    info "   AGGRESSIVE: Additional removal of tests, docs, source maps, examples"
}

# Backward compatibility aliases
optimize_production_deployment() { optimization_deploy_production "$@"; }
optimize_production_safe() { optimization_deploy_safe "$@"; }
optimize_production_aggressive() { optimization_deploy_aggressive "$@"; }

# Module initialization check
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Profolio Installer - Optimization Feature Module v$OPTIMIZATION_MODULE_VERSION"
    echo "This module should be sourced, not executed directly."
    exit 1
fi 