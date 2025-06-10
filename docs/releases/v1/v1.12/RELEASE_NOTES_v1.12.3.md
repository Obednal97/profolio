# Release Notes - v1.12.3

**Released**: 10th June 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

- **🔧 Smart Launcher Logic**: Enhanced install.sh launcher with intelligent local file detection and remote fallback
- **📁 Universal Compatibility**: Works on fresh systems, existing installations, and older versions without manual intervention
- **🛠️ Missing File Resolution**: Automatically downloads latest installer when local files are missing
- **⚡ Production Server Fix**: Resolves "No such file or directory" errors on older installations

## 🐛 **Critical Bug Fixes**

### **Launcher Script File Detection**

- **Issue**: install.sh launcher blindly called local installer files without checking if they exist
- **Impact**: "bash: line 19: /opt/profolio/scripts/installers/install-or-update.sh: No such file or directory"
- **Affected Systems**: v1.8.0+ servers and fresh installations missing scripts/installers/ directory
- **Resolution**: Added intelligent local file existence checks before execution
- **Result**: Universal installation compatibility across all system states

### **Missing Directory Structure Support**

- **Issue**: Older installations lack the updated scripts/installers/ directory structure
- **Impact**: Installation failures on legitimate production servers
- **Root Cause**: Launcher assumed local installer files were always present
- **Resolution**: Added automatic fallback to download latest installer from repository
- **Result**: Seamless updates from any Profolio version

## 🔧 **Technical Improvements**

- **Smart Launcher Architecture**: Enhanced install.sh with modular functions for standard and Proxmox installation paths
- **File System Intelligence**: Robust local file detection before attempting script execution
- **Remote Fallback System**: Seamless download and execution of latest installer when local files are missing
- **Error Prevention**: Eliminates bash execution errors for missing local script files
- **Universal Compatibility**: Single launcher works across all installation states and versions

## 🛡️ **Security & Compatibility**

- **No Security Impact**: Pure installation process improvement with no security implications
- **Full Backward Compatibility**: All existing installations continue to work as before
- **Forward Compatibility**: Launcher works with all future installer updates
- **Production Safety**: Enhanced reliability for production server updates

## 📦 **Installation & Updates**

Update your Profolio installation to v1.12.3:

```bash
# Now works universally on all installation states!
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**Perfect for**: Fresh installations, existing installations, and older versions (v1.8.0+) that were missing the updated directory structure.

## 📊 **Release Statistics**

- **Type**: Patch Release (v1.12.2 → v1.12.3)
- **Commits**: 1 commit with launcher logic enhancement
- **Files Changed**: 1 file (install.sh)
- **Lines Changed**: 26 lines added (smart file detection functions)
- **Issue Severity**: Critical production installation blocker
- **Resolution Time**: Same-day hot-fix for universal compatibility
- **Impact**: Enables installation/updates from any system state
- **Compatibility**: 100% backward compatible, enhanced forward compatibility

---

**Note**: This version includes automatic PWA cache invalidation. Users will receive fresh updates without manual cache clearing.
