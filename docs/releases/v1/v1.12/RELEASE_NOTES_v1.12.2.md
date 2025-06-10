# Release Notes - v1.12.2

**Released**: 10th June 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

- **🔧 Critical Installer Fix**: Resolved production server update failures caused by missing git tag synchronization
- **📦 Production Update Reliability**: Eliminated automatic rollbacks during legitimate version updates
- **🏷️ Tag Synchronization**: Fixed installer git fetch commands to properly retrieve all release tags
- **⚡ Immediate Production Impact**: Enables successful updates from v1.8.0+ to latest releases

## 🐛 **Critical Bug Fixes**

### **Production Server Update Failures**

- **Issue**: Installer `git fetch origin` commands missing `--tags` flag
- **Impact**: `error: pathspec 'tags/v1.12.X' did not match any file(s) known to git`
- **Symptoms**: Automatic rollbacks triggered during legitimate updates
- **Resolution**: Added `--tags` flag to all git fetch commands in installer
- **Result**: Production servers can now successfully update to latest releases

### **Git Tag Availability**

- **Issue**: Production servers' local git repositories missing release tags
- **Impact**: Version checkout failures during update process
- **Root Cause**: `git fetch origin` only fetches branch references, not tags
- **Resolution**: Modified all fetch commands to `git fetch origin --tags`
- **Result**: Complete tag synchronization for reliable version switching

### **Installer Rollback Behavior**

- **Issue**: False positive rollback triggers during valid updates
- **Impact**: Updates appeared to fail when installer was working correctly
- **Cause**: Missing tags interpreted as checkout failures
- **Resolution**: Proper tag fetching eliminates false failure scenarios
- **Result**: Reliable installer behavior across all deployment environments

## 🔧 **Technical Improvements**

- **Enhanced Git Operations**: Comprehensive tag fetching in all git operations
- **Installer Robustness**: Improved installer reliability for production deployments
- **Tag Synchronization**: Consistent tag availability across all git fetch operations
- **Version Management**: Reliable version switching for all release tags
- **Update Consistency**: Unified git fetch behavior throughout installer codebase

## 🛡️ **Security & Compatibility**

- **No Security Impact**: Pure installer improvement with no security implications
- **Full Backward Compatibility**: All existing installations unaffected
- **Production Safety**: Enhanced rollback protection still functional
- **Update Reliability**: Improved production update success rate

## 📦 **Installation & Updates**

Update your Profolio installation to v1.12.2:

```bash
# Automatic detection and upgrade (now works reliably!)
./install.sh

# Or download latest installer with fixes
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**Critical Update for Production Servers**: This release fixes the installer issue that was causing update failures and automatic rollbacks. Production servers can now successfully update to latest releases.

## 📊 **Release Statistics**

- **Type**: Patch Release (v1.12.1 → v1.12.2)
- **Commits**: 1 commit with critical installer fix
- **Files Changed**: 1 file (scripts/installers/install-or-update.sh)
- **Lines Changed**: 6 lines modified (git fetch commands)
- **Issue Severity**: Critical production update blocker
- **Resolution Time**: Same-day hot-fix for installer reliability
- **Impact**: Enables successful production server updates
- **Compatibility**: 100% backward compatible
- **Testing**: Installer validation passed, update process verified

---

**Note**: This version includes automatic PWA cache invalidation. Users will receive fresh updates without manual cache clearing.
