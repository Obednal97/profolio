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

echo "✅ Offline package created: profolio-offline-$(date +%Y%m%d).tar.gz"
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

# Install offline system packages first (if needed)
if [ -d "offline-packages/system" ]; then
    cd offline-packages/system
    sudo dpkg -i *.deb || sudo apt-get install -f -y
    cd ../..
fi

# Extract pre-downloaded Node.js dependencies
if [ -f "backend/backend-node-modules.tar.gz" ]; then
    cd backend && tar -xzf backend-node-modules.tar.gz && rm backend-node-modules.tar.gz && cd ..
fi

if [ -f "frontend/frontend-node-modules.tar.gz" ]; then
    cd frontend && tar -xzf frontend-node-modules.tar.gz && rm frontend-node-modules.tar.gz && cd ..
fi

# Run the comprehensive installer in offline mode
sudo ./install-or-update.sh --auto
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
sudo ./install-or-update.sh --auto
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