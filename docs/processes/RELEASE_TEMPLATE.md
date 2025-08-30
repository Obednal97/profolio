# Release Documentation Template

**🚨 CRITICAL: GET CURRENT DATE FIRST**

```bash
# ALWAYS run this before creating changelog or release notes
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_DATE_READABLE=$(date +"%-d %B %Y")  # e.g., "3 June 2025"
CURRENT_DATE_ORDINAL=$(date +"%d" | sed 's/1$/1st/; s/2$/2nd/; s/3$/3rd/; s/[4-9]$/th/; s/1[0-9]$/th/')$(date +" %B %Y")  # e.g., "3rd June 2025"

echo "Changelog date: $CURRENT_DATE"
echo "Release notes date: $CURRENT_DATE_ORDINAL"

# Check last release date to ensure chronological order
echo "Last release was:"
grep -m1 "##.*v[0-9]" CHANGELOG.md
echo "⚠️ NEW DATE MUST BE AFTER THE ABOVE DATE"
```

---

## 📋 **CHANGELOG.md Entry**

Use this format for CHANGELOG.md - **only include sections that have content**:

### [vX.Y.Z] - YYYY-MM-DD
**⚠️ Replace YYYY-MM-DD with actual current date from command above**

#### ✨ Features
*New functionality added to the application*
- **Feature Name**: Brief description of what was added and its benefit
- **Another Feature**: What it does and why it matters

#### 🐛 Bug Fixes  
*Issues that have been resolved*
- **FIXED: Issue Description**: What was broken and how it was fixed
- **FIXED: Another Issue**: Brief description of the problem and solution

#### 🔧 Improvements
*Enhancements to existing functionality*
- **Enhancement**: Technical improvement and its impact
- **Optimization**: What was optimized and the measurable benefit

#### 📦 Installation & Updates
*Changes to installation process or breaking changes*
- **Installation Change**: What changed in the installation process
- **Breaking Changes**: Any changes requiring migration

#### 📊 Summary
- **Files Changed**: X files modified
- **Issues Resolved**: X bugs fixed
- **Features Added**: X new features

---

## 📝 **GitHub Release Notes**

Use this format for GitHub releases and docs/releases/:

### Release Notes - v[VERSION]

**Released**: [Use ordinal date from command above - e.g., "3rd June 2025"]  
**Type**: [Major | Minor | Patch] Release  
**Compatibility**: [Fully backward compatible | Manual migration required]

---

### ✨ **New Features**

#### 🎯 **[Feature Name]**
- **Capability**: Brief description of what it does
- **Benefit**: How it helps users
- **Usage**: How to use it (if not obvious)

---

### 🐛 **Bug Fixes**

- **FIXED: [Issue Description]** - Brief explanation of the fix
- **FIXED: [Another Issue]** - Brief explanation

---

### 🔧 **Improvements**

- **[Area]**: Specific improvement made
- **Performance**: Performance gains achieved
- **Security**: Security enhancements

---

### 📦 **Installation & Updates**

#### 🚀 **Standard Update**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/[username]/[repo]/main/install-or-update.sh)"
```

#### 🔄 **Migration Notes**
[Include only if manual steps are required - otherwise state "Fully backward compatible"]

---

## ✅ **Release Checklist**

Before publishing a release:

1. **Version Consistency**
   - [ ] Update version in package.json (frontend & backend)
   - [ ] Update version in CHANGELOG.md
   - [ "`Check version in docs/releases/`

2. **Documentation**
   - [ ] Add entry to CHANGELOG.md (concise, user-focused)
   - [ ] Create release notes in docs/releases/vX/
   - [ ] Remove any template instructions

3. **Content Rules**
   - [ ] Use UK date formats (DD-MM-YYYY in code, "3rd June 2025" in prose)
   - [ ] Only include sections with actual content
   - [ ] Focus on user impact, not technical details
   - [ ] Remove all placeholder text

4. **Formatting**
   - [ ] Use consistent emoji prefixes for sections
   - [ ] Keep descriptions concise
   - [ ] Test markdown parsing in updates page
   - [ ] **NO LINKS** in release notes (breaks updates page)
   - [ ] **NO SIGN-OFFS** like "Enjoy!" at the end

5. **GitHub Release**
   - [ ] Create tag: `git tag -a vX.Y.Z -m "Version X.Y.Z"`
   - [ ] Push tag: `git push origin vX.Y.Z`
   - [ ] Create GitHub release with notes

---

## 📏 **Version Numbering**

Follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR** (vX.0.0): Breaking changes, major rewrites
- **MINOR** (v1.X.0): New features, backward compatible
- **PATCH** (v1.0.X): Bug fixes, minor improvements

---

## 💡 **Examples**

### Minimal Patch Release
```markdown
## [v1.4.2] - 2025-06-03

### 🐛 Bug Fixes
- **FIXED: Date format in demo mode**: Corrected timestamp display

### 📊 Summary
- **Files Changed**: 1 file modified
- **Issues Resolved**: 1 bug fixed
```

### Standard Minor Release
```markdown
## [v1.5.0] - 2025-06-15

### ✨ Features
- **Real-time Notifications**: Push notifications for portfolio changes
- **Advanced Filtering**: Enhanced asset filtering with custom criteria

### 🐛 Bug Fixes
- **FIXED: Portfolio sync errors**: Resolved synchronization failures
- **FIXED: Mobile responsive issues**: Fixed layout problems

### 🔧 Improvements
- **API Response Time**: 40% faster portfolio data loading
- **Memory Usage**: Reduced consumption by 25%

### 📊 Summary
- **Files Changed**: 12 files modified
- **Features Added**: 2 new features
- **Issues Resolved**: 5 bugs fixed
- **Performance**: 40% faster API responses
```

---

**Remember**: Less is more. Focus on what users need to know, not implementation details.