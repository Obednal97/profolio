# Release Notes - v1.0.6

Released: 2025-01-31

## 🎯 Release Highlights

**Version synchronization and visual polish release** - Fixes version reporting accuracy and improves installer banner aesthetics for a more professional experience.

## 🐛 Bug Fixes

### Fixed: Installer Version Reporting

**The Problem:**
- Installer was showing "1.0.0" even after updating to newer versions
- Version mismatch between actual code and reported version
- Confusion about which version was actually installed

**The Solution:**
- Synchronized all package.json files to show correct version
- Updated root, backend, and frontend package.json files
- Installer now accurately reports installed version

### Fixed: Installer Banner Text Alignment

**The Problem:**
- Banner text was left-aligned with excessive right-side spacing
- Visual inconsistency in installer output
- Unprofessional appearance during installation

**The Solution:**
- Properly centered all text within 64-character banner boxes
- Fixed spacing for all banner types (installation, update, repair)
- Consistent visual presentation throughout installer

## 🔧 Technical Improvements

### Version Management
- All three package.json files now maintain synchronized versions
- Version updates are consistent across all components
- Improved version detection and reporting

### Visual Consistency
- Professional banner presentation with centered text
- Improved readability of installer output
- Better user experience during installation process

## 📚 Files Modified

- `package.json` - Updated to version 1.0.6
- `backend/package.json` - Updated to version 1.0.6
- `frontend/package.json` - Updated to version 1.0.6
- `install-or-update.sh` - Fixed banner text spacing

## 🔄 Update Instructions

To get the latest version with fixes:

```bash
# Update installer script
cd /opt
rm -f install-or-update.sh
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh -o install-or-update.sh
chmod +x install-or-update.sh

# Run update
./install-or-update.sh
```

## 📦 Version Verification

After updating, verify your version:

```bash
# Check reported version in package.json files
grep -h '"version"' /opt/profolio/package.json /opt/profolio/backend/package.json /opt/profolio/frontend/package.json
```

All three files should show:
```
"version": "1.0.6"
```

## 🎨 Visual Improvements

### Before:
```
╔══════════════════════════════════════════════════════════════╗
║             🚀 PROFOLIO INSTALLER/UPDATER v2.0              ║
║              Professional Portfolio Management               ║
║           🛡️  With Rollback & Version Control 🎯            ║
╚══════════════════════════════════════════════════════════════╝
```

### After:
```
╔══════════════════════════════════════════════════════════════╗
║             🚀 PROFOLIO INSTALLER/UPDATER v2.0               ║
║              Professional Portfolio Management                ║
║           🛡️  With Rollback & Version Control 🎯             ║
╚══════════════════════════════════════════════════════════════╝
```

## 🙏 Acknowledgments

Thanks to the user who noticed the banner spacing issue and the version reporting discrepancy. These small details contribute to a professional user experience.

## 📊 Statistics

- **2 bugs** fixed
- **4 files** modified
- **100% backward** compatible
- **0 breaking** changes 