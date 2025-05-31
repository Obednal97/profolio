#!/bin/bash

# 🚀 Profolio Smart Install/Update Script
# Automatically detects fresh install vs existing installation
# and runs the appropriate setup wizard

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 PROFOLIO INSTALLER                    ║"
echo "║              Smart Install & Update System                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   echo "Usage: sudo ./install-or-update.sh"
   exit 1
fi

# Detect installation state
detect_installation_state() {
    if [ -d "/opt/profolio" ] && [ -f "/etc/systemd/system/profolio-backend.service" ]; then
        if systemctl is-active --quiet profolio-backend 2>/dev/null; then
            return 2  # Running installation
        else
            return 1  # Installed but not running
        fi
    else
        return 0  # Fresh system
    fi
}

# Fresh Installation Function
fresh_install() {
    echo -e "${GREEN}🆕 Fresh Installation Detected${NC}"
    echo "Setting up Profolio for the first time..."
    
    # Create profolio user
    echo -e "${BLUE}👤 Creating profolio user...${NC}"
    useradd -r -s /bin/bash -d /home/profolio -m profolio 2>/dev/null || echo "User already exists"
    
    # Install system dependencies
    echo -e "${BLUE}📦 Installing system dependencies...${NC}"
    apt update
    apt install -y git nodejs npm postgresql postgresql-contrib curl wget
    
    # Start PostgreSQL
    systemctl enable postgresql
    systemctl start postgresql
    
    # Create database and user
    echo -e "${BLUE}🗄️  Setting up database...${NC}"
    sudo -u postgres psql << EOF
CREATE USER profolio WITH PASSWORD 'temppassword';
CREATE DATABASE profolio OWNER profolio;
GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;
\q
EOF
    
    # Clone repository
    echo -e "${BLUE}📥 Cloning Profolio repository...${NC}"
    if [ -d "/opt/profolio" ]; then
        rm -rf /opt/profolio
    fi
    
    cd /opt
    git clone https://github.com/Obednal97/profolio.git
    chown -R profolio:profolio /opt/profolio
    
    # Setup environment
    echo -e "${BLUE}⚙️  Configuring environment...${NC}"
    cd /opt/profolio
    chmod +x scripts/setup-production-environment.sh
    ./scripts/setup-production-environment.sh
    
    # Install dependencies and build
    echo -e "${BLUE}🔨 Installing dependencies and building...${NC}"
    
    # Backend
    cd /opt/profolio/backend
    sudo -u profolio npm install
    sudo -u profolio npx prisma generate
    sudo -u profolio npx prisma migrate deploy
    sudo -u profolio npx nest build
    
    # Frontend  
    cd /opt/profolio/frontend
    sudo -u profolio npm install
    sudo -u profolio npm run build
    
    # Install systemd services
    echo -e "${BLUE}🔧 Installing systemd services...${NC}"
    install_systemd_services
    
    # Start services
    systemctl enable profolio-backend profolio-frontend
    systemctl start profolio-backend profolio-frontend
    
    # Verify installation
    verify_installation
    
    echo -e "${GREEN}✅ Fresh installation completed successfully!${NC}"
    show_access_info
}

# Update Function
update_installation() {
    echo -e "${YELLOW}🔄 Existing Installation Detected${NC}"
    echo "Starting update process..."
    
    # Create backup
    echo -e "${BLUE}💾 Creating backup...${NC}"
    backup_dir="/opt/profolio-backups/update_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup database
    sudo -u postgres pg_dump profolio > "$backup_dir/database.sql"
    
    # Backup application
    cp -r /opt/profolio "$backup_dir/application"
    
    echo -e "${GREEN}✅ Backup created: $backup_dir${NC}"
    
    # Stop services
    echo -e "${BLUE}🛑 Stopping services...${NC}"
    systemctl stop profolio-frontend profolio-backend || true
    
    # Update code
    echo -e "${BLUE}📥 Updating code...${NC}"
    cd /opt/profolio
    sudo -u profolio git stash push -m "Auto-stash before update $(date)"
    sudo -u profolio git pull origin main
    
    # Update dependencies
    echo -e "${BLUE}📦 Updating dependencies...${NC}"
    
    # Backend
    cd /opt/profolio/backend
    sudo -u profolio npm install
    sudo -u profolio npx prisma generate
    sudo -u profolio npx prisma migrate deploy
    sudo -u profolio npx nest build
    
    # Frontend
    cd /opt/profolio/frontend  
    sudo -u profolio npm install
    sudo -u profolio npm run build
    
    # Update systemd services (in case they changed)
    echo -e "${BLUE}🔧 Updating systemd services...${NC}"
    install_systemd_services
    systemctl daemon-reload
    
    # Start services
    echo -e "${BLUE}▶️  Starting services...${NC}"
    systemctl start profolio-backend profolio-frontend
    
    # Verify update
    verify_installation
    
    echo -e "${GREEN}✅ Update completed successfully!${NC}"
    echo -e "${BLUE}📁 Backup location: $backup_dir${NC}"
    show_access_info
}

# Repair Function
repair_installation() {
    echo -e "${YELLOW}🔧 Existing Installation Found (Not Running)${NC}"
    echo "Attempting to repair and restart services..."
    
    # Update environment
    echo -e "${BLUE}⚙️  Updating environment configuration...${NC}"
    cd /opt/profolio
    chmod +x scripts/setup-production-environment.sh
    ./scripts/setup-production-environment.sh
    
    # Reinstall systemd services
    echo -e "${BLUE}🔧 Reinstalling systemd services...${NC}"
    install_systemd_services
    systemctl daemon-reload
    
    # Try to start services
    echo -e "${BLUE}▶️  Starting services...${NC}"
    systemctl start profolio-backend profolio-frontend
    
    # Verify repair
    verify_installation
    
    echo -e "${GREEN}✅ Repair completed successfully!${NC}"
    show_access_info
}

# Install systemd services
install_systemd_services() {
    # Backend service
    cat > /etc/systemd/system/profolio-backend.service << 'EOF'
[Unit]
Description=Profolio Backend
After=network.target postgresql.service

[Service]
Type=simple
User=profolio
Group=profolio
WorkingDirectory=/opt/profolio/backend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStartPre=/bin/bash -c '/opt/profolio/backend/scripts/start.sh || true'
ExecStart=/opt/profolio/backend/scripts/start-backend.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service  
    cat > /etc/systemd/system/profolio-frontend.service << 'EOF'
[Unit]
Description=Profolio Frontend
After=network.target profolio-backend.service

[Service]
Type=simple
User=profolio
Group=profolio
WorkingDirectory=/opt/profolio/frontend
Environment=PATH=/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStart=/opt/profolio/frontend/scripts/start-frontend.sh
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
}

# Verify installation
verify_installation() {
    echo -e "${BLUE}🔍 Verifying installation...${NC}"
    
    # Wait for services to start
    sleep 5
    
    # Check service status
    if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
        echo -e "${GREEN}✅ Services are running${NC}"
        
        # Test API endpoints
        if curl -s http://localhost:3001/api/assets >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend API responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend API not responding (may need a moment to start)${NC}"
        fi
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend responding${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend not responding (may need a moment to start)${NC}"
        fi
    else
        echo -e "${RED}❌ Services failed to start${NC}"
        echo "Check logs with: journalctl -u profolio-backend -u profolio-frontend -f"
        return 1
    fi
}

# Show access information
show_access_info() {
    local_ip=$(hostname -I | awk '{print $1}')
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 INSTALLATION COMPLETE                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${BLUE}🌐 Access your Profolio instance:${NC}"
    echo -e "   Frontend: ${GREEN}http://$local_ip:3000${NC}"
    echo -e "   Backend:  ${GREEN}http://$local_ip:3001${NC}"
    echo ""
    echo -e "${BLUE}🔧 Useful commands:${NC}"
    echo -e "   Check status: ${YELLOW}sudo systemctl status profolio-backend profolio-frontend${NC}"
    echo -e "   View logs:    ${YELLOW}sudo journalctl -u profolio-backend -u profolio-frontend -f${NC}"
    echo -e "   Restart:      ${YELLOW}sudo systemctl restart profolio-backend profolio-frontend${NC}"
    echo ""
}

# Main execution logic
main() {
    detect_installation_state
    case $? in
        0)
            fresh_install
            ;;
        1)
            repair_installation
            ;;
        2)
            update_installation
            ;;
    esac
}

# Run main function
main "$@" 