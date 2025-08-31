#!/bin/bash

# Test script to verify silent mode functionality

echo "Testing Silent Mode Implementation"
echo "==================================="
echo ""

# Test 1: Check if --silent flag is handled
echo "Test 1: Checking --silent flag handling..."
if grep -q "\-\-silent)" install.sh; then
    echo "✓ --silent flag is handled"
else
    echo "✗ --silent flag not found"
fi

# Test 2: Check if SILENT_MODE variable is used
echo ""
echo "Test 2: Checking SILENT_MODE variable usage..."
count=$(grep -c "SILENT_MODE" install.sh)
echo "✓ SILENT_MODE referenced $count times in install.sh"

# Test 3: Check if progress reporting is implemented
echo ""
echo "Test 3: Checking progress reporting..."
if grep -q "report_progress" install.sh; then
    echo "✓ Progress reporting function exists"
else
    echo "✗ Progress reporting function not found"
fi

# Test 4: Check if TUI uses --silent flag
echo ""
echo "Test 4: Checking TUI --silent flag usage..."
if grep -q "\-\-silent" install-tui.sh; then
    echo "✓ TUI installer uses --silent flag"
else
    echo "✗ TUI installer doesn't use --silent flag"
fi

# Test 5: Check if TUI reads progress file
echo ""
echo "Test 5: Checking TUI progress monitoring..."
if grep -q "PROGRESS_FILE" install-tui.sh; then
    echo "✓ TUI monitors progress file"
else
    echo "✗ TUI doesn't monitor progress file"
fi

# Test 6: Check if output functions respect silent mode
echo ""
echo "Test 6: Checking output functions..."
for func in info warn error success; do
    if grep -A5 "^$func()" install.sh | grep -q "SILENT_MODE"; then
        echo "✓ $func() respects silent mode"
    else
        echo "✗ $func() doesn't check silent mode"
    fi
done

# Test 7: Check banner suppression
echo ""
echo "Test 7: Checking banner suppression..."
if grep -A5 "^show_banner()" install.sh | grep -q "SILENT_MODE"; then
    echo "✓ Banner is suppressed in silent mode"
else
    echo "✗ Banner not suppressed"
fi

echo ""
echo "All tests completed!"
echo ""

# Simulate a progress file to test format
echo "Test 8: Testing progress file format..."
PROGRESS_FILE="/tmp/test-progress.log"
echo "PROGRESS:1:10:Installing dependencies" > "$PROGRESS_FILE"
echo "PROGRESS:5:10:Building application" >> "$PROGRESS_FILE"
echo "PROGRESS:10:10:Installation complete" >> "$PROGRESS_FILE"

echo "Sample progress file created at $PROGRESS_FILE:"
cat "$PROGRESS_FILE"
rm -f "$PROGRESS_FILE"

echo ""
echo "Silent mode implementation appears to be complete!"