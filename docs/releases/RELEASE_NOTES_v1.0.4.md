# Release Notes - v1.0.4

Released: 2025-01-31

## 🎯 Release Highlights

This major release introduces **Installer v2.0** - a complete overhaul of our installation system with automatic rollback protection and version control capabilities. Never worry about failed updates again!

## ✨ New Features

### 🚀 Installer v2.0 - Complete Overhaul

The installer has been completely rebuilt from the ground up with enterprise-grade features:

#### Automatic Rollback Protection
- **Git-based restoration**: Tracks exact commit hashes before updates
- **Filesystem backup**: Full application backup as fallback option  
- **Automatic failure detection**: Monitors all update steps
- **Service restoration**: Automatically restores services after rollback
- **Credential preservation**: Database passwords and API keys maintained

#### Version Management System
- Install/update to specific versions: `--version v1.0.3`
- Support for multiple formats: `v1.0.3`, `1.0.3`, `main`, `latest`
- Interactive version selection wizard
- List all available versions: `--list-versions`
- Force version installation: `--force-version`

#### Enhanced Command Line Interface
```bash
# Install specific version
./install-or-update.sh --version v1.0.3

# List available versions
./install-or-update.sh --list-versions

# Manual rollback
./install-or-update.sh --rollback

# Unattended installation
./install-or-update.sh --auto

# Skip rollback protection (not recommended)
./install-or-update.sh --no-rollback
```

### Production Safety Features

- **Multi-step verification**: Service status, API connectivity, frontend accessibility
- **Automatic cleanup**: Keeps only 2 most recent rollback files
- **Enhanced error handling**: Graceful network failure management
- **Progress indicators**: Clear status messages throughout process

## 🔧 Technical Improvements

### Installer Architecture
- Modular function design for maintainability
- Comprehensive error handling and reporting
- Intelligent credential detection and preservation
- Dynamic completion banners based on operation type

### Rollback System
- Creates restore point before any changes
- Backs up entire application directory
- Tracks git commit for precise restoration
- Automatic rollback on any failure
- Manual rollback always available

## 📚 Documentation Updates

- **INSTALLER_V2_FEATURES.md**: Complete technical documentation
- **QUICK_START_V2.md**: User-friendly quick start guide
- **Enhanced help system**: Built into installer with `--help`

## 🔄 Migration Guide

No migration needed! The new installer is fully backward compatible:

1. Existing installations will be automatically detected
2. Your data and settings are preserved
3. Rollback protection is enabled by default
4. Version management works with all previous releases

## 📦 Installation

Fresh installation remains the same:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

## 🔄 Updating

Update to latest version:
```bash
./install-or-update.sh
```

Update to specific version:
```bash
./install-or-update.sh --version v1.0.3
```

## 🛡️ Rollback Protection

If an update fails, the installer will automatically:
1. Detect the failure
2. Stop the update process
3. Restore previous version
4. Restart services
5. Verify restoration success

Manual rollback is always available:
```bash
./install-or-update.sh --rollback
```

## 🙏 Acknowledgments

Thanks to our community for requesting these enterprise features, especially the automatic rollback functionality that has made deployments significantly safer.

## 📊 Statistics

- **150+ lines** of new rollback code
- **10+ new command options**
- **100% backward compatible**
- **Zero downtime** rollback capability 