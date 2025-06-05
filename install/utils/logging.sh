#!/bin/bash

# 🎨 Logging Utilities Module
# ===========================
# Provides standardized logging functions with color support
# Used by all installer components for consistent output

# ==============================================================================
# COLOR DEFINITIONS
# ==============================================================================

# Initialize colors for output - simplified for better compatibility
init_colors() {
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
}

# Auto-initialize colors when module is loaded
init_colors

# ==============================================================================
# CORE LOGGING FUNCTIONS
# ==============================================================================

# Simple info messages
logging_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Simple warning messages  
logging_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Simple error messages
logging_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Simple success messages
logging_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Debug messages (only shown if DEBUG=true)
logging_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${PURPLE}[DEBUG]${NC} $1" >&2
    fi
}

# ==============================================================================
# ENHANCED LOGGING FUNCTIONS
# ==============================================================================

# Info with timestamp
logging_info_ts() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] [INFO]${NC} $1"
}

# Warning with timestamp
logging_warn_ts() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] [WARN]${NC} $1"
}

# Error with timestamp
logging_error_ts() {
    echo -e "${RED}[$(date '+%H:%M:%S')] [ERROR]${NC} $1"
}

# Success with timestamp
logging_success_ts() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] [SUCCESS]${NC} $1"
}

# ==============================================================================
# SPECIAL LOGGING FUNCTIONS
# ==============================================================================

# Section headers
logging_section() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 ${#1}))${NC}"
}

# Subsection headers
logging_subsection() {
    echo ""
    echo -e "${WHITE}◆ $1${NC}"
}

# Banner messages
logging_banner() {
    local message="$1"
    local length=${#message}
    local border_length=$((length + 4))
    
    echo ""
    echo -e "${BLUE}$(printf '═%.0s' $(seq 1 $border_length))${NC}"
    echo -e "${BLUE}║ ${WHITE}$message${BLUE} ║${NC}"
    echo -e "${BLUE}$(printf '═%.0s' $(seq 1 $border_length))${NC}"
    echo ""
}

# Step progress indicators
logging_step() {
    local step="$1"
    local total="$2"
    local message="$3"
    
    echo -e "${BLUE}[$step/$total]${NC} $message"
}

# Indented messages (for sub-operations)
logging_indent() {
    echo -e "   ${1}"
}

# ==============================================================================
# SERVICE DOWNTIME TRACKING
# ==============================================================================

# Global variables for downtime tracking
SERVICE_DOWNTIME_START=""
SERVICE_DOWNTIME_END=""

# Track service downtime start
logging_start_service_downtime() {
    SERVICE_DOWNTIME_START=$(date +%s)
    logging_debug "Service downtime tracking started at: $SERVICE_DOWNTIME_START"
}

# Track service downtime end
logging_end_service_downtime() {
    if [ -n "$SERVICE_DOWNTIME_START" ]; then
        SERVICE_DOWNTIME_END=$(date +%s)
        logging_debug "Service downtime tracking ended at: $SERVICE_DOWNTIME_END"
    fi
}

# Calculate and display service downtime
logging_show_downtime() {
    if [[ -n "$SERVICE_DOWNTIME_START" && -n "$SERVICE_DOWNTIME_END" ]]; then
        local downtime=$((SERVICE_DOWNTIME_END - SERVICE_DOWNTIME_START))
        if [[ $downtime -gt 0 ]]; then
            logging_info "Service downtime: ${downtime} seconds"
        fi
    fi
}

# ==============================================================================
# ALIASES FOR BACKWARD COMPATIBILITY
# ==============================================================================

# Maintain compatibility with existing installer code
info() { logging_info "$@"; }
warn() { logging_warn "$@"; }
error() { logging_error "$@"; }
success() { logging_success "$@"; }
start_service_downtime() { logging_start_service_downtime "$@"; }
end_service_downtime() { logging_end_service_downtime "$@"; }

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

# Check if running in interactive terminal
logging_is_interactive() {
    [[ -t 0 && -t 1 ]]
}

# Check if colors are supported
logging_colors_supported() {
    [[ -t 1 ]]
}

# Disable colors (useful for log files)
logging_disable_colors() {
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    WHITE=''
    NC=''
}

# Re-enable colors
logging_enable_colors() {
    init_colors
}

# Log to file with timestamp (no colors)
logging_to_file() {
    local logfile="$1"
    local level="$2"
    local message="$3"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" >> "$logfile"
}

# ==============================================================================
# MODULE INFORMATION
# ==============================================================================

# Module version and info
LOGGING_MODULE_VERSION="1.0.0"
LOGGING_MODULE_LOADED=true

# Display module info
logging_module_info() {
    echo "Logging Module v$LOGGING_MODULE_VERSION"
    echo "Provides: Color output, logging functions, downtime tracking"
    echo "Status: Loaded and ready"
} 