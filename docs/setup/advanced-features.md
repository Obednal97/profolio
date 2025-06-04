# Profolio Installer v2.0 - Advanced Features

**Rollback Protection & Version Control for Production Deployments**

## 🚀 New Features

### 1. **Automatic Rollback on Failure** 🛡️

The installer now automatically creates rollback points before any update and can restore the previous working version if something goes wrong.

#### How it works:
- **Git-based**: Creates a commit hash reference before updates
- **Backup-based**: Creates a full filesystem backup as fallback
- **Automatic**: Triggers rollback automatically when updates fail
- **Manual**: Available via `--rollback` command

#### Rollback scenarios:
- ✅ Build failures
- ✅ Service startup failures  
- ✅ Environment setup failures
- ✅ Database migration failures
- ✅ Network/dependency issues

### 2. **Version-Specific Installation** 🎯

Install or update to any specific version, not just the latest.

#### Supported formats:
- `v1.0.3` - Specific release version
- `1.0.3` - Version without 'v' prefix
- `main` - Latest development version
- `latest` - Latest stable release

## 📋 Command Reference

### Basic Usage
```bash
# Standard installation (latest version)
sudo ./install-or-update.sh

# Quick installation with defaults
sudo ./install-or-update.sh --auto

# Interactive help
sudo ./install-or-update.sh --help
```

### Version Control
```bash
# Install specific version
sudo ./install-or-update.sh --version v1.0.3

# Update to specific version
sudo ./install-or-update.sh --version v1.0.2

# Force version (skip existence check)
sudo ./install-or-update.sh --force-version v1.0.1

# Install latest development version
sudo ./install-or-update.sh --version main

# List all available versions
sudo ./install-or-update.sh --list-versions
```

### Rollback Features
```bash
# Disable rollback protection
sudo ./install-or-update.sh --no-rollback

# Manual rollback to previous version
sudo ./install-or-update.sh --rollback

# Update with specific version and rollback protection
sudo ./install-or-update.sh --version v1.0.2
```

## 🛡️ Rollback Protection Details

### Automatic Rollback Process
1. **Pre-Update Backup**: Creates git commit reference and filesystem backup
2. **Failure Detection**: Monitors each step for failures
3. **Automatic Restore**: Reverts to previous commit or restores from backup
4. **Service Recovery**: Restarts services with previous version
5. **Verification**: Ensures services are running correctly

### Manual Rollback
```bash
# Immediate rollback
sudo ./install-or-update.sh --rollback
```

#### When to use manual rollback:
- After discovering issues post-update
- When automatic rollback didn't trigger
- For emergency restoration scenarios

### Rollback Safety Features
- **Credential Preservation**: Database passwords and API keys maintained
- **Service State**: Preserves systemd service configurations
- **Data Protection**: User data and databases remain intact
- **Multiple Fallbacks**: Git restore → Backup restore → Manual guidance

## 🎯 Version Management

### Available Versions
```bash
# See all available versions
sudo ./install-or-update.sh --list-versions
```

**Output example:**
```
📋 Available versions:
   • v1.0.3
   • v1.0.2  
   • v1.0.1
   • v1.0.0
   • main (latest development)
```

### Version Selection Wizard
When updating an existing installation without specifying a version:

```
Current Version: 1.0.2
Latest Version: 1.0.3

Available options:
  1) Force update (rebuild current version)
  2) Select different version (upgrade/downgrade)  
  3) Cancel
```

### Downgrade Support
```bash
# Downgrade to previous version
sudo ./install-or-update.sh --version v1.0.1

# With rollback protection (recommended)
sudo ./install-or-update.sh --version v1.0.1
```

## 📊 Production Use Cases

### Scenario 1: Safe Updates
```bash
# Update with automatic rollback protection
sudo ./install-or-update.sh
```
- ✅ Latest version installed
- ✅ Automatic rollback on failure
- ✅ Full verification before completion

### Scenario 2: Specific Version Deployment
```bash
# Deploy known stable version
sudo ./install-or-update.sh --version v1.0.2
```
- ✅ Precise version control
- ✅ Consistent deployments
- ✅ Version validation

### Scenario 3: Emergency Rollback
```bash
# Immediate rollback after issues discovered
sudo ./install-or-update.sh --rollback
```
- ✅ Fast recovery
- ✅ Service restoration
- ✅ Minimal downtime

### Scenario 4: Testing/Development
```bash
# Install development version for testing
sudo ./install-or-update.sh --version main --no-rollback
```
- ✅ Latest features
- ✅ Fast iteration
- ✅ Development workflow

## 🔧 Advanced Configuration

### Disable Rollback (Not Recommended)
```bash
sudo ./install-or-update.sh --no-rollback
```

**When to use:**
- Development environments only
- When manual control is preferred
- Testing rollback mechanisms

### Force Version Installation
```bash
sudo ./install-or-update.sh --force-version custom-branch
```

**Use cases:**
- Custom builds
- Development branches
- Emergency patches

## 🚨 Troubleshooting

### Rollback Failed
If automatic rollback fails:

1. **Check logs**: `journalctl -u profolio-backend -u profolio-frontend -f`
2. **Manual restore**: Look for backup in `/opt/profolio-rollback-*`
3. **Service restart**: `systemctl restart profolio-backend profolio-frontend`
4. **Contact support**: Provide rollback logs

### Version Not Found
```bash
# Check available versions
sudo ./install-or-update.sh --list-versions

# Verify version format
sudo ./install-or-update.sh --version v1.0.3  # ✅ Correct
sudo ./install-or-update.sh --version 1.0.3   # ✅ Also correct
```

### Network Issues During Version Check
The installer gracefully handles network failures:
- Falls back to common versions list
- Continues with specified version
- Provides helpful error messages

## 📈 Monitoring & Verification

### Installation Verification
The installer automatically verifies:
- ✅ Service status (backend/frontend running)
- ✅ API connectivity (backend responding)
- ✅ Frontend accessibility
- ✅ Database connectivity

### Post-Installation Checks
```bash
# Check service status
systemctl status profolio-backend profolio-frontend

# View logs
journalctl -u profolio-backend -u profolio-frontend -f

# Test connectivity
curl http://localhost:3001/api/health
curl http://localhost:3000
```

## 🔐 Security Features

### Credential Preservation
- Database passwords maintained across updates
- API keys preserved during rollbacks
- SSH configurations unchanged
- User data protected

### Rollback Security
- Git history maintained for audit trail
- Backup files secured with proper permissions
- Service state tracked for restoration
- User data isolation during updates

## 📝 Changelog

### v2.0 Features Added
- **Automatic Rollback**: Complete failure recovery system
- **Version Control**: Install/update to specific versions  
- **Enhanced UI**: Better progress indicators and status messages
- **Safety Checks**: Version validation and existence verification
- **Manual Operations**: Manual rollback and version listing commands
- **Production Ready**: Comprehensive error handling and recovery

### Backward Compatibility
- ✅ All existing commands work unchanged
- ✅ Configuration files preserved
- ✅ Database schemas maintained
- ✅ Service configurations compatible

---

**Need help?** Use `sudo ./install-or-update.sh --help` for quick reference or create an issue on GitHub. 