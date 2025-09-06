#!/bin/bash
#
# Profolio Installer Function Tests
# Unit tests for installer functions
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Script directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source the installer script in test mode
export DRY_RUN=true
export SILENT_MODE=true

# Test framework functions
assert_equals() {
    local expected="$1"
    local actual="$2"
    local test_name="${3:-Test}"
    
    ((TESTS_RUN++))
    
    if [ "$expected" = "$actual" ]; then
        echo -e "${GREEN}✅${NC} $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $test_name"
        echo -e "   Expected: $expected"
        echo -e "   Actual:   $actual"
        ((TESTS_FAILED++))
        return 1
    fi
}

assert_true() {
    local condition="$1"
    local test_name="${2:-Test}"
    
    ((TESTS_RUN++))
    
    if eval "$condition"; then
        echo -e "${GREEN}✅${NC} $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $test_name"
        echo -e "   Condition failed: $condition"
        ((TESTS_FAILED++))
        return 1
    fi
}

assert_false() {
    local condition="$1"
    local test_name="${2:-Test}"
    
    ((TESTS_RUN++))
    
    if ! eval "$condition"; then
        echo -e "${GREEN}✅${NC} $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $test_name"
        echo -e "   Condition should have failed: $condition"
        ((TESTS_FAILED++))
        return 1
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local test_name="${3:-Test}"
    
    ((TESTS_RUN++))
    
    if [[ "$haystack" == *"$needle"* ]]; then
        echo -e "${GREEN}✅${NC} $test_name"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $test_name"
        echo -e "   String does not contain: $needle"
        echo -e "   In: $haystack"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test version validation function
test_version_validation() {
    echo -e "${BLUE}Testing version validation...${NC}"
    
    # Define validate_version function from install.sh
    validate_version() {
        local version="$1"
        
        # Allow special keywords
        case "$version" in
            "main"|"latest"|"")
                return 0
                ;;
            *)
                # Check if it's a valid version tag format
                if [[ "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                    return 0
                else
                    return 1
                fi
                ;;
        esac
    }
    
    # Test valid versions
    validate_version "v1.0.0"
    assert_equals "0" "$?" "validate_version accepts v1.0.0"
    
    validate_version "1.0.0"
    assert_equals "0" "$?" "validate_version accepts 1.0.0"
    
    validate_version "main"
    assert_equals "0" "$?" "validate_version accepts main"
    
    validate_version "latest"
    assert_equals "0" "$?" "validate_version accepts latest"
    
    # Test invalid versions
    validate_version "invalid" 2>/dev/null
    assert_equals "1" "$?" "validate_version rejects invalid"
    
    validate_version "v1.0" 2>/dev/null
    assert_equals "1" "$?" "validate_version rejects incomplete version"
}

# Test dry-run mode
test_dry_run_mode() {
    echo -e "${BLUE}Testing dry-run mode...${NC}"
    
    # Define execute_command function from install.sh
    execute_command() {
        local cmd="$1"
        local description="${2:-Executing command}"
        
        if [ "$DRY_RUN" = true ]; then
            echo -e "${CYAN}[DRY-RUN]${NC} Would execute: $description"
            echo -e "         Command: $cmd"
            return 0
        else
            eval "$cmd"
            return $?
        fi
    }
    
    # Test that dry-run doesn't execute commands
    DRY_RUN=true
    output=$(execute_command "echo TEST" "Test command" 2>&1)
    assert_contains "$output" "[DRY-RUN]" "Dry-run mode shows [DRY-RUN] prefix"
    assert_contains "$output" "Would execute" "Dry-run mode says 'Would execute'"
    
    # Test that non-dry-run executes commands
    DRY_RUN=false
    output=$(execute_command "echo TEST" "Test command" 2>&1)
    assert_equals "TEST" "$output" "Non-dry-run mode executes command"
}

# Test file operation wrapper
test_file_operations() {
    echo -e "${BLUE}Testing file operation wrapper...${NC}"
    
    # Define execute_file_op function from install.sh
    execute_file_op() {
        local op="$1"
        local target="$2"
        local description="${3:-File operation}"
        
        if [ "$DRY_RUN" = true ]; then
            echo -e "${CYAN}[DRY-RUN]${NC} Would perform: $description"
            echo -e "         Operation: $op $target"
            return 0
        else
            case "$op" in
                mkdir)
                    mkdir -p "$target"
                    ;;
                rm)
                    rm -rf "$target"
                    ;;
                cp)
                    cp -r $target  # Note: target includes source and dest
                    ;;
                *)
                    eval "$op $target"
                    ;;
            esac
            return $?
        fi
    }
    
    # Test dry-run file operations
    DRY_RUN=true
    output=$(execute_file_op "mkdir" "/tmp/test" "Create test directory" 2>&1)
    assert_contains "$output" "[DRY-RUN]" "File op shows [DRY-RUN] prefix"
    assert_false "[ -d /tmp/test ]" "Dry-run doesn't create directory"
    
    # Test actual file operations
    DRY_RUN=false
    test_dir="/tmp/profolio_test_$$"
    execute_file_op "mkdir" "$test_dir" "Create test directory" >/dev/null 2>&1
    assert_true "[ -d $test_dir ]" "Non-dry-run creates directory"
    
    # Cleanup
    rm -rf "$test_dir"
}

# Test environment detection
test_environment_detection() {
    echo -e "${BLUE}Testing environment detection...${NC}"
    
    # Define detection functions from install.sh
    detect_container() {
        if [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ] || grep -qa "container=lxc" /proc/1/environ 2>/dev/null; then
            return 0
        else
            return 1
        fi
    }
    
    detect_proxmox_host() {
        if [ -f "/etc/pve/local/pve-ssl.pem" ] && command -v pct >/dev/null 2>&1; then
            return 0  # Running on Proxmox host
        else
            return 1  # Not on Proxmox host
        fi
    }
    
    # Test container detection
    detect_container
    local is_container=$?
    if [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ]; then
        assert_equals "0" "$is_container" "Correctly detects container environment"
    else
        assert_equals "1" "$is_container" "Correctly detects non-container environment"
    fi
    
    # Test Proxmox detection
    detect_proxmox_host
    local is_proxmox=$?
    if [ -f "/etc/pve/local/pve-ssl.pem" ]; then
        assert_equals "0" "$is_proxmox" "Correctly detects Proxmox host"
    else
        assert_equals "1" "$is_proxmox" "Correctly detects non-Proxmox host"
    fi
}

# Test library module loading
test_library_loading() {
    echo -e "${BLUE}Testing library module loading...${NC}"
    
    # Check if library files exist
    local libs=(
        "lib/config-manager.sh"
        "lib/resource-validator.sh"
        "lib/network-detector.sh"
        "lib/health-checks.sh"
        "lib/diagnostics.sh"
        "lib/tui-functions.sh"
    )
    
    for lib in "${libs[@]}"; do
        assert_true "[ -f '$PROJECT_ROOT/$lib' ]" "Library exists: $lib"
    done
}

# Test help function
test_help_output() {
    echo -e "${BLUE}Testing help output...${NC}"
    
    # Run installer with --help
    output=$("$PROJECT_ROOT/install.sh" --help 2>&1 || true)
    
    assert_contains "$output" "Profolio" "Help contains Profolio"
    assert_contains "$output" "--version" "Help contains --version option"
    assert_contains "$output" "--dry-run" "Help contains --dry-run option"
    assert_contains "$output" "--advanced" "Help contains --advanced option"
}

# Main test runner
main() {
    echo "======================================"
    echo "  Profolio Installer Function Tests"
    echo "======================================"
    echo ""
    
    # Run test suites
    test_version_validation
    echo ""
    test_dry_run_mode
    echo ""
    test_file_operations
    echo ""
    test_environment_detection
    echo ""
    test_library_loading
    echo ""
    test_help_output
    echo ""
    
    # Summary
    echo "======================================"
    echo "  Test Summary"
    echo "======================================"
    echo "Total tests run: $TESTS_RUN"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        exit 1
    fi
}

# Run tests
main "$@"