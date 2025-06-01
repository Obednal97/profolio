# Release Notes - v1.2.0

Released: January 6, 2025

## 🎯 Release Highlights

**v1.2.0** transforms demo mode from simple mock data to a **genuine portfolio management experience** while fixing critical security vulnerabilities. Demo users now get 24-hour access to real market data and authentic platform capabilities, making this release perfect for showcasing Profolio to potential users.

### 🌟 **Key Improvements**
- **Real Demo Experience**: Demo users get actual Yahoo Finance market data
- **Security Hardening**: Fixed authentication vulnerabilities and data isolation issues  
- **Session Management**: 24-hour demo sessions with automatic cleanup
- **Enhanced UX**: Authentic portfolio tracking with live prices

---

## ✨ New Features

### 🎭 **Enhanced Demo Mode with Real Market Data**

Demo mode has been completely transformed to provide an authentic experience:

**Before**: Mock static data that didn't represent real platform capabilities  
**After**: Real Yahoo Finance data with genuine portfolio management features

#### **Features:**
- **Live Market Prices**: Demo users see actual stock/crypto prices from Yahoo Finance
- **Real Symbol Lookup**: Asset creation uses real market data and symbol validation
- **Authentic Portfolio Tracking**: Genuine portfolio analytics with real price movements
- **Market Data Widget**: Displays current market prices for major indices (SPY, QQQ, VTI)

#### **How to Use:**
1. Visit your Profolio landing page
2. Click "Try Demo" 
3. Explore with real market data for 24 hours
4. Session automatically expires and cleans up

### ⏰ **24-Hour Session Management**

New `DemoSessionManager` provides secure, time-limited demo access:

#### **Features:**
- **Automatic Expiration**: Demo sessions end after exactly 24 hours
- **Session Tracking**: Real-time monitoring with remaining time logging
- **Periodic Validation**: Checks every 5 minutes for expired sessions
- **Automatic Cleanup**: All demo data removed when session expires
- **Manual Logout**: Users can end demo sessions early

#### **Console Output:**
```
🎭 Demo session started - expires in 24 hours
🎭 Demo session active - 23h 45m remaining
🎭 Demo mode: Fetching real market data with temporary session
🎭 Demo session expired after 24 hours
```

---

## 🐛 Critical Security Fixes

### 🚨 **Authentication Vulnerabilities Resolved**

Fixed multiple critical security issues that could lead to data leakage:

#### **User ID Inconsistencies**
- **Issue**: Components mixed `user.uid` (Firebase) and `user.id` (unified) properties
- **Risk**: Potential cross-user data access or failed queries
- **Fix**: Standardized all components to use `user.id` consistently

**Components Updated:**
- Settings page, Expense Manager, Portfolio page
- Properties page, Asset Manager, Property Manager  
- Layout wrapper, Market data widget, API config modal

#### **Hardcoded Token Security**
- **Issue**: Components used hardcoded tokens like `demo-token-secure-123`
- **Risk**: Invalid authentication, potential security bypass
- **Fix**: Replaced with proper unified auth system tokens

#### **Data Isolation**
- **Issue**: Inconsistent user identification could mix user data
- **Risk**: Users seeing other users' portfolios or assets
- **Fix**: Consistent user.id usage ensures proper data boundaries

### 🔒 **Token Management Improvements**

- **Eliminated**: All hardcoded authentication tokens
- **Enhanced**: Proper auth token flow through unified system
- **Secured**: API calls now use validated tokens only
- **Protected**: Demo tokens properly isolated and managed

---

## 🔧 Technical Improvements

### **DemoSessionManager Class**

New utility providing complete session lifecycle management:

```typescript
// Example usage
const session = DemoSessionManager.checkDemoSession();
if (session.isValid) {
  const remaining = DemoSessionManager.getRemainingTimeString();
  console.log(`Demo session: ${remaining} remaining`);
}
```

**Methods:**
- `startDemoSession()` - Initialize 24-hour session
- `checkDemoSession()` - Validate and get remaining time
- `endDemoSession()` - Manual cleanup and logout
- `getRemainingTimeString()` - Human-readable time remaining
- `setupPeriodicCheck()` - Automatic validation every 5 minutes

### **Enhanced Error Handling**

- **Market Data**: Better fallback mechanisms when APIs unavailable
- **SSR Safety**: Improved server-side rendering for auth components
- **Session Validation**: Graceful handling of expired or invalid sessions

### **Code Standardization**

- **User Properties**: Consistent `user.id` usage across all components
- **Auth Integration**: All components migrated to unified authentication
- **Type Safety**: Enhanced TypeScript interfaces for session management

---

## 📊 Demo Mode Capabilities

### **What Demo Users Can Do:**

1. **Portfolio Management**
   - Create and edit assets with real market symbols
   - Track portfolio performance with live prices
   - View authentic portfolio analytics

2. **Market Data Access**
   - Real-time market prices for stocks and crypto
   - Market data widget with major indices
   - Live symbol lookup and validation

3. **Asset Management**
   - Add stocks, ETFs, crypto with real symbols
   - Edit asset details with live price updates
   - Portfolio value calculations with real data

4. **Session Features**
   - 24-hour access to all platform features
   - Real backend API access (read-only for demo)
   - Automatic cleanup when session expires

### **Demo vs Real User Differences:**

| Feature | Demo Users | Real Users |
|---------|------------|------------|
| Market Data | ✅ Real Yahoo Finance data | ✅ Real Yahoo Finance data |
| Portfolio Creation | ✅ Temporary (24h) | ✅ Permanent |
| Data Persistence | ❌ Cleared after 24h | ✅ Saved permanently |
| Account Registration | ❌ Not required | ✅ Required |
| Session Duration | ⏰ 24 hours | ♾️ Unlimited |

---

## 🔄 Migration Guide

### **For Existing Installations:**

This release is **backward compatible** - no migration steps required.

#### **Update Process:**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

#### **Automatic Updates:**
- Authentication improvements apply immediately
- Demo mode enhancements available instantly
- No database migrations required
- All existing user data preserved

### **For Developers:**

If you've customized Profolio components:

1. **Check User ID Usage**: Ensure components use `user.id` not `user.uid`
2. **Update Auth Calls**: Replace hardcoded tokens with unified auth
3. **Test Demo Mode**: Verify demo session management works correctly

---

## 📦 Installation

### **New Installations:**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### **Updating Existing:**
The installer automatically detects existing installations and updates safely.

### **Version-Specific Installation:**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)" -- --version 1.2.0
```

---

## 🚀 What's Next

### **Demo Mode Improvements:**
- User feedback collection during demo sessions
- Demo-specific onboarding and tutorials
- Enhanced demo data scenarios

### **Security Enhancements:**
- Additional authentication mode improvements
- Enhanced session security features
- Advanced user data protection

### **Market Data Features:**
- More market data providers
- Enhanced portfolio analytics
- Real-time price alerts

---

## 🙏 Acknowledgments

Special thanks to the community for:
- Security vulnerability reports
- Demo mode feedback and suggestions
- Testing and validation of authentication improvements

---

## 📊 Release Statistics

- **38 commits** since v1.1.0
- **12 security issues** resolved
- **9 components** updated for consistent auth
- **1 new utility class** (DemoSessionManager)
- **24-hour** demo session duration
- **100%** backward compatibility maintained

---

## 🔗 Additional Resources

- **Full Changelog**: [CHANGELOG.md](../../CHANGELOG.md)
- **Security Fixes**: [Security documentation](../processes/COMMIT_AND_PUSH_GUIDE.md)
- **Demo Mode Guide**: Try the demo at your Profolio instance
- **Authentication Guide**: [Unified Auth Documentation](../../README.md)

---

**v1.2.0 represents a major step forward in both security and user experience. Demo mode now provides a genuine preview of Profolio's capabilities, making it easier than ever to showcase the platform's value to potential users.** 