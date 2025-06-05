#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER LOCAL TESTING FRAMEWORK
# =============================================================================
# Simulate the installer environment locally for debugging
# Tests module loading, variable scoping, and function availability
# =============================================================================

set -euo pipefail

# Test configuration
readonly TEST_DIR="/tmp/profolio-test-$$"
readonly INSTALLER_ROOT="$(pwd)/install"
readonly LOG_FILE="/tmp/profolio-test-$$.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

# Test framework functions
test_log() {
    echo -e "${BLUE}[TEST]${NC} $1" | tee -a "$LOG_FILE"
}

test_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$LOG_FILE"
}

test_fail() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$LOG_FILE"
}

test_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    if [[ -d "$TEST_DIR" ]]; then
        rm -rf "$TEST_DIR"
    fi
}
trap cleanup EXIT

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🧪 PROFOLIO INSTALLER LOCAL TEST SUITE              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Create test environment
test_log "Creating test environment..."
mkdir -p "$TEST_DIR"
cp -r "$INSTALLER_ROOT"/* "$TEST_DIR/" 2>/dev/null || {
    test_fail "Install directory not found. Run from project root."
    exit 1
}
cd "$TEST_DIR"

# =============================================================================
# TEST 1: Analyze Variable Definitions
# =============================================================================
echo ""
echo "📊 TEST 1: Variable Definition Analysis"
echo "══════════════════════════════════════════════════════"

test_log "Scanning for color variable definitions..."

# Find all color variable definitions
color_vars=("RED" "GREEN" "YELLOW" "BLUE" "CYAN" "PURPLE" "WHITE" "NC")
declare -A color_definitions

for var in "${color_vars[@]}"; do
    echo ""
    test_log "Searching for $var definitions:"
    
    # Find all files that define this color
    definitions=$(grep -r "^[[:space:]]*${var}=" . 2>/dev/null | grep -v "readonly" || true)
    readonly_defs=$(grep -r "^[[:space:]]*readonly ${var}=" . 2>/dev/null || true)
    
    if [[ -n "$definitions" ]]; then
        echo "$definitions" | while IFS= read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            value=$(echo "$line" | cut -d= -f2-)
            echo "  • $file: $var=$value"
            color_definitions["$var"]+="$file "
        done
    fi
    
    if [[ -n "$readonly_defs" ]]; then
        echo "$readonly_defs" | while IFS= read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            test_warn "  • $file: Uses 'readonly' (can cause scoping issues)"
        done
    fi
done

# =============================================================================
# TEST 2: Analyze Function Definitions
# =============================================================================
echo ""
echo "📊 TEST 2: Function Definition Analysis"
echo "══════════════════════════════════════════════════════"

test_log "Scanning for logging function definitions..."

# Find all logging function definitions
log_funcs=("info" "warn" "error" "success" "log")
declare -A func_definitions

for func in "${log_funcs[@]}"; do
    echo ""
    test_log "Searching for $func() definitions:"
    
    # Find all files that define this function
    definitions=$(grep -r "^${func}()" . 2>/dev/null || true)
    definitions+=$(grep -r "^[[:space:]]*${func}()" . 2>/dev/null || true)
    
    if [[ -n "$definitions" ]]; then
        echo "$definitions" | while IFS= read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            echo "  • $file"
            func_definitions["$func"]+="$file "
        done
    fi
done

# =============================================================================
# TEST 3: Module Loading Simulation
# =============================================================================
echo ""
echo "📊 TEST 3: Module Loading Simulation"
echo "══════════════════════════════════════════════════════"

test_log "Simulating module loading order..."

# Create a test script that loads modules in order
cat > test_loader.sh << 'EOF'
#!/bin/bash
set -euo pipefail

echo "=== Loading modules in order ==="

# Track what's available after each load
check_availability() {
    local module="$1"
    echo ""
    echo "After loading $module:"
    
    # Check color variables
    for var in RED GREEN YELLOW BLUE CYAN WHITE NC; do
        if [[ -n "${!var:-}" ]]; then
            echo "  ✓ $var is defined"
        else
            echo "  ✗ $var is NOT defined"
        fi
    done
    
    # Check functions
    for func in info warn error success; do
        if command -v $func >/dev/null 2>&1; then
            echo "  ✓ $func() is available"
        else
            echo "  ✗ $func() is NOT available"
        fi
    done
}

# Load utils/logging.sh
if [[ -f "utils/logging.sh" ]]; then
    source "utils/logging.sh"
    check_availability "utils/logging.sh"
fi

# Load utils/platform-detection.sh
if [[ -f "utils/platform-detection.sh" ]]; then
    source "utils/platform-detection.sh"
    check_availability "utils/platform-detection.sh"
fi

# Load platforms/lxc-container.sh
if [[ -f "platforms/lxc-container.sh" ]]; then
    source "platforms/lxc-container.sh"
    check_availability "platforms/lxc-container.sh"
fi

# Test calling Ubuntu platform from LXC
echo ""
echo "=== Testing LXC → Ubuntu call ==="
if command -v handle_lxc-container_platform >/dev/null 2>&1; then
    echo "Calling handle_lxc-container_platform..."
    
    # Create a mock environment
    export EUID=0  # Pretend to be root
    
    # Override functions that would fail in test
    apt-get() { echo "[MOCK] apt-get $*"; return 0; }
    systemctl() { echo "[MOCK] systemctl $*"; return 0; }
    read() { echo "2"; }  # Default to option 2
    
    # Try to run the function
    set +e  # Don't exit on error
    handle_lxc-container_platform 2>&1 | head -20
    set -e
else
    echo "handle_lxc-container_platform not available!"
fi
EOF

chmod +x test_loader.sh
./test_loader.sh 2>&1 | tee module_load_test.log

# =============================================================================
# TEST 4: Variable Scope Analysis
# =============================================================================
echo ""
echo "📊 TEST 4: Variable Scope Issues"
echo "══════════════════════════════════════════════════════"

test_log "Analyzing potential scope issues..."

# Check for problematic patterns
echo ""
test_log "Checking for 'readonly' declarations:"
readonly_count=$(grep -r "readonly" . --include="*.sh" | wc -l)
if [[ $readonly_count -gt 0 ]]; then
    test_warn "Found $readonly_count readonly declarations (can prevent re-definition)"
    grep -r "readonly" . --include="*.sh" | head -5
fi

echo ""
test_log "Checking for 'local' variables in global scope:"
local_issues=$(grep -r "^[[:space:]]*local " . --include="*.sh" | grep -v "function\|()") || true
if [[ -n "$local_issues" ]]; then
    test_warn "Found 'local' used outside functions:"
    echo "$local_issues" | head -5
fi

echo ""
test_log "Checking for conditional definitions:"
conditional_defs=$(grep -r "if.*command -v.*then" . --include="*.sh" | wc -l)
test_log "Found $conditional_defs conditional function definitions"

# =============================================================================
# TEST 5: Direct Ubuntu Platform Test
# =============================================================================
echo ""
echo "📊 TEST 5: Direct Ubuntu Platform Test"
echo "══════════════════════════════════════════════════════"

test_log "Testing Ubuntu platform in isolation..."

cat > test_ubuntu_direct.sh << 'EOF'
#!/bin/bash
set -euo pipefail

# Load just the Ubuntu platform
source platforms/ubuntu.sh

echo "=== Ubuntu Platform Loaded ==="

# Check what's available
echo "Color variables:"
for var in RED GREEN YELLOW BLUE CYAN WHITE NC; do
    if [[ -n "${!var:-}" ]]; then
        echo "  ✓ $var = ${!var}"
    else
        echo "  ✗ $var is NOT defined"
    fi
done

echo ""
echo "Functions:"
for func in info warn error success handle_ubuntu_platform; do
    if command -v $func >/dev/null 2>&1; then
        echo "  ✓ $func() is available"
    else
        echo "  ✗ $func() is NOT available"
    fi
done

# Test the specific line that fails
echo ""
echo "Testing line 145 context:"
sed -n '140,150p' platforms/ubuntu.sh
EOF

chmod +x test_ubuntu_direct.sh
./test_ubuntu_direct.sh 2>&1 | tee ubuntu_direct_test.log

# =============================================================================
# ANALYSIS SUMMARY
# =============================================================================
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    📊 ANALYSIS SUMMARY                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Count issues
duplicate_colors=0
duplicate_funcs=0

for var in "${!color_definitions[@]}"; do
    count=$(echo "${color_definitions[$var]}" | wc -w)
    if [[ $count -gt 1 ]]; then
        ((duplicate_colors++))
        test_warn "$var is defined in $count files"
    fi
done

for func in "${!func_definitions[@]}"; do
    count=$(echo "${func_definitions[$func]}" | wc -w)
    if [[ $count -gt 1 ]]; then
        ((duplicate_funcs++))
        test_warn "$func() is defined in $count files"
    fi
done

echo ""
echo "Issues Found:"
echo "  • Duplicate color definitions: $duplicate_colors"
echo "  • Duplicate function definitions: $duplicate_funcs"
echo "  • Readonly declarations: $readonly_count"
echo ""

echo "Log files created:"
echo "  • Full test log: $LOG_FILE"
echo "  • Module load test: $TEST_DIR/module_load_test.log"
echo "  • Ubuntu direct test: $TEST_DIR/ubuntu_direct_test.log"
echo ""

# Provide recommendations
echo "🔧 RECOMMENDATIONS:"
echo ""
echo "1. Create a central definitions file (install/common/definitions.sh)"
echo "2. Remove duplicate definitions from individual modules"
echo "3. Replace 'readonly' with regular assignments"
echo "4. Use consistent function naming (logging_info vs info)"
echo "5. Export variables and functions at module level"
echo "" 