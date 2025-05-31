# ⚙️ GitHub Repository Configuration Guide

This guide helps you configure your GitHub repository for professional open source project management.

## 📋 **Repository Settings Overview**

Navigate to your repository → **Settings** to configure these sections:

### **🔧 General Settings**

#### **Repository Name & Description**
```
Name: profolio
Description: Professional Self-Hosted Portfolio Management System - Complete data control and privacy for your financial portfolio tracking
Website: https://github.com/Obednal97/profolio
Topics: portfolio, finance, self-hosted, investment-tracking, proxmox, homelab, privacy, typescript, nextjs, nestjs
```

#### **Features Configuration**
- ✅ **Issues** - Enable for bug reports and feature requests
- ✅ **Projects** - Enable for project management (optional)
- ✅ **Wiki** - Disable (use docs/ folder instead)
- ✅ **Discussions** - Enable for community Q&A
- ✅ **Sponsorships** - Enable if you want GitHub Sponsors

#### **Pull Request Settings**
- ✅ **Allow merge commits** - Enable
- ✅ **Allow squash merging** - Enable (recommended)
- ✅ **Allow rebase merging** - Enable
- ✅ **Automatically delete head branches** - Enable

---

## 🔒 **Security Configuration**

### **Code Security and Analysis**

#### **Dependency Graph**
- ✅ **Enable** - Track dependencies

#### **Dependabot Alerts**
- ✅ **Enable** - Get notified of vulnerable dependencies

#### **Dependabot Security Updates**
- ✅ **Enable** - Automatic security updates

#### **Code Scanning**
- ✅ **Enable CodeQL Analysis** - Your CI workflow includes this

#### **Secret Scanning**
- ✅ **Enable** - Detect secrets in code

### **Private Vulnerability Reporting**
- ✅ **Enable** - Allow private security reports
- **Contact:** Add your email for security reports

---

## 📊 **Branch Protection Rules**

### **Protect Main Branch**

Go to **Settings → Branches → Add Rule**

#### **Branch Name Pattern:** `main`

#### **Protection Settings:**
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals** (1 approval minimum)
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Require review from code owners** (if you have CODEOWNERS file)

- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - **Required Status Checks:**
    - `Backend Tests`
    - `Frontend Tests` 
    - `Security Scan`
    - `Integration Tests`

- ✅ **Require signed commits** (optional but recommended)
- ✅ **Include administrators** (apply rules to admins too)
- ✅ **Restrict pushes that create public merge commits**

---

## 🏷️ **Issue Labels Configuration**

### **Create These Labels:**

#### **Type Labels:**
```
🐛 bug - #d73a4a - Something isn't working
✨ enhancement - #a2eeef - New feature or request  
📚 documentation - #0075ca - Improvements or additions to documentation
❓ question - #d876e3 - Further information is requested
🔒 security - #b60205 - Security related issues
🧪 testing - #1d76db - Related to testing
🔧 maintenance - #fbca04 - Code maintenance and cleanup
```

#### **Priority Labels:**
```
🔥 critical - #b60205 - Critical issue requiring immediate attention
⚡ high - #d93f0b - High priority
📝 medium - #fbca04 - Medium priority  
📋 low - #0e8a16 - Low priority
```

#### **Status Labels:**
```
🚀 ready - #0e8a16 - Ready for development
🔄 in-progress - #fbca04 - Currently being worked on
✅ completed - #0e8a16 - Work completed
❌ wontfix - #ffffff - This will not be worked on
🤔 needs-info - #d876e3 - More information needed
👀 needs-review - #fbca04 - Needs review or decision
```

#### **Community Labels:**
```
👋 good first issue - #7057ff - Good for newcomers
🙏 help wanted - #008672 - Extra attention is needed
💡 idea - #a2eeef - Ideas for future consideration
🎉 hacktoberfest - #ff6f00 - Hacktoberfest eligible
```

---

## 💬 **Discussions Configuration**

### **Enable Discussions**
Go to **Settings → General → Features → Discussions**

### **Discussion Categories:**
```
💭 General - General discussions about Profolio
💡 Ideas - Ideas for new features and improvements
🙏 Q&A - Questions and help from the community  
📢 Announcements - Updates and announcements
🎉 Show and Tell - Share your Profolio setups and customizations
```

---

## 📊 **Projects Configuration** (Optional)

### **Create Project Board**
Go to **Projects → New Project**

#### **Project Template:** "Team planning"

#### **Views to Create:**
1. **📋 Backlog** - All issues and PRs
2. **🏃 Sprint** - Current sprint items
3. **🔄 In Progress** - Active work
4. **👀 Review** - Items in review
5. **✅ Done** - Completed items

#### **Automation Rules:**
- **Auto-add:** New issues and PRs to "Backlog"
- **Auto-move:** When PR opened → "In Progress"
- **Auto-move:** When PR merged → "Done"

---

## 🤖 **GitHub Actions Configuration**

### **Required Secrets** (if using CI/CD)
Go to **Settings → Secrets and Variables → Actions**

#### **For Deployment:**
```
HOST - Your server IP/hostname
USERNAME - SSH username (e.g., profolio)  
SSH_KEY - Private SSH key for deployment
```

#### **For Notifications** (optional):
```
DISCORD_WEBHOOK - Discord webhook URL
SLACK_WEBHOOK - Slack webhook URL
```

### **Required Variables:**
```
NODE_VERSION - 18 (Node.js version for CI)
```

---

## 📝 **Additional Files to Create**

### **CODEOWNERS File**
Create `.github/CODEOWNERS`:
```
# Global owners
* @Obednal97

# Backend specific
/backend/ @Obednal97
/backend/src/app/ @Obednal97

# Frontend specific  
/frontend/ @Obednal97

# Documentation
/docs/ @Obednal97
README.md @Obednal97
CONTRIBUTING.md @Obednal97

# Configuration
/.github/ @Obednal97
/scripts/ @Obednal97
install-or-update.sh @Obednal97
```

### **Issue Templates Config**
Create `.github/ISSUE_TEMPLATE/config.yml`:
```yaml
blank_issues_enabled: false
contact_links:
  - name: 💬 GitHub Discussions
    url: https://github.com/Obednal97/profolio/discussions
    about: Ask questions and get help from the community
  - name: 🔒 Security Issues
    url: https://github.com/Obednal97/profolio/security/advisories/new
    about: Report security vulnerabilities privately
```

---

## 🎯 **Repository Topics**

Add these topics to help discovery:
```
portfolio-management, finance, self-hosted, homelab, proxmox, 
investment-tracking, trading212, privacy, typescript, nextjs, 
nestjs, postgresql, docker, financial-data, api-integration
```

---

## 🔔 **Notification Settings**

### **Your Personal Settings**
Go to **Settings → Notifications**

#### **Recommended Settings:**
- ✅ **Issues** - Participating and @mentions
- ✅ **Pull Requests** - Participating and @mentions
- ✅ **Discussions** - Participating and @mentions
- ✅ **Releases** - All activity
- ✅ **Deployments** - Failures only

---

## 📈 **Insights Configuration**

### **Community Profile**
Check your community profile at: `/community`

#### **Required Files (✅ if you have them):**
- ✅ **README.md** - Project description
- ✅ **LICENSE** - MIT License
- ✅ **CONTRIBUTING.md** - Contribution guidelines
- ✅ **SECURITY.md** - Security policy
- ✅ **CODE_OF_CONDUCT.md** - Code of conduct (optional)
- ✅ **Issue Templates** - Bug reports, feature requests
- ✅ **Pull Request Template** - PR guidelines

### **Traffic Analytics**
Enable to track:
- Repository visits
- Clone activity
- Popular content
- Referring sites

---

## 🚀 **Release Configuration**

### **Create Release Template**
When creating releases, use this format:

```markdown
## 🚀 Profolio v1.0.0

Professional Self-Hosted Portfolio Management System

### 📦 One-Command Installation
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### 📋 What's New
- New feature 1
- Bug fix 2
- Improvement 3

### 🔐 Checksums
[Include SHA256 checksums]

### 🔗 Links
- [Documentation](https://github.com/Obednal97/profolio#readme)
- [Installation Guide](https://github.com/Obednal97/profolio#installation-options)
- [Changelog](https://github.com/Obednal97/profolio/blob/main/CHANGELOG.md)
```

---

## ✅ **Configuration Checklist**

### **Basic Setup:**
- [ ] Repository name and description configured
- [ ] Topics added for discoverability
- [ ] License file present (MIT)
- [ ] README with professional formatting

### **Community Features:**
- [ ] Issues enabled with templates
- [ ] Discussions enabled with categories
- [ ] Pull request template created
- [ ] Contributing guidelines present
- [ ] Security policy present

### **Code Quality:**
- [ ] Branch protection rules on main
- [ ] Required status checks configured
- [ ] Code scanning enabled (CodeQL)
- [ ] Secret scanning enabled
- [ ] Dependabot enabled

### **Automation:**
- [ ] CI workflow for testing
- [ ] Release workflow for automation
- [ ] Deployment workflow (existing)
- [ ] Issue/PR labeling configured

### **Documentation:**
- [ ] Professional README
- [ ] Organized docs/ folder
- [ ] Installation guide
- [ ] API documentation
- [ ] Contributing guide

---

## 🎉 **You're Ready!**

With this configuration, your repository will have:

✅ **Professional Appearance** - Clean, organized, discoverable  
✅ **Community Ready** - Easy contribution process  
✅ **Quality Assurance** - Automated testing and security  
✅ **Release Management** - Automated releases with changelogs  
✅ **Documentation** - Comprehensive guides and help  

Your repository is now ready for **1.0.0 public release!** 🚀 