#!/bin/bash

# Profolio Network Detector
# Auto-detects network configuration and suggests optimal settings
# Version: 1.0.0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Network configuration storage
declare -A NETWORK_CONFIG

# Detect if running in Proxmox container
is_proxmox_container() {
    [ -f /etc/pve/version ] || grep -qa container=lxc /proc/1/environ 2>/dev/null
}

# Detect available network bridges (for Proxmox)
detect_bridges() {
    echo -e "${BLUE}Detecting network bridges...${NC}"
    
    local bridges=()
    
    # Check for Proxmox bridges (vmbr*)
    if is_proxmox_container; then
        bridges=($(ip link show type bridge 2>/dev/null | grep -oE 'vmbr[0-9]+' | sort -u))
    fi
    
    # Check for standard bridges
    if [ ${#bridges[@]} -eq 0 ]; then
        bridges=($(ip link show type bridge 2>/dev/null | grep -oE '^[0-9]+: ([^:]+)' | cut -d' ' -f2 | tr -d ':'))
    fi
    
    if [ ${#bridges[@]} -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Found bridges: ${bridges[*]}"
        NETWORK_CONFIG["bridges"]="${bridges[*]}"
        NETWORK_CONFIG["primary_bridge"]="${bridges[0]}"
        return 0
    else
        echo -e "  ${YELLOW}⚠${NC} No bridges found"
        return 1
    fi
}

# Detect physical network interfaces
detect_interfaces() {
    echo -e "${BLUE}Detecting network interfaces...${NC}"
    
    local interfaces=()
    
    # Get all physical interfaces (excluding lo, docker, veth, etc.)
    interfaces=($(ip link show 2>/dev/null | \
                 grep -E '^[0-9]+: (en|eth|wl|wlan)[^:]+' | \
                 cut -d' ' -f2 | tr -d ':' | sort -u))
    
    if [ ${#interfaces[@]} -eq 0 ]; then
        # Fallback: get any interface with an IP
        interfaces=($(ip -4 addr show 2>/dev/null | \
                     grep -oP 'inet.*dev \K[^ ]+' | \
                     grep -v 'lo\|docker\|veth' | sort -u))
    fi
    
    if [ ${#interfaces[@]} -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Found interfaces: ${interfaces[*]}"
        
        # Find primary interface (one with default route)
        local primary=$(ip route 2>/dev/null | grep default | grep -oP 'dev \K[^ ]+' | head -1)
        if [ -n "$primary" ]; then
            echo -e "  ${GREEN}✓${NC} Primary interface: $primary"
            NETWORK_CONFIG["primary_interface"]="$primary"
        else
            NETWORK_CONFIG["primary_interface"]="${interfaces[0]}"
        fi
        
        NETWORK_CONFIG["interfaces"]="${interfaces[*]}"
        return 0
    else
        echo -e "  ${RED}✗${NC} No network interfaces found"
        return 1
    fi
}

# Detect current IPv4 configuration
detect_ipv4() {
    echo -e "${BLUE}Detecting IPv4 configuration...${NC}"
    
    local interface="${1:-${NETWORK_CONFIG[primary_interface]}}"
    
    if [ -z "$interface" ]; then
        detect_interfaces
        interface="${NETWORK_CONFIG[primary_interface]}"
    fi
    
    # Get IP address
    local ip_addr=$(ip -4 addr show dev "$interface" 2>/dev/null | \
                   grep -oP 'inet \K[^/]+/[0-9]+' | head -1)
    
    if [ -n "$ip_addr" ]; then
        echo -e "  ${GREEN}✓${NC} IPv4 address: $ip_addr"
        NETWORK_CONFIG["ipv4_address"]="$ip_addr"
        
        # Determine if DHCP or static
        if grep -q "dhcp" /etc/network/interfaces 2>/dev/null || \
           systemctl is-active --quiet NetworkManager 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} IPv4 method: DHCP"
            NETWORK_CONFIG["ipv4_method"]="dhcp"
        else
            echo -e "  ${GREEN}✓${NC} IPv4 method: Static"
            NETWORK_CONFIG["ipv4_method"]="static"
        fi
        
        return 0
    else
        echo -e "  ${YELLOW}⚠${NC} No IPv4 address found on $interface"
        NETWORK_CONFIG["ipv4_method"]="none"
        return 1
    fi
}

# Detect gateway
detect_gateway() {
    echo -e "${BLUE}Detecting gateway...${NC}"
    
    local gateway=$(ip route 2>/dev/null | grep default | awk '{print $3}' | head -1)
    
    if [ -n "$gateway" ]; then
        echo -e "  ${GREEN}✓${NC} Default gateway: $gateway"
        NETWORK_CONFIG["gateway"]="$gateway"
        
        # Test gateway connectivity
        if ping -c 1 -W 2 "$gateway" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Gateway reachable"
            NETWORK_CONFIG["gateway_reachable"]="yes"
        else
            echo -e "  ${YELLOW}⚠${NC} Gateway not responding to ping"
            NETWORK_CONFIG["gateway_reachable"]="no"
        fi
        
        return 0
    else
        echo -e "  ${RED}✗${NC} No default gateway found"
        return 1
    fi
}

# Detect DNS servers
detect_dns() {
    echo -e "${BLUE}Detecting DNS servers...${NC}"
    
    local dns_servers=()
    
    # Check resolv.conf
    if [ -f /etc/resolv.conf ]; then
        dns_servers=($(grep -E '^nameserver' /etc/resolv.conf 2>/dev/null | awk '{print $2}'))
    fi
    
    # Check systemd-resolved
    if [ ${#dns_servers[@]} -eq 0 ] && systemctl is-active --quiet systemd-resolved; then
        dns_servers=($(resolvectl status 2>/dev/null | grep "DNS Servers" | cut -d: -f2))
    fi
    
    if [ ${#dns_servers[@]} -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} DNS servers: ${dns_servers[*]}"
        NETWORK_CONFIG["dns_servers"]="${dns_servers[*]}"
        
        # Get search domain
        local search_domain=$(grep -E '^search|^domain' /etc/resolv.conf 2>/dev/null | awk '{print $2}' | head -1)
        if [ -n "$search_domain" ]; then
            echo -e "  ${GREEN}✓${NC} Search domain: $search_domain"
            NETWORK_CONFIG["search_domain"]="$search_domain"
        fi
        
        # Test DNS resolution
        if host google.com "${dns_servers[0]}" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} DNS resolution working"
            NETWORK_CONFIG["dns_working"]="yes"
        else
            echo -e "  ${YELLOW}⚠${NC} DNS resolution not working"
            NETWORK_CONFIG["dns_working"]="no"
        fi
        
        return 0
    else
        echo -e "  ${RED}✗${NC} No DNS servers found"
        return 1
    fi
}

# Detect IPv6 configuration
detect_ipv6() {
    echo -e "${BLUE}Detecting IPv6 configuration...${NC}"
    
    local interface="${1:-${NETWORK_CONFIG[primary_interface]}}"
    
    # Check if IPv6 is enabled
    if [ "$(cat /proc/sys/net/ipv6/conf/all/disable_ipv6 2>/dev/null)" = "1" ]; then
        echo -e "  ${YELLOW}⚠${NC} IPv6 is disabled system-wide"
        NETWORK_CONFIG["ipv6_enabled"]="no"
        return 1
    fi
    
    # Get IPv6 addresses
    local ipv6_addrs=($(ip -6 addr show dev "$interface" 2>/dev/null | \
                       grep -oP 'inet6 \K[^/]+' | grep -v '^fe80'))
    
    if [ ${#ipv6_addrs[@]} -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} IPv6 addresses: ${ipv6_addrs[*]}"
        NETWORK_CONFIG["ipv6_addresses"]="${ipv6_addrs[*]}"
        NETWORK_CONFIG["ipv6_enabled"]="yes"
        
        # Detect method (SLAAC, DHCPv6, Static)
        if grep -q "inet6.*dynamic" /proc/net/if_inet6 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} IPv6 method: DHCPv6"
            NETWORK_CONFIG["ipv6_method"]="dhcpv6"
        elif [ ${#ipv6_addrs[@]} -gt 0 ]; then
            # Check for SLAAC addresses (usually have specific patterns)
            local slaac_pattern=".*:.*:.*:.*:.*"
            if [[ "${ipv6_addrs[0]}" =~ $slaac_pattern ]]; then
                echo -e "  ${GREEN}✓${NC} IPv6 method: SLAAC"
                NETWORK_CONFIG["ipv6_method"]="slaac"
            else
                echo -e "  ${GREEN}✓${NC} IPv6 method: Static"
                NETWORK_CONFIG["ipv6_method"]="static"
            fi
        fi
        
        # Get IPv6 gateway
        local ipv6_gateway=$(ip -6 route 2>/dev/null | grep default | awk '{print $3}' | head -1)
        if [ -n "$ipv6_gateway" ]; then
            echo -e "  ${GREEN}✓${NC} IPv6 gateway: $ipv6_gateway"
            NETWORK_CONFIG["ipv6_gateway"]="$ipv6_gateway"
        fi
        
        return 0
    else
        echo -e "  ${YELLOW}⚠${NC} No IPv6 addresses found"
        NETWORK_CONFIG["ipv6_enabled"]="no"
        return 1
    fi
}

# Detect MTU
detect_mtu() {
    echo -e "${BLUE}Detecting MTU...${NC}"
    
    local interface="${1:-${NETWORK_CONFIG[primary_interface]}}"
    
    if [ -z "$interface" ]; then
        echo -e "  ${YELLOW}⚠${NC} No interface specified"
        return 1
    fi
    
    local mtu=$(ip link show "$interface" 2>/dev/null | grep -oP 'mtu \K[0-9]+')
    
    if [ -n "$mtu" ]; then
        echo -e "  ${GREEN}✓${NC} MTU for $interface: $mtu"
        NETWORK_CONFIG["mtu"]="$mtu"
        
        # Check if jumbo frames
        if [ "$mtu" -gt 1500 ]; then
            echo -e "  ${YELLOW}⚠${NC} Jumbo frames enabled (MTU > 1500)"
            NETWORK_CONFIG["jumbo_frames"]="yes"
        else
            NETWORK_CONFIG["jumbo_frames"]="no"
        fi
        
        return 0
    else
        echo -e "  ${RED}✗${NC} Could not detect MTU"
        return 1
    fi
}

# Detect APT proxy
detect_apt_proxy() {
    echo -e "${BLUE}Detecting APT proxy...${NC}"
    
    local apt_proxy=""
    
    # Check apt.conf
    if [ -f /etc/apt/apt.conf ]; then
        apt_proxy=$(grep -oP 'Acquire::http::Proxy\s+"\K[^"]+' /etc/apt/apt.conf 2>/dev/null)
    fi
    
    # Check apt.conf.d
    if [ -z "$apt_proxy" ] && [ -d /etc/apt/apt.conf.d ]; then
        apt_proxy=$(grep -oP 'Acquire::http::Proxy\s+"\K[^"]+' /etc/apt/apt.conf.d/* 2>/dev/null | head -1)
    fi
    
    if [ -n "$apt_proxy" ]; then
        echo -e "  ${GREEN}✓${NC} APT proxy: $apt_proxy"
        NETWORK_CONFIG["apt_proxy"]="$apt_proxy"
        
        # Test proxy
        local proxy_host=$(echo "$apt_proxy" | sed 's|http://||' | cut -d: -f1)
        local proxy_port=$(echo "$apt_proxy" | sed 's|http://||' | cut -d: -f2)
        
        if nc -zv "$proxy_host" "$proxy_port" 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} APT proxy reachable"
            NETWORK_CONFIG["apt_proxy_reachable"]="yes"
        else
            echo -e "  ${YELLOW}⚠${NC} APT proxy not reachable"
            NETWORK_CONFIG["apt_proxy_reachable"]="no"
        fi
        
        return 0
    else
        echo -e "  ${YELLOW}⚠${NC} No APT proxy configured"
        NETWORK_CONFIG["apt_proxy"]=""
        return 1
    fi
}

# Suggest available IP address
suggest_ip() {
    echo -e "${BLUE}Suggesting available IP address...${NC}"
    
    local subnet="${1:-192.168.1.0/24}"
    local interface="${2:-${NETWORK_CONFIG[primary_interface]}}"
    
    # Get network from current configuration
    if [ -n "${NETWORK_CONFIG[ipv4_address]}" ]; then
        subnet=$(echo "${NETWORK_CONFIG[ipv4_address]}" | sed 's/\.[0-9]*\//\.0\//')
    fi
    
    local network=$(echo "$subnet" | cut -d/ -f1 | cut -d. -f1-3)
    local suggested=""
    
    # Scan for available IPs (simple ping scan)
    for i in {100..200}; do
        local test_ip="${network}.${i}"
        if ! ping -c 1 -W 1 "$test_ip" >/dev/null 2>&1; then
            # Also check ARP table
            if ! arp -n 2>/dev/null | grep -q "$test_ip"; then
                suggested="$test_ip"
                break
            fi
        fi
    done
    
    if [ -n "$suggested" ]; then
        echo -e "  ${GREEN}✓${NC} Suggested IP: $suggested/24"
        NETWORK_CONFIG["suggested_ip"]="$suggested/24"
        return 0
    else
        echo -e "  ${YELLOW}⚠${NC} Could not find available IP in range ${network}.100-200"
        return 1
    fi
}

# Test network connectivity
validate_network() {
    echo -e "${BLUE}Validating network connectivity...${NC}"
    
    local errors=0
    
    # Test local gateway
    if [ -n "${NETWORK_CONFIG[gateway]}" ]; then
        if ping -c 1 -W 2 "${NETWORK_CONFIG[gateway]}" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Gateway reachable"
        else
            echo -e "  ${RED}✗${NC} Gateway not reachable"
            ((errors++))
        fi
    fi
    
    # Test internet connectivity
    if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Internet connectivity (IPv4)"
    else
        echo -e "  ${RED}✗${NC} No internet connectivity (IPv4)"
        ((errors++))
    fi
    
    # Test IPv6 if enabled
    if [ "${NETWORK_CONFIG[ipv6_enabled]}" = "yes" ]; then
        if ping6 -c 1 -W 2 2001:4860:4860::8888 >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Internet connectivity (IPv6)"
        else
            echo -e "  ${YELLOW}⚠${NC} No internet connectivity (IPv6)"
        fi
    fi
    
    # Test DNS
    if host google.com >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} DNS resolution working"
    else
        echo -e "  ${RED}✗${NC} DNS resolution failed"
        ((errors++))
    fi
    
    # Test HTTP/HTTPS
    if curl -s -o /dev/null -w "%{http_code}" https://github.com | grep -q "200\|301\|302"; then
        echo -e "  ${GREEN}✓${NC} HTTPS connectivity"
    else
        echo -e "  ${RED}✗${NC} HTTPS connectivity failed"
        ((errors++))
    fi
    
    return $errors
}

# Full network detection
detect_all() {
    echo -e "${BLUE}==== Profolio Network Auto-Detection ====${NC}\n"
    
    # Clear previous config
    NETWORK_CONFIG=()
    
    # Run all detections
    detect_interfaces
    echo
    detect_bridges
    echo
    detect_ipv4
    echo
    detect_gateway
    echo
    detect_dns
    echo
    detect_ipv6
    echo
    detect_mtu
    echo
    detect_apt_proxy
    echo
    validate_network
    echo
    
    # Summary
    echo -e "${BLUE}==== Network Configuration Summary ====${NC}"
    echo -e "Primary Interface: ${NETWORK_CONFIG[primary_interface]:-none}"
    echo -e "IPv4: ${NETWORK_CONFIG[ipv4_address]:-none} (${NETWORK_CONFIG[ipv4_method]:-none})"
    echo -e "Gateway: ${NETWORK_CONFIG[gateway]:-none}"
    echo -e "DNS: ${NETWORK_CONFIG[dns_servers]:-none}"
    echo -e "IPv6: ${NETWORK_CONFIG[ipv6_enabled]:-no}"
    echo -e "MTU: ${NETWORK_CONFIG[mtu]:-1500}"
    
    return 0
}

# Export configuration for use in installer
export_network_config() {
    for key in "${!NETWORK_CONFIG[@]}"; do
        export "PROFOLIO_NET_${key^^}=${NETWORK_CONFIG[$key]}"
    done
    
    echo -e "${GREEN}✓${NC} Network configuration exported to environment"
}

# Generate network configuration file
generate_network_config() {
    local output_file="${1:-/tmp/profolio-network.conf}"
    
    {
        echo "# Profolio Network Configuration"
        echo "# Generated: $(date)"
        echo ""
        
        for key in "${!NETWORK_CONFIG[@]}"; do
            echo "NETWORK_${key^^}=\"${NETWORK_CONFIG[$key]}\""
        done
    } > "$output_file"
    
    echo -e "${GREEN}✓${NC} Network configuration saved to: $output_file"
}

# Interactive network configuration
configure_network() {
    echo -e "${BLUE}=== Interactive Network Configuration ===${NC}\n"
    
    # Detect current configuration
    detect_all
    
    echo -e "\n${BLUE}Current configuration detected. Modify settings?${NC}"
    read -p "Press Enter to keep current, or type 'modify' to change: " choice
    
    if [ "$choice" = "modify" ]; then
        # IPv4 configuration
        echo -e "\n${BLUE}IPv4 Configuration${NC}"
        read -p "Method (dhcp/static) [${NETWORK_CONFIG[ipv4_method]}]: " method
        NETWORK_CONFIG["ipv4_method"]="${method:-${NETWORK_CONFIG[ipv4_method]}}"
        
        if [ "${NETWORK_CONFIG[ipv4_method]}" = "static" ]; then
            read -p "IP Address/CIDR [${NETWORK_CONFIG[ipv4_address]}]: " ip
            NETWORK_CONFIG["ipv4_address"]="${ip:-${NETWORK_CONFIG[ipv4_address]}}"
            
            read -p "Gateway [${NETWORK_CONFIG[gateway]}]: " gw
            NETWORK_CONFIG["gateway"]="${gw:-${NETWORK_CONFIG[gateway]}}"
        fi
        
        # DNS configuration
        echo -e "\n${BLUE}DNS Configuration${NC}"
        read -p "DNS Servers [${NETWORK_CONFIG[dns_servers]}]: " dns
        NETWORK_CONFIG["dns_servers"]="${dns:-${NETWORK_CONFIG[dns_servers]}}"
        
        # IPv6 configuration
        echo -e "\n${BLUE}IPv6 Configuration${NC}"
        read -p "Enable IPv6? (yes/no) [${NETWORK_CONFIG[ipv6_enabled]:-no}]: " ipv6
        NETWORK_CONFIG["ipv6_enabled"]="${ipv6:-${NETWORK_CONFIG[ipv6_enabled]:-no}}"
        
        if [ "${NETWORK_CONFIG[ipv6_enabled]}" = "yes" ]; then
            read -p "IPv6 Method (slaac/dhcpv6/static) [slaac]: " ipv6_method
            NETWORK_CONFIG["ipv6_method"]="${ipv6_method:-slaac}"
        fi
        
        # MTU configuration
        echo -e "\n${BLUE}Advanced Settings${NC}"
        read -p "MTU [${NETWORK_CONFIG[mtu]:-1500}]: " mtu
        NETWORK_CONFIG["mtu"]="${mtu:-${NETWORK_CONFIG[mtu]:-1500}}"
        
        read -p "APT Proxy [${NETWORK_CONFIG[apt_proxy]:-none}]: " proxy
        [ "$proxy" != "none" ] && NETWORK_CONFIG["apt_proxy"]="$proxy"
    fi
    
    # Export configuration
    export_network_config
    generate_network_config
    
    echo -e "\n${GREEN}✓${NC} Network configuration complete"
}

# Main execution
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    # Script is being executed directly
    case "${1:-all}" in
        all)
            detect_all
            ;;
        interfaces)
            detect_interfaces
            ;;
        bridges)
            detect_bridges
            ;;
        ipv4)
            detect_ipv4 "$2"
            ;;
        ipv6)
            detect_ipv6 "$2"
            ;;
        gateway)
            detect_gateway
            ;;
        dns)
            detect_dns
            ;;
        mtu)
            detect_mtu "$2"
            ;;
        proxy)
            detect_apt_proxy
            ;;
        suggest)
            suggest_ip "$2" "$3"
            ;;
        validate)
            validate_network
            ;;
        configure)
            configure_network
            ;;
        export)
            detect_all
            export_network_config
            ;;
        save)
            detect_all
            generate_network_config "$2"
            ;;
        *)
            echo "Usage: $0 {all|interfaces|bridges|ipv4|ipv6|gateway|dns|mtu|proxy|suggest|validate|configure|export|save} [args]"
            exit 1
            ;;
    esac
fi