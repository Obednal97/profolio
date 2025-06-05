#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - COMMON DEFINITIONS v1.0.0
# =============================================================================
# 
# Centralized definitions for all installer modules
# Contains: Color variables, logging functions, common utilities
#
# This file should be sourced by ALL modules before any other operations
# =============================================================================

# Prevent multiple sourcing
if [[ -n "${PROFOLIO_DEFINITIONS_LOADED:-}" ]]; then
    return 0
fi
PROFOLIO_DEFINITIONS_LOADED=true

# ==============================================================================
# COLOR DEFINITIONS
# ==============================================================================
# IMPORTANT: Do NOT use 'readonly' as it causes scoping issues when re-sourcing

# Initialize colors based on terminal support
if [[ -t 1 ]] && [[ "${NO_COLOR:-}" != "true" ]]; then
    # Terminal supports colors
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    NC='\033[0m' # No Color
else
    # No color support or disabled
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    WHITE=''
    NC=''
fi

# Export colors for sub-shells
export RED GREEN YELLOW BLUE PURPLE CYAN WHITE NC

# ==============================================================================
# CORE LOGGING FUNCTIONS
# ==============================================================================
# These are the base logging functions used by all modules

# Info messages (blue)
info() {
    echo -e "${BLUE}[INFO]${NC} $*" >&2
}

# Success messages (green)
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" >&2
}

# Warning messages (yellow)
warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

# Error messages (red)
error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Debug messages (purple) - only shown if DEBUG=true
debug() {
    if [[ "${DEBUG:-false}" == "true" || "${INSTALLER_DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $*" >&2
    fi
}

# Log with timestamp
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*" >&2
}

# Export functions for sub-shells
export -f info success warn error debug log

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running as root
is_root() {
    [[ $EUID -eq 0 ]]
}

# Get distribution info
get_distro_info() {
    if [[ -f "/etc/os-release" ]]; then
        . /etc/os-release
        echo "${NAME:-Unknown} ${VERSION_ID:-}"
    else
        echo "Unknown Linux"
    fi
}

# Export utility functions
export -f command_exists is_root get_distro_info

# ==============================================================================
# COMMON VARIABLES
# ==============================================================================

# Installer paths
INSTALLER_VERSION="${INSTALLER_VERSION:-1.12.0}"
INSTALLER_ROOT="${INSTALLER_ROOT:-$(dirname "${BASH_SOURCE[0]}")/..}"
INSTALLER_LOG="${INSTALLER_LOG:-/var/log/profolio-install.log}"

# Repository information
REPO_URL="${REPO_URL:-https://raw.githubusercontent.com/Obednal97/profolio/main}"
REPO_CLONE_URL="${REPO_CLONE_URL:-https://github.com/Obednal97/profolio.git}"

# Export common variables
export INSTALLER_VERSION INSTALLER_ROOT INSTALLER_LOG REPO_URL REPO_CLONE_URL

# ==============================================================================
# MODULE SOURCING HELPER
# ==============================================================================

# Safe module sourcing that ensures definitions are available
source_module() {
    local module="$1"
    local module_path="${INSTALLER_ROOT}/${module}"
    
    if [[ -f "$module_path" ]]; then
        debug "Sourcing module: $module"
        # Ensure our definitions are available in the sourced module
        export PROFOLIO_DEFINITIONS_LOADED
        source "$module_path"
        return $?
    else
        error "Module not found: $module_path"
        return 1
    fi
}

export -f source_module

# ==============================================================================
# INITIALIZATION MESSAGE
# ==============================================================================

debug "Common definitions loaded successfully"
debug "Colors initialized: RED=$RED GREEN=$GREEN BLUE=$BLUE"
debug "Functions available: info, success, warn, error, debug, log"

# ==============================================================================
# MODULE METADATA
# ==============================================================================

DEFINITIONS_MODULE_VERSION="1.0.0"
DEFINITIONS_MODULE_LOADED=true 