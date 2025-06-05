# Release Notes - Profolio v1.11.2

**Release Date**: 5th June 2025  
**Version**: 1.11.2  
**Type**: Critical Patch Release - Installer Fix

---

## 🚨 **Critical Issue Resolved**

This is a **critical patch release** that fixes a blocking issue preventing new installations of Profolio. All users attempting to install Profolio were encountering 404 errors when trying to download installer scripts.

---

## 🆕 **What's Fixed**

### 🚨 **Missing Installer Scripts Resolution**

#### **Added Missing Entry Point Scripts**

- **install.sh**: Created main installer entry point script that integrates with modular architecture
- **install-proxmox.sh**: Created Proxmox-specific installer entry point for LXC container installations
- **Fixed 404 Errors**: Resolved "curl: (22) The requested URL returned error: 404" when downloading installers
- **Documentation Alignment**: Fixed discrepancy between README installation commands and available files

#### **Modular Architecture Integration**

- **Proper Integration**: Entry point scripts now correctly download and integrate with the modular installer system
- **Git Clone Method**: Switched from individual file downloads to full repository cloning for reliability
- **Module Loading**: Scripts now properly source module-loader.sh to initialize all 14+ installer modules
- **Platform Detection**: Automatic platform detection and routing to appropriate installer modules

### 🔧 **Technical Improvements**

#### **Installation System Enhancements**

- **Bootstrap Integration**: Entry point scripts properly interface with the modular bootstrap system
- **Error Handling**: Comprehensive error messages and troubleshooting guidance
- **Dependency Management**: Automatic git installation if missing
- **Platform Routing**: Correct function calls to platform-specific handlers

#### **Proxmox-Specific Enhancements**

- **Container Optimization**: Enhanced Proxmox installer with LXC container-specific features
- **Environment Variables**: Proper setting of Proxmox optimization flags before module loading
- **Auto-Start Configuration**: Container-specific auto-start and resource optimization
- **Management Integration**: Enhanced Proxmox management features and troubleshooting guidance

---

## 📊 **Release Impact**

### **Critical Issues Resolved**

- ❌ **Before**: `curl -fsSL https://raw.githubusercontent.com/.../install-proxmox.sh | sudo bash` → 404 Error
- ✅ **After**: Same command works perfectly and starts installation process

### **User Impact**

- **Immediate Fix**: All users can now successfully install Profolio using documented commands
- **Zero Downtime**: Existing installations continue to work normally
- **Enhanced Reliability**: More robust installation process with better error handling

---

## 🔧 **Technical Implementation**

### **Entry Point Architecture**

#### **install.sh (Main Installer)**

```bash
# Now properly integrates with modular system
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash

# What it does:
1. Downloads complete modular architecture via git clone
2. Sources module-loader.sh to initialize all modules
3. Detects platform (Ubuntu/Debian/Proxmox/Docker)
4. Calls appropriate platform handler function
5. Provides comprehensive error handling and cleanup
```

#### **install-proxmox.sh (Proxmox LXC Installer)**

```bash
# Enhanced Proxmox-specific installer
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-proxmox.sh | sudo bash

# Additional Proxmox features:
1. Sets Proxmox optimization environment variables
2. Forces Proxmox platform detection
3. Calls handle_proxmox_installation directly
4. Provides container-specific troubleshooting
```

### **Modular System Integration**

- **Proper Sourcing**: Scripts now source `install/module-loader.sh` correctly
- **Function Calls**: Use correct platform handler functions (`handle_ubuntu_platform`, `handle_proxmox_installation`)
- **Dependency Resolution**: Module loader handles all dependencies automatically
- **Bootstrap Compatibility**: Works seamlessly with existing modular bootstrap system

---

## 🛡️ **Security & Reliability**

### **Enhanced Security**

- **Git Clone Verification**: More secure than individual file downloads
- **Error Boundary**: Proper error handling prevents partial installations
- **Cleanup Process**: Automatic cleanup of temporary directories
- **Permission Validation**: Root access verification before starting

### **Improved Reliability**

- **Dependency Checking**: Automatic git installation if missing
- **Platform Detection**: Robust platform detection and fallback handling
- **Module Validation**: Module loader validates all required functions are available
- **Comprehensive Logging**: Detailed logging for troubleshooting

---

## 🚀 **Getting Started**

### **Immediate Use**

The installation commands documented in the README now work immediately:

#### **Ubuntu/Debian Installation**

```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh | sudo bash
```

#### **Proxmox LXC Installation**

```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-proxmox.sh | sudo bash
```

### **Enhanced Features**

- **Automatic Platform Detection**: Installer automatically detects your environment
- **Modular Architecture**: Full access to 14+ installer modules with 90% code reduction
- **Container Optimization**: Proxmox installer provides LXC-specific optimizations
- **Comprehensive Support**: Help options and troubleshooting guidance included

---

## 🔍 **Quality Assurance**

### **Testing Performed**

- ✅ **Integration Testing**: Verified proper integration with modular installer system
- ✅ **Platform Testing**: Confirmed functionality on Ubuntu, Debian, and Proxmox environments
- ✅ **Error Handling**: Tested error conditions and recovery procedures
- ✅ **Function Validation**: Verified all platform handler functions are callable

### **Compatibility**

- ✅ **Existing Installations**: No impact on currently running Profolio instances
- ✅ **Modular System**: Full compatibility with existing modular installer architecture
- ✅ **Platform Support**: Ubuntu 20.04+, Debian 11+, Proxmox LXC containers
- ✅ **Architecture**: Works on x86_64 and ARM64 systems

---

## 📈 **Future Enhancements**

### **Planned Improvements**

- **Version-Specific Installation**: Support for installing specific Profolio versions
- **Offline Installation**: Enhanced offline installation capabilities
- **Custom Configuration**: Pre-installation configuration options
- **Health Checks**: Post-installation validation and health monitoring

---

## 🤝 **Community & Support**

### **Immediate Support**

- **Installation Issues**: Create GitHub issue with [installer] tag
- **Proxmox Questions**: Use [proxmox] tag for container-specific issues
- **Documentation**: Updated installation guides with enhanced troubleshooting

### **Getting Help**

- **GitHub Issues**: https://github.com/Obednal97/profolio/issues
- **Discussions**: https://github.com/Obednal97/profolio/discussions
- **Documentation**: Complete guides in docs/setup/ directory

---

## 📝 **Migration Notes**

### **No Action Required**

- **Existing Users**: No changes needed for currently running installations
- **New Users**: Can immediately use documented installation commands
- **Automatic Benefits**: Enhanced installer reliability for all new installations

### **Upgrade Recommendations**

- **No Application Updates**: This fixes installation only, not the application itself
- **Documentation Review**: Review updated installation documentation for new features

---

## 🎉 **Acknowledgments**

Special thanks to the community members who reported the installation issue and helped identify the missing installer scripts. This critical fix ensures Profolio remains accessible to new users.

---

**⚠️ CRITICAL PATCH RELEASE**: This release immediately resolves the blocking installation issue. All users experiencing 404 errors can now successfully install Profolio using the standard documented commands.

**Download**: Available immediately via git pull  
**Installation**: Use documented curl commands in README  
**Support**: Full documentation and community support available

**Happy Installing!** 🚀✨
