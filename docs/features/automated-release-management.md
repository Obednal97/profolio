# Automated Release Management

**Version**: 1.9.0+  
**Status**: ✅ Production Ready  
**Type**: Developer Tools & Process Automation

---

## 🎯 **Overview**

The automated release management system streamlines the release process by automating version updates, validation, and preparation tasks. This prevents common release mistakes and ensures consistency across all deployments.

## ✨ **What Gets Automated**

### 🔄 **Version Management**
- **All package.json files** (root, backend, frontend) updated simultaneously
- **Service worker version sync** (critical for PWA cache invalidation)
- **Version format validation** (ensures proper semantic versioning)
- **Cross-file consistency checks** (prevents version mismatches)

### 📅 **Date Management**
- **Chronological validation** (new releases must be after previous releases)
- **Multi-format date generation** (ISO for CHANGELOG, UK readable for release notes)
- **Automatic date stamping** (no manual date entry required)

### 🏗️ **Build Validation**
- **Frontend build testing** (catches build issues before release)
- **Backend build testing** (ensures both services compile)
- **Early error detection** (prevents broken releases)

### 📚 **Documentation Structure**
- **Release notes directory creation** (proper v1/v1.x structure)
- **Template generation** (comprehensive release notes template)
- **Consistent formatting** (parser-compatible markdown)

## 🚀 **Usage**

### **Primary Command**
```bash
# Run comprehensive release preparation
npm run prepare-release 1.9.1

# Alternative direct execution
node scripts/prepare-release.mjs 1.9.1
```

### **What Happens**
1. **Version Validation**: Checks format (v1.9.1 or 1.9.1)
2. **Date Chronology**: Ensures new date is after last release
3. **Git Status Check**: Warns about uncommitted changes
4. **Version Updates**: All package.json files updated
5. **Service Worker Sync**: PWA cache invalidation prepared
6. **Directory Creation**: Release notes structure created
7. **Template Generation**: Complete release notes template
8. **Build Testing**: Both frontend and backend builds tested
9. **Next Steps Display**: Clear instructions for manual tasks

## 📋 **Manual Tasks Remaining**

The script automates most tasks but leaves these for manual completion:

### 1. **CHANGELOG.md Update**
```markdown
## [v1.9.1] - 2025-06-03

### ✨ **New Features**
- Your feature descriptions here
```

### 2. **Release Notes Completion**
Edit the generated template at:
```
docs/releases/v1/v1.9/RELEASE_NOTES_v1.9.1.md
```

### 3. **Git Operations**
```bash
git add -A
git commit -m "feat: v1.9.1 - brief description"
git tag -a v1.9.1 -m "Release v1.9.1"
git push origin main --tags
```

### 4. **GitHub Release Creation**
```bash
gh release create v1.9.1 --title "v1.9.1 - Title" --notes-file docs/releases/v1/v1.9/RELEASE_NOTES_v1.9.1.md
```

## 🔧 **Technical Details**

### **Files Modified**
- `package.json` - Root package version
- `backend/package.json` - Backend service version  
- `frontend/package.json` - Frontend application version
- `frontend/public/sw.js` - Service worker cache version

### **PWA Cache Management**
The script ensures PWA users receive updates without manual cache clearing:

1. **Service Worker Version Update**: Matches package.json version
2. **Cache Name Change**: Forces cache invalidation on next visit
3. **User Notification**: Automatic reload prompts for new version
4. **Webpack Chunk Refresh**: New builds get fresh chunk URLs

### **Build Process Integration**
```json
{
  "scripts": {
    "prebuild": "node scripts/update-sw-version.mjs",
    "build": "next build",
    "prepare-release": "node scripts/prepare-release.mjs"
  }
}
```

- **prebuild**: Automatically runs before every build (frontend-specific, in `frontend/scripts/`)
- **prepare-release**: Comprehensive release preparation (project-wide, in `scripts/`)
- **update-sw**: Direct service worker version update (frontend-specific, in `frontend/scripts/`)

### **Script Organization**
```
scripts/                           # Project-wide automation
└── prepare-release.mjs            # Orchestrates entire release process

frontend/scripts/                  # Frontend-specific tools
├── dev-https.js                   # PWA development with HTTPS
├── dev-https-simple.js            # Simplified HTTPS setup  
└── update-sw-version.mjs          # Service worker version sync
```

**Why This Structure:**
- **frontend/scripts/**: Frontend-specific tools and build integration
- **scripts/**: Project-wide automation that coordinates multiple components
- **Cross-directory calls**: `prepare-release.mjs` calling `frontend/scripts/update-sw-version.mjs` is normal and expected
- **PWA development tools**: dev-https scripts enable HTTPS testing required for service workers
- **All scripts tracked in git**: These are development tools the team needs, not temporary files

## 📁 **File Structure Created**

```
docs/releases/
└── v1/
    └── v1.9/
        └── RELEASE_NOTES_v1.9.1.md
```

**Directory Logic:**
- `v1/`: Major version series
- `v1.9/`: Minor version series (groups 1.9.0, 1.9.1, 1.9.2, etc.)
- `RELEASE_NOTES_v1.9.1.md`: Specific patch version

## ⚡ **Benefits**

### **Consistency**
- ✅ All versions always match across files
- ✅ Service worker version automatically synced
- ✅ Date formats consistent (ISO/UK readable)
- ✅ Release notes structure standardized

### **Error Prevention**
- ✅ Build failures caught before release
- ✅ Version format validation
- ✅ Chronological date checking
- ✅ Missing file detection

### **Time Savings**
- ✅ 90% of release prep automated
- ✅ No manual version hunting/updating
- ✅ Template generation saves typing
- ✅ Early validation prevents rework

### **PWA Reliability**
- ✅ Users never stuck with broken cache
- ✅ Automatic cache invalidation
- ✅ Fresh webpack chunks guaranteed
- ✅ Production cache issues eliminated

## 🔍 **Example Output**

```
🚀 PREPARING RELEASE v1.9.1
============================================================

ℹ️  Checking git status...
✅ Working directory is clean
✅ Date chronology validated (last release: 2025-06-03)

🚀 UPDATING VERSIONS
============================================================
✅ Updated package.json: 1.9.0 → 1.9.1
✅ Updated backend/package.json: 1.9.0 → 1.9.1  
✅ Updated frontend/package.json: 1.9.0 → 1.9.1
📦 Updating service worker to version 1.9.1...
✅ Service worker updated to version 1.9.1
🔄 This will force cache invalidation for all users
✅ Service worker version updated

🚀 CREATING RELEASE NOTES
============================================================
✅ Created release notes directory: docs/releases/v1/v1.9
✅ Created release notes template: docs/releases/v1/v1.9/RELEASE_NOTES_v1.9.1.md

🚀 VALIDATING BUILDS
============================================================
ℹ️  Testing frontend build...
✅ Frontend build successful
ℹ️  Testing backend build...
✅ Backend build successful

🚀 NEXT STEPS
============================================================

📝 Manual Tasks Required:
1. Update CHANGELOG.md with v1.9.1 entry (use date: 2025-06-03)
2. Complete release notes: docs/releases/v1/v1.9/RELEASE_NOTES_v1.9.1.md
3. Review and test all changes

🚀 Release Commands:
4. Commit changes:
   git add -A
   git commit -m "feat: v1.9.1 - [brief description]"

5. Create and push tag:
   git tag -a v1.9.1 -m "Release v1.9.1"
   git push origin main --tags

6. Create GitHub release:
   gh release create v1.9.1 --title "v1.9.1 - [title]" --notes-file "docs/releases/v1/v1.9/RELEASE_NOTES_v1.9.1.md"

💡 Automation Notes:
   • Service worker version updated automatically ✅
   • PWA cache will be invalidated for all users ✅
   • Build validation completed ✅
   • Version consistency verified ✅

🎉 Release preparation completed successfully!
```

## 🚨 **Error Handling**

### **Common Issues**

**Invalid Version Format**
```
❌ Invalid version format. Use format: v1.9.1 or 1.9.1
```

**Date Chronology Violation**
```
❌ Current date (2025-06-01) is not after last release date (2025-06-03)
❌ Check your system clock or verify chronological order
```

**Build Failures**
```
❌ Build validation failed: Frontend build failed
```

**Missing Files**
```
❌ Failed to update backend/package.json: No such file or directory
```

### **Recovery**

Most errors are early validation that prevent bad releases:

1. **Fix the underlying issue** (dates, build problems, etc.)
2. **Re-run the script** (it's safe to run multiple times)
3. **Check git status** before proceeding with manual steps

## 🔗 **Integration**

### **With Existing Processes**
- **Code Quality Checklist**: Automated build validation
- **Release Process Guide**: Simplified Step 1
- **Commit and Push Guide**: New recommended workflow
- **Date Management Guide**: Automatic chronology validation

### **With CI/CD**
The script can be integrated into CI/CD pipelines:

```yaml
- name: Prepare Release
  run: npm run prepare-release ${{ github.event.inputs.version }}
```

## 📚 **Related Documentation**

- [Release Process Guide](../processes/RELEASE_PROCESS_GUIDE.md)
- [Commit and Push Guide](../processes/COMMIT_AND_PUSH_GUIDE.md)
- [Date Management Guide](../processes/DATE_MANAGEMENT_GUIDE.md)
- [PWA Implementation](./pwa-implementation.md)

---

**Note**: This automation is designed to make releases safer and faster while maintaining the quality and consistency of manual processes. 