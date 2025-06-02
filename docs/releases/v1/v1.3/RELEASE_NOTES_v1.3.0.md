# Release Notes - v1.3.0

Released: 2025-02-06

## 🎯 Release Highlights

This release brings significant improvements to the notification system, enhanced user experience, and critical technical fixes that improve reliability across all deployment modes.

## ✨ New Features

### 🔔 **Notification Badge System**
- **User Avatar Badge**: Notification count now visible on user menu avatar button
- **Instant Visibility**: Users can see unread notifications even when menu is closed
- **Cross-Platform**: Works consistently across cloud and self-hosted deployments

### 🎭 **Demo Mode Banner**
- **Eye-catching Design**: Orange-to-red gradient banner above header
- **Clear Call-to-Action**: "Sign Up Free" prompt for demo users
- **Responsive**: Adapts text and layout for mobile and desktop
- **Dismissible**: Users can close the banner with X button

### 🔄 **Smart Auto-Updates Toggle**
- **Self-Hosted Detection**: Automatically detects localhost, 127.0.0.1, and .local domains
- **Interactive Toggle**: Smooth animated switch in System Info section
- **Cloud Managed Display**: Shows "Cloud Managed" for non-self-hosted deployments
- **Settings Persistence**: Preferences saved in localStorage (backend integration ready)

## 🐛 Critical Bug Fixes

### 🚨 **Next.js 15+ Compatibility**
- **Fixed Dynamic Route Parameters**: Resolved `params.symbol` async errors
- **API Route Updates**: Updated `/api/integrations/symbols/cached-price/[symbol]`
- **Portfolio History**: Fixed `/api/market-data/portfolio-history/[userId]`
- **Future-Proof**: Compatible with latest Next.js requirements

### ⏱️ **Yahoo Finance Rate Limiting**
- **Unified Timing**: Aligned all services to use consistent 5-second minimum delays
- **Retry Strategy**: Updated from 2s/4s/8s to 5s/10s/20s progression
- **Reduced Failures**: Eliminated timing conflicts causing price sync failures
- **Better Reliability**: Improved success rates for market data fetching

### 📊 **Updates Page Layout**
- **Sidebar Constraints**: Added `max-h-96` to Releases section for proper scrolling
- **System Info Positioning**: Fixed with `flex-shrink-0` for guaranteed bottom placement
- **Space Optimization**: Reduced gaps and padding for better space utilization
- **Viewport Calculations**: Resolved header height not being factored into layout

## 🎨 UI/UX Improvements

### 🔔 **Notifications Page Refinement**
- **Simplified Interface**: Removed statistics cards based on user feedback
- **Button Update**: Changed "Clear Read" to "Mark All as Read" with blue styling
- **Streamlined Layout**: Focus on notification filtering and actions
- **Cleaner Design**: Less clutter, more focus on actual notifications

### ⚙️ **System Information**
- **Better Icon**: Changed from Clock to Settings icon for clarity
- **Enhanced Layout**: Improved positioning and visual hierarchy
- **Auto-Updates Display**: Toggle shows current state and allows changes

## 🔧 Technical Improvements

### 🏠 **Deployment Detection**
- **Smart Hostname Checking**: Automatic detection of self-hosted environments
- **Environment Flexibility**: Works across localhost, IP addresses, and custom domains
- **Fallback Logic**: Graceful degradation for edge cases

### 🔄 **Rate Limiting Synchronization**
- **Unified Strategy**: All Yahoo Finance operations use consistent timing
- **Service Harmony**: PriceSyncService and YahooFinanceService now aligned
- **Reduced Conflicts**: Eliminated race conditions and timing issues
- **Better Logging**: Enhanced debugging with aligned timing messages

### 🎭 **Demo Session Management**
- **Enhanced DemoSessionManager**: Better session tracking and display logic
- **Banner Integration**: Proper demo mode detection for banner display
- **Security**: Secure session handling with proper isolation

## 🛡️ Security & Compatibility

- **User Isolation**: Proper notification badge display based on auth state
- **Demo Mode Security**: Secure banner display only for authenticated demo sessions  
- **Backward Compatible**: Zero breaking changes for existing installations
- **Cross-Deployment**: Works identically across cloud and self-hosted modes

## 📚 Documentation

- **Environment Mode Switching**: Comprehensive `.env.local` configuration guide
- **Self-Hosted Auto-Updates**: Documentation for auto-update toggle functionality
- **Demo Mode Features**: Complete guide for demo mode banner and user experience
- **Notification System**: Documentation for badge placement and user interaction patterns

## 🚀 Performance

- **Reduced API Conflicts**: Eliminated timing inconsistencies in market data fetching
- **Optimized Price Sync**: Better success rates with unified rate limiting approach
- **Efficient Notifications**: Streamlined notification loading and badge updates
- **Smart Updates**: Conditional auto-updates only for self-hosted deployments

## 🔄 Migration Guide

### Updating from v1.2.x

No breaking changes. All features are backward compatible:

1. **Automatic Update**: Run the installer to automatically update to v1.3.0
2. **New Features**: Notification badges and demo banner will appear automatically
3. **Settings**: Auto-updates toggle will be available for self-hosted deployments
4. **No Configuration Required**: All new features work out of the box

### For Self-Hosted Users

The auto-updates toggle will automatically appear in your System Info section. You can:
- Enable automatic updates for convenience
- Keep them disabled for manual control
- Setting is saved locally and persistent across sessions

### For Demo Users

The new demo mode banner will appear with:
- Clear signup call-to-action
- Dismissible interface
- No impact on existing demo functionality

## 📦 Installation & Updates

### Fresh Installation
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### Updating Existing Installation
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

The installer will automatically detect your existing installation and update to v1.3.0.

## 🙏 Acknowledgments

Thank you to the community for feedback on notification visibility and user experience improvements! Special thanks for the suggestions that led to:
- Notification badge improvements
- Demo mode banner implementation
- UI/UX simplifications

## 📊 Release Statistics

- **26 files changed**
- **4,174 insertions, 39 deletions**
- **13 new files created**
- **Multiple API routes enhanced**
- **Cross-platform compatibility maintained**
- **Zero breaking changes**

## 🔗 Related Resources

- **GitHub Release**: [v1.3.0 on GitHub](https://github.com/Obednal97/profolio/releases/tag/v1.3.0)
- **Changelog**: [CHANGELOG.md](../../../../CHANGELOG.md)
- **Installation Guide**: [README.md](../../../../README.md)
- **Previous Release**: [v1.2.3 Release Notes](../v1.2/RELEASE_NOTES_v1.2.3.md)

---

**Next Planned Release**: v1.3.1 (minor bug fixes and improvements)
**Roadmap**: [View project roadmap](https://github.com/Obednal97/profolio/projects) 