#!/bin/bash

# 🔍 Validation Utilities Module
# ==============================
# Provides input validation and checking functions
# Used by all installer components for data integrity

# ==============================================================================
# DEPENDENCIES
# ==============================================================================

# Ensure logging module is available
if [[ "${LOGGING_MODULE_LOADED:-false}" != "true" ]]; then
    echo "⚠️  Warning: Validation module requires logging module" >&2
fi

# ==============================================================================
# VERSION VALIDATION
# ==============================================================================

# Validate version format (supports v1.0.0, 1.0.0, main, latest)
validation_validate_version() {
    local version="$1"
    
    # Allow special keywords
    case "$version" in
        "main"|"latest"|"")
            return 0
            ;;
        *)
            # Check if it's a valid version tag format
            if [[ "$version" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                return 0
            else
                return 1
            fi
            ;;
    esac
}

# Check if version exists on GitHub
validation_version_exists() {
    local version="$1"
    
    # Critical: Input validation for production reliability
    if [[ -z "$version" ]]; then
        return 1  # Fail silently for empty input
    fi
    
    # Special cases
    case "$version" in
        "main"|"latest"|"")
            return 0
            ;;
    esac
    
    # Normalize version (add 'v' prefix if not present)
    if [[ ! "$version" =~ ^v ]]; then
        version="v$version"
    fi
    
    # Check if tag exists on GitHub (suppress errors for clean output)
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 \
        "https://api.github.com/repos/Obednal97/profolio/releases/tags/$version" 2>/dev/null)
    
    if [ "$status_code" = "200" ]; then
        return 0
    else
        # Fallback: check if it exists as a git tag (suppress errors)
        if git ls-remote --tags origin 2>/dev/null | grep -q "refs/tags/$version$"; then
            return 0
        else
            return 1
        fi
    fi
}

# Normalize version string (add v prefix if needed)
validation_normalize_version() {
    local version="$1"
    
    if [[ -z "$version" ]] || [[ "$version" == "main" ]] || [[ "$version" == "latest" ]]; then
        echo "$version"
    elif [[ ! "$version" =~ ^v ]]; then
        echo "v$version"
    else
        echo "$version"
    fi
}

# ==============================================================================
# NETWORK VALIDATION
# ==============================================================================

# Validate IP address format
validation_validate_ip() {
    local ip="$1"
    
    # Check IPv4 format
    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        # Check each octet is within valid range (0-255)
        IFS='.' read -ra octets <<< "$ip"
        for octet in "${octets[@]}"; do
            if [[ $octet -lt 0 ]] || [[ $octet -gt 255 ]]; then
                return 1
            fi
        done
        return 0
    fi
    
    # TODO: Add IPv6 validation if needed
    return 1
}

# Validate IP with CIDR notation
validation_validate_ip_cidr() {
    local ip_cidr="$1"
    
    if [[ $ip_cidr =~ ^([0-9\.]+)/([0-9]+)$ ]]; then
        local ip="${BASH_REMATCH[1]}"
        local cidr="${BASH_REMATCH[2]}"
        
        # Validate IP part
        if ! validation_validate_ip "$ip"; then
            return 1
        fi
        
        # Validate CIDR part (0-32 for IPv4)
        if [[ $cidr -ge 0 ]] && [[ $cidr -le 32 ]]; then
            return 0
        fi
    fi
    
    return 1
}

# Validate port number
validation_validate_port() {
    local port="$1"
    
    if [[ "$port" =~ ^[0-9]+$ ]] && [[ $port -ge 1 ]] && [[ $port -le 65535 ]]; then
        return 0
    else
        return 1
    fi
}

# Validate hostname/domain
validation_validate_hostname() {
    local hostname="$1"
    
    # Basic hostname validation (RFC 1123)
    if [[ $hostname =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

# ==============================================================================
# NUMERIC VALIDATION
# ==============================================================================

# Validate number within range
validation_validate_number() {
    local num="$1"
    local min="$2"
    local max="$3"
    
    if [[ "$num" =~ ^[0-9]+$ ]] && [[ $num -ge $min ]] && [[ $num -le $max ]]; then
        return 0
    else
        return 1
    fi
}

# Validate positive integer
validation_validate_positive_int() {
    local num="$1"
    
    if [[ "$num" =~ ^[1-9][0-9]*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate memory size (in MB)
validation_validate_memory() {
    local memory="$1"
    local min="${2:-512}"    # Default minimum 512MB
    local max="${3:-32768}"  # Default maximum 32GB
    
    validation_validate_number "$memory" "$min" "$max"
}

# Validate disk size (in GB)
validation_validate_disk_size() {
    local disk="$1"
    local min="${2:-10}"     # Default minimum 10GB
    local max="${3:-1000}"   # Default maximum 1TB
    
    validation_validate_number "$disk" "$min" "$max"
}

# Validate CPU cores
validation_validate_cpu_cores() {
    local cores="$1"
    local min="${2:-1}"      # Default minimum 1 core
    local max="${3:-64}"     # Default maximum 64 cores
    
    validation_validate_number "$cores" "$min" "$max"
}

# ==============================================================================
# STRING VALIDATION
# ==============================================================================

# Validate container/hostname name
validation_validate_name() {
    local name="$1"
    local min_length="${2:-3}"
    local max_length="${3:-63}"
    
    # Check length
    if [[ ${#name} -lt $min_length ]] || [[ ${#name} -gt $max_length ]]; then
        return 1
    fi
    
    # Check format: alphanumeric, hyphens allowed but not at start/end
    if [[ $name =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,$((max_length-2))}[a-zA-Z0-9])?$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate email address
validation_validate_email() {
    local email="$1"
    
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate URL
validation_validate_url() {
    local url="$1"
    
    if [[ $url =~ ^https?://[a-zA-Z0-9.-]+[a-zA-Z0-9](:[0-9]+)?(/.*)?$ ]]; then
        return 0
    else
        return 1
    fi
}

# Validate file path
validation_validate_path() {
    local path="$1"
    local must_exist="${2:-false}"
    
    # Basic path validation (no null bytes, reasonable length)
    if [[ ${#path} -gt 4096 ]] || [[ $path == *$'\0'* ]]; then
        return 1
    fi
    
    # Check if path must exist
    if [[ "$must_exist" == "true" ]] && [[ ! -e "$path" ]]; then
        return 1
    fi
    
    return 0
}

# ==============================================================================
# SYSTEM VALIDATION
# ==============================================================================

# Check if command exists
validation_command_exists() {
    local command="$1"
    command -v "$command" >/dev/null 2>&1
}

# Check if service exists
validation_service_exists() {
    local service="$1"
    systemctl list-unit-files --type=service | grep -q "^$service.service"
}

# Check if port is available
validation_port_available() {
    local port="$1"
    ! netstat -tuln 2>/dev/null | grep -q ":$port "
}

# Check if user exists
validation_user_exists() {
    local username="$1"
    id "$username" >/dev/null 2>&1
}

# Check if group exists
validation_group_exists() {
    local groupname="$1"
    getent group "$groupname" >/dev/null 2>&1
}

# Validate directory is writable
validation_directory_writable() {
    local directory="$1"
    
    if [[ -d "$directory" ]] && [[ -w "$directory" ]]; then
        return 0
    else
        return 1
    fi
}

# Check disk space (in MB)
validation_check_disk_space() {
    local path="$1"
    local required_mb="$2"
    
    local available_kb=$(df "$path" | awk 'NR==2 {print $4}')
    local available_mb=$((available_kb / 1024))
    
    if [[ $available_mb -ge $required_mb ]]; then
        return 0
    else
        return 1
    fi
}

# ==============================================================================
# SECURITY VALIDATION
# ==============================================================================

# Validate password strength
validation_validate_password() {
    local password="$1"
    local min_length="${2:-8}"
    
    # Check minimum length
    if [[ ${#password} -lt $min_length ]]; then
        return 1
    fi
    
    # Check complexity (at least one letter and one number)
    if [[ $password =~ [a-zA-Z] ]] && [[ $password =~ [0-9] ]]; then
        return 0
    else
        return 1
    fi
}

# Check for dangerous characters in input
validation_safe_input() {
    local input="$1"
    
    # Check for shell injection attempts
    if [[ $input =~ [\;\|\&\$\`\(\)] ]]; then
        return 1
    fi
    
    # Check for null bytes
    if [[ $input == *$'\0'* ]]; then
        return 1
    fi
    
    return 0
}

# ==============================================================================
# PROXMOX-SPECIFIC VALIDATION
# ==============================================================================

# Validate VMID (Proxmox container/VM ID)
validation_validate_vmid() {
    local vmid="$1"
    
    validation_validate_number "$vmid" 100 999999
}

# Validate Proxmox storage name
validation_validate_storage() {
    local storage="$1"
    
    # Basic storage name validation
    if [[ $storage =~ ^[a-zA-Z0-9_-]+$ ]] && [[ ${#storage} -le 64 ]]; then
        return 0
    else
        return 1
    fi
}

# ==============================================================================
# COMPOSITE VALIDATION FUNCTIONS
# ==============================================================================

# Validate network configuration
validation_validate_network_config() {
    local mode="$1"
    local ip="$2"
    local gateway="$3"
    
    case "$mode" in
        "dhcp")
            return 0
            ;;
        "static")
            if validation_validate_ip_cidr "$ip" && validation_validate_ip "$gateway"; then
                return 0
            else
                return 1
            fi
            ;;
        *)
            return 1
            ;;
    esac
}

# Validate complete container configuration
validation_validate_container_config() {
    local vmid="$1"
    local name="$2"
    local memory="$3"
    local cores="$4"
    local disk="$5"
    
    validation_validate_vmid "$vmid" && \
    validation_validate_name "$name" && \
    validation_validate_memory "$memory" && \
    validation_validate_cpu_cores "$cores" && \
    validation_validate_disk_size "$disk"
}

# ==============================================================================
# ALIASES FOR BACKWARD COMPATIBILITY
# ==============================================================================

# Maintain compatibility with existing installer code
validate_version() { validation_validate_version "$@"; }
version_exists() { validation_version_exists "$@"; }
validate_ip() { validation_validate_ip "$@"; }
validate_number() { validation_validate_number "$@"; }

# ==============================================================================
# MODULE INFORMATION
# ==============================================================================

# Module version and info
VALIDATION_MODULE_VERSION="1.0.0"
VALIDATION_MODULE_LOADED=true

# Display module info
validation_module_info() {
    echo "Validation Module v$VALIDATION_MODULE_VERSION"
    echo "Provides: Input validation, format checking, system validation"
    echo "Status: Loaded and ready"
} 