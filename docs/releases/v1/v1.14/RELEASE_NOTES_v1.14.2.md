# Release Notes - v1.14.2

**Released**: 30th August 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

This patch release fixes critical ESLint errors that prevented production builds from completing successfully. The v1.14.1 release had all features working but couldn't be deployed to production servers due to strict ESLint rules failing the build process.

## 🐛 **Critical Bug Fixes**

### Production Build Errors
- **Problem**: Build failed with "X is defined but never used" ESLint errors
- **Impact**: Prevented deployment to production servers
- **Solution**: Removed all unused imports and fixed code references

### Specific Fixes
- **Unused Imports**: Removed `mockApi` imports from API routes (assets, expenses, properties)
- **React Warnings**: Fixed unescaped quotes in JSX (replaced with `&apos;` and `&quot;`)
- **Motion References**: Fixed `motion.div` to use proper `MotionDiv` dynamic import
- **Stripe Imports**: Commented out unused `loadStripe` imports in billing pages
- **Modal Code**: Removed duplicate `originStyle` declaration

## 🔧 **Improvements**

### Code Quality
- Cleaned up 21 files removing unused imports and variables
- Added ESLint disable comments for optional props with default values
- Improved code maintainability by removing dead code

### Documentation
- Updated installation command to use interactive bash execution
- Users now get installation options instead of forced defaults

## 🛡️ **Security & Compatibility**

- **No Breaking Changes**: All functionality remains intact
- **Backward Compatible**: Safe to update from any v1.14.x version
- **Core Systems**: Authentication, API routes, and data generation unchanged

## 📦 **Installation & Updates**

Update your Profolio installation to v1.14.2:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

Self-hosted installations will now successfully build and deploy.

## 📊 **Release Statistics**

- **Files Changed**: 21
- **Lines Modified**: ~67 (26 additions, 41 deletions)
- **Build Status**: ✅ ESLint passes, production builds succeed
- **Testing**: Verified on production LXC container

---

**Note**: This is a critical patch for production deployments. Update immediately if you experienced build failures with v1.14.1.