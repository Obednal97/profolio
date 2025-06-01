# ⚡ GitHub Setup Quick Reference Card

Use this as a checklist while following the [detailed walkthrough](github-setup-walkthrough.md).

## 🔧 **Essential Settings Checklist**

### **Repository Settings**
- [ ] Description: "Professional Self-Hosted Portfolio Management System - Complete data control and privacy for your financial portfolio tracking"
- [ ] Topics: `portfolio-management`, `finance`, `self-hosted`, `homelab`, `proxmox`, `investment-tracking`, `trading212`, `privacy`, `typescript`, `nextjs`, `nestjs`, `postgresql`, `docker`, `financial-data`, `api-integration`
- [ ] Issues ✅ enabled
- [ ] Discussions ✅ enabled  
- [ ] Wiki ❌ disabled
- [ ] Auto-delete head branches ✅ enabled

### **Security Settings**
- [ ] Dependency graph ✅ enabled
- [ ] Dependabot alerts ✅ enabled
- [ ] Dependabot security updates ✅ enabled
- [ ] CodeQL analysis ✅ enabled
- [ ] Secret scanning ✅ enabled
- [ ] Push protection ✅ enabled
- [ ] Private vulnerability reporting ✅ enabled

### **Branch Protection (main)**
- [ ] Require PR before merging ✅
- [ ] Require 1 approval ✅
- [ ] Dismiss stale approvals ✅
- [ ] Require status checks ✅
- [ ] Require up-to-date branches ✅
- [ ] Include administrators ✅

### **Issue Labels**
- [ ] 🐛 bug (#d73a4a)
- [ ] ✨ enhancement (#a2eeef)
- [ ] 📚 documentation (#0075ca)
- [ ] ❓ question (#d876e3)
- [ ] 👋 good first issue (#7057ff)
- [ ] 🙏 help wanted (#008672)

### **Discussion Categories**
- [ ] 💭 General
- [ ] 💡 Ideas
- [ ] 🙏 Q&A (Question/Answer format)
- [ ] 📢 Announcements (Announcement format)
- [ ] 🎉 Show and Tell

### **Actions Secrets**
- [ ] `HOST` - Your server IP
- [ ] `USERNAME` - profolio
- [ ] `SSH_KEY` - Your private SSH key
- [ ] `NODE_VERSION` - 18 (Variable)

---

## 🎯 **Priority Order**

### **Phase 1: Core Setup** (Do First)
1. Repository description and topics
2. Enable Issues and Discussions
3. Security settings (all of them)

### **Phase 2: Quality Control** (Do Second)  
1. Branch protection rules
2. Issue labels
3. Discussion categories

### **Phase 3: Automation** (Do Last)
1. Actions secrets and variables
2. First release
3. Community verification

---

## 🔍 **Quick URLs**
Replace `Obednal97/profolio` with your username/repo:

- **Settings:** `https://github.com/Obednal97/profolio/settings`
- **Security:** `https://github.com/Obednal97/profolio/settings/security_analysis`
- **Branches:** `https://github.com/Obednal97/profolio/settings/branches`
- **Labels:** `https://github.com/Obednal97/profolio/labels`
- **Discussions:** `https://github.com/Obednal97/profolio/discussions`
- **Actions:** `https://github.com/Obednal97/profolio/settings/secrets/actions`
- **Community:** `https://github.com/Obednal97/profolio/community`

---

## 🚨 **Critical Don'ts**

- ❌ Don't add required status checks until AFTER first CI run
- ❌ Don't enable branch protection without setting up CI first
- ❌ Don't set secrets in Variables (use Secrets instead)
- ❌ Don't forget to save changes after each section

---

## ✅ **Success Indicators**

You've set up everything correctly when:
- Community profile shows all green checkmarks
- First CI workflow runs successfully
- Test issue creation works with templates
- Discussions are accessible and categorized
- Branch protection prevents direct pushes to main

**Estimated setup time: 30-45 minutes** ⏱️ 