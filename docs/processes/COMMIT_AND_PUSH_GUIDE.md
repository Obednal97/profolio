# Profolio Commit and Push Guide

This guide ensures consistent, high-quality commits and maintains project standards.

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

### 3. **Version Updates** (for releases only)
- [ ] Update version in `/package.json`
- [ ] Update version in `/backend/package.json`
- [ ] Update version in `/frontend/package.json`
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
## [v1.3.0] - 2025-02-06

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