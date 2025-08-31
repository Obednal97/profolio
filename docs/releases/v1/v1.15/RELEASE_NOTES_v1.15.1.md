# Release Notes - v1.15.1

**Released**: 31st August 2025  
**Type**: Patch Release - Bug Fixes  
**Compatibility**: Fully compatible with v1.15.0

---

## 🐛 **Bug Fixes**

### Fixed Dependency Installation Error
- Resolved `apt-get install` exit code 100 error during installation
- Separated Node.js repository setup from spinner function to avoid pipe issues
- Improved package installation reliability

### Animated Progress Indicators
- Replaced static lightning bolt (⚡) with animated spinner (/|\-)
- All long-running operations now show visual progress
- Proper cleanup of spinner on completion or error

## 🔧 **Technical Changes**

### Updated Functions in `install-v2.sh`:
- `run_with_spinner()`: Core function for animated progress
- `install_dependencies()`: Fixed Node.js repo setup
- `update_os()`: Now uses spinner animation
- `setup_user()`: Added progress indicator
- `clone_repository()`: Visual feedback during download
- `setup_database()`: Animated database creation
- `build_application()`: Progress for build steps
- `install_application()`: Visual file copying
- `setup_services()`: Spinner for systemd operations
- `setup_nginx()`: Animated web server config
- `cleanup()`: Progress during cleanup

## 📊 **What's Fixed**

| Issue | Before | After |
|-------|--------|-------|
| Dependency Install | Exit code 100 error | Successful installation |
| Progress Display | Static ⚡ icon | Animated spinner |
| Node.js Setup | Failed in spinner | Separate execution |
| User Feedback | No visual progress | Clear animation |

## 🚀 **Installation**

```bash
# Standard installation (with Proxmox-style UI)
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"

# Direct v2 installer
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-v2.sh | sudo bash
```

## ✅ **Testing**

All installer functions have been tested and verified:
- Message functions: ✓
- Color codes: ✓
- Spinner animation: ✓
- Error handling: ✓
- Installation flow: ✓

---

**Note**: This patch release fixes critical installation issues found in v1.15.0 and enhances the user experience with animated progress indicators.