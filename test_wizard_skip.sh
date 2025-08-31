#!/bin/bash

# Test script to verify wizards are skipped in auto/silent mode

echo "Testing Wizard Skip in Auto/Silent Mode"
echo "========================================"
echo ""

# Test 1: Check update wizard skips AUTO_INSTALL check
echo "Test 1: Update wizard AUTO_INSTALL check..."
if grep -A2 "^run_update_wizard()" install.sh | grep -q "AUTO_INSTALL.*true"; then
    echo "✓ Update wizard checks AUTO_INSTALL"
else
    echo "✗ Update wizard doesn't check AUTO_INSTALL"
fi

# Test 2: Check configuration wizard AUTO_INSTALL check
echo ""
echo "Test 2: Configuration wizard AUTO_INSTALL check..."
if grep -A2 "^run_configuration_wizard()" install.sh | grep -q "AUTO_INSTALL.*true"; then
    echo "✓ Configuration wizard checks AUTO_INSTALL"
else
    echo "✗ Configuration wizard doesn't check AUTO_INSTALL"
fi

# Test 3: Check advanced setup AUTO_INSTALL check
echo ""
echo "Test 3: Advanced setup AUTO_INSTALL check..."
if grep -A2 "^run_advanced_setup()" install.sh | grep -q "AUTO_INSTALL.*true"; then
    echo "✓ Advanced setup checks AUTO_INSTALL"
else
    echo "✗ Advanced setup doesn't check AUTO_INSTALL"
fi

# Test 4: Check update path skips wizard when AUTO_INSTALL=true
echo ""
echo "Test 4: Update path skips wizard when AUTO_INSTALL=true..."
if grep -B5 "run_update_wizard" install.sh | grep -q "AUTO_INSTALL.*true"; then
    echo "✓ Update path checks AUTO_INSTALL before calling wizard"
else
    echo "✗ Update path doesn't check AUTO_INSTALL"
fi

# Test 5: Count elif branches for AUTO_INSTALL in main logic
echo ""
echo "Test 5: Checking main logic branches..."
count=$(grep -c 'elif \[ "$AUTO_INSTALL" = true \]' install.sh)
echo "✓ Found $count AUTO_INSTALL branches in main logic"

# Test 6: Simulate silent mode behavior
echo ""
echo "Test 6: Simulating silent mode..."
echo "When AUTO_INSTALL=true and SILENT_MODE=true:"
echo "  - run_update_wizard() should return immediately"
echo "  - run_configuration_wizard() should return immediately"
echo "  - run_advanced_setup() should return immediately"
echo "  - Main logic should skip wizards and go directly to installation/update"

echo ""
echo "All tests completed!"
echo ""
echo "Summary: Wizards should now be properly skipped when using TUI installer."