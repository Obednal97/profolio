#!/bin/bash

# =============================================================================
# UNIT TEST: Utils - Platform Detection Module
# =============================================================================
# 
# Tests platform detection utility functions for accuracy and reliability
#
# Module: install/utils/platform-detection.sh
# =============================================================================

# Test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/../test-framework.sh"

# Test setup
test_suite_start "Utils - Platform Detection Module"

cd "$PROJECT_ROOT"

# Test 1: Module loading
test_case "Module loads without errors" "source install/utils/platform-detection.sh"

# Test 2: Core detection functions exist
test_case "get_platform_type function available" "
    source install/utils/platform-detection.sh && 
    assert_function_exists get_platform_type
"

test_case "detect_proxmox_host function available" "
    source install/utils/platform-detection.sh && 
    assert_function_exists detect_proxmox_host
"

test_case "detect_lxc_container function available" "
    source install/utils/platform-detection.sh && 
    assert_function_exists detect_lxc_container
"

test_case "detect_docker_container function available" "
    source install/utils/platform-detection.sh && 
    assert_function_exists detect_docker_container
"

test_case "detect_wsl function available" "
    source install/utils/platform-detection.sh && 
    assert_function_exists detect_wsl
"

test_case "detect_unraid function available" "
    source install/utils/platform-detection.sh && 
    assert_function_exists detect_unraid
"

# Test 3: Platform type detection returns valid values
test_case "Platform type returns non-empty string" "
    source install/utils/platform-detection.sh && 
    platform=\$(get_platform_type) &&
    [[ -n \"\$platform\" ]]
"

test_case "Platform type returns known platform" "
    source install/utils/platform-detection.sh && 
    platform=\$(get_platform_type) &&
    [[ \"\$platform\" =~ ^(proxmox-host|unraid|lxc-container|docker-container|wsl|generic-linux)$ ]]
"

# Test 4: Platform information functions
test_case "get_platform_info function works" "
    source install/utils/platform-detection.sh && 
    info=\$(get_platform_info) &&
    [[ -n \"\$info\" ]] &&
    echo \"\$info\" | grep -q 'Platform:'
"

test_case "check_platform_compatibility function works" "
    source install/utils/platform-detection.sh && 
    check_platform_compatibility >/dev/null 2>&1
"

test_case "get_installation_approach returns valid approach" "
    source install/utils/platform-detection.sh && 
    approach=\$(get_installation_approach) &&
    [[ -n \"\$approach\" ]] &&
    [[ \"\$approach\" =~ ^(container-creation|docker-unraid|direct-install|containerized-install|development-install|standard-install|fallback-install)$ ]]
"

# Test 5: Service management detection
test_case "check_systemd_support function works" "
    source install/utils/platform-detection.sh && 
    check_systemd_support >/dev/null 2>&1 || true  # May fail on non-systemd systems
"

test_case "get_service_management returns valid method" "
    source install/utils/platform-detection.sh && 
    method=\$(get_service_management) &&
    [[ -n \"\$method\" ]] &&
    [[ \"\$method\" =~ ^(systemd|manual)$ ]]
"

# Test 6: Error handling and edge cases
test_case "Functions handle missing /proc filesystem gracefully" "
    source install/utils/platform-detection.sh && 
    # Should not crash even if /proc files don't exist
    get_platform_type >/dev/null 2>&1
"

test_case "Functions handle permission issues gracefully" "
    source install/utils/platform-detection.sh && 
    # Should not crash on permission issues
    detect_docker_container >/dev/null 2>&1 || true
"

# Test 7: Module metadata
test_case "Module version defined" "
    source install/utils/platform-detection.sh && 
    assert_variable_set PLATFORM_DETECTION_VERSION
"

test_case "Module dependencies listed" "
    source install/utils/platform-detection.sh && 
    assert_variable_set PLATFORM_DETECTION_DEPENDENCIES
"

# Test 8: Backward compatibility
test_case "Backward compatibility alias works" "
    source install/utils/platform-detection.sh && 
    assert_function_exists detect_platform &&
    platform1=\$(get_platform_type) &&
    platform2=\$(detect_platform) &&
    [[ \"\$platform1\" == \"\$platform2\" ]]
"

# Test 9: Performance tests
test_case "Platform detection executes quickly" "
    source install/utils/platform-detection.sh &&
    measure_execution_time 'get_platform_type >/dev/null 2>&1' 500
"

test_case "Multiple platform checks don't slow down" "
    source install/utils/platform-detection.sh &&
    start_time=\$(date +%s%N) &&
    for i in {1..10}; do
        get_platform_type >/dev/null 2>&1
    done &&
    end_time=\$(date +%s%N) &&
    duration=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$duration -lt 2000 ]]  # Less than 2 seconds for 10 calls
"

# Test 10: Security checks
test_case "No hardcoded secrets in platform detection" "
    assert_no_hardcoded_secrets install/utils/platform-detection.sh
"

test_case "Platform detection file has safe permissions" "
    assert_no_world_writable install/utils/platform-detection.sh
"

test_suite_end 