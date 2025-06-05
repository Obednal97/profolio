#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - ENHANCED UI MODULE
# =============================================================================
# Provides beautiful UI components including loading spinners, progress bars,
# clean output formatting, and animated status indicators
# =============================================================================

# Source common definitions
if [[ -f "${TEMP_DIR:-/tmp}/common/definitions.sh" ]]; then
    source "${TEMP_DIR:-/tmp}/common/definitions.sh"
fi

# UI State variables
UI_SPINNER_PID=""
UI_CURRENT_STEP=0
UI_TOTAL_STEPS=0

# Loading spinner characters
SPINNER_CHARS="⣾⣽⣻⢿⡿⣟⣯⣷"

# Progress indicators
PROGRESS_EMPTY="░"
PROGRESS_FILLED="█"
PROGRESS_WIDTH=50

# Enhanced logging with spinner support
ui_start_spinner() {
    local message="$1"
    local temp_file="/tmp/ui_spinner_$$"
    
    # Stop any existing spinner
    ui_stop_spinner
    
    echo -ne "${BLUE}${message}${NC} "
    
    # Start spinner in background
    {
        local i=0
        while true; do
            printf "\r${BLUE}${message}${NC} ${YELLOW}%s${NC}" "${SPINNER_CHARS:$i:1}"
            ((i = (i + 1) % ${#SPINNER_CHARS}))
            sleep 0.1
        done
    } &
    
    UI_SPINNER_PID=$!
    echo $UI_SPINNER_PID > "$temp_file"
}

ui_stop_spinner() {
    local status="${1:-success}"
    local temp_file="/tmp/ui_spinner_$$"
    
    if [[ -f "$temp_file" ]]; then
        local pid=$(cat "$temp_file")
        kill "$pid" 2>/dev/null
        rm -f "$temp_file"
    fi
    
    if [[ -n "$UI_SPINNER_PID" ]]; then
        kill "$UI_SPINNER_PID" 2>/dev/null
        UI_SPINNER_PID=""
    fi
    
    # Clear spinner line and show result
    printf "\r\033[K"
    
    case "$status" in
        "success")
            echo -e "${GREEN}✓${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}⚠${NC}"
            ;;
        "error")
            echo -e "${RED}✗${NC}"
            ;;
        *)
            echo -e "${GREEN}✓${NC}"
            ;;
    esac
}

# Enhanced progress tracking
ui_set_progress_steps() {
    UI_TOTAL_STEPS="$1"
    UI_CURRENT_STEP=0
}

ui_progress_step() {
    local message="$1"
    local show_spinner="${2:-true}"
    
    ((UI_CURRENT_STEP++))
    
    if [[ "$show_spinner" == "true" ]]; then
        ui_start_spinner "[$UI_CURRENT_STEP/$UI_TOTAL_STEPS] $message"
    else
        echo -e "${BLUE}[$UI_CURRENT_STEP/$UI_TOTAL_STEPS] $message${NC}"
    fi
}

ui_progress_complete() {
    local status="${1:-success}"
    local message="$2"
    
    ui_stop_spinner "$status"
    
    if [[ -n "$message" ]]; then
        case "$status" in
            "success")
                echo -e "${GREEN}$message${NC}"
                ;;
            "warning")
                echo -e "${YELLOW}$message${NC}"
                ;;
            "error")
                echo -e "${RED}$message${NC}"
                ;;
        esac
    fi
}

# Progress bar
ui_show_progress_bar() {
    local current="$1"
    local total="$2"
    local message="$3"
    
    local percentage=$((current * 100 / total))
    local filled_width=$((current * PROGRESS_WIDTH / total))
    local empty_width=$((PROGRESS_WIDTH - filled_width))
    
    local filled=$(printf "%.0s$PROGRESS_FILLED" $(seq 1 $filled_width))
    local empty=$(printf "%.0s$PROGRESS_EMPTY" $(seq 1 $empty_width))
    
    printf "\r${BLUE}%s${NC} [${GREEN}%s${GRAY}%s${NC}] ${WHITE}%d%%${NC}" \
           "$message" "$filled" "$empty" "$percentage"
}

# Clean section headers
ui_section_header() {
    local title="$1"
    local width=60
    
    echo ""
    echo -e "${WHITE}$(printf "%.${width}s" "$(printf "%*s" $(((${#title} + $width) / 2)) "$title")" | tr ' ' '─')${NC}"
    echo -e "${CYAN}$title${NC}"
    echo -e "${WHITE}$(printf "%.${width}s" "" | tr ' ' '─')${NC}"
    echo ""
}

# Status indicators
ui_status_line() {
    local status="$1"
    local message="$2"
    local detail="$3"
    
    case "$status" in
        "success"|"✓")
            echo -e "${GREEN}✓${NC} $message${GRAY}${detail:+ ($detail)}${NC}"
            ;;
        "warning"|"⚠")
            echo -e "${YELLOW}⚠${NC} $message${GRAY}${detail:+ ($detail)}${NC}"
            ;;
        "error"|"✗")
            echo -e "${RED}✗${NC} $message${GRAY}${detail:+ ($detail)}${NC}"
            ;;
        "info"|"ℹ")
            echo -e "${BLUE}ℹ${NC} $message${GRAY}${detail:+ ($detail)}${NC}"
            ;;
        "pending"|"○")
            echo -e "${GRAY}○${NC} $message${GRAY}${detail:+ ($detail)}${NC}"
            ;;
        *)
            echo -e "  $message${GRAY}${detail:+ ($detail)}${NC}"
            ;;
    esac
}

# Compact module download progress
ui_download_modules() {
    local modules=("$@")
    local total=${#modules[@]}
    
    ui_start_spinner "Downloading $total installer modules"
    
    # Simulate downloading (replace with actual download logic)
    for i in "${!modules[@]}"; do
        local module="${modules[$i]}"
        sleep 0.1  # Simulate download time
        
        # Update progress
        ui_show_progress_bar $((i + 1)) "$total" "Downloading modules"
    done
    
    ui_stop_spinner "success"
    echo ""
    ui_status_line "success" "All modules downloaded" "$total files"
}

# System information display
ui_show_system_info() {
    local platform="$1"
    local distro="$2"
    local status="$3"
    
    echo ""
    ui_status_line "info" "Platform detected" "$platform"
    ui_status_line "info" "Distribution" "$distro"
    ui_status_line "info" "Installation status" "$status"
    echo ""
}

# Installation summary
ui_installation_summary() {
    local server_ip="$1"
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     🎉 INSTALLATION COMPLETE!                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${WHITE}🌐 Your Profolio instance is ready!${NC}"
    echo ""
    echo -e "${WHITE}📍 Access URLs:${NC}"
    echo -e "   • ${GREEN}Frontend:${NC} http://${server_ip}:3000"
    echo -e "   • ${BLUE}Backend:${NC}  http://${server_ip}:3001"
    echo ""
    echo -e "${WHITE}🔧 Service Management:${NC}"
    echo -e "   • ${CYAN}Status:${NC}  systemctl status profolio-backend profolio-frontend"
    echo -e "   • ${CYAN}Logs:${NC}    journalctl -u profolio-backend -u profolio-frontend -f"
    echo -e "   • ${CYAN}Restart:${NC} systemctl restart profolio-backend profolio-frontend"
    echo ""
}

# Background task management
ui_run_background_task() {
    local task_command="$1"
    local task_name="$2"
    local temp_file="/tmp/ui_bg_task_$$"
    
    ui_start_spinner "$task_name"
    
    # Run command in background and capture output
    {
        eval "$task_command" >/dev/null 2>&1
        echo $? > "$temp_file"
    } &
    
    local task_pid=$!
    
    # Wait for completion
    wait $task_pid
    local exit_code=$(cat "$temp_file" 2>/dev/null || echo "1")
    rm -f "$temp_file"
    
    if [[ "$exit_code" == "0" ]]; then
        ui_stop_spinner "success"
        return 0
    else
        ui_stop_spinner "error"
        return 1
    fi
}

# Compact package installation display
ui_install_packages() {
    local package_type="$1"
    local package_count="$2"
    
    if [[ "$package_count" -gt 0 ]]; then
        ui_start_spinner "Installing $package_type ($package_count packages)"
        
        # This would be called from the actual package installation
        # The calling function should call ui_stop_spinner when done
    else
        ui_status_line "info" "No $package_type packages to install"
    fi
}

# Clean up UI state
ui_cleanup() {
    ui_stop_spinner 2>/dev/null
    # Clear any remaining temp files
    rm -f /tmp/ui_spinner_$$ /tmp/ui_bg_task_$$
}

# Set up cleanup trap
trap ui_cleanup EXIT

# Module metadata
UI_MODULE_VERSION="2.0.0"
UI_MODULE_DEPENDENCIES="common/definitions.sh"

# ==============================================================================
# DEPENDENCIES
# ==============================================================================

# Ensure logging module is available
if [[ "${LOGGING_MODULE_LOADED:-false}" != "true" ]]; then
    echo "⚠️  Warning: UI module requires logging module" >&2
fi

# ==============================================================================
# PROGRESS & SPINNER UTILITIES
# ==============================================================================

# Simple progress spinner - using basic ASCII characters for compatibility
SPINNER_CHARS="/-\|"
SPINNER_PID=""

# Simple spinner function that actually works
ui_show_spinner() {
    local message="$1"
    local pid="$2"
    local spin='-\|/'
    local i=0
    
    echo -n "$message "
    while kill -0 $pid 2>/dev/null; do
        i=$(((i+1) % 4))
        printf "\r$message ${spin:$i:1}"
        sleep 0.1
    done
    printf "\r$message ✓\n"
}

# Enhanced progress function with simple, working progress indication
ui_show_progress() {
    local step=$1
    local total=$2
    local message=$3
    local command="$4"
    
    printf "${BLUE}[$step/$total]${NC} $message"
    
    if [[ -n "$command" ]]; then
        # Run command in background and show spinner
        eval "$command" > /tmp/profolio_progress.log 2>&1 &
        local cmd_pid=$!
        
        # Simple ASCII spinner
        local spin='-\|/'
        local i=0
        while kill -0 $cmd_pid 2>/dev/null; do
            i=$(((i+1) % 4))
            printf "\r${BLUE}[$step/$total]${NC} $message ${spin:$i:1}"
            sleep 0.1
        done
        
        # Check if command succeeded
        wait $cmd_pid
        local exit_code=$?
        
        if [[ $exit_code -eq 0 ]]; then
            printf "\r${BLUE}[$step/$total]${NC} $message ${GREEN}✓${NC}\n"
            return 0
        else
            printf "\r${BLUE}[$step/$total]${NC} $message ${RED}✗${NC}\n"
            echo "${RED}Error details:${NC}"
            cat /tmp/profolio_progress.log
            return 1
        fi
    else
        printf "\n"
        return 0
    fi
}

# Multi-step execution with clean progress display
ui_execute_steps() {
    local main_message="$1"
    shift
    local steps=("$@")
    
    echo -e "${CYAN}🚀 $main_message${NC}"
    
    local step_count=$((${#steps[@]} / 2))
    local current_step=1
    
    for ((i=0; i<${#steps[@]}; i+=2)); do
        local step_msg="${steps[i]}"
        local step_cmd="${steps[i+1]}"
        
        if ! ui_show_progress "$current_step" "$step_count" "$step_msg" "$step_cmd"; then
            echo -e "${RED}❌ Failed: $step_msg${NC}"
            return 1
        fi
        
        ((current_step++))
    done
    
    echo -e "${GREEN}✅ $main_message completed successfully${NC}"
    return 0
}

# ==============================================================================
# BANNER & HEADER UTILITIES
# ==============================================================================

# Professional banner with border
ui_show_banner() {
    local title="$1"
    local subtitle="$2"
    local platform="${3:-}"
    
    # Set TERM if not already set to prevent clear command failures
    if [ -z "$TERM" ]; then
        export TERM=xterm
    fi
    
    # Only clear if we have a proper terminal
    if [ -t 1 ]; then
        clear 2>/dev/null || true
    fi
    
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           🚀 $(printf "%-48s" "$title") ║"
    if [[ -n "$subtitle" ]]; then
        echo "║         $(printf "%-52s" "$subtitle") ║"
    fi
    if [[ -n "$platform" ]]; then
        echo "║           🛡️  $(printf "%-46s" "$platform") ║"
    fi
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    if [[ -n "$platform" ]]; then
        echo -e "${CYAN}$platform${NC}"
    fi
    
    # Show rollback status
    if [ "${ROLLBACK_ENABLED:-true}" = true ]; then
        echo -e "${GREEN}✅ Rollback Protection Enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Rollback Protection Disabled${NC}"
    fi
    
    # Show target version if set
    if [ -n "${TARGET_VERSION:-}" ]; then
        echo -e "${PURPLE}🎯 Target Version: $TARGET_VERSION${NC}"
    fi
    echo ""
}

# Section divider
ui_section_divider() {
    local title="$1"
    echo ""
    echo -e "${CYAN}▶ $title${NC}"
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 ${#title}))${NC}"
}

# Subsection header
ui_subsection() {
    local title="$1"
    echo ""
    echo -e "${WHITE}◆ $title${NC}"
}

# Box around important messages
ui_message_box() {
    local message="$1"
    local type="${2:-info}"  # info, warning, error, success
    
    local color="$BLUE"
    local icon="ℹ️"
    
    case "$type" in
        "warning") color="$YELLOW"; icon="⚠️" ;;
        "error") color="$RED"; icon="❌" ;;
        "success") color="$GREEN"; icon="✅" ;;
    esac
    
    local length=${#message}
    local border_length=$((length + 6))
    
    echo ""
    echo -e "${color}$(printf '─%.0s' $(seq 1 $border_length))${NC}"
    echo -e "${color}│ $icon $message │${NC}"
    echo -e "${color}$(printf '─%.0s' $(seq 1 $border_length))${NC}"
    echo ""
}

# ==============================================================================
# INTERACTIVE USER INPUT
# ==============================================================================

# Enhanced input prompt with validation
ui_prompt() {
    local prompt="$1"
    local default="$2"
    local validation_fn="$3"  # Optional validation function
    local result
    
    while true; do
        if [[ -n "$default" ]]; then
            read -p "$prompt [$default]: " result
            result=${result:-$default}
        else
            read -p "$prompt: " result
        fi
        
        # If validation function provided, use it
        if [[ -n "$validation_fn" ]] && command -v "$validation_fn" >/dev/null 2>&1; then
            if $validation_fn "$result"; then
                echo "$result"
                return 0
            else
                echo -e "${RED}Invalid input. Please try again.${NC}" >&2
                continue
            fi
        else
            echo "$result"
            return 0
        fi
    done
}

# Yes/No confirmation with default
ui_confirm() {
    local prompt="$1"
    local default="${2:-y}"  # Default to 'y' if not specified
    local response
    
    while true; do
        read -p "$prompt (y/n) [$default]: " response
        response=${response:-$default}
        
        case "$response" in
            [Yy]|[Yy][Ee][Ss]) return 0 ;;
            [Nn]|[Nn][Oo]) return 1 ;;
            *) echo -e "${RED}Please answer yes or no.${NC}" >&2 ;;
        esac
    done
}

# Menu selection
ui_menu() {
    local title="$1"
    shift
    local options=("$@")
    local choice
    
    echo -e "${CYAN}$title${NC}"
    for i in "${!options[@]}"; do
        echo "  $((i+1))) ${options[i]}"
    done
    echo ""
    
    while true; do
        read -p "Select option [1]: " choice
        choice=${choice:-1}
        
        if [[ "$choice" =~ ^[0-9]+$ ]] && [[ $choice -ge 1 ]] && [[ $choice -le ${#options[@]} ]]; then
            echo $((choice-1))  # Return 0-based index
            return 0
        else
            echo -e "${RED}Invalid option. Please select 1-${#options[@]}.${NC}" >&2
        fi
    done
}

# ==============================================================================
# PROGRESS BARS & VISUAL FEEDBACK
# ==============================================================================

# Loading animation
ui_loading() {
    local message="$1"
    local duration="${2:-3}"
    local chars="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
    local end_time=$(($(date +%s) + duration))
    
    echo -n "$message "
    while [[ $(date +%s) -lt $end_time ]]; do
        for (( i=0; i<${#chars}; i++ )); do
            printf "\r$message ${chars:$i:1}"
            sleep 0.1
        done
    done
    printf "\r$message ✓\n"
}

# ==============================================================================
# WIZARD UTILITIES
# ==============================================================================

# Configuration summary display
ui_config_summary() {
    local title="$1"
    shift
    local configs=("$@")
    
    echo ""
    echo -e "${WHITE}📋 $title${NC}"
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 $((${#title} + 3))))${NC}"
    
    # Configs should be passed as "key:value" pairs
    for config in "${configs[@]}"; do
        local key="${config%%:*}"
        local value="${config#*:}"
        echo -e "${BLUE}$key:${NC} $value"
    done
    
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 $((${#title} + 3))))${NC}"
    echo ""
}

# ==============================================================================
# ALIASES FOR BACKWARD COMPATIBILITY
# ==============================================================================

# Maintain compatibility with existing installer code
show_spinner() { ui_show_spinner "$@"; }
show_progress() { ui_show_progress "$@"; }
execute_steps() { ui_execute_steps "$@"; }
show_banner() { ui_show_banner "$@"; }

# ==============================================================================
# MODULE INFORMATION
# ==============================================================================

# Display module info
ui_module_info() {
    echo "UI Module v$UI_MODULE_VERSION"
    echo "Provides: Progress indicators, banners, user input, menus"
    echo "Status: Loaded and ready"
} 