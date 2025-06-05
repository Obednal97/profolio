#!/bin/bash

# Simple test to verify LXC → Ubuntu flow works without WHITE unbound error

set -euo pipefail

echo "=== Testing LXC Container Installation Flow ==="
echo ""

# Create test directory
TEST_DIR="/tmp/lxc-flow-test-$$"
mkdir -p "$TEST_DIR"
cp -r install/* "$TEST_DIR/"
cd "$TEST_DIR"

# Mock system commands
apt-get() { echo "[MOCK] apt-get $*"; return 0; }
systemctl() { echo "[MOCK] systemctl $*"; return 0; }
dpkg() { echo "[MOCK] dpkg $*"; return 0; }
ufw() { echo "[MOCK] ufw $*"; return 0; }
useradd() { echo "[MOCK] useradd $*"; return 0; }
usermod() { echo "[MOCK] usermod $*"; return 0; }
id() { [[ "$1" == "profolio" ]] && return 1 || return 0; }
read() { REPLY="2"; echo "2"; }
sudo() { shift; "$@"; }
is_root() { return 0; }

# Export all mocks
export -f apt-get systemctl dpkg ufw useradd usermod id read sudo is_root

# Test 1: Direct Ubuntu platform loading
echo "Test 1: Loading Ubuntu platform directly..."
(
    source platforms/ubuntu.sh
    if [[ -z "${WHITE:-}" ]]; then
        echo "❌ FAIL: WHITE not defined after loading ubuntu.sh"
        exit 1
    else
        echo "✅ PASS: WHITE defined = '$WHITE'"
    fi
)

echo ""

# Test 2: LXC wrapper → Ubuntu flow
echo "Test 2: LXC wrapper → Ubuntu flow..."
(
    # Load LXC wrapper
    source platforms/lxc-container.sh
    
    # Check line 145 of ubuntu.sh
    echo "Line 145 of ubuntu.sh:"
    sed -n '145p' platforms/ubuntu.sh
    
    # Try to run the handler
    set +e
    output=$(handle_lxc-container_platform 2>&1)
    exit_code=$?
    set -e
    
    # Check for the specific error
    if echo "$output" | grep -q "WHITE: unbound variable"; then
        echo "❌ FAIL: WHITE variable unbound error still occurs!"
        echo "First 10 lines of output:"
        echo "$output" | head -10
        exit 1
    else
        echo "✅ PASS: No WHITE unbound variable error!"
        echo "Exit code: $exit_code (errors expected in mock environment)"
    fi
)

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo ""
echo "=== Test Complete ===" 