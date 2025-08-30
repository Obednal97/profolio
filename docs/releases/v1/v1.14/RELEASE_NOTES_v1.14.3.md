# Release Notes - v1.14.3

**Released**: 30th August 2025  
**Type**: Hotfix Release  
**Compatibility**: Fully backward compatible

---

## 🚨 **Critical Fix**

This hotfix resolves the TypeScript error that prevented v1.14.2 from building on production servers. The fix was committed after v1.14.2 was tagged, requiring this immediate patch release.

## 🐛 **Bug Fixes**

### TypeScript Build Error
- **Problem**: `'a.current_value' is possibly 'undefined'` in assetManager page
- **Impact**: Complete build failure on production servers
- **Solution**: Added proper null checks for `current_value` in sorting logic

```typescript
// Before (broken):
const perfA = a.purchase_price ? ((a.current_value - a.purchase_price) / a.purchase_price) : 0;

// After (fixed):
const perfA = a.purchase_price && a.current_value ? ((a.current_value - a.purchase_price) / a.purchase_price) : 0;
```

## 🔧 **Additional Improvements**

### Build Quality Assurance
- **Pre-commit Hooks**: Added automatic TypeScript and ESLint checks before commits
- **Release Script**: Enhanced with `--skip-build-errors` flag for emergency releases
- **CI/CD**: Already configured GitHub Actions for continuous validation

## 📦 **Installation & Updates**

Update your Profolio installation to v1.14.3:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**This version will successfully build and deploy on production servers.**

## 📊 **Release Statistics**

- **Files Changed**: 4
- **Critical Issue**: TypeScript error in assetManager
- **Build Status**: ✅ Passes all checks
- **Testing**: Verified build completes successfully

---

**Important**: Update immediately from v1.14.2 to restore production deployment capability.