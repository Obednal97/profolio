# Release Notes - v1.14.5

**Released**: 30th August 2025  
**Type**: Hotfix  
**Compatibility**: Fully backward compatible

---

## 🎯 **Overview**

This hotfix release removes an unused test-components page that was causing TypeScript compilation errors during production builds.

## 🐛 **Bug Fixes**

- **Removed Test Components Page**: Deleted the unused `/app/app/test-components/page.tsx` file that was importing a non-existent `FilterValue` type, causing TypeScript compilation failures in production builds

## 🔧 **Improvements**

- **Code Cleanup**: Removed legacy test page that was no longer in use or referenced
- **Build Reliability**: Eliminated TypeScript error that was preventing successful production deployments
- **Reduced Codebase**: Removed unnecessary test code to maintain a cleaner codebase

## 📦 **Installation & Updates**

Update your Profolio installation to v1.14.5:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**This version will successfully build on production servers.**

## 📊 **Release Statistics**

- **Files Changed**: 1 (removed)
- **Issues Resolved**: 1 (TypeScript compilation error)
- **Build Status**: ✅ Production builds now succeed
- **Testing**: Verified build completes successfully without test-components page

---

**Important**: This is a minimal hotfix focused solely on fixing the production build issue. Update from v1.14.4 if experiencing build failures.