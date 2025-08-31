# Release Notes - v1.14.15

**Released**: 31st August 2025  
**Type**: TUI Silent Mode Implementation  
**Compatibility**: Fully backward compatible

---

## 🎯 **Complete TUI Experience**

The TUI installer now provides a fully self-contained interface, hiding all output from the underlying installer for a seamless, professional experience similar to Proxmox community scripts.

## ✨ **New Features**

### Silent Mode for Main Installer
- **--silent flag**: Suppresses all console output from main installer
- **Progress Reporting**: Writes installation progress to file for TUI monitoring
- **Error Logging**: Captures errors to separate file for TUI display
- **Automatic Activation**: Silent mode enables automatically when called from TUI

### Enhanced TUI Progress Display
- **Real-time Progress Gauge**: Shows installation progress with whiptail/dialog gauge
- **Live Status Updates**: Displays current installation step in progress bar
- **Error Reporting**: Shows detailed error messages in TUI if installation fails
- **No Console Interruption**: All output stays within TUI interface

## 🔧 **Technical Implementation**

**Files Modified:**
- `install.sh` - Added silent mode support and progress reporting
- `install-tui.sh` - Updated to use silent mode and display progress gauge

**Key Changes:**

1. **Main Installer (`install.sh`)**:
   - Added `SILENT_MODE` flag and `--silent` argument
   - Modified all output functions (info, warn, error, success) to respect silent mode
   - Added `report_progress()` function for TUI communication
   - Suppressed banner and completion messages in silent mode
   - Progress written to `/tmp/profolio-install-progress.log`
   - Errors written to `/tmp/profolio-install-error.log`

2. **TUI Installer (`install-tui.sh`)**:
   - Passes `--silent` flag to main installer
   - Runs installer in background to monitor progress
   - Reads progress file and updates whiptail gauge
   - Shows errors in msgbox if installation fails
   - Maintains complete TUI experience throughout

**Progress File Format:**
```
PROGRESS:current:total:message
```
Example: `PROGRESS:5:10:Building application`

## 🚀 **User Experience Improvements**

- **Professional Interface**: Clean TUI experience without console output interruptions
- **Visual Progress**: Real-time progress gauge shows installation status
- **Better Error Handling**: Errors displayed cleanly in TUI message boxes
- **Consistent Experience**: All interaction stays within whiptail/dialog interface
- **Proxmox-style Installation**: Matches the polished experience of community scripts

## 📦 **Installation**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

The TUI installer now provides:
1. Complete menu-driven configuration
2. Silent background installation
3. Real-time progress monitoring
4. Clean error reporting
5. No console output interruptions

---

**Note**: This completes the TUI installer implementation, providing a professional, polished installation experience that matches enterprise-grade tools like Proxmox community scripts.