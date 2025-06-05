#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - INSTALLATION REPORTING MODULE v1.0.0
# =============================================================================
# 
# Installation reporting and post-installation information
# Provides detailed reports, access information, and next steps
#
# Dependencies: utils/logging.sh, utils/ui.sh, utils/platform-detection.sh
# =============================================================================

# Module info function
installation_reporting_info() {
    echo "Installation Reporting Module v1.0.0"
    echo "  • Provides detailed installation summaries"
    echo "  • Shows access information and URLs"
    echo "  • Displays next steps and recommendations"
    echo "  • Generates installation reports"
}

# Generate installation summary
reporting_show_installation_summary() {
    local operation_type="${1:-INSTALL}"
    local version="${2:-latest}"
    local platform="${3:-unknown}"
    
    echo ""
    echo -e "${WHITE}🎉 INSTALLATION COMPLETED SUCCESSFULLY${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    # Operation details
    echo -e "${BLUE}📋 Operation Details${NC}"
    echo -e "────────────────────────────────────────"
    echo -e "${GREEN}Operation:${NC} $operation_type"
    echo -e "${GREEN}Version:${NC} $version"
    echo -e "${GREEN}Platform:${NC} $platform"
    echo -e "${GREEN}Date:${NC} $(date)"
    echo -e "${GREEN}Duration:${NC} ${INSTALL_DURATION:-Unknown}"
    echo ""
    
    # Installation details
    reporting_show_installation_details
    
    # Access information
    reporting_show_access_information
    
    # Service status
    reporting_show_service_status
    
    # Next steps
    reporting_show_next_steps "$operation_type"
    
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Show installation details
reporting_show_installation_details() {
    echo -e "${BLUE}📦 Installation Details${NC}"
    echo -e "────────────────────────────────────────"
    
    # Application location
    if [[ -d "/opt/profolio" ]]; then
        local app_size=$(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")
        echo -e "${GREEN}Application Path:${NC} /opt/profolio"
        echo -e "${GREEN}Application Size:${NC} $app_size"
    fi
    
    # Database information
    if command -v psql >/dev/null 2>&1 && sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw profolio 2>/dev/null; then
        local db_size=$(sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('profolio'));" -t 2>/dev/null | xargs || echo "unknown")
        echo -e "${GREEN}Database:${NC} PostgreSQL (profolio)"
        echo -e "${GREEN}Database Size:${NC} $db_size"
    fi
    
    # Configuration
    if [[ -f "/opt/profolio/.env" ]]; then
        echo -e "${GREEN}Environment:${NC} Configured"
    fi
    
    # Optimization level
    echo -e "${GREEN}Optimization:${NC} ${OPTIMIZATION_LEVEL:-safe}"
    
    echo ""
}

# Show access information
reporting_show_access_information() {
    echo -e "${BLUE}🌐 Access Information${NC}"
    echo -e "────────────────────────────────────────"
    
    # Get IP addresses
    local ip_addresses=()
    
    # Primary IP (most common)
    local primary_ip=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || echo "")
    if [[ -n "$primary_ip" ]]; then
        ip_addresses+=("$primary_ip")
    fi
    
    # All local IPs
    while IFS= read -r ip; do
        if [[ "$ip" != "$primary_ip" && "$ip" != "127.0.0.1" ]]; then
            ip_addresses+=("$ip")
        fi
    done < <(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || echo "")
    
    # Web interface URLs
    echo -e "${GREEN}🖥️  Frontend (Web Interface):${NC}"
    if [[ ${#ip_addresses[@]} -gt 0 ]]; then
        for ip in "${ip_addresses[@]}"; do
            echo -e "   • http://${ip}:3000"
            echo -e "   • https://${ip}:3000 (if SSL configured)"
        done
    else
        echo -e "   • http://localhost:3000"
        echo -e "   • https://localhost:3000 (if SSL configured)"
    fi
    echo ""
    
    # API information
    echo -e "${GREEN}🔌 Backend API:${NC}"
    if [[ ${#ip_addresses[@]} -gt 0 ]]; then
        for ip in "${ip_addresses[@]}"; do
            echo -e "   • http://${ip}:3001/api"
        done
    else
        echo -e "   • http://localhost:3001/api"
    fi
    echo ""
    
    # SSH access (if enabled)
    if [[ "${SSH_ENABLED:-yes}" == "yes" ]]; then
        echo -e "${GREEN}🔐 SSH Access:${NC}"
        local ssh_port="${SSH_PORT:-22}"
        if [[ ${#ip_addresses[@]} -gt 0 ]]; then
            for ip in "${ip_addresses[@]}"; do
                echo -e "   • ssh root@${ip} -p ${ssh_port}"
            done
        else
            echo -e "   • ssh root@localhost -p ${ssh_port}"
        fi
        
        if [[ "${SSH_KEY_ONLY:-yes}" == "yes" ]]; then
            echo -e "   ${YELLOW}⚠️  Key-only authentication enabled${NC}"
            if [[ -f "/root/.ssh/profolio_key" ]]; then
                echo -e "   • Private key: /root/.ssh/profolio_key"
            fi
        fi
        echo ""
    fi
    
    # Platform-specific access info
    local platform_type=$(platform_detect_type 2>/dev/null || echo "generic-linux")
    case "$platform_type" in
        "proxmox-host")
            echo -e "${GREEN}📱 Proxmox Management:${NC}"
            echo -e "   • Proxmox Web UI: Available via Proxmox host"
            echo -e "   • Container: Check Proxmox container list"
            echo ""
            ;;
        "docker-container")
            echo -e "${GREEN}🐳 Docker Management:${NC}"
            echo -e "   • Check status: docker ps | grep profolio"
            echo -e "   • View logs: docker logs profolio"
            echo ""
            ;;
    esac
}

# Show service status
reporting_show_service_status() {
    echo -e "${BLUE}⚙️  Service Status${NC}"
    echo -e "────────────────────────────────────────"
    
    # Check systemd services
    local services=("profolio-backend" "profolio-frontend" "postgresql")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "${GREEN}✅ $service:${NC} Running"
        elif systemctl is-enabled --quiet "$service" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  $service:${NC} Stopped (but enabled)"
        else
            echo -e "${RED}❌ $service:${NC} Not available"
        fi
    done
    
    # Check ports
    echo ""
    echo -e "${BLUE}🔌 Port Status${NC}"
    echo -e "────────────────────────────────────────"
    
    local ports=("3000:Frontend" "3001:Backend API" "5432:PostgreSQL")
    for port_info in "${ports[@]}"; do
        local port="${port_info%%:*}"
        local service_name="${port_info#*:}"
        
        if netstat -tuln 2>/dev/null | grep -q ":${port} " || ss -tuln 2>/dev/null | grep -q ":${port} "; then
            echo -e "${GREEN}✅ Port $port:${NC} $service_name (listening)"
        else
            echo -e "${RED}❌ Port $port:${NC} $service_name (not listening)"
        fi
    done
    
    echo ""
}

# Show next steps based on operation type
reporting_show_next_steps() {
    local operation_type="${1:-INSTALL}"
    
    echo -e "${BLUE}🚀 Next Steps${NC}"
    echo -e "────────────────────────────────────────"
    
    case "$operation_type" in
        "INSTALL")
            echo -e "${GREEN}1.${NC} ${CYAN}Open your web browser${NC} and navigate to the frontend URL above"
            echo -e "${GREEN}2.${NC} ${CYAN}Complete the initial setup${NC} in the web interface"
            echo -e "${GREEN}3.${NC} ${CYAN}Configure your portfolio${NC} by adding assets and accounts"
            echo -e "${GREEN}4.${NC} ${CYAN}Set up data sources${NC} for market data and portfolio tracking"
            ;;
        "UPDATE")
            echo -e "${GREEN}1.${NC} ${CYAN}Verify the update${NC} by checking the version in the web interface"
            echo -e "${GREEN}2.${NC} ${CYAN}Test your portfolio data${NC} to ensure everything migrated correctly"
            echo -e "${GREEN}3.${NC} ${CYAN}Review new features${NC} that may have been added"
            ;;
        "REPAIR")
            echo -e "${GREEN}1.${NC} ${CYAN}Verify services are running${NC} using the status information above"
            echo -e "${GREEN}2.${NC} ${CYAN}Test the web interface${NC} to ensure functionality is restored"
            echo -e "${GREEN}3.${NC} ${CYAN}Check your data integrity${NC} in the portfolio dashboard"
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}📚 Additional Resources${NC}"
    echo -e "────────────────────────────────────────"
    echo -e "${GREEN}•${NC} ${CYAN}Documentation:${NC} Check /opt/profolio/README.md"
    echo -e "${GREEN}•${NC} ${CYAN}Logs:${NC} journalctl -u profolio-backend -f"
    echo -e "${GREEN}•${NC} ${CYAN}Support:${NC} GitHub Issues for questions and bug reports"
    
    # Backup information
    if [[ -d "/opt/profolio-backups" ]]; then
        local backup_count=$(ls -1 /opt/profolio-backups/ 2>/dev/null | wc -l)
        echo -e "${GREEN}•${NC} ${CYAN}Backups:${NC} $backup_count backup(s) available in /opt/profolio-backups/"
    fi
    
    echo ""
}

# Generate installation report file
reporting_generate_report() {
    local operation_type="${1:-INSTALL}"
    local version="${2:-latest}"
    local platform="${3:-unknown}"
    local report_file="/opt/profolio-installation-report.txt"
    
    # Create report
    cat > "$report_file" << EOF
# PROFOLIO INSTALLATION REPORT
Generated: $(date)
Operation: $operation_type
Version: $version
Platform: $platform

## System Information
$(uname -a)
$(lsb_release -a 2>/dev/null || echo "Distribution: Unknown")

## Installation Details
EOF
    
    # Add installation details
    if [[ -d "/opt/profolio" ]]; then
        echo "Application: Installed at /opt/profolio" >> "$report_file"
        echo "App Size: $(du -sh /opt/profolio 2>/dev/null | cut -f1 || echo "unknown")" >> "$report_file"
    fi
    
    # Add service status
    echo "" >> "$report_file"
    echo "## Service Status" >> "$report_file"
    for service in profolio-backend profolio-frontend postgresql; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo "$service: Running" >> "$report_file"
        else
            echo "$service: Not running" >> "$report_file"
        fi
    done
    
    # Add network information
    echo "" >> "$report_file"
    echo "## Network Configuration" >> "$report_file"
    echo "IP Addresses: $(hostname -I 2>/dev/null | tr '\n' ' ')" >> "$report_file"
    echo "Frontend URLs:" >> "$report_file"
    hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | while read -r ip; do
        echo "  - http://$ip:3000" >> "$report_file"
    done
    
    info "Installation report saved to: $report_file"
}

# Show failure report
reporting_show_failure_report() {
    local operation_type="${1:-INSTALL}"
    local error_message="${2:-Unknown error occurred}"
    local exit_code="${3:-1}"
    
    echo ""
    echo -e "${RED}❌ INSTALLATION FAILED${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${BLUE}📋 Failure Details${NC}"
    echo -e "────────────────────────────────────────"
    echo -e "${RED}Operation:${NC} $operation_type"
    echo -e "${RED}Error:${NC} $error_message"
    echo -e "${RED}Exit Code:${NC} $exit_code"
    echo -e "${RED}Date:${NC} $(date)"
    echo ""
    
    echo -e "${BLUE}🔍 Troubleshooting Steps${NC}"
    echo -e "────────────────────────────────────────"
    echo -e "${GREEN}1.${NC} ${CYAN}Check the logs${NC} for detailed error messages:"
    echo -e "   • journalctl -u profolio-backend --no-pager | tail -50"
    echo -e "   • journalctl -u profolio-frontend --no-pager | tail -50"
    echo ""
    
    echo -e "${GREEN}2.${NC} ${CYAN}Verify system requirements:${NC}"
    echo -e "   • Sufficient disk space (20GB+ recommended)"
    echo -e "   • Network connectivity to GitHub and package repositories"
    echo -e "   • Root/sudo privileges"
    echo ""
    
    echo -e "${GREEN}3.${NC} ${CYAN}Try the repair option:${NC}"
    echo -e "   • Re-run installer and select 'Repair installation'"
    echo ""
    
    echo -e "${GREEN}4.${NC} ${CYAN}Get support:${NC}"
    echo -e "   • Create GitHub issue with this error information"
    echo -e "   • Include system information: uname -a && lsb_release -a"
    echo ""
    
    # Check for common issues
    echo -e "${BLUE}🔧 Common Issue Checks${NC}"
    echo -e "────────────────────────────────────────"
    
    # Disk space
    local available_space=$(df / | tail -1 | awk '{print $4}')
    if [[ "$available_space" -lt 5242880 ]]; then  # Less than 5GB
        echo -e "${RED}⚠️  Low disk space detected:${NC} $(df -h / | tail -1 | awk '{print $4}') available"
    else
        echo -e "${GREEN}✅ Disk space:${NC} $(df -h / | tail -1 | awk '{print $4}') available"
    fi
    
    # Network connectivity
    if ping -c1 github.com >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Network:${NC} GitHub connectivity OK"
    else
        echo -e "${RED}⚠️  Network:${NC} Cannot reach GitHub - check internet connection"
    fi
    
    # Permissions
    if [[ "$EUID" -eq 0 ]]; then
        echo -e "${GREEN}✅ Permissions:${NC} Running as root"
    else
        echo -e "${RED}⚠️  Permissions:${NC} Not running as root - may cause issues"
    fi
    
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Backward compatibility aliases
show_installation_summary() { reporting_show_installation_summary "$@"; }
show_access_information() { reporting_show_access_information "$@"; }
show_next_steps() { reporting_show_next_steps "$@"; }
show_failure_report() { reporting_show_failure_report "$@"; }

# Module metadata
INSTALLATION_REPORTING_VERSION="1.0.0"
INSTALLATION_REPORTING_DEPENDENCIES="utils/logging.sh utils/ui.sh utils/platform-detection.sh" 