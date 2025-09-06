#!/bin/bash

# Profolio Config Manager
# Handles configuration import/export for automated deployments
# Version: 1.0.0

# Default config file locations
CONFIG_DIR="${CONFIG_DIR:-/opt/profolio/config}"
CONFIG_FILE="${CONFIG_FILE:-profolio.conf}"
CONFIG_VERSION="1.0"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize config directory
init_config() {
    if [ ! -d "$CONFIG_DIR" ]; then
        mkdir -p "$CONFIG_DIR"
        chmod 700 "$CONFIG_DIR"
    fi
}

# Export current configuration to JSON file
export_config() {
    local output_file="${1:-$CONFIG_DIR/$CONFIG_FILE}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    echo -e "${BLUE}Exporting configuration...${NC}"
    
    # Gather current system configuration
    local cpu_cores=$(nproc 2>/dev/null || echo "2")
    local ram_mb=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "4096")
    local disk_gb=$(df -BG /opt/profolio 2>/dev/null | awk 'NR==2{print $2}' | sed 's/G//' || echo "20")
    
    # Detect network configuration
    local ipv4_addr=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}/\d+' | grep -v '127.0.0.1' | head -1 || echo "dhcp")
    local gateway=$(ip route 2>/dev/null | grep default | awk '{print $3}' | head -1 || echo "")
    local dns_servers=$(grep nameserver /etc/resolv.conf 2>/dev/null | awk '{print $2}' | tr '\n' ' ' || echo "8.8.8.8 8.8.4.4")
    
    # Check for existing Profolio installation
    local version="latest"
    if [ -f "/opt/profolio/package.json" ]; then
        version=$(grep '"version"' /opt/profolio/package.json | head -1 | awk -F'"' '{print $4}')
    fi
    
    # Detect features
    local ssh_enabled="false"
    if systemctl is-active --quiet ssh 2>/dev/null || systemctl is-active --quiet sshd 2>/dev/null; then
        ssh_enabled="true"
    fi
    
    # Create JSON configuration
    cat > "$output_file" <<EOF
{
  "version": "$CONFIG_VERSION",
  "timestamp": "$timestamp",
  "installation": {
    "type": "advanced",
    "version": "$version",
    "path": "/opt/profolio",
    "backup_enabled": true,
    "rollback_enabled": true
  },
  "resources": {
    "cpu": $cpu_cores,
    "ram": $ram_mb,
    "disk": $disk_gb
  },
  "network": {
    "ipv4": {
      "method": $([ "$ipv4_addr" = "dhcp" ] && echo '"dhcp"' || echo '"static"'),
      "address": "$ipv4_addr",
      "gateway": "$gateway"
    },
    "ipv6": {
      "method": "disabled"
    },
    "dns": {
      "servers": [$(echo "$dns_servers" | awk '{for(i=1;i<=NF;i++) printf "\"%s\"%s", $i, (i<NF?", ":"")}')],
      "search": "$(grep search /etc/resolv.conf 2>/dev/null | awk '{print $2}' || echo "")"
    },
    "mtu": $(ip link show 2>/dev/null | grep mtu | head -1 | awk '{print $5}' || echo "1500"),
    "apt_proxy": "$(grep -oP 'Acquire::http::Proxy\s+"\K[^"]+' /etc/apt/apt.conf 2>/dev/null || echo "")"
  },
  "features": {
    "ssh": $ssh_enabled,
    "verbose": false,
    "diagnostic": false,
    "optimize_files": true,
    "aggressive_optimize": false,
    "demo_mode": false
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "name": "profolio"
  },
  "services": {
    "frontend_port": 3000,
    "backend_port": 3001,
    "nginx_enabled": true,
    "ssl_enabled": false
  }
}
EOF
    
    echo -e "${GREEN}✓${NC} Configuration exported to: $output_file"
    
    # Create backup of exported config
    cp "$output_file" "${output_file}.${timestamp}.backup"
    echo -e "${GREEN}✓${NC} Backup created: ${output_file}.${timestamp}.backup"
    
    return 0
}

# Import configuration from JSON file
import_config() {
    local input_file="${1:-$CONFIG_DIR/$CONFIG_FILE}"
    
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}✗${NC} Configuration file not found: $input_file"
        return 1
    fi
    
    echo -e "${BLUE}Importing configuration from: $input_file${NC}"
    
    # Validate JSON format
    if ! python3 -m json.tool "$input_file" >/dev/null 2>&1; then
        if ! jq empty "$input_file" 2>/dev/null; then
            echo -e "${RED}✗${NC} Invalid JSON format in configuration file"
            return 1
        fi
    fi
    
    # Extract values using either jq or python
    if command -v jq >/dev/null 2>&1; then
        # Use jq for parsing
        export PROFOLIO_VERSION=$(jq -r '.installation.version' "$input_file")
        export PROFOLIO_CPU=$(jq -r '.resources.cpu' "$input_file")
        export PROFOLIO_RAM=$(jq -r '.resources.ram' "$input_file")
        export PROFOLIO_DISK=$(jq -r '.resources.disk' "$input_file")
        export PROFOLIO_IPV4_METHOD=$(jq -r '.network.ipv4.method' "$input_file")
        export PROFOLIO_IPV4_ADDR=$(jq -r '.network.ipv4.address' "$input_file")
        export PROFOLIO_IPV4_GATEWAY=$(jq -r '.network.ipv4.gateway' "$input_file")
        export PROFOLIO_DNS_SERVERS=$(jq -r '.network.dns.servers[]' "$input_file" | tr '\n' ' ')
        export PROFOLIO_MTU=$(jq -r '.network.mtu' "$input_file")
        export PROFOLIO_APT_PROXY=$(jq -r '.network.apt_proxy' "$input_file")
        export PROFOLIO_SSH=$(jq -r '.features.ssh' "$input_file")
        export PROFOLIO_VERBOSE=$(jq -r '.features.verbose' "$input_file")
        export PROFOLIO_OPTIMIZE=$(jq -r '.features.optimize_files' "$input_file")
        export PROFOLIO_DEMO_MODE=$(jq -r '.features.demo_mode' "$input_file")
    elif command -v python3 >/dev/null 2>&1; then
        # Use python for parsing
        eval $(python3 <<EOF
import json
with open('$input_file', 'r') as f:
    config = json.load(f)
    print(f"export PROFOLIO_VERSION='{config['installation']['version']}'")
    print(f"export PROFOLIO_CPU='{config['resources']['cpu']}'")
    print(f"export PROFOLIO_RAM='{config['resources']['ram']}'")
    print(f"export PROFOLIO_DISK='{config['resources']['disk']}'")
    print(f"export PROFOLIO_IPV4_METHOD='{config['network']['ipv4']['method']}'")
    print(f"export PROFOLIO_IPV4_ADDR='{config['network']['ipv4']['address']}'")
    print(f"export PROFOLIO_IPV4_GATEWAY='{config['network']['ipv4']['gateway']}'")
    print(f"export PROFOLIO_DNS_SERVERS='{' '.join(config['network']['dns']['servers'])}'")
    print(f"export PROFOLIO_MTU='{config['network']['mtu']}'")
    print(f"export PROFOLIO_APT_PROXY='{config['network']['apt_proxy']}'")
    print(f"export PROFOLIO_SSH='{config['features']['ssh']}'")
    print(f"export PROFOLIO_VERBOSE='{config['features']['verbose']}'")
    print(f"export PROFOLIO_OPTIMIZE='{config['features']['optimize_files']}'")
    print(f"export PROFOLIO_DEMO_MODE='{config['features']['demo_mode']}'")
EOF
)
    else
        echo -e "${RED}✗${NC} Neither jq nor python3 available for JSON parsing"
        return 1
    fi
    
    echo -e "${GREEN}✓${NC} Configuration imported successfully"
    
    # Display imported settings
    echo -e "${BLUE}Imported Settings:${NC}"
    echo "  Version: $PROFOLIO_VERSION"
    echo "  CPU Cores: $PROFOLIO_CPU"
    echo "  RAM: ${PROFOLIO_RAM}MB"
    echo "  Disk: ${PROFOLIO_DISK}GB"
    echo "  Network: $PROFOLIO_IPV4_METHOD"
    [ "$PROFOLIO_IPV4_METHOD" = "static" ] && echo "    IP: $PROFOLIO_IPV4_ADDR"
    [ "$PROFOLIO_IPV4_METHOD" = "static" ] && echo "    Gateway: $PROFOLIO_IPV4_GATEWAY"
    echo "  DNS Servers: $PROFOLIO_DNS_SERVERS"
    
    return 0
}

# Validate configuration
validate_config() {
    local input_file="${1:-$CONFIG_DIR/$CONFIG_FILE}"
    
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}✗${NC} Configuration file not found: $input_file"
        return 1
    fi
    
    echo -e "${BLUE}Validating configuration...${NC}"
    
    # Check JSON validity
    if command -v jq >/dev/null 2>&1; then
        if ! jq empty "$input_file" 2>/dev/null; then
            echo -e "${RED}✗${NC} Invalid JSON format"
            return 1
        fi
        
        # Check required fields
        local version=$(jq -r '.version' "$input_file")
        if [ "$version" != "$CONFIG_VERSION" ]; then
            echo -e "${YELLOW}⚠${NC} Warning: Config version mismatch (expected $CONFIG_VERSION, got $version)"
        fi
        
        # Validate resources
        local cpu=$(jq -r '.resources.cpu' "$input_file")
        local ram=$(jq -r '.resources.ram' "$input_file")
        local disk=$(jq -r '.resources.disk' "$input_file")
        
        if [ "$cpu" -lt 1 ] || [ "$cpu" -gt 128 ]; then
            echo -e "${RED}✗${NC} Invalid CPU cores: $cpu (must be 1-128)"
            return 1
        fi
        
        if [ "$ram" -lt 512 ] || [ "$ram" -gt 262144 ]; then
            echo -e "${RED}✗${NC} Invalid RAM: ${ram}MB (must be 512-262144)"
            return 1
        fi
        
        if [ "$disk" -lt 8 ] || [ "$disk" -gt 1000 ]; then
            echo -e "${RED}✗${NC} Invalid disk size: ${disk}GB (must be 8-1000)"
            return 1
        fi
        
        echo -e "${GREEN}✓${NC} Configuration is valid"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} jq not available, skipping validation"
        return 0
    fi
}

# Generate sample configuration
generate_sample_config() {
    local output_file="${1:-$CONFIG_DIR/sample.conf}"
    
    echo -e "${BLUE}Generating sample configuration...${NC}"
    
    cat > "$output_file" <<'EOF'
{
  "version": "1.0",
  "timestamp": "20250906_120000",
  "installation": {
    "type": "advanced",
    "version": "v1.16.0",
    "path": "/opt/profolio",
    "backup_enabled": true,
    "rollback_enabled": true
  },
  "resources": {
    "cpu": 4,
    "ram": 8192,
    "disk": 50
  },
  "network": {
    "ipv4": {
      "method": "static",
      "address": "192.168.1.100/24",
      "gateway": "192.168.1.1"
    },
    "ipv6": {
      "method": "slaac"
    },
    "dns": {
      "servers": ["8.8.8.8", "8.8.4.4"],
      "search": "local.domain"
    },
    "mtu": 1500,
    "apt_proxy": ""
  },
  "features": {
    "ssh": true,
    "verbose": false,
    "diagnostic": false,
    "optimize_files": true,
    "aggressive_optimize": false,
    "demo_mode": false
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "name": "profolio"
  },
  "services": {
    "frontend_port": 3000,
    "backend_port": 3001,
    "nginx_enabled": true,
    "ssl_enabled": false
  }
}
EOF
    
    echo -e "${GREEN}✓${NC} Sample configuration generated: $output_file"
    return 0
}

# List available configurations
list_configs() {
    echo -e "${BLUE}Available configurations:${NC}"
    
    if [ -d "$CONFIG_DIR" ]; then
        local configs=$(ls -1 "$CONFIG_DIR"/*.conf 2>/dev/null | sort -r)
        if [ -n "$configs" ]; then
            for config in $configs; do
                local filename=$(basename "$config")
                local size=$(du -h "$config" | cut -f1)
                local modified=$(stat -c %y "$config" 2>/dev/null | cut -d' ' -f1 || date -r "$config" '+%Y-%m-%d' 2>/dev/null)
                echo "  • $filename ($size, modified: $modified)"
            done
        else
            echo "  No configurations found in $CONFIG_DIR"
        fi
    else
        echo "  Config directory does not exist: $CONFIG_DIR"
    fi
}

# Interactive config manager menu
config_menu() {
    while true; do
        echo -e "\n${BLUE}=== Profolio Config Manager ===${NC}"
        echo "1) Export current configuration"
        echo "2) Import configuration"
        echo "3) Validate configuration"
        echo "4) Generate sample configuration"
        echo "5) List configurations"
        echo "6) Exit"
        
        read -p "Select option [1-6]: " choice
        
        case $choice in
            1)
                read -p "Enter output file path [$CONFIG_DIR/$CONFIG_FILE]: " output
                export_config "${output:-$CONFIG_DIR/$CONFIG_FILE}"
                ;;
            2)
                read -p "Enter config file path [$CONFIG_DIR/$CONFIG_FILE]: " input
                import_config "${input:-$CONFIG_DIR/$CONFIG_FILE}"
                ;;
            3)
                read -p "Enter config file path [$CONFIG_DIR/$CONFIG_FILE]: " input
                validate_config "${input:-$CONFIG_DIR/$CONFIG_FILE}"
                ;;
            4)
                read -p "Enter output file path [$CONFIG_DIR/sample.conf]: " output
                generate_sample_config "${output:-$CONFIG_DIR/sample.conf}"
                ;;
            5)
                list_configs
                ;;
            6)
                echo "Exiting config manager"
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
    init_config
    
    case "${1:-menu}" in
        export)
            export_config "$2"
            ;;
        import)
            import_config "$2"
            ;;
        validate)
            validate_config "$2"
            ;;
        sample)
            generate_sample_config "$2"
            ;;
        list)
            list_configs
            ;;
        menu|*)
            config_menu
            ;;
    esac
fi