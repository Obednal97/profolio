# Release Notes - v1.15.2

**Released**: 31st August 2025  
**Type**: Critical Fix - Installation Failure  
**Compatibility**: Fully compatible with v1.15.x

---

## 🚨 **Critical Installation Fix**

This release fixes a critical installation failure that prevented Profolio from installing correctly.

## 🐛 **Root Cause Analysis**

The installer was failing with "wait $pid (exit code: 1)" due to:
1. **Missing pnpm-workspace.yaml**: The monorepo structure wasn't properly configured
2. **Missing Dependencies**: Root package.json lacked required dependencies
3. **Incorrect Build Order**: Tried to install all dependencies at once from root

## ✅ **What's Fixed**

### Workspace Configuration
- Added `pnpm-workspace.yaml` defining the monorepo structure
- Properly configured frontend and backend as workspace packages

### Dependencies
- Added missing `concurrently` dependency to root package.json
- Fixed dependency resolution for workspace packages

### Build Process
- Separated installation: root → frontend → backend
- Added `--ignore-scripts` flag for root installation
- Each package now installs its dependencies independently

### Error Visibility
- Enhanced error reporting in spinner function
- Shows first 10 lines of error output on failure
- Preserves error messages for debugging

## 📊 **Technical Changes**

```yaml
# New pnpm-workspace.yaml
packages:
  - 'frontend'
  - 'backend'
```

```json
// Added to package.json
"devDependencies": {
  "concurrently": "^8.2.2"
}
```

## 🚀 **Installation**

```bash
# Standard installation (now working!)
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"

# Direct v2 installer
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-v2.sh | sudo bash
```

## 🧪 **Testing Verified**

- ✅ pnpm workspace configuration working
- ✅ Dependencies installing correctly
- ✅ Build process completing successfully
- ✅ Error reporting improved

---

**Note**: This critical fix ensures the Proxmox-style installer works correctly with the monorepo structure. Users who experienced installation failures should now be able to install successfully.