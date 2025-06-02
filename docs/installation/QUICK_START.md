# 🚀 Profolio Quick Start Guide

**Get Profolio running in minutes with the enhanced installer**

## 🎯 **Choose Your Path**

### 🟢 **Most Users** → [Default Installation](#-default-installation)
### 🔧 **Power Users** → [Advanced Installation](#-advanced-installation)  
### 🌐 **Air-Gapped** → [Offline Installation](OFFLINE_INSTALLATION.md)

---

## 🟢 **Default Installation**

**Perfect for most users who want a quick, reliable setup**

### **1. One Command Installation**
```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

### **2. Choose Default Mode**
When prompted, select **Default Mode** (option 1) for:
- ✅ Smart version detection (latest stable or rebuild)
- ✅ Environment preservation (Firebase safe)
- ✅ Rollback protection (automatic on failure)
- ✅ Sensible defaults (one confirmation and go!)

### **3. Access Your Instance**
```
Frontend: http://YOUR_SERVER_IP:3000
Backend:  http://YOUR_SERVER_IP:3001
```

**That's it!** 🎉 Your Profolio instance is ready.

---

## 🔧 **Advanced Installation**

**For users who want full control over the installation process**

### **1. Download Installer**
```bash
wget https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh
chmod +x install-or-update.sh
sudo ./install-or-update.sh
```

### **2. Choose Advanced Mode**
Select **Advanced Mode** (option 2) to configure:

**Action Options:**
- 🆕 Update to latest stable (recommended for older versions)
- 🔄 Rebuild current version (if you have latest)
- 📦 Select specific version (e.g., v1.2.0, main)
- 🛠️ Repair installation (fix broken services)

**Environment Options:**
- ✅ Preserve existing config (keeps Firebase credentials)
- 🆕 Reset to defaults (fresh environment)

**Safety Options:**
- 🛡️ Rollback protection (recommended - auto-rollback on failure)
- ⚡ Fast mode (disable rollback for speed)

### **3. Review and Confirm**
The installer shows a summary of all your choices:
```
📋 UPDATE SUMMARY
════════════════════════════════════════
Action: Update to latest stable version
Target Version: 1.2.1
Environment Preservation: yes
Rollback Protection: yes
```

Choose: **Proceed**, **Change settings**, or **Cancel**

---

## 📋 **Version Management**

### **Install Specific Versions**
```bash
# Install latest stable
sudo ./install-or-update.sh --version latest

# Install specific release
sudo ./install-or-update.sh --version v1.2.1

# Install development version
sudo ./install-or-update.sh --version main

# List all available versions
sudo ./install-or-update.sh --list-versions
```

### **Update Options**
```bash
# Simple update (uses wizard)
sudo ./install-or-update.sh

# Unattended update
sudo ./install-or-update.sh --auto

# Emergency rollback
sudo ./install-or-update.sh --rollback
```

---

## 🔒 **Security Features**

### **Environment Preservation**
Your Firebase credentials are **automatically protected**:
- ✅ Detects existing configuration
- ✅ Preserves during updates  
- ✅ User choice and transparency
- ✅ No more broken authentication

### **Rollback Protection**
If anything goes wrong:
- 🛡️ **Auto-rollback** restores previous working state
- 💾 **Git-based restoration** with backup fallback
- 🔄 **Manual rollback** available anytime
- ✅ **Zero data loss** protection

---

## 🎭 **Demo Mode**

**Try before you configure!**

1. Visit `http://YOUR_SERVER_IP:3000`
2. Click **"Try Demo"** on sign-in page  
3. Explore with sample data for 24 hours
4. Automatic cleanup when session expires

---

## ❓ **Quick Troubleshooting**

### **Common Issues**

**Services Not Starting:**
```bash
# Check status
sudo systemctl status profolio-backend profolio-frontend

# View logs
sudo journalctl -u profolio-backend -f
sudo journalctl -u profolio-frontend -f

# Restart services
sudo systemctl restart profolio-backend profolio-frontend
```

**Permission Errors:**
```bash
# Fix ownership
sudo chown -R profolio:profolio /opt/profolio

# Fix environment permissions
sudo chmod 600 /opt/profolio/frontend/.env.production
sudo chmod 600 /opt/profolio/backend/.env
```

**Firebase Authentication Issues:**
```bash
# Check environment file
cat /opt/profolio/frontend/.env.production

# Should show real Firebase credentials, not template values
# If template values, run: sudo ./fix_firebase_env.sh
```

**Update Failures:**
```bash
# Try automatic rollback
sudo ./install-or-update.sh --rollback

# Check available backups
ls -la /opt/profolio-backups/

# Manual service restart
sudo systemctl daemon-reload
sudo systemctl restart profolio-backend profolio-frontend
```

---

## 🔧 **Management Commands**

### **Daily Operations**
```bash
# Check status
sudo systemctl status profolio-backend profolio-frontend

# View logs
sudo journalctl -u profolio-backend -u profolio-frontend -f

# Restart services
sudo systemctl restart profolio-backend profolio-frontend

# Update installation
sudo ./install-or-update.sh
```

### **Backup & Maintenance**
```bash
# Manual backup
sudo -u postgres pg_dump profolio > backup-$(date +%Y%m%d).sql

# Check disk space
df -h /opt

# View backups
ls -la /opt/profolio-backups/
```

---

## 🎯 **Next Steps**

1. **🔐 Create Account**: Set up your admin account
2. **📊 Add Assets**: Start tracking your portfolio
3. **⚙️ Configure APIs**: Add Trading 212 or other integrations
4. **📱 Explore Features**: Try expense management, property tracking
5. **🔄 Set Up Backups**: Schedule regular database backups

---

## 🆘 **Get Help**

- **📖 Documentation**: [README.md](../../README.md)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Obednal97/profolio/issues)
- **💬 Community**: [GitHub Discussions](https://github.com/Obednal97/profolio/discussions)
- **📧 Email**: [hello@profolio.com](mailto:hello@profolio.com)

---

**Ready to take control of your portfolio? Let's go! 🚀** 