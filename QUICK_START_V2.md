# Profolio Installer v2.0 - Quick Start Guide

## 🚀 New Features Summary

**Your production environment now has automatic rollback protection and version control!**

### ✅ **1. Automatic Rollback on Failure**

The installer now automatically rolls back to the previous working version if anything goes wrong during an update.

```bash
# This will automatically rollback if the update fails
sudo ./install-or-update.sh
```

**What happens:**
- ✅ Creates rollback point before starting
- ✅ Detects any failure during update
- ✅ Automatically restores previous version
- ✅ Restarts services with working version
- ✅ Preserves all your data and settings

### ✅ **2. Version-Specific Installation**

You can now install or update to any specific version.

```bash
# Install specific version
sudo ./install-or-update.sh --version v1.0.3

# Update to older version (downgrade)
sudo ./install-or-update.sh --version v1.0.2

# Install latest development version
sudo ./install-or-update.sh --version main

# See all available versions
sudo ./install-or-update.sh --list-versions
```

## 📋 **Common Usage Examples**

### **Production Update (Safest)**
```bash
# Standard update with automatic rollback protection
sudo ./install-or-update.sh
```
This is the **recommended approach** for production systems.

### **Deploy Specific Known-Good Version**
```bash
# Deploy a specific tested version
sudo ./install-or-update.sh --version v1.0.3
```
Perfect for consistent deployments across multiple servers.

### **Emergency Rollback**
```bash
# Manual rollback if you discover issues later
sudo ./install-or-update.sh --rollback
```
Fast recovery when you need to quickly restore the previous version.

### **Test Latest Development**
```bash
# Install cutting-edge features (development only)
sudo ./install-or-update.sh --version main
```

## 🛡️ **Rollback Protection in Action**

**Before v2.0:**
```
❌ Update fails → Manual intervention required → Downtime
```

**With v2.0:**
```
✅ Update fails → Automatic rollback → Services restored → Minimal downtime
```

### **Example Rollback Scenario**

```bash
$ sudo ./install-or-update.sh --version v1.0.3
🚀 PROFOLIO INSTALLER/UPDATER v2.0
✅ Rollback Protection Enabled
🎯 Target Version: v1.0.3

[1/7] Creating rollback point...
✅ Rollback point created: a1b2c3d4
✅ Rollback backup created: /opt/profolio-rollback-20250131_140523

[2/7] Creating system backup...
✅ Backup created

[3/7] Stopping services for update...
✅ Services stopped

[4/7] Downloading version v1.0.3...
✅ Code updated successfully

[5/7] Building application...
❌ Failed to build application

🔄 EXECUTING AUTOMATIC ROLLBACK...
✅ Rolling back to git commit: a1b2c3d4
✅ Git rollback successful
✅ Rebuilding previous version...
✅ Restarting services with previous version...

🎉 ROLLBACK COMPLETED SUCCESSFULLY
✅ Services restored to previous working version
⚠️  Please check logs and investigate the update failure
```

## 🎯 **Version Management Features**

### **List Available Versions**
```bash
$ sudo ./install-or-update.sh --list-versions
🚀 Profolio Available Versions

📋 Available versions:
   • v1.0.4
   • v1.0.3
   • v1.0.2
   • v1.0.1
   • v1.0.0
   • main (latest development)
```

### **Version Selection Wizard**
When updating without specifying a version:

```bash
$ sudo ./install-or-update.sh
Current Version: 1.0.2
Latest Version: 1.0.3

Available options:
  1) Force update (rebuild current version)
  2) Select different version (upgrade/downgrade)
  3) Cancel

Select option [3]: 2

📋 Available versions:
   • v1.0.3
   • v1.0.2
   • v1.0.1
   • main (latest development)

Enter version to install (e.g., v1.0.3): v1.0.1
✅ Version v1.0.1 validated
```

## 🔧 **Advanced Usage**

### **Disable Rollback (Development Only)**
```bash
# For development environments only
sudo ./install-or-update.sh --no-rollback --version main
```

### **Force Version Installation**
```bash
# Skip version existence checks (use with caution)
sudo ./install-or-update.sh --force-version custom-build
```

### **Quick Help**
```bash
# See all available options
sudo ./install-or-update.sh --help
```

## 📊 **Production Benefits**

| Feature | Before v2.0 | With v2.0 |
|---------|-------------|-----------|
| **Update Failure** | Manual recovery | Automatic rollback |
| **Version Control** | Latest only | Any version |
| **Downtime** | Extended | Minimal |
| **Risk** | High | Low |
| **Recovery Time** | Hours | Minutes |

## 🚨 **Troubleshooting**

### **If Rollback Fails**
1. Check manual backup: `/opt/profolio-rollback-*`
2. Restart services: `systemctl restart profolio-backend profolio-frontend`
3. Check logs: `journalctl -u profolio-backend -u profolio-frontend -f`

### **Version Not Found**
Use `--list-versions` to see available versions, or check format:
- ✅ `v1.0.3` or `1.0.3`
- ❌ `version-1.0.3`

## 🎉 **Next Steps**

1. **Try it out**: `sudo ./install-or-update.sh --list-versions`
2. **Update safely**: `sudo ./install-or-update.sh`
3. **Read full docs**: See `INSTALLER_V2_FEATURES.md`

---

**Your production environment is now much safer!** 🛡️

The installer will automatically protect you from failed updates and give you precise control over which version to deploy. 