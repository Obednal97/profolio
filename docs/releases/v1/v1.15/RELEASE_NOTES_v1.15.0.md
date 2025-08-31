# Release Notes - v1.15.0

**Released**: 31st August 2025  
**Type**: Major Release - Proxmox-Style Installer  
**Compatibility**: Fully backward compatible with legacy installers

---

## 🎉 **Major Update: Proxmox Community Script Style Installer**

Profolio now features a completely redesigned installer based on the professional architecture of Proxmox VE community scripts, providing an enterprise-grade installation experience.

## ✨ **New Features**

### Proxmox-Style Installer (`profolio.sh`)
- **Professional TUI**: Clean, menu-driven interface matching Proxmox community scripts
- **Color-Coded Messages**: Visual feedback with ⚡ for progress, ✓ for success, ✗ for errors
- **Progressive Menus**: Intuitive navigation through installation options
- **Advanced Configuration**: Granular control over CPU, RAM, disk allocation
- **Update Management**: Built-in update and repair functions
- **System Detection**: Automatic OS and container environment detection

### Enhanced Messaging System (`install-v2.sh`)
- **msg_info()**: Yellow lightning bolt for ongoing operations
- **msg_ok()**: Green checkmark for completed tasks
- **msg_error()**: Red X for failures with detailed error info
- **Spinner Animation**: Visual progress indicator during long operations
- **Clean Output**: Overwriting progress messages for cleaner display

### Wrapper Script Architecture
- **Single Command**: `bash -c "$(curl -fsSL ...)"`
- **Auto-Detection**: Automatically uses best available installer
- **Fallback Support**: Gracefully falls back to legacy installers if needed
- **Environment Variables**: Configure installation via environment settings

## 🔧 **Technical Implementation**

**New Files:**
- `profolio.sh` - Main Proxmox-style TUI wrapper
- `install-v2.sh` - Core installer with messaging system
- Updated `install-wrapper.sh` - Smart router to appropriate installer

**Key Features:**

1. **Professional UI Flow**:
   ```
   Main Menu → Configuration → Installation → Completion
   ```

2. **Message Format**:
   ```bash
   ⚡ Installing dependencies...
   ✓ Dependencies installed
   
   ⚡ Building application...
   ✓ Build complete
   ```

3. **Error Handling**:
   - Comprehensive error trapping
   - Line-specific error reporting
   - Automatic cleanup on failure
   - Detailed error messages

4. **Menu System**:
   - Install Profolio (Recommended)
   - Update Existing Installation
   - Advanced Installation
   - System Requirements
   - About Profolio

## 🚀 **User Experience**

### Installation Command
```bash
# New Proxmox-style (default)
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"

# Legacy TUI mode
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)" -- --legacy --tui

# Direct non-interactive
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)" -- --no-tui
```

### Features
- **Professional Appearance**: Matches enterprise-grade tools
- **Intuitive Navigation**: Clear menu structure with descriptions
- **Visual Feedback**: Color-coded messages and progress indicators
- **Smart Defaults**: Sensible defaults with override options
- **Complete Control**: Advanced mode for power users

## 📊 **Comparison with Previous Version**

| Feature | v1.14.x | v1.15.0 |
|---------|---------|---------|
| UI Style | Basic TUI | Proxmox-style |
| Message System | Text only | Color + Icons |
| Menu Navigation | Single level | Multi-level |
| Progress Display | Text updates | Animated spinner |
| Error Handling | Basic | Comprehensive |
| Update Function | Separate script | Integrated |

## 🔄 **Migration Guide**

Existing installations are fully compatible. The new installer will:
1. Detect existing installations
2. Offer update or fresh install options
3. Preserve all data and configurations
4. Upgrade to latest version seamlessly

## 📦 **System Requirements**

- **OS**: Ubuntu 20.04+, Debian 11+
- **CPU**: 2+ cores (4 recommended)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 20GB minimum
- **Network**: Internet connection required

## 🎯 **What's Next**

- Cloud deployment templates
- Kubernetes manifests
- Docker compose configurations
- Automated backup solutions
- Multi-node clustering support

---

**Note**: This major release represents a significant upgrade in installation experience, matching the professional quality of enterprise deployment tools while maintaining the simplicity Profolio is known for.