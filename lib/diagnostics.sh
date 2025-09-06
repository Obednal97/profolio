#!/bin/bash

# Profolio Diagnostics Module
# Collects diagnostic data for troubleshooting (opt-in)
# Version: 1.0.0

# Configuration
DIAGNOSTICS_DIR="${DIAGNOSTICS_DIR:-/tmp/profolio-diagnostics}"
DIAGNOSTICS_FILE="${DIAGNOSTICS_FILE:-profolio-diagnostics-$(date +%Y%m%d-%H%M%S).tar.gz}"
TELEMETRY_URL="${TELEMETRY_URL:-}" # Optional telemetry endpoint
ANONYMIZE="${ANONYMIZE:-true}"
MAX_LOG_SIZE=10485760  # 10MB max per log file

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Diagnostic data collection flags
COLLECT_SYSTEM=true
COLLECT_NETWORK=true
COLLECT_SERVICES=true
COLLECT_LOGS=true
COLLECT_CONFIG=true
COLLECT_PERFORMANCE=true

# Initialize diagnostics directory
init_diagnostics() {
    rm -rf "$DIAGNOSTICS_DIR"
    mkdir -p "$DIAGNOSTICS_DIR"
    chmod 700 "$DIAGNOSTICS_DIR"
}

# Anonymize sensitive data
anonymize_data() {
    local input="$1"
    
    if [ "$ANONYMIZE" = "true" ]; then
        # Replace IP addresses (except localhost)
        echo "$input" | sed -E 's/([0-9]{1,3}\.){3}[0-9]{1,3}/XXX.XXX.XXX.XXX/g' | \
                       sed 's/XXX.XXX.XXX.XXX/127.0.0.1/g' | \
                       sed 's/127.0.0.1/XXX.XXX.XXX.XXX/1' | \
                       sed 's/XXX.XXX.XXX.XXX/127.0.0.1/g' | \
        # Replace email addresses
        sed -E 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/user@example.com/g' | \
        # Replace passwords
        sed -E 's/(password|passwd|pwd|pass)[:=][^ ]*/\1:REDACTED/gi' | \
        # Replace API keys
        sed -E 's/(api[_-]?key|token|secret)[:=][^ ]*/\1:REDACTED/gi' | \
        # Replace database URLs
        sed -E 's/(postgresql|mysql|mongodb):\/\/[^@]+@/\1:\/\/REDACTED@/g'
    else
        echo "$input"
    fi
}

# Collect system information
collect_system_info() {
    echo -e "${BLUE}Collecting system information...${NC}"
    
    local output_file="$DIAGNOSTICS_DIR/system-info.txt"
    
    {
        echo "=== SYSTEM INFORMATION ==="
        echo "Date: $(date)"
        echo "Hostname: $(hostname)"
        echo ""
        
        echo "=== OS Information ==="
        if [ -f /etc/os-release ]; then
            cat /etc/os-release
        else
            uname -a
        fi
        echo ""
        
        echo "=== Kernel ==="
        uname -r
        echo ""
        
        echo "=== CPU Information ==="
        lscpu 2>/dev/null || cat /proc/cpuinfo | grep -E "processor|model name|cpu cores" | head -20
        echo ""
        
        echo "=== Memory Information ==="
        free -h
        echo ""
        
        echo "=== Disk Usage ==="
        df -h
        echo ""
        
        echo "=== Mount Points ==="
        mount | grep -v "/sys\|/proc"
        echo ""
        
        echo "=== Process List (Top 20 by CPU) ==="
        ps aux --sort=-%cpu | head -20
        echo ""
        
        echo "=== Process List (Top 20 by Memory) ==="
        ps aux --sort=-%mem | head -20
        echo ""
        
        echo "=== System Load ==="
        uptime
        echo ""
        
        if [ -f /proc/loadavg ]; then
            echo "Load Average: $(cat /proc/loadavg)"
        fi
        
    } | anonymize_data > "$output_file"
    
    echo -e "  ${GREEN}✓${NC} System information collected"
}

# Collect network information
collect_network_info() {
    echo -e "${BLUE}Collecting network information...${NC}"
    
    local output_file="$DIAGNOSTICS_DIR/network-info.txt"
    
    {
        echo "=== NETWORK INFORMATION ==="
        echo "Date: $(date)"
        echo ""
        
        echo "=== Network Interfaces ==="
        ip addr show 2>/dev/null || ifconfig -a
        echo ""
        
        echo "=== Routing Table ==="
        ip route show 2>/dev/null || route -n
        echo ""
        
        echo "=== DNS Configuration ==="
        cat /etc/resolv.conf 2>/dev/null
        echo ""
        
        echo "=== Network Connections ==="
        netstat -tuln 2>/dev/null || ss -tuln
        echo ""
        
        echo "=== Active Connections ==="
        netstat -tun 2>/dev/null | head -50 || ss -tun | head -50
        echo ""
        
        echo "=== Firewall Rules (iptables) ==="
        iptables -L -n 2>/dev/null || echo "iptables not available or no permissions"
        echo ""
        
        echo "=== Network Performance ==="
        # Test connectivity to common services
        echo "Ping test to 8.8.8.8:"
        ping -c 3 -W 2 8.8.8.8 2>/dev/null || echo "Ping failed"
        echo ""
        
        echo "DNS resolution test:"
        host google.com 2>/dev/null || nslookup google.com 2>/dev/null || echo "DNS resolution failed"
        echo ""
        
    } | anonymize_data > "$output_file"
    
    echo -e "  ${GREEN}✓${NC} Network information collected"
}

# Collect service status
collect_service_info() {
    echo -e "${BLUE}Collecting service information...${NC}"
    
    local output_file="$DIAGNOSTICS_DIR/services-info.txt"
    
    {
        echo "=== SERVICE INFORMATION ==="
        echo "Date: $(date)"
        echo ""
        
        echo "=== Systemd Services ==="
        if command -v systemctl >/dev/null 2>&1; then
            systemctl status profolio-backend profolio-frontend postgresql nginx 2>/dev/null
            echo ""
            echo "=== All Services Status ==="
            systemctl list-units --state=running
            echo ""
            echo "=== Failed Services ==="
            systemctl list-units --state=failed
        else
            echo "systemd not available"
        fi
        echo ""
        
        echo "=== Docker Containers (if applicable) ==="
        if command -v docker >/dev/null 2>&1; then
            docker ps -a 2>/dev/null || echo "Docker not accessible"
            echo ""
            docker stats --no-stream 2>/dev/null || echo "Docker stats not available"
        else
            echo "Docker not installed"
        fi
        echo ""
        
        echo "=== Port Listeners ==="
        lsof -i :80,443,3000,3001,5432 2>/dev/null || netstat -tlpn 2>/dev/null | grep -E ":(80|443|3000|3001|5432)"
        echo ""
        
    } | anonymize_data > "$output_file"
    
    echo -e "  ${GREEN}✓${NC} Service information collected"
}

# Collect log files
collect_logs() {
    echo -e "${BLUE}Collecting log files...${NC}"
    
    local logs_dir="$DIAGNOSTICS_DIR/logs"
    mkdir -p "$logs_dir"
    
    # System logs
    if [ -f /var/log/syslog ]; then
        tail -n 1000 /var/log/syslog | anonymize_data > "$logs_dir/syslog.txt" 2>/dev/null
    fi
    
    if [ -f /var/log/messages ]; then
        tail -n 1000 /var/log/messages | anonymize_data > "$logs_dir/messages.txt" 2>/dev/null
    fi
    
    # Service logs
    if command -v journalctl >/dev/null 2>&1; then
        journalctl -u profolio-backend --since "1 hour ago" --no-pager | \
            anonymize_data > "$logs_dir/profolio-backend.log" 2>/dev/null
        
        journalctl -u profolio-frontend --since "1 hour ago" --no-pager | \
            anonymize_data > "$logs_dir/profolio-frontend.log" 2>/dev/null
        
        journalctl -u postgresql --since "1 hour ago" --no-pager | \
            anonymize_data > "$logs_dir/postgresql.log" 2>/dev/null
        
        journalctl -u nginx --since "1 hour ago" --no-pager | \
            anonymize_data > "$logs_dir/nginx.log" 2>/dev/null
    fi
    
    # Application logs
    if [ -d /opt/profolio ]; then
        if [ -f /opt/profolio/frontend/.next/trace ]; then
            tail -n 500 /opt/profolio/frontend/.next/trace | \
                anonymize_data > "$logs_dir/nextjs-trace.txt" 2>/dev/null
        fi
        
        if [ -d /opt/profolio/logs ]; then
            for logfile in /opt/profolio/logs/*.log; do
                if [ -f "$logfile" ]; then
                    local basename=$(basename "$logfile")
                    tail -n 500 "$logfile" | anonymize_data > "$logs_dir/$basename" 2>/dev/null
                fi
            done
        fi
    fi
    
    # Installation logs
    if [ -f /tmp/profolio_install.log ]; then
        tail -n 1000 /tmp/profolio_install.log | \
            anonymize_data > "$logs_dir/install.log" 2>/dev/null
    fi
    
    echo -e "  ${GREEN}✓${NC} Log files collected"
}

# Collect configuration files (sanitized)
collect_config() {
    echo -e "${BLUE}Collecting configuration files...${NC}"
    
    local config_dir="$DIAGNOSTICS_DIR/config"
    mkdir -p "$config_dir"
    
    # Nginx configuration
    if [ -f /etc/nginx/sites-enabled/profolio ]; then
        anonymize_data < /etc/nginx/sites-enabled/profolio > "$config_dir/nginx-profolio.conf" 2>/dev/null
    fi
    
    # PostgreSQL configuration
    if [ -f /etc/postgresql/*/main/postgresql.conf ]; then
        grep -v "^#\|^$" /etc/postgresql/*/main/postgresql.conf | \
            anonymize_data > "$config_dir/postgresql.conf" 2>/dev/null
    fi
    
    # Profolio configuration (without secrets)
    if [ -d /opt/profolio ]; then
        # Package.json files (versions info)
        if [ -f /opt/profolio/package.json ]; then
            cat /opt/profolio/package.json > "$config_dir/root-package.json"
        fi
        
        if [ -f /opt/profolio/frontend/package.json ]; then
            cat /opt/profolio/frontend/package.json > "$config_dir/frontend-package.json"
        fi
        
        if [ -f /opt/profolio/backend/package.json ]; then
            cat /opt/profolio/backend/package.json > "$config_dir/backend-package.json"
        fi
        
        # Environment files (heavily sanitized)
        if [ -f /opt/profolio/frontend/.env.production ]; then
            grep -E "^(NEXT_PUBLIC_AUTH_MODE|NEXT_PUBLIC_API_URL)" /opt/profolio/frontend/.env.production | \
                anonymize_data > "$config_dir/frontend-env.txt" 2>/dev/null
        fi
    fi
    
    echo -e "  ${GREEN}✓${NC} Configuration files collected"
}

# Collect performance metrics
collect_performance() {
    echo -e "${BLUE}Collecting performance metrics...${NC}"
    
    local output_file="$DIAGNOSTICS_DIR/performance.txt"
    
    {
        echo "=== PERFORMANCE METRICS ==="
        echo "Date: $(date)"
        echo ""
        
        echo "=== CPU Usage ==="
        top -bn1 | head -20
        echo ""
        
        echo "=== Memory Usage Details ==="
        cat /proc/meminfo | head -20
        echo ""
        
        echo "=== IO Statistics ==="
        iostat 2>/dev/null || echo "iostat not available"
        echo ""
        
        echo "=== Network Statistics ==="
        netstat -s 2>/dev/null | head -50 || ss -s
        echo ""
        
        echo "=== Database Performance (if accessible) ==="
        if command -v psql >/dev/null 2>&1; then
            PGPASSWORD="${DB_PASSWORD:-}" psql -h localhost -U profolio -d profolio -c \
                "SELECT pg_size_pretty(pg_database_size('profolio'));" 2>/dev/null || \
                echo "Could not connect to database"
        fi
        echo ""
        
        echo "=== Application Response Times ==="
        echo "Frontend (http://localhost:3000):"
        curl -o /dev/null -s -w "Connect: %{time_connect}s\nTotal: %{time_total}s\n" \
            http://localhost:3000 2>/dev/null || echo "Frontend not responding"
        echo ""
        
        echo "Backend (http://localhost:3001/health):"
        curl -o /dev/null -s -w "Connect: %{time_connect}s\nTotal: %{time_total}s\n" \
            http://localhost:3001/health 2>/dev/null || echo "Backend not responding"
        echo ""
        
    } | anonymize_data > "$output_file"
    
    echo -e "  ${GREEN}✓${NC} Performance metrics collected"
}

# Create diagnostic summary
create_summary() {
    echo -e "${BLUE}Creating diagnostic summary...${NC}"
    
    local summary_file="$DIAGNOSTICS_DIR/summary.txt"
    
    {
        echo "PROFOLIO DIAGNOSTIC SUMMARY"
        echo "=========================="
        echo "Generated: $(date)"
        echo "Version: $(cd /opt/profolio 2>/dev/null && git describe --tags 2>/dev/null || echo 'unknown')"
        echo ""
        
        echo "Collection Settings:"
        echo "  Anonymized: $ANONYMIZE"
        echo "  System Info: $COLLECT_SYSTEM"
        echo "  Network Info: $COLLECT_NETWORK"
        echo "  Services: $COLLECT_SERVICES"
        echo "  Logs: $COLLECT_LOGS"
        echo "  Config: $COLLECT_CONFIG"
        echo "  Performance: $COLLECT_PERFORMANCE"
        echo ""
        
        echo "Quick Health Check:"
        # Check services
        for service in profolio-backend profolio-frontend postgresql nginx; do
            if systemctl is-active --quiet $service 2>/dev/null; then
                echo "  ✓ $service: Running"
            else
                echo "  ✗ $service: Not running"
            fi
        done
        echo ""
        
        echo "Files Collected:"
        find "$DIAGNOSTICS_DIR" -type f -exec basename {} \; | sort | sed 's/^/  - /'
        echo ""
        
        echo "Total Size: $(du -sh "$DIAGNOSTICS_DIR" | cut -f1)"
        
    } > "$summary_file"
    
    echo -e "  ${GREEN}✓${NC} Summary created"
}

# Package diagnostics
package_diagnostics() {
    echo -e "${BLUE}Packaging diagnostics...${NC}"
    
    cd "$(dirname "$DIAGNOSTICS_DIR")"
    tar -czf "$DIAGNOSTICS_FILE" "$(basename "$DIAGNOSTICS_DIR")"
    
    echo -e "  ${GREEN}✓${NC} Diagnostics packaged: $DIAGNOSTICS_FILE"
    echo -e "  Size: $(du -h "$DIAGNOSTICS_FILE" | cut -f1)"
    
    # Cleanup
    rm -rf "$DIAGNOSTICS_DIR"
}

# Upload diagnostics (optional)
upload_diagnostics() {
    if [ -z "$TELEMETRY_URL" ]; then
        echo -e "${YELLOW}⚠${NC} No telemetry URL configured, skipping upload"
        return 1
    fi
    
    echo -e "${BLUE}Uploading diagnostics...${NC}"
    
    if curl -X POST -F "file=@$DIAGNOSTICS_FILE" \
           -F "hostname=$(hostname)" \
           -F "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           "$TELEMETRY_URL" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Diagnostics uploaded successfully"
        return 0
    else
        echo -e "  ${RED}✗${NC} Failed to upload diagnostics"
        return 1
    fi
}

# Interactive consent prompt
get_consent() {
    echo -e "${BLUE}=== Profolio Diagnostic Data Collection ===${NC}"
    echo
    echo "This tool collects diagnostic information to help troubleshoot issues."
    echo "The following data will be collected:"
    echo "  • System information (OS, CPU, memory, disk)"
    echo "  • Network configuration"
    echo "  • Service status"
    echo "  • Recent log files (last hour)"
    echo "  • Configuration files (sanitized)"
    echo "  • Performance metrics"
    echo
    
    if [ "$ANONYMIZE" = "true" ]; then
        echo -e "${GREEN}Data will be anonymized:${NC}"
        echo "  • IP addresses will be replaced"
        echo "  • Passwords will be removed"
        echo "  • API keys will be redacted"
        echo "  • Email addresses will be masked"
    else
        echo -e "${YELLOW}Warning: Data will NOT be anonymized${NC}"
    fi
    echo
    
    read -p "Do you consent to diagnostic data collection? (y/n): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Diagnostic collection cancelled${NC}"
        return 1
    fi
    
    return 0
}

# Run full diagnostics
run_diagnostics() {
    if ! get_consent; then
        return 1
    fi
    
    echo -e "\n${BLUE}Starting diagnostic collection...${NC}\n"
    
    init_diagnostics
    
    [ "$COLLECT_SYSTEM" = "true" ] && collect_system_info
    [ "$COLLECT_NETWORK" = "true" ] && collect_network_info
    [ "$COLLECT_SERVICES" = "true" ] && collect_service_info
    [ "$COLLECT_LOGS" = "true" ] && collect_logs
    [ "$COLLECT_CONFIG" = "true" ] && collect_config
    [ "$COLLECT_PERFORMANCE" = "true" ] && collect_performance
    
    create_summary
    package_diagnostics
    
    echo -e "\n${GREEN}✓ Diagnostic collection complete!${NC}"
    echo -e "File saved to: ${BLUE}$DIAGNOSTICS_FILE${NC}"
    
    # Offer to upload if configured
    if [ -n "$TELEMETRY_URL" ]; then
        echo
        read -p "Upload diagnostics for analysis? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            upload_diagnostics
        fi
    fi
    
    return 0
}

# Selective diagnostics menu
diagnostics_menu() {
    while true; do
        echo -e "\n${BLUE}=== Profolio Diagnostics Menu ===${NC}"
        echo "Select what to collect:"
        echo "1) Full diagnostics (all data)"
        echo "2) System information only"
        echo "3) Network configuration only"
        echo "4) Service status only"
        echo "5) Log files only"
        echo "6) Performance metrics only"
        echo "7) Custom selection"
        echo "8) Toggle anonymization (currently: $ANONYMIZE)"
        echo "9) Exit"
        
        read -p "Select option [1-9]: " choice
        
        case $choice in
            1)
                run_diagnostics
                ;;
            2)
                COLLECT_SYSTEM=true
                COLLECT_NETWORK=false
                COLLECT_SERVICES=false
                COLLECT_LOGS=false
                COLLECT_CONFIG=false
                COLLECT_PERFORMANCE=false
                run_diagnostics
                ;;
            3)
                COLLECT_SYSTEM=false
                COLLECT_NETWORK=true
                COLLECT_SERVICES=false
                COLLECT_LOGS=false
                COLLECT_CONFIG=false
                COLLECT_PERFORMANCE=false
                run_diagnostics
                ;;
            4)
                COLLECT_SYSTEM=false
                COLLECT_NETWORK=false
                COLLECT_SERVICES=true
                COLLECT_LOGS=false
                COLLECT_CONFIG=false
                COLLECT_PERFORMANCE=false
                run_diagnostics
                ;;
            5)
                COLLECT_SYSTEM=false
                COLLECT_NETWORK=false
                COLLECT_SERVICES=false
                COLLECT_LOGS=true
                COLLECT_CONFIG=false
                COLLECT_PERFORMANCE=false
                run_diagnostics
                ;;
            6)
                COLLECT_SYSTEM=false
                COLLECT_NETWORK=false
                COLLECT_SERVICES=false
                COLLECT_LOGS=false
                COLLECT_CONFIG=false
                COLLECT_PERFORMANCE=true
                run_diagnostics
                ;;
            7)
                echo "Toggle collection options:"
                read -p "  System info? (y/n) [$COLLECT_SYSTEM]: " sys
                [ "$sys" = "n" ] && COLLECT_SYSTEM=false || COLLECT_SYSTEM=true
                
                read -p "  Network info? (y/n) [$COLLECT_NETWORK]: " net
                [ "$net" = "n" ] && COLLECT_NETWORK=false || COLLECT_NETWORK=true
                
                read -p "  Services? (y/n) [$COLLECT_SERVICES]: " svc
                [ "$svc" = "n" ] && COLLECT_SERVICES=false || COLLECT_SERVICES=true
                
                read -p "  Logs? (y/n) [$COLLECT_LOGS]: " log
                [ "$log" = "n" ] && COLLECT_LOGS=false || COLLECT_LOGS=true
                
                read -p "  Config? (y/n) [$COLLECT_CONFIG]: " cfg
                [ "$cfg" = "n" ] && COLLECT_CONFIG=false || COLLECT_CONFIG=true
                
                read -p "  Performance? (y/n) [$COLLECT_PERFORMANCE]: " perf
                [ "$perf" = "n" ] && COLLECT_PERFORMANCE=false || COLLECT_PERFORMANCE=true
                
                run_diagnostics
                ;;
            8)
                if [ "$ANONYMIZE" = "true" ]; then
                    ANONYMIZE=false
                    echo -e "${YELLOW}⚠ Anonymization disabled${NC}"
                else
                    ANONYMIZE=true
                    echo -e "${GREEN}✓ Anonymization enabled${NC}"
                fi
                ;;
            9)
                echo "Exiting diagnostics"
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
    case "${1:-menu}" in
        full)
            run_diagnostics
            ;;
        system)
            COLLECT_SYSTEM=true
            COLLECT_NETWORK=false
            COLLECT_SERVICES=false
            COLLECT_LOGS=false
            COLLECT_CONFIG=false
            COLLECT_PERFORMANCE=false
            run_diagnostics
            ;;
        network)
            COLLECT_SYSTEM=false
            COLLECT_NETWORK=true
            COLLECT_SERVICES=false
            COLLECT_LOGS=false
            COLLECT_CONFIG=false
            COLLECT_PERFORMANCE=false
            run_diagnostics
            ;;
        quick)
            # Quick diagnostics without logs
            COLLECT_LOGS=false
            COLLECT_CONFIG=false
            run_diagnostics
            ;;
        menu|*)
            diagnostics_menu
            ;;
    esac
fi