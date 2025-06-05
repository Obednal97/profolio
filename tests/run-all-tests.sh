#!/bin/bash

# =============================================================================
# PROFOLIO - COMPREHENSIVE TEST RUNNER v1.0.0
# =============================================================================
# 
# Runs all tests across the entire application including:
# - Frontend unit tests (Vitest)
# - Frontend E2E tests (Playwright)
# - Backend unit tests (Vitest)
# - Backend integration tests
# - Installer tests (all categories)
# - System integration tests
#
# Usage: ./run-all-tests.sh [--category] [--verbose] [--parallel] [--coverage]
# =============================================================================

set -e

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Test counters
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0
VERBOSE=false
PARALLEL=false
COVERAGE=false
CATEGORY=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend|--frontend-unit)
            CATEGORY="frontend-unit"
            shift
            ;;
        --frontend-e2e|--e2e)
            CATEGORY="frontend-e2e"
            shift
            ;;
        --backend|--backend-unit)
            CATEGORY="backend-unit"
            shift
            ;;
        --backend-integration)
            CATEGORY="backend-integration"
            shift
            ;;
        --installer)
            CATEGORY="installer"
            shift
            ;;
        --system)
            CATEGORY="system"
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --coverage)
            COVERAGE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Test Categories:"
            echo "  --frontend-unit      Run frontend unit tests (Vitest)"
            echo "  --frontend-e2e       Run frontend E2E tests (Playwright)"
            echo "  --backend-unit       Run backend unit tests (Vitest)"
            echo "  --backend-integration Run backend integration tests"
            echo "  --installer          Run installer tests"
            echo "  --system             Run system integration tests"
            echo ""
            echo "Options:"
            echo "  --verbose            Verbose output"
            echo "  --parallel           Run tests in parallel where possible"
            echo "  --coverage           Generate coverage reports"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                   Run all tests"
            echo "  $0 --frontend-unit   Run only frontend unit tests"
            echo "  $0 --coverage        Run all tests with coverage"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${WHITE}🧪 PROFOLIO COMPREHENSIVE TEST SUITE v1.0.0${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Logging function
log_test_result() {
    local status="$1"
    local suite="$2"
    local message="$3"
    
    ((TOTAL_SUITES++))
    
    case "$status" in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $suite - $message"
            ((PASSED_SUITES++))
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $suite - $message"
            ((FAILED_SUITES++))
            ;;
        "SKIP")
            echo -e "${YELLOW}⏭️  SKIP${NC}: $suite - $message"
            ;;
        "INFO")
            echo -e "${CYAN}ℹ️  INFO${NC}: $suite - $message"
            ;;
    esac
}

# Check if dependencies are available
check_dependencies() {
    local missing_deps=()
    
    # Check for pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        missing_deps+=("pnpm")
    fi
    
    # Check for Node.js
    if ! command -v node >/dev/null 2>&1; then
        missing_deps+=("node")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_test_result "INFO" "Dependencies" "All required dependencies available"
}

# Frontend Unit Tests (Vitest)
run_frontend_unit_tests() {
    echo -e "\n${CYAN}🧪 Frontend Unit Tests (Vitest)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ ! -d "frontend/src" ]]; then
        log_test_result "SKIP" "Frontend Unit" "Frontend source directory not found"
        return 0
    fi
    
    cd frontend
    
    local test_command="pnpm run test:unit"
    if [[ "$COVERAGE" == "true" ]]; then
        test_command="$test_command --coverage"
    fi
    
    if $test_command 2>/dev/null; then
        log_test_result "PASS" "Frontend Unit" "All unit tests passed"
        cd ..
        return 0
    else
        log_test_result "FAIL" "Frontend Unit" "Unit tests failed"
        cd ..
        return 1
    fi
}

# Frontend E2E Tests (Playwright)
run_frontend_e2e_tests() {
    echo -e "\n${CYAN}🎭 Frontend E2E Tests (Playwright)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ ! -d "tests/frontend/e2e" ]]; then
        log_test_result "SKIP" "Frontend E2E" "E2E test directory not found"
        return 0
    fi
    
    cd tests/frontend/e2e
    
    # Check if Playwright is available in frontend
    if ! (cd ../../../frontend && pnpm playwright --version >/dev/null 2>&1); then
        log_test_result "SKIP" "Frontend E2E" "Playwright not installed"
        cd ../../..
        return 0
    fi
    
    if (cd ../../../frontend && pnpm playwright test --config ../tests/frontend/e2e/playwright.config.ts) 2>/dev/null; then
        log_test_result "PASS" "Frontend E2E" "All E2E tests passed"
        cd ../../..
        return 0
    else
        log_test_result "FAIL" "Frontend E2E" "E2E tests failed"
        cd ../../..
        return 1
    fi
}

# Backend Unit Tests (Vitest)
run_backend_unit_tests() {
    echo -e "\n${CYAN}⚙️ Backend Unit Tests (Vitest)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ ! -d "backend/src" ]]; then
        log_test_result "SKIP" "Backend Unit" "Backend source directory not found"
        return 0
    fi
    
    cd backend
    
    local test_command="pnpm run test:unit"
    if [[ "$COVERAGE" == "true" ]]; then
        test_command="$test_command --coverage"
    fi
    
    if $test_command 2>/dev/null; then
        log_test_result "PASS" "Backend Unit" "All unit tests passed"
        cd ..
        return 0
    else
        log_test_result "FAIL" "Backend Unit" "Unit tests failed"
        cd ..
        return 1
    fi
}

# Backend Integration Tests
run_backend_integration_tests() {
    echo -e "\n${CYAN}🔗 Backend Integration Tests${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ ! -d "tests/backend/integration" ]]; then
        log_test_result "SKIP" "Backend Integration" "Integration test directory not found"
        return 0
    fi
    
    # Check if any integration test files exist
    if ! find tests/backend/integration -name "*.test.*" -o -name "*.spec.*" | grep -q .; then
        log_test_result "SKIP" "Backend Integration" "No integration test files found"
        return 0
    fi
    
    cd backend
    
    if pnpm run test:integration 2>/dev/null; then
        log_test_result "PASS" "Backend Integration" "All integration tests passed"
        cd ..
        return 0
    else
        log_test_result "FAIL" "Backend Integration" "Integration tests failed"
        cd ..
        return 1
    fi
}

# Installer Tests (All Categories)
run_installer_tests() {
    echo -e "\n${CYAN}🔧 Installer Tests${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ ! -f "tests/installer/run-all-tests.sh" ]]; then
        log_test_result "SKIP" "Installer Tests" "Installer test runner not found"
        return 0
    fi
    
    cd tests/installer
    
    if bash run-all-tests.sh --all >/dev/null 2>&1; then
        log_test_result "PASS" "Installer Tests" "All installer tests passed"
        cd ../..
        return 0
    else
        log_test_result "FAIL" "Installer Tests" "Installer tests failed"
        cd ../..
        return 1
    fi
}

# System Integration Tests
run_system_tests() {
    echo -e "\n${CYAN}🌐 System Integration Tests${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [[ ! -d "tests/system" ]]; then
        log_test_result "SKIP" "System Tests" "System test directory not found"
        return 0
    fi
    
    # Run installer module tests
    if [[ -f "tests/system/test-installer-modules.sh" ]]; then
        if bash tests/system/test-installer-modules.sh >/dev/null 2>&1; then
            log_test_result "PASS" "System Tests" "Installer module tests passed"
        else
            log_test_result "FAIL" "System Tests" "Installer module tests failed"
            return 1
        fi
    else
        log_test_result "SKIP" "System Tests" "No system test files found"
        return 0
    fi
    
    return 0
}

# Main execution function
run_tests() {
    local exit_code=0
    
    # Check dependencies first
    check_dependencies
    
    # Run tests based on category or run all
    case "$CATEGORY" in
        "frontend-unit")
            run_frontend_unit_tests || exit_code=1
            ;;
        "frontend-e2e")
            run_frontend_e2e_tests || exit_code=1
            ;;
        "backend-unit")
            run_backend_unit_tests || exit_code=1
            ;;
        "backend-integration")
            run_backend_integration_tests || exit_code=1
            ;;
        "installer")
            run_installer_tests || exit_code=1
            ;;
        "system")
            run_system_tests || exit_code=1
            ;;
        "")
            # Run all tests
            run_frontend_unit_tests || exit_code=1
            run_frontend_e2e_tests || exit_code=1
            run_backend_unit_tests || exit_code=1
            run_backend_integration_tests || exit_code=1
            run_installer_tests || exit_code=1
            run_system_tests || exit_code=1
            ;;
        *)
            echo -e "${RED}❌ Unknown category: $CATEGORY${NC}"
            exit 1
            ;;
    esac
    
    # Print summary
    echo -e "\n${WHITE}📊 TEST SUMMARY${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Total Test Suites: ${WHITE}$TOTAL_SUITES${NC}"
    echo -e "Passed: ${GREEN}$PASSED_SUITES${NC}"
    echo -e "Failed: ${RED}$FAILED_SUITES${NC}"
    
    if [[ $FAILED_SUITES -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo ""
        echo -e "${CYAN}📋 Test Coverage:${NC}"
        echo -e "  • ${WHITE}Frontend Unit Tests${NC} - Vitest"
        echo -e "  • ${WHITE}Frontend E2E Tests${NC} - Playwright"
        echo -e "  • ${WHITE}Backend Unit Tests${NC} - Vitest"
        echo -e "  • ${WHITE}Backend Integration Tests${NC} - Vitest"
        echo -e "  • ${WHITE}Installer Tests${NC} - Comprehensive framework"
        echo -e "  • ${WHITE}System Integration Tests${NC} - End-to-end validation"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
        echo -e "${YELLOW}⚠️  Please review failed test suites and fix issues.${NC}"
        echo ""
    fi
    
    return $exit_code
}

# Run the tests
run_tests
exit $? 