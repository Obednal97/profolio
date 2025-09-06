#!/bin/bash

# Profolio Health Checks
# Post-installation validation and service health monitoring
# Version: 1.0.0

# Configuration
PROFOLIO_PATH="${PROFOLIO_PATH:-/opt/profolio}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-profolio}"
DB_USER="${DB_USER:-profolio}"
MAX_RETRIES=10
RETRY_DELAY=3

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health check results
declare -A HEALTH_STATUS
HEALTH_ERRORS=0

# Check if service is running
check_service_status() {
    local service="$1"
    
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} $service: Running"
        HEALTH_STATUS["$service"]="running"
        return 0
    elif [ -f "/etc/init.d/$service" ] && /etc/init.d/"$service" status >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $service: Running (init.d)"
        HEALTH_STATUS["$service"]="running"
        return 0
    else
        echo -e "  ${RED}✗${NC} $service: Not running"
        HEALTH_STATUS["$service"]="stopped"
        return 1
    fi
}

# Check PostgreSQL database
check_database() {
    echo -e "${BLUE}Checking PostgreSQL database...${NC}"
    
    # Check if PostgreSQL is running
    if ! check_service_status "postgresql"; then
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    # Check if we can connect
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="${DB_PASSWORD:-}" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Database connection: Success"
            HEALTH_STATUS["db_connection"]="ok"
            
            # Check database size
            local db_size=$(PGPASSWORD="${DB_PASSWORD:-}" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ')
            if [ -n "$db_size" ]; then
                echo -e "  ${GREEN}✓${NC} Database size: $db_size"
                HEALTH_STATUS["db_size"]="$db_size"
            fi
            
            # Check for required tables
            local table_count=$(PGPASSWORD="${DB_PASSWORD:-}" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
            if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
                echo -e "  ${GREEN}✓${NC} Database tables: $table_count tables"
                HEALTH_STATUS["db_tables"]="$table_count"
            else
                echo -e "  ${YELLOW}⚠${NC} Database tables: No tables found (migrations may be needed)"
                HEALTH_STATUS["db_tables"]="0"
            fi
        else
            echo -e "  ${RED}✗${NC} Database connection: Failed"
            HEALTH_STATUS["db_connection"]="failed"
            ((HEALTH_ERRORS++))
            return 1
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} psql client not available, skipping detailed checks"
    fi
    
    # Check if port is listening
    if netstat -tuln 2>/dev/null | grep -q ":$DB_PORT " || lsof -i :$DB_PORT >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} PostgreSQL port $DB_PORT: Open"
        HEALTH_STATUS["db_port"]="open"
    else
        echo -e "  ${RED}✗${NC} PostgreSQL port $DB_PORT: Not listening"
        HEALTH_STATUS["db_port"]="closed"
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    return 0
}

# Check NestJS backend
check_backend() {
    echo -e "${BLUE}Checking backend service...${NC}"
    
    # Check service status
    if ! check_service_status "profolio-backend"; then
        ((HEALTH_ERRORS++))
    fi
    
    # Check if port is listening
    if netstat -tuln 2>/dev/null | grep -q ":$BACKEND_PORT " || lsof -i :$BACKEND_PORT >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Backend port $BACKEND_PORT: Open"
        HEALTH_STATUS["backend_port"]="open"
    else
        echo -e "  ${RED}✗${NC} Backend port $BACKEND_PORT: Not listening"
        HEALTH_STATUS["backend_port"]="closed"
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    # Check API health endpoint
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/health" 2>/dev/null | grep -q "200\|204"; then
            echo -e "  ${GREEN}✓${NC} Backend API: Responding"
            HEALTH_STATUS["backend_api"]="ok"
            
            # Check API version
            local api_version=$(curl -s "http://localhost:$BACKEND_PORT/version" 2>/dev/null | grep -oP '"version":"\K[^"]+' || echo "unknown")
            echo -e "  ${GREEN}✓${NC} Backend version: $api_version"
            HEALTH_STATUS["backend_version"]="$api_version"
            
            return 0
        else
            ((retries++))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo -e "  ${YELLOW}⚠${NC} Backend API not ready, retrying in ${RETRY_DELAY}s... ($retries/$MAX_RETRIES)"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo -e "  ${RED}✗${NC} Backend API: Not responding"
    HEALTH_STATUS["backend_api"]="failed"
    ((HEALTH_ERRORS++))
    return 1
}

# Check Next.js frontend
check_frontend() {
    echo -e "${BLUE}Checking frontend service...${NC}"
    
    # Check service status
    if ! check_service_status "profolio-frontend"; then
        ((HEALTH_ERRORS++))
    fi
    
    # Check if port is listening
    if netstat -tuln 2>/dev/null | grep -q ":$FRONTEND_PORT " || lsof -i :$FRONTEND_PORT >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Frontend port $FRONTEND_PORT: Open"
        HEALTH_STATUS["frontend_port"]="open"
    else
        echo -e "  ${RED}✗${NC} Frontend port $FRONTEND_PORT: Not listening"
        HEALTH_STATUS["frontend_port"]="closed"
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    # Check frontend response
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null)
        if [ "$response" = "200" ] || [ "$response" = "302" ]; then
            echo -e "  ${GREEN}✓${NC} Frontend: Responding (HTTP $response)"
            HEALTH_STATUS["frontend_http"]="ok"
            
            # Check if Next.js is serving
            if curl -s "http://localhost:$FRONTEND_PORT" 2>/dev/null | grep -q "Profolio\|Next.js"; then
                echo -e "  ${GREEN}✓${NC} Frontend: Next.js app detected"
                HEALTH_STATUS["frontend_app"]="nextjs"
            fi
            
            return 0
        else
            ((retries++))
            if [ $retries -lt $MAX_RETRIES ]; then
                echo -e "  ${YELLOW}⚠${NC} Frontend not ready, retrying in ${RETRY_DELAY}s... ($retries/$MAX_RETRIES)"
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    echo -e "  ${RED}✗${NC} Frontend: Not responding"
    HEALTH_STATUS["frontend_http"]="failed"
    ((HEALTH_ERRORS++))
    return 1
}

# Check nginx reverse proxy
check_nginx() {
    echo -e "${BLUE}Checking nginx...${NC}"
    
    # Check if nginx is installed
    if ! command -v nginx >/dev/null 2>&1; then
        echo -e "  ${YELLOW}⚠${NC} nginx: Not installed"
        HEALTH_STATUS["nginx"]="not_installed"
        return 1
    fi
    
    # Check service status
    if ! check_service_status "nginx"; then
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    # Check configuration
    if nginx -t 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} nginx configuration: Valid"
        HEALTH_STATUS["nginx_config"]="valid"
    else
        echo -e "  ${RED}✗${NC} nginx configuration: Invalid"
        HEALTH_STATUS["nginx_config"]="invalid"
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    # Check if proxying to Profolio
    if grep -q "proxy_pass.*localhost:$FRONTEND_PORT" /etc/nginx/sites-enabled/* 2>/dev/null || \
       grep -q "proxy_pass.*localhost:$FRONTEND_PORT" /etc/nginx/conf.d/* 2>/dev/null; then
        echo -e "  ${GREEN}✓${NC} nginx proxy: Configured for Profolio"
        HEALTH_STATUS["nginx_proxy"]="configured"
    else
        echo -e "  ${YELLOW}⚠${NC} nginx proxy: Not configured for Profolio"
        HEALTH_STATUS["nginx_proxy"]="not_configured"
    fi
    
    # Check ports 80/443
    if netstat -tuln 2>/dev/null | grep -q ":80 " || lsof -i :80 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Port 80: Open"
        HEALTH_STATUS["port_80"]="open"
    else
        echo -e "  ${YELLOW}⚠${NC} Port 80: Not listening"
        HEALTH_STATUS["port_80"]="closed"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":443 " || lsof -i :443 >/dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Port 443: Open (HTTPS)"
        HEALTH_STATUS["port_443"]="open"
    else
        echo -e "  ${YELLOW}⚠${NC} Port 443: Not listening (HTTPS not configured)"
        HEALTH_STATUS["port_443"]="closed"
    fi
    
    return 0
}

# Check file permissions
check_permissions() {
    echo -e "${BLUE}Checking file permissions...${NC}"
    
    if [ ! -d "$PROFOLIO_PATH" ]; then
        echo -e "  ${RED}✗${NC} Installation directory not found: $PROFOLIO_PATH"
        HEALTH_STATUS["install_dir"]="missing"
        ((HEALTH_ERRORS++))
        return 1
    fi
    
    echo -e "  ${GREEN}✓${NC} Installation directory: $PROFOLIO_PATH"
    HEALTH_STATUS["install_dir"]="exists"
    
    # Check ownership
    local owner=$(stat -c %U "$PROFOLIO_PATH" 2>/dev/null || stat -f %Su "$PROFOLIO_PATH" 2>/dev/null)
    echo -e "  ${GREEN}✓${NC} Directory owner: $owner"
    HEALTH_STATUS["dir_owner"]="$owner"
    
    # Check critical files
    local critical_files=(
        "frontend/package.json"
        "backend/package.json"
        "frontend/.next"
        "backend/dist"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -e "$PROFOLIO_PATH/$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file: Exists"
        else
            echo -e "  ${YELLOW}⚠${NC} $file: Missing"
        fi
    done
    
    # Check write permissions
    if [ -w "$PROFOLIO_PATH" ]; then
        echo -e "  ${GREEN}✓${NC} Write permissions: OK"
        HEALTH_STATUS["write_perms"]="ok"
    else
        echo -e "  ${YELLOW}⚠${NC} Write permissions: Limited"
        HEALTH_STATUS["write_perms"]="limited"
    fi
    
    return 0
}

# Check SSL certificates
check_ssl() {
    echo -e "${BLUE}Checking SSL certificates...${NC}"
    
    # Check for Let's Encrypt
    if [ -d "/etc/letsencrypt/live" ]; then
        local cert_domains=$(ls /etc/letsencrypt/live 2>/dev/null)
        if [ -n "$cert_domains" ]; then
            echo -e "  ${GREEN}✓${NC} Let's Encrypt certificates found"
            HEALTH_STATUS["ssl_provider"]="letsencrypt"
            
            for domain in $cert_domains; do
                if [ -f "/etc/letsencrypt/live/$domain/cert.pem" ]; then
                    local expiry=$(openssl x509 -in "/etc/letsencrypt/live/$domain/cert.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
                    echo -e "  ${GREEN}✓${NC} Certificate for $domain (expires: $expiry)"
                fi
            done
        else
            echo -e "  ${YELLOW}⚠${NC} No Let's Encrypt certificates configured"
            HEALTH_STATUS["ssl_provider"]="none"
        fi
    else
        echo -e "  ${YELLOW}⚠${NC} Let's Encrypt not installed"
        HEALTH_STATUS["ssl_provider"]="none"
    fi
    
    # Check for self-signed certificates
    if [ -f "/etc/nginx/ssl/cert.pem" ] || [ -f "/etc/ssl/certs/profolio.pem" ]; then
        echo -e "  ${YELLOW}⚠${NC} Self-signed certificate detected"
        HEALTH_STATUS["ssl_type"]="self_signed"
    fi
    
    # Test HTTPS if available
    if [ "${HEALTH_STATUS[port_443]}" = "open" ]; then
        if curl -k -s -o /dev/null -w "%{http_code}" "https://localhost" 2>/dev/null | grep -q "200\|301\|302"; then
            echo -e "  ${GREEN}✓${NC} HTTPS: Working"
            HEALTH_STATUS["https_working"]="yes"
        else
            echo -e "  ${YELLOW}⚠${NC} HTTPS: Not working properly"
            HEALTH_STATUS["https_working"]="no"
        fi
    fi
    
    return 0
}

# Check system resources
check_resources() {
    echo -e "${BLUE}Checking system resources...${NC}"
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "0")
    if [ "${cpu_usage%.*}" -lt 80 ]; then
        echo -e "  ${GREEN}✓${NC} CPU usage: ${cpu_usage}%"
    else
        echo -e "  ${YELLOW}⚠${NC} CPU usage: ${cpu_usage}% (high)"
    fi
    HEALTH_STATUS["cpu_usage"]="$cpu_usage"
    
    # Memory usage
    local mem_info=$(free -m 2>/dev/null | awk '/^Mem:/{printf "%.1f", $3/$2*100}')
    if [ "${mem_info%.*}" -lt 80 ]; then
        echo -e "  ${GREEN}✓${NC} Memory usage: ${mem_info}%"
    else
        echo -e "  ${YELLOW}⚠${NC} Memory usage: ${mem_info}% (high)"
    fi
    HEALTH_STATUS["mem_usage"]="$mem_info"
    
    # Disk usage
    local disk_usage=$(df -h "$PROFOLIO_PATH" 2>/dev/null | awk 'NR==2{print $5}' | tr -d '%')
    if [ "$disk_usage" -lt 80 ]; then
        echo -e "  ${GREEN}✓${NC} Disk usage: ${disk_usage}%"
    else
        echo -e "  ${YELLOW}⚠${NC} Disk usage: ${disk_usage}% (high)"
    fi
    HEALTH_STATUS["disk_usage"]="$disk_usage"
    
    # Check for swap
    local swap_total=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}')
    if [ "$swap_total" -gt 0 ]; then
        echo -e "  ${GREEN}✓${NC} Swap: ${swap_total}MB available"
        HEALTH_STATUS["swap"]="$swap_total"
    else
        echo -e "  ${YELLOW}⚠${NC} Swap: Not configured"
        HEALTH_STATUS["swap"]="0"
    fi
    
    return 0
}

# Run all health checks
check_all() {
    echo -e "${BLUE}==== Profolio Health Check ====${NC}"
    echo -e "Installation path: $PROFOLIO_PATH\n"
    
    HEALTH_ERRORS=0
    
    check_permissions
    echo
    check_database
    echo
    check_backend
    echo
    check_frontend
    echo
    check_nginx
    echo
    check_ssl
    echo
    check_resources
    echo
    
    # Summary
    echo -e "${BLUE}==== Health Check Summary ====${NC}"
    
    if [ $HEALTH_ERRORS -eq 0 ]; then
        echo -e "${GREEN}✓ All health checks passed!${NC}"
        echo "Profolio is running healthy."
        
        # Display access URL
        local ip=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -1)
        echo -e "\n${BLUE}Access Profolio:${NC}"
        
        if [ "${HEALTH_STATUS[nginx]}" = "running" ]; then
            if [ "${HEALTH_STATUS[https_working]}" = "yes" ]; then
                echo "  https://$ip"
            else
                echo "  http://$ip"
            fi
        else
            echo "  http://$ip:$FRONTEND_PORT"
        fi
        
        return 0
    else
        echo -e "${RED}✗ $HEALTH_ERRORS health check(s) failed${NC}"
        echo "Please review the issues above."
        return 1
    fi
}

# Generate health report
generate_report() {
    local output_file="${1:-/tmp/profolio-health-report.txt}"
    
    {
        echo "Profolio Health Check Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo
        
        check_all 2>&1 | sed 's/\x1b\[[0-9;]*m//g'  # Remove color codes
        
        echo
        echo "Health Status Details:"
        echo "=========================================="
        for key in "${!HEALTH_STATUS[@]}"; do
            printf "%-20s: %s\n" "$key" "${HEALTH_STATUS[$key]}"
        done
    } > "$output_file"
    
    echo -e "${GREEN}✓${NC} Health report generated: $output_file"
}

# Restart unhealthy services
restart_services() {
    echo -e "${BLUE}Attempting to restart unhealthy services...${NC}"
    
    local services=("profolio-backend" "profolio-frontend" "postgresql" "nginx")
    
    for service in "${services[@]}"; do
        if [ "${HEALTH_STATUS[$service]}" = "stopped" ] || [ "${HEALTH_STATUS[$service]}" = "failed" ]; then
            echo -e "  Restarting $service..."
            if systemctl restart "$service" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} $service restarted"
                sleep 2
            else
                echo -e "  ${RED}✗${NC} Failed to restart $service"
            fi
        fi
    done
    
    # Re-run health checks
    echo -e "\nRe-running health checks..."
    check_all
}

# Interactive health check menu
health_menu() {
    while true; do
        echo -e "\n${BLUE}=== Profolio Health Monitor ===${NC}"
        echo "1) Run all health checks"
        echo "2) Check database"
        echo "3) Check backend"
        echo "4) Check frontend"
        echo "5) Check nginx"
        echo "6) Check SSL"
        echo "7) Check resources"
        echo "8) Restart unhealthy services"
        echo "9) Generate report"
        echo "10) Exit"
        
        read -p "Select option [1-10]: " choice
        
        case $choice in
            1) check_all ;;
            2) check_database ;;
            3) check_backend ;;
            4) check_frontend ;;
            5) check_nginx ;;
            6) check_ssl ;;
            7) check_resources ;;
            8) restart_services ;;
            9)
                read -p "Enter report file path [/tmp/profolio-health-report.txt]: " output
                generate_report "${output:-/tmp/profolio-health-report.txt}"
                ;;
            10)
                echo "Exiting health monitor"
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
            check_all
            ;;
        database|db)
            check_database
            ;;
        backend)
            check_backend
            ;;
        frontend)
            check_frontend
            ;;
        nginx)
            check_nginx
            ;;
        ssl)
            check_ssl
            ;;
        permissions|perms)
            check_permissions
            ;;
        resources)
            check_resources
            ;;
        restart)
            restart_services
            ;;
        report)
            generate_report "$2"
            ;;
        menu)
            health_menu
            ;;
        *)
            echo "Usage: $0 {all|database|backend|frontend|nginx|ssl|permissions|resources|restart|report|menu} [args]"
            exit 1
            ;;
    esac
fi