# Release Notes - v1.14.11

**Released**: 31st August 2025  
**Type**: TUI Installer Enhancement  
**Compatibility**: Fully backward compatible

---

## 🎨 **Fixed TUI Installer**

The Terminal User Interface (TUI) installer now works perfectly, providing a professional menu-driven installation experience similar to Proxmox community scripts.

## 🐛 **Bug Fixes**

### TUI Menu Display
- **Issue**: Menu options weren't displaying in whiptail/dialog
- **Root Cause**: Incorrect format - expected "tag|description" but received plain strings
- **Fix**: Updated all menu calls to use proper format
- **Impact**: Menus now display correctly with numbered options

### Mock Implementation
- **Issue**: TUI functions were placeholders that didn't perform real installation
- **Fix**: Integrated TUI with actual install.sh functionality
- **Impact**: TUI now performs real installations, updates, and repairs

## ✨ **New Features**

### Professional TUI Experience
- **Menu-driven interface** with whiptail/dialog support
- **Interactive configuration** through dialogs and input boxes
- **Progress indicators** during installation
- **Version selection** with live fetching from GitHub
- **Advanced options** matching the standard installer

### Complete Feature Parity
All options from the standard installer are now available in TUI:
- 🚀 Quick Install (one-click with defaults)
- ⚙️ Advanced Install (full configuration control)
- 📦 Install Specific Version (with GitHub API integration)
- 🔄 Update Existing Installation
- 🛠️ Repair Installation
- 💾 Backup Current Installation
- 📥 Restore from Backup
- ℹ️ About Profolio

## 🔧 **Technical Details**

**Files Modified:**
- `install-tui.sh` - Complete rewrite to integrate with real installer
- `lib/tui-functions.sh` - Enhanced TUI library functions
- `install-wrapper.sh` - Auto-detects and uses TUI when available

**Key Changes:**
1. Fixed menu format: `"1|Option One"` instead of `"Option One"`
2. Replaced mock functions with real installer execution
3. Added GitHub API integration for version listing
4. Proper argument passing to install.sh based on TUI selections
5. Source TUI library for consistent function usage

## 📦 **Installation Experience**

### With TUI (whiptail/dialog installed):
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```
- Professional menu interface
- Arrow key navigation
- Visual feedback
- Interactive configuration

### Without TUI (fallback):
- Clean CLI prompts
- Still fully functional
- Text-based interaction

## 🎯 **What This Means For You**

### Before v1.14.11:
- TUI showed menus but options were blank
- Selections didn't work
- Only showed mock installation messages

### After v1.14.11:
- ✅ Full menu display with all options visible
- ✅ All selections work correctly
- ✅ Real installation/update/repair functionality
- ✅ Professional experience matching Proxmox scripts

## 📊 **Release Statistics**

- **Bug Fixes**: 2 critical (menu display, mock functions)
- **Files Changed**: 3
- **Lines Modified**: ~490 lines
- **New Features**: Full TUI integration with real installer

---

**Note**: The TUI installer provides the same functionality as the standard installer but with a more user-friendly, menu-driven interface perfect for users who prefer visual navigation over command-line arguments.