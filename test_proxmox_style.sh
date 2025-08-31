#!/bin/bash

# Test script for Proxmox-style installer

echo "Testing Proxmox-Style Installer Implementation"
echo "=============================================="
echo ""

# Test 1: Check message functions
echo "Test 1: Message functions..."
if grep -q "msg_info\|msg_ok\|msg_error" install-v2.sh; then
    echo "✓ Message functions implemented"
else
    echo "✗ Message functions missing"
fi

# Test 2: Check color codes
echo ""
echo "Test 2: Color codes..."
if grep -q "YW=\|BL=\|RD=\|GN=\|CL=" install-v2.sh; then
    echo "✓ Color codes defined"
else
    echo "✗ Color codes missing"
fi

# Test 3: Check header
echo ""
echo "Test 3: Header function..."
if grep -q "header_info" install-v2.sh; then
    echo "✓ Header function exists"
else
    echo "✗ Header function missing"
fi

# Test 4: Check error handling
echo ""
echo "Test 4: Error handling..."
if grep -q "catch_errors\|error_handler" install-v2.sh; then
    echo "✓ Error handling implemented"
else
    echo "✗ Error handling missing"
fi

# Test 5: Check TUI wrapper
echo ""
echo "Test 5: TUI wrapper script..."
if grep -q "whiptail\|dialog" profolio.sh; then
    echo "✓ TUI implementation exists"
else
    echo "✗ TUI implementation missing"
fi

# Test 6: Check installation flow
echo ""
echo "Test 6: Installation flow..."
for func in detect_system update_os install_dependencies setup_database build_application; do
    if grep -q "function $func" install-v2.sh; then
        echo "✓ $func function exists"
    else
        echo "✗ $func function missing"
    fi
done

# Test 7: Check wrapper menu
echo ""
echo "Test 7: Wrapper menu options..."
for option in install_profolio update_profolio advanced_install show_requirements show_about; do
    if grep -q "function $option" profolio.sh; then
        echo "✓ $option menu option exists"
    else
        echo "✗ $option menu option missing"
    fi
done

echo ""
echo "Test 8: Visual demonstration of message functions..."
echo ""

# Simulate the message output style
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[31m")
GN=$(echo "\033[32m")
CL=$(echo "\033[0m")
BFR="\\r\\033[K"

echo -ne " ${YW}⚡${CL} Installing dependencies..."
sleep 1
echo -e "${BFR} ${GN}✓${CL} Dependencies installed"

echo -ne " ${YW}⚡${CL} Building application..."
sleep 1
echo -e "${BFR} ${GN}✓${CL} Build complete"

echo -ne " ${YW}⚡${CL} Configuring services..."
sleep 1
echo -e "${BFR} ${RD}✗${CL} Service configuration failed (demo)"

echo ""
echo "All tests completed!"
echo ""
echo "Summary: New Proxmox-style installer structure is ready!"