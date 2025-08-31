# Release Notes - v1.14.12

**Released**: 31st August 2025  
**Type**: Critical Hotfix  
**Compatibility**: Fully backward compatible

---

## 🔥 **Critical Fix**

Fixed TUI installer crash on startup.

## 🐛 **Bug Fixed**

### Command Not Found Error
- **Issue**: `/tmp/profolio-installer-*/install-tui.sh: line 516: show_message: command not found`
- **Root Cause**: Incomplete function renaming - `show_message` was removed but 4 calls remained
- **Fix**: Replaced all `show_message` calls with `tui_msgbox`
- **Impact**: TUI installer now starts correctly without errors

## 📝 **Technical Details**

**File Modified:** `install-tui.sh`

**Functions Fixed:**
- `version_install()` - Line 265
- `run_backup()` - Line 482  
- `run_restore()` - Line 489
- `main()` - Line 516

**Change:** `show_message` → `tui_msgbox`

## 📦 **Installation**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

---

**Note**: This hotfix resolves the critical error that prevented the TUI installer from running after v1.14.11. Users can now use the TUI installer without issues.