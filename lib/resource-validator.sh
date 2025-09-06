#!/bin/bash

# Profolio Resource Validator
# Validates system resources before installation
# Version: 1.0.0

# Minimum requirements
MIN_CPU=2
MIN_RAM=4096  # MB
MIN_DISK=20   # GB
MIN_KERNEL="5.4"
MIN_DOCKER_VERSION="20.10"
MIN_NODE_VERSION="18"

# Recommended requirements
REC_CPU=4
REC_RAM=8192  # MB
REC_DISK=50   # GB
REC_KERNEL="6.0"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running in container
is_container() {
    if [ -f /.dockerenv ] || [ -f /run/systemd/container ] || grep -qa container=lxc /proc/1/environ 2>/dev/null; then
        return 0
    fi
    return 1
}

# Check if running on Proxmox host
is_proxmox() {
    if [ -f /etc/pve/version ]; then
        return 0
    fi
    return 1
}

# Validate CPU cores
validate_cpu() {
    local required="${1:-$MIN_CPU}"
    local available=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "0")
    
    echo -e "${BLUE}Checking CPU cores...${NC}"
    echo "  Available: $available cores"
    echo "  Required: $required cores"
    echo "  Recommended: $REC_CPU cores"
    
    if [ "$available" -ge "$required" ]; then
        if [ "$available" -ge "$REC_CPU" ]; then
            echo -e "  ${GREEN}✓${NC} CPU cores: Optimal ($available cores)"
            return 0
        else
            echo -e "  ${YELLOW}⚠${NC} CPU cores: Adequate ($available cores, recommend $REC_CPU)"
            return 0
        fi
    else
        echo -e "  ${RED}✗${NC} CPU cores: Insufficient (need at least $required cores)"
        return 1
    fi
}

# Validate memory
validate_memory() {
    local required="${1:-$MIN_RAM}"
    local available=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || \
                     sysctl -n hw.memsize 2>/dev/null | awk '{print int($1/1024/1024)}' || \
                     echo "0")
    
    echo -e "${BLUE}Checking memory...${NC}"
    echo "  Available: ${available}MB"
    echo "  Required: ${required}MB"
    echo "  Recommended: ${REC_RAM}MB"
    
    if [ "$available" -ge "$required" ]; then
        if [ "$available" -ge "$REC_RAM" ]; then
            echo -e "  ${GREEN}✓${NC} Memory: Optimal (${available}MB)"
            return 0
        else
            echo -e "  ${YELLOW}⚠${NC} Memory: Adequate (${available}MB, recommend ${REC_RAM}MB)"
            return 0
        fi
    else
        echo -e "  ${RED}✗${NC} Memory: Insufficient (need at least ${required}MB)"
        return 1
    fi
}

# Validate disk space
validate_disk() {
    local path="${1:-/opt}"
    local required="${2:-$MIN_DISK}"
    local available=$(df -BG "$path" 2>/dev/null | awk 'NR==2{print $4}' | sed 's/G//' || echo "0")
    
    echo -e "${BLUE}Checking disk space...${NC}"
    echo "  Path: $path"
    echo "  Available: ${available}GB"
    echo "  Required: ${required}GB"
    echo "  Recommended: ${REC_DISK}GB"
    
    if [ "$available" -ge "$required" ]; then
        if [ "$available" -ge "$REC_DISK" ]; then
            echo -e "  ${GREEN}✓${NC} Disk space: Optimal (${available}GB)"
            return 0
        else
            echo -e "  ${YELLOW}⚠${NC} Disk space: Adequate (${available}GB, recommend ${REC_DISK}GB)"
            return 0
        fi
    else
        echo -e "  ${RED}✗${NC} Disk space: Insufficient (need at least ${required}GB)"
        return 1
    fi
}

# Validate kernel version
validate_kernel() {
    local current=$(uname -r | cut -d. -f1,2)
    local required="${1:-$MIN_KERNEL}"
    
    echo -e "${BLUE}Checking kernel version...${NC}"
    echo "  Current: $current"
    echo "  Required: $required or higher"
    echo "  Recommended: $REC_KERNEL or higher"
    
    # Compare versions
    if [ "$(printf '%s\n' "$required" "$current" | sort -V | head -n1)" = "$required" ]; then
        if [ "$(printf '%s\n' "$REC_KERNEL" "$current" | sort -V | head -n1)" = "$REC_KERNEL" ]; then
            echo -e "  ${GREEN}✓${NC} Kernel version: Optimal ($current)"
            return 0
        else
            echo -e "  ${YELLOW}⚠${NC} Kernel version: Adequate ($current, recommend $REC_KERNEL)"
            return 0
        fi
    else
        echo -e "  ${RED}✗${NC} Kernel version: Too old (need at least $required)"
        return 1
    fi
}

# Check network connectivity
validate_network() {
    echo -e "${BLUE}Checking network connectivity...${NC}"
    
    # Check DNS resolution
    if host github.com >/dev/null 2>&1 || nslookup github.com >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} DNS resolution: Working"
    else
        echo -e "  ${RED}✗${NC} DNS resolution: Failed"
        return 1
    fi
    
    # Check internet connectivity
    if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Internet connectivity: Working"
    else
        echo -e "  ${YELLOW}⚠${NC} Internet connectivity: Limited or blocked"
    fi
    
    # Check GitHub access
    if curl -s -o /dev/null -w "%{http_code}" https://api.github.com | grep -q "200"; then
        echo -e "  ${GREEN}✓${NC} GitHub access: Available"
    else
        echo -e "  ${RED}✗${NC} GitHub access: Blocked or unavailable"
        return 1
    fi
    
    return 0
}

# Check required packages
validate_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    local missing=()
    local optional=()
    
    # Required packages
    local required_cmds="curl git"
    for cmd in $required_cmds; do
        if ! command -v $cmd >/dev/null 2>&1; then
            missing+=("$cmd")
            echo -e "  ${RED}✗${NC} $cmd: Not found (required)"
        else
            echo -e "  ${GREEN}✓${NC} $cmd: $(command -v $cmd)"
        fi
    done
    
    # Optional but recommended packages
    local optional_cmds="jq whiptail dialog docker podman"
    for cmd in $optional_cmds; do
        if ! command -v $cmd >/dev/null 2>&1; then
            optional+=("$cmd")
            echo -e "  ${YELLOW}⚠${NC} $cmd: Not found (optional)"
        else
            echo -e "  ${GREEN}✓${NC} $cmd: $(command -v $cmd)"
        fi
    done
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node -v | sed 's/v//')
        if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$node_version" | sort -V | head -n1)" = "$MIN_NODE_VERSION" ]; then
            echo -e "  ${GREEN}✓${NC} Node.js: v$node_version"
        else
            echo -e "  ${YELLOW}⚠${NC} Node.js: v$node_version (recommend v$MIN_NODE_VERSION+)"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} Node.js: Not installed"
    fi
    
    # Check pnpm
    if command -v pnpm >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} pnpm: $(pnpm -v)"
    else
        echo -e "  ${YELLOW}⚠${NC} pnpm: Not installed (will be installed)"
    fi
    
    # Check PostgreSQL
    if command -v psql >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL: $(psql --version | awk '{print $3}')"
    else
        echo -e "  ${YELLOW}⚠${NC} PostgreSQL: Not installed (will be installed)"
    fi
    
    # Check nginx
    if command -v nginx >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} nginx: $(nginx -v 2>&1 | cut -d/ -f2)"
    else
        echo -e "  ${YELLOW}⚠${NC} nginx: Not installed (will be installed)"
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "\n${RED}Missing required packages:${NC} ${missing[*]}"
        echo "Please install them before continuing."
        return 1
    fi
    
    if [ ${#optional[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}Optional packages not found:${NC} ${optional[*]}"
        echo "Installation will continue, but some features may be limited."
    fi
    
    return 0
}

# Check port availability
validate_ports() {
    echo -e "${BLUE}Checking port availability...${NC}"
    
    local ports="80 443 3000 3001 5432"
    local blocked=()
    
    for port in $ports; do
        if lsof -i :$port >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$port "; then
            blocked+=("$port")
            echo -e "  ${YELLOW}⚠${NC} Port $port: In use"
        else
            echo -e "  ${GREEN}✓${NC} Port $port: Available"
        fi
    done
    
    if [ ${#blocked[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}Warning: Ports in use:${NC} ${blocked[*]}"
        echo "Services using these ports will need to be stopped or reconfigured."
        
        # Show what's using the ports
        for port in ${blocked[@]}; do
            local service=$(lsof -i :$port 2>/dev/null | awk 'NR==2{print $1}' || \
                          netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d/ -f2)
            [ -n "$service" ] && echo "    Port $port: $service"
        done
        
        return 1
    fi
    
    return 0
}

# Check systemd availability
validate_systemd() {
    echo -e "${BLUE}Checking systemd...${NC}"
    
    if [ -d /run/systemd/system ]; then
        echo -e "  ${GREEN}✓${NC} systemd: Available"
        
        # Check if we can manage services
        if systemctl list-units >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} systemctl: Working"
            return 0
        else
            echo -e "  ${YELLOW}⚠${NC} systemctl: Limited access (may need sudo)"
            return 0
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} systemd: Not available (will use alternative init)"
        return 0
    fi
}

# Comprehensive validation
validate_all() {
    local cpu_req="${1:-$MIN_CPU}"
    local ram_req="${2:-$MIN_RAM}"
    local disk_req="${3:-$MIN_DISK}"
    
    echo -e "${BLUE}==== Profolio System Requirements Check ====${NC}\n"
    
    local errors=0
    
    # Environment detection
    echo -e "${BLUE}Environment:${NC}"
    if is_container; then
        echo -e "  ${YELLOW}⚠${NC} Running inside container"
        echo "  Some checks may be limited by container restrictions"
    elif is_proxmox; then
        echo -e "  ${GREEN}✓${NC} Proxmox VE host detected"
    else
        echo -e "  ${GREEN}✓${NC} Standard Linux system"
    fi
    echo
    
    # Run all checks
    validate_cpu "$cpu_req" || ((errors++))
    echo
    validate_memory "$ram_req" || ((errors++))
    echo
    validate_disk "/opt" "$disk_req" || ((errors++))
    echo
    validate_kernel || ((errors++))
    echo
    validate_network || ((errors++))
    echo
    validate_dependencies || ((errors++))
    echo
    validate_ports || ((errors++))
    echo
    validate_systemd
    echo
    
    # Summary
    echo -e "${BLUE}==== Validation Summary ====${NC}"
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✓ All requirements met!${NC}"
        echo "System is ready for Profolio installation."
        return 0
    else
        echo -e "${RED}✗ $errors requirement(s) not met${NC}"
        echo "Please address the issues above before proceeding."
        
        # Offer to continue anyway
        if [ -t 0 ]; then
            read -p "Continue anyway? (not recommended) [y/N]: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}⚠ Continuing despite validation failures${NC}"
                return 0
            fi
        fi
        
        return 1
    fi
}

# Generate resource report
generate_report() {
    local output_file="${1:-/tmp/profolio-resource-report.txt}"
    
    {
        echo "Profolio Resource Validation Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo
        echo "System Information:"
        echo "  Hostname: $(hostname)"
        echo "  OS: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || uname -s)"
        echo "  Kernel: $(uname -r)"
        echo "  Architecture: $(uname -m)"
        echo
        echo "Resources:"
        echo "  CPU Cores: $(nproc 2>/dev/null || echo 'unknown')"
        echo "  Total Memory: $(free -h 2>/dev/null | awk '/^Mem:/{print $2}' || echo 'unknown')"
        echo "  Available Memory: $(free -h 2>/dev/null | awk '/^Mem:/{print $7}' || echo 'unknown')"
        echo "  Disk Space (/opt): $(df -h /opt 2>/dev/null | awk 'NR==2{print $4}' || echo 'unknown')"
        echo
        echo "Network:"
        echo "  Primary IP: $(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1 || echo 'unknown')"
        echo "  Default Gateway: $(ip route 2>/dev/null | grep default | awk '{print $3}' || echo 'unknown')"
        echo "  DNS Servers: $(grep nameserver /etc/resolv.conf 2>/dev/null | awk '{print $2}' | tr '\n' ' ' || echo 'unknown')"
        echo
        echo "Software:"
        echo "  Docker: $(docker --version 2>/dev/null | awk '{print $3}' | tr -d ',' || echo 'not installed')"
        echo "  Node.js: $(node -v 2>/dev/null || echo 'not installed')"
        echo "  PostgreSQL: $(psql --version 2>/dev/null | awk '{print $3}' || echo 'not installed')"
        echo "  nginx: $(nginx -v 2>&1 | cut -d/ -f2 || echo 'not installed')"
        echo
        echo "Validation Results:"
        validate_all 2>&1 | sed 's/\x1b\[[0-9;]*m//g'  # Remove color codes
    } > "$output_file"
    
    echo -e "${GREEN}✓${NC} Report generated: $output_file"
}

# Interactive validation menu
validation_menu() {
    while true; do
        echo -e "\n${BLUE}=== Profolio Resource Validator ===${NC}"
        echo "1) Run full validation"
        echo "2) Check CPU"
        echo "3) Check memory"
        echo "4) Check disk space"
        echo "5) Check network"
        echo "6) Check dependencies"
        echo "7) Check ports"
        echo "8) Generate report"
        echo "9) Exit"
        
        read -p "Select option [1-9]: " choice
        
        case $choice in
            1) validate_all ;;
            2) validate_cpu ;;
            3) validate_memory ;;
            4) validate_disk ;;
            5) validate_network ;;
            6) validate_dependencies ;;
            7) validate_ports ;;
            8) 
                read -p "Enter report file path [/tmp/profolio-resource-report.txt]: " output
                generate_report "${output:-/tmp/profolio-resource-report.txt}"
                ;;
            9) 
                echo "Exiting validator"
                break
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
    done
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    # Script is being executed directly
    case "${1:-all}" in
        all)
            validate_all "$2" "$3" "$4"
            ;;
        cpu)
            validate_cpu "$2"
            ;;
        memory|ram)
            validate_memory "$2"
            ;;
        disk)
            validate_disk "$2" "$3"
            ;;
        kernel)
            validate_kernel "$2"
            ;;
        network)
            validate_network
            ;;
        deps|dependencies)
            validate_dependencies
            ;;
        ports)
            validate_ports
            ;;
        systemd)
            validate_systemd
            ;;
        report)
            generate_report "$2"
            ;;
        menu)
            validation_menu
            ;;
        *)
            echo "Usage: $0 {all|cpu|memory|disk|kernel|network|deps|ports|systemd|report|menu} [args]"
            exit 1
            ;;
    esac
fi