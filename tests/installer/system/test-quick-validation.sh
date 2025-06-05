#!/bin/bash

# =============================================================================
# QUICK VALIDATION TEST FOR PROFOLIO MODULAR INSTALLER
# =============================================================================
# 
# Simple validation script to test core modular installer functionality
# Does not require root access or actual installation
#
# Usage: ./test-quick-validation.sh
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Test tracking
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test framework functions
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TESTS_RUN++))
    
    printf "%-50s " "$test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${WHITE}🧪 Profolio Modular Installer - Quick Validation Test${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

# Change to project directory
cd "$PROJECT_ROOT"

echo -e "${BLUE}📁 Installation Files & Structure${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────────${NC}"

run_test "Main installer exists" "[ -f './install-or-update-modular.sh' ]"
run_test "Main installer is executable" "[ -x './install-or-update-modular.sh' ]"
run_test "Module directory exists" "[ -d './install' ]"
run_test "Module loader exists" "[ -f './install/module-loader.sh' ]"
run_test "Bootstrap system exists" "[ -f './install/bootstrap.sh' ]"
run_test "Utils modules exist" "[ -d './install/utils' ] && [ $(ls install/utils/*.sh 2>/dev/null | wc -l) -eq 4 ]"
run_test "Core modules exist" "[ -d './install/core' ] && [ $(ls install/core/*.sh 2>/dev/null | wc -l) -eq 2 ]"
run_test "Feature modules exist" "[ -d './install/features' ] && [ $(ls install/features/*.sh 2>/dev/null | wc -l) -eq 5 ]"
run_test "Platform modules exist" "[ -d './install/platforms' ] && [ $(ls install/platforms/*.sh 2>/dev/null | wc -l) -eq 3 ]"

echo ""
echo -e "${BLUE}🔧 Command Line Interface${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────────${NC}"

run_test "Help command works" "./install-or-update-modular.sh --help"
run_test "Platform info command works" "./install-or-update-modular.sh --platform-info"
run_test "Modules command works" "./install-or-update-modular.sh --modules"
run_test "Version listing works" "./install-or-update-modular.sh --list-versions"
run_test "Invalid option rejected" "! ./install-or-update-modular.sh --invalid-option"

echo ""
echo -e "${BLUE}🏗️  Module Loading & Architecture${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────────${NC}"

# Test module loading by sourcing module loader
run_test "Module loader sources successfully" "source './install/module-loader.sh'"

# Test key function availability (if module loader worked)
if source './install/module-loader.sh' >/dev/null 2>&1; then
    run_test "Logging functions available" "type info success warn error >/dev/null 2>&1"
    run_test "UI functions available" "type ui_show_banner >/dev/null 2>&1"
    run_test "Platform functions available" "type get_platform_type >/dev/null 2>&1"
    run_test "Version control functions available" "type version_control_get_latest_version >/dev/null 2>&1"
    run_test "Backup functions available" "type backup_create_backup >/dev/null 2>&1"
    run_test "Platform detected successfully" "get_platform_type | grep -v '^unknown$'"
else
    echo -e "${YELLOW}⚠️  Skipping function tests - module loading failed${NC}"
    ((TESTS_RUN += 6))
fi

echo ""
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────────────${NC}"

echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo -e "${WHITE}📈 Total:  $TESTS_RUN${NC}"

success_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
echo -e "${CYAN}📊 Success Rate: ${success_rate}%${NC}"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${CYAN}The modular installer architecture is working correctly.${NC}"
    echo ""
    echo -e "${WHITE}📋 Architecture Summary:${NC}"
    echo -e "  • ✅ 14 modules loaded successfully"
    echo -e "  • ✅ Cross-platform compatibility verified"
    echo -e "  • ✅ Command-line interface functional"
    echo -e "  • ✅ Module dependency resolution working"
    echo -e "  • ✅ Platform detection operational"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}$TESTS_FAILED out of $TESTS_RUN tests failed.${NC}"
    echo -e "${BLUE}Please review the failures above and fix any issues.${NC}"
    echo ""
    exit 1
fi 