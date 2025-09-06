# Profolio Installer - User Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [New Features](#new-features)
3. [Configuration Management](#configuration-management)
4. [System Validation](#system-validation)
5. [Network Configuration](#network-configuration)
6. [Health Monitoring](#health-monitoring)
7. [Diagnostics](#diagnostics)
8. [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Installation
```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash

# Or clone and run locally
git clone https://github.com/Obednal97/profolio.git
cd profolio
sudo ./install.sh
```

### Using the New TUI Menu
When you run the installer, you'll see an enhanced menu system:

```
🚀 Profolio Installer v1.16.0
Select an option:
1) Install/Update Profolio
2) Uninstall Profolio  
3) Backup/Restore ▶
4) System Tools & Diagnostics ▶
5) Advanced Options ▶
6) Config Management ▶
7) Exit
```

Use arrow keys to navigate, Enter to select, and look for ▶ symbols indicating submenus.

## New Features

### 1. Nested Menu Navigation
- Menus with ▶ symbols have submenus
- Select "Back" or press ESC to return to previous menu
- Breadcrumb trail shows your current location

### 2. Back Navigation
Every submenu includes a "Back" option to return to the previous menu without losing context.

## Configuration Management

### Exporting Configuration
Save your current installation settings for reuse:

```bash
# From the menu
Select: Config Management ▶ → Export Configuration

# Command line (coming soon)
sudo ./profolio.sh --export-config my-config.json
```

**Exported configuration includes:**
- Installation paths
- Version settings
- Network configuration
- Resource allocations
- Feature flags

### Importing Configuration
Perfect for automated deployments and CI/CD:

```bash
# From the menu
Select: Config Management ▶ → Import Configuration

# Command line (coming soon)
sudo ./profolio.sh --import-config production.json
```

### Configuration File Format
```json
{
  "version": "1.0",
  "installation": {
    "type": "advanced",
    "version": "v1.16.0",
    "path": "/opt/profolio"
  },
  "resources": {
    "cpu": 2,
    "ram": 4096,
    "disk": 20
  },
  "network": {
    "ipv4": {
      "method": "dhcp"
    },
    "ipv6": {
      "method": "slaac"
    }
  }
}
```

## System Validation

### Resource Checking
Before installation, the system validates:

```bash
# From the menu
Select: System Tools & Diagnostics ▶ → Check System Resources
```

**Checks performed:**
- ✅ CPU cores (minimum 2, recommended 4)
- ✅ RAM (minimum 4GB, recommended 8GB)
- ✅ Disk space (minimum 20GB, recommended 50GB)
- ✅ Kernel version (5.4+)
- ✅ Required packages

### Understanding Results
```
System Resource Validation
==========================
✅ CPU: 8 cores available (Optimal)
✅ Memory: 16384 MB available (Optimal)
⚠️ Disk: 35 GB available (Adequate - Recommended: 50GB)
✅ Kernel: 5.15.0 (Compatible)
```

**Status Indicators:**
- ✅ Green: Requirement met
- ⚠️ Yellow: Warning but can proceed
- ❌ Red: Blocker, must be resolved

## Network Configuration

### Auto-Detection
The installer automatically detects your network configuration:

```bash
# From the menu
Select: System Tools & Diagnostics ▶ → Network Detection
```

**Detected settings:**
- Network interfaces
- IP addresses (IPv4/IPv6)
- Default gateway
- DNS servers
- Network bridges (Docker, Proxmox)
- MTU size
- APT proxy (if configured)

### Manual Configuration
You can override auto-detected settings:

1. Run network detection
2. Review detected settings
3. Choose "Configure manually" to adjust
4. Confirm changes

### IPv6 Support
Full IPv6 support with three modes:
- **SLAAC**: Automatic configuration
- **DHCPv6**: Dynamic configuration
- **Static**: Manual IP assignment

## Health Monitoring

### Running Health Checks
Monitor all Profolio services:

```bash
# From the menu
Select: System Tools & Diagnostics ▶ → Run Health Checks
```

### Health Check Components
```
Service Health Status
=====================
✅ PostgreSQL: Connected (12ms response)
✅ Backend API: Running on port 3001
✅ Frontend: Running on port 3000
✅ Nginx: Active and configured
✅ SSL: Valid certificate (expires in 89 days)
```

### Automatic Monitoring
Health checks run automatically:
- During installation
- After updates
- When troubleshooting issues

## Diagnostics

### Collecting Diagnostic Data
When you need support or troubleshooting:

```bash
# From the menu
Select: System Tools & Diagnostics ▶ → Collect Diagnostics
```

### What's Collected
**With your consent:**
- System information (OS, kernel, hardware)
- Network configuration
- Service status and logs
- Performance metrics
- Configuration (sanitized)

**Privacy protected:**
- ✅ Explicit consent required
- ✅ Sensitive data redacted
- ✅ Passwords/keys removed
- ✅ IPs anonymized (optional)

### Diagnostic Report
```
Diagnostic Report Generated
===========================
Report ID: diag_20250906_143022
Location: /tmp/profolio_diagnostics.tar.gz
Size: 2.3 MB

Contents:
- System information
- Network configuration
- Service status
- Recent logs (last 1000 lines)
- Performance metrics

This report can be shared with support.
```

## Troubleshooting

### Common Issues

#### Installation Fails
1. Run: `System Tools & Diagnostics ▶ → Check System Resources`
2. Address any ❌ red items
3. Retry installation

#### Network Issues
1. Run: `System Tools & Diagnostics ▶ → Network Detection`
2. Verify detected settings are correct
3. Check firewall rules
4. Test connectivity

#### Service Won't Start
1. Run: `System Tools & Diagnostics ▶ → Run Health Checks`
2. Check specific service that's failing
3. Review logs in diagnostic report

#### Performance Problems
1. Run: `System Tools & Diagnostics ▶ → Collect Diagnostics`
2. Review performance metrics section
3. Check resource usage vs. requirements

### Getting Help

#### Self-Service Diagnostics
Most issues can be diagnosed using built-in tools:
1. Health checks identify service problems
2. Resource validator finds system issues
3. Network detector spots connectivity problems

#### Support Channels
If you need help:
1. Collect diagnostics first
2. Share report ID with support
3. GitHub Issues: https://github.com/Obednal97/profolio/issues

### Best Practices

#### Before Installation
- ✅ Run resource validation
- ✅ Check network detection
- ✅ Export config after successful setup

#### Regular Maintenance
- ✅ Run health checks weekly
- ✅ Keep backups current
- ✅ Monitor resource usage

#### Automation
- ✅ Use config files for consistent deployments
- ✅ Integrate health checks in monitoring
- ✅ Schedule diagnostic collection

## Advanced Features

### Demo Mode
Try Profolio without permanent data:
```bash
Select: Advanced Options ▶ → Demo Mode
```

### File Optimization
Choose compression level for assets:
```bash
Select: Advanced Options ▶ → File Optimization
```

Options:
- **None**: No optimization (fastest)
- **Basic**: Minification only
- **Standard**: Minification + compression
- **Maximum**: All optimizations (smallest size)

### Developer Options
Advanced settings for development:
- Verbose logging
- Debug mode
- Skip validation checks
- Force specific versions

## FAQ

**Q: Can I automate installation?**
A: Yes! Export a config file from a successful installation and use it for automated deployments.

**Q: How do I update Profolio?**
A: Run the installer and select "Install/Update". It auto-detects existing installations.

**Q: Is my data safe during diagnostics?**
A: Yes. All sensitive data is redacted, and collection requires explicit consent.

**Q: Can I run health checks via cron?**
A: Yes. Use: `sudo ./profolio.sh --health-check` (command-line support coming soon)

**Q: What if auto-detection gets network settings wrong?**
A: You can manually configure all settings through the network configuration menu.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.16.0 | 2025-09-06 | Added advanced installer features |
| 1.15.4 | 2025-09-05 | Previous stable release |

---

For more information, visit: https://github.com/Obednal97/profolio