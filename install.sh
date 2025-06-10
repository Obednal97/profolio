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

# Function to run standard installation
run_standard_install() {
    # Check if local installer exists
    if [ -f "./scripts/installers/install-or-update.sh" ]; then
        echo "🔄 Using local installer..."
        exec ./scripts/installers/install-or-update.sh "$@"
    else
        echo "🔄 Local installer not found, downloading latest from repository..."
        bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/scripts/installers/install-or-update.sh)" "$@"
    fi
}

# Function to run Proxmox installation
run_proxmox_install() {
    # Check if local Proxmox installer exists
    if [ -f "./scripts/installers/proxmox-install-or-update.sh" ]; then
        echo "🔄 Using local Proxmox installer..."
        exec ./scripts/installers/proxmox-install-or-update.sh "$@"
    else
        echo "🔄 Local Proxmox installer not found, downloading latest from repository..."
        bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/scripts/installers/proxmox-install-or-update.sh)" "$@"
    fi
}

case $choice in
    1)
        echo "🔄 Starting standard installation..."
        run_standard_install "$@"
        ;;
    2)
        echo "🔄 Starting Proxmox installation..."
        run_proxmox_install "$@"
        ;;
    *)
        echo "❌ Invalid choice. Please run again and select 1 or 2."
        exit 1
        ;;
esac 