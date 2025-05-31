# 🚀 Profolio Installation & Updates

## One-Command Installation/Update System

Profolio includes a smart installer that automatically detects your system state and runs the appropriate setup:

### 🆕 **Fresh Installation**
```bash
# Download and run the installer (Proxmox standard format)
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

> **Note:** This follows the **Proxmox Community Scripts** standard format, similar to Pi-hole, Home Assistant, and other popular self-hosted applications.

**Or clone and run locally:**
```bash
git clone https://github.com/Obednal97/profolio.git
cd profolio
sudo ./install-or-update.sh
```

### 🔄 **Update Existing Installation**
```bash
# Same command - automatically detects existing installation
cd /opt/profolio
sudo ./install-or-update.sh
```

### 🔧 **Repair Broken Installation**
```bash
# Same command - automatically detects and repairs issues
cd /opt/profolio
sudo ./install-or-update.sh
```

## Proxmox Community Standard

### **Familiar Format:**
Our installer follows the **exact same pattern** as other popular Proxmox community scripts:

```bash
# Pi-hole
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/pihole.sh)"

# Home Assistant  
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/homeassistant.sh)"

# Profolio
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### **Why This Format:**
- ✅ **Proxmox Community Standard** - Familiar to Proxmox users
- ✅ **Safe Execution** - Downloads completely before execution  
- ✅ **Error Handling** - Better error reporting than piped execution
- ✅ **Consistent Experience** - Matches other self-hosted applications

## What the Installer Does

### **🆕 Fresh Installation Mode:**
- ✅ Installs system dependencies (Node.js, PostgreSQL, etc.)
- ✅ Creates `profolio` user and database
- ✅ Clones repository to `/opt/profolio`
- ✅ Configures environment automatically
- ✅ Builds backend and frontend
- ✅ Installs and starts systemd services
- ✅ Verifies installation works

### **🔄 Update Mode:**
- ✅ Creates automatic backup (database + application)
- ✅ Safely stops services
- ✅ Updates code from Git repository
- ✅ Updates dependencies
- ✅ Runs database migrations
- ✅ Rebuilds applications
- ✅ Restarts services
- ✅ Verifies update succeeded

### **🔧 Repair Mode:**
- ✅ Reconfigures environment
- ✅ Reinstalls systemd services
- ✅ Attempts to restart services
- ✅ Verifies repair worked

## System Requirements

### **Minimum Requirements:**
- Ubuntu 20.04+ / Debian 11+ (or compatible)
- 2GB RAM
- 10GB disk space
- Root access

### **Recommended:**
- Ubuntu 22.04 LTS
- 4GB RAM
- 20GB disk space
- Dedicated Proxmox LXC container

## After Installation

### **Access Your Profolio:**
- **Frontend:** `http://YOUR_SERVER_IP:3000`
- **Backend API:** `http://YOUR_SERVER_IP:3001`

### **Useful Commands:**
```bash
# Check service status
sudo systemctl status profolio-backend profolio-frontend

# View live logs
sudo journalctl -u profolio-backend -u profolio-frontend -f

# Restart services
sudo systemctl restart profolio-backend profolio-frontend

# Run update
sudo ./install-or-update.sh
```

## Proxmox LXC Setup

### **For Proxmox Users:**

1. **Create LXC Container:**
   - Template: Ubuntu 22.04
   - Memory: 4GB
   - Storage: 20GB
   - Network: Bridged

2. **Run Installation:**
   ```bash
   # Inside the container (Proxmox standard format)
   bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
   ```

3. **Access via Proxmox Network:**
   - Find container IP: `ip addr show`
   - Access: `http://CONTAINER_IP:3000`

## Backup & Recovery

### **Automatic Backups:**
- Created before each update in `/opt/profolio-backups/`
- Includes database dump and full application backup

### **Manual Backup:**
```bash
# Create manual backup
sudo -u postgres pg_dump profolio > /tmp/profolio-backup.sql
sudo tar -czf /tmp/profolio-app-backup.tar.gz /opt/profolio
```

### **Restore from Backup:**
```bash
# Restore database
sudo -u postgres psql profolio < /path/to/backup.sql

# Restore application (if needed)
sudo rm -rf /opt/profolio
sudo tar -xzf /path/to/app-backup.tar.gz -C /
sudo systemctl restart profolio-backend profolio-frontend
```

## Troubleshooting

### **Services Won't Start:**
```bash
# Check logs
sudo journalctl -u profolio-backend -u profolio-frontend -n 50

# Try repair mode
sudo ./install-or-update.sh
```

### **Database Issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
sudo -u postgres psql -c "\l" | grep profolio
```

### **Permission Issues:**
```bash
# Fix ownership
sudo chown -R profolio:profolio /opt/profolio

# Fix permissions
sudo chmod +x /opt/profolio/*/scripts/*.sh
```

## Support

- **GitHub Issues:** [Report bugs and feature requests](https://github.com/Obednal97/profolio/issues)
- **Documentation:** See project README and wiki
- **Self-Hosted Community:** Join discussions about self-hosting