#!/bin/bash

echo "🔧 Fixing dpkg/debconf lock issues..."

# Kill any running apt/dpkg processes
echo "Stopping any running package managers..."
sudo killall -9 apt apt-get dpkg 2>/dev/null || true
sleep 2

# Remove lock files
echo "Removing lock files..."
sudo rm -f /var/lib/dpkg/lock-frontend
sudo rm -f /var/lib/dpkg/lock
sudo rm -f /var/cache/apt/archives/lock
sudo rm -f /var/lib/apt/lists/lock

# Fix the debconf lock (the main issue)
echo "Fixing debconf database lock..."
sudo rm -f /var/cache/debconf/*.dat-old
sudo rm -f /var/cache/debconf/config.dat-old
sudo rm -f /var/cache/debconf/passwords.dat-old
sudo rm -f /var/cache/debconf/templates.dat-old

# Reconfigure dpkg
echo "Reconfiguring dpkg..."
sudo dpkg --configure -a

# Fix broken packages
echo "Fixing broken packages..."
sudo apt-get update --fix-missing
sudo apt-get install -f -y

# Force configure specific problematic packages
echo "Force configuring problematic packages..."
sudo DEBIAN_FRONTEND=noninteractive dpkg --configure ca-certificates openssh-server postgresql-common

# Clean up
echo "Cleaning up..."
sudo apt-get clean
sudo apt-get autoremove -y

echo "✅ Lock issues should be fixed. Now try the installer again." 