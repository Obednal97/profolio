# 👀 GitHub Visual Interface Guide

This guide describes exactly what you'll see in the GitHub interface and where to click for each setting.

## 🏠 **Repository Main Page Navigation**

When you're on `https://github.com/Obednal97/profolio`, you'll see:

### **Top Navigation Tabs:**
```
Code | Issues | Pull requests | Actions | Projects | Wiki | Security | Insights | Settings
```

### **Right Sidebar (Code tab):**
```
About
  [Edit repository details button]
  
Releases
  [Create a new release button]
  
Packages
  
Environments
```

---

## ⚙️ **Settings Page Layout**

Click the **"Settings"** tab (rightmost). You'll see a left sidebar with:

### **Left Sidebar Sections:**
```
General
Access
  Collaborators and teams
  Moderation options
Security
  Code security and analysis
  Deploy keys
  Secrets and variables
    Actions
    Codespaces
    Dependabot
Branches
Actions
  General
  Runners
Webhooks
Notifications
Integrations
  GitHub Apps
  Email notifications
Pages
```

---

## 🔧 **Step-by-Step Visual Guide**

### **1. General Settings**

**Location:** Settings → General

**What you'll see:**
```
Repository name: [profolio]
Description: [empty text box]
Website: [empty text box]

⚙️ Manage topics

Features:
☑️ Issues
   Organize and track bugs and feature requests
☑️ Projects  
   Coordinate work with project boards
☐ Wiki
   Document your project with wikis
☐ Discussions
   Connect with your community in a structured way
```

**Actions:**
- Fill in description box
- Click "⚙️ Manage topics" → Add topics → Save changes
- Check "Discussions" box
- Uncheck "Wiki" if checked

---

### **2. Security Settings**

**Location:** Settings → Security (left sidebar)

**What you'll see:**
```
Code security and analysis

Security advisories
  □ Private vulnerability reporting
  
Dependency graph  
  □ Understand your dependencies
  
Dependabot
  □ Dependabot alerts
  □ Dependabot security updates
  □ Dependabot version updates
  
Code scanning
  □ Code scanning alerts
  
Secret scanning
  □ Secret scanning alerts
  □ Push protection
```

**Actions:**
- Check ALL the boxes (enable everything)
- Click "Enable" buttons where they appear

---

### **3. Branch Protection**

**Location:** Settings → Branches (left sidebar)

**What you'll see:**
```
Branch protection rules
  Add rule [button]

Default branch
  main [button to change]
```

**Actions:**
- Click "Add rule" button
- Enter "main" in branch name pattern
- Check protection options as listed in walkthrough

---

### **4. Issue Labels**

**Location:** Main repo page → Issues tab → Labels button

**What you'll see:**
```
Labels  Milestones

[New label] button

bug          Something isn't working         [Edit] [Delete]
enhancement  New feature or request          [Edit] [Delete]
...
```

**Actions:**
- Click "New label" for each label
- Fill in: Name, Description, Color
- Click "Create label"

---

### **5. Discussions Setup**

**Location:** Settings → General (scroll to Features section)

**What you'll see:**
```
Features
☑️ Issues
☐ Discussions  ← Check this box
☐ Wiki
```

**After enabling, go to main repo → Discussions tab:**
```
Discussions  [⚙️ gear icon]

[New discussion] button

Categories:
  General         0 discussions
  [Edit categories button]
```

---

### **6. Actions Secrets**

**Location:** Settings → Secrets and variables → Actions

**What you'll see:**
```
Actions secrets and variables

Repository secrets                     Repository variables
[New repository secret] button         [New repository variable] button

Name              Updated
(no secrets yet)                      (no variables yet)
```

**Actions:**
- Click "New repository secret"
- Enter name and secret value
- Click "Add secret"

---

## 🔍 **Finding Specific Settings**

### **If you can't find a setting:**

1. **Check the left sidebar** - Settings are grouped logically
2. **Use browser search** - Ctrl/Cmd+F to search for keywords
3. **Look for toggle switches** - Most features are simple on/off toggles
4. **Save changes** - Many sections have a "Save changes" button at the bottom

### **Common UI Elements:**

- **Toggle switches:** `☑️` (enabled) vs `☐` (disabled)
- **Buttons:** `[Save changes]`, `[Add rule]`, `[Enable]`
- **Dropdowns:** Click to expand options
- **Text fields:** Click to edit

---

## 🎯 **Visual Verification**

### **Community Profile Check**

Go to: `https://github.com/Obednal97/profolio/community`

**You should see:**
```
Community profile
Help people interested in this repository understand your project by adding a README, CODE_OF_CONDUCT, CONTRIBUTING, or LICENSE.

✅ Description
✅ README
✅ License
✅ Contributing guidelines
✅ Security policy
✅ Issue templates
✅ Pull request template
```

### **Security Tab Check**

Go to: Security tab → Overview

**You should see:**
```
Security overview
No security advisories

Dependency graph: ✅ Active
Dependabot alerts: ✅ Active  
Code scanning: ✅ Active
Secret scanning: ✅ Active
```

---

## 🚨 **Common UI Gotchas**

### **Settings Don't Save**
- **Problem:** Made changes but they disappeared
- **Solution:** Look for "Save changes" button at bottom of section

### **Can't Find Required Status Checks**
- **Problem:** Branch protection doesn't show CI checks
- **Solution:** Run a workflow first, then checks will appear

### **Labels Look Different**
- **Problem:** Colors don't match examples
- **Solution:** GitHub uses hex colors - copy exact codes from guide

### **Discussions Don't Appear**
- **Problem:** Enabled but can't see Discussions tab
- **Solution:** Refresh browser page after enabling

---

## 💡 **Pro Tips**

1. **Open in new tabs** - Right-click links to keep your place
2. **Use browser back** - Safe to go back and forth between settings
3. **Mobile not recommended** - Use desktop browser for setup
4. **Save frequently** - Don't lose work by navigating away
5. **Test as you go** - Create a test issue to verify templates work

**Remember:** The GitHub interface updates regularly, so some details might look slightly different, but the core functionality and navigation remains the same! 