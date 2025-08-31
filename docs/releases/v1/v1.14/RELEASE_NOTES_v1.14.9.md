# Release Notes - v1.14.9

**Released**: 31st August 2025  
**Type**: Critical Installer Fix  
**Compatibility**: Fully backward compatible

---

## 🚨 **Critical Installer Fix**

This release fixes a critical bug where the installer would overwrite environment files during updates, even when environment preservation was selected. This caused loss of custom configurations like Stripe API keys.

## 🐛 **Bug Fixes**

### Installer Environment File Preservation
- **Issue**: Installer overwrote .env files during updates despite selecting preservation
- **Root Cause**: 
  - Variable name typo (`preserve_frontend_env` vs `preserve_env_config`)
  - Missing preservation logic for root .env
  - Backend .env always recreated without preserving custom settings
- **Fix**: 
  - Fixed variable name consistency
  - Added preservation logic for all environment files
  - Enhanced backend .env handling to preserve custom configurations
- **Impact**: Custom configurations (Stripe, Firebase Admin, etc.) now persist through updates

## 🔧 **Technical Details**

**Files Modified:**
- `install.sh` - Fixed setup_environment function
- `env-templates.md` - Updated documentation to match actual file structure

**Changes Made:**
1. Fixed typo: `preserve_frontend_env` → `preserve_env_config` (line 2175)
2. Added root .env preservation logic when `preserve_env_config=true`
3. Enhanced backend .env to preserve:
   - Stripe configuration (`STRIPE_*` variables)
   - Firebase Admin SDK settings (`FIREBASE_*` variables)
   - Any custom user-added settings
4. Updated env-templates.md to accurately reflect file structure

## 📦 **Installation & Updates**

Update your Profolio installation to v1.14.9:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**Important**: This version ensures your custom environment configurations are preserved during updates when you select "Yes" for environment preservation (default option).

## 🎯 **What This Means For You**

### Before v1.14.9:
- Manual environment changes were lost during updates
- Had to reconfigure Stripe keys after each update
- Custom settings needed to be backed up manually

### After v1.14.9:
- ✅ All custom configurations are preserved
- ✅ Stripe keys persist through updates
- ✅ Firebase Admin SDK settings are maintained
- ✅ Only core credentials are updated when needed

## 📊 **Release Statistics**

- **Critical Issue Fixed**: Installer environment file overwriting
- **Files Changed**: 2 (install.sh, env-templates.md)
- **Lines Modified**: ~165 lines
- **Testing**: Verified preservation logic with comprehensive test script

---

**Note**: This fix is especially important for production deployments with billing features enabled. Your Stripe configuration and other custom settings will now be safely preserved during all future updates.