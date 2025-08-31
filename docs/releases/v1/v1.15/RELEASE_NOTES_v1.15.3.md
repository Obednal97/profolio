# Release Notes - v1.15.3

**Released**: 1st September 2025  
**Type**: Bug Fix Release  
**Compatibility**: Fully compatible with v1.15.x

---

## 🐛 **Multiple Installer Issues Fixed**

This release addresses all the issues reported with the Proxmox-style installer.

## ✅ **What's Fixed**

### 1. Character Encoding Issues
- **Problem**: Menu items showed weird characters (`�<80>�`) instead of bullet points
- **Solution**: Replaced all Unicode bullet points (•) with ASCII dashes (-)
- **Result**: Menus now display correctly in all terminal environments

### 2. Container Detection in Advanced Mode
- **Problem**: Advanced installer asked for CPU/RAM/Disk settings when already inside a container
- **Solution**: Added container detection logic that skips resource questions when inside containers
- **Result**: Only asks for version and verbose settings when in a container

### 3. Build Failures
- **Problem**: Frontend build failed with ESLint and TypeScript errors
- **Solution**: 
  - Fixed unused imports (`useCallback` in page.tsx)
  - Removed unused `router` variable in userMenu.tsx
  - Fixed TypeScript `any` types in useOptimizedAnimation.ts
  - Fixed animation variant types (changed `{}` to `undefined`)
- **Result**: Build completes successfully

### 4. Nested Frontend Directory
- **Problem**: Erroneous `frontend/frontend` directory caused build issues
- **Solution**: Removed the nested directory
- **Result**: Proper directory structure restored

### 5. Error Visibility
- **Problem**: Build errors were hidden, showing only "exit code 1"
- **Solution**: Modified installer to show actual build output and continue on warnings
- **Result**: Users can now see what's happening during builds

## 🔧 **Technical Details**

### Files Modified:
- `profolio.sh` - Fixed character encoding and container detection
- `install-v2.sh` - Improved error visibility in build process
- `next.config.js` - Added ESLint configuration
- `frontend/src/app/page.tsx` - Removed unused import
- `frontend/src/app/about.tsx` - Fixed animation types
- `frontend/src/app/how-it-works.tsx` - Fixed animation types
- `frontend/src/app/pricing.tsx` - Fixed animation types
- `frontend/src/components/layout/userMenu.tsx` - Removed unused variable
- `frontend/src/hooks/useOptimizedAnimation.ts` - Fixed TypeScript types

## 🚀 **Installation**

```bash
# Standard installation (all issues fixed!)
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-wrapper.sh)"

# Direct v2 installer
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-v2.sh | sudo bash
```

## 📊 **Testing Confirmed**

- ✅ TUI menus display correctly
- ✅ Container detection works
- ✅ Build completes successfully
- ✅ Error messages are visible
- ✅ Installation tested in containers

---

**Note**: This release ensures the Proxmox-style installer works correctly in all environments, including containers, with proper error reporting and no character encoding issues.