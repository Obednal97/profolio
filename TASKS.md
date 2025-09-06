# Profolio Simple Tasks
*For quick wins that don't require project planning*

## ✅ Task Criteria
A task (not a project) should be:
- Completable in < 4 hours
- Single file or component change
- No database schema changes
- No API changes
- No security implications
- Clear and unambiguous

---

## 🎨 UI/UX Polish Tasks

### Landing Page
- [ ] Adjust padding consistency on public pages
  - Review: `/app/page.tsx`, `/app/pricing/page.tsx`
  - Ensure consistent spacing tokens

- [ ] Add scroll snap behavior
  - File: `/app/page.tsx`
  - Add CSS scroll-snap to main sections

- [ ] Clean up footer links
  - File: `/components/Footer.tsx`
  - Remove redundant or broken links

### Visual Enhancements
- [ ] PWA status bar blur effect
  - File: `/app/globals.css`
  - Add proper meta theme-color with transparency

- [ ] Complete modal glass effects
  - Review all modal components
  - Apply existing liquid glass styles consistently

---

## 📝 Content Tasks

### Documentation
- [ ] Add screenshots to README.md
  - Capture: Dashboard, Portfolio, Settings
  - Optimize images for GitHub
  - Add to main README

- [ ] Improve forgot password page copy
  - File: `/app/forgot-password/page.tsx`
  - Clearer instructions
  - Better error messages

- [ ] Enhance policy pages formatting
  - Files: `/app/privacy/page.tsx`, `/app/terms/page.tsx`
  - Better typography
  - Add table of contents

---

## 🔧 Minor Fixes

### Settings
- [ ] Add "Set Password" button for OAuth users
  - File: `/app/app/settings/page.tsx`
  - Show only for users without password
  - Link to new password set flow

- [ ] Enhance account deletion confirmation
  - File: `/components/DeleteAccountDialog.tsx`
  - Add typing confirmation
  - Add countdown timer
  - Require password entry

### Notifications
- [ ] Add welcome notification
  - Trigger: 60 seconds after signup
  - Simple welcome message
  - Link to getting started guide

---

## 🧪 Testing Tasks

### E2E Tests
- [ ] Add test for OAuth password setting
- [ ] Add test for account deletion flow
- [ ] Add test for theme persistence

### Unit Tests
- [ ] Test rate limiting logic
- [ ] Test password validation
- [ ] Test session management

---

## 📊 Task Tracking

### Completed Today
- [x] Example: Fixed button alignment

### In Progress
- [ ] Currently working on: [Task name]

### Blocked
- [ ] Waiting for: [Blocker description]

---

## 🏃 Quick Win Checklist

Before starting a task, verify:
- [ ] It's truly a task (not a hidden project)
- [ ] You understand the full scope
- [ ] No hidden dependencies
- [ ] Can be tested in isolation
- [ ] Won't break existing features

---

## 💡 Task Ideas Parking Lot

Ideas that need more definition:
- Improve loading animations
- Add keyboard shortcuts
- Enhance tab navigation
- Add breadcrumbs
- Improve error toasts
- Add success animations

---

## 📝 Notes

- Tasks should be completed in one sitting
- If a task reveals complexity, convert it to a project
- Always test changes before marking complete
- Update this list after completing tasks