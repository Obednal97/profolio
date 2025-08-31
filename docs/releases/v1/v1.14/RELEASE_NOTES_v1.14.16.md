# Release Notes - v1.14.16

**Released**: 31st August 2025  
**Type**: Critical TUI Fix  
**Compatibility**: Fully backward compatible

---

## 🐛 **Fixed TUI Silent Mode for Updates**

The TUI installer now properly runs in complete silent mode during updates, preventing the main installer's update wizard from appearing.

## 🔧 **Bug Fixes**

### Update Wizard Appearing in TUI Mode
- **Issue**: Main installer's update wizard still appeared when updating through TUI
- **Root Cause**: Update path didn't check AUTO_INSTALL flag before showing wizard
- **Fix**: Added AUTO_INSTALL checks to skip wizards in update scenarios
- **Impact**: TUI now provides uninterrupted experience for all operations

## 📝 **Technical Details**

**File Modified:** `install.sh`

**Changes Made:**
1. **Update Path Logic**:
   - Added `elif [ "$AUTO_INSTALL" = true ]` branches for update scenarios
   - Skips directly to `update_installation()` when in auto/silent mode
   - Applies to both running and non-running service states

2. **Wizard Functions**:
   - Added early return in `run_update_wizard()` when AUTO_INSTALL is true
   - Added early return in `run_configuration_wizard()` when AUTO_INSTALL is true  
   - Added early return in `run_advanced_setup()` when AUTO_INSTALL is true
   - Prevents any wizard output in silent mode

**Before:**
```bash
# Update path always showed wizard
else
    run_update_wizard
    update_installation
fi
```

**After:**
```bash
# Update path skips wizard in auto mode
elif [ "$AUTO_INSTALL" = true ]; then
    info "Using automatic update configuration"
    update_installation
else
    run_update_wizard
    update_installation
fi
```

## 🚀 **User Experience**

- **Complete Silent Mode**: No installer UI appears when using TUI
- **Seamless Updates**: TUI handles all interaction, installer runs silently
- **Professional Experience**: Matches Proxmox community scripts behavior
- **All Operations Covered**: Fresh install, update, and repair all run silently

## 📦 **Installation**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

The TUI now provides a completely uninterrupted experience for:
- Fresh installations
- Updates to existing installations
- Repair operations
- All configuration scenarios

---

**Note**: This fix ensures the TUI installer provides a truly silent background installation experience, with all user interaction contained within the TUI interface.