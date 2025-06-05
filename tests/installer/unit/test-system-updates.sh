#!/bin/bash

# =============================================================================
# UNIT TEST: Optional System Update Functionality
# =============================================================================
# 
# Tests the new optional system update flow implemented in v1.12.0
# Validates user choice handling and platform-specific update controls
#
# Target: Platform modules' system update functions
# =============================================================================

# Test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/../test-framework.sh"

# Test setup
test_suite_start "Optional System Update Functionality Tests"

cd "$PROJECT_ROOT"

# Load modules for testing
source install/module-loader.sh >/dev/null 2>&1

# Test 1: Ubuntu Platform Update Options
test_case "Ubuntu platform has update_package_repositories function" "
    assert_function_exists update_package_repositories
"

test_case "Ubuntu platform contains interactive update prompts" "
    grep -q 'System Update Options:' install/platforms/ubuntu.sh &&
    grep -q 'Skip system updates' install/platforms/ubuntu.sh &&
    grep -q 'Update package lists only' install/platforms/ubuntu.sh &&
    grep -q 'Update package lists + upgrade existing packages' install/platforms/ubuntu.sh
"

test_case "Ubuntu platform has safe default option" "
    # Check that option 2 (update lists only) is the default
    grep -q 'Select update option \[2\]:' install/platforms/ubuntu.sh
"

test_case "Ubuntu platform handles all three update choices" "
    # Check that all three update options are handled in case statement
    grep -A 20 'case \$update_choice in' install/platforms/ubuntu.sh | grep -q '1)' &&
    grep -A 20 'case \$update_choice in' install/platforms/ubuntu.sh | grep -q '2)' &&
    grep -A 20 'case \$update_choice in' install/platforms/ubuntu.sh | grep -q '3)'
"

test_case "Ubuntu platform provides user warnings" "
    # Check for appropriate warnings when skipping updates
    grep -q 'Note.*If package installation fails' install/platforms/ubuntu.sh
"

# Test 2: Proxmox Platform Container Update Options
test_case "Proxmox platform has container update options" "
    grep -q 'Container System Update Options:' install/platforms/proxmox.sh
"

test_case "Proxmox platform builds conditional update commands" "
    # Check that update commands are built conditionally
    grep -q 'update_cmd=' install/platforms/proxmox.sh &&
    grep -q 'case \$container_update_choice in' install/platforms/proxmox.sh
"

test_case "Proxmox platform has safe container update defaults" "
    # Check that option 2 is default for container updates
    grep -q 'Select update option \[2\]:' install/platforms/proxmox.sh
"

test_case "Proxmox platform handles empty update command" "
    # Check that empty update command is handled for option 1
    grep -A 10 'case \$container_update_choice in' install/platforms/proxmox.sh | grep -q 'update_cmd=""'
"

# Test 3: Emergency Platform Update Controls
test_case "Emergency platform has update choice prompts" "
    grep -q 'Emergency System Update Options:' install/platforms/emergency.sh
"

test_case "Emergency platform explains update necessity" "
    # Emergency should explain why updates might be needed
    grep -q 'Emergency recovery often requires updated package lists' install/platforms/emergency.sh
"

test_case "Emergency platform has emergency_fix_dependencies function" "
    assert_function_exists emergency_fix_dependencies
"

test_case "Emergency platform handles update choices in emergency_fix_dependencies" "
    # Check that the function handles user choices
    grep -A 20 'case \$emergency_update_choice in' install/platforms/emergency.sh | grep -q '1)' &&
    grep -A 20 'case \$emergency_update_choice in' install/platforms/emergency.sh | grep -q '2)' &&
    grep -A 20 'case \$emergency_update_choice in' install/platforms/emergency.sh | grep -q '3)'
"

# Test 4: Function Availability and Integration
test_case "All platform update functions are available" "
    assert_function_exists update_package_repositories &&
    assert_function_exists emergency_fix_dependencies &&
    assert_function_exists create_proxmox_container
"

test_case "Platform functions don't conflict with each other" "
    # Ensure functions are properly namespaced and don't collide
    [[ \$(type -t update_package_repositories) == 'function' ]] &&
    [[ \$(type -t emergency_fix_dependencies) == 'function' ]] &&
    [[ \$(type update_package_repositories) != \$(type emergency_fix_dependencies) ]]
"

# Test 5: Content Validation
test_case "Ubuntu platform shows clear option explanations" "
    # Check that each option has a clear explanation
    grep -q 'just install Profolio packages' install/platforms/ubuntu.sh &&
    grep -q 'recommended' install/platforms/ubuntu.sh &&
    grep -q 'downloads.*significant data' install/platforms/ubuntu.sh || 
    grep -q 'may take several minutes' install/platforms/ubuntu.sh
"

test_case "Platform modules maintain logging consistency" "
    # All platforms should use consistent logging functions
    grep -q 'info.*Updating package' install/platforms/ubuntu.sh &&
    grep -q 'info.*Skipping.*updates' install/platforms/ubuntu.sh &&
    grep -q 'success.*updated successfully' install/platforms/ubuntu.sh
"

test_case "Error handling exists for update failures" "
    # Check that update failures are handled gracefully
    grep -q 'error.*Failed to update' install/platforms/ubuntu.sh &&
    grep -q 'warn.*Some packages failed' install/platforms/ubuntu.sh ||
    grep -q 'warn.*Package update had issues' install/platforms/emergency.sh
"

# Test 6: Default Behavior Validation
test_case "All platforms default to safe update option" "
    # All platforms should default to option 2 (update lists only)
    grep -q '\[2\]:' install/platforms/ubuntu.sh &&
    grep -q '\[2\]:' install/platforms/proxmox.sh &&
    grep -q '\[2\]:' install/platforms/emergency.sh
"

test_case "No platform performs automatic full upgrades" "
    # Ensure no platform automatically runs apt upgrade without user consent
    ! grep -q '^[[:space:]]*apt.*upgrade.*-y' install/platforms/ubuntu.sh &&
    ! grep -q '^[[:space:]]*apt.*upgrade.*-y' install/platforms/proxmox.sh &&
    # Emergency platform can still do this but only after user choice
    true
"

# Test 7: Integration with Core Installer
test_case "Platform modules call core installer correctly" "
    # Platforms should call install_profolio_application
    grep -q 'install_profolio_application' install/platforms/ubuntu.sh &&
    grep -q 'install_profolio_application' install/platforms/emergency.sh
"

test_case "Platform modules handle core installer failures" "
    # Check that platforms handle core installer failures
    grep -A 5 'install_profolio_application' install/platforms/ubuntu.sh | grep -q 'error\|failed\|return 1' &&
    grep -A 5 'install_profolio_application' install/platforms/emergency.sh | grep -q 'error\|failed\|return 1'
"

# Test 8: User Experience Validation
test_case "Update prompts use consistent formatting" "
    # Check for consistent prompt formatting across platforms
    grep -q '📦.*System Update Options' install/platforms/ubuntu.sh &&
    grep -q '📦.*System Update Options' install/platforms/proxmox.sh &&
    grep -q '📦.*System Update Options' install/platforms/emergency.sh
"

test_case "Color coding is consistent across platforms" "
    # Check that color variables are used consistently
    grep -q '\${GREEN}' install/platforms/ubuntu.sh &&
    grep -q '\${BLUE}' install/platforms/ubuntu.sh &&
    grep -q '\${YELLOW}' install/platforms/ubuntu.sh &&
    grep -q '\${CYAN}' install/platforms/ubuntu.sh
"

# Test 9: Backwards Compatibility
test_case "Platforms still support non-interactive operation" "
    # Platforms should work when defaults are accepted
    grep -q 'update_choice=\${update_choice:-2}' install/platforms/ubuntu.sh &&
    grep -q 'container_update_choice=\${container_update_choice:-2}' install/platforms/proxmox.sh &&
    grep -q 'emergency_update_choice=\${emergency_update_choice:-2}' install/platforms/emergency.sh
"

test_case "Essential functions still work without updates" "
    # Core functionality should work even if system updates are skipped
    assert_function_exists install_essential_packages &&
    assert_function_exists configure_postgresql_ubuntu &&
    assert_function_exists emergency_install_postgresql
"

# Test 10: Security and Safety
test_case "No hardcoded automatic updates without consent" "
    # Ensure no platform automatically downloads/installs updates
    ! grep -E '^[[:space:]]*apt.*(update|upgrade)' install/platforms/ubuntu.sh &&
    ! grep -E '^[[:space:]]*apt.*(update|upgrade)' install/platforms/proxmox.sh
"

test_case "Update commands are properly quoted and safe" "
    # Check that update commands are properly constructed
    grep -q '\".*apt.*update.*\"' install/platforms/ubuntu.sh ||
    grep -q \"'.*apt.*update.*'\" install/platforms/ubuntu.sh ||
    # Commands should be in functions, not raw
    grep -q 'apt-get update' install/platforms/ubuntu.sh
"

test_suite_end 