# Profolio Release Process Guide

This guide ensures consistent, well-documented releases with proper version management.

## 📋 Pre-Release Checklist

### 1. **Code Readiness**
- [ ] All planned features for this release are complete
- [ ] All critical bugs are fixed
- [ ] Frontend builds without errors (`cd frontend && npm run build`)
- [ ] Backend builds without errors (`cd backend && npm run build`)
- [ ] No outstanding security vulnerabilities
- [ ] All new API routes tested and working

### 2. **Documentation Readiness**
- [ ] CHANGELOG.md updated with all changes
- [ ] Version numbers updated in all package.json files
- [ ] Release notes created in proper directory structure
- [ ] New features documented in `/docs/features/` if applicable
- [ ] README.md updated if needed

### 3. **Testing Completion**
- [ ] Manual testing of all new features
- [ ] Regression testing of existing features
- [ ] Demo mode tested (if applicable)
- [ ] Cross-deployment compatibility verified (cloud/self-hosted)
- [ ] No console errors in production build

## 🚀 Release Process Steps

### **Step 0: Get Current Date (CRITICAL)**

**BEFORE ANY RELEASE WORK** - Always get the current date to ensure chronological accuracy:

```bash
# Get current date in all required formats
CURRENT_DATE=$(date +%Y-%m-%d)              # For CHANGELOG.md: 2025-06-03
CURRENT_DATE_UK=$(date +%d-%m-%Y)           # For UK references: 03-06-2025  
CURRENT_DATE_READABLE=$(date +"%d %B %Y")   # For release notes: 03 June 2025
CURRENT_DATE_ORDINAL=$(date +"%d" | sed 's/1$/1st/; s/2$/2nd/; s/3$/3rd/; s/[4-9]$/th/; s/1[0-9]$/th/') && echo "${CURRENT_DATE_ORDINAL} $(date +"%B %Y")"  # 3rd June 2025

echo "📅 Release Date Information:"
echo "CHANGELOG format: $CURRENT_DATE"
echo "Release Notes format: $(date +"%-d" | sed 's/1$/1st/; s/2$/2nd/; s/3$/3rd/; s/[4-9]$/th/; s/1[0-9]$/th/')$(date +" %B %Y")"
echo "UK format: $CURRENT_DATE_UK"

# Verify this date is AFTER the last release
echo "📅 Last release date:"
grep -m1 "##.*v[0-9]" CHANGELOG.md
echo "⚠️  NEW DATE MUST BE AFTER THE ABOVE DATE"
```

**Critical Rules:**
- ✅ **Always use TODAY'S date** - never hardcode or guess dates
- ✅ **Check chronological order** - new releases must be after previous ones
- ✅ **Use consistent formats** - ISO for changelog, readable for release notes

### Step 1: Version Update

```bash
# Set new version (example: 1.3.0)
NEW_VERSION="1.3.0"
RELEASE_DATE=$(date +%Y-%m-%d)

# Update all package.json files at once
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json backend/package.json frontend/package.json

# Verify updates
grep -h '"version"' package.json backend/package.json frontend/package.json
```

### Step 2: Update CHANGELOG.md

Add new section at the top of the changelog using our standard format:

```markdown
## [v1.3.0] - 2025-06-02

### ✨ **New Features**
- **🔔 Notification Badge System**: Added notification count badge to user avatar button for instant visibility
- **🎭 Demo Mode Banner**: Orange-to-red gradient banner above header with signup CTA for demo users
- **🔄 Auto-Updates Toggle**: Smart self-hosted detection with interactive toggle for automatic updates

### 🐛 **Critical Bug Fixes**
- **🚨 FIXED: Next.js 15+ Dynamic Route Parameters**: Resolved `params.symbol` async errors in API routes
- **⏱️ FIXED: Yahoo Finance Rate Limiting Inconsistency**: Aligned retry timing across all services

### 🎨 **UI/UX Improvements**
- **🔔 Notifications Page Refinement**: Simplified interface based on user feedback
- **⚙️ System Info Enhancement**: Changed icon from Clock to Settings for better clarity

### 🔧 **Technical Improvements**
- **🏠 Smart Self-Hosted Detection**: Automatic hostname checking for localhost, 127.0.0.1, and .local domains
- **🔄 Unified Rate Limiting**: Consistent 5-second minimum delays across all Yahoo Finance operations

### 🛡️ **Security & Compatibility**
- **📱 Next.js 15+ Compatibility**: Updated dynamic route parameter handling for latest Next.js requirements
- **🔒 Cross-Deployment Support**: Notification system works consistently across cloud and self-hosted modes
```

### Step 3: Create Release Notes

Create detailed release notes in the proper directory structure:

```bash
# Determine major and minor version for directory structure
MAJOR_VERSION="v1"
MINOR_VERSION="v1.3"  # Adjust based on your version

# Create directory structure
mkdir -p docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}

# Create release notes file
touch docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}/RELEASE_NOTES_v${NEW_VERSION}.md
```

Use our comprehensive release notes template with sections for:
- 🎯 Release Highlights
- ✨ New Features
- 🐛 Critical Bug Fixes
- 🎨 UI/UX Improvements
- 🔧 Technical Improvements
- 🛡️ Security & Compatibility
- 📚 Documentation
- 🚀 Performance
- 🔄 Migration Guide
- 📦 Installation & Updates
- 🙏 Acknowledgments
- 📊 Release Statistics
- 🔗 Related Resources

### Step 4: Update Feature Documentation (if applicable)

Create or update documentation in `/docs/features/` for any major new features:

```bash
# Example for notification system
touch docs/features/notification-system.md
```

Include:
- Feature overview and purpose
- Use cases and benefits
- Step-by-step usage guide
- Configuration options
- Cross-deployment compatibility notes
- Troubleshooting section

### Step 5: Commit All Changes

```bash
# Stage all changes
git add -A

# Use our standard commit format for releases
git commit -m "feat: v${NEW_VERSION} - brief description of major changes - key features and fixes - impact and improvements"

# Example commit message:
# git commit -m "feat: v1.3.0 - notification badges, demo banner, auto-updates toggle, and critical fixes - Added notification badge to user avatar, demo mode banner with signup CTA, smart self-hosted auto-updates toggle - Fixed Next.js 15+ dynamic route params, unified Yahoo Finance retry timing, updates page layout issues - Enhanced notifications UI, improved rate limiting synchronization, cross-deployment compatibility"
```

### Step 6: Create Git Tag

```bash
# Create annotated tag with comprehensive description
git tag -a v${NEW_VERSION} -m "Release v${NEW_VERSION}: Brief release title

Major changes:
- Key feature 1
- Key feature 2  
- Critical fix

Technical improvements:
- Performance enhancement
- Compatibility update

See CHANGELOG.md and release notes for full details"

# Verify tag was created
git tag -l -n v${NEW_VERSION}
```

### Step 7: Push to Repository

```bash
# Push commits and tags together
git push origin main --tags

# Alternative: Push separately if needed
# git push origin main
# git push origin v${NEW_VERSION}
```

### Step 8: Create GitHub Release

#### Option A: Using GitHub CLI (Recommended)

```bash
# Verify GitHub CLI is available
which gh

# Create release using the release notes file
gh release create v${NEW_VERSION} \
  --title "v${NEW_VERSION} - Brief Release Title" \
  --notes-file docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}/RELEASE_NOTES_v${NEW_VERSION}.md

# Example:
# gh release create v1.3.0 \
#   --title "v1.3.0 - Enhanced Notification System & Critical Fixes" \
#   --notes-file docs/releases/v1/v1.3/RELEASE_NOTES_v1.3.0.md
```

#### Option B: Using GitHub Web Interface

1. Go to https://github.com/Obednal97/profolio/releases/new
2. Select the tag you just created (v1.3.0)
3. Title: `v1.3.0 - Enhanced Notification System & Critical Fixes`
4. Copy content from your release notes file
5. Check "Set as latest release"
6. Publish release

### Step 9: Post-Release Verification

```bash
# Verify release was created successfully
curl -s https://api.github.com/repos/Obednal97/profolio/releases/latest | grep tag_name

# Check that installer can detect new version
curl -s https://api.github.com/repos/Obednal97/profolio/releases/latest

# Test installation on clean system (if possible)
# Test update from previous version
# Verify all features work as expected
```

### Step 10: Cleanup

```bash
# Remove any temporary files created during release process
rm -f release-notes-temp.md

# Verify repository is clean
git status
```

## 📁 Release Notes Directory Structure

Organize release notes by major version and minor version series:

```
docs/
├── releases/
│   └── v1/                    # Major version 1
│       ├── v1.0/              # Minor version series 1.0.x
│       │   ├── RELEASE_NOTES_v1.0.0.md
│       │   ├── RELEASE_NOTES_v1.0.1.md
│       │   ├── RELEASE_NOTES_v1.0.12.md
│       │   └── ...
│       ├── v1.1/              # Minor version series 1.1.x  
│       │   ├── RELEASE_NOTES_v1.1.0.md
│       │   └── ...
│       ├── v1.2/              # Minor version series 1.2.x
│       │   ├── RELEASE_NOTES_v1.2.0.md
│       │   ├── RELEASE_NOTES_v1.2.1.md
│       │   ├── RELEASE_NOTES_v1.2.3.md
│       │   └── ...
│       └── v1.3/              # Minor version series 1.3.x
│           ├── RELEASE_NOTES_v1.3.0.md
│           └── ...
└── v2/                        # Future major version 2
    ├── v2.0/
    └── ...
```

## 📝 Release Documentation Standards

### Version Numbering
- Follow Semantic Versioning strictly: MAJOR.MINOR.PATCH
- Use `v` prefix for tags and directories: `v1.3.0`
- Document breaking changes clearly in major releases
- Use consistent version format across all files

### Release Notes Structure (Required Sections)
1. **🎯 Release Highlights** - 3-4 key improvements
2. **✨ New Features** - New functionality with clear benefits
3. **🐛 Critical Bug Fixes** - Important fixes with technical details
4. **🎨 UI/UX Improvements** - User experience enhancements
5. **🔧 Technical Improvements** - Under-the-hood improvements
6. **🛡️ Security & Compatibility** - Security and compatibility updates
7. **📚 Documentation** - Documentation changes
8. **🚀 Performance** - Performance improvements
9. **🔄 Migration Guide** - Breaking changes and upgrade steps
10. **📦 Installation & Updates** - Installation commands
11. **🙏 Acknowledgments** - Contributors and community thanks
12. **📊 Release Statistics** - Commit counts, files changed, etc.
13. **🔗 Related Resources** - Links to GitHub, changelog, etc.

### Documentation Updates Required
- [ ] CHANGELOG.md (always)
- [ ] Release notes in proper directory structure (always)
- [ ] Feature guides in /docs/features/ (for major features)
- [ ] API documentation (if endpoints changed)
- [ ] README.md (if major changes or new features)
- [ ] Installation guide (if process changed)

## 🚨 Emergency Hotfix Process

For critical fixes that can't wait for the next planned release:

```bash
# 1. Create hotfix branch from last release
git checkout -b hotfix/v1.3.1 v1.3.0

# 2. Make minimal fix
# 3. Update version to 1.3.1 (patch increment)
# 4. Update CHANGELOG.md with hotfix entry
# 5. Fast-track testing
# 6. Follow standard release process
# 7. Merge back to main

git checkout main
git merge hotfix/v1.3.1
git push origin main
```

## 📊 Release Metrics to Track

- Installation success rate
- Update success rate  
- Rollback frequency (if applicable)
- Issue reports within 24 hours
- Download count from GitHub
- Community feedback and engagement
- Build success rate
- Cross-platform compatibility

## 🔗 Release Announcement Template

```markdown
🎉 Profolio v1.3.0 Released!

We're excited to announce the release of Profolio v1.3.0 with enhanced notification system and critical fixes!

✨ Highlights:
• 🔔 Notification badges on user menu for instant visibility
• 🎭 Demo mode banner with clear signup call-to-action  
• 🔄 Smart auto-updates toggle for self-hosted deployments
• 🚨 Fixed Next.js 15+ compatibility issues
• ⏱️ Unified Yahoo Finance rate limiting for better reliability

📦 Install/Update:
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

📚 Full Release Notes: [v1.3.0 Release Notes](https://github.com/Obednal97/profolio/releases/tag/v1.3.0)

Thank you to our community for your continued support and valuable feedback!

#Profolio #SelfHosted #PortfolioManagement #OpenSource
```

## 🛠️ Tools and Scripts

### Quick Release Preparation Script

Save as `scripts/prepare-release.sh`:

```bash
#!/bin/bash
NEW_VERSION=$1
if [ -z "$NEW_VERSION" ]; then
    echo "Usage: ./prepare-release.sh 1.3.0"
    exit 1
fi

echo "Preparing release v${NEW_VERSION}..."

# Extract major and minor versions for directory structure
MAJOR_VERSION="v1"  # Adjust as needed
MINOR_VERSION="v$(echo $NEW_VERSION | cut -d. -f1-2)"

# Update versions
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json backend/package.json frontend/package.json

# Create release notes directory and file
mkdir -p docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}
cat > docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}/RELEASE_NOTES_v${NEW_VERSION}.md << EOF
# Release Notes - v${NEW_VERSION}

Released: $(date +%Y-%m-%d)

## 🎯 Release Highlights

TODO: Add 3-4 key improvements

## ✨ New Features

TODO: Add new features with clear benefits

## 🐛 Critical Bug Fixes

TODO: Add critical fixes with technical details

## 🎨 UI/UX Improvements

TODO: Add user experience enhancements

## 🔧 Technical Improvements

TODO: Add technical improvements

## 🛡️ Security & Compatibility

TODO: Add security and compatibility updates

[... rest of template sections ...]
EOF

echo "✅ Version updated to v${NEW_VERSION}"
echo "📁 Release notes template created in docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}/"
echo "📝 Next steps:"
echo "   1. Edit CHANGELOG.md"
echo "   2. Complete docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}/RELEASE_NOTES_v${NEW_VERSION}.md"
echo "   3. Test builds: cd frontend && npm run build && cd ../backend && npm run build"
echo "   4. Commit: git add -A && git commit -m 'feat: v${NEW_VERSION} - [brief description]'"
echo "   5. Tag and push: git tag -a v${NEW_VERSION} -m 'Release v${NEW_VERSION}' && git push origin main --tags"
echo "   6. Create GitHub release: gh release create v${NEW_VERSION} --title 'v${NEW_VERSION} - [title]' --notes-file docs/releases/${MAJOR_VERSION}/${MINOR_VERSION}/RELEASE_NOTES_v${NEW_VERSION}.md"
```

### GitHub CLI Installation

If GitHub CLI is not available:

```bash
# macOS
brew install gh

# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

---

**Remember**: Each release represents our commitment to quality and our users. Take time to ensure thorough documentation, testing, and proper organization of release materials. 