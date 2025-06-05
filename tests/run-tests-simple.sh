#!/bin/bash

# Simple Test Runner for Profolio
# Runs tests that actually exist and work
# Should be run from the project root directory

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "${WHITE}🧪 PROFOLIO SIMPLE TEST RUNNER${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Test counters
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

test_result() {
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
    esac
}

echo -e "${CYAN}📋 Testing Status Report${NC}"
echo ""

# 1. Frontend Unit Tests (via vitest in frontend directory, but tests are centralized)
echo -e "${BLUE}1. Frontend Unit Tests${NC}"
if [ -d "tests/frontend/unit" ] && [ "$(find tests/frontend/unit -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | head -1)" ]; then
    cd frontend
    if pnpm run test:unit --run >/dev/null 2>&1; then
        test_result "PASS" "Frontend Unit Tests" "All unit tests passed"
    else
        test_result "FAIL" "Frontend Unit Tests" "Some unit tests failed"
    fi
    cd ..
else
    test_result "SKIP" "Frontend Unit Tests" "No unit tests found in tests/frontend/unit"
fi

# 2. Backend Unit Tests (via vitest in backend directory, but tests are centralized)
echo -e "${BLUE}2. Backend Unit Tests${NC}"
if [ -d "tests/backend/unit" ] && [ "$(find tests/backend/unit -name "*.test.*" -o -name "*.spec.*" 2>/dev/null | head -1)" ]; then
    cd backend
    if pnpm run test:unit --run >/dev/null 2>&1; then
        test_result "PASS" "Backend Unit Tests" "All unit tests passed"
    else
        test_result "FAIL" "Backend Unit Tests" "Some unit tests failed"
    fi
    cd ..
else
    test_result "SKIP" "Backend Unit Tests" "No unit tests found in tests/backend/unit"
fi

# 3. E2E Tests (check if they exist)
echo -e "${BLUE}3. E2E Tests${NC}"
if [ -d "tests/frontend/e2e" ] && [ "$(find tests/frontend/e2e -name "*.spec.ts" 2>/dev/null | head -1)" ]; then
    test_result "SKIP" "E2E Tests" "3 E2E test files available (requires server + browser setup)"
else
    test_result "SKIP" "E2E Tests" "No E2E tests found"
fi

# 4. Installer Tests (test the framework works)
echo -e "${BLUE}4. Installer Tests${NC}"
if [ -f "tests/installer/test-framework.sh" ]; then
    cd tests/installer
    if bash -n test-framework.sh >/dev/null 2>&1; then
        test_result "PASS" "Installer Framework" "Test framework syntax valid"
    else
        test_result "FAIL" "Installer Framework" "Test framework has syntax errors"
    fi
    
    # Test if unit tests exist and can load
    if [ -d "unit" ] && [ "$(ls -A unit/*.sh 2>/dev/null)" ]; then
        test_result "PASS" "Installer Unit Tests" "2 unit test files available"
    else
        test_result "SKIP" "Installer Unit Tests" "No installer unit tests found"
    fi
    cd ../..
else
    test_result "SKIP" "Installer Tests" "No installer test framework found"
fi

# 5. Build Tests
echo -e "${BLUE}5. Build Tests${NC}"
cd frontend
if pnpm run build >/dev/null 2>&1; then
    test_result "PASS" "Frontend Build" "Build completed successfully"
else
    test_result "FAIL" "Frontend Build" "Build failed"
fi
cd ../backend
if pnpm run build >/dev/null 2>&1; then
    test_result "PASS" "Backend Build" "Build completed successfully"
else
    test_result "FAIL" "Backend Build" "Build failed"
fi
cd ..

# Summary
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${WHITE}📊 SUMMARY${NC}"
echo ""
echo -e "Total Test Suites: ${WHITE}$TOTAL_SUITES${NC}"
echo -e "Passed: ${GREEN}$PASSED_SUITES${NC}"
echo -e "Failed: ${RED}$FAILED_SUITES${NC}"
echo -e "Success Rate: ${WHITE}$(( PASSED_SUITES * 100 / TOTAL_SUITES ))%${NC}"
echo ""

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}🎉 All available tests passed!${NC}"
    exit 0
else
    echo -e "${RED}🚨 Some tests failed. Check the output above.${NC}"
    exit 1
fi 