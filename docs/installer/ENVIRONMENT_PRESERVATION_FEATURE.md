# Environment Configuration Preservation Feature

## 🔧 Overview

**Version Added:** v1.2.1  
**Problem Solved:** Firebase authentication breaking during updates  
**Status:** ✅ Implemented in installer v2.0+

## 🚨 The Problem

Previously, the installer would **overwrite frontend environment files** during updates, causing:
- ❌ Firebase authentication to break with "API key not valid" errors
- ❌ Loss of custom authentication configurations  
- ❌ Manual reconfiguration required after every update
- ❌ Production downtime while fixing Firebase credentials

## ✅ The Solution

The enhanced installer now **preserves environment configurations** during updates:

### 🔍 **Detection Phase**
- Automatically detects existing environment files (`.env.production`, `.env.local`, `.env`)
- Scans for Firebase credentials (`NEXT_PUBLIC_FIREBASE_*`)
- Identifies authentication mode (`NEXT_PUBLIC_AUTH_MODE`)
- Checks API configurations (`NEXT_PUBLIC_API_URL`)

### 💬 **User Prompt**
When existing configuration is found:
```bash
🤔 Would you like to preserve your existing frontend environment configuration?
   This includes Firebase credentials, authentication mode, and API settings.
   Recommended: Keep existing configuration (press Enter)

Preserve existing environment configuration? [Y/n]: 
```

**Default:** `Y` (preserve existing configuration)

### 🛡️ **Preservation Logic**
- **Yes (default):** Keeps all existing environment variables intact
- **No:** Resets to template configuration with helpful comments
- **Auto-install mode:** Always preserves existing configuration

## 🎯 Supported Environment Variables

The feature preserves all frontend environment variables, with special attention to:

### Firebase Configuration
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=profolio-9c8e0.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=profolio-9c8e0
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=profolio-9c8e0.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=258151466633
NEXT_PUBLIC_FIREBASE_APP_ID=1:258151466633:web:a5223407f9e07a9919a858
```

### Authentication & API Settings
```bash
NEXT_PUBLIC_AUTH_MODE=firebase
NEXT_PUBLIC_API_URL=http://192.168.1.27:3001
NODE_ENV=production
```

## 📋 Usage Examples

### Automatic Preservation (Recommended)
```bash
sudo ./install-or-update.sh
# When prompted, press Enter to keep existing configuration
```

### Force Preservation (Unattended)
```bash
sudo ./install-or-update.sh --auto
# Automatically preserves existing environment configuration
```

### Reset Configuration
```bash
sudo ./install-or-update.sh
# When prompted, type 'n' to reset to template configuration
```

## 🔄 Update Workflow

1. **Backup Creation** - Environment files are backed up
2. **Detection** - Scan for existing configuration
3. **User Prompt** - Ask whether to preserve (default: Yes)
4. **Preservation** - Keep existing variables or create new template
5. **Smart Updates** - Update API URLs if using old localhost references
6. **Rebuild** - Frontend rebuilds with correct environment variables
7. **Verification** - Ensure services start with preserved configuration

## 🚀 Benefits

### For Firebase Users
- ✅ **Zero downtime** during updates
- ✅ **No manual reconfiguration** required
- ✅ **Authentication stays working** throughout update process
- ✅ **Production-safe** update process

### For All Users
- ✅ **Safer updates** with configuration preservation
- ✅ **User choice** between preserve or reset
- ✅ **Automatic API URL updates** when needed
- ✅ **Clear documentation** in generated environment files

## 🛠️ Technical Details

### File Priority
1. `/opt/profolio/frontend/.env.production` (preferred for production)
2. `/opt/profolio/frontend/.env.local` (local development overrides)
3. `/opt/profolio/frontend/.env` (general fallback)

### Smart URL Updates
If preserving configuration, the installer automatically updates:
```bash
# Old reference
NEXT_PUBLIC_API_URL=http://localhost:3001

# Updated to current server
NEXT_PUBLIC_API_URL=http://192.168.1.27:3001
```

### Error Handling
- Invalid configurations are detected and logged
- Fallback to template generation if preservation fails
- Clear error messages guide users to manual fixes

## 🧪 Testing the Feature

### Scenario 1: Firebase User Updates
```bash
# Setup: User has Firebase configured
# Action: Run update
sudo ./install-or-update.sh

# Expected: Firebase credentials preserved, authentication works
```

### Scenario 2: Fresh Installation
```bash
# Setup: No existing environment files
# Action: Run installer
sudo ./install-or-update.sh

# Expected: Template configuration created with helpful comments
```

### Scenario 3: Reset Configuration
```bash
# Setup: User wants to reset Firebase to local auth
# Action: Run update and choose 'n' when prompted
sudo ./install-or-update.sh

# Expected: Template configuration with local auth mode
```

## 📝 Migration Notes

### From Previous Versions
If you experienced Firebase authentication issues after updates:
1. This feature **automatically fixes** the root cause
2. No manual intervention needed for future updates
3. Your Firebase credentials will be preserved going forward

### Best Practices
- ✅ Always use the default "Yes" option for preservation
- ✅ Test authentication after updates (should work automatically)
- ✅ Keep backup of environment files for safety
- ❌ Don't manually edit environment files during updates

## 🔗 Related Issues

- **GitHub Issue:** Firebase authentication breaking during updates
- **Root Cause:** Environment files being overwritten with template values
- **Solution:** Environment preservation with user consent
- **Impact:** Zero-downtime updates for Firebase authentication users 