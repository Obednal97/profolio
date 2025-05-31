#!/bin/bash

# Profolio Self-Hosted Installation Script
# Usage: bash -c "$(curl -fsSL https://raw.githubusercontent.com/your-repo/profolio/main/install.sh)"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROFOLIO_DIR="/opt/profolio"
SERVICE_USER="profolio"
SERVICE_NAME="profolio"

echo -e "${BLUE}🚀 Profolio Self-Hosted Installation${NC}"
echo "======================================"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}" 
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    echo -e "${RED}❌ Cannot detect OS version${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Detected OS: $OS $VER${NC}"

# Check system requirements
check_requirements() {
    echo -e "${BLUE}🔍 Checking system requirements...${NC}"
    
    # Check memory (minimum 512MB)
    MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ $MEMORY -lt 512 ]; then
        echo -e "${RED}❌ Insufficient memory: ${MEMORY}MB (minimum 512MB required)${NC}"
        exit 1
    fi
    
    # Check disk space (minimum 2GB)
    DISK=$(df / | awk 'NR==2{print $4}')
    if [ $DISK -lt 2097152 ]; then  # 2GB in KB
        echo -e "${RED}❌ Insufficient disk space (minimum 2GB required)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ System requirements met${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Update package list
    apt update
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Install PostgreSQL
    apt install -y postgresql postgresql-contrib
    
    # Install other dependencies
    apt install -y git curl wget unzip nginx certbot python3-certbot-nginx
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Setup database
setup_database() {
    echo -e "${BLUE}🗄️ Setting up database...${NC}"
    
    # Generate random password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
    
    # Create database and user
    sudo -u postgres psql -c "CREATE USER profolio WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "CREATE DATABASE profolio OWNER profolio;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;"
    
    # Store database credentials
    echo "DB_PASSWORD=$DB_PASSWORD" > /opt/profolio/.db-credentials
    chmod 600 /opt/profolio/.db-credentials
    
    echo -e "${GREEN}✅ Database configured${NC}"
}

# Create service user
create_service_user() {
    echo -e "${BLUE}👤 Creating service user...${NC}"
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd -r -s /bin/false -d $PROFOLIO_DIR $SERVICE_USER
        echo -e "${GREEN}✅ Service user created${NC}"
    else
        echo -e "${YELLOW}ℹ️ Service user already exists${NC}"
    fi
}

# Download and install Profolio
install_profolio() {
    echo -e "${BLUE}⬇️ Downloading Profolio...${NC}"
    
    # Create directory
    mkdir -p $PROFOLIO_DIR
    cd $PROFOLIO_DIR
    
    # Download latest release (adjust URL as needed)
    LATEST_VERSION=$(curl -s https://api.github.com/repos/your-repo/profolio/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
    curl -L "https://github.com/your-repo/profolio/archive/$LATEST_VERSION.tar.gz" | tar xz --strip-components=1
    
    # Mark as self-hosted
    touch .self-hosted
    
    # Set ownership
    chown -R $SERVICE_USER:$SERVICE_USER $PROFOLIO_DIR
    
    echo -e "${GREEN}✅ Profolio downloaded${NC}"
}

# Install application dependencies
install_app_dependencies() {
    echo -e "${BLUE}📦 Installing application dependencies...${NC}"
    
    cd $PROFOLIO_DIR
    
    # Install backend dependencies
    cd backend
    sudo -u $SERVICE_USER npm ci --production
    
    # Install frontend dependencies and build
    cd ../frontend
    sudo -u $SERVICE_USER npm ci
    sudo -u $SERVICE_USER npm run build
    
    echo -e "${GREEN}✅ Application dependencies installed${NC}"
}

# Setup configuration
setup_configuration() {
    echo -e "${BLUE}⚙️ Setting up configuration...${NC}"
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 32)
    ENCRYPTION_SECRET=$(openssl rand -base64 32)
    
    # Get database password
    source /opt/profolio/.db-credentials
    
    # Create environment file
    cat > $PROFOLIO_DIR/backend/.env << EOF
DATABASE_URL="postgresql://profolio:$DB_PASSWORD@localhost:5432/profolio"
JWT_SECRET="$JWT_SECRET"
API_KEY_ENCRYPTION_SECRET="$ENCRYPTION_SECRET"
NODE_ENV=production
PORT=3001
ALLOW_NETWORK_BYPASS=true
REQUIRE_EMAIL_VERIFICATION=false
DEPLOYMENT_TYPE=self-hosted
EOF
    
    # Set permissions
    chown $SERVICE_USER:$SERVICE_USER $PROFOLIO_DIR/backend/.env
    chmod 600 $PROFOLIO_DIR/backend/.env
    
    echo -e "${GREEN}✅ Configuration created${NC}"
}

# Run database migrations
run_migrations() {
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    
    cd $PROFOLIO_DIR/backend
    sudo -u $SERVICE_USER npx prisma migrate deploy
    sudo -u $SERVICE_USER npx prisma generate
    
    echo -e "${GREEN}✅ Database migrations completed${NC}"
}

# Create systemd service
create_systemd_service() {
    echo -e "${BLUE}🔧 Creating systemd service...${NC}"
    
    cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=Profolio Portfolio Management
After=network.target postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROFOLIO_DIR/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable and start service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    echo -e "${GREEN}✅ Systemd service created${NC}"
}

# Setup nginx
setup_nginx() {
    echo -e "${BLUE}🌐 Setting up Nginx...${NC}"
    
    # Get server IP
    SERVER_IP=$(curl -s ifconfig.me)
    
    cat > /etc/nginx/sites-available/profolio << EOF
server {
    listen 80;
    server_name $SERVER_IP;
    
    # Serve frontend
    location / {
        root $PROFOLIO_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/profolio /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx configured${NC}"
}

# Setup default admin user
setup_admin_user() {
    echo -e "${BLUE}👤 Setting up default admin user...${NC}"
    
    cd $PROFOLIO_DIR/backend
    
    # Create default admin (the app will handle this through setup wizard)
    echo -e "${YELLOW}ℹ️ Default admin credentials will be shown after first startup${NC}"
    echo -e "${YELLOW}ℹ️ Visit http://$SERVER_IP/setup to complete configuration${NC}"
}

# Main installation flow
main() {
    echo -e "${BLUE}Starting Profolio installation...${NC}"
    
    check_requirements
    install_dependencies
    create_service_user
    install_profolio
    setup_database
    install_app_dependencies
    setup_configuration
    run_migrations
    create_systemd_service
    setup_nginx
    setup_admin_user
    
    # Start services
    systemctl start $SERVICE_NAME
    systemctl start nginx
    
    # Get server info
    SERVER_IP=$(curl -s ifconfig.me)
    
    echo ""
    echo -e "${GREEN}🎉 Installation completed successfully!${NC}"
    echo "======================================"
    echo -e "${BLUE}📍 Access your Profolio instance at:${NC}"
    echo -e "   ${YELLOW}http://$SERVER_IP${NC}"
    echo ""
    echo -e "${BLUE}🔐 Default admin credentials:${NC}"
    echo -e "   ${YELLOW}Email: admin@localhost${NC}"
    echo -e "   ${YELLOW}Password: changeme123${NC}"
    echo -e "   ${RED}⚠️  Please change these credentials immediately!${NC}"
    echo ""
    echo -e "${BLUE}📋 Service commands:${NC}"
    echo -e "   ${YELLOW}Start:   systemctl start $SERVICE_NAME${NC}"
    echo -e "   ${YELLOW}Stop:    systemctl stop $SERVICE_NAME${NC}"
    echo -e "   ${YELLOW}Status:  systemctl status $SERVICE_NAME${NC}"
    echo -e "   ${YELLOW}Logs:    journalctl -u $SERVICE_NAME -f${NC}"
    echo ""
    echo -e "${BLUE}📁 Installation directory: $PROFOLIO_DIR${NC}"
    echo ""
    echo -e "${GREEN}Thank you for using Profolio! 🚀${NC}"
}

# Run installation
main "$@" 