#!/bin/bash

# =============================================================================
# PROFOLIO APPLICATION INSTALLER
# =============================================================================
# Core application installer - platform independent
# Handles Node.js, PostgreSQL, repository cloning, building, and service setup
# =============================================================================

# Configuration
readonly PROFOLIO_USER="${PROFOLIO_USER:-profolio}"
readonly PROFOLIO_DIR="${PROFOLIO_DIR:-/opt/profolio}"
readonly REPO_BRANCH="${REPO_BRANCH:-main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'

# Logging functions
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${GRAY}[DEBUG]${NC} $1"
    fi
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Fix package dependencies
fix_package_dependencies() {
    info "Fixing package dependencies..."
    
    # Try to fix broken packages
    if dpkg --configure -a 2>/dev/null; then
        success "Package configuration completed"
    else
        warn "Some packages could not be configured"
    fi
    
    # Fix broken dependencies
    if apt-get --fix-broken install -y 2>/dev/null; then
        success "Broken dependencies fixed"
    else
        warn "Some dependencies could not be fixed automatically"
    fi
    
    # Clean package cache
    apt-get clean
    apt-get autoclean
    
    # Update package lists again
    if apt-get update 2>/dev/null; then
        success "Package lists updated after dependency fixes"
    else
        warn "Package list update failed after dependency fixes"
    fi
    
    return 0
}

# Verify prerequisites are met
verify_prerequisites() {
    info "Verifying installation prerequisites..."
    
    local missing_deps=()
    
    # Check for required commands
    local required_commands=(
        "git"
        "node"
        "npm"
        "psql"
        "systemctl"
    )
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_deps+=("$cmd")
        fi
    done
    
    # Check for required user
    if ! id "$PROFOLIO_USER" &>/dev/null; then
        missing_deps+=("user:$PROFOLIO_USER")
    fi
    
    # Check for PostgreSQL service
    if ! systemctl is-enabled postgresql >/dev/null 2>&1; then
        missing_deps+=("postgresql-service")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        error "Missing prerequisites: ${missing_deps[*]}"
        error "Please run platform setup before application installation"
        return 1
    fi
    
    success "All prerequisites verified"
    return 0
}

# Install Node.js LTS and pnpm
install_nodejs_stack() {
    info "Installing Node.js LTS and pnpm..."
    
    # Check if Node.js 20 is already installed
    if command -v node >/dev/null 2>&1; then
        local node_version
        node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            info "Node.js $node_version already installed"
        else
            warn "Node.js version too old: $node_version. Installing LTS..."
            install_node_lts
        fi
    else
        install_node_lts
    fi
    
    # Install pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        info "Installing pnpm package manager..."
        npm install -g pnpm@9.14.4
        success "pnpm installed"
    else
        info "pnpm already installed: $(pnpm --version)"
    fi
    
    return 0
}

# Install Node.js LTS
install_node_lts() {
    info "Installing Node.js 20 LTS..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    
    # Install Node.js
    apt-get install -y nodejs
    
    success "Node.js $(node --version) installed"
}

# Setup PostgreSQL database for Profolio
setup_profolio_database() {
    info "Setting up Profolio database..."
    
    # Generate secure password
    local db_password
    db_password=$(openssl rand -base64 32)
    
    # Create database and user if they don't exist
    sudo -u postgres psql <<EOF
DO \$\$
BEGIN
    -- Create user if not exists
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'profolio') THEN
        CREATE USER profolio WITH ENCRYPTED PASSWORD '$db_password';
        RAISE NOTICE 'User profolio created';
    ELSE
        -- Update password for existing user
        ALTER USER profolio WITH ENCRYPTED PASSWORD '$db_password';
        RAISE NOTICE 'User profolio already exists - password updated';
    END IF;
    
    -- Create database if not exists
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'profolio') THEN
        CREATE DATABASE profolio OWNER profolio;
        RAISE NOTICE 'Database profolio created';
    ELSE
        RAISE NOTICE 'Database profolio already exists';
    END IF;
    
    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
    
END
\$\$;
EOF
    
    if [ $? -eq 0 ]; then
        success "PostgreSQL database configured"
        
        # URL encode the password to handle special characters
        # Use a robust bash-native approach that doesn't require Perl
        local encoded_password=""
        local char
        for (( i=0; i<${#db_password}; i++ )); do
            char="${db_password:$i:1}"
            case "$char" in
                [a-zA-Z0-9._~-]) 
                    encoded_password+="$char" ;;
                ' ') 
                    encoded_password+="%20" ;;
                '!') 
                    encoded_password+="%21" ;;
                '"') 
                    encoded_password+="%22" ;;
                '#') 
                    encoded_password+="%23" ;;
                '$') 
                    encoded_password+="%24" ;;
                '%') 
                    encoded_password+="%25" ;;
                '&') 
                    encoded_password+="%26" ;;
                "'") 
                    encoded_password+="%27" ;;
                '(') 
                    encoded_password+="%28" ;;
                ')') 
                    encoded_password+="%29" ;;
                '*') 
                    encoded_password+="%2A" ;;
                '+') 
                    encoded_password+="%2B" ;;
                ',') 
                    encoded_password+="%2C" ;;
                '/') 
                    encoded_password+="%2F" ;;
                ':') 
                    encoded_password+="%3A" ;;
                ';') 
                    encoded_password+="%3B" ;;
                '<') 
                    encoded_password+="%3C" ;;
                '=') 
                    encoded_password+="%3D" ;;
                '>') 
                    encoded_password+="%3E" ;;
                '?') 
                    encoded_password+="%3F" ;;
                '@') 
                    encoded_password+="%40" ;;
                '[') 
                    encoded_password+="%5B" ;;
                '\') 
                    encoded_password+="%5C" ;;
                ']') 
                    encoded_password+="%5D" ;;
                '^') 
                    encoded_password+="%5E" ;;
                '`') 
                    encoded_password+="%60" ;;
                '{') 
                    encoded_password+="%7B" ;;
                '|') 
                    encoded_password+="%7C" ;;
                '}') 
                    encoded_password+="%7D" ;;
                '~') 
                    encoded_password+="%7E" ;;
                *) 
                    # For any other character, use printf to get hex value
                    encoded_password+=$(printf "%%%02X" "'$char")
                    ;;
            esac
        done
        
        # Save database URL for application
        export PROFOLIO_DB_URL="postgresql://profolio:${encoded_password}@localhost:5432/profolio"
        echo "DATABASE_URL=\"$PROFOLIO_DB_URL\"" > /tmp/profolio-db.env
        
        return 0
    else
        error "Failed to configure PostgreSQL database"
        return 1
    fi
}

# Clone Profolio repository
clone_profolio_repository() {
    info "Cloning Profolio repository..."
    
    # Remove existing directory if it exists
    if [ -d "$PROFOLIO_DIR" ]; then
        warn "Existing installation found at $PROFOLIO_DIR"
        read -p "Remove existing installation? (y/n) [y]: " remove_existing
        if [[ "$remove_existing" =~ ^[Yy]?$ ]]; then
            rm -rf "$PROFOLIO_DIR"
            info "Existing installation removed"
        else
            error "Installation cancelled - existing directory not removed"
            return 1
        fi
    fi
    
    # Clone repository
    if git clone --depth=1 --single-branch --branch "$REPO_BRANCH" "${REPO_CLONE_URL:-https://github.com/Obednal97/profolio.git}" "$PROFOLIO_DIR"; then
        success "Repository cloned successfully"
    else
        error "Failed to clone repository"
        return 1
    fi
    
    # Set ownership
    chown -R "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR"
    
    return 0
}

# Install application dependencies
install_application_dependencies() {
    info "Installing application dependencies..."
    
    # Backend dependencies
    info "Installing backend dependencies..."
    cd "$PROFOLIO_DIR/backend" || return 1
    
    if sudo -u "$PROFOLIO_USER" pnpm install; then
        success "Backend dependencies installed"
    else
        error "Failed to install backend dependencies"
        return 1
    fi
    
    # Generate Prisma client
    info "Generating Prisma client..."
    if sudo -u "$PROFOLIO_USER" pnpm prisma generate; then
        success "Prisma client generated"
    else
        error "Failed to generate Prisma client"
        return 1
    fi
    
    # Frontend dependencies
    info "Installing frontend dependencies..."
    cd "$PROFOLIO_DIR/frontend" || return 1
    
    if sudo -u "$PROFOLIO_USER" pnpm install; then
        success "Frontend dependencies installed"
    else
        error "Failed to install frontend dependencies"
        return 1
    fi
    
    return 0
}

# Create environment configuration files
create_environment_files() {
    info "Creating environment configuration files..."
    
    # Load database URL
    local db_url
    if [ -f "/tmp/profolio-db.env" ]; then
        db_url=$(grep "DATABASE_URL" /tmp/profolio-db.env | cut -d'"' -f2)
    else
        error "Database configuration not found"
        return 1
    fi
    
    # Generate secrets
    local jwt_secret
    local encryption_key
    jwt_secret=$(openssl rand -base64 64)
    encryption_key=$(openssl rand -base64 32)
    
    # Backend environment file
    cat > "$PROFOLIO_DIR/backend/.env" <<EOF
NODE_ENV=production
PORT=3001
DATABASE_URL="$db_url"
JWT_SECRET="$jwt_secret"
API_ENCRYPTION_KEY="$encryption_key"
CORS_ORIGIN="http://localhost:3000"
LOG_LEVEL=info
SESSION_TIMEOUT=86400
API_RATE_LIMIT=100
EOF
    
    # Frontend environment file
    cat > "$PROFOLIO_DIR/frontend/.env.production" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_MODE=local
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
    
    # Set proper permissions
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/backend/.env"
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/frontend/.env.production"
    chmod 600 "$PROFOLIO_DIR/backend/.env"
    chmod 600 "$PROFOLIO_DIR/frontend/.env.production"
    
    success "Environment files created"
    return 0
}

# Build applications
build_applications() {
    info "Building Profolio applications..."
    
    # Build backend
    info "Building backend application..."
    cd "$PROFOLIO_DIR/backend" || return 1
    
    if sudo -u "$PROFOLIO_USER" pnpm run build; then
        success "Backend built successfully"
    else
        error "Failed to build backend"
        return 1
    fi
    
    # Run database migrations
    info "Running database migrations..."
    if sudo -u "$PROFOLIO_USER" pnpm prisma db push; then
        success "Database migrations completed"
    else
        error "Failed to run database migrations"
        return 1
    fi
    
    # Build frontend
    info "Building frontend application..."
    cd "$PROFOLIO_DIR/frontend" || return 1
    
    if sudo -u "$PROFOLIO_USER" pnpm run build; then
        success "Frontend built successfully"
    else
        error "Failed to build frontend"
        return 1
    fi
    
    return 0
}

# Create systemd services
create_systemd_services() {
    info "Creating systemd services..."
    
    # Backend service
    cat > /etc/systemd/system/profolio-backend.service <<EOF
[Unit]
Description=Profolio Backend API Server
Documentation=https://github.com/Obednal97/profolio
After=network.target postgresql.service
Wants=postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$PROFOLIO_USER
Group=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/backend
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
TimeoutStartSec=30
TimeoutStopSec=30

# Environment
Environment=NODE_ENV=production
EnvironmentFile=$PROFOLIO_DIR/backend/.env

# Security
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$PROFOLIO_DIR
PrivateTmp=yes

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio-backend

[Install]
WantedBy=multi-user.target
EOF
    
    # Frontend service
    cat > /etc/systemd/system/profolio-frontend.service <<EOF
[Unit]
Description=Profolio Frontend Web Server
Documentation=https://github.com/Obednal97/profolio
After=network.target profolio-backend.service
Wants=profolio-backend.service

[Service]
Type=simple
User=$PROFOLIO_USER
Group=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/frontend
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
TimeoutStartSec=30
TimeoutStopSec=30

# Environment
Environment=NODE_ENV=production
EnvironmentFile=$PROFOLIO_DIR/frontend/.env.production

# Security
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$PROFOLIO_DIR
PrivateTmp=yes

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=profolio-frontend

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable services
    systemctl daemon-reload
    
    if systemctl enable profolio-backend profolio-frontend; then
        success "Systemd services created and enabled"
    else
        error "Failed to enable systemd services"
        return 1
    fi
    
    return 0
}

# Start Profolio services
start_profolio_services() {
    info "Starting Profolio services..."
    
    # Start backend first
    info "Starting backend service..."
    if systemctl start profolio-backend; then
        success "Backend service started"
    else
        error "Failed to start backend service"
        show_service_logs "profolio-backend"
        return 1
    fi
    
    # Wait for backend to be ready
    info "Waiting for backend to be ready..."
    local max_wait=30
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            success "Backend is ready"
            break
        fi
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        warn "Backend health check timeout - continuing anyway"
    fi
    
    # Start frontend
    info "Starting frontend service..."
    if systemctl start profolio-frontend; then
        success "Frontend service started"
    else
        error "Failed to start frontend service"
        show_service_logs "profolio-frontend"
        return 1
    fi
    
    # Final verification
    sleep 5
    verify_installation
    
    return 0
}

# Show service logs for debugging
show_service_logs() {
    local service="$1"
    echo ""
    error "Service logs for $service:"
    journalctl -u "$service" --no-pager -n 20
    echo ""
}

# Verify installation success
verify_installation() {
    info "Verifying installation..."
    
    local backend_status
    local frontend_status
    
    backend_status=$(systemctl is-active profolio-backend)
    frontend_status=$(systemctl is-active profolio-frontend)
    
    if [ "$backend_status" = "active" ] && [ "$frontend_status" = "active" ]; then
        success "✅ All services are running"
        return 0
    else
        error "❌ Service verification failed"
        error "Backend: $backend_status"
        error "Frontend: $frontend_status"
        return 1
    fi
}

# Main installation function
install_profolio_application() {
    info "🚀 Starting Profolio application installation..."
    
    # Verify prerequisites
    if ! verify_prerequisites; then
        error "Prerequisites not met - cannot install application"
        return 1
    fi
    
    # Install Node.js stack
    if ! install_nodejs_stack; then
        error "Failed to install Node.js stack"
        return 1
    fi
    
    # Setup database
    if ! setup_profolio_database; then
        error "Failed to setup database"
        return 1
    fi
    
    # Clone repository
    if ! clone_profolio_repository; then
        error "Failed to clone repository"
        return 1
    fi
    
    # Install dependencies
    if ! install_application_dependencies; then
        error "Failed to install dependencies"
        return 1
    fi
    
    # Create environment files
    if ! create_environment_files; then
        error "Failed to create environment files"
        return 1
    fi
    
    # Build applications
    if ! build_applications; then
        error "Failed to build applications"
        return 1
    fi
    
    # Create services
    if ! create_systemd_services; then
        error "Failed to create systemd services"
        return 1
    fi
    
    # Start services
    if ! start_profolio_services; then
        error "Failed to start services"
        return 1
    fi
    
    success "🎉 Profolio application installation completed successfully!"
    
    # Show completion information
    show_installation_summary
    
    return 0
}

# Show installation summary
show_installation_summary() {
    local server_ip
    server_ip=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "==============================================="
    echo "🎉 Profolio Installation Complete!"
    echo "==============================================="
    echo ""
    echo "📍 Your Profolio instance is ready at:"
    echo "   🌐 Frontend: http://${server_ip}:3000"
    echo "   🔧 Backend:  http://${server_ip}:3001"
    echo ""
    echo "🔧 Service Management:"
    echo "   📊 Status:  systemctl status profolio-backend profolio-frontend"
    echo "   📋 Logs:    journalctl -u profolio-backend -u profolio-frontend -f"
    echo "   🔄 Restart: systemctl restart profolio-backend profolio-frontend"
    echo "   ⏹️  Stop:    systemctl stop profolio-backend profolio-frontend"
    echo ""
    echo "📂 Installation Details:"
    echo "   📁 Directory: $PROFOLIO_DIR"
    echo "   👤 User:      $PROFOLIO_USER"
    echo "   🗄️  Database:  postgresql://profolio@localhost:5432/profolio"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. 🌐 Visit http://${server_ip}:3000 to access Profolio"
    echo "   2. 👤 Create your first admin user account"
    echo "   3. 🔒 Configure SSL/HTTPS for production use"
    echo "   4. 📊 Set up regular database backups"
    echo ""
    echo "📚 Documentation: https://github.com/Obednal97/profolio"
    echo "🛡️ Support: https://github.com/Obednal97/profolio/discussions"
    echo ""
}

# Cleanup function for failed installations
cleanup_failed_installation() {
    warn "Cleaning up failed installation..."
    
    # Stop services if they're running
    systemctl stop profolio-backend profolio-frontend 2>/dev/null || true
    systemctl disable profolio-backend profolio-frontend 2>/dev/null || true
    
    # Remove service files
    rm -f /etc/systemd/system/profolio-backend.service
    rm -f /etc/systemd/system/profolio-frontend.service
    
    # Reload systemd
    systemctl daemon-reload
    
    # Clean up temporary files
    rm -f /tmp/profolio-db.env
    
    warn "Cleanup completed"
}

# Signal handlers for graceful cleanup
trap cleanup_failed_installation ERR
trap cleanup_failed_installation INT
trap cleanup_failed_installation TERM