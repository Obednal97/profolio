# Profolio Installation Scripts

This directory contains the main installation scripts for deploying Profolio in different environments.

## 📁 **Available Installers**

### **install-or-update.sh** (131KB)

- **Purpose**: Standard server installation and updates
- **Target**: Ubuntu/Debian servers, VPS, dedicated servers
- **Features**: Complete system setup, database configuration, SSL, firewall
- **Usage**: `sudo ./install-or-update.sh`

### **proxmox-install-or-update.sh** (138KB)

- **Purpose**: Proxmox LXC container installation
- **Target**: Proxmox virtualization environments
- **Features**: LXC-optimized setup, container networking, resource management
- **Usage**: `sudo ./proxmox-install-or-update.sh`

## 🚀 **Quick Start**

### **From Project Root**

```bash
# Use the installation launcher for guided setup
./install.sh
```

### **Direct Installation**

```bash
# Standard server installation
sudo ./scripts/installers/install-or-update.sh

# Proxmox LXC installation
sudo ./scripts/installers/proxmox-install-or-update.sh
```

## 📋 **Installation Features**

Both installers provide:

- ✅ **Automated System Setup** - Dependencies, users, permissions
- ✅ **Database Configuration** - PostgreSQL with secure defaults
- ✅ **SSL Certificate Setup** - Let's Encrypt integration
- ✅ **Firewall Configuration** - Secure network setup
- ✅ **Service Management** - Systemd services for auto-start
- ✅ **Environment Configuration** - Complete .env setup
- ✅ **Health Monitoring** - Service status verification
- ✅ **Backup Integration** - Automated backup configuration

## 🔧 **Requirements**

- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Internet connection for package downloads
- **Privileges**: Root/sudo access required

## 📚 **Documentation**

For complete installation guides, see:

- `docs/setup/` - Detailed setup documentation
- `docs/deployment/` - Production deployment guides
- Root `README.md` - Quick start overview

## 🆘 **Support**

If installation fails:

1. Check system requirements
2. Review installation logs
3. Verify network connectivity
4. Consult troubleshooting guides in `docs/`

## 📊 **Recent Updates**

Both scripts include:

- Comprehensive environment templates
- Enhanced error handling
- Performance optimizations
- Security hardening improvements
