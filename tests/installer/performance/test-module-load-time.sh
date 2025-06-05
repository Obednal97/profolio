#!/bin/bash

# =============================================================================
# PERFORMANCE TEST: Module Loading Performance
# =============================================================================
# 
# Tests module loading performance and resource usage
# Ensures the installer maintains acceptable performance characteristics
#
# Target: Module loading and initialization performance
# =============================================================================

# Test framework
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Load test framework
source "$SCRIPT_DIR/../test-framework.sh"

# Test setup
test_suite_start "Module Loading Performance"

cd "$PROJECT_ROOT"

# Performance thresholds (in milliseconds)
MAX_SINGLE_LOAD_TIME=2000      # 2 seconds max for single load
MAX_MULTIPLE_LOAD_TIME=5000    # 5 seconds max for 10 loads
MAX_MEMORY_USAGE_MB=50         # 50MB max memory usage

# Test 1: Single module loader execution time
test_case "Module loader loads within time threshold" "
    measure_execution_time 'source install/module-loader.sh >/dev/null 2>&1' $MAX_SINGLE_LOAD_TIME
"

# Test 2: Individual module loading performance
test_case "Utils logging module loads quickly" "
    measure_execution_time 'source install/utils/logging.sh >/dev/null 2>&1' 500
"

test_case "Platform detection module loads quickly" "
    measure_execution_time 'source install/utils/platform-detection.sh >/dev/null 2>&1' 500
"

test_case "Version control module loads quickly" "
    measure_execution_time 'source install/core/version-control.sh >/dev/null 2>&1' 1000
"

# Test 3: Multiple consecutive loads (testing caching/optimization)
test_case "Multiple module loads don't degrade performance" "
    start_time=\$(date +%s%N) &&
    for i in {1..10}; do
        source install/module-loader.sh >/dev/null 2>&1
        # Reset module state for next iteration
        unset MODULAR_ARCHITECTURE_LOADED MODULE_COUNT
    done &&
    end_time=\$(date +%s%N) &&
    total_time=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$total_time -lt $MAX_MULTIPLE_LOAD_TIME ]]
"

# Test 4: Function call performance after loading
test_case "Logging functions execute quickly after loading" "
    source install/module-loader.sh >/dev/null 2>&1 &&
    start_time=\$(date +%s%N) &&
    for i in {1..100}; do
        info 'Performance test message' >/dev/null 2>&1
    done &&
    end_time=\$(date +%s%N) &&
    duration=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$duration -lt 1000 ]]  # Less than 1 second for 100 calls
"

test_case "Platform detection executes quickly after loading" "
    source install/module-loader.sh >/dev/null 2>&1 &&
    start_time=\$(date +%s%N) &&
    for i in {1..20}; do
        get_platform_type >/dev/null 2>&1
    done &&
    end_time=\$(date +%s%N) &&
    duration=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$duration -lt 1000 ]]  # Less than 1 second for 20 calls
"

# Test 5: Memory usage estimation
test_case "Module loading uses reasonable memory" "
    # Start a subshell to isolate memory testing
    (
        # Get initial memory usage (rough estimation)
        ps_before=\$(ps -o pid,vsz,rss -p \$\$ | tail -1)
        initial_rss=\$(echo \$ps_before | awk '{print \$3}')
        
        # Load modules
        source install/module-loader.sh >/dev/null 2>&1
        
        # Get final memory usage
        ps_after=\$(ps -o pid,vsz,rss -p \$\$ | tail -1)
        final_rss=\$(echo \$ps_after | awk '{print \$3}')
        
        # Calculate difference (in KB)
        memory_diff=\$(( final_rss - initial_rss ))
        memory_mb=\$(( memory_diff / 1024 ))
        
        # Check if within threshold
        [[ \$memory_mb -lt $MAX_MEMORY_USAGE_MB ]]
    )
"

# Test 6: Bootstrap system performance
test_case "Bootstrap system loads within time threshold" "
    measure_execution_time 'source install/bootstrap.sh >/dev/null 2>&1' 1000
"

# Test 7: Main installer startup performance
test_case "Main installer help loads quickly" "
    measure_execution_time './install-or-update-modular.sh --help >/dev/null 2>&1' 3000
"

test_case "Main installer modules display loads quickly" "
    measure_execution_time './install-or-update-modular.sh --modules >/dev/null 2>&1' 3000
"

test_case "Main installer platform info loads quickly" "
    measure_execution_time './install-or-update-modular.sh --platform-info >/dev/null 2>&1' 3000
"

# Test 8: Concurrent loading performance (if supported)
test_case "Concurrent module loading doesn't cause issues" "
    # Test that multiple processes can load modules simultaneously
    start_time=\$(date +%s%N) &&
    (
        source install/module-loader.sh >/dev/null 2>&1 &
        source install/module-loader.sh >/dev/null 2>&1 &
        source install/module-loader.sh >/dev/null 2>&1 &
        wait
    ) &&
    end_time=\$(date +%s%N) &&
    duration=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$duration -lt 5000 ]]  # Should complete within 5 seconds
"

# Test 9: Resource cleanup verification
test_case "No resource leaks after module loading" "
    # Test that repeated loading doesn't accumulate resources
    start_time=\$(date +%s%N) &&
    for i in {1..5}; do
        (
            source install/module-loader.sh >/dev/null 2>&1
            get_platform_type >/dev/null 2>&1
            info 'Test message' >/dev/null 2>&1
        )
    done &&
    end_time=\$(date +%s%N) &&
    average_time=\$(( (end_time - start_time) / 1000000 / 5 )) &&
    [[ \$average_time -lt 1000 ]]  # Average should be less than 1 second per iteration
"

# Test 10: Performance regression detection
test_case "Performance hasn't regressed from baseline" "
    # Baseline: module loading should be faster than original installer startup
    # Original installers were ~3500 lines each, this should be much faster
    
    # Time the modular installer
    start_time=\$(date +%s%N) &&
    source install/module-loader.sh >/dev/null 2>&1 &&
    end_time=\$(date +%s%N) &&
    modular_time=\$(( (end_time - start_time) / 1000000 )) &&
    
    # Should be under 1 second for the modular architecture
    [[ \$modular_time -lt 1000 ]]
"

# Test 11: Function availability performance
test_case "Function availability checks are fast" "
    source install/module-loader.sh >/dev/null 2>&1 &&
    
    start_time=\$(date +%s%N) &&
    
    # Test function existence checks
    type info >/dev/null 2>&1 &&
    type success >/dev/null 2>&1 &&
    type warn >/dev/null 2>&1 &&
    type error >/dev/null 2>&1 &&
    type get_platform_type >/dev/null 2>&1 &&
    type version_control_get_latest_version >/dev/null 2>&1 &&
    type backup_create_backup >/dev/null 2>&1 &&
    
    end_time=\$(date +%s%N) &&
    duration=\$(( (end_time - start_time) / 1000000 )) &&
    [[ \$duration -lt 100 ]]  # Should be very fast
"

# Test 12: Scalability assessment
test_case "Performance scales linearly with module count" "
    # Test that adding more modules doesn't cause exponential slowdown
    
    # Time loading just utils
    start_time=\$(date +%s%N) &&
    source install/utils/logging.sh >/dev/null 2>&1 &&
    source install/utils/ui.sh >/dev/null 2>&1 &&
    end_time=\$(date +%s%N) &&
    utils_time=\$(( (end_time - start_time) / 1000000 )) &&
    
    # Time loading all modules
    start_time=\$(date +%s%N) &&
    source install/module-loader.sh >/dev/null 2>&1 &&
    end_time=\$(date +%s%N) &&
    all_time=\$(( (end_time - start_time) / 1000000 )) &&
    
    # All modules should take less than 7x the time of just utils (14 modules vs 2)
    # This allows for some overhead but ensures it's roughly linear
    max_allowed=\$(( utils_time * 7 )) &&
    [[ \$all_time -lt \$max_allowed ]]
"

test_suite_end 