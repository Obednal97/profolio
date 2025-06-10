# Release Notes - v1.12.4

**Released**: 10th June 2025  
**Type**: Patch Release  
**Compatibility**: Fully backward compatible

---

## 🎯 **Release Highlights**

- **🔧 Automatic Database Migration Resolution**: Enhanced installer with intelligent Prisma P3005 baseline handling
- **🗄️ Production Database Compatibility**: Enables seamless updates from v1.8.0+ with existing database schemas
- **⚡ Zero Manual Intervention**: Automatically resolves migration baseline mismatches without user action
- **🛡️ Data Safety**: Maintains data integrity while resolving migration state conflicts

## 🐛 **Critical Bug Fixes**

### **Production Database Migration Failures (P3005)**

- **Issue**: Prisma P3005 error "The database schema is not empty" blocking production updates
- **Impact**: Complete update failure and automatic rollback on existing production databases
- **Root Cause**: Migration baseline mismatch between v1.8.0 database schema and current migration history
- **Resolution**: Added automatic migration baseline resolution with intelligent P3005 detection
- **Result**: Seamless updates from any existing Profolio version with data preservation

### **Enhanced Migration Handler**

- **Feature**: New `run_database_migrations()` function with advanced error handling
- **Intelligence**: Detects P3005 errors and automatically marks existing migrations as applied
- **Safety**: Preserves all existing data while resolving migration state conflicts
- **Recovery**: Robust fallback handling for various database migration scenarios

## 🔧 **Technical Improvements**

- **Advanced Error Detection**: Intelligent parsing of Prisma migration output for P3005 error identification
- **Baseline Automation**: Automatic iteration through all existing migrations for comprehensive baseline resolution
- **Production Safety**: Enhanced error handling with graceful fallback for unexpected migration scenarios
- **Installer Robustness**: More resilient installer that handles complex production database states

## 🛡️ **Security & Compatibility**

- **No Security Impact**: Pure database migration enhancement with no security implications
- **Full Data Preservation**: All existing user data, assets, and configurations preserved during migration resolution
- **Backward Compatibility**: Works with all existing Profolio installations from v1.8.0+
- **Production Safety**: Enhanced production deployment reliability with automatic issue resolution

## 📦 **Installation & Updates**

Update your Profolio installation to v1.12.4:

```bash
# Enhanced installer now handles database migration issues automatically!
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install.sh)"
```

**For Production Servers**: This release specifically resolves the P3005 database migration issue that was blocking v1.8.0+ production server updates.

## 📊 **Release Statistics**

- **Type**: Patch Release (v1.12.3 → v1.12.4)
- **Commits**: 1 commit with database migration enhancement
- **Files Changed**: 1 file (scripts/installers/install-or-update.sh)
- **Lines Changed**: 54 lines added (new database migration handler function)
- **Issue Severity**: Critical production deployment blocker
- **Resolution Impact**: Enables successful production server updates with existing databases
- **Compatibility**: 100% backward compatible, enhanced database migration handling

---

**Note**: This version includes automatic PWA cache invalidation. Users will receive fresh updates without manual cache clearing.
