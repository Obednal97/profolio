# Release Notes - v1.8.7

**Released**: 3rd June 2025  
**Type**: Critical Hotfix Release  
**Compatibility**: Fully backward compatible

---

## 🚨 **CRITICAL PRODUCTION FIX**

### **Deployment Failures Resolved**
- **Problem**: Production updates were failing with "untracked working tree files would be overwritten by checkout" error
- **Root Cause**: `frontend/package-lock.json` was tracked in repository but exists as untracked file in production environments
- **Solution**: Removed package-lock.json from repository and added to .gitignore to prevent future conflicts
- **Impact**: Production updates now work reliably without automatic rollbacks

---

## 🚨 **Critical Bug Fixes**

- **FIXED: Production Deployment Failures**: Resolved git checkout conflicts preventing successful updates
- **FIXED: Package Lock Conflicts**: Removed environment-specific files from version control
- **FIXED: Installer Rollbacks**: Eliminated automatic rollbacks caused by file conflicts during version switching
- **FIXED: Update Process Reliability**: Restored stable production update mechanism

---

## 🔧 **Technical Improvements**

- **Enhanced .gitignore**: Added `package-lock.json` and `*/package-lock.json` to prevent future tracking
- **Production Compatibility**: Installer now handles environment-specific files correctly
- **Deployment Stability**: Eliminated root cause of failed updates across all deployment scenarios
- **Version Control Hygiene**: Removed files that should be environment-specific

---

## 📦 **Installation & Updates**

### 🚀 **Standard Update**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### 🔍 **Verification**
```bash
# Verify update completes successfully without rollback
# Check that no git conflicts occur during checkout
# Confirm services restart properly after update
```

---

## ⚠️ **Important Notes**

- **Immediate Action Required**: This hotfix resolves critical production deployment issues
- **No Rollbacks**: Updates should complete successfully without triggering automatic rollbacks
- **Environment Files**: package-lock.json files will now be generated locally as intended
- **Future Prevention**: .gitignore updated to prevent similar issues in future releases

---

## 📊 **Release Statistics**

- **Critical Issue**: Production deployment failures resolved
- **Files Removed**: 1 environment-specific file removed from tracking
- **Configuration Updated**: .gitignore enhanced to prevent future conflicts
- **Breaking Changes**: None - fully backward compatible 