# 🌐 Offline Installation Guide

**For air-gapped environments, homelabs without internet access, and secure installations**

## 📋 **Overview**

This guide enables Profolio installation in completely offline environments where:
- ❌ No internet access during installation
- ❌ Can't download packages during setup
- ❌ Air-gapped security requirements
- ✅ Maximum privacy and security

## 🎯 **Two-Machine Process**

### **Machine A** (Internet-connected)
- Downloads all required files and dependencies
- Creates offline installation package

### **Machine B** (Offline target)
- Receives transferred installation package
- Runs completely offline installation

---

## 📦 **Step 1: Prepare Offline Package (Machine A)**

### **Download Profolio**
```bash
# Create working directory
mkdir profolio-offline && cd profolio-offline

# Download latest Profolio release
git clone --depth 1 https://github.com/Obednal97/profolio.git
cd profolio

# Or download specific version
git clone --branch v1.2.1 --depth 1 https://github.com/Obednal97/profolio.git
cd profolio
```

### **Download Dependencies**

**System Packages:**
```bash
# Ubuntu/Debian packages
mkdir -p offline-packages/system
cd offline-packages/system

# Essential system packages
apt download \
    curl \
    wget \
    git \
    nodejs \
    npm \
    postgresql \
    postgresql-contrib \
    openssl \
    openssh-server \
    ca-certificates \
    gnupg \
    lsb-release

# Node.js LTS (if system nodejs is old)
curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodejs-setup.sh

cd ../..
```

**Node.js Dependencies:**
```bash
# Backend dependencies
cd backend
npm install --production
cd node_modules && tar -czf ../backend-node-modules.tar.gz . && cd ..
cd ..

# Frontend dependencies  
cd frontend
npm install --production
cd node_modules && tar -czf ../frontend-node-modules.tar.gz . && cd ..
cd ..
```

**Create Installation Scripts:**
```bash
# Create offline installer
cat > scripts/offline-install.sh << 'EOF'
#!/bin/bash

# 🌐 Profolio Offline Installer
# For air-gapped and offline environments

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║            🌐 PROFOLIO OFFLINE INSTALLER                     ║"
echo "║              Air-Gapped Installation                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root"
    echo "Usage: sudo ./scripts/offline-install.sh"
    exit 1
fi

# Install system packages
info "Installing system packages..."
if [ -d "offline-packages/system" ]; then
    cd offline-packages/system
    dpkg -i *.deb || apt-get install -f -y
    cd ../..
    success "System packages installed"
else
    warn "No offline system packages found, assuming packages are available"
fi

# Create profolio user
info "Creating profolio user..."
useradd -r -s /bin/bash -d /home/profolio -m profolio 2>/dev/null || true

# Setup PostgreSQL
info "Setting up PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 12)
info "Generated database password: $DB_PASSWORD"

# Setup database
sudo -u postgres psql -c "CREATE USER profolio WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE profolio OWNER profolio;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE profolio TO profolio;" 2>/dev/null || true

# Install application
info "Installing Profolio application..."
cp -r . /opt/profolio-temp
mv /opt/profolio-temp /opt/profolio
chown -R profolio:profolio /opt/profolio

# Extract dependencies
info "Installing Node.js dependencies..."
cd /opt/profolio

if [ -f "backend/backend-node-modules.tar.gz" ]; then
    cd backend
    sudo -u profolio tar -xzf backend-node-modules.tar.gz
    sudo -u profolio rm backend-node-modules.tar.gz
    cd ..
    success "Backend dependencies installed"
fi

if [ -f "frontend/frontend-node-modules.tar.gz" ]; then
    cd frontend
    sudo -u profolio tar -xzf frontend-node-modules.tar.gz
    sudo -u profolio rm frontend-node-modules.tar.gz
    cd ..
    success "Frontend dependencies installed"
fi

# Setup environment
info "Setting up environment configuration..."

# Backend environment
cat > backend/.env << ENVEOF
DATABASE_URL="postgresql://profolio:${DB_PASSWORD}@localhost:5432/profolio"
JWT_SECRET="$(openssl rand -base64 32)"
API_ENCRYPTION_KEY="$(openssl rand -base64 32)"
PORT=3001
NODE_ENV=production
ENVEOF

# Frontend environment
SERVER_IP=$(hostname -I | awk '{print $1}')
cat > frontend/.env.production << ENVEOF
# Authentication mode
NEXT_PUBLIC_AUTH_MODE=local

# Backend API URL
NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001

# Node environment
NODE_ENV=production
ENVEOF

# Set permissions
chown profolio:profolio backend/.env frontend/.env.production
chmod 600 backend/.env frontend/.env.production

# Build application
info "Building application..."
cd backend
sudo -u profolio npm run build || sudo -u profolio npx nest build
cd ../frontend
sudo -u profolio npm run build
cd ..

# Run database migrations
info "Running database migrations..."
cd backend
sudo -u profolio npx prisma generate
sudo -u profolio npx prisma migrate deploy
cd ..

# Install systemd services
info "Installing systemd services..."

# Backend service
cat > /etc/systemd/system/profolio-backend.service << 'SERVICEEOF'
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
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Frontend service
cat > /etc/systemd/system/profolio-frontend.service << 'SERVICEEOF'
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
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start services
systemctl daemon-reload
systemctl enable profolio-backend profolio-frontend

info "Starting services..."
systemctl start profolio-backend
sleep 3
systemctl start profolio-frontend
sleep 2

# Verify installation
info "Verifying installation..."
if systemctl is-active --quiet profolio-backend && systemctl is-active --quiet profolio-frontend; then
    success "Installation completed successfully!"
    echo ""
    echo -e "${GREEN}🎉 Profolio is now running!${NC}"
    echo -e "${BLUE}Frontend:${NC} http://$SERVER_IP:3000"
    echo -e "${BLUE}Backend:${NC}  http://$SERVER_IP:3001"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Visit http://$SERVER_IP:3000"
    echo "2. Create your admin account"
    echo "3. Configure your portfolio"
else
    error "Installation verification failed"
    echo "Check service status: systemctl status profolio-backend profolio-frontend"
    exit 1
fi
EOF

chmod +x scripts/offline-install.sh
```

### **Create Installation Package**
```bash
# Go back to working directory
cd ..

# Create final package
tar -czf profolio-offline-$(date +%Y%m%d).tar.gz profolio/

# Create verification info
echo "Profolio Offline Installation Package" > profolio-offline-info.txt
echo "Created: $(date)" >> profolio-offline-info.txt
echo "Size: $(du -h profolio-offline-$(date +%Y%m%d).tar.gz | cut -f1)" >> profolio-offline-info.txt
echo "SHA256: $(sha256sum profolio-offline-$(date +%Y%m%d).tar.gz)" >> profolio-offline-info.txt

success "Offline package created: profolio-offline-$(date +%Y%m%d).tar.gz"
```

---

## 🚚 **Step 2: Transfer to Offline Machine**

**Transfer methods:**
- 💾 **USB drive**: Copy package to USB, transfer physically
- 🌐 **Secure network**: Transfer via secure isolated network
- 💿 **CD/DVD**: Burn to disc for air-gapped environments
- 📧 **File sharing**: Internal file sharing systems

**Verify transfer:**
```bash
# On offline machine
sha256sum profolio-offline-YYYYMMDD.tar.gz
# Compare with profolio-offline-info.txt
```

---

## 🔧 **Step 3: Install on Offline Machine (Machine B)**

### **Extract and Install**
```bash
# Extract package
tar -xzf profolio-offline-YYYYMMDD.tar.gz
cd profolio

# Run offline installation
sudo ./scripts/offline-install.sh
```

### **Verify Installation**
```bash
# Check services
sudo systemctl status profolio-backend profolio-frontend

# Check network access
curl http://localhost:3000
curl http://localhost:3001/api/health

# View logs if needed
sudo journalctl -u profolio-backend -f
sudo journalctl -u profolio-frontend -f
```

---

## 🔧 **Post-Installation**

### **Initial Setup**
1. **Access Profolio**: Navigate to `http://YOUR_SERVER_IP:3000`
2. **Create Account**: Set up your admin account
3. **Configure Settings**: Customize your installation
4. **Test Features**: Verify all functionality works offline

### **Offline Updates**
```bash
# Create update package on internet-connected machine
git pull origin main
# Repeat package creation process

# Apply on offline machine
sudo systemctl stop profolio-backend profolio-frontend
# Extract new package over existing installation
sudo ./scripts/offline-install.sh --update
```

### **Backup & Maintenance**
```bash
# Database backup
sudo -u postgres pg_dump profolio > profolio-backup-$(date +%Y%m%d).sql

# Application backup
sudo tar -czf profolio-app-backup-$(date +%Y%m%d).tar.gz /opt/profolio

# Restore database
sudo -u postgres psql profolio < profolio-backup-YYYYMMDD.sql
```

---

## ❓ **Troubleshooting**

### **Common Issues**

**Missing Dependencies:**
```bash
# If Node.js packages missing
cd /opt/profolio/backend && sudo -u profolio npm install --offline
cd /opt/profolio/frontend && sudo -u profolio npm install --offline
```

**Permission Issues:**
```bash
sudo chown -R profolio:profolio /opt/profolio
sudo chmod 600 /opt/profolio/backend/.env
sudo chmod 600 /opt/profolio/frontend/.env.production
```

**Database Connection:**
```bash
# Test database connection
sudo -u profolio psql -h localhost -U profolio -d profolio -c "SELECT 1;"
```

**Service Issues:**
```bash
# Check detailed service status
sudo systemctl status profolio-backend profolio-frontend -l
sudo journalctl -u profolio-backend -n 50
sudo journalctl -u profolio-frontend -n 50
```

### **Support**

For offline installation issues:
1. **Check logs**: Use `journalctl` commands above
2. **Verify package**: Confirm SHA256 checksums match
3. **Test dependencies**: Ensure all required packages were transferred
4. **Network configuration**: Verify local network settings

---

## 🔒 **Security Considerations**

### **Air-Gapped Security**
- ✅ **No external connections**: Completely isolated operation
- ✅ **Local authentication**: No external auth dependencies
- ✅ **Encrypted storage**: AES-256-GCM for sensitive data
- ✅ **Secure defaults**: Strong passwords and permissions

### **Package Integrity**
- ✅ **SHA256 verification**: Verify package integrity
- ✅ **Checksum validation**: Confirm all files transferred correctly
- ✅ **Source verification**: Use official repository packages only

---

**This offline installation method ensures maximum security and privacy for sensitive environments while maintaining all Profolio functionality.** 