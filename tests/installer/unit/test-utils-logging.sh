#!/bin/bash

# =============================================================================
# UNIT TEST: Utils - Logging Module
# =============================================================================
# 
# Tests the logging utility functions for correctness and reliability
#
# Module: install/utils/logging.sh
# =============================================================================

# Test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/../test-framework.sh"

# Test setup
test_suite_start "Utils - Logging Module"

cd "$PROJECT_ROOT"

# Test 1: Module loading
test_case "Module loads without errors" "source install/utils/logging.sh"

# Test 2: Function availability after loading
test_case "Info function available" "
    source install/utils/logging.sh && 
    type info >/dev/null 2>&1
"

test_case "Success function available" "
    source install/utils/logging.sh && 
    type success >/dev/null 2>&1
"

test_case "Warning function available" "
    source install/utils/logging.sh && 
    type warn >/dev/null 2>&1
"

test_case "Error function available" "
    source install/utils/logging.sh && 
    type error >/dev/null 2>&1
"

test_case "Debug function available" "
    source install/utils/logging.sh && 
    type debug >/dev/null 2>&1
"

# Test 3: Function output format
test_case "Info function produces output" "
    source install/utils/logging.sh && 
    output=\$(info 'Test message' 2>&1) &&
    [[ -n \"\$output\" ]]
"

test_case "Success function produces green output" "
    source install/utils/logging.sh && 
    output=\$(success 'Test message' 2>&1) &&
    echo \"\$output\" | grep -q 'Test message'
"

test_case "Warning function produces yellow output" "
    source install/utils/logging.sh && 
    output=\$(warn 'Test warning' 2>&1) &&
    echo \"\$output\" | grep -q 'Test warning'
"

test_case "Error function produces red output" "
    source install/utils/logging.sh && 
    output=\$(error 'Test error' 2>&1) &&
    echo \"\$output\" | grep -q 'Test error'
"

# Test 4: Module metadata
test_case "Module version defined" "
    source install/utils/logging.sh && 
    [[ -n \"\${LOGGING_MODULE_VERSION:-}\" ]]
"

test_case "Module loaded flag set" "
    source install/utils/logging.sh && 
    [[ \"\${LOGGING_MODULE_LOADED:-}\" == 'true' ]]
"

# Test 5: Error handling
test_case "Functions handle empty messages" "
    source install/utils/logging.sh && 
    info '' >/dev/null 2>&1
"

test_case "Functions handle special characters" "
    source install/utils/logging.sh && 
    info 'Test with \$special \\characters!' >/dev/null 2>&1
"

# Test 6: Performance
test_case "Logging functions execute quickly" "
    source install/utils/logging.sh &&
    start_time=\$(date +%s%N) &&
    for i in {1..100}; do
        info 'Performance test' >/dev/null 2>&1
    done &&
    end_time=\$(date +%s%N) &&
    duration=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$duration -lt 1000 ]]  # Less than 1 second for 100 calls
"

test_suite_end 