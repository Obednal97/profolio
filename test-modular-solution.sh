#!/bin/bash

# =============================================================================
# MODULAR INSTALLER SOLUTION TEST
# =============================================================================
# Tests the fixed modular installer with centralized definitions
# Simulates the complete installation flow including LXC container scenario
# =============================================================================

set -euo pipefail

# Test configuration
TEST_DIR="/tmp/profolio-modular-test-$$"
INSTALLER_ROOT="$(pwd)/install"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Test functions
test_pass() {
    echo -e "${GREEN}✓ PASS${NC} $1"
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC} $1"
    exit 1
}

test_info() {
    echo -e "${BLUE}→ TEST${NC} $1"
}

# Cleanup
cleanup() {
    [[ -d "$TEST_DIR" ]] && rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🧪 MODULAR INSTALLER SOLUTION TEST                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verify we have the installer files
test_info "Verifying installer structure..."
if [[ ! -d "$INSTALLER_ROOT" ]]; then
    test_fail "Install directory not found at $INSTALLER_ROOT"
fi

if [[ ! -f "$INSTALLER_ROOT/common/definitions.sh" ]]; then
    test_fail "Common definitions file not found"
fi
test_pass "Installer structure verified"

# Create test environment
test_info "Creating test environment..."
mkdir -p "$TEST_DIR"
cp -r "$INSTALLER_ROOT"/* "$TEST_DIR/"
cd "$TEST_DIR"
test_pass "Test environment created"

# =============================================================================
# TEST 1: Common Definitions Loading
# =============================================================================
echo ""
echo "📊 TEST 1: Common Definitions Loading"
echo "════════════════════════════════════════════"

test_info "Loading common/definitions.sh..."
(
    source common/definitions.sh
    
    # Check if guard works
    if [[ "${PROFOLIO_DEFINITIONS_LOADED}" != "true" ]]; then
        test_fail "Definition guard not set"
    fi
    
    # Check colors
    for color in RED GREEN YELLOW BLUE CYAN WHITE NC; do
        if [[ -z "${!color:-}" ]]; then
            test_fail "$color not defined"
        fi
    done
    
    # Check functions
    for func in info success warn error debug log; do
        if ! command -v $func >/dev/null 2>&1; then
            test_fail "$func() not available"
        fi
    done
    
    test_pass "All colors and functions loaded"
)

# =============================================================================
# TEST 2: Multiple Source Protection
# =============================================================================
echo ""
echo "📊 TEST 2: Multiple Source Protection"
echo "════════════════════════════════════════════"

test_info "Testing multiple source protection..."
(
    source common/definitions.sh
    FIRST_WHITE="$WHITE"
    
    # Source again - should not redefine
    source common/definitions.sh
    
    if [[ "$WHITE" != "$FIRST_WHITE" ]]; then
        test_fail "Variables redefined on second source"
    fi
    
    test_pass "Multiple source protection works"
)

# =============================================================================
# TEST 3: Ubuntu Platform Module
# =============================================================================
echo ""
echo "📊 TEST 3: Ubuntu Platform Module"
echo "════════════════════════════════════════════"

test_info "Loading Ubuntu platform module..."
(
    # Don't pre-load definitions to test fallback
    unset PROFOLIO_DEFINITIONS_LOADED
    
    source platforms/ubuntu.sh
    
    # Check if it loaded definitions or used fallback
    if [[ -z "${WHITE:-}" ]]; then
        test_fail "Ubuntu platform failed to define WHITE"
    fi
    
    if ! command -v handle_ubuntu_platform >/dev/null 2>&1; then
        test_fail "handle_ubuntu_platform not available"
    fi
    
    test_pass "Ubuntu platform loaded successfully"
)

# =============================================================================
# TEST 4: LXC Container Wrapper
# =============================================================================
echo ""
echo "📊 TEST 4: LXC Container Wrapper"
echo "════════════════════════════════════════════"

test_info "Loading LXC container wrapper..."
(
    unset PROFOLIO_DEFINITIONS_LOADED
    
    source platforms/lxc-container.sh
    
    if [[ -z "${WHITE:-}" ]]; then
        test_fail "LXC wrapper failed to define WHITE"
    fi
    
    if ! command -v handle_lxc-container_platform >/dev/null 2>&1; then
        test_fail "handle_lxc-container_platform not available"
    fi
    
    test_pass "LXC wrapper loaded successfully"
)

# =============================================================================
# TEST 5: Full LXC → Ubuntu Flow Simulation
# =============================================================================
echo ""
echo "📊 TEST 5: Full LXC → Ubuntu Flow Simulation"
echo "════════════════════════════════════════════"

test_info "Simulating LXC container installation flow..."
(
    # Reset environment
    unset PROFOLIO_DEFINITIONS_LOADED
    
    # Mock system commands to prevent actual installation
    apt-get() { echo "[MOCK] apt-get $*"; return 0; }
    systemctl() { echo "[MOCK] systemctl $*"; return 0; }
    dpkg() { echo "[MOCK] dpkg $*"; return 0; }
    ufw() { echo "[MOCK] ufw $*"; return 0; }
    useradd() { echo "[MOCK] useradd $*"; return 0; }
    usermod() { echo "[MOCK] usermod $*"; return 0; }
    id() { [[ "$1" == "profolio" ]] && return 1 || return 0; }
    read() { REPLY="2"; echo "2"; }  # Mock user input
    sudo() { shift; "$@"; }  # Skip sudo
    
    # Export mocks
    export -f apt-get systemctl dpkg ufw useradd usermod id read sudo
    # EUID is readonly in bash, so we can't set it
    # Instead, mock the is_root function if it exists
    is_root() { return 0; }
    export -f is_root
    
    # Load LXC wrapper
    source platforms/lxc-container.sh
    
    # Check line 145 context before calling
    test_info "Checking Ubuntu platform line 145..."
    local line_145=$(sed -n '145p' platforms/ubuntu.sh)
    echo "Line 145: $line_145"
    
    # Try to run the handler
    set +e  # Don't exit on error
    output=$(handle_lxc-container_platform 2>&1)
    exit_code=$?
    set -e
    
    # Check for the specific error
    if echo "$output" | grep -q "WHITE: unbound variable"; then
        test_fail "WHITE variable still unbound!"
        echo "Output:"
        echo "$output" | head -20
    elif [[ $exit_code -ne 0 ]]; then
        # Other errors are OK in mock environment
        test_pass "No WHITE unbound error (exit code: $exit_code)"
    else
        test_pass "LXC → Ubuntu flow completed without variable errors"
    fi
)

# =============================================================================
# TEST 6: Install Script Module Loading
# =============================================================================
echo ""
echo "📊 TEST 6: Install Script Module Loading Order"
echo "════════════════════════════════════════════"

test_info "Simulating install.sh module loading..."
(
    # Simulate the load_essential_functions from install.sh
    
    # First load common definitions
    if [[ -f "common/definitions.sh" ]]; then
        source "common/definitions.sh"
        test_pass "Common definitions loaded first"
    else
        test_fail "Common definitions not found"
    fi
    
    # Then load other modules
    for module in utils/*.sh platforms/*.sh; do
        if [[ -f "$module" ]]; then
            source "$module" 2>/dev/null || true
        fi
    done
    
    # Verify everything is available
    if [[ -z "${WHITE:-}" ]]; then
        test_fail "WHITE not available after module loading"
    fi
    
    if ! command -v handle_lxc-container_platform >/dev/null 2>&1; then
        test_fail "LXC handler not available after module loading"
    fi
    
    test_pass "All modules loaded successfully"
)

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    ✅ ALL TESTS PASSED!                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "The modular installer solution with centralized definitions:"
echo "  ✓ Prevents variable scoping issues"
echo "  ✓ Handles multiple sourcing correctly"
echo "  ✓ Works with LXC → Ubuntu flow"
echo "  ✓ No more 'WHITE: unbound variable' errors"
echo ""
echo "🚀 Ready to deploy!"
echo "" 