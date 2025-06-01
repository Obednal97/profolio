# 🚀 GitHub Repository Setup Walkthrough

This is your step-by-step guide to configure Profolio's GitHub repository for professional open source release. Follow each section in order.

## 📋 **Prerequisites**

Before starting:
- [ ] Repository is created and code is pushed
- [ ] You have admin access to the repository
- [ ] All files are committed (README.md, issue templates, etc.)

---

## 🔧 **Step 1: Basic Repository Settings**

### **Navigate to Repository Settings**
1. Go to your repository: `https://github.com/Obednal97/profolio`
2. Click the **"Settings"** tab (far right in the repository navigation)

### **General Settings**
1. **Repository name:** Should be `profolio` ✅ (already set)

2. **Description:** 
   ```
   Professional Self-Hosted Portfolio Management System - Complete data control and privacy for your financial portfolio tracking
   ```

3. **Website URL:**
   ```
   https://github.com/Obednal97/profolio
   ```

4. **Topics:** Click "⚙️ Manage topics" and add:
   ```
   portfolio-management
   finance
   self-hosted
   homelab
   proxmox
   investment-tracking
   trading212
   privacy
   typescript
   nextjs
   nestjs
   postgresql
   docker
   financial-data
   api-integration
   ```

5. **Features Section - Enable these:**
   - ✅ **Issues** (for bug reports and feature requests)
   - ✅ **Discussions** (for community Q&A)
   - ❌ **Wiki** (we use docs/ folder instead)
   - ✅ **Projects** (optional - for project management)
   - ✅ **Sponsorships** (optional - if you want GitHub Sponsors)

6. **Pull Requests Section:**
   - ✅ **Allow merge commits**
   - ✅ **Allow squash merging** 
   - ✅ **Allow rebase merging**
   - ✅ **Automatically delete head branches**

7. **Click "Save changes"**

---

## 🔒 **Step 2: Security Configuration**

### **Navigate to Security Settings**
1. In repository Settings, click **"Security"** in the left sidebar

### **Code Security and Analysis**
1. **Dependency graph:**
   - ✅ **Enable** - "Allow GitHub to perform read-only analysis"

2. **Dependabot alerts:**
   - ✅ **Enable** - "Get notified when one of your dependencies has a vulnerability"

3. **Dependabot security updates:**
   - ✅ **Enable** - "Allow Dependabot to open pull requests automatically"

4. **Code scanning:**
   - Click **"Set up"** next to "CodeQL analysis"
   - Choose **"Default"** setup
   - Click **"Enable CodeQL"**
   - Note: Your CI workflow already includes CodeQL, so this adds extra protection

5. **Secret scanning:**
   - ✅ **Enable** - "Scan for secrets"
   - ✅ **Enable push protection** - "Block commits that contain secrets"

### **Private Vulnerability Reporting**
1. ✅ **Enable** - "Allow users to privately report potential security vulnerabilities"
2. **Contact email:** Add your email address for security reports

---

## 📊 **Step 3: Branch Protection Rules**

### **Navigate to Branches**
1. In repository Settings, click **"Branches"** in the left sidebar
2. Click **"Add rule"**

### **Configure Main Branch Protection**
1. **Branch name pattern:** `main`

2. **Protect matching branches - Enable these:**
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals:** Set to `1`
     - ✅ **Dismiss stale PR approvals when new commits are pushed**
     - ✅ **Require review from code owners** (if you created CODEOWNERS file)

   - ✅ **Require status checks to pass before merging**
     - ✅ **Require branches to be up to date before merging**
     - **Required status checks:** Add these when they appear after your first CI run:
       - `🔧 Backend Tests`
       - `🎨 Frontend Tests`
       - `🔒 Security Scan`
       - `🔗 Integration Tests`

   - ✅ **Require signed commits** (optional but recommended)
   - ✅ **Include administrators** (apply rules to repo admins too)
   - ✅ **Restrict pushes that create public merge commits**

3. **Click "Create"**

**Note:** Status checks will only appear after you've run your CI workflow at least once.

---

## 🏷️ **Step 4: Issue Labels Setup**

### **Navigate to Issues**
1. Go to the main repository page
2. Click **"Issues"** tab
3. Click **"Labels"** 
4. Delete default labels (optional) and create these professional labels:

### **Create These Labels** (click "New label" for each):

#### **Type Labels:**
```
Name: 🐛 bug
Description: Something isn't working
Color: #d73a4a
```

```
Name: ✨ enhancement  
Description: New feature or request
Color: #a2eeef
```

```
Name: 📚 documentation
Description: Improvements or additions to documentation
Color: #0075ca
```

```
Name: ❓ question
Description: Further information is requested
Color: #d876e3
```

```
Name: 🔒 security
Description: Security related issues
Color: #b60205
```

```
Name: 🧪 testing
Description: Related to testing
Color: #1d76db
```

#### **Priority Labels:**
```
Name: 🔥 critical
Description: Critical issue requiring immediate attention
Color: #b60205
```

```
Name: ⚡ high
Description: High priority
Color: #d93f0b
```

```
Name: 📝 medium
Description: Medium priority
Color: #fbca04
```

```
Name: 📋 low
Description: Low priority
Color: #0e8a16
```

#### **Community Labels:**
```
Name: 👋 good first issue
Description: Good for newcomers
Color: #7057ff
```

```
Name: 🙏 help wanted
Description: Extra attention is needed
Color: #008672
```

```
Name: 💡 idea
Description: Ideas for future consideration
Color: #a2eeef
```

---

## 💬 **Step 5: Enable Discussions**

### **Navigate to Discussions Setup**
1. In repository Settings, click **"General"**
2. Scroll to **"Features"** section
3. ✅ Check **"Discussions"**
4. Click **"Save changes"**

### **Configure Discussion Categories**
1. Go to repository main page
2. Click **"Discussions"** tab
3. Click **"⚙️"** (gear icon) next to "New discussion"
4. Click **"Edit categories"**

### **Create These Categories:**

#### **General Category (default - edit it):**
```
Name: 💭 General
Description: General discussions about Profolio
Format: Open-ended discussion
```

#### **Add New Categories:**
```
Name: 💡 Ideas
Description: Ideas for new features and improvements
Format: Open-ended discussion
```

```
Name: 🙏 Q&A
Description: Questions and help from the community
Format: Question and answer
```

```
Name: 📢 Announcements
Description: Updates and announcements
Format: Announcement
```

```
Name: 🎉 Show and Tell
Description: Share your Profolio setups and customizations
Format: Open-ended discussion
```

---

## 🤖 **Step 6: GitHub Actions Secrets**

### **Navigate to Secrets and Variables**
1. In repository Settings, click **"Secrets and variables"** → **"Actions"**

### **Repository Secrets (for deployment)**
Click **"New repository secret"** for each:

#### **For Self-Hosted Deployment:**
```
Name: HOST
Secret: YOUR_SERVER_IP (e.g., 192.168.1.27)
```

```
Name: USERNAME  
Secret: profolio
```

```
Name: SSH_KEY
Secret: [Your private SSH key content]
```

#### **Optional - For Notifications:**
```
Name: DISCORD_WEBHOOK
Secret: [Your Discord webhook URL if you want notifications]
```

### **Repository Variables**
Click **"Variables"** tab, then **"New repository variable"**:

```
Name: NODE_VERSION
Value: 18
```

---

## 📈 **Step 7: Repository Insights Configuration**

### **Community Profile Check**
1. Go to: `https://github.com/Obednal97/profolio/community`
2. Verify you have these files (should all be ✅):
   - ✅ README.md
   - ✅ LICENSE
   - ✅ CONTRIBUTING.md
   - ✅ SECURITY.md
   - ✅ Issue templates
   - ✅ Pull request template

### **Enable Traffic Analytics**
1. In repository Settings, scroll to **"Data use"**
2. Check any analytics options you want

---

## 🎯 **Step 8: Create Your First Release**

### **Prepare for Release**
1. **Update CHANGELOG.md** - Add entry for v1.0.0
2. **Update package.json version** - Should be "1.0.0"
3. **Commit and push** these changes

### **Create Release**
1. Go to repository main page
2. Click **"Create a new release"** (right sidebar)
3. **Tag version:** `v1.0.0`
4. **Release title:** `Profolio v1.0.0`
5. **Description:** Use the template from your release workflow
6. ✅ **Set as the latest release**
7. Click **"Publish release"**

---

## ✅ **Step 9: Verification Checklist**

After completing all steps, verify everything works:

### **Repository Health:**
- [ ] Repository description and topics are set
- [ ] All security features are enabled
- [ ] Branch protection is active on main
- [ ] Issue templates work (create a test issue)
- [ ] Discussions are enabled and categorized

### **GitHub Actions:**
- [ ] CI workflow runs on pull requests
- [ ] Security scanning is working
- [ ] Deployment secrets are configured
- [ ] No workflow errors in Actions tab

### **Community Features:**
- [ ] Labels are organized and professional
- [ ] Issue templates guide users properly
- [ ] PR template enforces quality standards
- [ ] Discussions provide support channel

### **Documentation:**
- [ ] README.md displays properly
- [ ] Installation instructions are clear
- [ ] Contributing guide helps new developers
- [ ] Security policy is accessible

---

## 🚨 **Common Issues and Solutions**

### **Status Checks Not Available**
- **Problem:** Required status checks don't appear in branch protection
- **Solution:** Run CI workflow first, then return to add status checks

### **Dependabot Fails**
- **Problem:** Dependabot can't access private dependencies
- **Solution:** Ensure all dependencies are public or configure access

### **Actions Fail**
- **Problem:** CI workflows fail on first run
- **Solution:** Check secrets are set correctly, review workflow logs

### **No Community Profile**
- **Problem:** Community profile shows missing files
- **Solution:** Ensure all files are in main branch and properly named

---

## 🎉 **You're Done!**

Your repository is now configured for professional open source development with:

✅ **Professional Appearance** - Clean, organized, discoverable  
✅ **Security Best Practices** - Automated scanning and protection  
✅ **Quality Assurance** - Required reviews and testing  
✅ **Community Features** - Issues, discussions, contributing guides  
✅ **Release Management** - Automated releases and changelogs  

**Next Steps:**
1. Share the repository with the community
2. Create your first public announcement
3. Start accepting contributions
4. Monitor community engagement

**Your repository is ready for 1.0.0 public release! 🚀** 