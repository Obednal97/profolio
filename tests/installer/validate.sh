#!/bin/bash
#
# Profolio Installer Validation Script
# Runs shellcheck and basic validation tests on installer scripts
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Scripts to validate
SCRIPTS=(
    "install.sh"
    "profolio.sh"
    "lib/config-manager.sh"
    "lib/resource-validator.sh"
    "lib/network-detector.sh"
    "lib/health-checks.sh"
    "lib/diagnostics.sh"
    "lib/tui-functions.sh"
)

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        PASS) echo -e "${GREEN}✅${NC} $message" ;;
        FAIL) echo -e "${RED}❌${NC} $message" ;;
        WARN) echo -e "${YELLOW}⚠️${NC} $message" ;;
        INFO) echo -e "${BLUE}ℹ️${NC} $message" ;;
    esac
}

# Check if shellcheck is installed
check_shellcheck() {
    if ! command -v shellcheck &> /dev/null; then
        print_status WARN "shellcheck not installed. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew install shellcheck
        elif command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y shellcheck
        else
            print_status FAIL "Cannot install shellcheck. Please install manually."
            exit 1
        fi
    fi
    print_status PASS "shellcheck is available"
}

# Validate a single script
validate_script() {
    local script=$1
    local full_path="$PROJECT_ROOT/$script"
    
    ((TOTAL++))
    
    # Check if file exists
    if [ ! -f "$full_path" ]; then
        print_status FAIL "$script not found"
        ((FAILED++))
        return 1
    fi
    
    # Check if file is executable
    if [ ! -x "$full_path" ]; then
        print_status WARN "$script is not executable"
        ((WARNINGS++))
    fi
    
    # Run shellcheck with appropriate options
    # SC1091: Not following sourced files
    # SC2086: Double quote to prevent globbing (sometimes intentional)
    # SC2034: Variable appears unused (may be used in sourced files)
    if shellcheck -x -e SC1091 "$full_path" >/dev/null 2>&1; then
        print_status PASS "$script passed shellcheck"
        ((PASSED++))
    else
        # Check severity - only fail on errors, not warnings
        local output=$(shellcheck -x -e SC1091 "$full_path" 2>&1)
        if echo "$output" | grep -q "error:"; then
            print_status FAIL "$script has shellcheck errors"
            ((FAILED++))
            echo "$output" | head -20
        else
            print_status WARN "$script has shellcheck warnings"
            ((WARNINGS++))
            ((PASSED++))
        fi
    fi
}

# Check for common issues
check_common_issues() {
    print_status INFO "Checking for common issues..."
    
    # Check for hardcoded paths
    echo -n "  Checking for hardcoded /home paths... "
    if grep -r "/home/[a-z]" "$PROJECT_ROOT"/{install.sh,profolio.sh,lib/*.sh} 2>/dev/null | grep -v "^#"; then
        print_status WARN "Found hardcoded home paths"
        ((WARNINGS++))
    else
        print_status PASS "No hardcoded home paths"
    fi
    
    # Check for unsafe rm commands (exclude /opt which is safe)
    echo -n "  Checking for unsafe rm commands... "
    if grep -r "rm -rf /" "$PROJECT_ROOT"/{install.sh,profolio.sh,lib/*.sh} 2>/dev/null | grep -v "^#" | grep -v "/opt" | grep -v "/tmp"; then
        print_status FAIL "Found potentially unsafe rm commands"
        ((FAILED++))
    else
        print_status PASS "No unsafe rm commands"
    fi
    
    # Check for proper error handling
    echo -n "  Checking for set -e in main scripts... "
    for script in install.sh profolio.sh; do
        if ! grep -q "^set -e" "$PROJECT_ROOT/$script"; then
            print_status WARN "$script missing 'set -e'"
            ((WARNINGS++))
        fi
    done
    print_status PASS "Error handling check complete"
}

# Validate library dependencies
check_library_dependencies() {
    print_status INFO "Checking library dependencies..."
    
    # Check if all libraries referenced in profolio.sh exist
    local libs=$(grep -o 'source.*lib/[^"]*\.sh' "$PROJECT_ROOT/profolio.sh" | sed 's/source.*lib\//lib\//')
    for lib in $libs; do
        if [ -f "$PROJECT_ROOT/$lib" ]; then
            print_status PASS "$lib exists"
        else
            print_status FAIL "$lib not found"
            ((FAILED++))
        fi
    done
}

# Check for required commands
check_required_commands() {
    print_status INFO "Checking for required system commands..."
    
    local commands=(
        "curl"
        "wget"
        "git"
        "systemctl"
        "sudo"
    )
    
    for cmd in "${commands[@]}"; do
        if command -v $cmd &> /dev/null; then
            print_status PASS "$cmd is available"
        else
            print_status WARN "$cmd not found (may be required for installation)"
            ((WARNINGS++))
        fi
    done
}

# Main function
main() {
    echo "======================================"
    echo "  Profolio Installer Validation"
    echo "======================================"
    echo ""
    
    # Check shellcheck availability
    check_shellcheck
    echo ""
    
    # Validate each script
    print_status INFO "Validating installer scripts..."
    for script in "${SCRIPTS[@]}"; do
        validate_script "$script"
    done
    echo ""
    
    # Check common issues
    check_common_issues
    echo ""
    
    # Check library dependencies
    check_library_dependencies
    echo ""
    
    # Check required commands
    check_required_commands
    echo ""
    
    # Summary
    echo "======================================"
    echo "  Validation Summary"
    echo "======================================"
    echo "Total scripts checked: $TOTAL"
    echo -e "${GREEN}Passed: $PASSED${NC}"
    echo -e "${RED}Failed: $FAILED${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        print_status PASS "All critical checks passed!"
        exit 0
    else
        print_status FAIL "Some checks failed. Please review and fix."
        exit 1
    fi
}

# Run main function
main "$@"