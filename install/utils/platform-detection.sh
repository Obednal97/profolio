#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - PLATFORM DETECTION UTILITY v1.0.0
# =============================================================================
# 
# Platform detection utilities for determining installation environment
# Supports: Proxmox host, LXC container, Docker container, generic Ubuntu/Debian
#
# Compatible: Ubuntu/Debian, Proxmox LXC, Docker
# Dependencies: utils/logging.sh
# =============================================================================

# Module info function
platform_detection_info() {
    echo "Platform Detection Utility v1.0.0"
    echo "  • Detects Proxmox host environment"
    echo "  • Identifies LXC container execution"
    echo "  • Detects Docker container environment"
    echo "  • Determines generic Ubuntu/Debian systems"
    echo "  • Provides platform-specific configuration paths"
}

# Check if this module is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    if [ -n "${INSTALLER_DEBUG:-}" ]; then
        echo "[DEBUG] Platform detection module loaded"
    fi
else
    # Being executed directly
    echo "Platform Detection Utility v1.0.0"
    echo "This module should be sourced, not executed directly."
    echo "Usage: source install/utils/platform-detection.sh"
    exit 1
fi

# Detect if we're running on Proxmox host
detect_proxmox_host() {
    if [ -f "/etc/pve/local/pve-ssl.pem" ] && command -v pct >/dev/null 2>&1; then
        return 0  # Running on Proxmox host
    else
        return 1  # Not on Proxmox host
    fi
}

# Check if we're inside an LXC container
detect_lxc_container() {
    # First check if it's a Docker container
    if [ -f "/.dockerenv" ]; then
        return 1  # Docker container, not LXC
    elif [ -f "/proc/1/environ" ] && grep -q "container=lxc" /proc/1/environ 2>/dev/null; then
        return 0  # Inside LXC container
    elif [ -d "/proc/vz" ] && [ ! -d "/proc/bc" ]; then
        return 0  # OpenVZ/LXC container
    else
        return 1  # Not in LXC container
    fi
}

# Check if we're inside a Docker container
detect_docker_container() {
    if [ -f "/.dockerenv" ]; then
        return 0  # Inside Docker container
    elif [ -f "/proc/1/cgroup" ] && grep -q docker /proc/1/cgroup 2>/dev/null; then
        return 0  # Inside Docker container (alternative detection)
    else
        return 1  # Not in Docker container
    fi
}

# Detect if running in WSL (Windows Subsystem for Linux)
detect_wsl() {
    if [ -f "/proc/version" ] && grep -q Microsoft /proc/version 2>/dev/null; then
        return 0  # Running in WSL
    elif [ -f "/proc/version" ] && grep -q WSL /proc/version 2>/dev/null; then
        return 0  # Running in WSL2
    else
        return 1  # Not in WSL
    fi
}

# Detect if running on Unraid system
detect_unraid() {
    if [ -f "/etc/unraid-version" ] || [ -d "/boot/config" && -f "/usr/local/sbin/emhttp" ]; then
        return 0  # Running on Unraid
    else
        return 1  # Not on Unraid
    fi
}

# Get the platform type as a string
get_platform_type() {
    if detect_proxmox_host; then
        echo "proxmox-host"
    elif detect_unraid; then
        echo "unraid"
    elif detect_lxc_container; then
        echo "lxc-container"
    elif detect_docker_container; then
        echo "docker-container"
    elif detect_wsl; then
        echo "wsl"
    else
        echo "generic-linux"
    fi
}

# Get platform-specific information
get_platform_info() {
    local platform_type
    platform_type=$(get_platform_type)
    
    case "$platform_type" in
        "proxmox-host")
            echo "Platform: Proxmox VE Host"
            echo "Recommendation: Create LXC container for Profolio"
            echo "Features: Container management, VM management, clustering"
            ;;
        "unraid")
            echo "Platform: Unraid Server"
            echo "Recommendation: Use Docker installation via Unraid's Docker management"
            echo "Features: Docker container management, plugin system, web interface"
            ;;
        "lxc-container")
            echo "Platform: LXC Container"
            echo "Recommendation: Optimal for Profolio deployment"
            echo "Features: Lightweight virtualization, resource isolation"
            ;;
        "docker-container")
            echo "Platform: Docker Container"
            echo "Recommendation: Use containerized deployment"
            echo "Features: Process isolation, volume mounting"
            ;;
        "wsl")
            echo "Platform: Windows Subsystem for Linux"
            echo "Recommendation: Development/testing use only"
            echo "Features: Windows integration, file system access"
            ;;
        "generic-linux")
            echo "Platform: Generic Linux System"
            echo "Recommendation: Standard installation process"
            echo "Features: Full system access, native performance"
            ;;
        *)
            echo "Platform: Unknown"
            echo "Recommendation: Use generic Linux installation"
            echo "Features: Standard Linux environment assumed"
            ;;
    esac
}

# Check platform compatibility for Profolio
check_platform_compatibility() {
    local platform_type
    platform_type=$(get_platform_type)
    
    case "$platform_type" in
        "proxmox-host")
            echo "COMPATIBLE: Proxmox host detected - can create LXC container"
            return 0
            ;;
        "unraid")
            echo "COMPATIBLE: Unraid detected - use Docker container installation"
            return 0
            ;;
        "lxc-container")
            echo "OPTIMAL: LXC container is ideal for Profolio deployment"
            return 0
            ;;
        "docker-container")
            echo "COMPATIBLE: Docker container environment detected"
            return 0
            ;;
        "wsl")
            echo "LIMITED: WSL detected - suitable for development only"
            return 0
            ;;
        "generic-linux")
            echo "COMPATIBLE: Generic Linux system detected"
            return 0
            ;;
        *)
            echo "UNKNOWN: Platform compatibility cannot be determined"
            return 1
            ;;
    esac
}

# Get recommended installation approach for platform
get_installation_approach() {
    local platform_type
    platform_type=$(get_platform_type)
    
    case "$platform_type" in
        "proxmox-host")
            echo "container-creation"
            ;;
        "unraid")
            echo "docker-unraid"
            ;;
        "lxc-container")
            echo "direct-install"
            ;;
        "docker-container")
            echo "containerized-install"
            ;;
        "wsl")
            echo "development-install"
            ;;
        "generic-linux")
            echo "standard-install"
            ;;
        *)
            echo "fallback-install"
            ;;
    esac
}

# Get platform-specific warnings or recommendations
get_platform_warnings() {
    local platform_type
    platform_type=$(get_platform_type)
    
    case "$platform_type" in
        "proxmox-host")
            echo "WARNING: Installing directly on Proxmox host is not recommended"
            echo "RECOMMENDATION: Create dedicated LXC container for better isolation"
            ;;
        "unraid")
            echo "INFO: Unraid detected - Docker installation recommended"
            echo "RECOMMENDATION: Use Unraid's Docker interface for easy management"
            echo "RECOMMENDATION: Set up persistent storage for Profolio data"
            ;;
        "docker-container")
            echo "INFO: Limited system access in Docker container"
            echo "RECOMMENDATION: Ensure proper volume mounts for data persistence"
            ;;
        "wsl")
            echo "WARNING: WSL has limited systemd support"
            echo "WARNING: Not suitable for production deployments"
            ;;
        *)
            # No specific warnings for LXC container or generic Linux
            ;;
    esac
}

# Check if systemd is available and working
check_systemd_support() {
    if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
        return 0  # systemd is available and working
    else
        return 1  # systemd not available or not working
    fi
}

# Get service management approach for platform
get_service_management() {
    if check_systemd_support; then
        echo "systemd"
    else
        echo "manual"
    fi
}

# Backward compatibility aliases
detect_platform() {
    get_platform_type
}

# Module metadata
PLATFORM_DETECTION_VERSION="1.0.0"
PLATFORM_DETECTION_DEPENDENCIES="utils/logging.sh" 