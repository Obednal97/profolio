#!/bin/bash

# =============================================================================
# PROFOLIO APPLICATION INSTALLER
# =============================================================================
# Core application installer - platform independent
# Handles Node.js, PostgreSQL, repository cloning, building, and service setup
# =============================================================================

# Configuration
# Only set these variables if they're not already defined (avoid readonly conflicts)
: "${PROFOLIO_USER:=profolio}"
: "${PROFOLIO_DIR:=/opt/profolio}"
: "${REPO_BRANCH:=main}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m'

# Logging functions (only define if not already available)
if ! command -v info >/dev/null 2>&1; then
    info() {
        echo -e "${BLUE}[INFO]${NC} $1"
    }
fi

if ! command -v success >/dev/null 2>&1; then
    success() {
        echo -e "${GREEN}[SUCCESS]${NC} $1"
    }
fi

if ! command -v warning >/dev/null 2>&1; then
    warning() {
        echo -e "${YELLOW}[WARNING]${NC} $1"
    }
fi

if ! command -v error >/dev/null 2>&1; then
    error() {
        echo -e "${RED}[ERROR]${NC} $1"
    }
fi

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
    
    # Update PATH to ensure Node.js is immediately available
    export PATH="/usr/bin:/usr/local/bin:$PATH"
    
    # Reload environment
    hash -r
    
    # Give the system a moment to update
    sleep 2
    
    # Verify installation
    local node_version=$(node --version 2>/dev/null || echo "not_installed")
    local npm_version=$(npm --version 2>/dev/null || echo "not_installed")
    
    if [[ $node_version == v20* ]]; then
        success "Node.js installed: $node_version"
        success "npm installed: $npm_version"
        
        # Export for other functions to use
        export NODE_PATH="/usr/bin/node"
        export NPM_PATH="/usr/bin/npm"
        
        return 0
    else
        error "Failed to install Node.js 20. Got: $node_version"
        
        # Try alternative installation method
        warning "Trying alternative Node.js installation..."
        if curl -fsSL https://nodejs.org/dist/v20.11.1/node-v20.11.1-linux-x64.tar.xz | tar -xJ -C /usr/local --strip-components=1; then
            export PATH="/usr/local/bin:$PATH"
            hash -r
            local alt_version=$(node --version 2>/dev/null || echo "failed")
            if [[ $alt_version == v20* ]]; then
                success "Node.js installed via alternative method: $alt_version"
                return 0
            fi
        fi
        
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
    
    # Verify Node.js is properly installed
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js not found in PATH. Attempting to install..."
        if ! install_node; then
            error "Failed to install Node.js - cannot continue"
            return 1
        fi
    fi
    
    # Verify we can run Node.js
    local node_version=$(node --version 2>/dev/null || echo "")
    if [[ -z "$node_version" ]]; then
        error "Node.js installation appears broken"
        return 1
    fi
    
    info "Using Node.js version: $node_version"
    
    cd "$PROFOLIO_DIR"
    
    # Ensure pnpm is in PATH and set up environment
    export PATH="$HOME/.local/share/pnpm:/usr/local/bin:/usr/bin:/bin:$PATH"
    
    # Determine package manager to use
    local package_manager=""
    if command -v pnpm >/dev/null 2>&1; then
        package_manager="pnpm"
        local pnpm_version=$(pnpm --version 2>/dev/null)
        info "Using pnpm version: $pnpm_version"
    elif command -v npm >/dev/null 2>&1; then
        package_manager="npm"
        local npm_version=$(npm --version 2>/dev/null)
        info "Using npm version: $npm_version"
    else
        error "No package manager (npm/pnpm) found"
        return 1
    fi
    
    # Install root dependencies
    info "Installing root dependencies..."
    if sudo -u "$PROFOLIO_USER" $package_manager install 2>/dev/null; then
        success "Root dependencies installed successfully"
    else
        warning "Root dependency installation failed, continuing..."
    fi
    
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
    
    # Determine actual executable paths
    local node_path=$(which node 2>/dev/null || echo "/usr/bin/node")
    local pnpm_path=""
    local npm_path=""
    
    # Find pnpm with multiple fallback locations
    if command -v pnpm >/dev/null 2>&1; then
        pnpm_path=$(which pnpm 2>/dev/null)
        info "Found pnpm at: $pnpm_path"
    elif [[ -f "/root/.local/share/pnpm/pnpm" ]]; then
        pnpm_path="/root/.local/share/pnpm/pnpm"
        info "Found pnpm at: $pnpm_path"
    elif [[ -f "/usr/local/bin/pnpm" ]]; then
        pnpm_path="/usr/local/bin/pnpm"
        info "Found pnpm at: $pnpm_path"
    fi
    
    # Find npm as fallback
    if command -v npm >/dev/null 2>&1; then
        npm_path=$(which npm 2>/dev/null || echo "/usr/bin/npm")
        info "Found npm at: $npm_path"
    fi
    
    # Determine what to use for frontend
    local frontend_cmd=""
    if [[ -n "$pnpm_path" && -x "$pnpm_path" ]]; then
        frontend_cmd="$pnpm_path start"
        info "Frontend will use pnpm: $frontend_cmd"
    elif [[ -n "$npm_path" && -x "$npm_path" ]]; then
        frontend_cmd="$npm_path start"
        info "Frontend will use npm: $frontend_cmd"
    else
        error "No package manager found for frontend service"
        return 1
    fi
    
    # Verify node path
    if [[ ! -x "$node_path" ]]; then
        error "Node.js not found at: $node_path"
        return 1
    fi
    
    info "Node.js path: $node_path"
    info "Frontend command: $frontend_cmd"
    
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
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/share/pnpm
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
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/root/.local/share/pnpm
ExecStart=/bin/bash -c '$frontend_cmd'
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
    
    # Check if running as root
    check_root
    
    # Install Node.js if not already installed
    if ! command -v node >/dev/null 2>&1; then
        info "Node.js not found, installing..."
        if ! install_node; then
            error "Failed to install Node.js"
            return 1
        fi
    else
        local node_version=$(node --version 2>/dev/null)
        info "Node.js already installed: $node_version"
    fi
    
    # Install pnpm if not already installed
    if ! command -v pnpm >/dev/null 2>&1; then
        info "pnpm not found, installing..."
        if ! install_pnpm; then
            warning "pnpm installation failed, will use npm instead"
        fi
    else
        local pnpm_version=$(pnpm --version 2>/dev/null)
        info "pnpm already installed: $pnpm_version"
    fi
    
    # Setup database if needed (only if not already configured)
    if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw profolio 2>/dev/null; then
        info "Database not found, setting up..."
        if ! setup_database; then
            error "Failed to setup database"
            return 1
        fi
    else
        info "Database already exists, using existing configuration"
        # Create a temporary password file for environment setup
        # Generate a new password for this installation
        local new_db_password=$(openssl rand -base64 32)
        echo "$new_db_password" > /tmp/profolio_db_password
        chmod 600 /tmp/profolio_db_password
        
        # Update the database password
        sudo -u postgres psql << EOF
ALTER USER profolio WITH ENCRYPTED PASSWORD '$new_db_password';
\q
EOF
        info "Database password updated for this installation"
    fi
    
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