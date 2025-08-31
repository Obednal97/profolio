# Release Notes - v1.14.13

**Released**: 31st August 2025  
**Type**: TUI Display Fix  
**Compatibility**: Fully backward compatible

---

## 🔧 **Fixed TUI Menu Display**

The TUI installer menu now displays option descriptions correctly.

## 🐛 **Bug Fixed**

### Menu Options Not Showing
- **Issue**: Whiptail/dialog showed only numbers (1-9) without descriptions
- **Root Cause**: Emoji characters in menu options caused display issues
- **Fix**: Removed emojis for plain text compatibility
- **Impact**: Menu options now display correctly in all terminals

## 📝 **Technical Details**

**File Modified:** `install-tui.sh`

**Changes Made:**
- Removed emoji characters from all menu options
- Fixed extra spacing in menu descriptions
- Ensured compatibility with all terminal encodings

**Before:**
```
1|🚀 Quick Install (Recommended)
2|⚙️  Advanced Install
```

**After:**
```
1|Quick Install (Recommended)
2|Advanced Install
```

## 📦 **Installation**

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"
```

The TUI menu will now display all options clearly:
- Quick Install (Recommended)
- Advanced Install
- Install Specific Version
- Update Existing Installation
- Repair Installation
- Backup Current Installation
- Restore from Backup
- About Profolio
- Exit

---

**Note**: While emojis looked nice, plain text ensures the installer works correctly across all terminal environments and character encodings.