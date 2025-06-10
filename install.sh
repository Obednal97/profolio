#!/bin/bash

# Profolio Installation Launcher
# This script redirects to the appropriate installer

echo "🚀 Profolio Installation Launcher"
echo "================================="
echo ""
echo "Available installation options:"
echo ""
echo "1. Standard Installation"
echo "2. Proxmox Installation"
echo ""
read -p "Choose installation type (1-2): " choice

case $choice in
    1)
        echo "🔄 Starting standard installation..."
        exec ./scripts/installers/install-or-update.sh "$@"
        ;;
    2)
        echo "🔄 Starting Proxmox installation..."
        exec ./scripts/installers/proxmox-install-or-update.sh "$@"
        ;;
    *)
        echo "❌ Invalid choice. Please run again and select 1 or 2."
        exit 1
        ;;
esac 