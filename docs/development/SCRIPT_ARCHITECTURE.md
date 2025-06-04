# Script Architecture Guide

**Version**: 1.9.0+  
**Last Updated**: 3rd June 2025  
**Status**: ✅ Production Ready

---

## 📁 **Script Organization**

### **Project Structure**
```
profolio/
├── scripts/                       # Project-wide automation
│   └── prepare-release.mjs         # Release orchestration
│
└── frontend/
    └── scripts/                    # Frontend-specific tools
        ├── dev-https.js            # PWA development server
        ├── dev-https-simple.js     # Simplified HTTPS setup
        └── update-sw-version.mjs   # Service worker versioning
```

---

## 🔧 **Script Purposes & Locations**

### **Project-Wide Scripts** (`scripts/`)

#### **prepare-release.mjs**
- **Purpose**: Orchestrates the entire release process
- **What it does**: 
  - Updates all package.json files
  - Calls frontend service worker script
  - Validates builds
  - Creates release notes structure
  - Provides next steps guidance
- **Used by**: Manual releases (`npm run prepare-release 1.9.1`)
- **Git Status**: ✅ **Must be tracked** (team automation tool)

### **Frontend-Specific Scripts** (`frontend/scripts/`)

#### **update-sw-version.mjs**
- **Purpose**: Syncs service worker version with package.json
- **What it does**:
  - Reads `frontend/package.json` version
  - Updates `frontend/public/sw.js` APP_VERSION constant
  - Forces PWA cache invalidation
- **Used by**: 
  - Automatic: `prebuild` script on every build
  - Manual: Called by `prepare-release.mjs`
- **Git Status**: ✅ **Must be tracked** (build automation)

#### **dev-https.js**
- **Purpose**: Full-featured HTTPS development server for PWA testing
- **What it does**:
  - Creates HTTPS server with mkcert certificates
  - Enables service worker testing (requires HTTPS)
  - Shows network IP for mobile device testing
  - Provides PWA development environment
- **Used by**: `npm run dev:https`, `npm run dev:pwa`
- **Git Status**: ✅ **Must be tracked** (team development tool)

#### **dev-https-simple.js**
- **Purpose**: Simplified HTTPS setup using Next.js built-in HTTPS
- **What it does**:
  - Checks for certificates
  - Sets HTTPS environment variables
  - Starts Next.js with HTTPS enabled
- **Used by**: `npm run dev:https:simple`
- **Git Status**: ✅ **Must be tracked** (team development tool)

---

## 🔄 **Script Relationships**

### **Release Process Flow**
```
npm run prepare-release 1.9.1
│
└── scripts/prepare-release.mjs
    ├── Updates root/package.json
    ├── Updates backend/package.json
    ├── Updates frontend/package.json
    │
    └── Calls frontend/scripts/update-sw-version.mjs
        └── Updates frontend/public/sw.js
```

### **Build Process Flow**
```
npm run build (in frontend/)
│
└── prebuild script runs first
    │
    └── frontend/scripts/update-sw-version.mjs
        └── Syncs SW version with frontend/package.json
```

### **Development Testing Flow**
```
npm run dev:pwa
│
└── npm run dev:https
    │
    └── frontend/scripts/dev-https.js
        └── HTTPS server for PWA/service worker testing
```

---

## ❓ **Why This Organization?**

### **✅ Keep Scripts in Current Locations**

#### **update-sw-version.mjs stays in `frontend/scripts/`**
- **Frontend-specific**: Updates `frontend/public/sw.js`
- **Frontend data**: Reads `frontend/package.json`
- **Frontend build**: Called by frontend `prebuild` script
- **Cross-calls normal**: `prepare-release.mjs` calling it is expected

#### **dev-https scripts stay in `frontend/scripts/`**
- **Frontend tooling**: Development servers for frontend app
- **PWA-specific**: Enable service worker testing
- **Team tools**: Other developers need them for PWA work
- **Certificate management**: Handle frontend HTTPS certificates

#### **prepare-release.mjs stays in `scripts/`**
- **Project-wide**: Coordinates root, backend, and frontend
- **Orchestration**: Calls multiple sub-scripts
- **Release tool**: Top-level automation for entire project

---

## 🚫 **What NOT to Ignore from Git**

### **All Scripts Must Be Tracked**
```gitignore
# ❌ DON'T add these to .gitignore:
scripts/
frontend/scripts/
*.mjs
*-https.js
```

### **Why Track All Scripts:**
- **Team consistency**: Other developers need the same tools
- **CI/CD integration**: Automated systems depend on these
- **Build process**: Part of the compilation pipeline
- **Development setup**: Required for PWA/HTTPS testing
- **Release automation**: Critical for consistent releases

---

## 🔒 **What SHOULD Be Ignored**

### **Generated Files & Certificates**
```gitignore
# ✅ These should be ignored:
frontend/.certificates/        # mkcert certificates (regeneratable)
.next/                        # Next.js build output
dist/                         # Build artifacts
node_modules/                 # Dependencies
.env*                         # Environment variables
```

---

## 🚀 **Usage Examples**

### **Release Preparation**
```bash
# Use the orchestration script
npm run prepare-release 1.9.1

# Manual alternative (don't do this)
node scripts/prepare-release.mjs 1.9.1
```

### **Development with PWA Testing**
```bash
# Full HTTPS server
npm run dev:pwa

# Simplified HTTPS
npm run dev:https:simple

# Regular development (no PWA testing)
npm run dev
```

### **Manual Service Worker Update**
```bash
# Update SW version manually
cd frontend && npm run update-sw
```

---

## 🔍 **Troubleshooting**

### **Script Not Found Errors**
```bash
# ❌ Error: Cannot find module 'scripts/prepare-release.mjs'
# ✅ Solution: Run from project root, not frontend/
cd /path/to/profolio  # Not /path/to/profolio/frontend
npm run prepare-release 1.9.1
```

### **Certificate Errors (HTTPS Scripts)**
```bash
# ❌ Error: HTTPS certificates not found
# ✅ Solution: Set up mkcert certificates
mkcert -install
mkdir -p frontend/.certificates
cd frontend/.certificates
mkcert localhost 127.0.0.1 ::1 $(ipconfig getifaddr en0)
```

### **Permission Errors**
```bash
# ❌ Error: Permission denied
# ✅ Solution: Make scripts executable
chmod +x scripts/prepare-release.mjs
chmod +x frontend/scripts/*.js
chmod +x frontend/scripts/*.mjs
```

---

## 📚 **Related Documentation**

- [Automated Release Management](../features/automated-release-management.md)
- [Release Process Guide](../processes/RELEASE_PROCESS_GUIDE.md)
- [PWA Implementation](../features/pwa-implementation.md)
- [Development Setup](../development/DEVELOPMENT_SETUP.md)

---

**Key Principle**: Scripts are infrastructure, not temporary files. They enable team consistency and automated processes, so they must be tracked in git and properly organized by their scope and purpose. 