# Profolio Commit and Push Guide

This guide ensures consistent, high-quality commits and maintains project standards.

## 📋 Pre-Commit Checklist

Before making any commit, complete this checklist:

### 1. **Code Quality**
- [ ] Code compiles without errors (`npm run build` in both frontend and backend)
- [ ] All tests pass (if applicable)
- [ ] No console.log or debug statements left in production code
- [ ] Code follows project style guidelines

### 2. **Folder Structure Maintenance**
- [ ] New documentation files are in appropriate `/docs` subdirectories
- [ ] No temporary files in repository
- [ ] Large files moved to appropriate storage (not in git)
- [ ] README files updated if folder structure changed

### 3. **Version Updates**
- [ ] Update version in `/package.json`
- [ ] Update version in `/backend/package.json`
- [ ] Update version in `/frontend/package.json`
- [ ] All three versions match

### 4. **Documentation Updates**
- [ ] Update `CHANGELOG.md` with changes
- [ ] Update relevant documentation files
- [ ] Add/update code comments for complex changes
- [ ] Update API documentation if endpoints changed

### 5. **Review Changes**
- [ ] Run `git diff` to review all changes
- [ ] Ensure no sensitive data (passwords, keys, tokens)
- [ ] Verify no unintended file modifications
- [ ] Check file permissions are correct

## 🔧 Commit Process

### Step 1: Stage Changes
```bash
# Review what will be committed
git status

# Add specific files
git add <file1> <file2>

# Or add all changes (use carefully)
git add -A
```

### Step 2: Commit Message Format
```bash
git commit -m "<type>: <subject>

<body>

<footer>"
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
# Simple commit
git commit -m "fix: resolve DOMMatrix SSR error in PDF parser"

# Detailed commit
git commit -m "feat: add automatic rollback system to installer

- Implement Git-based restoration tracking
- Add filesystem backup as fallback
- Create rollback command (--rollback)
- Add automatic failure detection

Closes #123"
```

### Step 3: Push to Repository
```bash
# Push to main branch
git push origin main

# Push with tags
git push origin main --tags
```

## 📦 Version Numbering

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

### Version Update Script
```bash
# Quick version update (example for 1.0.7)
VERSION="1.0.7"
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" backend/package.json
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" frontend/package.json
```

## 📝 CHANGELOG.md Format

```markdown
## [1.0.7] - 2025-02-01

### Added
- New feature descriptions

### Changed
- Modified functionality

### Fixed
- Bug fixes with issue numbers

### Security
- Security improvements

### Technical Improvements
- Internal improvements
```

## 🚫 Common Mistakes to Avoid

1. **Forgetting to update package.json versions**
2. **Not updating CHANGELOG.md**
3. **Committing node_modules or build artifacts**
4. **Leaving debug code in production**
5. **Not reviewing changes with `git diff`**
6. **Committing sensitive information**
7. **Inconsistent commit messages**
8. **Not testing before committing**

## 🔍 Final Review Commands

```bash
# Review staged changes
git diff --staged

# Review commit history
git log --oneline -5

# Check current version
grep -h '"version"' package.json backend/package.json frontend/package.json

# Verify no sensitive data
git grep -i "password\|secret\|key\|token" --cached

# Check file sizes
git ls-files --cached | xargs ls -la | sort -k5 -n -r | head -20
```

## 📋 Quick Reference

```bash
# Full commit process
VERSION="1.0.7"

# 1. Update versions
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" package.json backend/package.json frontend/package.json

# 2. Update CHANGELOG
nano CHANGELOG.md

# 3. Review changes
git diff
git status

# 4. Commit
git add -A
git commit -m "feat: your feature description"

# 5. Push
git push origin main
```

## 🔗 Related Documentation

- [Release Process Guide](./RELEASE_PROCESS_GUIDE.md)
- [Folder Structure](../README.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)

---

**Remember**: Every commit represents the project's quality. Take time to ensure each commit maintains our high standards. 