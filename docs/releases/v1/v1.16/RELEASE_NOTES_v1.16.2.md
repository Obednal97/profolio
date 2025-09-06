# Release Notes - v1.16.2

**Release Date**: 2025-09-06  
**Version**: v1.16.2  
**Type**: Hotfix - TUI Compatibility

## 🐛 Bug Fixes

### Terminal User Interface Fixes

- **Removed Emojis**: Eliminated emoji characters that caused display issues in some terminal environments
- **Menu Item Numbers**: Unquoted menu item numbers for proper whiptail/dialog parsing
- **Character Encoding**: Fixed UTF-8 character issues affecting terminal compatibility

## 🔧 Improvements

### Terminal Compatibility

- **Cross-Platform Support**: Enhanced compatibility with various terminal emulators
- **Limited Environments**: Better support for minimal terminal configurations
- **SSH Sessions**: Improved display over remote SSH connections
- **Container Environments**: Fixed display issues in Docker/LXC containers

### Menu System

- **Reliable Selection**: Menu items now properly selectable in all environments
- **Clean Display**: Removed special characters that could corrupt display
- **Consistent Behavior**: Standardized menu behavior across different TUI tools

## 📊 Technical Details

### Changes Made

- Removed emoji characters from menu items
- Unquoted numeric menu selections
- Simplified menu item formatting
- Enhanced terminal detection

### Affected Components

- `profolio.sh`: Main TUI script
- Menu display functions
- Item selection handlers
- Terminal compatibility checks

## 🔄 Breaking Changes

None - Display improvements only

## 📦 Installation

Update to get the improved TUI compatibility:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

## 🎯 Impact

- **Fixed Issues**: Terminal display problems in limited environments
- **Improved Reliability**: Menu navigation works consistently
- **Better Compatibility**: Supports more terminal types
- **User Experience**: Cleaner, more reliable installer interface

## 🔗 Links

- **GitHub Release**: [v1.16.2](https://github.com/Obednal97/profolio/releases/tag/v1.16.2)
- **Commit**: fix: remove emojis and unquote menu item numbers in profolio.sh

---

**Full Changelog**: https://github.com/Obednal97/profolio/compare/v1.16.1...v1.16.2
