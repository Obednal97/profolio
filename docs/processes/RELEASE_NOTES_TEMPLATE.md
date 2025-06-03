# Release Notes - v[VERSION]

**🚨 CRITICAL: GET CURRENT DATE FIRST**

```bash
# ALWAYS run this before creating release notes
CURRENT_DATE_READABLE=$(date +"%-d %B %Y")  # e.g., "3 June 2025"
CURRENT_DATE_ORDINAL=$(date +"%d" | sed 's/1$/1st/; s/2$/2nd/; s/3$/3rd/; s/[4-9]$/th/; s/1[0-9]$/th/')$(date +" %B %Y")  # e.g., "3rd June 2025"
echo "Today's date for release notes: $CURRENT_DATE_ORDINAL"

# Check last release date to ensure chronological order
echo "Last release was:"
grep -m1 "##.*v[0-9]" CHANGELOG.md
echo "⚠️ NEW DATE MUST BE AFTER THE ABOVE DATE"
```

**Released**: [Use date from command above - e.g., "3rd June 2025"]  
**Type**: [Major | Minor | Patch] Release  
**Compatibility**: [Fully backward compatible | Manual migration required]

---

## ✨ **New Features**

### 🎯 **[Feature Name]**
- **[Capability]**: Brief description of what it does
- **[Benefit]**: How it helps users
- **[Usage]**: How to use it (if not obvious)

---

## 🐛 **Bug Fixes**

- **FIXED: [Issue Description]** - Brief explanation of the fix
- **FIXED: [Another Issue]** - Brief explanation

---

## 🔧 **Improvements**

- **[Area]**: Specific improvement made
- **[Performance]**: Performance gains achieved
- **[Security]**: Security enhancements

---

## 📦 **Installation & Updates**

### 🚀 **Standard Update**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/[username]/[repo]/main/install-or-update.sh)"
```

### 🔄 **Migration Notes**
[Include only if manual steps are required - otherwise state "Fully backward compatible"]

**If manual steps needed:**
```bash
# Step 1: Description
[command]

# Step 2: Description  
[command]
```

### 🔍 **Verification**
```bash
# Verify installation
[verification command]
```

---

## 📝 **Template Instructions**

### **Required Sections:**
- New Features OR Bug Fixes OR Improvements (at least one)
- Installation & Updates

### **Optional Sections:**
Remove sections that don't apply:
- New Features (if none)
- Bug Fixes (if none) 
- Improvements (if none)

### **❌ DO NOT INCLUDE:**
- Links sections (GitHub links, documentation links, etc.)
- Sign-offs or "enjoy" messages at the end
- External references that break updates page parsing

### **✅ UPDATES PAGE COMPATIBILITY:**
- Use clean markdown without complex nested links
- Keep formatting simple for parser compatibility
- Focus on content that users need to know
- Avoid reference-style links or complex formatting

### **Before Publishing:**
1. Replace all `[placeholders]` with actual content
2. Remove unused sections
3. **Remove links section entirely**
4. **Remove any sign-off messages**
5. Use "Month Day, Year" date format (e.g., "June 2, 2025")
6. Keep descriptions concise and user-focused 
7. Test that markdown parses correctly in updates page 