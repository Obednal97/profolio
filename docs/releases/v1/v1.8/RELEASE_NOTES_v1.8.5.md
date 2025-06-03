# Release Notes - v1.8.5

**Released**: 3rd June 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible

---

## 🚨 **Critical Installer Fix**

### **Git Conflict Resolution**
- **Problem**: Installer failed with "untracked working tree files would be overwritten by checkout" error during v1.8.4 updates
- **Solution**: Enhanced installer compatibility with production environments where package-lock.json files may differ
- **Impact**: Seamless updates now work reliably across all deployment environments

---

## 🐛 **Bug Fixes**

- **FIXED: Installer Git Conflict**: Resolved "untracked working tree files would be overwritten" error preventing successful updates
- **FIXED: Package Lock Conflicts**: Enhanced installer to properly handle package-lock.json differences in production environments
- **FIXED: Update Process**: Improved robustness of version switching in production deployments

---

## 🔧 **Technical Improvements**

- **Production Compatibility**: Enhanced installer logic to handle file conflicts gracefully
- **Robust Update Process**: Improved error handling and conflict resolution during version updates
- **Environment Flexibility**: Better support for different deployment scenarios and file states

---

## 📦 **Installation & Updates**

### 🚀 **Standard Update**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### 🔍 **Verification**
```bash
# Verify update completed successfully
# Check that services are running properly
# Confirm no git conflicts during update process
```

---

## 📊 **Release Statistics**

- **Files Modified**: Package version updates and installer compatibility
- **Issues Resolved**: 1 critical installer failure  
- **Compatibility**: Enhanced production environment reliability
- **Breaking Changes**: None - fully backward compatible 