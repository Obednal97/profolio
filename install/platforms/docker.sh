#!/bin/bash

# =============================================================================
# PROFOLIO INSTALLER - DOCKER PLATFORM MODULE v1.0.0
# =============================================================================
# 
# Docker platform-specific functionality for containerized installations
# Provides: Container environment detection, volume management, networking
#
# Compatible: Docker containers on any Linux distribution
# Dependencies: utils/logging.sh, utils/ui.sh, utils/platform-detection.sh
# =============================================================================

# Module info function
docker_platform_info() {
    echo "Docker Platform Module v1.0.0"
    echo "  • Docker container environment support"
    echo "  • Volume mount detection and management"
    echo "  • Container networking configuration"
    echo "  • Optimized installation for containers"
    echo "  • Container-specific service management"
}

# Check if this module is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    # Being sourced
    if [ -n "${INSTALLER_DEBUG:-}" ]; then
        echo "[DEBUG] Docker platform module loaded"
    fi
else
    # Being executed directly
    echo "Docker Platform Module v1.0.0"
    echo "This module should be sourced, not executed directly."
    echo "Usage: source install/platforms/docker.sh"
    exit 1
fi

# Docker container configuration
DOCKER_VOLUMES_DETECTED=""
DOCKER_NETWORK_MODE=""
DOCKER_CONTAINER_ID=""
DOCKER_HOST_PORTS=""

# Detect if we're running inside a Docker container
is_docker_container() {
    if [ -f "/.dockerenv" ]; then
        return 0  # Inside Docker container
    elif [ -f "/proc/1/cgroup" ] && grep -q docker /proc/1/cgroup 2>/dev/null; then
        return 0  # Inside Docker container (alternative detection)
    else
        return 1  # Not in Docker container
    fi
}

# Get Docker container information
get_docker_container_info() {
    if ! is_docker_container; then
        echo "Not running in Docker container"
        return 1
    fi
    
    echo "Docker Container Environment Detected:"
    
    # Get container ID if available
    if [ -f "/proc/self/cgroup" ]; then
        DOCKER_CONTAINER_ID=$(cat /proc/self/cgroup | grep docker | sed 's/.*\///' | head -1 | cut -c1-12)
        if [ -n "$DOCKER_CONTAINER_ID" ]; then
            echo "  Container ID: $DOCKER_CONTAINER_ID"
        fi
    fi
    
    # Check for volume mounts
    check_docker_volumes
    
    # Check network configuration
    check_docker_networking
    
    return 0
}

# Check for Docker volume mounts
check_docker_volumes() {
    info "Checking Docker volume mounts..."
    
    local volumes_found=()
    
    # Common volume mount points for Profolio
    local volume_paths=(
        "/var/lib/postgresql/data"
        "/home/profolio"
        "/app/data"
        "/data"
        "/config"
        "/logs"
    )
    
    for path in "${volume_paths[@]}"; do
        if mountpoint -q "$path" 2>/dev/null; then
            volumes_found+=("$path")
            success "Volume mount detected: $path"
        fi
    done
    
    if [ ${#volumes_found[@]} -gt 0 ]; then
        DOCKER_VOLUMES_DETECTED="${volumes_found[*]}"
        success "Found ${#volumes_found[@]} volume mount(s)"
    else
        warn "No volume mounts detected - data may not persist"
        echo "Consider using Docker volumes for:"
        echo "  • Database data: -v profolio-db:/var/lib/postgresql/data"
        echo "  • Application data: -v profolio-app:/home/profolio"
        echo "  • Configuration: -v profolio-config:/config"
    fi
    
    return 0
}

# Check Docker networking configuration
check_docker_networking() {
    info "Checking Docker networking..."
    
    # Get network interfaces
    local interfaces
    interfaces=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo)
    
    # Check for common Docker network interfaces
    if echo "$interfaces" | grep -q "eth0"; then
        DOCKER_NETWORK_MODE="bridge"
        success "Bridge networking detected"
    elif echo "$interfaces" | grep -q "host"; then
        DOCKER_NETWORK_MODE="host"
        success "Host networking detected"
    else
        DOCKER_NETWORK_MODE="unknown"
        warn "Unknown network configuration"
    fi
    
    # Check exposed ports (if container metadata is available)
    if command -v docker >/dev/null 2>&1 && [ -n "$DOCKER_CONTAINER_ID" ]; then
        local exposed_ports
        exposed_ports=$(docker inspect "$DOCKER_CONTAINER_ID" 2>/dev/null | grep -o '"ExposedPorts":[^}]*}' | grep -o '[0-9]*/' | cut -d'/' -f1 | tr '\n' ' ')
        if [ -n "$exposed_ports" ]; then
            DOCKER_HOST_PORTS="$exposed_ports"
            info "Exposed ports: $exposed_ports"
        fi
    fi
    
    return 0
}

# Configure services for Docker environment
configure_docker_services() {
    info "Configuring services for Docker environment..."
    
    # In Docker containers, we typically don't use systemd
    # Check if systemd is available
    if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
        info "systemd detected in container - using standard service management"
        return 0
    else
        info "No systemd detected - using alternative service management"
        
        # Create simple service management scripts
        create_docker_service_scripts
        return 0
    fi
}

# Create Docker-specific service management scripts
create_docker_service_scripts() {
    info "Creating Docker service management scripts..."
    
    local service_dir="/usr/local/bin"
    
    # PostgreSQL service script
    cat > "$service_dir/profolio-postgres" << 'EOF'
#!/bin/bash
# PostgreSQL service management for Docker

case "$1" in
    start)
        if ! pgrep -x postgres >/dev/null; then
            sudo -u postgres /usr/lib/postgresql/*/bin/postgres -D /var/lib/postgresql/data &
            echo "PostgreSQL started"
        else
            echo "PostgreSQL already running"
        fi
        ;;
    stop)
        pkill -x postgres
        echo "PostgreSQL stopped"
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        if pgrep -x postgres >/dev/null; then
            echo "PostgreSQL is running"
        else
            echo "PostgreSQL is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF
    
    # Profolio service script
    cat > "$service_dir/profolio-app" << 'EOF'
#!/bin/bash
# Profolio application service management for Docker

PROFOLIO_DIR="/home/profolio/profolio"
PROFOLIO_USER="profolio"

case "$1" in
    start)
        if ! pgrep -f "node.*profolio" >/dev/null; then
            cd "$PROFOLIO_DIR"
            sudo -u "$PROFOLIO_USER" npm start &
            echo "Profolio started"
        else
            echo "Profolio already running"
        fi
        ;;
    stop)
        pkill -f "node.*profolio"
        echo "Profolio stopped"
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        if pgrep -f "node.*profolio" >/dev/null; then
            echo "Profolio is running"
        else
            echo "Profolio is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
EOF
    
    # Make scripts executable
    chmod +x "$service_dir/profolio-postgres"
    chmod +x "$service_dir/profolio-app"
    
    success "Docker service scripts created"
    return 0
}

# Optimize installation for Docker environment
optimize_docker_installation() {
    info "Optimizing installation for Docker environment..."
    
    # Skip unnecessary services in containers
    local services_to_skip=(
        "ssh"
        "ufw"
        "fail2ban"
        "cron"
        "rsyslog"
    )
    
    for service in "${services_to_skip[@]}"; do
        if command -v systemctl >/dev/null 2>&1; then
            systemctl disable "$service" 2>/dev/null || true
            systemctl stop "$service" 2>/dev/null || true
        fi
    done
    
    # Optimize for container startup
    echo "#!/bin/bash" > /usr/local/bin/profolio-container-init
    echo "# Profolio container initialization script" >> /usr/local/bin/profolio-container-init
    echo "" >> /usr/local/bin/profolio-container-init
    echo "# Start PostgreSQL" >> /usr/local/bin/profolio-container-init
    echo "profolio-postgres start" >> /usr/local/bin/profolio-container-init
    echo "" >> /usr/local/bin/profolio-container-init
    echo "# Wait for PostgreSQL to be ready" >> /usr/local/bin/profolio-container-init
    echo "sleep 5" >> /usr/local/bin/profolio-container-init
    echo "" >> /usr/local/bin/profolio-container-init
    echo "# Start Profolio" >> /usr/local/bin/profolio-container-init
    echo "profolio-app start" >> /usr/local/bin/profolio-container-init
    
    chmod +x /usr/local/bin/profolio-container-init
    
    success "Docker optimization completed"
    return 0
}

# Configure Docker-specific environment variables
setup_docker_environment() {
    info "Setting up Docker environment variables..."
    
    # Container-specific environment
    export PROFOLIO_CONTAINER_MODE="true"
    export PROFOLIO_DOCKER_ENV="true"
    
    # Database configuration for containers
    export PROFOLIO_DB_HOST="${PROFOLIO_DB_HOST:-localhost}"
    export PROFOLIO_DB_PORT="${PROFOLIO_DB_PORT:-5432}"
    
    # Application configuration
    export PROFOLIO_PORT="${PROFOLIO_PORT:-3000}"
    export NODE_ENV="${NODE_ENV:-production}"
    
    # Create environment file
    cat > /etc/profolio-docker.env << EOF
# Profolio Docker Environment Configuration
PROFOLIO_CONTAINER_MODE=true
PROFOLIO_DOCKER_ENV=true
PROFOLIO_DB_HOST=${PROFOLIO_DB_HOST:-localhost}
PROFOLIO_DB_PORT=${PROFOLIO_DB_PORT:-5432}
PROFOLIO_PORT=${PROFOLIO_PORT:-3000}
NODE_ENV=${NODE_ENV:-production}

# Volume mount status
DOCKER_VOLUMES_DETECTED="$DOCKER_VOLUMES_DETECTED"
DOCKER_NETWORK_MODE="$DOCKER_NETWORK_MODE"
EOF
    
    success "Docker environment configured"
    return 0
}

# Check Docker container requirements
check_docker_requirements() {
    info "Checking Docker container requirements..."
    
    local requirements_met=true
    
    # Check if running in container
    if ! is_docker_container; then
        error "Not running in Docker container"
        return 1
    fi
    
    # Check available memory in container
    if [ -f "/sys/fs/cgroup/memory/memory.limit_in_bytes" ]; then
        local memory_limit
        memory_limit=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
        local memory_gb=$((memory_limit / 1024 / 1024 / 1024))
        
        if [ "$memory_gb" -ge 2 ]; then
            success "Container memory limit: ${memory_gb}GB"
        else
            warn "Low container memory limit: ${memory_gb}GB (recommended: 2GB+)"
            requirements_met=false
        fi
    fi
    
    # Check for data persistence
    if [ -z "$DOCKER_VOLUMES_DETECTED" ]; then
        warn "No persistent volumes detected"
        echo "Data may be lost when container is removed"
        echo "Recommend using Docker volumes for data persistence"
        requirements_met=false
    fi
    
    if [ "$requirements_met" = true ]; then
        success "Docker container requirements met"
        return 0
    else
        warn "Some Docker requirements not optimal"
        return 1
    fi
}

# Main Docker platform handler
handle_docker_platform() {
    if ! is_docker_container; then
        # Not a Docker environment
        return 1  # Let other platform handlers take over
    fi
    
    info "Docker container environment detected"
    
    # Get container information
    get_docker_container_info
    
    # Check requirements
    check_docker_requirements
    
    # Setup Docker-specific environment
    setup_docker_environment
    
    # Configure services for Docker
    configure_docker_services
    
    # Optimize for container environment
    optimize_docker_installation
    
    success "Docker platform setup completed"
    
    # Continue with normal installation in container
    return 0
}

# Get Docker-specific installation recommendations
get_docker_recommendations() {
    echo "Docker Container Recommendations:"
    echo "  • Use persistent volumes for data storage"
    echo "  • Configure proper memory limits (2GB+ recommended)"
    echo "  • Expose necessary ports (3000 for Profolio)"
    echo "  • Use proper networking configuration"
    echo "  • Consider using docker-compose for multi-container setup"
    echo "  • Implement health checks for container monitoring"
    echo ""
    echo "Example Docker run command:"
    echo "docker run -d \\"
    echo "  --name profolio \\"
    echo "  -p 3000:3000 \\"
    echo "  -v profolio-data:/home/profolio \\"
    echo "  -v profolio-db:/var/lib/postgresql/data \\"
    echo "  --memory=2g \\"
    echo "  profolio:latest"
}

# Create Docker Compose template
create_docker_compose_template() {
    local compose_file="/tmp/docker-compose.profolio.yml"
    
    cat > "$compose_file" << 'EOF'
version: '3.8'

services:
  profolio:
    image: profolio:latest
    container_name: profolio-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - profolio-app-data:/home/profolio
      - profolio-config:/config
    environment:
      - NODE_ENV=production
      - PROFOLIO_DB_HOST=postgres
      - PROFOLIO_DB_PORT=5432
      - PROFOLIO_DB_NAME=profolio
      - PROFOLIO_DB_USER=profolio
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    container_name: profolio-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=profolio
      - POSTGRES_USER=profolio
      - POSTGRES_PASSWORD=your_secure_password_here
    volumes:
      - profolio-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U profolio"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  profolio-app-data:
  profolio-db-data:
  profolio-config:

networks:
  default:
    name: profolio-network
EOF
    
    echo "Docker Compose template created: $compose_file"
    echo "Customize the template and use: docker-compose -f $compose_file up -d"
}

# Backward compatibility functions
handle_docker_installation() {
    handle_docker_platform "$@"
}

setup_docker_environment_compat() {
    setup_docker_environment "$@"
}

# Module metadata
DOCKER_PLATFORM_VERSION="1.0.0"
DOCKER_PLATFORM_DEPENDENCIES="utils/logging.sh utils/ui.sh utils/platform-detection.sh" 