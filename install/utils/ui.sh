#!/bin/bash

# 🎨 UI Utilities Module
# ======================
# Provides progress indicators, spinners, and user interface helpers
# Used by all installer components for consistent UX

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

# Simple progress bar
ui_progress_bar() {
    local current="$1"
    local total="$2"
    local width="${3:-50}"
    local message="${4:-}"
    
    local percentage=$((current * 100 / total))
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r${BLUE}["
    printf "%*s" $filled | tr ' ' '█'
    printf "%*s" $empty | tr ' ' '░'
    printf "] %d%% ${NC}" $percentage
    
    if [[ -n "$message" ]]; then
        printf " %s" "$message"
    fi
    
    if [[ $current -eq $total ]]; then
        printf "\n"
    fi
}

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

# Module version and info
UI_MODULE_VERSION="1.0.0"
UI_MODULE_LOADED=true

# Display module info
ui_module_info() {
    echo "UI Module v$UI_MODULE_VERSION"
    echo "Provides: Progress indicators, banners, user input, menus"
    echo "Status: Loaded and ready"
} 