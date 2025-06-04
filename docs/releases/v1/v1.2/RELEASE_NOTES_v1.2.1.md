# Release Notes - v1.2.1

Released: 2025-06-02

## 🚨 **CRITICAL INSTALLER FIX** 🚨

This release addresses a **critical production issue** where Firebase authentication would break during installer updates, causing "API key not valid" errors and production downtime.

## 🎯 Release Highlights

- **🔥 Firebase Authentication Protection**: Zero-downtime updates for Firebase users
- **🛡️ Environment Configuration Preservation**: Comprehensive protection of frontend environment variables  
- **📁 Multi-File Support**: Support for `.env.production`, `.env.local`, and `.env` files
- **🤝 User-Friendly Experience**: Interactive prompts with sensible defaults

## 🚨 **Critical Issue Resolved**

### The Problem
- **Installer Bug**: Updates overwrote `.env.production` files with template values
- **Firebase Breakage**: Real Firebase credentials replaced with template placeholders
- **Production Impact**: "API key not valid" errors broke authentication after updates
- **Manual Recovery**: Required manual reconfiguration of Firebase credentials after every update

### The Solution
- **✅ Environment Preservation**: Automatic detection and preservation of existing configurations
- **✅ User Control**: Interactive prompts with clear explanations and "Yes" defaults
- **✅ Zero Downtime**: Firebase authentication continues working during updates
- **✅ Production Safe**: No more authentication breaking in production environments

## ✨ New Features

### Environment Configuration Protection

**Smart Detection:**
- Automatically scans for existing `.env.production`, `.env.local`, and `.env` files
- Detects Firebase credentials (`NEXT_PUBLIC_FIREBASE_*`)
- Identifies authentication mode settings (`NEXT_PUBLIC_AUTH_MODE`)
- Checks API configurations (`NEXT_PUBLIC_API_URL`)

**User-Friendly Prompts:**
```bash
🤔 Would you like to preserve your existing frontend environment configuration?
   This includes Firebase credentials, authentication mode, and API settings.
   Recommended: Keep existing configuration (press Enter)

Preserve existing environment configuration? [Y/n]: 
```

**Preservation Features:**
- **File Priority**: Respects Next.js precedence (`.env.production` → `.env.local` → `.env`)
- **Filename Preservation**: Maintains original file names (e.g., `.env.local` stays `.env.local`)
- **Smart Updates**: Updates API URLs from localhost to server IP while preserving other settings
- **Auto-Preserve Mode**: Unattended installations (`--auto`) automatically preserve configurations

### Enhanced Update Wizard

The update wizard now clearly explains environment protection:

```bash
🔧 Environment Configuration Protection:
   • Firebase credentials will be preserved automatically
   • Authentication settings will be maintained  
   • API configurations will be kept intact
   • You'll be prompted before any environment changes
   Note: This prevents Firebase authentication breaking during updates
```

## 🐛 Bug Fixes

### Fixed: Critical Environment File Overwriting
**Issue**: Installer reset Firebase credentials to template values during updates
**Solution**: Comprehensive environment preservation system with user consent
**Impact**: Eliminates Firebase authentication breaking during updates

### Fixed: Firebase Authentication Breaking  
**Issue**: Production Firebase authentication failed after updates with "API key not valid"
**Solution**: Automatic detection and preservation of existing Firebase configurations
**Impact**: Zero-downtime updates for Firebase authentication users

### Fixed: File Priority Handling
**Issue**: Installer didn't respect Next.js environment file precedence
**Solution**: Proper priority handling (`.env.production` → `.env.local` → `.env`)
**Impact**: Maintains user's preferred environment file structure

### Fixed: Permission Management
**Issue**: Inconsistent file permissions for environment files
**Solution**: Enhanced permission handling for all environment file types
**Impact**: Proper security and ownership for preserved configurations

## 🔧 Technical Improvements

### Detection Algorithm
- Scans for Firebase configuration variables in existing files
- Identifies authentication mode and API settings
- Validates file contents before preservation
- Provides clear feedback on what was detected

### Preservation Logic
- Reads existing environment files completely
- Writes to same filename to maintain user structure
- Updates API URLs intelligently while preserving other settings
- Sets proper file permissions and ownership

### Error Handling
- Graceful handling of invalid configurations
- Clear error messages with recovery guidance
- Fallback to template generation if preservation fails
- Comprehensive logging of preservation actions

### Backward Compatibility
- Works with existing installations without breaking changes
- Maintains all existing installer functionality
- Preserves rollback and version control features
- Compatible with all authentication modes (local, Firebase, demo)

## 📚 Documentation Added

### Environment Preservation Feature Guide
**Location**: `docs/setup/environment-preservation.md`

**Includes**:
- Complete feature overview and problem explanation
- Step-by-step usage examples and scenarios
- Technical implementation details
- Testing instructions and migration notes
- Best practices and troubleshooting

### Enhanced Installer Documentation
- Updated installer guides with preservation feature information
- Clear explanations of file priority and preservation logic
- Examples for different environment file configurations
- Migration guidance for users who experienced authentication issues

## 🔄 Migration Guide

### For Users Who Experienced Firebase Issues
If you previously experienced Firebase authentication breaking after updates:

1. **This Release Fixes the Root Cause**: No manual intervention needed going forward
2. **Future Updates Are Safe**: Your Firebase credentials will be preserved automatically
3. **Just Press Enter**: When prompted during updates, the default "Yes" preserves your configuration

### For New Installations
- Environment files will be created with helpful templates
- Firebase configuration is clearly documented with examples
- Local authentication is the default for privacy-focused deployments

## 📦 Installation

### Fresh Installation
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### Updating from Previous Versions
```bash
sudo ./install-or-update.sh
```

**During the update**, you'll see the new environment preservation prompt. Simply **press Enter** to preserve your existing Firebase configuration.

## 🎯 Impact for Different Users

### Firebase Authentication Users
- **✅ Zero Downtime**: Authentication continues working during updates
- **✅ No Reconfiguration**: Firebase credentials preserved automatically
- **✅ Production Safe**: No more "API key not valid" errors after updates

### Local Authentication Users  
- **✅ Settings Preserved**: Authentication mode and API settings maintained
- **✅ Seamless Updates**: Local configurations preserved during updates
- **✅ User Choice**: Clear prompts for configuration handling

### All Users
- **✅ Better UX**: Clear explanations and sensible defaults
- **✅ Safety Features**: Fallback mechanisms and error handling
- **✅ Documentation**: Comprehensive guides and examples
- **✅ Backward Compatible**: Existing installations continue working

## 🙏 Acknowledgments

Special thanks to users who reported the Firebase authentication issues that led to this critical fix. Your feedback directly resulted in this important improvement that benefits the entire Profolio community.

## 📊 Statistics

- **Files Changed**: 2 (installer script + documentation)
- **Lines Added**: 327+ (preservation logic + documentation)
- **Issues Resolved**: Critical Firebase authentication breaking during updates
- **Impact**: Zero-downtime updates for all Firebase authentication users

---

**This release represents our commitment to production stability and user experience. The environment preservation system ensures that critical authentication configurations are never lost during updates, providing a reliable foundation for production Profolio deployments.** 