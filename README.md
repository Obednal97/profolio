# 📊 Profolio

**Professional Self-Hosted Portfolio Management System**

A comprehensive, secure, and modern portfolio management platform designed for self-hosting on Proxmox VE, Homelab, or any Linux server. Built with NestJS, Next.js, and TypeScript.

[![One-Line Install](https://img.shields.io/badge/Install-One_Command-blue)](https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](.)
[![Proxmox](https://img.shields.io/badge/Proxmox-Compatible-orange)](.)

## 🚀 **One-Command Installation**

```bash
# Proxmox Community Standard Format
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

---

## 📦 **Features**

### **📈 Portfolio Management**
- **Multi-Asset Support:** Stocks, ETFs, Crypto, Real Estate, Bonds
- **Real-Time Data:** Live market data integration with Trading 212 API
- **Performance Analytics:** Advanced portfolio performance tracking
- **Risk Analysis:** Portfolio risk assessment and diversification metrics

### **💰 Financial Tracking**
- **Asset Manager:** Comprehensive asset allocation and tracking
- **Expense Manager:** Personal finance and expense tracking
- **Property Manager:** Real estate portfolio management
- **P&L Analysis:** Detailed profit/loss reporting

### **🔒 Security & Privacy**
- **Self-Hosted:** Complete data control and privacy
- **Encrypted API Keys:** AES-256-GCM encryption for sensitive data
- **JWT Authentication:** Secure user authentication system
- **Demo Mode:** Safe API key testing with localStorage-only storage

### **🎨 Modern Interface**
- **Responsive Design:** Mobile-first, works on all devices
- **Dark Mode:** Professional dark theme interface
- **Interactive Charts:** Real-time portfolio visualization
- **Modern UI:** Built with Next.js 14 and Tailwind CSS

---

## ✅ **Requirements**

### **Minimum System Requirements:**
- **OS:** Ubuntu 20.04+ / Debian 11+ (or compatible)
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 10GB minimum, 20GB recommended
- **Network:** Internet connection for market data

### **Recommended for Proxmox:**
- **LXC Container:** Ubuntu 22.04 template
- **Memory:** 4GB RAM
- **Storage:** 20GB disk space
- **Network:** Bridged networking

---

## 🔧 **Installation Options**

### **🚀 Quick Start (Recommended)**

**One-command installation with setup wizard:**
```bash
# Download and run the interactive installer
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

**Auto-install with defaults (unattended):**
```bash
# Quick install with recommended settings
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)" -- --auto
```

---

### **📋 Installation Wizard Features**

The installer includes a **professional configuration wizard** similar to Proxmox community scripts:

#### **🔧 Installation Modes:**
- **Quick Install** - Uses recommended defaults (2 CPU, 4GB RAM, 20GB storage, DHCP)
- **Advanced Setup** - Full configuration wizard

#### **📦 Container Configuration:**
- **CPU Cores:** 1-16 cores (default: 2)
- **Memory:** 1024-32768 MB (default: 4096MB)
- **Storage:** 10-500 GB (default: 20GB)
- **Container Name:** Custom name (default: "Profolio")

#### **🌐 Network Configuration:**
- **DHCP Mode:** Automatic IP assignment (default)
- **Static IP Mode:** Manual IP, gateway, subnet configuration
- **IPv6 Support:** Enable/disable IPv6
- **DNS Settings:** Custom DNS servers and search domain

#### **🔐 Security Configuration:**
- **Database Password:** Secure password setup
- **Auto-generated Secrets:** JWT and encryption keys
- **Environment Isolation:** Proper user permissions

---

### **🏠 Proxmox LXC Installation**

#### **Step 1: Create LXC Container**
```bash
# In Proxmox web interface or via CLI:
# - Template: Ubuntu 22.04
# - Memory: 4GB (minimum 2GB)
# - Storage: 20GB (minimum 10GB)
# - Network: Bridged
```

#### **Step 2: Run Installer**
```bash
# Inside the LXC container
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

#### **Step 3: Access Your Installation**
```bash
# The installer will show your access URLs:
# Frontend: http://YOUR_CONTAINER_IP:3000
# Backend:  http://YOUR_CONTAINER_IP:3001
```

---

### **🖥️ Ubuntu/Debian Server Installation**

#### **Prerequisites:**
- Ubuntu 20.04+ or Debian 11+
- Root access
- Internet connection

#### **Installation:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Run installer
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

---

### **🔄 Updates & Maintenance**

#### **Automatic Updates:**
```bash
# Same command detects existing installation and runs update wizard
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"

# Or run locally
cd /opt/profolio
sudo ./install-or-update.sh
```

#### **Update Process:**
1. **Backup Creation** - Automatic database and application backup
2. **Service Stop** - Graceful service shutdown
3. **Code Update** - Git pull latest changes
4. **Dependency Update** - Update and rebuild applications
5. **Service Restart** - Start updated services
6. **Verification** - Health checks and validation

#### **Backup Management:**
- **Automatic Backups** - Created before each update
- **Backup Limit** - Maximum 3 backups retained
- **Backup Location** - `/opt/profolio-backups/`

---

### **🔨 Manual Installation (Developers)**

For development or custom deployments, see [Development Guide](README-DEVELOPMENT.md)

---

### **📋 Installation Requirements**

#### **Minimum System Requirements:**
- **OS:** Ubuntu 20.04+ / Debian 11+
- **CPU:** 1 core (2 recommended)
- **RAM:** 1GB (4GB recommended)
- **Storage:** 10GB (20GB recommended)
- **Network:** Internet connection

#### **Automatic Dependencies:**
The installer automatically installs:
- Node.js 18+
- PostgreSQL 14+
- NPM package manager
- Git version control
- Required system packages

---

### **🔐 Security & Access**

#### **Default Configuration:**
- **Database:** Auto-generated secure password
- **JWT Secrets:** Cryptographically secure tokens
- **User Creation:** Dedicated `profolio` system user
- **File Permissions:** Restricted access (600/644)

#### **First Time Access:**
1. Navigate to `http://YOUR_SERVER_IP:3000`
2. Create your admin account
3. Configure your portfolio settings
4. Add Trading 212 API key (optional)

---

### **🚨 Troubleshooting**

#### **Common Issues:**

**Services not starting:**
```bash
# Check service status
sudo systemctl status profolio-backend profolio-frontend

# View logs
sudo journalctl -u profolio-backend -u profolio-frontend -f

# Restart services
sudo systemctl restart profolio-backend profolio-frontend
```

**Network access issues:**
```bash
# Check if services are listening
sudo netstat -tlnp | grep -E ":(3000|3001)"

# Check firewall (if enabled)
sudo ufw status
```

**Database connection issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -c "\l" | grep profolio
```

#### **Repair Installation:**
```bash
# Run repair mode (detects and fixes common issues)
sudo ./install-or-update.sh
```

---

### **💡 Pro Tips**

- **Static IP:** Use static IP configuration for production deployments
- **Firewall:** Configure firewall to allow ports 3000 and 3001
- **SSL:** Set up reverse proxy with SSL for production use
- **Monitoring:** Use `journalctl` to monitor application logs
- **Backups:** Regular backups are created automatically during updates

---

## 📱 **Access Your Installation**

After installation completes:

- **📊 Frontend:** `http://YOUR_SERVER_IP:3000`
- **🔧 API Backend:** `http://YOUR_SERVER_IP:3001`
- **🛠️ Health Check:** `http://YOUR_SERVER_IP:3001/health`

---

## 🔄 **Updates & Maintenance**

### **One-Command Updates:**
```bash
# Same command for fresh install, updates, and repairs
cd /opt/profolio
sudo ./install-or-update.sh
```

### **Service Management:**
```bash
# Check status
sudo systemctl status profolio-backend profolio-frontend

# View logs
sudo journalctl -u profolio-backend -u profolio-frontend -f

# Restart services
sudo systemctl restart profolio-backend profolio-frontend
```

---

## 🏗️ **Architecture**

### **Tech Stack:**
- **Backend:** NestJS + TypeScript + Prisma ORM
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL
- **Authentication:** JWT with secure session management
- **API Integration:** Trading 212 API (more exchanges coming)

### **Project Structure:**
```
profolio/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
├── install-or-update.sh # Smart installer script
├── deploy.sh         # Deployment automation
└── scripts/          # Utility scripts
```

---

## 🛡️ **Security Features**

- **🔐 Encrypted API Storage:** AES-256-GCM encryption
- **🎯 Demo Mode:** Safe API testing without server storage
- **🔒 JWT Authentication:** Secure token-based auth
- **🏠 Self-Hosted:** Complete data ownership
- **🛡️ Input Validation:** Comprehensive data validation
- **📊 Audit Logging:** Security event tracking

---

## 🚀 **Quick Start**

1. **Install Profolio:**
   ```bash
   bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
   ```

2. **Access the Interface:**
   - Open `http://YOUR_SERVER_IP:3000`
   - Create your account
   - Configure your portfolio

3. **Connect Trading 212 (Optional):**
   - Get API key from Trading 212
   - Add to settings for live data sync

---

## 📖 **Documentation**

- **[Installation Guide](README-INSTALLATION.md)** - Complete installation documentation
- **[Development Guide](README-DEVELOPMENT.md)** - Setup for developers
- **[Demo Mode Guide](DEMO_MODE_SETUP.md)** - Safe API testing
- **[Deployment Guide](DEPLOYMENT_IMPROVEMENTS.md)** - Production deployment

---

## 🤝 **Contributing**

We welcome contributions! Whether it's:

- 🐛 **Bug Reports:** [Submit Issues](https://github.com/Obednal97/profolio/issues)
- 💡 **Feature Requests:** [Request Features](https://github.com/Obednal97/profolio/issues)
- 🔧 **Pull Requests:** [Contribute Code](https://github.com/Obednal97/profolio/pulls)
- 📚 **Documentation:** Help improve guides

### **Development Setup:**
```bash
git clone https://github.com/Obednal97/profolio.git
cd profolio
# See CONTRIBUTING.md for complete development setup
```

### **🔧 GitHub Repository Setup:**

For maintainers or those creating forks, we provide comprehensive GitHub configuration guides:

- **🚀 [GitHub Setup Index](docs/github-setup-index.md)** - Choose your setup path
- **⚡ [Quick Reference](docs/github-quick-reference.md)** - Essential settings checklist  
- **👀 [Visual Guide](docs/github-visual-guide.md)** - Interface navigation help
- **📖 [Step-by-Step Walkthrough](docs/github-setup-walkthrough.md)** - Complete detailed setup

**Ready your repository for production with:**
- Professional issue and PR templates
- Automated CI/CD workflows
- Security scanning and protection
- Community engagement features
- Release management automation

---

## 📊 **Why Profolio?**

### **🏠 Self-Hosted Benefits:**
- ✅ **Complete Privacy:** Your financial data stays on your server
- ✅ **No Subscriptions:** One-time setup, no recurring fees
- ✅ **Full Control:** Customize and extend as needed
- ✅ **Homelab Ready:** Perfect for Proxmox and homelab setups

### **💼 Professional Features:**
- ✅ **Multi-Asset Support:** Stocks, crypto, real estate, bonds
- ✅ **Real-Time Data:** Live market integration
- ✅ **Advanced Analytics:** Performance tracking and risk analysis
- ✅ **Modern Interface:** Professional, responsive design

---

## 🏷️ **Similar Projects**

If you like self-hosted financial tools, you might also enjoy:
- [Portfolio Performance](https://github.com/portfolio-performance/portfolio) - Desktop portfolio tracker
- [Maybe Finance](https://github.com/maybe-finance/maybe) - Open source personal finance
- [Actual Budget](https://github.com/actualbudget/actual) - Self-hosted budgeting

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Built for the **self-hosted** and **homelab** community
- Inspired by the **Proxmox Helper Scripts** ecosystem
- Designed for **privacy-focused** financial management

---

## 📞 **Support**

- 🐛 **Issues:** [GitHub Issues](https://github.com/Obednal97/profolio/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Obednal97/profolio/discussions)
- 📧 **Contact:** Create an issue for support

---

**🚀 Built with ❤️ by [Ollie Bednal](https://github.com/Obednal97) for the self-hosted community**
