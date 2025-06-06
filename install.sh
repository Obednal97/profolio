#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER v1.11.17
# =============================================================================
# Fixed input handling issue where script exited before waiting for user input
# Added proper error handling around read commands to prevent early exit
# =============================================================================

set -eo pipefail

# Configuration (these will be loaded from common/definitions.sh)
INSTALLER_VERSION="1.11.17"
REPO_URL="https://raw.githubusercontent.com/Obednal97/profolio/main"
readonly TEMP_DIR="/tmp/profolio-installer-$$"
readonly LOG_FILE="/tmp/profolio-install.log"
readonly DEBUG_LOG="/tmp/profolio-installer-debug-$$.log"

# Enhanced debugging and diagnostics
INSTALLER_DEBUG="${INSTALLER_DEBUG:-false}"
VERBOSE_MODE="${VERBOSE_MODE:-false}"
ENABLE_DIAGNOSTICS="${ENABLE_DIAGNOSTICS:-true}"

# Diagnostic tracking arrays
declare -A MODULE_LOAD_STATUS
declare -A FUNCTION_AVAILABILITY 
declare -a DIAGNOSTIC_MESSAGES
declare -a ERROR_STACK
declare -a LOADING_TIMELINE