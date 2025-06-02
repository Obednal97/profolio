# Release Notes - v1.3.0

**Released**: June 2, 2025  
**Type**: Minor Release with Enhanced User Experience  
**Stability**: Production Ready

---

## 🎯 **Release Highlights**

🔔 **Notification Badges** - Real-time notification count display on user avatar  
🎭 **Demo Mode Banner** - Clear signup call-to-action for demo users  
🔄 **Auto-Updates Toggle** - Smart self-hosted detection with update controls  
🚨 **Critical Fixes** - Next.js 15+ compatibility and rate limiting improvements  

---

## ✨ **New Features**

### 🔔 **Notification Badge System**
**Enhanced user experience with instant notification visibility**

- **User Avatar Badge**: Notification count now visible on user menu avatar button
- **Instant Visibility**: Users can see unread notifications even when menu is closed
- **Cross-Platform**: Works consistently across cloud and self-hosted deployments
- **Real-Time Updates**: Badge count updates automatically as notifications arrive

### 🎭 **Demo Mode Banner**
**Clear call-to-action for demo users**

- **Eye-catching Design**: Orange-to-red gradient banner above header
- **Clear Call-to-Action**: "Sign Up Free" prompt for demo users
- **Responsive**: Adapts text and layout for mobile and desktop
- **Dismissible**: Users can close the banner with X button

### 🔄 **Smart Auto-Updates Toggle**
**Intelligent deployment detection with update controls**

- **Self-Hosted Detection**: Automatically detects localhost, 127.0.0.1, and .local domains
- **Interactive Toggle**: Smooth animated switch in System Info section
- **Cloud Managed Display**: Shows "Cloud Managed" for non-self-hosted deployments
- **Settings Persistence**: Preferences saved in localStorage

---

## 🐛 **Critical Bug Fixes**

### 🚨 **FIXED: Next.js 15+ Compatibility**
**Resolved dynamic route parameter issues**

- **Fixed Dynamic Route Parameters**: Resolved `params.symbol` async errors
- **API Route Updates**: Updated `/api/integrations/symbols/cached-price/[symbol]`
- **Portfolio History**: Fixed `/api/market-data/portfolio-history/[userId]`
- **Future-Proof**: Compatible with latest Next.js requirements

### ⏱️ **FIXED: Yahoo Finance Rate Limiting**
**Unified timing across all services**

- **Unified Timing**: Aligned all services to use consistent 5-second minimum delays
- **Retry Strategy**: Updated from 2s/4s/8s to 5s/10s/20s progression
- **Reduced Failures**: Eliminated timing conflicts causing price sync failures
- **Better Reliability**: Improved success rates for market data fetching

### 📊 **FIXED: Updates Page Layout**
**Improved sidebar positioning and space utilization**

- **Sidebar Constraints**: Added proper scrolling to Releases section
- **System Info Positioning**: Fixed positioning for guaranteed bottom placement
- **Space Optimization**: Reduced gaps and padding for better space utilization
- **Viewport Calculations**: Resolved header height layout issues

---

## 🔧 **Improvements**

### 🔔 **Notifications Interface Enhancement**
**Simplified interface based on user feedback**

- **Streamlined Interface**: Removed statistics cards for cleaner design
- **Button Update**: Changed "Clear Read" to "Mark All as Read" with blue styling
- **Focus on Content**: More emphasis on actual notifications rather than metrics
- **Better User Experience**: Cleaner, more intuitive notification management

### ⚙️ **System Information Enhancement**
**Better clarity and functionality**

- **Better Icon**: Changed from Clock to Settings icon for clarity
- **Enhanced Layout**: Improved positioning and visual hierarchy
- **Auto-Updates Display**: Toggle shows current state and allows changes
- **Smart Detection**: Automatic environment detection for appropriate displays

### 🏠 **Smart Deployment Detection**
**Intelligent environment recognition**

- **Hostname Checking**: Automatic detection of self-hosted environments
- **Environment Flexibility**: Works across localhost, IP addresses, and custom domains
- **Fallback Logic**: Graceful degradation for edge cases
- **Cross-Platform Consistency**: Reliable detection across different deployment types

---

## 🔄 **Migration Guide**

### **Updating from v1.2.x**
No breaking changes. All features are backward compatible:

1. **Automatic Update**: Run the installer to automatically update to v1.3.0
2. **New Features**: Notification badges and demo banner appear automatically
3. **Settings**: Auto-updates toggle available for self-hosted deployments
4. **No Configuration Required**: All new features work out of the box

### **For Self-Hosted Users**
The auto-updates toggle will automatically appear in your System Info section with preferences saved locally.

### **For Demo Users**
The new demo mode banner will appear with clear signup call-to-action and dismissible interface.

---

## 📦 **Installation & Updates**

### 🚀 **Quick Update**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

The installer automatically detects your existing installation and updates to v1.3.0.

---

## 📊 **Summary**

- **Files Changed**: 26 files modified
- **Features Added**: 3 new features
- **Issues Resolved**: 3 critical fixes
- **User Experience**: Significant improvements in notification visibility and demo user guidance
- **Compatibility**: Zero breaking changes, full backward compatibility

---

## 🔗 **Related Resources**

- [GitHub Release](https://github.com/Obednal97/profolio/releases/tag/v1.3.0)
- [Installation Guide](../../../../README.md)
- [Changelog](../../../../CHANGELOG.md)
- [Previous Release](../v1.2/RELEASE_NOTES_v1.2.3.md)

---

**🎉 Thank you for using Profolio! This release brings significant improvements to user experience and notification management.** 