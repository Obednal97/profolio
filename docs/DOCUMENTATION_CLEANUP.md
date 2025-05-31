# Documentation Cleanup Plan

## Current State: Too Many Files! 📚➡️📖

We currently have **23+ markdown files** which is overwhelming for users and contributors.

## Recommended Structure

### 🏠 **Root Level (Essential Only)**
```
README.md              ✅ Keep - Main project description & quick start
CHANGELOG.md           ✅ Keep - Version history 
LICENSE                ✅ Keep - Legal requirement
CONTRIBUTING.md        ✅ Keep - Enhanced with dev setup
SECURITY.md            ✅ Keep - Security reporting
.gitignore             ✅ Keep - Git configuration
package.json           ✅ Keep - Project metadata
install-or-update.sh   ✅ Keep - Main installer
```

### 📁 **docs/ Folder (Organized Documentation)**
```
docs/
├── installation.md          # Comprehensive installation guide
├── development.md           # Development setup (from README-DEVELOPMENT.md)
├── api-integration.md       # All Trading 212 docs combined
├── deployment/
│   ├── aws-migration.md     # AWS deployment guide
│   └── proxmox-setup.md     # Proxmox-specific setup
└── features/
    ├── demo-mode.md         # Demo mode documentation
    └── asset-management.md  # Feature documentation
```

### 🏛️ **policies/ Folder (Keep As-Is)**
```
policies/
├── privacy-policy.mdx           ✅ Keep - Legal requirement
├── terms-of-service.mdx         ✅ Keep - Legal requirement  
├── cookie-policy.mdx            ✅ Keep - Legal requirement
├── acceptable-use-policy.mdx    ✅ Keep - Legal requirement
└── data-protection-policy.mdx   ✅ Keep - Legal requirement
```

### 🗂️ **www/ Folder (Landing Page)**
```
www/
└── index.html              # Landing page (moved from root)
```

## Actions Required

### ❌ **DELETE (Internal/Redundant Files)**
- `DEPLOYMENT_IMPROVEMENTS.md` - Internal development notes
- `SCRIPT_STRUCTURE.md` - Internal documentation  
- `SYSTEM_REVIEW_AND_FIXES.md` - Development history
- `ASSET_MANAGER_IMPROVEMENTS.md` - Internal feature notes
- `DEMO_MODE_IMPLEMENTATION.md` - Internal implementation details
- `README-INSTALLATION.md` - Content merged into README.md
- `install.sh` - Replaced by install-or-update.sh
- `deployment.config.js` - Likely unused

### 🔄 **CONSOLIDATE**

#### 1. Enhanced CONTRIBUTING.md
Merge content from:
- `README-DEVELOPMENT.md` - Development setup
- `SCRIPT_STRUCTURE.md` - Code organization (if needed)

#### 2. docs/api-integration.md  
Combine all Trading 212 documentation:
- `TRADING212_RATE_LIMITS.md`
- `TRADING212_API_FEATURES.md`
- `TRADING212_SECURITY_AUDIT.md`

#### 3. docs/features/demo-mode.md
Combine demo mode documentation:
- `DEMO_MODE_SETUP.md`
- Relevant parts of `DEMO_MODE_IMPLEMENTATION.md`

### 📁 **ORGANIZE**
- Move `aws-migration-guide.md` → `docs/deployment/aws-migration.md`
- Move `index.html` → `www/index.html`
- Create `docs/installation.md` for comprehensive setup guide

## Benefits of Cleanup

### ✅ **For Users:**
- Clear, focused documentation
- Easy to find what they need
- Professional appearance
- Reduced cognitive load

### ✅ **For Contributors:**
- Clear project structure  
- Less confusion about where to add docs
- Easier maintenance
- Better organization

### ✅ **For Repository:**
- Cleaner root directory
- Better GitHub navigation
- Professional open source standards
- Easier maintenance

## Final Result: 8 Root Files + Organized docs/

**Root:** README, CHANGELOG, LICENSE, CONTRIBUTING, SECURITY, package.json, .gitignore, installer
**Organized:** Everything else properly categorized in docs/ and policies/

This follows the pattern of successful open source projects like Next.js, NestJS, and other major repositories. 