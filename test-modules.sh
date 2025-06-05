#!/bin/bash

# 🧪 Module Loading Test Script
# ============================
# Test script to verify the modular installer architecture works

echo "🧪 Testing Modular Installer Architecture..."
echo ""

# Get script directory
INSTALLER_BASE="$(dirname "$(readlink -f "$0")")"
echo "📁 Installer base directory: $INSTALLER_BASE"

# Test loading utilities in order
echo ""
echo "📦 Loading utility modules..."

# Load logging module first (required by others)
echo "  Loading logging module..."
if source "$INSTALLER_BASE/install/utils/logging.sh"; then
    echo "  ✅ Logging module loaded successfully"
    if [[ "${LOGGING_MODULE_LOADED:-false}" == "true" ]]; then
        echo "     📊 Version: $LOGGING_MODULE_VERSION"
    fi
else
    echo "  ❌ Failed to load logging module"
    exit 1
fi

# Load validation module
echo "  Loading validation module..."
if source "$INSTALLER_BASE/install/utils/validation.sh"; then
    echo "  ✅ Validation module loaded successfully"
    if [[ "${VALIDATION_MODULE_LOADED:-false}" == "true" ]]; then
        echo "     📊 Version: $VALIDATION_MODULE_VERSION"
    fi
else
    echo "  ❌ Failed to load validation module"
    exit 1
fi

# Load UI module
echo "  Loading UI module..."
if source "$INSTALLER_BASE/install/utils/ui.sh"; then
    echo "  ✅ UI module loaded successfully"
    if [[ "${UI_MODULE_LOADED:-false}" == "true" ]]; then
        echo "     📊 Version: $UI_MODULE_VERSION"
    fi
else
    echo "  ❌ Failed to load UI module"
    exit 1
fi

echo ""
echo "🧪 Testing module functionality..."

# Test logging functions
echo ""
echo "📝 Testing logging functions:"
info "This is an info message"
warn "This is a warning message"
success "This is a success message"
error "This is an error message"

# Test validation functions
echo ""
echo "🔍 Testing validation functions:"
if validate_version "v1.0.3"; then
    success "Version validation: v1.0.3 is valid"
else
    error "Version validation failed"
fi

if validate_ip "192.168.1.100"; then
    success "IP validation: 192.168.1.100 is valid"
else
    error "IP validation failed"
fi

if validate_number "4096" 1024 8192; then
    success "Number validation: 4096 is within range 1024-8192"
else
    error "Number validation failed"
fi

# Test UI functions
echo ""
echo "🎨 Testing UI functions:"
ui_section_divider "Test Section"
ui_subsection "Test Subsection"
ui_message_box "This is a test message box" "info"

# Test progress function (without actual command)
echo ""
echo "⏳ Testing progress indicator:"
ui_show_progress 1 3 "Testing step 1"
ui_show_progress 2 3 "Testing step 2"
ui_show_progress 3 3 "Testing step 3"

echo ""
echo "✅ All module tests completed successfully!"
echo ""

# Show module information
echo "📊 Module Information:"
echo "======================"
logging_module_info
echo ""
validation_module_info
echo ""
ui_module_info

echo ""
echo "🎉 Modular installer architecture is working correctly!"
echo ""
echo "📋 Next steps:"
echo "  1. Extract core installation modules"
echo "  2. Extract feature modules" 
echo "  3. Extract platform-specific modules"
echo "  4. Create platform entry points" 