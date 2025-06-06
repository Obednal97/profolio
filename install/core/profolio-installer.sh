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

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
        exit 1
    fi
}

# Install Node.js 20 via NodeSource
install_node() {
    info "Installing Node.js 20..."
    
    # Remove any existing Node.js installations
    apt remove -y nodejs npm || true
    apt autoremove -y
    
    # Install Node.js 20 from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Verify installation
    local node_version=$(node --version 2>/dev/null || echo "not_installed")
    local npm_version=$(npm --version 2>/dev/null || echo "not_installed")
    
    if [[ $node_version == v20* ]]; then
        success "Node.js installed: $node_version"
        success "npm installed: $npm_version"
    else
        error "Failed to install Node.js 20. Got: $node_version"
        return 1
    fi
}

# Install pnpm
install_pnpm() {
    info "Installing pnpm..."
    
    # Check if npm is available
    if ! command -v npm >/dev/null 2>&1; then
        error "npm not found - Node.js installation may have failed"
        return 1
    fi
    
    # Install pnpm globally with error handling
    if npm install -g pnpm@9.14.4; then
        # Verify installation
        local pnpm_version=$(pnpm --version 2>/dev/null || echo "not_installed")
        if [[ "$pnpm_version" != "not_installed" ]]; then
            success "pnpm installed: $pnpm_version"
        else
            # Try alternative installation method
            warning "pnpm installation failed, trying alternative method..."
            if curl -fsSL https://get.pnpm.io/install.sh | sh -; then
                export PATH="$HOME/.local/share/pnpm:$PATH"
                success "pnpm installed via alternative method"
            else
                error "Failed to install pnpm"
                return 1
            fi
        fi
    else
        error "Failed to install pnpm via npm"
        return 1
    fi
}

# Install and configure PostgreSQL
install_postgresql() {
    info "Installing PostgreSQL..."
    
    # Install PostgreSQL
    apt update
    apt install -y postgresql postgresql-contrib
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    success "PostgreSQL installed and started"
}

# Create PostgreSQL database and user
setup_database() {
    info "Setting up PostgreSQL database..."
    
    # Generate secure password for database user
    local db_password=$(openssl rand -base64 32)
    
    # Create database user and database
    sudo -u postgres psql << EOF
CREATE USER profolio WITH ENCRYPTED PASSWORD '$db_password';
CREATE DATABASE profolio OWNER profolio;
GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
\q
EOF
    
    success "Database created with user 'profolio'"
    echo "Database password: $db_password"
    
    # Store password for later use
    echo "$db_password" > /tmp/profolio_db_password
    chmod 600 /tmp/profolio_db_password
}

# Create profolio user
create_user() {
    info "Creating profolio user..."
    
    # Create user if it doesn't exist
    if ! id "$PROFOLIO_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$PROFOLIO_DIR" -m "$PROFOLIO_USER"
        success "User '$PROFOLIO_USER' created"
    else
        info "User '$PROFOLIO_USER' already exists"
    fi
}

# Clone repository
clone_repository() {
    info "Cloning Profolio repository..."
    
    # Create directory if it doesn't exist
    mkdir -p "$PROFOLIO_DIR"
    
    # Clone repository
    if [[ -d "$PROFOLIO_DIR/.git" ]]; then
        info "Repository already exists, updating..."
        cd "$PROFOLIO_DIR"
        sudo -u "$PROFOLIO_USER" git pull origin "$REPO_BRANCH"
    else
        # Clone repository as profolio user
        sudo -u "$PROFOLIO_USER" git clone -b "$REPO_BRANCH" https://github.com/Obednal97/profolio.git "$PROFOLIO_DIR"
    fi
    
    success "Repository cloned to $PROFOLIO_DIR"
}

# Configure environment variables
configure_environment() {
    info "Configuring environment variables..."
    
    # Get database password
    local db_password=$(cat /tmp/profolio_db_password)
    
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
            '=') 
                encoded_password+="%3D" ;;
            '?') 
                encoded_password+="%3F" ;;
            '@') 
                encoded_password+="%40" ;;
            '[') 
                encoded_password+="%5B" ;;
            ']') 
                encoded_password+="%5D" ;;
            *) 
                # Convert to hex for any other character
                encoded_password+=$(printf "%%%02X" "'$char")
                ;;
        esac
    done
    
    # Backend environment file
    cat > "$PROFOLIO_DIR/backend/.env" <<EOF
DATABASE_URL="postgresql://profolio:${encoded_password}@localhost:5432/profolio?schema=public"
JWT_SECRET="$(openssl rand -base64 64)"
PORT=3001
NODE_ENV=production
CORS_ORIGIN="http://localhost:3000"
EOF

    # Frontend environment file
    cat > "$PROFOLIO_DIR/frontend/.env.production" <<EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_MODE=local
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

    # Create minimal firebase-config.json to prevent 404 errors
    # This is needed for backward compatibility even when using local auth
    cat > "$PROFOLIO_DIR/frontend/public/firebase-config.json" <<EOF
{
  "apiKey": "",
  "authDomain": "",
  "projectId": "",
  "storageBucket": "",
  "messagingSenderId": "",
  "appId": "",
  "disabled": true,
  "note": "This is a placeholder config for self-hosted installations using local authentication"
}
EOF
    
    # Set proper permissions
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/backend/.env"
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/frontend/.env.production"
    chown "$PROFOLIO_USER:$PROFOLIO_USER" "$PROFOLIO_DIR/frontend/public/firebase-config.json"
    chmod 600 "$PROFOLIO_DIR/backend/.env"
    chmod 600 "$PROFOLIO_DIR/frontend/.env.production"
    chmod 644 "$PROFOLIO_DIR/frontend/public/firebase-config.json"
    
    success "Environment files created"
    
    # Clean up password file
    rm -f /tmp/profolio_db_password
}

# Install dependencies and build applications
build_applications() {
    info "Installing dependencies and building applications..."
    
    cd "$PROFOLIO_DIR"
    
    # Ensure pnpm is in PATH
    export PATH="$HOME/.local/share/pnpm:$PATH"
    
    # Check if pnpm is available
    if ! command -v pnpm >/dev/null 2>&1; then
        warning "pnpm not found in PATH, attempting to use npm instead..."
        # Fallback to npm if pnpm is not available
        local package_manager="npm"
    else
        local package_manager="pnpm"
        info "Using pnpm for package management"
    fi
    
    # Install root dependencies
    info "Installing root dependencies..."
    sudo -u "$PROFOLIO_USER" $package_manager install || {
        warning "Root dependency installation failed, continuing..."
    }
    
    # Build backend
    info "Building backend..."
    cd "$PROFOLIO_DIR/backend"
    if sudo -u "$PROFOLIO_USER" $package_manager install; then
        success "Backend dependencies installed"
    else
        error "Failed to install backend dependencies"
        return 1
    fi
    
    if sudo -u "$PROFOLIO_USER" $package_manager run build; then
        success "Backend built successfully"
    else
        error "Failed to build backend"
        return 1
    fi
    
    # Run database migrations
    info "Running database migrations..."
    if sudo -u "$PROFOLIO_USER" $package_manager exec prisma generate; then
        success "Prisma client generated"
    else
        warning "Prisma client generation failed"
    fi
    
    if sudo -u "$PROFOLIO_USER" $package_manager exec prisma migrate deploy; then
        success "Database migrations completed"
    else
        warning "Database migrations failed - database may need manual setup"
    fi
    
    # Build frontend
    info "Building frontend..."
    cd "$PROFOLIO_DIR/frontend"
    if sudo -u "$PROFOLIO_USER" $package_manager install; then
        success "Frontend dependencies installed"
    else
        error "Failed to install frontend dependencies"
        return 1
    fi
    
    if sudo -u "$PROFOLIO_USER" $package_manager run build; then
        success "Frontend built successfully"
    else
        warning "Frontend build failed - will try to start anyway"
    fi
    
    success "Applications built successfully"
}

# Create systemd services
create_services() {
    info "Creating systemd services..."
    
    # Determine the package manager and set proper exec paths
    local node_path="/usr/bin/node"
    local package_manager_cmd=""
    
    if command -v pnpm >/dev/null 2>&1; then
        package_manager_cmd="/usr/local/bin/pnpm"
    elif command -v npm >/dev/null 2>&1; then
        package_manager_cmd="/usr/bin/npm"
    else
        error "No package manager found"
        return 1
    fi
    
    # Backend service
    cat > /etc/systemd/system/profolio-backend.service <<EOF
[Unit]
Description=Profolio Backend
Documentation=https://github.com/Obednal97/profolio
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$PROFOLIO_USER
Group=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/backend
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin:\$HOME/.local/share/pnpm
ExecStart=$node_path dist/main.js
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$PROFOLIO_DIR
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    cat > /etc/systemd/system/profolio-frontend.service <<EOF
[Unit]
Description=Profolio Frontend
Documentation=https://github.com/Obednal97/profolio
After=network.target profolio-backend.service
Wants=profolio-backend.service

[Service]
Type=simple
User=$PROFOLIO_USER
Group=$PROFOLIO_USER
WorkingDirectory=$PROFOLIO_DIR/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=PATH=/usr/local/bin:/usr/bin:/bin:\$HOME/.local/share/pnpm
ExecStart=$package_manager_cmd start
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$PROFOLIO_DIR
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable services
    systemctl daemon-reload
    systemctl enable profolio-backend
    systemctl enable profolio-frontend
    
    success "Systemd services created and enabled"
}

# Start services
start_services() {
    info "Starting Profolio services..."
    
    # Start backend
    systemctl start profolio-backend
    sleep 5
    
    # Start frontend
    systemctl start profolio-frontend
    sleep 5
    
    # Check service status
    if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
        success "All services started successfully"
        info "Frontend: http://localhost:3000"
        info "Backend API: http://localhost:3001"
    else
        error "Failed to start services"
        warning "Backend status: $(systemctl is-active profolio-backend)"
        warning "Frontend status: $(systemctl is-active profolio-frontend)"
        exit 1
    fi
}

# Main application installation function (called by platform handlers)
install_profolio_application() {
    info "Installing Profolio application..."
    
    # Create profolio user
    create_user
    
    # Clone repository
    clone_repository
    
    # Configure environment files
    configure_environment
    
    # Build applications
    build_applications
    
    # Create systemd services
    create_services
    
    # Start services
    start_services
    
    success "Profolio application installation completed successfully"
    return 0
}

# Main installation function
main() {
    echo "="*60
    echo "Profolio Installation Starting"
    echo "="*60
    
    check_root
    install_node
    install_pnpm
    install_postgresql
    setup_database
    
    # Run the main application installation
    install_profolio_application
    
    echo
    success "🎉 Profolio installation completed successfully!"
    echo
    info "Access your Profolio instance at: http://localhost:3000"
    info "Backend API available at: http://localhost:3001"
    echo
    info "Service management:"
    info "  Start: systemctl start profolio-frontend profolio-backend"
    info "  Stop:  systemctl stop profolio-frontend profolio-backend"
    info "  Status: systemctl status profolio-frontend profolio-backend"
    echo
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi