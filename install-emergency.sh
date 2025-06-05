#!/bin/bash

# ===============================================
# PROFOLIO - EMERGENCY INSTALLER SCRIPT
# ===============================================
# Simple, working installer that actually installs Profolio
# Fixes the modular installer system that was missing application installation

set -euo pipefail

# Color definitions
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Configuration
readonly PROFOLIO_DIR="/opt/profolio"
readonly PROFOLIO_USER="profolio"
readonly REPO_URL="https://github.com/Obednal97/profolio.git"
readonly LOG_FILE="/tmp/profolio-emergency-install.log"

# ===============================================
# UTILITY FUNCTIONS
# ===============================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# ===============================================
# MAIN INSTALLATION FUNCTION
# ===============================================

main() {
    echo "==============================================="
    echo "🚨 PROFOLIO - EMERGENCY INSTALLER"
    echo "==============================================="
    echo "🔧 This installer actually installs Profolio!"
    echo "⚠️  Fixes the modular installer that was missing application installation"
    echo ""
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
    
    log "Starting emergency Profolio installation..."
    
    # Fix package dependencies first
    fix_package_dependencies
    
    # Install system dependencies
    install_system_dependencies
    
    # Create profolio user
    setup_profolio_user
    
    # Configure PostgreSQL
    setup_postgresql
    
    # Install Node.js LTS
    install_nodejs
    
    # Clone and install Profolio application
    install_profolio_application
    
    # Configure services
    setup_services
    
    # Start services
    start_services
    
    # Show completion message
    show_completion_message
}

# Fix package dependency issues
fix_package_dependencies() {
    log "Fixing package dependencies..."
    
    # Fix broken packages first
    apt --fix-broken install -y || true
    
    # Update package lists
    apt update
    
    success "Package dependencies fixed"
}

# Install system dependencies
install_system_dependencies() {
    log "Installing system dependencies..."
    
    # Essential packages
    DEBIAN_FRONTEND=noninteractive apt install -y \
        curl \
        wget \
        git \
        build-essential \
        postgresql \
        postgresql-contrib \
        nginx \
        openssl \
        sudo \
        ufw
    
    success "System dependencies installed"
}

# Setup profolio user
setup_profolio_user() {
    log "Setting up profolio user..."
    
    # Create user if doesn't exist
    if ! id "$PROFOLIO_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$PROFOLIO_USER"
        usermod -aG sudo "$PROFOLIO_USER"
        success "User $PROFOLIO_USER created"
    else
        info "User $PROFOLIO_USER already exists"
    fi
}

# Setup PostgreSQL
setup_postgresql() {
    log "Setting up PostgreSQL..."
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    local db_password=$(openssl rand -base64 32)
    
    sudo -u postgres psql <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'profolio') THEN
        CREATE USER profolio WITH ENCRYPTED PASSWORD '$db_password';
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'profolio') THEN
        CREATE DATABASE profolio OWNER profolio;
    END IF;
    
    GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
END
\$\$;
EOF
    
    # Save database URL
    echo "DATABASE_URL=\"postgresql://profolio:$db_password@localhost:5432/profolio\"" > /tmp/profolio-db.env
    
    success "PostgreSQL configured"
}

# Install Node.js LTS
install_nodejs() {
    log "Installing Node.js LTS..."
    
    # Install Node.js 20 LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Install pnpm
    npm install -g pnpm@9.14.4
    
    success "Node.js and pnpm installed"
}

# Install Profolio application
install_profolio_application() {
    log "Installing Profolio application..."
    
    # Remove existing directory if it exists
    rm -rf "$PROFOLIO_DIR"
    
    # Clone repository
    git clone "$REPO_URL" "$PROFOLIO_DIR"
    cd "$PROFOLIO_DIR"
    
    # Set ownership
    chown -R "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR"
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd "$PROFOLIO_DIR/backend"
    sudo -u "$PROFOLIO_USER" pnpm install
    
    # Generate Prisma client
    sudo -u "$PROFOLIO_USER" pnpm prisma generate
    
    # Install frontend dependencies
    log "Installing frontend dependencies..."
    cd "$PROFOLIO_DIR/frontend"
    sudo -u "$PROFOLIO_USER" pnpm install
    
    # Create environment files
    setup_environment_files
    
    # Build applications
    build_applications
    
    success "Profolio application installed"
}

# Setup environment files
setup_environment_files() {
    log "Creating environment files..."
    
    local db_url=$(cat /tmp/profolio-db.env | cut -d'"' -f2)
    local jwt_secret=$(openssl rand -base64 64)
    local encryption_key=$(openssl rand -base64 32)
    
    # Backend environment
    cat > "$PROFOLIO_DIR/backend/.env" <<EOF
NODE_ENV=production
PORT=3001
$db_url
JWT_SECRET="$jwt_secret"
API_ENCRYPTION_KEY="$encryption_key"
CORS_ORIGIN="http://localhost:3000"
EOF
    
    # Frontend environment
    cat > "$PROFOLIO_DIR/frontend/.env.production" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_MODE=local
NODE_ENV=production
EOF
    
    # Set permissions
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/backend/.env"
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/frontend/.env.production"
    chmod 600 "$PROFOLIO_DIR/backend/.env"
    chmod 600 "$PROFOLIO_DIR/frontend/.env.production"
    
    success "Environment files created"
}

# Build applications
build_applications() {
    log "Building applications..."
    
    # Build backend
    cd "$PROFOLIO_DIR/backend"
    sudo -u "$PROFOLIO_USER" pnpm run build
    
    # Run database migrations
    sudo -u "$PROFOLIO_USER" pnpm prisma db push
    
    # Build frontend
    cd "$PROFOLIO_DIR/frontend"
    sudo -u "$PROFOLIO_USER" pnpm run build
    
    success "Applications built successfully"
}

# Setup systemd services
setup_services() {
    log "Setting up systemd services..."
    
    # Backend service
    cat > /etc/systemd/system/profolio-backend.service <<EOF
[Unit]
Description=Profolio Backend
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/backend
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$PROFOLIO_DIR/backend/.env

[Install]
WantedBy=multi-user.target
EOF
    
    # Frontend service
    cat > /etc/systemd/system/profolio-frontend.service <<EOF
[Unit]
Description=Profolio Frontend
After=network.target profolio-backend.service
Wants=profolio-backend.service

[Service]
Type=simple
User=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/frontend
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$PROFOLIO_DIR/frontend/.env.production

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable services
    systemctl enable profolio-backend
    systemctl enable profolio-frontend
    
    success "Systemd services configured"
}

# Start services
start_services() {
    log "Starting Profolio services..."
    
    # Start backend
    systemctl start profolio-backend
    sleep 5
    
    # Start frontend
    systemctl start profolio-frontend
    sleep 5
    
    # Check status
    if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
        success "Profolio services started successfully"
    else
        error "Failed to start some services"
        info "Backend status: $(systemctl is-active profolio-backend)"
        info "Frontend status: $(systemctl is-active profolio-frontend)"
        
        # Show logs for debugging
        echo ""
        echo "Backend logs:"
        journalctl -u profolio-backend --no-pager -n 10
        echo ""
        echo "Frontend logs:"
        journalctl -u profolio-frontend --no-pager -n 10
        return 1
    fi
}

# Show completion message
show_completion_message() {
    local server_ip=$(hostname -I | awk '{print $1}')
    
    success "✅ Profolio installation completed successfully!"
    echo ""
    echo "==============================================="
    echo "🎉 Installation Complete!"
    echo "==============================================="
    echo ""
    echo "📍 Your Profolio instance is ready at:"
    echo "   Frontend: http://${server_ip}:3000"
    echo "   Backend:  http://${server_ip}:3001"
    echo ""
    echo "🔧 Service Management:"
    echo "   Status: systemctl status profolio-backend profolio-frontend"
    echo "   Logs:   journalctl -u profolio-backend -u profolio-frontend -f"
    echo "   Restart: systemctl restart profolio-backend profolio-frontend"
    echo ""
    echo "📂 Installation Directory: $PROFOLIO_DIR"
    echo "👤 User: $PROFOLIO_USER"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Visit http://${server_ip}:3000 to access Profolio"
    echo "   2. Create your first user account"
    echo "   3. Configure SSL/HTTPS for production use"
    echo ""
    echo "📚 Documentation: https://github.com/Obednal97/profolio"
    echo "🛡️ Support: https://github.com/Obednal97/profolio/discussions"
    echo ""
}

# ===============================================
# SCRIPT EXECUTION
# ===============================================

# Handle script termination
trap 'error "Installation interrupted"; exit 130' INT TERM

# Execute main function
main "$@" 