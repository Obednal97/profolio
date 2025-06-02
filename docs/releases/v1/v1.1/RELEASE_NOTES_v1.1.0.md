# Release Notes - v1.1.0

Released: 2025-01-06

## 🎯 Release Highlights

**Unified Authentication System** - This major release introduces a revolutionary dual-mode authentication system that supports both self-hosted (local database) and cloud (Firebase) authentication from the same codebase. This enables Profolio to serve both privacy-focused self-hosted users and managed SaaS deployments seamlessly.

**Smart Auto-Detection** - The system automatically detects the appropriate authentication mode based on environment, Firebase config availability, and deployment context.

**True Self-Hosted Privacy** - Self-hosted mode now works completely offline without any external dependencies, providing complete data sovereignty.

## ✨ New Features

### 🎯 Unified Authentication System
A revolutionary authentication architecture that supports two distinct modes:

**🏠 Self-Hosted Mode:**
- Local PostgreSQL database authentication with JWT tokens
- Complete privacy - all data stays on your server
- Works offline/air-gapped (no external dependencies)
- Username/password authentication only
- Perfect for privacy-focused deployments

**☁️ Cloud/SaaS Mode:**
- Firebase authentication with social providers
- Google sign-in support with email verification
- Managed authentication infrastructure
- Social authentication (Google, GitHub, Apple ready)
- Perfect for managed hosting

### 🤖 Smart Auto-Detection
The system automatically detects which authentication mode to use:
- **Environment Detection**: Checks for localhost, Firebase config availability
- **Override Capability**: Force specific mode with `NEXT_PUBLIC_AUTH_MODE`
- **Graceful Fallback**: Falls back to local auth if Firebase initialization fails
- **Dynamic Loading**: Firebase modules only loaded when needed

### 📱 Adaptive User Interface
The sign-in page dynamically adapts based on authentication mode:

**Self-Hosted UI:**
- Shows "🏠 Self-hosted mode" indicator
- Email/password fields only
- Demo mode prominently featured
- No Google sign-in button
- No "Forgot password" link (not applicable for local auth)

**Cloud UI:**
- Shows "☁️ Cloud mode" indicator  
- Email/password + Google sign-in button
- "Forgot password" functionality
- Social authentication options
- Email verification support

### 🔧 Configuration System
Flexible configuration options for different deployment needs:

**Environment Variables:**
```bash
# Force local authentication
NEXT_PUBLIC_AUTH_MODE=local

# Force Firebase authentication  
NEXT_PUBLIC_AUTH_MODE=firebase

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Automatic Detection:**
- No Firebase config = Local mode
- Firebase config available = Firebase mode
- Localhost = Local mode (override)

## 🏗️ Architecture Improvements

### LocalAuthService
New authentication service for self-hosted deployments:
- Direct communication with backend API endpoints
- JWT token management and refresh
- User profile synchronization
- Demo mode support
- Secure credential storage

### UnifiedAuthProvider
Single authentication provider that:
- Automatically routes to appropriate backend (local vs Firebase)
- Provides consistent interface for components
- Handles authentication state across modes
- Manages fallback scenarios
- Maintains backward compatibility

### AuthConfig System
Smart configuration detection:
- Environment-based mode detection
- Firebase availability checking
- Caching for performance
- Override mechanisms for testing

## 🔐 Security Enhancements

### Self-Hosted Security
- **Local JWT Authentication**: Secure token-based authentication
- **No External Dependencies**: Complete network isolation capability
- **Database Security**: PostgreSQL with proper user permissions
- **Credential Protection**: Secure environment variable handling

### Cloud Security
- **Firebase Security Model**: Leverages Google's security infrastructure
- **Social Authentication**: Secure OAuth flows
- **Email Verification**: Built-in email verification system
- **Token Management**: Secure Firebase token handling

## 🐛 Bug Fixes

### Fixed: Installer Color Formatting
- **Issue**: ANSI escape codes showing as raw text in update wizard
- **Fix**: Added `-e` flag to echo commands for proper color rendering
- **Impact**: Installer now shows properly colored options menu

### Fixed: Firebase Dependency for Self-Hosted
- **Issue**: Self-hosted installations failing due to missing Firebase config
- **Fix**: Made Firebase completely optional with graceful degradation
- **Impact**: Self-hosted mode works without any Firebase setup

### Fixed: Authentication State Management
- **Issue**: Inconsistent authentication state handling
- **Fix**: Unified state management across both authentication modes
- **Impact**: Reliable authentication status across page refreshes

## 🔧 Technical Improvements

### Enhanced Type Safety
- **UnifiedUser Interface**: Compatible with both Firebase and local users
- **AuthConfig Types**: Strong typing for configuration options
- **Provider Interfaces**: Consistent interfaces across authentication modes

### Performance Optimizations
- **Dynamic Imports**: Firebase modules only loaded when needed
- **Caching**: Configuration detection results cached
- **Lazy Loading**: Authentication providers loaded on demand

### Code Organization
- **Separation of Concerns**: Clear separation between auth modes
- **Reusability**: Shared components work with both modes
- **Maintainability**: Clean architecture for future enhancements

## 📚 Documentation Updates

### New Documentation
- **Local Authentication Deployment Guide**: Complete setup instructions
- **README Overhaul**: Updated with dual deployment options
- **Configuration Examples**: Clear examples for both modes

### Updated Documentation  
- **Installation Guide**: Updated for new authentication options
- **Architecture Overview**: Documented unified authentication system
- **Contributing Guide**: Updated development setup instructions

## 🔄 Migration Guide

### For Existing Self-Hosted Users
If you want to switch to local authentication:

```bash
# 1. Set environment variable
echo 'NEXT_PUBLIC_AUTH_MODE=local' | sudo tee -a /opt/profolio/frontend/.env.production

# 2. Remove Firebase config (optional)
sudo rm -f /opt/profolio/frontend/public/firebase-config.json

# 3. Update installation
cd /opt && sudo ./install-or-update.sh
```

### For Existing Firebase Users
Your installation will continue working without changes. Firebase mode is maintained with full feature parity.

### For New Installations
The installer automatically detects the appropriate mode based on your environment and configuration.

## 📦 Installation

### One-Command Installation
```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

### Manual Installation
```bash
git clone https://github.com/Obednal97/profolio.git
cd profolio
sudo ./install-or-update.sh
```

## 🔄 Updating

Existing installations will automatically update to v1.1.0:

```bash
cd /opt && sudo ./install-or-update.sh
```

**Note**: Update includes automatic rollback protection in case of issues.

## 🎮 Testing the New Features

### Test Self-Hosted Mode
1. Visit your self-hosted installation
2. Look for "🏠 Self-hosted mode" indicator
3. Try creating account with email/password
4. Test demo mode functionality

### Test Cloud Mode  
1. Ensure Firebase config is present
2. Look for "☁️ Cloud mode" indicator
3. Test both email/password and Google sign-in
4. Verify email verification works

## 🌟 Future Roadmap

This unified authentication system provides the foundation for:
- **Open Source + SaaS Business Model**: Same codebase for both
- **Auth.js Integration**: Easy migration path to Auth.js if desired
- **Additional Providers**: GitHub, Apple, Microsoft sign-in
- **Enterprise Features**: SAML, LDAP integration for enterprise self-hosted

## 🙏 Acknowledgments

Special thanks to the community for feedback on authentication requirements and the need for true self-hosted privacy options.

## 📊 Statistics

- **8 files changed**: Major authentication system overhaul
- **1,041 insertions**: Significant new functionality
- **488 deletions**: Code cleanup and optimization
- **4 new files**: LocalAuth, AuthConfig, UnifiedAuth services
- **Backward Compatible**: 100% compatibility with existing installations

---

**Perfect for both privacy-focused self-hosting and managed cloud deployments!** 🎉 