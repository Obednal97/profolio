# 🏠 Proxmox Installation Guide

**Complete guide for installing Profolio in Proxmox LXC containers**

## 📋 **Overview**

Profolio includes native Proxmox support that automatically detects Proxmox hosts and creates optimized LXC containers for the installation. This approach provides:

- ✅ **Perfect isolation** from the Proxmox host
- ✅ **Easy backup and restore** via container snapshots
- ✅ **Resource management** and allocation
- ✅ **Migration capabilities** between Proxmox hosts

---

## 🚀 **Quick Installation**

### **Automatic Setup (Recommended)**

```bash
# SSH to your Proxmox host and run:
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

**What happens:**
1. 🏠 **Detects Proxmox host** automatically
2. 📋 **Offers container creation** with optimal settings
3. ⚙️ **Configures hardware** based on recommendations
4. 🌐 **Sets up networking** (DHCP or static)
5. 📦 **Downloads Ubuntu 24.04 template** if needed
6. 🏗️ **Creates and configures container**
7. 🚀 **Installs Profolio** inside container

---

## ⚙️ **Container Specifications**

### **Default Configuration**
```bash
# Container Settings
OS Template: Ubuntu 24.04 LTS
Memory: 4096 MB (4GB)
Swap: 512 MB
CPU Cores: 2
Disk: 20 GB
Storage: local-lvm (or your default)
Network: vmbr0 with DHCP

# Security Settings
Unprivileged: Yes
Nesting: Enabled (for Docker support)
Auto-start: Yes
Startup order: 1
```

### **Minimum Requirements**
```bash
Memory: 2048 MB (2GB)
CPU Cores: 1
Disk: 15 GB
Network: Any bridge with internet access
```

### **Recommended for Production**
```bash
Memory: 8192 MB (8GB)
CPU Cores: 4
Disk: 50 GB
Network: Dedicated bridge with static IP
Backup: Daily snapshots
```

---

## 🔧 **Manual Container Creation**

### **Step 1: Download Template**
```bash
# Update template list
pveam update

# Download Ubuntu 24.04 template
pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst
```

### **Step 2: Create Container**
```bash
# Get next available VMID
VMID=$(pvesh get /cluster/nextid)

# Create container
pct create $VMID /var/lib/vz/template/cache/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname profolio \
  --memory 4096 \
  --swap 512 \
  --cores 2 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --features nesting=1 \
  --unprivileged 1 \
  --onboot 1 \
  --startup order=1

# Set root password
pct set $VMID --password

# Start container
pct start $VMID
```

### **Step 3: Install Profolio**
```bash
# Enter container
pct enter $VMID

# Install Profolio
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | bash
```

---

## 🌐 **Network Configuration**

### **DHCP Setup (Default)**
```bash
# Container will get IP automatically from your router
--net0 name=eth0,bridge=vmbr0,ip=dhcp
```

### **Static IP Setup**
```bash
# Replace with your network details
--net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1

# Or configure after creation
pct set $VMID --net0 name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1
```

### **Multiple Network Interfaces**
```bash
# Add additional network interface
pct set $VMID --net1 name=eth1,bridge=vmbr1,ip=10.0.0.100/24

# Useful for separating management and application traffic
```

---

## 💾 **Backup and Restore**

### **Create Snapshots**
```bash
# Create snapshot before updates
pct snapshot $VMID snap-before-update --description "Before Profolio update"

# List snapshots
pct listsnapshot $VMID

# Restore from snapshot if needed
pct rollback $VMID snap-before-update
```

### **Full Container Backup**
```bash
# Backup to local storage
vzdump $VMID --storage local --mode snapshot --compress gzip

# Backup to external storage
vzdump $VMID --storage backup-nfs --mode snapshot --compress lzo

# Scheduled backups (add to crontab)
0 2 * * * vzdump $VMID --storage local --mode snapshot --compress gzip --quiet 1
```

### **Restore Container**
```bash
# Restore from backup file
pct restore $VMID /var/lib/vz/dump/vzdump-lxc-$VMID-*.tar.gz --storage local-lvm

# Restore to different VMID
NEW_VMID=$(pvesh get /cluster/nextid)
pct restore $NEW_VMID /var/lib/vz/dump/vzdump-lxc-$VMID-*.tar.gz --storage local-lvm
```

---

## 🔧 **Container Management**

### **Basic Operations**
```bash
# Container status
pct status $VMID

# Start/stop/restart
pct start $VMID
pct stop $VMID
pct restart $VMID

# Enter container shell
pct enter $VMID

# Execute commands in container
pct exec $VMID -- systemctl status profolio-backend
```

### **Resource Management**
```bash
# Change memory allocation
pct set $VMID --memory 8192

# Change CPU cores
pct set $VMID --cores 4

# Resize disk (can only increase)
pct resize $VMID rootfs +10G

# View resource usage
pct df $VMID
```

### **Configuration Changes**
```bash
# View container config
pct config $VMID

# Enable/disable features
pct set $VMID --features nesting=1,mount=nfs
pct set $VMID --onboot 1

# Change startup order
pct set $VMID --startup order=1,up=30,down=30
```

---

## 🔍 **Monitoring and Logs**

### **Container Health**
```bash
# Check if container is running
pct status $VMID | grep running

# Resource usage
pct df $VMID
pct fsck $VMID

# Network connectivity
pct exec $VMID -- ping -c 3 8.8.8.8
```

### **Profolio Service Status**
```bash
# Check Profolio services
pct exec $VMID -- systemctl status profolio-backend profolio-frontend

# View Profolio logs
pct exec $VMID -- journalctl -u profolio-backend -f
pct exec $VMID -- journalctl -u profolio-frontend -f

# Check listening ports
pct exec $VMID -- netstat -tlnp | grep -E ':(3000|3001)'
```

### **Container Logs**
```bash
# View container kernel logs
dmesg | grep "CT $VMID"

# Check container startup
journalctl -u pve-container@$VMID

# Monitor container resource usage
watch pct list
```

---

## 🔗 **Integration with Proxmox**

### **Web Interface Access**
```bash
# Get container IP
CONTAINER_IP=$(pct exec $VMID -- hostname -I | awk '{print $1}')
echo "Profolio Frontend: http://$CONTAINER_IP:3000"
echo "Profolio Backend: http://$CONTAINER_IP:3001"
```

### **Firewall Configuration**
```bash
# Create firewall rules if needed
# Edit /etc/pve/firewall/cluster.fw or use web interface

# Allow web access
[RULES]
IN ACCEPT -source +management -dport 3000 -proto tcp
IN ACCEPT -source +management -dport 3001 -proto tcp
```

### **Backup Integration**
```bash
# Add to Proxmox backup job
# Datacenter > Backup > Add
# Include container VMID in selection
# Schedule: Daily at 2 AM
# Retention: Keep 7 daily, 4 weekly, 12 monthly
```

---

## ❓ **Troubleshooting**

### **Container Issues**

**Container won't start:**
```bash
# Check container configuration
pct config $VMID

# Check host storage space
df -h

# Check template integrity
ls -la /var/lib/vz/template/cache/

# Try starting with debug
pct start $VMID --debug
```

**Network issues:**
```bash
# Check bridge configuration
ip link show vmbr0

# Test network inside container
pct exec $VMID -- ip addr show
pct exec $VMID -- ping 8.8.8.8

# Reset network configuration
pct exec $VMID -- systemctl restart networking
```

**Performance issues:**
```bash
# Check resource allocation
pct config $VMID | grep -E "(memory|cores|rootfs)"

# Monitor resource usage
watch pct exec $VMID -- free -h
watch pct exec $VMID -- top

# Check I/O wait
pct exec $VMID -- iostat -x 1
```

### **Profolio Issues**

**Services not starting:**
```bash
# Check service status
pct exec $VMID -- systemctl status profolio-backend profolio-frontend

# Check logs
pct exec $VMID -- journalctl -u profolio-backend --no-pager -l
pct exec $VMID -- journalctl -u profolio-frontend --no-pager -l

# Check database connection
pct exec $VMID -- sudo -u profolio psql -h localhost -U profolio -d profolio -c "SELECT 1;"
```

**Can't access web interface:**
```bash
# Check if services are listening
pct exec $VMID -- netstat -tlnp | grep -E ':(3000|3001)'

# Check firewall (inside container)
pct exec $VMID -- ufw status

# Check from Proxmox host
curl -I http://$(pct exec $VMID -- hostname -I | awk '{print $1}'):3000
```

**Database issues:**
```bash
# Check PostgreSQL status
pct exec $VMID -- systemctl status postgresql

# Check database logs
pct exec $VMID -- tail -f /var/log/postgresql/postgresql-*-main.log

# Restart database
pct exec $VMID -- systemctl restart postgresql
```

---

## 📚 **Best Practices**

### **Security**
- ✅ Use unprivileged containers
- ✅ Set strong root passwords
- ✅ Enable auto-updates for security patches
- ✅ Regular backup schedule
- ✅ Monitor resource usage

### **Performance**
- ✅ Allocate adequate memory (4GB minimum)
- ✅ Use SSD storage for better I/O
- ✅ Monitor and adjust resources as needed
- ✅ Keep container filesystem clean

### **Maintenance**
- ✅ Regular snapshots before updates
- ✅ Monitor logs for issues
- ✅ Keep Proxmox host updated
- ✅ Document custom configurations

---

## 🆘 **Support**

- **📖 Profolio Documentation**: [GitHub Repository](https://github.com/Obednal97/profolio)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Obednal97/profolio/issues)
- **💬 Community**: [GitHub Discussions](https://github.com/Obednal97/profolio/discussions)
- **📧 Email**: [hello@profolio.com](mailto:hello@profolio.com)

**For Proxmox-specific issues, please include:**
- Container ID and configuration (`pct config $VMID`)
- Proxmox version (`pveversion`)
- Error logs from both Proxmox host and container
- Network and storage configuration

---

**Ready to transform your Proxmox homelab with professional portfolio management? 🚀** 