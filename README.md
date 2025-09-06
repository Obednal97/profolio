# 🚀 Profolio - Self-Hosted Portfolio Management

**Privacy-focused, enterprise-grade portfolio management platform for self-hosters**

Take control of your financial data with complete privacy and sovereignty. Built with Next.js and NestJS, Profolio delivers professional-grade portfolio management without compromising your data ownership.

---

## ✨ **Why Self-Host Profolio?**

### 🏠 **Complete Data Sovereignty**

- ✅ **Your data stays on your server** - No external dependencies
- ✅ **Works completely offline** - Perfect for air-gapped environments
- ✅ **GDPR/privacy compliant** by design
- ✅ **No vendor lock-in** - Export your data anytime

### 🛡️ **Enterprise-Grade Security**

- 🔐 **AES-256-GCM encryption** for sensitive financial data
- 🛡️ **Circuit breaker patterns** for API resilience
- 🔄 **Automatic rollback protection** for zero-downtime updates
- 🔒 **JWT authentication** with secure session management
- 🚨 **Advanced threat protection** with input validation

### 💰 **Cost-Effective**

- 💵 **No monthly subscription fees** - One-time setup
- 📉 **Low resource requirements** - Runs on minimal hardware
- ⚡ **Optimized performance** - ~500KB installation footprint
- 🔄 **Long-term savings** vs. cloud SaaS solutions

---

## 📦 **One-Command Installation**

### 🚀 **Universal One-Command Installation**

```bash
# Interactive installation with enhanced TUI menu (recommended)
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh)"

# Or direct installation (non-interactive, fastest)
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

**What happens automatically:**

- ✅ **System setup** - PostgreSQL, Node.js, system dependencies
- ✅ **Security hardening** - SSH configuration, firewall rules
- ✅ **Application deployment** - Database, backend, frontend
- ✅ **Service management** - Systemd services with auto-restart
- ✅ **SSL-ready** - Production configuration out of the box

**Enhanced TUI Features (profolio.sh):**

- 📋 **System validation** - Pre-flight checks before installation
- 🌐 **Network auto-detection** - Automatic network configuration
- 💾 **Config import/export** - Save and reuse configurations
- 🔍 **Health monitoring** - Built-in service health checks
- 🔧 **Diagnostics** - Troubleshooting and support tools

### 🏠 **Smart Environment Detection**

**The installer automatically detects and optimizes for your environment:**

🖥️ **Standard Linux Servers** - Ubuntu, Debian, VPS, dedicated servers
🏠 **Proxmox Hosts** - Offers to create optimized LXC container  
📦 **LXC Containers** - Container-optimized deployment
☁️ **Cloud Instances** - AWS, DigitalOcean, Linode, etc.

**Proxmox-specific features** (when running on Proxmox host):

- 🛡️ **Isolation** - Dedicated environment with resource limits
- 💾 **Easy backups** - Snapshot entire container in seconds
- 🔄 **Migration** - Move between Proxmox hosts seamlessly
- ⚙️ **Resource control** - CPU/memory allocation per your needs
- 🚀 **Auto-start on boot** - Services automatically start when container reboots
- 📦 **Container-optimized** - Resource-efficient deployment for LXC environments

### 📥 **Alternative Installation Methods**

```bash
# Method 1: Download and review before running
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/profolio.sh -o profolio.sh
sudo bash profolio.sh

# Method 2: Clone repository and run locally
git clone https://github.com/Obednal97/profolio.git
cd profolio
sudo ./profolio.sh

# Method 3: Using wget instead of curl
wget -qO- https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

### 🎛️ **Advanced Installation Options**

**Universal installer supports all environments with intelligent detection:**

```bash
# Install specific version
sudo ./install.sh --version v1.14.9

# Unattended installation for automation
sudo ./install.sh --auto

# List all available versions
sudo ./install.sh --list-versions

# Emergency rollback (automatic on failures)
sudo ./install.sh --rollback

# Force fresh installation (skip updates)
sudo ./install.sh --fresh

# View all available options
sudo ./install.sh --help
```

---

## 🎯 **Core Features**

### 📈 **Professional Portfolio Management**

- **Multi-asset support** - Stocks, crypto, real estate, bonds, commodities
- **Real-time market data** - Yahoo Finance integration with circuit breaker protection
- **Performance analytics** - ROI, Sharpe ratio, risk assessment, asset allocation
- **Interactive dashboards** - Responsive charts with drill-down capabilities
- **Portfolio comparison** - Benchmark against indices and custom portfolios

### 💰 **Advanced Financial Tracking**

- **Expense management** - Categorized spending with budget tracking
- **Income tracking** - Salary, dividends, rental income, capital gains
- **Tax optimization** - Capital gains/losses tracking for tax planning
- **Multi-currency support** - Automatic currency conversion and tracking
- **Bank statement import** - CSV import with automatic transaction categorization

### 📊 **Professional Reporting**

- **P&L statements** - Detailed profit/loss analysis with time comparisons
- **Asset allocation analysis** - Sector, geography, asset class breakdowns
- **Risk assessment** - Volatility analysis and correlation matrices
- **Custom reports** - Configurable reporting periods and metrics
- **Export capabilities** - PDF, CSV, Excel formats for external use

### 🔒 **Privacy & Security**

- **End-to-end encryption** - All sensitive data encrypted at rest
- **Local authentication** - No external auth dependencies
- **Audit logging** - Complete activity tracking for compliance
- **Data export** - Full data portability in standard formats
- **GDPR compliance** - Built-in privacy controls and data management

---

## 🛡️ **Enterprise-Grade Reliability**

### 🔄 **Advanced Resilience**

- **Circuit breaker patterns** - Automatic failure detection and recovery
- **Graceful degradation** - Continues operating during external API outages
- **Conservative rate limiting** - Prevents API throttling and bans
- **Health monitoring** - Real-time system health with alerts
- **Automatic recovery** - Self-healing from temporary failures

### 🚀 **Zero-Downtime Updates**

- **Automatic rollback** - Git-based restoration on update failures
- **Environment preservation** - API keys and settings protected during updates
- **Version control** - Install any previous version or development builds
- **Service verification** - Automatic testing after updates
- **Backup management** - Automatic backups with retention policies

---

## 🌐 **System Requirements**

### **Minimum Requirements**

- **OS**: Ubuntu 20.04+ / Debian 11+ / Similar Linux distribution
- **RAM**: 2GB (4GB recommended)
- **CPU**: 1 core (2 cores recommended)
- **Storage**: 10GB free space
- **Network**: Internet for initial setup and market data

### **Recommended Production Setup**

- **RAM**: 4GB+ for optimal performance
- **CPU**: 2+ cores for concurrent users
- **Storage**: 20GB+ for historical data and backups
- **SSL**: Let's Encrypt or commercial certificate
- **Firewall**: UFW or iptables configured

### **Supported Platforms**

- ✅ **Ubuntu Server** 20.04, 22.04, 24.04
- ✅ **Debian** 11, 12
- ✅ **Proxmox LXC** containers
- ✅ **Docker** (community maintained)
- ✅ **Air-gapped environments** (offline installation)

---

## 🎮 **Demo Mode**

**Try before you commit - no installation required:**

Experience the full Profolio interface with sample data:

1. **Visit your installation** and click **"Try Demo"**
2. **Explore all features** with realistic portfolio data
3. **Test import/export** capabilities
4. **Evaluate user experience** before creating accounts

> 💡 **Need managed hosting?** If self-hosting feels overwhelming, [**Profolio Cloud**](https://profolio.com) offers the same features with automatic updates, backups, and 24/7 support. **30-day free trial available.**

---

## 🔧 **Configuration & Customization**

### **Environment Configuration**

The installer automatically creates optimized configurations, but you can customize:

```bash
# Backend configuration (/opt/profolio/backend/.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/profolio"
JWT_SECRET="auto-generated-secure-secret"
API_ENCRYPTION_KEY="auto-generated-encryption-key"
PORT=3001

# Frontend configuration (/opt/profolio/frontend/.env.production)
NEXT_PUBLIC_AUTH_MODE=local
NEXT_PUBLIC_API_URL=http://your-server-ip:3001
```

### **SSL/HTTPS Setup**

```bash
# Install SSL certificate (Let's Encrypt)
sudo apt install certbot nginx
sudo certbot --nginx -d your-domain.com

# Or use existing certificates
# Configure nginx proxy in /etc/nginx/sites-available/profolio
```

### **Backup Configuration**

```bash
# Automatic daily backups
sudo crontab -e
0 2 * * * /opt/profolio/backup-script.sh

# Manual backup
sudo systemctl stop profolio-backend profolio-frontend
sudo -u postgres pg_dump profolio > backup-$(date +%Y%m%d).sql
sudo tar -czf profolio-backup-$(date +%Y%m%d).tar.gz /opt/profolio
```

---

## 🚀 **Management & Maintenance**

### **Service Management**

```bash
# Check service status
sudo systemctl status profolio-backend profolio-frontend

# View real-time logs
sudo journalctl -u profolio-backend -u profolio-frontend -f

# Restart services
sudo systemctl restart profolio-backend profolio-frontend

# Auto-start on boot (automatically configured by installer)
sudo systemctl enable profolio-backend profolio-frontend
```

**Note**: The Proxmox installer automatically configures services to start on container reboot, ensuring your Profolio instance is always available after system restarts.

### **Updates & Maintenance**

```bash
# Simple update to latest version
sudo ./install.sh

# Update to specific version
sudo ./install.sh --version v1.14.8

# Check for updates
curl -s https://api.github.com/repos/Obednal97/profolio/releases/latest | grep tag_name

# Health check
curl http://localhost:3001/api/health
```

### **Monitoring & Troubleshooting**

```bash
# System resources
htop                                    # CPU/Memory usage
df -h                                   # Disk space
systemctl --failed                     # Failed services

# Application health
curl http://localhost:3001/api/health   # Backend health
curl http://localhost:3000              # Frontend accessibility
sudo journalctl -u profolio-backend -n 50  # Recent backend logs
```

---

## 🌐 **Offline Installation**

**Perfect for air-gapped environments and secure networks:**

1. **Prepare offline package** on internet-connected machine
2. **Transfer to offline system** via USB/network
3. **Install without internet** using pre-downloaded dependencies

See our [**Offline Installation Guide**](docs/setup/offline-installation.md) for detailed instructions.

---

## 🛠️ **Development & Customization**

### **Local Development Setup**

```bash
# Clone and setup development environment
git clone https://github.com/Obednal97/profolio.git
cd profolio

# Install dependencies (using pnpm for better performance)
cd backend && pnpm install
cd ../frontend && pnpm install

# Start development servers
pnpm run dev:backend    # http://localhost:3001
pnpm run dev:frontend   # http://localhost:3000
```

### **Customization Options**

- **Themes** - Custom CSS/Tailwind configurations
- **Branding** - Logo, colors, company information
- **Features** - Enable/disable specific functionality
- **Integrations** - Custom API connections and data sources
- **Reports** - Custom report templates and calculations

**Need custom development?** Our team offers professional services for custom integrations and enterprise features.

---

## 📚 **Documentation & Support**

### **Comprehensive Guides**

- 📖 **[Setup & Installation](docs/setup/)** - Complete installation guides for all platforms
- 🔧 **[Development](docs/development/)** - Technical documentation for developers
- 🛡️ **[Security Policy](SECURITY.md)** - Security policies and best practices
- 🔄 **[Processes](docs/processes/)** - Development workflows and standards
- ❓ **[Features](docs/features/)** - Feature specifications and technical details

### **Community Support**

- 💬 **[GitHub Discussions](https://github.com/Obednal97/profolio/discussions)** - Community Q&A
- 🐛 **[Issue Tracker](https://github.com/Obednal97/profolio/issues)** - Bug reports and feature requests
- 📄 **[Changelog](CHANGELOG.md)** - Version history and release notes

### **Professional Support**

For production deployments and enterprise requirements:

- **Priority support** via [**Profolio Cloud**](https://profolio.com) subscription
- **Custom development** and integration services
- **Training and onboarding** for teams and organizations
- **SLA-backed hosting** with 99.9% uptime guarantee

---

## 📄 **License & Legal**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**Open source commitment**: Core features will always remain free and open source. Premium cloud features and professional support services help fund continued development.

---

## 🎉 **Ready to Get Started?**

### **Self-Hosted Installation** (5 minutes)

```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

### **Need Managed Hosting?**

**[Try Profolio Cloud](https://profolio.com)** - Same features, zero maintenance

- ☁️ **Automatic updates** and security patches
- 💾 **Daily backups** with point-in-time recovery
- 🛡️ **Enterprise security** and compliance
- 📞 **24/7 support** and 99.9% uptime SLA
- 🚀 **30-day free trial** - No credit card required

---

**Built with ❤️ for privacy-conscious investors and self-hosting enthusiasts**
