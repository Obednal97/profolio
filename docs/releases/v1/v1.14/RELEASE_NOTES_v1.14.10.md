# Release Notes - v1.14.10

**Released**: 31st August 2025  
**Type**: Installer UX Enhancement  
**Compatibility**: Fully backward compatible

---

## 🚀 **New Installation Method**

We've completely revamped the installation experience to match the smooth, interactive experience of professional tools like Proxmox community scripts.

### New Installation Command:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

## 🎯 **What This Solves**

### Previous Issues:
- ❌ "Argument list too long" error with 4000+ line installer
- ❌ Lost interactivity when piping from curl
- ❌ Couldn't select options or provide input during installation

### Now Fixed:
- ✅ **No size limitations** - Installer can grow without issues
- ✅ **Full interactivity** - Select options, enter input, see progress
- ✅ **Professional UX** - Matches Proxmox community scripts pattern
- ✅ **Works everywhere** - Compatible with all environments

## 🔧 **Technical Implementation**

### Two-Stage Installation:
1. **Lightweight wrapper** (61 lines) - Downloaded via `bash -c`
2. **Main installer** - Downloaded and executed by wrapper

### Key Features:
- Automatic cleanup of temporary files
- Preserves all command-line arguments
- Full stdin availability for user interaction
- Supports both curl and wget

## 📦 **Installation Methods**

### Recommended (Interactive):
```bash
# Full interactive installation
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"

# With sudo if required
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

### Alternative (Review First):
```bash
# Download and review before running
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh -o install.sh
sudo bash install.sh
```

## 🔄 **Other Improvements**

- Removed unnecessary stdin redirection code from main installer
- Cleaned up installation documentation
- Better error messages for non-interactive environments

## 📊 **Release Statistics**

- **Files Added**: 1 (install-wrapper.sh)
- **Files Modified**: 2 (install.sh, README.md)
- **Installation Time**: Under 5 minutes
- **Wrapper Size**: 61 lines (well under system limits)

---

**Note**: This release focuses on improving the installation experience. No changes to the application itself - just a smoother way to get started!