# Release Notes - v1.11.4

**Released**: 5th June 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

- **User-Controlled System Updates**: Complete control over system package updates during installation
- **Enhanced Installation Safety**: No more automatic downloads without user consent
- **Comprehensive Test Coverage**: 35+ new tests ensuring reliable functionality
- **Bandwidth & Time Savings**: Skip unnecessary system updates when installing on fresh systems

## ✨ **New Features**

### **Interactive System Update Options**

The installer now provides users with full control over system package updates:

- **Option 1**: Skip system updates entirely (fastest installation)
- **Option 2**: Update package lists only (recommended, minimal download)
- **Option 3**: Full system upgrade (comprehensive, but time-intensive)

### **Platform-Specific Update Controls**

- **Ubuntu/Debian**: Comprehensive update options with dependency resolution
- **Proxmox LXC**: Container-specific update prompts before Profolio installation
- **Emergency Recovery**: Update controls even during emergency installation scenarios

### **Enhanced User Experience**

- Clear explanations of each update option with time and bandwidth impact
- Color-coded prompts (Green/Blue/Yellow) for easy decision making
- Safe defaults ensure smooth installation even with minimal user interaction

## 🐛 **Critical Bug Fixes**

TODO: Add critical fixes with technical details

## 🎨 **UI/UX Improvements**

TODO: Add user experience enhancements

## 🔧 **Technical Improvements**

### **Installation Architecture**

- **Backward Compatibility**: All platforms maintain compatibility with automated deployments
- **Error Handling**: Graceful recovery when update operations fail
- **Input Validation**: Robust handling of user choices with intelligent fallbacks
- **Progress Feedback**: Clear status messages throughout the update process

### **Platform Enhancements**

- **Ubuntu Platform**: Enhanced dependency fixing and package conflict resolution
- **Proxmox Platform**: Optimized container update workflows with conditional command building
- **Emergency Platform**: Update controls integrated into emergency recovery procedures

## 🧪 **Enhanced Test Coverage**

### **New Test Suite**

- **30+ Unit Tests**: Comprehensive testing of optional system update functionality
- **Integration Testing**: Updated platform module integration tests
- **User Experience Testing**: Validation of interactive prompts and user choice handling
- **Security Testing**: Ensures no automatic system modifications without consent

### **Test Architecture Updates**

- Updated all test references for unified installer architecture
- Enhanced function availability testing for new update features
- Comprehensive validation of user choice handling and error scenarios

## 🛡️ **Security & Compatibility**

### **Installation Safety**

- **No Forced Updates**: Completely eliminated automatic system modifications
- **User Consent**: All system changes now require explicit user approval
- **Bandwidth Respect**: Users can avoid large downloads when unnecessary
- **Permission Control**: System updates only occur when specifically requested

### **Cross-Platform Compatibility**

- Consistent behavior across Ubuntu, Debian, Proxmox, and container environments
- Emergency recovery maintains update controls for comprehensive coverage
- Non-interactive deployment support for automated installation scenarios

## 📚 **Documentation**

- Enhanced platform module documentation with update option details
- Updated test architecture documentation for new testing framework
- Comprehensive user choice handling documentation in installation guides

## 🚀 **Performance**

- **Faster Installations**: Skip system updates for quicker Profolio deployment
- **Reduced Bandwidth**: Avoid downloading hundreds of MB when unnecessary
- **Time Efficiency**: Install on fresh systems without lengthy system upgrade delays
- **Resource Optimization**: More efficient container installations with selective updates

## 📦 **Installation & Updates**

Update your Profolio installation to v1.11.4:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

For Proxmox LXC containers:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-proxmox.sh)"
```

Self-hosted installations will detect and install this version automatically.

## 📊 **Release Statistics**

- **Files Modified**: 6 files (3 platform modules, 3 test files)
- **New Test File**: 1 comprehensive unit test suite (200+ lines)
- **Test Coverage**: 35+ new tests for system update functionality
- **Lines Added**: ~500 lines of enhanced functionality and testing
- **Backward Compatibility**: 100% maintained for existing installations

---

**Note**: This version includes automatic PWA cache invalidation. Users will receive fresh updates without manual cache clearing.
