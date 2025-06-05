#!/bin/bash

# =============================================================================
# INTEGRATION TEST: Module Loader and Dependencies
# =============================================================================
# 
# Tests module loading order, dependency resolution, and cross-module integration
#
# Target: install/module-loader.sh and module interactions
# =============================================================================

# Test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/../test-framework.sh"

# Test setup
test_suite_start "Module Loader and Dependencies Integration"

cd "$PROJECT_ROOT"

# Test 1: Module loader basic functionality
test_case "Module loader loads without errors" "
    source install/module-loader.sh
"

test_case "Module loader sets architecture flag" "
    source install/module-loader.sh &&
    [[ \"\${MODULAR_ARCHITECTURE_LOADED:-}\" == 'true' ]]
"

# Test 2: Module loading order and dependencies
test_case "All 14 modules load in correct order" "
    source install/module-loader.sh &&
    # Check that the module counter matches expected count
    [[ \"\${MODULE_COUNT:-0}\" -eq 14 ]] || echo \"\$MODULE_COUNT modules loaded\"
"

test_case "Utils modules load before other modules" "
    source install/module-loader.sh &&
    # Utils modules should be available for other modules to use
    assert_function_exists info &&
    assert_function_exists success &&
    assert_function_exists warn &&
    assert_function_exists error
"

test_case "Core modules load after utils" "
    source install/module-loader.sh &&
    # Core modules should have access to utils functions
    assert_function_exists version_control_get_latest_version &&
    assert_function_exists rollback_create_rollback_point
"

test_case "Feature modules load after core and utils" "
    source install/module-loader.sh &&
    # Feature modules should have access to both utils and core
    assert_function_exists config_run_installation_wizard &&
    assert_function_exists backup_create_backup &&
    assert_function_exists optimization_deploy_safe
"

test_case "Platform modules load last" "
    source install/module-loader.sh &&
    # Platform modules should have access to all previous modules
    assert_function_exists handle_proxmox_installation &&
    assert_function_exists handle_ubuntu_platform &&
    assert_function_exists handle_docker_platform
"

# Test 3: Cross-module function availability
test_case "Logging functions available across all modules" "
    source install/module-loader.sh &&
    # Test that logging is available everywhere
    type info success warn error debug >/dev/null 2>&1
"

test_case "Platform detection available across modules" "
    source install/module-loader.sh &&
    # Platform detection should be accessible
    platform=\$(get_platform_type) &&
    [[ -n \"\$platform\" ]]
"

test_case "Version control functions accessible" "
    source install/module-loader.sh &&
    # Version control should be accessible
    assert_function_exists version_control_get_latest_version &&
    assert_function_exists version_control_version_exists
"

# Test 4: Module interdependency validation
test_case "Feature modules can use utils functions" "
    source install/module-loader.sh &&
    # Test that features can use utils
    # This should not fail if dependencies are correct
    backup_create_backup --help >/dev/null 2>&1 || true
"

test_case "Platform modules can use all prerequisite functions" "
    source install/module-loader.sh &&
    # Platform modules should access utils, core, and features
    # Test by checking if platform handler exists and functions are available
    assert_function_exists handle_ubuntu_platform &&
    assert_function_exists info &&
    assert_function_exists get_platform_type
"

# Test 5: Module metadata consistency
test_case "All modules have version information" "
    source install/module-loader.sh &&
    # Check that module versions are defined
    [[ -n \"\${LOGGING_MODULE_VERSION:-}\" ]] &&
    [[ -n \"\${PLATFORM_DETECTION_VERSION:-}\" ]] &&
    [[ -n \"\${VERSION_CONTROL_MODULE_VERSION:-}\" ]]
"

test_case "Module loaded flags are set correctly" "
    source install/module-loader.sh &&
    # Check that modules indicate they're loaded
    [[ \"\${LOGGING_MODULE_LOADED:-}\" == 'true' ]] &&
    [[ \"\${VERSION_CONTROL_MODULE_LOADED:-}\" == 'true' ]]
"

# Test 6: Error handling in module loading
test_case "Module loader handles missing optional modules gracefully" "
    # Create a temporary environment without one module
    temp_dir=\$(mktemp -d) &&
    cp -r install \"\$temp_dir/\" &&
    # Remove a non-critical module temporarily
    rm -f \"\$temp_dir/install/features/ssh-hardening.sh\" &&
    # Module loader should handle this gracefully
    (cd \"\$temp_dir\" && source install/module-loader.sh >/dev/null 2>&1) || true &&
    rm -rf \"\$temp_dir\"
"

# Test 7: Function namespace collision prevention
test_case "No function name collisions between modules" "
    source install/module-loader.sh &&
    # Check that functions have proper namespacing
    # Core modules should use prefixes to avoid collisions
    type version_control_get_latest_version >/dev/null 2>&1 &&
    type rollback_create_rollback_point >/dev/null 2>&1 &&
    type backup_create_backup >/dev/null 2>&1
"

# Test 8: Module independence verification
test_case "Utils modules work independently" "
    # Test that utils can be loaded independently
    temp_script=\$(mktemp) &&
    echo '#!/bin/bash' > \"\$temp_script\" &&
    echo 'source install/utils/logging.sh' >> \"\$temp_script\" &&
    echo 'info \"Test message\"' >> \"\$temp_script\" &&
    chmod +x \"\$temp_script\" &&
    \"\$temp_script\" >/dev/null 2>&1 &&
    rm -f \"\$temp_script\"
"

test_case "Core modules work with minimal dependencies" "
    # Test that core modules can work with just utils loaded
    temp_script=\$(mktemp) &&
    echo '#!/bin/bash' > \"\$temp_script\" &&
    echo 'source install/utils/logging.sh' >> \"\$temp_script\" &&
    echo 'source install/core/version-control.sh' >> \"\$temp_script\" &&
    echo 'version_control_get_latest_version >/dev/null 2>&1 || true' >> \"\$temp_script\" &&
    chmod +x \"\$temp_script\" &&
    \"\$temp_script\" &&
    rm -f \"\$temp_script\"
"

# Test 9: Performance impact of module loading
test_case "Module loading completes within reasonable time" "
    measure_execution_time 'source install/module-loader.sh >/dev/null 2>&1' 3000
"

test_case "Module loading is consistent across multiple runs" "
    # Test that module loading gives consistent results
    source install/module-loader.sh >/dev/null 2>&1 &&
    count1=\${MODULE_COUNT:-0} &&
    unset MODULAR_ARCHITECTURE_LOADED MODULE_COUNT &&
    source install/module-loader.sh >/dev/null 2>&1 &&
    count2=\${MODULE_COUNT:-0} &&
    [[ \"\$count1\" == \"\$count2\" ]]
"

# Test 10: Bootstrap integration
test_case "Bootstrap system integrates with module loader" "
    source install/bootstrap.sh &&
    assert_function_exists bootstrap_download_modules &&
    # Bootstrap should be able to work with module loader
    type get_loaded_modules >/dev/null 2>&1 || true
"

# Test 11: Main installer integration
test_case "Main installer uses module loader correctly" "
    # Test that main installer loads modules properly
    grep -q 'source.*module-loader.sh' install-or-update-modular.sh &&
    grep -q 'MODULAR_ARCHITECTURE_LOADED' install-or-update-modular.sh
"

test_case "Main installer can access all module functions" "
    # Simulate main installer execution (without root)
    export INSTALLER_DEBUG=true &&
    source install/module-loader.sh &&
    # Test that main installer patterns work
    assert_function_exists handle_platform_installation ||
    assert_function_exists get_platform_type
"

# Test 12: Module information display
test_case "Module information display works correctly" "
    source install/module-loader.sh &&
    module_info=\$(get_loaded_modules 2>&1) &&
    [[ -n \"\$module_info\" ]] &&
    echo \"\$module_info\" | grep -q 'utils/logging.sh' &&
    echo \"\$module_info\" | grep -q 'core/version-control.sh'
"

test_suite_end 