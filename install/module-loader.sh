#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - MODULE LOADER v1.0.0
# =============================================================================
# 
# Central module loader for the Profolio installer modular architecture
# Handles dependency resolution and provides a single entry point for loading
# all required modules into existing installer scripts.
#
# Usage: source install/module-loader.sh
# =============================================================================

# Module loader info function
module_loader_info() {
    echo "Module Loader v1.0.0"
    echo "  • Loads all 12 installer modules with dependency resolution"
    echo "  • Provides unified entry point for modular architecture"
    echo "  • Maintains backward compatibility with existing scripts"
    echo "  • Handles platform detection and module routing"
}

# Check if this script is being sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Module Loader v1.0.0"
    echo "This script should be sourced, not executed directly."
    echo "Usage: source install/module-loader.sh"
    exit 1
fi

# Module loader configuration
MODULE_LOADER_VERSION="1.0.0"
MODULE_LOADER_DEBUG="${MODULE_LOADER_DEBUG:-false}"
MODULE_BASE_PATH="$(dirname "${BASH_SOURCE[0]}")"

# Track loaded modules with a simple list
LOADED_MODULES=""

# Module loading log function
module_log() {
    if [[ "$MODULE_LOADER_DEBUG" == "true" ]]; then
        echo "[MODULE] $1" >&2
    fi
}

# Check if module is already loaded
is_module_loaded() {
    local module_path="$1"
    echo "$LOADED_MODULES" | grep -q "$module_path"
}

# Safe module loading with dependency resolution
load_module() {
    local module_path="$1"
    local module_name="$(basename "$module_path" .sh)"
    
    # Check if already loaded
    if is_module_loaded "$module_path"; then
        module_log "Module already loaded: $module_path"
        return 0
    fi
    
    # Check if module exists
    local full_path="$MODULE_BASE_PATH/$module_path"
    if [[ ! -f "$full_path" ]]; then
        echo "ERROR: Module not found: $full_path" >&2
        return 1
    fi
    
    # Load the module
    module_log "Loading module: $module_path"
    if source "$full_path" 2>/dev/null; then
        LOADED_MODULES="$LOADED_MODULES $module_path"
        module_log "Successfully loaded: $module_path"
        return 0
    else
        echo "ERROR: Failed to load module: $module_path" >&2
        return 1
    fi
}

# Load modules in dependency order
load_all_modules() {
    module_log "Starting module loading sequence..."
    
    # Phase 1: Utility modules (dependencies for everything else)
    load_module "utils/logging.sh" || return 1
    load_module "utils/ui.sh" || return 1
    load_module "utils/validation.sh" || return 1
    load_module "utils/platform-detection.sh" || return 1
    
    # Phase 2: Core modules (depend on utilities)
    load_module "core/version-control.sh" || return 1
    load_module "core/rollback.sh" || return 1
    
    # Phase 3: Feature modules (depend on utilities and sometimes core)
    load_module "features/optimization.sh" || return 1
    load_module "features/ssh-hardening.sh" || return 1
    load_module "features/configuration-wizard.sh" || return 1
    
    # Phase 4: Platform modules (depend on utilities and platform detection)
    load_module "platforms/proxmox.sh" || return 1
    load_module "platforms/ubuntu.sh" || return 1
    load_module "platforms/docker.sh" || return 1
    
    module_log "All modules loaded successfully"
    return 0
}

# Initialize modular architecture
initialize_modular_architecture() {
    module_log "Initializing Profolio modular architecture..."
    
    # Try to load bootstrap system first
    if [[ -f "$MODULE_BASE_PATH/bootstrap.sh" ]]; then
        module_log "Loading bootstrap system..."
        source "$MODULE_BASE_PATH/bootstrap.sh"
        
        # Initialize bootstrap (downloads modules if needed)
        if ! initialize_bootstrap; then
            echo "ERROR: Bootstrap initialization failed" >&2
            return 1
        fi
    else
        module_log "Bootstrap system not found - assuming modules are present"
    fi
    
    # Load all modules
    if ! load_all_modules; then
        echo "ERROR: Failed to load modular architecture" >&2
        return 1
    fi
    
    # Detect current platform
    local platform_type
    if command -v get_platform_type >/dev/null 2>&1; then
        platform_type=$(get_platform_type)
        module_log "Platform detected: $platform_type"
    else
        echo "ERROR: Platform detection not available after module loading" >&2
        return 1
    fi
    
    # Set global variables for compatibility
    export MODULAR_ARCHITECTURE_LOADED="true"
    export CURRENT_PLATFORM="$platform_type"
    export MODULE_LOADER_VERSION="$MODULE_LOADER_VERSION"
    
    module_log "Modular architecture initialized successfully"
    return 0
}

# Get list of loaded modules
get_loaded_modules() {
    echo "Loaded modules:"
    for module in $LOADED_MODULES; do
        echo "  • $module"
    done
}

# Validate module functions are available
validate_module_functions() {
    local validation_functions=(
        # Utility functions
        "info" "success" "warn" "error"
        "ui_show_progress" "ui_show_banner"
        "validation_validate_version"
        "get_platform_type" "detect_proxmox_host"
        
        # Core functions
        "version_control_get_latest_version"
        "rollback_create_rollback_point"
        
        # Feature functions
        "optimization_deploy_safe"
        "ssh_configure_server"
        "config_run_installation_wizard"
        
        # Platform functions
        "handle_proxmox_installation"
        "handle_ubuntu_platform"
        "handle_docker_platform"
    )
    
    local missing_functions=()
    
    for func in "${validation_functions[@]}"; do
        if ! command -v "$func" >/dev/null 2>&1; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        module_log "All required functions available"
        return 0
    else
        echo "ERROR: Missing functions after module loading: ${missing_functions[*]}" >&2
        return 1
    fi
}

# Main initialization function
initialize_modules() {
    # Initialize the modular architecture
    if ! initialize_modular_architecture; then
        echo "ERROR: Modular architecture initialization failed" >&2
        return 1
    fi
    
    # Validate that all required functions are available
    if ! validate_module_functions; then
        echo "ERROR: Module function validation failed" >&2
        return 1
    fi
    
    module_log "Module loader initialization complete"
    return 0
}

# Compatibility aliases for existing installers
load_profolio_modules() {
    initialize_modules "$@"
}

source_modular_architecture() {
    initialize_modules "$@"
}

# Auto-initialize modules when this script is sourced
if ! initialize_modules; then
    echo "FATAL: Failed to initialize Profolio modular architecture" >&2
    echo "Please check that all module files are present and accessible." >&2
    return 1 2>/dev/null || exit 1
fi

# Success message
if [[ "$MODULE_LOADER_DEBUG" == "true" ]]; then
    echo "[MODULE] ✅ Profolio modular architecture loaded successfully"
    echo "[MODULE] Platform: $CURRENT_PLATFORM"
    echo "[MODULE] Modules: 12 loaded"
fi 