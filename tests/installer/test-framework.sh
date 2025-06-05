#!/bin/bash

# =============================================================================
# INSTALLER TEST FRAMEWORK
# =============================================================================
# 
# Common testing utilities and framework for installer tests
# Provides consistent test reporting and utilities
#
# Usage: source tests/installer/test-framework.sh
# =============================================================================

# Test framework colors
TEST_RED='\033[0;31m'
TEST_GREEN='\033[0;32m'
TEST_YELLOW='\033[1;33m'
TEST_BLUE='\033[0;34m'
TEST_CYAN='\033[0;36m'
TEST_WHITE='\033[1;37m'
TEST_NC='\033[0m' # No Color

# Test tracking variables
TEST_SUITE_NAME=""
TEST_SUITE_TESTS=0
TEST_SUITE_PASSED=0
TEST_SUITE_FAILED=0
TEST_SUITE_SKIPPED=0
TEST_SUITE_START_TIME=0

# Global test tracking
GLOBAL_TESTS=0
GLOBAL_PASSED=0
GLOBAL_FAILED=0
GLOBAL_SKIPPED=0

# Test framework functions
test_suite_start() {
    TEST_SUITE_NAME="$1"
    TEST_SUITE_TESTS=0
    TEST_SUITE_PASSED=0
    TEST_SUITE_FAILED=0
    TEST_SUITE_SKIPPED=0
    TEST_SUITE_START_TIME=$(date +%s)
    
    echo ""
    echo -e "${TEST_CYAN}═══════════════════════════════════════════════════════════════════${TEST_NC}"
    echo -e "${TEST_WHITE}🧪 Testing: $TEST_SUITE_NAME${TEST_NC}"
    echo -e "${TEST_CYAN}═══════════════════════════════════════════════════════════════════${TEST_NC}"
    echo ""
}

test_suite_end() {
    local duration=$(($(date +%s) - TEST_SUITE_START_TIME))
    
    echo ""
    echo -e "${TEST_BLUE}📊 Suite Results: $TEST_SUITE_NAME${TEST_NC}"
    echo -e "${TEST_BLUE}─────────────────────────────────────────────────────────────────${TEST_NC}"
    echo -e "${TEST_GREEN}✅ Passed:  $TEST_SUITE_PASSED${TEST_NC}"
    echo -e "${TEST_RED}❌ Failed:  $TEST_SUITE_FAILED${TEST_NC}"
    echo -e "${TEST_YELLOW}⚠️  Skipped: $TEST_SUITE_SKIPPED${TEST_NC}"
    echo -e "${TEST_WHITE}📈 Total:   $TEST_SUITE_TESTS${TEST_NC}"
    echo -e "${TEST_CYAN}⏱️  Duration: ${duration}s${TEST_NC}"
    
    # Update global counters
    ((GLOBAL_TESTS += TEST_SUITE_TESTS))
    ((GLOBAL_PASSED += TEST_SUITE_PASSED))
    ((GLOBAL_FAILED += TEST_SUITE_FAILED))
    ((GLOBAL_SKIPPED += TEST_SUITE_SKIPPED))
    
    if [[ $TEST_SUITE_FAILED -eq 0 ]]; then
        echo -e "${TEST_GREEN}🎉 All tests in suite passed!${TEST_NC}"
        return 0
    else
        echo -e "${TEST_RED}❌ Some tests failed in suite${TEST_NC}"
        return 1
    fi
}

test_case() {
    local test_name="$1"
    local test_command="$2"
    local skip_reason="${3:-}"
    
    ((TEST_SUITE_TESTS++))
    
    printf "%-60s " "$test_name"
    
    if [[ -n "$skip_reason" ]]; then
        echo -e "${TEST_YELLOW}⚠️  SKIP${TEST_NC} ($skip_reason)"
        ((TEST_SUITE_SKIPPED++))
        return 2
    fi
    
    # Execute test command and capture both stdout and stderr
    local test_output
    local test_exit_code
    
    test_output=$(eval "$test_command" 2>&1)
    test_exit_code=$?
    
    if [[ $test_exit_code -eq 0 ]]; then
        echo -e "${TEST_GREEN}✅ PASS${TEST_NC}"
        ((TEST_SUITE_PASSED++))
        return 0
    else
        echo -e "${TEST_RED}❌ FAIL${TEST_NC}"
        if [[ -n "$test_output" ]] && [[ "${SHOW_TEST_OUTPUT:-false}" == "true" ]]; then
            echo -e "${TEST_YELLOW}   Output: $test_output${TEST_NC}"
        fi
        ((TEST_SUITE_FAILED++))
        return 1
    fi
}

test_skip() {
    local test_name="$1"
    local skip_reason="$2"
    
    test_case "$test_name" "true" "$skip_reason"
}

# Helper functions for common test patterns
assert_file_exists() {
    local file_path="$1"
    [[ -f "$file_path" ]]
}

assert_directory_exists() {
    local dir_path="$1"
    [[ -d "$dir_path" ]]
}

assert_executable() {
    local file_path="$1"
    [[ -x "$file_path" ]]
}

assert_function_exists() {
    local function_name="$1"
    type "$function_name" >/dev/null 2>&1
}

assert_variable_set() {
    local var_name="$1"
    [[ -n "${!var_name:-}" ]]
}

assert_variable_equals() {
    local var_name="$1"
    local expected_value="$2"
    [[ "${!var_name:-}" == "$expected_value" ]]
}

assert_output_contains() {
    local command="$1"
    local expected_text="$2"
    
    local output
    output=$(eval "$command" 2>&1)
    echo "$output" | grep -q "$expected_text"
}

assert_command_succeeds() {
    local command="$1"
    eval "$command" >/dev/null 2>&1
}

assert_command_fails() {
    local command="$1"
    ! eval "$command" >/dev/null 2>&1
}

# Performance testing helpers
measure_execution_time() {
    local command="$1"
    local max_time_ms="${2:-1000}"  # Default 1 second
    
    local start_time end_time duration
    start_time=$(date +%s%N)
    eval "$command" >/dev/null 2>&1
    end_time=$(date +%s%N)
    duration=$(( (end_time - start_time) / 1000000 ))  # Convert to milliseconds
    
    [[ $duration -lt $max_time_ms ]]
}

# Security testing helpers
assert_no_hardcoded_secrets() {
    local file_path="$1"
    
    # Check for common secret patterns
    ! grep -E '(password|secret|key|token).*=' "$file_path" >/dev/null 2>&1 &&
    ! grep -E 'API_KEY|SECRET_KEY|PASSWORD' "$file_path" >/dev/null 2>&1
}

assert_no_world_writable() {
    local file_path="$1"
    
    local perms
    perms=$(stat -c "%a" "$file_path" 2>/dev/null || stat -f "%A" "$file_path" 2>/dev/null)
    [[ "${perms: -1}" != "7" ]] && [[ "${perms: -1}" != "6" ]] && [[ "${perms: -1}" != "3" ]] && [[ "${perms: -1}" != "2" ]]
}

assert_no_sudo_without_auth() {
    local file_path="$1"
    
    # Check for dangerous sudo patterns
    ! grep -E 'sudo\s+.*NOPASSWD' "$file_path" >/dev/null 2>&1 &&
    ! grep -E 'sudo\s+-n' "$file_path" >/dev/null 2>&1
}

# Test result reporting
show_global_results() {
    echo ""
    echo -e "${TEST_CYAN}═══════════════════════════════════════════════════════════════════${TEST_NC}"
    echo -e "${TEST_WHITE}🏆 GLOBAL TEST RESULTS${TEST_NC}"
    echo -e "${TEST_CYAN}═══════════════════════════════════════════════════════════════════${TEST_NC}"
    echo -e "${TEST_GREEN}✅ Total Passed:  $GLOBAL_PASSED${TEST_NC}"
    echo -e "${TEST_RED}❌ Total Failed:  $GLOBAL_FAILED${TEST_NC}"
    echo -e "${TEST_YELLOW}⚠️  Total Skipped: $GLOBAL_SKIPPED${TEST_NC}"
    echo -e "${TEST_WHITE}📈 Total Tests:   $GLOBAL_TESTS${TEST_NC}"
    
    if [[ $GLOBAL_TESTS -gt 0 ]]; then
        local success_rate=$((GLOBAL_PASSED * 100 / GLOBAL_TESTS))
        echo -e "${TEST_CYAN}📊 Success Rate:  ${success_rate}%${TEST_NC}"
    fi
    
    echo ""
    
    if [[ $GLOBAL_FAILED -eq 0 ]]; then
        echo -e "${TEST_GREEN}🎉 ALL TESTS PASSED! 🎉${TEST_NC}"
        return 0
    else
        echo -e "${TEST_RED}❌ SOME TESTS FAILED${TEST_NC}"
        return 1
    fi
}

# Test discovery and execution
run_test_file() {
    local test_file="$1"
    
    if [[ -f "$test_file" && -x "$test_file" ]]; then
        echo -e "${TEST_BLUE}🔄 Running: $(basename "$test_file")${TEST_NC}"
        "$test_file"
        local exit_code=$?
        echo ""
        return $exit_code
    else
        echo -e "${TEST_RED}❌ Test file not found or not executable: $test_file${TEST_NC}"
        return 1
    fi
}

run_tests_in_directory() {
    local test_dir="$1"
    local pattern="${2:-test-*.sh}"
    
    if [[ ! -d "$test_dir" ]]; then
        echo -e "${TEST_RED}❌ Test directory not found: $test_dir${TEST_NC}"
        return 1
    fi
    
    local test_files=()
    while IFS= read -r -d '' file; do
        test_files+=("$file")
    done < <(find "$test_dir" -name "$pattern" -type f -executable -print0 | sort -z)
    
    if [[ ${#test_files[@]} -eq 0 ]]; then
        echo -e "${TEST_YELLOW}⚠️  No test files found in $test_dir matching $pattern${TEST_NC}"
        return 0
    fi
    
    local failed_tests=0
    for test_file in "${test_files[@]}"; do
        if ! run_test_file "$test_file"; then
            ((failed_tests++))
        fi
    done
    
    return $failed_tests
}

# Module metadata
TEST_FRAMEWORK_VERSION="1.0.0"
TEST_FRAMEWORK_LOADED=true

# Export functions for use in test files
export -f test_suite_start test_suite_end test_case test_skip
export -f assert_file_exists assert_directory_exists assert_executable
export -f assert_function_exists assert_variable_set assert_variable_equals
export -f assert_output_contains assert_command_succeeds assert_command_fails
export -f measure_execution_time assert_no_hardcoded_secrets
export -f assert_no_world_writable assert_no_sudo_without_auth
export -f show_global_results run_test_file run_tests_in_directory