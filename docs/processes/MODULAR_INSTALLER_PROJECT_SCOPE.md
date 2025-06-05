# 🏗️ Modular Installer Architecture - Project Scope

**Project**: Refactor installation scripts into modular, maintainable architecture  
**Branch**: `feature/modular-installer-architecture`  
**Status**: 🟢 **ACTIVE DEVELOPMENT** - Foundation Complete, Core Modules In Progress  
**Created**: January 2025  
**Last Updated**: January 2025

---

## 📋 **Project Overview**

### **Problem Statement**

Currently, we have multiple installer scripts that have diverged significantly:

- `install-or-update.sh` (3,437 lines) - Generic Ubuntu/Debian installer
- `proxmox-install-or-update.sh` (3,619 lines) - Proxmox-specific installer
- Docker files for containerized deployment

**Issues:**

- 🔄 **Code duplication** - Similar functions implemented differently
- 🔀 **Feature divergence** - Proxmox installer has newer features missing from generic installer
- 🛠️ **Maintenance burden** - Updates need to be applied to multiple files
- 📈 **Scalability concerns** - Adding new platforms requires duplicating entire installer logic

### **Desired Outcome**

**Modular, maintainable installer architecture** where:

- ✅ **Single source of truth** for each feature/function
- ✅ **Platform-specific entry points** that orchestrate shared modules
- ✅ **Easy extensibility** for new platforms and features
- ✅ **Consistent user experience** across all installation methods
- ✅ **Reduced maintenance overhead** with DRY principles

---

## 🔍 **Current State Analysis**

### **Function Inventory & Comparison**

#### **📊 Shared Functions (Need to be modularized)**

| Function Category                               | Generic Installer | Proxmox Installer | Status                                             |
| ----------------------------------------------- | ----------------- | ----------------- | -------------------------------------------------- |
| **Core Utils**                                  |                   |                   |                                                    |
| `info()`, `warn()`, `error()`, `success()`      | ✅                | ✅                | ✅ **Extract to utils/logging.sh**                 |
| `show_progress()`, `execute_steps()`            | ✅                | ✅                | ✅ **Extract to utils/ui.sh**                      |
| `validate_version()`, `version_exists()`        | ✅                | ✅                | ✅ **Extract to utils/validation.sh**              |
| **Version Management**                          |                   |                   |                                                    |
| `get_available_versions()`                      | ✅                | ✅                | ✅ **Extract to core/version-control.sh**          |
| `create_rollback_point()`, `execute_rollback()` | ✅                | ✅                | ✅ **Extract to core/rollback.sh**                 |
| `checkout_version()`                            | ✅                | ✅                | ✅ **Extract to core/deployment.sh**               |
| **System Setup**                                |                   |                   |                                                    |
| `setup_environment()`                           | ✅                | ✅                | ✅ **Extract to core/system-setup.sh**             |
| `build_application()`                           | ✅                | ✅                | ✅ **Extract to core/app-build.sh**                |
| `install_systemd_services()`                    | ✅                | ✅                | ✅ **Extract to core/service-setup.sh**            |
| **Configuration**                               |                   |                   |                                                    |
| `run_configuration_wizard()`                    | ✅                | ✅                | ✅ **Extract to features/configuration-wizard.sh** |
| `configure_ssh_server()`                        | ✅                | ✅                | ✅ **Extract to features/ssh-hardening.sh**        |
| `use_defaults()`                                | ✅                | ✅                | ✅ **Extract to utils/config.sh**                  |
| **Optimization**                                |                   |                   |                                                    |
| `optimize_production_deployment()`              | ✅                | ✅                | ✅ **Extract to features/optimization.sh**         |
| `optimize_production_safe()`                    | ✅                | ✅                | ✅ **Extract to features/optimization.sh**         |
| `optimize_production_aggressive()`              | ✅                | ✅                | ✅ **Extract to features/optimization.sh**         |

#### **🔧 Platform-Specific Functions**

| Function                           | Generic | Proxmox | Action Required                                      |
| ---------------------------------- | ------- | ------- | ---------------------------------------------------- |
| **Proxmox Detection & Management** |         |         |                                                      |
| `detect_proxmox_host()`            | ✅      | ✅      | ✅ **Move to platforms/proxmox/detection.sh**        |
| `detect_lxc_container()`           | ✅      | ✅      | ✅ **Move to platforms/proxmox/detection.sh**        |
| `proxmox_container_wizard()`       | ✅      | ✅      | ✅ **Move to platforms/proxmox/container-wizard.sh** |
| `create_proxmox_container()`       | ✅      | ✅      | ✅ **Move to platforms/proxmox/lxc-management.sh**   |
| **Platform Entry Points**          |         |         |                                                      |
| `fresh_install()`                  | ✅      | ✅      | ✅ **Keep in platform entry scripts**                |
| `main()`                           | ✅      | ✅      | ✅ **Keep in platform entry scripts**                |

#### **🆕 Features Missing from Generic Installer**

| Feature                   | Generic | Proxmox | Priority                                           |
| ------------------------- | ------- | ------- | -------------------------------------------------- |
| `update_installer_only()` | ❌      | ✅      | 🔴 **HIGH** - Add to features/installer-updates.sh |
| Enhanced help system      | ❌      | ✅      | 🟡 **MEDIUM** - Improved `show_help()`             |
| Better banner system      | ❌      | ✅      | 🟢 **LOW** - Enhanced UI                           |

### **📊 Complexity Analysis**

**Current Architecture:**

```
Generic Installer: 3,437 lines
├── 40+ functions
├── Version control logic
├── Build & deployment
├── Configuration wizards
├── Optimization features
└── Platform detection (basic)

Proxmox Installer: 3,619 lines
├── 42+ functions (2 unique)
├── Same core logic + Proxmox features
├── Enhanced help system
├── Container management
├── LXC-specific optimizations
└── Advanced platform detection
```

**Code Duplication**: ~90% overlap between installers

---

## 🎯 **Target Architecture**

### **📁 Directory Structure**

```bash
/
├── install-ubuntu.sh           # 🐧 Ubuntu/Debian entry point (~200 lines)
├── install-proxmox.sh          # 🏠 Proxmox entry point (~300 lines)
├── install-docker.sh           # 🐳 Docker entry point (~150 lines)
└── install/                    # 📁 Shared modules directory
    ├── core/                   # 🔧 Core installation logic
    │   ├── system-setup.sh     # Environment setup, dependencies
    │   ├── version-control.sh  # Version management, Git operations
    │   ├── app-build.sh        # Application building, compilation
    │   ├── service-setup.sh    # Systemd services, auto-start
    │   ├── deployment.sh       # App deployment, file management
    │   └── rollback.sh         # Rollback logic, backup management
    ├── features/               # ✨ Optional feature modules
    │   ├── optimization.sh     # Safe vs Aggressive optimization
    │   ├── ssh-hardening.sh    # SSH security configuration
    │   ├── ssl-setup.sh        # Let's Encrypt integration
    │   ├── backup-config.sh    # Automated backup configuration
    │   ├── monitoring.sh       # Health monitoring setup
    │   ├── configuration-wizard.sh # Interactive configuration
    │   └── installer-updates.sh # Self-update functionality
    ├── platforms/              # 🖥️ Platform-specific logic
    │   ├── proxmox/
    │   │   ├── detection.sh    # Host/container detection
    │   │   ├── container-wizard.sh # LXC creation wizard
    │   │   └── lxc-management.sh # Container lifecycle
    │   ├── ubuntu/
    │   │   ├── system-prep.sh  # Ubuntu-specific preparation
    │   │   └── service-config.sh # Service configuration
    │   └── docker/
    │       ├── compose-setup.sh # Docker Compose configuration
    │       └── container-config.sh # Container optimization
    └── utils/                  # 🛠️ Shared utilities
        ├── logging.sh          # Colored output, logging functions
        ├── validation.sh       # Input validation, checks
        ├── ui.sh              # User interface helpers, progress
        └── config.sh          # Configuration management
```

### **🔄 Module Loading System**

**Entry Point Pattern:**

```bash
#!/bin/bash
# install-ubuntu.sh

# Set platform context
PLATFORM="ubuntu"
INSTALLER_BASE="$(dirname "$(readlink -f "$0")")"

# Load core utilities
source "$INSTALLER_BASE/install/utils/logging.sh"
source "$INSTALLER_BASE/install/utils/ui.sh"
source "$INSTALLER_BASE/install/utils/validation.sh"

# Load core modules
source "$INSTALLER_BASE/install/core/system-setup.sh"
source "$INSTALLER_BASE/install/core/version-control.sh"

# Load features (auto-detected)
for feature in "$INSTALLER_BASE/install/features"/*.sh; do
    [ -f "$feature" ] && source "$feature"
done

# Load platform-specific modules
source "$INSTALLER_BASE/install/platforms/ubuntu/system-prep.sh"

# Execute main installer logic
main "$@"
```

### **🧩 Module Interface Standards**

**Every module MUST:**

- ✅ **Be self-contained** - No cross-module dependencies except utils
- ✅ **Use standard function naming** - `module_function_name()` pattern
- ✅ **Include feature detection** - `has_feature_optimization()` checks
- ✅ **Provide help integration** - `show_optimization_help()` functions
- ✅ **Handle platform differences** - Check `$PLATFORM` variable

---

## 📋 **Implementation Plan**

### **Phase 1: Foundation Setup** 🟡 **IN PROGRESS**

#### **✅ Step 1.1: Project Setup**

- [x] Create feature branch
- [x] Create project scope document
- [ ] Set up directory structure

#### **🔄 Step 1.2: Extract Core Utilities**

- [ ] Extract `utils/logging.sh` (info, warn, error, success)
- [ ] Extract `utils/ui.sh` (show_progress, execute_steps, banners)
- [ ] Extract `utils/validation.sh` (validate_version, validate_ip, etc)
- [ ] Extract `utils/config.sh` (use_defaults, configuration management)

#### **🔄 Step 1.3: Extract Core Modules**

- [ ] Extract `core/version-control.sh` (get_available_versions, version_exists)
- [ ] Extract `core/rollback.sh` (create_rollback_point, execute_rollback)
- [ ] Extract `core/system-setup.sh` (setup_environment, dependencies)
- [ ] Extract `core/app-build.sh` (build_application, cleanup_build_artifacts)

### **Phase 2: Feature Extraction**

#### **🔄 Step 2.1: Configuration Features**

- [ ] Extract `features/configuration-wizard.sh`
- [ ] Extract `features/ssh-hardening.sh`
- [ ] Extract `features/optimization.sh` (safe/aggressive modes)

#### **🔄 Step 2.2: Advanced Features**

- [ ] Extract `features/installer-updates.sh` (update_installer_only)
- [ ] Extract `features/backup-config.sh`
- [ ] Extract `features/monitoring.sh`

### **Phase 3: Platform Separation**

#### **🔄 Step 3.1: Proxmox Platform**

- [ ] Extract `platforms/proxmox/detection.sh`
- [ ] Extract `platforms/proxmox/container-wizard.sh`
- [ ] Extract `platforms/proxmox/lxc-management.sh`

#### **🔄 Step 3.2: Ubuntu Platform**

- [ ] Extract `platforms/ubuntu/system-prep.sh`
- [ ] Create `install-ubuntu.sh` entry point

#### **🔄 Step 3.3: Docker Platform**

- [ ] Create `platforms/docker/` modules
- [ ] Create `install-docker.sh` entry point

### **Phase 4: Integration & Testing**

#### **🔄 Step 4.1: Entry Point Creation**

- [ ] Create `install-ubuntu.sh` (replace `install-or-update.sh`)
- [ ] Create `install-proxmox.sh` (replace `proxmox-install-or-update.sh`)
- [ ] Implement module loading system

#### **🔄 Step 4.2: Testing & Validation**

- [ ] Test Ubuntu installation path
- [ ] Test Proxmox installation path
- [ ] Test feature compatibility
- [ ] Test rollback functionality

### **Phase 5: Documentation & Cleanup**

#### **🔄 Step 5.1: Documentation Updates**

- [ ] Update README.md installation instructions
- [ ] Update all documentation references
- [ ] Create module development guide

#### **🔄 Step 5.2: Legacy Cleanup**

- [ ] Remove old installer files
- [ ] Update package.json references
- [ ] Update CI/CD workflows

---

## 📊 **Success Metrics**

### **Code Quality Metrics**

- ✅ **Reduce total lines of code** by 60%+ (eliminate duplication)
- ✅ **Improve maintainability** - Single point of update for each feature
- ✅ **Increase test coverage** - Modular functions easier to test

### **User Experience Metrics**

- ✅ **Consistent experience** across all platforms
- ✅ **Feature parity** - All platforms get all applicable features
- ✅ **Improved help system** - Better documentation and guidance

### **Developer Experience Metrics**

- ✅ **Faster feature development** - Add once, works everywhere
- ✅ **Easier debugging** - Isolated, focused modules
- ✅ **Platform extensibility** - Easy to add new platforms

---

## ⚠️ **Risks & Mitigation**

### **🔴 High Risk: Breaking Changes**

**Risk**: Refactoring could introduce bugs in working installers
**Mitigation**:

- Work in feature branch
- Extensive testing before merge
- Keep old installers as fallback during transition

### **🟡 Medium Risk: Complexity**

**Risk**: Modular system could be harder to understand initially
**Mitigation**:

- Clear documentation
- Consistent naming conventions
- Self-contained modules

### **🟢 Low Risk: Performance**

**Risk**: Multiple file sourcing could slow installation
**Mitigation**:

- Optimize module loading
- Profile installation times
- Lazy loading for optional features

---

## 📅 **Timeline Estimate**

| Phase                      | Estimated Time | Dependencies         |
| -------------------------- | -------------- | -------------------- |
| **Phase 1**: Foundation    | 2-3 days       | None                 |
| **Phase 2**: Features      | 3-4 days       | Phase 1 complete     |
| **Phase 3**: Platforms     | 2-3 days       | Phase 1-2 complete   |
| **Phase 4**: Integration   | 2-3 days       | Phase 1-3 complete   |
| **Phase 5**: Documentation | 1-2 days       | Phase 1-4 complete   |
| **Total Project**          | **10-15 days** | Sequential execution |

---

## 📝 **Progress Tracking**

### **Current Status: Phase 1 - Foundation Setup**

#### **✅ Completed Tasks**

- [x] Create feature branch `feature/modular-installer-architecture`
- [x] Analyze current installer architecture
- [x] Create comprehensive project scope document
- [x] Define target modular architecture
- [x] **Set up directory structure** ✅ `/install/{core,features,platforms,utils}/`
- [x] **Extract `utils/logging.sh` module** ✅ **WORKING** (v1.0.0)
- [x] **Extract `utils/ui.sh` module** ✅ **WORKING** (v1.0.0)
- [x] **Extract `utils/validation.sh` module** ✅ **WORKING** (v1.0.0)
- [x] **Test module loading system** ✅ **ALL TESTS PASS**

#### **🔄 In Progress**

- [ ] Set up directory structure
- [ ] Extract core utilities modules

#### **📋 Next Actions**

1. Create `/install` directory structure
2. Extract `utils/logging.sh` module
3. Test module loading system
4. Continue with core module extraction

#### **🎯 Phase 1 Goals**

- [ ] Complete directory structure
- [ ] Extract all utility modules
- [ ] Extract core installation modules
- [ ] Create basic module loading system

---

## 📞 **Notes & Decisions**

### **Design Decisions Made**

1. **Module Loading**: Use bash `source` for simplicity and performance
2. **Platform Detection**: Use `$PLATFORM` environment variable
3. **Function Naming**: Use `module_function_name()` pattern for clarity
4. **Feature Detection**: Auto-load all features, check compatibility in modules

### **Outstanding Questions**

1. **Backward Compatibility**: Keep old installer files during transition?
2. **Configuration Format**: JSON/YAML config files or bash variables?
3. **Testing Strategy**: Unit tests for bash functions or integration tests only?

### **Dependencies & Blockers**

- None currently identified
- All work can proceed independently

---

**📝 Document maintained by**: AI Assistant  
**📧 For questions/updates**: Update this document as progress is made  
**🔄 Last reviewed**: January 2025
