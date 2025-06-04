# Profolio Commit and Push Guide

This guide ensures consistent, high-quality commits and maintains project standards.

## 📅 **Critical: Date Management**

**FUNDAMENTAL RULE**: Release dates MUST always be chronological. New releases cannot have dates before previous releases.

### **Get Current Date Before Any Release Work**
```bash
# Always run this first to get the correct date
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_DATE_UK=$(date +%d-%m-%Y)
CURRENT_DATE_READABLE=$(date +"%d %B %Y")  # e.g., "03 June 2025"
echo "Today: $CURRENT_DATE (ISO) | $CURRENT_DATE_UK (UK) | $CURRENT_DATE_READABLE (Readable)"
```

### **Date Format Standards**
- **CHANGELOG.md**: Use ISO format `YYYY-MM-DD` (e.g., `2025-06-03`)
- **Release Notes**: Use UK readable format (e.g., `3rd June 2025`)
- **Commit Messages**: Use ISO format in any date references
- **All Documentation**: Follow UK date conventions as per project standards

### **Before Every Release**
```bash
# 1. Get current date
echo "Current date: $(date +%Y-%m-%d)"

# 2. Check last release date
grep -m1 "##.*v[0-9]" CHANGELOG.md

# 3. Verify new date is AFTER the last release date
# NEVER use a date that's before the previous release!
```

## 📋 Pre-Commit Checklist

Before making any commit, complete this checklist:

### 1. **Code Quality**
- [ ] Frontend compiles without errors (`cd frontend && npm run build`)
- [ ] Backend compiles without errors (`cd backend && npm run build`)
- [ ] All tests pass (if applicable)
- [ ] No console.log or debug statements left in production code
- [ ] Code follows project style guidelines
- [ ] TypeScript errors resolved

### 2. **Folder Structure Maintenance**
- [ ] New documentation files are in appropriate `/docs` subdirectories
- [ ] Release notes in correct version structure (`docs/releases/v1/v1.x/`)
- [ ] No temporary files in repository
- [ ] Large files moved to appropriate storage (not in git)
- [ ] README files updated if folder structure changed

### ⚠️ **Critical: Git File Management** *(DO NOT IGNORE THESE)*

**Files that MUST be tracked in git:**
- ✅ `scripts/prepare-release.mjs` - Release automation (other developers need it)
- ✅ `frontend/scripts/update-sw-version.mjs` - PWA version sync (part of build process)
- ✅ `frontend/public/sw.js` - Service worker (modified during builds)
- ✅ All build scripts and configuration files
- ✅ Process documentation and guides

**Files that should be ignored (.gitignore):**
- ❌ `node_modules/` directories
- ❌ `.next/` build output  
- ❌ `dist/` build output
- ❌ `.env*` environment files
- ❌ Package lock files (`package-lock.json`, `pnpm-lock.yaml` - optional)
- ❌ IDE-specific files (`.vscode/`, `.idea/`)
- ❌ OS-specific files (`.DS_Store`, `Thumbs.db`)

**Why scripts must be tracked:**
- Other developers need them for releases
- CI/CD systems depend on them
- Ensures consistent release process across team
- Part of the build and deployment infrastructure

### 3. **Version Updates** (for releases only)
- [ ] **NEW: Use Automated Script**: Run `npm run prepare-release 1.3.0` for comprehensive version management
- [ ] **Automated Updates Include**: All package.json files, service worker version, release notes template creation
- [ ] **Manual Alternative**: Update version in `/package.json`, `/backend/package.json`, `/frontend/package.json`
- [ ] All three versions match

### 4. **Documentation Updates**
- [ ] Update `CHANGELOG.md` with changes
- [ ] Create release notes in proper directory structure (for releases)
- [ ] Update relevant feature documentation in `/docs/features/`
- [ ] Add/update code comments for complex changes
- [ ] Update API documentation if endpoints changed

### 5. **Review Changes**
- [ ] Run `git status` to see all changes
- [ ] Run `git diff` to review all modifications
- [ ] Ensure no sensitive data (passwords, keys, tokens)
- [ ] Verify no unintended file modifications
- [ ] Check file permissions are correct

## 🔧 Commit Process

### Step 1: Stage Changes
```bash
# Review what will be committed
git status

# Add all changes (recommended for most commits)
git add -A

# Or add specific files if needed
git add <file1> <file2>
```

### Step 2: Commit Message Format

For most commits, use a single-line format that works well with git tools:

```bash
git commit -m "type: brief description - details about what was changed - additional context if needed"
```

#### Commit Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `chore`: Maintenance tasks
- `build`: Build system changes
- `ci`: CI/CD changes

### ⚠️ **PWA Service Worker Management** *(IMPORTANT)*

The PWA service worker version is **automatically updated** during the build process:
- **Automated Update**: Service worker version matches `package.json` version automatically
- **No Manual Action Required**: The `prebuild` script handles this transparently
- **Cache Invalidation**: New versions force clear all user caches automatically
- **Production Cache Fix**: Users get fresh webpack chunks without manual cache clearing

**Build Process Includes:**
1. Version update in `package.json` files
2. **Automatic SW version sync** (via `npm run prebuild`)
3. Frontend/backend builds
4. Commit and push

**Look for**: `📦 Updating service worker to version X.X.X` in build output to confirm automatic update.

#### Examples:
```bash
# Feature commit
git commit -m "feat: add notification badge to user menu - shows unread count on avatar, works across all deployment modes"

# Bug fix commit  
git commit -m "fix: resolve Next.js 15+ dynamic route params - await params object before accessing properties in API routes"

# Major release commit
git commit -m "feat: v1.3.0 - notification badges, demo banner, auto-updates toggle, and critical fixes - Added notification badge to user avatar, demo mode banner with signup CTA, smart self-hosted auto-updates toggle - Fixed Next.js 15+ dynamic route params, unified Yahoo Finance retry timing, updates page layout issues - Enhanced notifications UI, improved rate limiting synchronization, cross-deployment compatibility"
```

### Step 3: Push to Repository
```bash
# Push to main branch
git push origin main

# For releases, push with tags
git push origin main --tags
```

## 📦 Version Numbering

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)  
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

### Version Update Commands
```bash
# Set new version
NEW_VERSION="1.3.0"

# Update all package.json files at once
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json backend/package.json frontend/package.json

# Verify updates
grep -h '"version"' package.json backend/package.json frontend/package.json
```

## 📝 CHANGELOG.md Format

Use this format for changelog entries:

```markdown
## [v1.3.0] - 2025-06-02

### ✨ **New Features**
- **🔔 Feature Name**: Brief description with impact
- **🎭 Another Feature**: What it does and why it matters

### 🐛 **Critical Bug Fixes**
- **🚨 FIXED: Issue Title**: What was broken and how it was fixed
- **⏱️ FIXED: Another Issue**: Technical details and impact

### 🎨 **UI/UX Improvements**
- **Enhanced Interface**: What was improved and user benefit

### 🔧 **Technical Improvements**
- **Better Performance**: Technical details and benefits

### 🛡️ **Security & Compatibility**
- **Enhanced Security**: What was improved and impact
```

## 🚫 Common Mistakes to Avoid

1. **Forgetting to update package.json versions for releases**
2. **Not updating CHANGELOG.md for significant changes**
3. **Committing node_modules or build artifacts**
4. **Leaving debug code in production**
5. **Not reviewing changes with `git diff`**
6. **Committing sensitive information**
7. **Using multi-line commit messages that cause issues**
8. **Not testing builds before committing**
9. **Putting release notes in wrong directory structure**

## 🔍 Final Review Commands

```bash
# Review staged changes
git diff --staged

# Review commit history
git log --oneline -5

# Check current version (for releases)
grep -h '"version"' package.json backend/package.json frontend/package.json

# Verify no sensitive data
git grep -i "password\|secret\|key\|token" --cached

# Check for large files
git ls-files --cached | xargs ls -la | sort -k5 -n -r | head -10

# Test builds
cd frontend && npm run build && cd ../backend && npm run build && cd ..
```

## 📋 Quick Reference

### Regular Development Commit
```bash
# 1. Review changes
git status
git diff

# 2. Stage and commit
git add -A
git commit -m "feat: your feature description - what was added and why"

# 3. Push
git push origin main
```

### Release Commit Process
```bash
# 1. Set version and run automated preparation
NEW_VERSION="1.3.0"
npm run prepare-release $NEW_VERSION

# 2. Complete CHANGELOG.md and release notes (as guided by script output)

# 3. Review and commit
git status
git diff
git add -A
git commit -m "feat: v${NEW_VERSION} - brief description of major changes"

# 4. Push
git push origin main
```

### Release Commit Process (Manual Alternative)
```bash
# 1. Set version
NEW_VERSION="1.3.0"

# 2. Update versions
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json backend/package.json frontend/package.json

# 3. Update CHANGELOG.md (manually)

# 4. Create release notes in proper directory
mkdir -p docs/releases/v1/v1.3
# Create docs/releases/v1/v1.3/RELEASE_NOTES_v1.3.0.md

# 5. Review and commit
git status
git diff
git add -A
git commit -m "feat: v${NEW_VERSION} - brief description of major changes"

# 6. Push
git push origin main
```

## 📁 Documentation Structure

Release notes should follow this structure:

```
docs/
├── releases/
│   └── v1/
│       ├── v1.0/
│       │   ├── RELEASE_NOTES_v1.0.0.md
│       │   ├── RELEASE_NOTES_v1.0.1.md
│       │   └── ...
│       ├── v1.1/
│       │   ├── RELEASE_NOTES_v1.1.0.md
│       │   └── ...
│       ├── v1.2/
│       │   ├── RELEASE_NOTES_v1.2.0.md
│       │   ├── RELEASE_NOTES_v1.2.1.md
│       │   └── ...
│       └── v1.3/
│           ├── RELEASE_NOTES_v1.3.0.md
│           └── ...
├── features/
│   ├── notification-system.md
│   ├── auto-updates.md
│   └── ...
└── processes/
    ├── COMMIT_AND_PUSH_GUIDE.md
    ├── RELEASE_PROCESS_GUIDE.md
    └── ...
```

## 🔗 Related Documentation

- [Release Process Guide](./RELEASE_PROCESS_GUIDE.md)
- [Documentation Structure](../README.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)

---

**Remember**: Every commit represents the project's quality. Take time to ensure each commit maintains our high standards and follows our established patterns. 

### ⚡ **Release Preparation Script** *(NEW - RECOMMENDED)*

Use the comprehensive release preparation script for all releases:

```bash
# Example for version 1.9.1
npm run prepare-release 1.9.1

# What it automates:
# ✅ Updates all package.json files
# ✅ Updates service worker version (forces cache invalidation)
# ✅ Validates date chronology  
# ✅ Tests frontend and backend builds
# ✅ Creates release notes directory structure
# ✅ Generates release notes template with current date
```

**Benefits:**
- **Prevents common mistakes** (forgotten version updates, wrong dates)
- **Ensures consistency** across all files and systems
- **Validates release readiness** before committing
- **Saves time** by automating repetitive tasks
- **Maintains PWA cache integrity** with automatic service worker versioning

**Script Location:** `scripts/prepare-release.mjs` - **DO NOT IGNORE FROM GIT** ⚠️ 