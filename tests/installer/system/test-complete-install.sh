#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - SYSTEM TEST (Updated for v1.12.0)
# =============================================================================
# 
# Comprehensive test for the unified installer architecture
# Tests module loading, dependency resolution, and optional system updates
#
# Usage: ./test-complete-install.sh
# =============================================================================

set -euo pipefail

# Test configuration
TEST_NAME="Profolio Unified Installer System Test"
TEST_VERSION="1.12.0"
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Test framework functions
test_header() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}🧪 $TEST_NAME v$TEST_VERSION${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

test_section() {
    echo ""
    echo -e "${BLUE}📋 $1${NC}"
    echo -e "${BLUE}────────────────────────────────────────${NC}"
}

test_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

test_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

test_skip() {
    echo -e "${YELLOW}⚠️  SKIP:${NC} $1"
    ((TESTS_SKIPPED++))
}

test_info() {
    echo -e "${CYAN}ℹ️  INFO:${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
INSTALLER_PATH="$PROJECT_ROOT/install.sh"

# Start testing
test_header

# Test 1: Check installer exists
test_section "Installation Files"

if [[ -f "$INSTALLER_PATH" ]]; then
    test_pass "Unified installer found at $INSTALLER_PATH"
else
    test_fail "Unified installer not found at $INSTALLER_PATH"
    exit 1
fi

# Test 2: Check module directory structure
if [[ -d "$PROJECT_ROOT/install" ]]; then
    test_pass "Module directory structure exists"
else
    test_fail "Module directory structure missing"
    exit 1
fi

# Test 3: Check for required module files
required_modules=(
    "install/module-loader.sh"
    "install/bootstrap.sh"
    "install/utils/logging.sh"
    "install/utils/ui.sh"
    "install/utils/validation.sh"
    "install/utils/platform-detection.sh"
    "install/core/profolio-installer.sh"
    "install/core/version-control.sh"
    "install/core/rollback.sh"
    "install/features/optimization.sh"
    "install/features/ssh-hardening.sh"
    "install/features/configuration-wizard.sh"
    "install/features/backup-management.sh"
    "install/features/installation-reporting.sh"
    "install/platforms/proxmox.sh"
    "install/platforms/ubuntu.sh"
    "install/platforms/docker.sh"
    "install/platforms/emergency.sh"
)

missing_modules=()
for module in "${required_modules[@]}"; do
    if [[ -f "$PROJECT_ROOT/$module" ]]; then
        test_pass "Module found: $module"
    else
        test_fail "Module missing: $module"
        missing_modules+=("$module")
    fi
done

if [[ ${#missing_modules[@]} -gt 0 ]]; then
    echo -e "${RED}Missing modules prevent testing. Please ensure all modules are present.${NC}"
    exit 1
fi

# Test 4: Help system
test_section "Help System & Information Commands"

cd "$PROJECT_ROOT"

# Test help command
if ./install.sh --help >/dev/null 2>&1; then
    test_pass "Help command works (--help)"
else
    test_fail "Help command failed (--help)"
fi

# Test platform info (should work without root)
if ./install.sh --platform-info >/dev/null 2>&1; then
    test_pass "Platform info command works (--platform-info)"
else
    test_fail "Platform info command failed (--platform-info)"
fi

# Test modules command
if ./install.sh --modules >/dev/null 2>&1; then
    test_pass "Modules command works (--modules)"
else
    test_fail "Modules command failed (--modules)"
fi

# Test 5: Module loading verification
test_section "Module Loading & Architecture"

# Create a test script to check module loading
cat > /tmp/test_module_loading.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

# Try to load the module loader
if [[ -f "./install/module-loader.sh" ]]; then
    source "./install/module-loader.sh" 2>/dev/null
    if [[ "$MODULAR_ARCHITECTURE_LOADED" == "true" ]]; then
        echo "SUCCESS: Modules loaded"
        echo "Platform: ${CURRENT_PLATFORM:-unknown}"
        echo "Modules loaded: ${MODULE_COUNT:-unknown}"
        exit 0
    else
        echo "FAILED: Architecture not loaded"
        exit 1
    fi
else
    echo "FAILED: Module loader not found"
    exit 1
fi
EOF

chmod +x /tmp/test_module_loading.sh

# Run the module loading test
if output=$(cd "$PROJECT_ROOT" && /tmp/test_module_loading.sh 2>&1); then
    test_pass "Module loading successful"
    test_info "$(echo "$output" | head -3)"
else
    test_fail "Module loading failed: $output"
fi

# Test 6: Function availability check
test_section "Module Function Availability"

# Create a test script to check if key functions are available
cat > /tmp/test_functions.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

# Suppress all output except our test results
exec 3>&1 4>&2 >/dev/null 2>&1

source "./install/module-loader.sh"

# Test key functions from each module category
functions_to_test=(
    # Utils
    "info"
    "success" 
    "warn"
    "error"
    "ui_show_banner"
    "validation_validate_version"
    "get_platform_type"
    
    # Core
    "install_profolio_application"
    "version_control_get_latest_version"
    "rollback_create_rollback_point"
    
    # Features
    "optimization_deploy_safe"
    "ssh_configure_server"
    "config_run_installation_wizard"
    "backup_create_backup"
    "reporting_show_installation_summary"
    
    # Platforms
    "handle_proxmox_installation"
    "handle_ubuntu_platform"
    "handle_docker_platform"
    "handle_emergency_installation"
)

missing_functions=()
for func in "${functions_to_test[@]}"; do
    if command -v "$func" >/dev/null 2>&1; then
        echo "FOUND: $func" >&3
    else
        echo "MISSING: $func" >&3
        missing_functions+=("$func")
    fi
done

if [[ ${#missing_functions[@]} -eq 0 ]]; then
    echo "SUCCESS: All key functions available" >&3
    exit 0
else
    echo "FAILED: ${#missing_functions[@]} functions missing" >&3
    exit 1
fi
EOF

chmod +x /tmp/test_functions.sh

if output=$(cd "$PROJECT_ROOT" && /tmp/test_functions.sh 2>&1); then
    available_count=$(echo "$output" | grep "FOUND:" | wc -l)
    test_pass "All key module functions available ($available_count functions)"
else
    missing_count=$(echo "$output" | grep "MISSING:" | wc -l)
    test_fail "Missing module functions detected ($missing_count missing)"
    echo "$output" | grep "MISSING:" | head -5
fi

# Test 7: System Update Option Testing (NEW)
test_section "Optional System Update Flow"

# Test Ubuntu platform system update options
cat > /tmp/test_ubuntu_updates.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

source "./install/module-loader.sh" >/dev/null 2>&1

# Check if Ubuntu platform has the new update function
if command -v "update_package_repositories" >/dev/null 2>&1; then
    echo "SUCCESS: Ubuntu update function available"
    
    # Check if the function contains the new interactive options
    if grep -q "Skip system updates" "./install/platforms/ubuntu.sh"; then
        echo "SUCCESS: Interactive system update options present"
        exit 0
    else
        echo "FAILED: Interactive options missing"
        exit 1
    fi
else
    echo "FAILED: Update function not found"
    exit 1
fi
EOF

chmod +x /tmp/test_ubuntu_updates.sh

if output=$(cd "$PROJECT_ROOT" && /tmp/test_ubuntu_updates.sh 2>&1); then
    test_pass "Ubuntu platform has optional system updates"
    test_info "$(echo "$output" | head -2)"
else
    test_fail "Ubuntu platform system update options missing"
fi

# Test Proxmox platform system update options
if grep -q "Container System Update Options" "$PROJECT_ROOT/install/platforms/proxmox.sh"; then
    test_pass "Proxmox platform has optional container updates"
else
    test_fail "Proxmox platform container update options missing"
fi

# Test Emergency platform system update options
if grep -q "Emergency System Update Options" "$PROJECT_ROOT/install/platforms/emergency.sh"; then
    test_pass "Emergency platform has optional system updates"
else
    test_fail "Emergency platform system update options missing"
fi

# Test 8: Version listing (network dependent)
test_section "Version Control System"

if ./install.sh --list-versions >/dev/null 2>&1; then
    test_pass "Version listing works (--list-versions)"
else
    test_skip "Version listing failed (network or rate limiting issue)"
fi

# Test 9: Bootstrap system check
test_section "Bootstrap System"

if [[ -f "$PROJECT_ROOT/install/bootstrap.sh" ]]; then
    test_pass "Bootstrap system present"
    
    # Test bootstrap loading
    if source "$PROJECT_ROOT/install/bootstrap.sh" >/dev/null 2>&1; then
        test_pass "Bootstrap system loads successfully"
    else
        test_fail "Bootstrap system failed to load"
    fi
else
    test_fail "Bootstrap system missing"
fi

# Test 10: Configuration validation
test_section "Configuration & Validation"

# Test that the installer can validate its own setup
validation_output=$(cd "$PROJECT_ROOT" && ./install.sh --modules 2>&1)
if echo "$validation_output" | grep -q "modules" || echo "$validation_output" | grep -q "loaded"; then
    test_pass "Installer reports module information correctly"
else
    test_fail "Installer reports incorrect module information"
fi

# Test 11: Error handling
test_section "Error Handling"

# Test invalid option
if ./install.sh --invalid-option >/dev/null 2>&1; then
    test_fail "Invalid option should fail but didn't"
else
    test_pass "Invalid options properly rejected"
fi

# Test 12: Platform detection
test_section "Platform Detection System"

cd "$PROJECT_ROOT"

# Create a platform detection test
cat > /tmp/test_platform.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source "./install/module-loader.sh" >/dev/null 2>&1

platform=$(get_platform_type 2>/dev/null)
if [[ -n "$platform" && "$platform" != "unknown" ]]; then
    echo "SUCCESS: Platform detected as $platform"
    exit 0
else
    echo "FAILED: Platform detection returned: $platform"
    exit 1
fi
EOF

chmod +x /tmp/test_platform.sh

if platform_result=$(cd "$PROJECT_ROOT" && /tmp/test_platform.sh 2>&1); then
    test_pass "Platform detection working: $(echo "$platform_result" | cut -d' ' -f4-)"
else
    test_fail "Platform detection failed: $platform_result"
fi

# Test 13: Core installer availability (NEW)
test_section "Core Application Installer"

if [[ -f "$PROJECT_ROOT/install/core/profolio-installer.sh" ]]; then
    test_pass "Core Profolio installer present"
    
    # Test that core installer function is available after module loading
    if source "$PROJECT_ROOT/install/module-loader.sh" >/dev/null 2>&1 && \
       command -v "install_profolio_application" >/dev/null 2>&1; then
        test_pass "Core installer function available"
    else
        test_fail "Core installer function not available"
    fi
else
    test_fail "Core Profolio installer missing"
fi

# Test 14: Memory and performance check
test_section "Performance & Resource Usage"

# Test module loading speed
start_time=$(date +%s%N)
source "$PROJECT_ROOT/install/module-loader.sh" >/dev/null 2>&1
end_time=$(date +%s%N)
load_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

if [[ $load_time -lt 5000 ]]; then  # Less than 5 seconds
    test_pass "Module loading performance good (${load_time}ms)"
else
    test_fail "Module loading too slow (${load_time}ms)"
fi

# Cleanup
rm -f /tmp/test_module_loading.sh /tmp/test_functions.sh /tmp/test_ubuntu_updates.sh /tmp/test_platform.sh

# Final results
test_section "Test Summary"

echo ""
echo -e "${WHITE}📊 TEST RESULTS${NC}"
echo -e "${WHITE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Passed:${NC} $TESTS_PASSED"
echo -e "${RED}❌ Failed:${NC} $TESTS_FAILED"
echo -e "${YELLOW}⚠️  Skipped:${NC} $TESTS_SKIPPED"
echo -e "${WHITE}📈 Total:${NC} $((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))"

echo ""
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${CYAN}The unified installer architecture with optional system updates is working correctly.${NC}"
    echo ""
    echo -e "${WHITE}📋 Features Verified:${NC}"
    echo -e "  • Unified install.sh entry point"
    echo -e "  • Module loading and dependency resolution"  
    echo -e "  • Optional system update prompts"
    echo -e "  • Platform-specific update controls"
    echo -e "  • Emergency recovery capabilities"
    echo -e "  • Core application installer integration"
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED!${NC}"
    echo -e "${YELLOW}$TESTS_FAILED test(s) failed. Please review the failures above.${NC}"
    exit 1
fi 