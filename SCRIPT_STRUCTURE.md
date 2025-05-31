# 📁 Script Structure Documentation

## Current Clean Directory Structure

### `/frontend/scripts/` - Frontend Service Scripts
**Purpose:** Scripts required by systemd services for frontend operation

- `start-frontend.sh` - ✅ **REQUIRED** - Used by systemd service to start Next.js frontend

### `/backend/scripts/` - Backend Service Scripts  
**Purpose:** Scripts required by systemd services for backend operation

- `start-backend.sh` - ✅ **REQUIRED** - Used by systemd service to start NestJS backend

### `/scripts/` - General Deployment & Setup Scripts
**Purpose:** Utilities for installation and environment setup

- `setup-production-environment.sh` - ✅ **UTILITY** - Automated environment configuration for fresh installs

## Script Responsibilities

### **Service Scripts** (`frontend/scripts/`, `backend/scripts/`)
- **Referenced by systemd services** in `/etc/systemd/system/profolio-*.service`
- **Must use correct paths** (`/opt/profolio/`)
- **Must use npm** (not pnpm) for package management
- **Must be executable** (`chmod +x`)

### **Utility Scripts** (`/scripts/`)
- **Installation helpers** for new deployments
- **Environment setup** automation
- **Maintenance utilities** for running systems

## Recently Cleaned Up (Removed)

- ❌ `backend/scripts/start-backend-fix.sh` - Redundant (main script fixed)
- ❌ `scripts/fix-deployment.sh` - Redundant (fixes now permanent)
- ❌ `scripts/final-deployment-fix.sh` - Redundant (fixes now permanent)

## Key Benefits of This Structure

1. **Clear Separation** - Service scripts vs utility scripts
2. **No Redundancy** - Each script has a single, clear purpose
3. **Systemd Compatible** - Service scripts work with systemd expectations
4. **Self-Documenting** - Script names clearly indicate their purpose
5. **Production Ready** - All scripts use correct paths and package managers

## For Future Development

- **Service scripts** should only be modified with extreme care (they're critical for system operation)
- **Utility scripts** can be added to `/scripts/` for new installation/maintenance features
- **Always test** script changes in a development environment first
- **Keep documentation updated** when adding new scripts 