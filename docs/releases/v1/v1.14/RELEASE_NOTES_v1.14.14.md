# Release Notes - v1.14.14

**Released**: 31st August 2025  
**Type**: TUI Configuration Fix  
**Compatibility**: Fully backward compatible

---

## 🔧 **Fixed TUI Double-Prompting Issue**

The TUI installer now properly passes all configuration to the main installer, eliminating the need to answer questions twice.

## 🐛 **Bug Fixed**

### Configuration Not Being Passed from TUI
- **Issue**: After selecting options in TUI, the main installer still prompted for everything again
- **Root Cause**: TUI only passed `--auto` flag without configuration details
- **Fix**: Implemented environment variable passing mechanism for all settings
- **Impact**: Seamless single-configuration flow from TUI to installation

## 📝 **Technical Details**

**Files Modified:** 
- `install-tui.sh` - Exports configuration as environment variables
- `install.sh` - Reads TUI configuration from environment

**Implementation:**
1. **TUI Installer Changes:**
   - Exports all configuration as `PROFOLIO_*` environment variables
   - Passes `--tui-config` flag to indicate configuration is provided
   - Supports all settings: deployment mode, auth mode, optimization, features

2. **Main Installer Changes:**
   - Added `--tui-config` flag handler
   - Reads configuration from environment variables when flag is present
   - Skips interactive prompts when TUI configuration is provided
   - Supports Firebase and Stripe configuration from TUI

**Environment Variables Passed:**
```bash
PROFOLIO_TUI_CONFIG="true"
PROFOLIO_VERSION="<selected_version>"
PROFOLIO_DEPLOYMENT_MODE="<self-hosted|cloud|development>"
PROFOLIO_AUTH_MODE="<local|firebase|both>"
PROFOLIO_OPTIMIZATION="<safe|aggressive|none>"
PROFOLIO_INSTALL_PATH="<installation_directory>"
PROFOLIO_PRESERVE_ENV="<yes|no>"
PROFOLIO_ENABLE_ROLLBACK="<yes|no>"
PROFOLIO_FIREBASE_CONFIG="<firebase_settings>"
PROFOLIO_STRIPE_CONFIG="<stripe_settings>"
PROFOLIO_FEATURES="<selected_features>"
```

## 🚀 **User Experience Improvements**

- **Single Configuration Flow**: Configure once in TUI, installation proceeds automatically
- **No Duplicate Questions**: All settings from TUI are respected by main installer
- **Feature Support**: TUI now properly configures optional features like Stripe and Firebase
- **Update Mode**: TUI update command now works correctly with preservation settings

## 📦 **Installation**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

The TUI installer will now:
1. Collect all configuration through the interactive menu
2. Pass everything to the main installer seamlessly
3. Complete installation without additional prompts

---

**Note**: This completes the TUI installer implementation, providing a smooth, professional installation experience similar to Proxmox community scripts.