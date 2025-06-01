# Profolio Release Process Guide

This guide ensures consistent, well-documented releases with proper version management.

## 📋 Pre-Release Checklist

### 1. **Code Readiness**
- [ ] All planned features for this release are complete
- [ ] All critical bugs are fixed
- [ ] Code passes all tests
- [ ] No outstanding security vulnerabilities
- [ ] Production build succeeds without errors

### 2. **Documentation Readiness**
- [ ] CHANGELOG.md updated with all changes
- [ ] Version numbers updated in all package.json files
- [ ] API documentation current
- [ ] New features documented in `/docs/features/`
- [ ] README.md updated if needed

### 3. **Testing Completion**
- [ ] Manual testing of all new features
- [ ] Regression testing of existing features
- [ ] Installation tested from scratch
- [ ] Update process tested from previous version
- [ ] Rollback tested (if applicable)

## 🚀 Release Process Steps

### Step 1: Version Update

```bash
# Set new version (example: 1.0.7)
NEW_VERSION="1.0.7"
RELEASE_DATE=$(date +%Y-%m-%d)

# Update all package.json files
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" backend/package.json
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json

# Verify updates
grep -h '"version"' package.json backend/package.json frontend/package.json
```

### Step 2: Update CHANGELOG.md

Add new section at the top of the changelog:

```markdown
## [1.0.7] - 2025-02-01

### Added
- Feature: Automatic rollback system with Git-based restoration
- Feature: Version-specific installation support
- Documentation: Comprehensive installer guide

### Changed
- Improved installer error handling and recovery
- Enhanced progress indicators and status messages

### Fixed
- Fixed DOMMatrix SSR error in PDF parser
- Resolved installer version reporting issues

### Security
- Enhanced credential protection during updates

### Technical Improvements
- Optimized build process for faster deployments
- Improved service health monitoring
```

### Step 3: Create Release Notes

Create detailed release notes in `/docs/releases/RELEASE_NOTES_v{VERSION}.md`:

```bash
# Create release notes file
touch docs/releases/RELEASE_NOTES_v${NEW_VERSION}.md
```

Template for release notes:

```markdown
# Release Notes - v1.0.7

Released: 2025-02-01

## 🎯 Release Highlights

Brief overview of the most important changes in this release.

## ✨ New Features

### Feature Name
Detailed description of the feature, including:
- What problem it solves
- How to use it
- Any configuration required
- Screenshots if applicable

## 🐛 Bug Fixes

### Fixed: Issue Description
- What was broken
- How it was fixed
- Impact on users

## 🔧 Technical Improvements

### Improvement Description
- Technical details
- Performance impact
- Developer benefits

## 📚 Documentation Updates

- New guides added
- Existing documentation improved
- API documentation changes

## 🔄 Migration Guide

If breaking changes, provide migration steps:

1. Step one
2. Step two
3. Verification steps

## 📦 Installation

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

## 🔄 Updating

Existing installations will automatically update to v1.0.7.

## 🙏 Acknowledgments

Thanks to contributors and issue reporters.

## 📊 Statistics

- X commits since last release
- Y issues closed
- Z pull requests merged
```

### Step 4: Update Feature Documentation

Create or update documentation in `/docs/features/` for any new features:

```bash
# Example for new feature
touch docs/features/automatic-rollback.md
```

Include:
- Feature overview
- Use cases
- Step-by-step guide
- Configuration options
- Troubleshooting
- FAQ

### Step 5: Commit Changes

```bash
# Stage all changes
git add -A

# Commit with clear message
git commit -m "chore: prepare release v${NEW_VERSION}

- Update version numbers in package.json files
- Update CHANGELOG.md with release notes
- Add detailed release notes to docs/releases/
- Update feature documentation"
```

### Step 6: Create Git Tag

```bash
# Create annotated tag
git tag -a v${NEW_VERSION} -m "Release v${NEW_VERSION}: Brief description

Major changes:
- Feature 1
- Feature 2
- Critical fix

See CHANGELOG.md for full details"

# Verify tag
git tag -l -n v${NEW_VERSION}
```

### Step 7: Push to Repository

```bash
# Push commits and tags
git push origin main
git push origin v${NEW_VERSION}

# Alternatively, push everything
git push origin main --tags
```

### Step 8: Create GitHub Release

1. Go to https://github.com/Obednal97/profolio/releases/new
2. Select the tag you just created
3. Title: `v1.0.7 - Release Title`
4. Copy content from release notes
5. Attach any binaries if needed
6. Check "Set as latest release"
7. Publish release

### Step 9: Post-Release Verification

```bash
# Verify installer detects new version
curl -s https://api.github.com/repos/Obednal97/profolio/releases/latest | grep tag_name

# Test installation on clean system
# Test update from previous version
# Verify all features work as expected
```

## 📝 Release Documentation Standards

### Version Numbering
- Follow Semantic Versioning strictly
- Document breaking changes clearly
- Use consistent version format (v1.0.7, not 1.0.7 in tags)

### Release Notes Structure
1. **Highlights** - 2-3 key improvements
2. **Features** - New functionality with guides
3. **Fixes** - Bug fixes with issue references
4. **Breaking Changes** - With migration guides
5. **Technical** - Under-the-hood improvements
6. **Documentation** - Doc updates
7. **Acknowledgments** - Contributors

### Documentation Updates Required
- [ ] CHANGELOG.md
- [ ] Release notes in /docs/releases/
- [ ] Feature guides in /docs/features/
- [ ] API documentation if changed
- [ ] README.md if major changes
- [ ] Installation guide if process changed

## 🚨 Emergency Hotfix Process

For critical fixes that can't wait:

```bash
# 1. Create hotfix from last release
git checkout -b hotfix/v1.0.7-fix v1.0.7

# 2. Make minimal fix
# 3. Update version to 1.0.7-hotfix1
# 4. Fast-track testing
# 5. Release immediately
# 6. Merge back to main
```

## 📊 Release Metrics to Track

- Installation success rate
- Update success rate  
- Rollback frequency
- Issue reports within 24 hours
- Download count
- User feedback

## 🔗 Release Announcement Template

```markdown
🎉 Profolio v1.0.7 Released!

We're excited to announce the release of Profolio v1.0.7 with [key feature].

✨ Highlights:
• Feature 1
• Feature 2  
• Performance improvements

📦 Install/Update:
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"

📚 Full Release Notes: [link]

Thank you to our community for your continued support!

#Profolio #SelfHosted #PortfolioManagement
```

## 🛠️ Tools and Scripts

### Quick Release Script
Save as `scripts/prepare-release.sh`:

```bash
#!/bin/bash
NEW_VERSION=$1
if [ -z "$NEW_VERSION" ]; then
    echo "Usage: ./prepare-release.sh 1.0.7"
    exit 1
fi

echo "Preparing release v${NEW_VERSION}..."

# Update versions
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json backend/package.json frontend/package.json

# Create release notes template
cat > docs/releases/RELEASE_NOTES_v${NEW_VERSION}.md << EOF
# Release Notes - v${NEW_VERSION}

Released: $(date +%Y-%m-%d)

## 🎯 Release Highlights

TODO: Add highlights

## ✨ New Features

TODO: Add features

## 🐛 Bug Fixes

TODO: Add fixes
EOF

echo "✅ Version updated"
echo "📝 Edit CHANGELOG.md"
echo "📝 Complete docs/releases/RELEASE_NOTES_v${NEW_VERSION}.md"
echo "Then run: git add -A && git commit -m 'chore: prepare release v${NEW_VERSION}'"
```

---

**Remember**: Each release represents our commitment to quality. Take time to ensure thorough documentation and testing. 