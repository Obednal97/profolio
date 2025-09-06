#!/bin/bash

# TUI Functions Library for Profolio Installer
# Provides whiptail/dialog based Terminal User Interface

# ===========================
# TUI Detection and Setup
# ===========================

export TUI_AVAILABLE=false
export TUI_TOOL=""
export TUI_HEIGHT=20
export TUI_WIDTH=70

# Detect TUI tool availability
detect_tui() {
    if command -v whiptail >/dev/null 2>&1; then
        TUI_AVAILABLE=true
        TUI_TOOL="whiptail"
    elif command -v dialog >/dev/null 2>&1; then
        TUI_AVAILABLE=true
        TUI_TOOL="dialog"
    fi
    
    # Auto-adjust dimensions based on terminal size
    if [ "$TUI_AVAILABLE" = true ]; then
        local term_height=$(tput lines 2>/dev/null || echo 24)
        local term_width=$(tput cols 2>/dev/null || echo 80)
        
        # Use 80% of terminal size, with minimums
        TUI_HEIGHT=$((term_height * 8 / 10))
        TUI_WIDTH=$((term_width * 8 / 10))
        
        # Enforce minimums
        [ $TUI_HEIGHT -lt 15 ] && TUI_HEIGHT=15
        [ $TUI_WIDTH -lt 60 ] && TUI_WIDTH=60
        
        # Enforce maximums for readability
        [ $TUI_HEIGHT -gt 30 ] && TUI_HEIGHT=30
        [ $TUI_WIDTH -gt 80 ] && TUI_WIDTH=80
    fi
}

# Install TUI tool if not available
install_tui() {
    if [ "$TUI_AVAILABLE" = false ]; then
        echo "Installing terminal UI components..."
        if [ -f /etc/debian_version ]; then
            apt-get update >/dev/null 2>&1
            apt-get install -y whiptail >/dev/null 2>&1
        elif [ -f /etc/redhat-release ]; then
            yum install -y newt >/dev/null 2>&1
        elif [ -f /etc/alpine-release ]; then
            apk add --no-cache newt >/dev/null 2>&1
        fi
        
        # Re-detect after installation
        detect_tui
    fi
}

# ===========================
# TUI Wrapper Functions
# ===========================

# Display a message box
tui_msgbox() {
    local title="$1"
    local message="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        $TUI_TOOL --title "$title" --msgbox "$message" $TUI_HEIGHT $TUI_WIDTH
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        read -p "Press Enter to continue..."
    fi
}

# Display an info box (non-blocking)
tui_infobox() {
    local title="$1"
    local message="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        $TUI_TOOL --title "$title" --infobox "$message" 8 $TUI_WIDTH
    else
        echo ""
        echo "[$title] $message"
    fi
}

# Display a yes/no dialog
tui_yesno() {
    local title="$1"
    local message="$2"
    local default="${3:-yes}"  # Default to yes if not specified
    
    if [ "$TUI_AVAILABLE" = true ]; then
        if [ "$default" = "no" ]; then
            $TUI_TOOL --title "$title" --defaultno --yesno "$message" $((TUI_HEIGHT / 2)) $TUI_WIDTH
        else
            $TUI_TOOL --title "$title" --yesno "$message" $((TUI_HEIGHT / 2)) $TUI_WIDTH
        fi
        return $?
    else
        echo ""
        local prompt="$message (y/n)"
        [ "$default" = "yes" ] && prompt="$message (Y/n)"
        [ "$default" = "no" ] && prompt="$message (y/N)"
        
        read -p "$prompt: " response
        if [ -z "$response" ]; then
            [ "$default" = "yes" ] && return 0 || return 1
        fi
        [[ "$response" =~ ^[Yy] ]] && return 0 || return 1
    fi
}

# Display a menu
tui_menu() {
    local title="$1"
    local message="$2"
    shift 2
    local options=("$@")
    
    if [ "$TUI_AVAILABLE" = true ]; then
        local menu_items=()
        for i in "${!options[@]}"; do
            # Parse option format: "tag|description"
            IFS='|' read -r tag desc <<< "${options[$i]}"
            menu_items+=("$tag" "$desc")
        done
        
        choice=$($TUI_TOOL --title "$title" --menu "$message" $TUI_HEIGHT $TUI_WIDTH $((${#options[@]} + 2)) \
            "${menu_items[@]}" 3>&1 1>&2 2>&3)
        echo "$choice"
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        for i in "${!options[@]}"; do
            IFS='|' read -r tag desc <<< "${options[$i]}"
            echo "$tag) $desc"
        done
        echo ""
        read -p "Select option: " choice
        echo "$choice"
    fi
}

# Display an input box
tui_inputbox() {
    local title="$1"
    local message="$2"
    local default="$3"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        result=$($TUI_TOOL --title "$title" --inputbox "$message" $((TUI_HEIGHT / 2)) $TUI_WIDTH "$default" 3>&1 1>&2 2>&3)
        echo "$result"
    else
        echo ""
        read -p "$message [$default]: " result
        echo "${result:-$default}"
    fi
}

# Display a password box
tui_passwordbox() {
    local title="$1"
    local message="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        result=$($TUI_TOOL --title "$title" --passwordbox "$message" $((TUI_HEIGHT / 2)) $TUI_WIDTH 3>&1 1>&2 2>&3)
        echo "$result"
    else
        echo ""
        read -s -p "$message: " result
        echo ""
        echo "$result"
    fi
}

# Display a progress gauge
tui_gauge() {
    local title="$1"
    local message="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        $TUI_TOOL --title "$title" --gauge "$message" 8 $TUI_WIDTH 0
    else
        # For non-TUI, we'll handle progress differently
        cat
    fi
}

# Display a checklist
tui_checklist() {
    local title="$1"
    local message="$2"
    shift 2
    local options=("$@")
    
    if [ "$TUI_AVAILABLE" = true ]; then
        local checklist_items=()
        for item in "${options[@]}"; do
            # Parse format: "tag|description|status"
            IFS='|' read -r tag desc status <<< "$item"
            checklist_items+=("$tag" "$desc" "$status")
        done
        
        choices=$($TUI_TOOL --title "$title" --checklist "$message" $TUI_HEIGHT $TUI_WIDTH $((${#options[@]} + 2)) \
            "${checklist_items[@]}" 3>&1 1>&2 2>&3)
        echo "$choices"
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        local selected=()
        for item in "${options[@]}"; do
            IFS='|' read -r tag desc status <<< "$item"
            local prompt="$desc"
            [ "$status" = "ON" ] && prompt="$desc (default: yes)" || prompt="$desc (default: no)"
            
            read -p "$prompt (y/n): " response
            if [[ "$response" =~ ^[Yy] ]] || ([ -z "$response" ] && [ "$status" = "ON" ]); then
                selected+=("$tag")
            fi
        done
        echo "${selected[@]}"
    fi
}

# Display a radiolist
tui_radiolist() {
    local title="$1"
    local message="$2"
    shift 2
    local options=("$@")
    
    if [ "$TUI_AVAILABLE" = true ]; then
        local radio_items=()
        for item in "${options[@]}"; do
            # Parse format: "tag|description|status"
            IFS='|' read -r tag desc status <<< "$item"
            radio_items+=("$tag" "$desc" "$status")
        done
        
        choice=$($TUI_TOOL --title "$title" --radiolist "$message" $TUI_HEIGHT $TUI_WIDTH $((${#options[@]} + 2)) \
            "${radio_items[@]}" 3>&1 1>&2 2>&3)
        echo "$choice"
    else
        echo ""
        echo "=== $title ==="
        echo "$message"
        echo ""
        for item in "${options[@]}"; do
            IFS='|' read -r tag desc status <<< "$item"
            local marker=" "
            [ "$status" = "ON" ] && marker="*"
            echo "[$marker] $tag) $desc"
        done
        echo ""
        read -p "Select option: " choice
        echo "$choice"
    fi
}

# Display a file selector
tui_fselect() {
    local title="$1"
    local startpath="${2:-/opt}"
    
    if [ "$TUI_AVAILABLE" = true ] && [ "$TUI_TOOL" = "dialog" ]; then
        # Only dialog supports fselect
        result=$(dialog --title "$title" --fselect "$startpath" $TUI_HEIGHT $TUI_WIDTH 3>&1 1>&2 2>&3)
        echo "$result"
    else
        # Fallback to input box
        tui_inputbox "$title" "Enter file path:" "$startpath"
    fi
}

# Display a text info box with scrolling
tui_textbox() {
    local title="$1"
    local file="$2"
    
    if [ "$TUI_AVAILABLE" = true ]; then
        $TUI_TOOL --title "$title" --textbox "$file" $TUI_HEIGHT $TUI_WIDTH
    else
        echo ""
        echo "=== $title ==="
        cat "$file" | less
    fi
}

# ===========================
# Progress Tracking
# ===========================

# Show progress with updates
tui_progress() {
    local title="$1"
    local total="${2:-100}"
    local current=0
    
    if [ "$TUI_AVAILABLE" = true ]; then
        while IFS= read -r line; do
            if [[ "$line" =~ ^[0-9]+$ ]]; then
                current=$line
            else
                message=$line
            fi
            echo "$((current * 100 / total))"
            echo "# $message"
        done | tui_gauge "$title" "Initializing..."
    else
        # Simple progress for non-TUI
        while IFS= read -r line; do
            if [[ "$line" =~ ^[0-9]+$ ]]; then
                current=$line
                echo -ne "\rProgress: $((current * 100 / total))%"
            else
                echo -ne "\r\033[K$line"
            fi
        done
        echo ""
    fi
}

# ===========================
# Utility Functions
# ===========================

# Clear screen for TUI
tui_clear() {
    if [ "$TUI_AVAILABLE" = true ]; then
        clear
    fi
}

# Set backtitle for all dialogs
tui_backtitle() {
    local backtitle="$1"
    if [ "$TUI_AVAILABLE" = true ] && [ "$TUI_TOOL" = "dialog" ]; then
        export DIALOG_BACKTITLE="$backtitle"
    fi
}

# Initialize TUI
init_tui() {
    detect_tui
    
    # Try to install if not available and we're root
    if [ "$TUI_AVAILABLE" = false ] && [ "$EUID" -eq 0 ]; then
        install_tui
    fi
    
    # Set consistent backtitle
    tui_backtitle "Profolio Installer v3.0"
    
    # Export for use in main script
    export TUI_AVAILABLE
    export TUI_TOOL
}

# Cleanup on exit
cleanup_tui() {
    if [ "$TUI_AVAILABLE" = true ] && [ "$TUI_TOOL" = "dialog" ]; then
        clear
    fi
}

# Initialize TUI on source
init_tui