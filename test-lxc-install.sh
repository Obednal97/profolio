#!/bin/bash

# Test script for LXC container installation
echo "Testing LXC container installation with fresh download..."

# Force fresh download with timestamp to bypass caches
TIMESTAMP=$(date +%s)
INSTALLER_URL="https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh?t=$TIMESTAMP"

echo "Downloading installer with cache buster: $INSTALLER_URL"

# Download and test
curl -fsSL "$INSTALLER_URL" > /tmp/test-installer-$TIMESTAMP.sh

echo "Checking if lxc-container.sh is in the download list..."
grep -A 20 "local modules" /tmp/test-installer-$TIMESTAMP.sh | grep "lxc-container"

echo ""
echo "Checking platform detection logic..."
grep -A 20 "install_for_platform" /tmp/test-installer-$TIMESTAMP.sh | head -25

echo ""
echo "Test complete. You can run this installer with:"
echo "sudo bash /tmp/test-installer-$TIMESTAMP.sh" 