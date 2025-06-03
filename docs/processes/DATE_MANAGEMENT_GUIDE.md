# Date Management Guide
**Critical Requirements for Chronological Accuracy**

**Version**: 1.0  
**Last Updated**: 3rd June 2025  
**Status**: 🚨 MANDATORY COMPLIANCE

---

## 🚨 **FUNDAMENTAL RULE**

**NEW RELEASES MUST ALWAYS HAVE DATES AFTER PREVIOUS RELEASES**

This is non-negotiable. A release dated 2025-01-03 cannot come after a release dated 2025-06-03.

---

## 📅 **Before ANY Release Work**

### **Step 1: Get Current Date**
```bash
# Get current date in all required formats
CURRENT_DATE=$(date +%Y-%m-%d)                    # 2025-06-03 (for CHANGELOG.md)
CURRENT_DATE_UK=$(date +%d-%m-%Y)                 # 03-06-2025 (UK format)
CURRENT_DATE_READABLE=$(date +"%d %B %Y")         # 3 June 2025 (for release notes)
CURRENT_DATE_ORDINAL=$(date +"%d" | sed 's/1$/1st/; s/2$/2nd/; s/3$/3rd/; s/[4-9]$/th/; s/1[0-9]$/th/')$(date +" %B %Y")  # 3rd June 2025

echo "📅 Release Date Information:"
echo "CHANGELOG format:    $CURRENT_DATE"
echo "Release Notes format: $CURRENT_DATE_ORDINAL"
echo "UK format:          $CURRENT_DATE_UK"
```

### **Step 2: Verify Chronological Order**
```bash
# Check the last release date
echo "📅 Last release date:"
grep -m1 "##.*v[0-9]" CHANGELOG.md | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}'

# This should show a date BEFORE today's date
# If it shows a date AFTER today, there's a system clock issue or timezone problem
```

### **Step 3: Timezone Verification**
```bash
# Verify timezone is correct
date
timedatectl status  # On Linux
echo "Timezone: $(date +%Z)"
```

---

## 📝 **Date Format Standards**

### **CHANGELOG.md**
- **Format**: `YYYY-MM-DD` (ISO 8601)
- **Example**: `## [v1.8.3] - 2025-06-03`
- **Command**: `date +%Y-%m-%d`

### **Release Notes**
- **Format**: Ordinal day, full month, year (UK style)
- **Example**: `**Released**: 3rd June 2025`
- **Command**: `date +"%d %B %Y" | sed 's/^0//'` (with ordinal suffix)

### **Commit Messages**
- **Format**: ISO format for any date references
- **Example**: `feat: v1.8.3 - enhanced PWA status bar visual harmony`
- **Command**: `date +%Y-%m-%d`

### **Documentation**
- **Format**: UK conventions (DD-MM-YYYY or ordinal dates)
- **Example**: `Last Updated: 3rd June 2025`

---

## ⚠️ **Common Mistakes to Avoid**

### **❌ Hardcoding Dates**
```bash
# WRONG - never hardcode dates
echo "## [v1.8.3] - 2025-01-03"  # This might be wrong!
```

### **❌ Copy-Pasting Old Dates**
```bash
# WRONG - copying from templates without updating
echo "Released: 3rd January 2025"  # If today is June!
```

### **❌ Not Checking Previous Dates**
```bash
# WRONG - not verifying chronological order
# Could result in: v1.8.2 (2025-06-03) followed by v1.8.3 (2025-01-03)
```

### **❌ Timezone Issues**
```bash
# WRONG - using wrong timezone
TZ=UTC date  # If your project uses local time
```

---

## ✅ **Correct Workflow**

### **1. Start Every Release Session**
```bash
# Always run this first
echo "📅 RELEASE DATE CHECK - $(date)"
CURRENT_DATE=$(date +%Y-%m-%d)
echo "Using date: $CURRENT_DATE for this release"

# Verify against last release
LAST_DATE=$(grep -m1 "##.*v[0-9]" CHANGELOG.md | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}')
echo "Last release: $LAST_DATE"
echo "Current date: $CURRENT_DATE"

# Simple date comparison
if [[ "$CURRENT_DATE" > "$LAST_DATE" ]]; then
    echo "✅ Date is chronologically correct"
else
    echo "🚨 ERROR: Current date is not after last release date!"
    echo "Fix your system clock or check timezone"
    exit 1
fi
```

### **2. Update CHANGELOG.md**
```bash
# Use the verified current date
sed -i "1a\\## [v${NEW_VERSION}] - ${CURRENT_DATE}\\n" CHANGELOG.md
```

### **3. Create Release Notes**
```bash
# Use the ordinal date format
ORDINAL_DATE=$(date +"%d %B %Y" | sed 's/^0//' | sed 's/1 /1st /; s/2 /2nd /; s/3 /3rd /; s/[4-9] /th /; s/1[0-9] /th /')
echo "**Released**: $ORDINAL_DATE"
```

---

## 🔧 **Automated Date Checking Script**

Save as `scripts/check-release-date.sh`:

```bash
#!/bin/bash
# Release Date Verification Script

set -e

echo "🕐 Checking release date chronology..."

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)
echo "Current date: $CURRENT_DATE"

# Get last release date
LAST_DATE=$(grep -m1 "##.*v[0-9]" CHANGELOG.md | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}' || echo "No previous releases")

if [ "$LAST_DATE" != "No previous releases" ]; then
    echo "Last release: $LAST_DATE"
    
    # Compare dates
    if [[ "$CURRENT_DATE" > "$LAST_DATE" ]]; then
        echo "✅ Date chronology is correct"
    else
        echo "🚨 ERROR: Date chronology violation!"
        echo "Current date ($CURRENT_DATE) is not after last release ($LAST_DATE)"
        echo "Possible causes:"
        echo "- System clock is wrong"
        echo "- Timezone issue"
        echo "- Previous release has future date"
        exit 1
    fi
else
    echo "ℹ️ No previous releases found"
fi

# Export dates for use in other scripts
export RELEASE_DATE_ISO="$CURRENT_DATE"
export RELEASE_DATE_UK=$(date +%d-%m-%Y)
export RELEASE_DATE_READABLE=$(date +"%d %B %Y" | sed 's/^0//')
export RELEASE_DATE_ORDINAL=$(echo "$RELEASE_DATE_READABLE" | sed 's/1 /1st /; s/2 /2nd /; s/3 /3rd /; s/[4-9] /th /; s/1[0-9] /th /')

echo "📅 Exported date variables:"
echo "RELEASE_DATE_ISO=$RELEASE_DATE_ISO"
echo "RELEASE_DATE_UK=$RELEASE_DATE_UK"  
echo "RELEASE_DATE_READABLE=$RELEASE_DATE_READABLE"
echo "RELEASE_DATE_ORDINAL=$RELEASE_DATE_ORDINAL"
```

---

## 🔗 **Integration with Existing Processes**

### **Update Release Process Guide**
- Add date checking as Step 0
- Require date verification before any release work
- Include automated script in release workflow

### **Update Commit Guide**  
- Add date management section
- Require current date verification
- Include chronological checking commands

### **Update Templates**
- Add date checking commands to all templates
- Include warnings about chronological order
- Provide example commands for each format

---

## 📊 **Quality Assurance**

### **Pre-Release Checklist**
- [ ] ✅ Current date obtained with `date +%Y-%m-%d`
- [ ] ✅ Chronological order verified against last release
- [ ] ✅ CHANGELOG.md uses ISO format (YYYY-MM-DD)
- [ ] ✅ Release notes use UK ordinal format (3rd June 2025)
- [ ] ✅ All dates are consistent across documentation
- [ ] ✅ System timezone verified as correct

### **Post-Release Verification**
```bash
# Verify the release dates are in correct order
grep -E "##.*v[0-9].*[0-9]{4}-[0-9]{2}-[0-9]{2}" CHANGELOG.md | head -5
# Should show newest dates first, descending chronologically
```

---

## 🚨 **Emergency: Wrong Date Published**

If a release is published with the wrong date:

### **1. Immediate Actions**
```bash
# Fix CHANGELOG.md
CORRECT_DATE=$(date +%Y-%m-%d)
sed -i "s/## \[v$VERSION\] - [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/## [v$VERSION] - $CORRECT_DATE/" CHANGELOG.md

# Fix release notes
CORRECT_ORDINAL=$(date +"%d %B %Y" | sed 's/^0//' | sed 's/1 /1st /; s/2 /2nd /; s/3 /3rd /; s/[4-9] /th /; s/1[0-9] /th /')
sed -i "s/Released.*:/Released: $CORRECT_ORDINAL/" docs/releases/*/RELEASE_NOTES_*.md
```

### **2. Re-commit and Force Push** (if not yet published)
```bash
git add -A
git commit --amend -m "fix: correct release date to $(date +%Y-%m-%d)"
git push --force-with-lease origin main
```

### **3. Update GitHub Release** (if already published)
- Edit the GitHub release manually
- Update the description with correct date
- Add note about date correction

---

**Remember: Accurate dates maintain the integrity of our release history and prevent confusion for users tracking versions over time.** 🕐📅 