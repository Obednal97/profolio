# 🚀 Profolio - Professional Portfolio Management

Self-hosted, privacy-focused portfolio management platform built with Next.js and NestJS.

## 🏗️ **Deployment Options**

Profolio supports **two deployment modes** from the same codebase:

### 🏠 **Self-Hosted** (Recommended for Privacy)
- ✅ **Local database authentication** (PostgreSQL + JWT)
- ✅ **Complete data privacy** (everything stays on your server)
- ✅ **No external dependencies** (works offline/air-gapped)
- ✅ **Username/password authentication**
- ✅ **Demo mode** for testing

### ☁️ **SaaS/Cloud** (Managed Hosting)
- ✅ **Firebase authentication** with social providers
- ✅ **Google/GitHub sign-in** support
- ✅ **Managed infrastructure**
- ✅ **Automatic updates and backups**

---

## 📦 **Installation**

### 🏠 **Proxmox LXC Container** (Recommended for Proxmox users)

**Automatic container creation and installation:**

```bash
# Run directly on Proxmox host - it will detect and offer container creation
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

**What happens automatically:**
- ✅ **Detects Proxmox host** and offers container creation
- ✅ **Creates optimized LXC container** (Ubuntu 24.04, 4GB RAM, 2 CPU, 20GB disk)
- ✅ **Configures networking** (DHCP or static IP)
- ✅ **Installs Profolio** inside the container
- ✅ **Provides container access info** and management commands

**Container benefits:**
- 🛡️ **Isolation**: Profolio runs in dedicated environment
- 💾 **Easy backups**: Snapshot entire container
- ⚙️ **Resource management**: Dedicated CPU/memory allocation
- 🔄 **Migration**: Move container between Proxmox hosts

### 🚀 **One-Command Installation**

**Quick start for Ubuntu/Debian:**

```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

**Manual download:**
```bash
wget https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh
chmod +x install-or-update.sh
sudo ./install-or-update.sh
```

### 🎛️ **Installation Modes**

The installer offers **two experience levels**:

#### **Default Mode** (Recommended)
- ✅ **One-click setup** with sensible defaults
- ✅ **Smart version detection** (latest stable or rebuild if current)
- ✅ **Automatic environment preservation** (Firebase credentials safe)
- ✅ **Rollback protection** enabled by default

#### **Advanced Mode** (Full Control)
- 🔧 **Choose action**: Update, rebuild, version select, or repair
- 📦 **Version selection**: Any release version or development branch
- 🛡️ **Environment options**: Preserve or reset configuration
- 🔄 **Rollback control**: Enable/disable automatic rollback

### 🔄 **Update Options**

**Simple Update:**
```bash
sudo ./install-or-update.sh
```

**Advanced Options:**
```bash
# Install specific version
sudo ./install-or-update.sh --version v1.2.1

# Update to development version
sudo ./install-or-update.sh --version main

# List available versions
sudo ./install-or-update.sh --list-versions

# Disable rollback protection
sudo ./install-or-update.sh --no-rollback

# Emergency rollback
sudo ./install-or-update.sh --rollback

# Unattended installation
sudo ./install-or-update.sh --auto
```

### 🔒 **Security Features**

- 🛡️ **Environment Preservation**: Firebase credentials automatically protected during updates
- 🔄 **Automatic Rollback**: Git-based restoration on failed updates
- 💾 **Backup Management**: Automatic backups with retention policies
- 🔐 **Permission Handling**: Secure file ownership and permissions

### 🌐 **Offline Installation**

For air-gapped or offline environments, see our [**Offline Installation Guide**](docs/installation/OFFLINE_INSTALLATION.md).

Quick offline setup:
```bash
# On internet-connected machine
git clone --depth 1 https://github.com/Obednal97/profolio.git
tar -czf profolio-offline.tar.gz profolio/

# Transfer to offline machine and extract
tar -xzf profolio-offline.tar.gz
cd profolio
sudo ./scripts/offline-install.sh
```

---

## 🎮 **Try Demo Mode**

Experience Profolio without creating an account:

1. Visit your installation or [demo.profolio.com](https://demo.profolio.com)
2. Click **"Try Demo"** on the sign-in page
3. Explore with sample portfolio data

---

## 🔧 **Configuration**

### **Self-Hosted Mode**
```bash
# Force self-hosted authentication
export NEXT_PUBLIC_AUTH_MODE=local
export NEXT_PUBLIC_API_URL=http://localhost:3001
```

### **SaaS Mode** 
```bash
# Enable Firebase authentication
export NEXT_PUBLIC_AUTH_MODE=firebase
export NEXT_PUBLIC_API_URL=https://api.your-domain.com

# Add Firebase configuration
cp frontend/public/firebase-config.json.template frontend/public/firebase-config.json
# Edit with your Firebase project details
```

### **Automatic Detection**
The system automatically detects the appropriate authentication mode:
- **Local mode**: If no Firebase config or running on localhost
- **Firebase mode**: If Firebase config is available and not localhost

---

## 🎯 **Core Features**

### **Portfolio Management**
- 📈 **Multi-asset support** (stocks, crypto, real estate, bonds)
- 💹 **Real-time market data** with Yahoo Finance integration
- 📊 **Performance analytics** and risk assessment
- 🎨 **Interactive charts** and visualizations

### **Financial Tracking**
- 💰 **Expense management** with bank statement import
- 🏠 **Property portfolio** management
- 📋 **P&L analysis** and reporting
- 💎 **Asset diversification** tracking

### **Privacy & Security**
- 🔐 **AES-256-GCM encryption** for sensitive data
- 🔑 **JWT authentication** with secure sessions
- 🛡️ **Input validation** and SQL injection protection
- 🏠 **Complete data sovereignty** (self-hosted)

---

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   NestJS        │    │  PostgreSQL     │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Unified Auth    │    │ Market Data     │    │ File Storage    │
│ (Local/Firebase)│    │ (Yahoo Finance) │    │ (Local/Cloud)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Tech Stack:**
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma ORM, JWT
- **Database**: PostgreSQL with automatic migrations
- **Authentication**: Unified (Local DB + JWT or Firebase)
- **Real-time Data**: Yahoo Finance API integration

---

## 🚀 **Development**

### **Prerequisites**
```bash
node >= 18.0.0
npm >= 8.0.0
postgresql >= 13
```

### **Local Development**
```bash
# Clone repository
git clone https://github.com/Obednal97/profolio.git
cd profolio

# Install dependencies
npm install

# Setup environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start database
sudo systemctl start postgresql

# Run development servers
npm run dev:backend    # http://localhost:3001
npm run dev:frontend   # http://localhost:3000
```

### **Environment Variables**

**Backend** (`backend/.env`):
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/profolio"
JWT_SECRET="your-super-secret-jwt-key"
API_ENCRYPTION_KEY="your-api-encryption-key"
PORT=3001
NODE_ENV=development
```

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_MODE=local
```

---

## 📚 **Documentation**

- **[Installation Guide](docs/installation.md)** - Detailed setup instructions
- **[API Documentation](docs/api.md)** - Backend API reference
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute
- **[Architecture Overview](docs/architecture.md)** - Technical deep dive

---

## 🤝 **Contributing**

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### **Code Quality**
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier
- ✅ Automated testing
- ✅ Security scanning

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 **Links**

- **🌐 Website**: [profolio.com](https://profolio.com)
- **📖 Documentation**: [docs.profolio.com](https://docs.profolio.com)  
- **💬 Community**: [GitHub Discussions](https://github.com/Obednal97/profolio/discussions)
- **🐛 Issues**: [GitHub Issues](https://github.com/Obednal97/profolio/issues)
- **📧 Contact**: [hello@profolio.com](mailto:hello@profolio.com)

---

**Built with ❤️ for the open source community**
