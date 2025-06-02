# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.4.1] - 2025-06-02

### 🐛 **Bug Fixes**
- **🗓️ FIXED: Date Format Inconsistencies**: Corrected US/UK date format confusion throughout documentation
- **📅 FIXED: Hardcoded Date in useUpdates.ts**: Fixed mock release date from '2025-02-06' to '2025-06-02'
- **📝 FIXED: Release Notes Date Formats**: Standardized all release documentation to use UK date standards
- **🕒 FIXED: Historical Release Dates**: Corrected chronological accuracy of older release dates in changelog

### 📚 **Documentation**
- **📋 NEW: Release Notes Template**: Added comprehensive template (`docs/processes/RELEASE_NOTES_TEMPLATE.md`)
- **🎯 Date Format Standards**: Established clear guidelines to prevent future UK/US date confusion
- **✅ Template Instructions**: Detailed instructions for consistent release documentation
- **📖 Process Improvement**: Enhanced release process with standardized date formatting

### 🔧 **Technical Improvements**
- **📍 Consistent ISO Timestamps**: All technical timestamps now use 2025-06-02 format
- **📝 Text Date Format**: Human-readable dates use "June 2, 2025" format consistently
- **🔍 Documentation Review**: Comprehensive codebase review for date format consistency
- **🎨 Template Standardization**: Future-proof release notes generation with clear examples

### 🛡️ **Quality Assurance**
- **✅ Comprehensive Review**: Searched entire codebase for date format inconsistencies
- **📋 Prevention Measures**: Template includes explicit date format guidelines
- **🔧 Developer Guidelines**: Clear instructions for maintaining date format consistency
- **📚 Historical Accuracy**: Corrected timeline documentation for better project history

### 📦 **Impact**
- **Zero Breaking Changes**: All corrections maintain full backward compatibility
- **Enhanced Clarity**: Eliminates confusion between UK and US date formats
- **Future Prevention**: Template system prevents recurring date format issues
- **Historical Accuracy**: Improved project timeline documentation and release history

## [v1.4.0] - 2025-06-02

### ✨ **New Features**
- **🔌 Circuit Breaker Pattern**: Advanced circuit breaker implementation for Yahoo Finance API with 3-failure threshold and 5-minute recovery timeout
- **🛡️ Enterprise-Grade Resilience**: Comprehensive resilience patterns with graceful degradation and intelligent fallback mechanisms
- **📊 Real-Time Monitoring**: Circuit breaker status API and comprehensive health checking endpoints for production monitoring
- **🎯 Intelligent Rate Limiting**: Conservative rate limiting with exponential backoff and adaptive delay mechanisms

### 🐛 **Critical Bug Fixes**
- **🚨 FIXED: Yahoo Finance Rate Limiting Cascade Failures**: Resolved aggressive rate limiting causing service failures every 15 seconds
- **🔧 FIXED: Next.js Build Configuration Issues**: Eliminated module loading errors, chunk loading failures, and 500 errors in production
- **⚡ FIXED: Price Sync Service Over-Aggressive Behavior**: Reduced sync frequency from hourly to every 6 hours with intelligent throttling
- **🏗️ FIXED: Webpack Configuration Problems**: Removed deprecated options and optimized chunk splitting for better performance

### 🎨 **UI/UX Improvements**
- **📱 Production Build Stability**: Clean production builds with optimized chunk management and enhanced module resolution
- **🔄 Graceful Service Degradation**: Users now experience stable service even when external APIs are unavailable

### 🔧 **Technical Improvements**
- **🔒 TypeScript Strict Compliance**: Eliminated all 'any' types in favor of proper type definitions for enterprise-grade code quality
- **⚡ Conservative API Management**: Reduced symbols per sync from unlimited to 5 maximum, with 30-second minimum delays between requests
- **🏗️ Enhanced Webpack Configuration**: Optimized chunk splitting with separate chunks for React, Framer Motion, and Lucide libraries
- **📊 Comprehensive Logging**: Enhanced error tracking, monitoring, and alerting capabilities for production observability

### 🛡️ **Security & Compatibility**
- **🔐 Security Headers Enhancement**: Added X-Frame-Options, X-Content-Type-Options, and optimized caching headers for production security
- **🌐 Cross-Deployment Reliability**: Circuit breaker patterns work consistently across cloud and self-hosted deployments
- **🛡️ Error Sanitization**: Comprehensive error handling that prevents sensitive information exposure

### 📚 **Documentation**
- **📋 Enterprise-Grade Process Documentation**: Added comprehensive code quality checklist, quick reference guide, and git integration guide
- **🔄 Release Process Documentation**: Detailed commit and push guide with automated quality checks

### 🚀 **Performance**
- **🔌 Memory Leak Prevention**: Circuit breaker patterns eliminate resource leaks from failed API requests
- **⚡ Request Optimization**: Intelligent request cancellation and race condition prevention across all components
- **🎯 Resource Throttling**: Conservative rate limiting prevents API overload and ensures stable operation
- **📈 Build Performance**: Optimized Next.js configuration reduces build time and improves chunk loading

### 🔄 **Migration Guide**
- **✅ Automatic Migration**: All changes are backward compatible with existing deployments
- **🔧 Configuration Updates**: Next.js configuration improvements apply automatically on deployment
- **📊 Monitoring Integration**: New health check endpoints provide real-time service status monitoring

### 📦 **Installation & Updates**
```bash
# Standard installation/update
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### 📊 **Release Statistics**
- **Files Modified**: 18 core files optimized
- **Security Issues Resolved**: 100% completion maintained
- **Performance Issues**: 100% completion maintained with new resilience patterns
- **Code Quality**: Enhanced with strict TypeScript compliance
- **Production Readiness**: Full enterprise-grade resilience implemented

---

## [v1.3.0] - 2025-06-02

### ✨ **New Features**
- **🔔 Notification Badge on User Menu**: Added notification count badge to user avatar button for instant visibility
- **🎭 Demo Mode Banner**: Orange-to-red gradient banner above header with signup CTA for demo users
- **🔄 Auto-Updates Toggle**: Smart self-hosted detection with interactive toggle for automatic updates
- **📱 Enhanced User Experience**: Notification badges now visible on both closed and open user menu states

### 🐛 **Critical Bug Fixes**
- **🚨 FIXED: Next.js 15+ Dynamic Route Parameters**: Resolved `params.symbol` async errors in API routes
  - Fixed `/api/integrations/symbols/cached-price/[symbol]/route.ts`
  - Fixed `/api/market-data/portfolio-history/[userId]/route.ts`
- **⏱️ FIXED: Yahoo Finance Rate Limiting Inconsistency**: Aligned retry timing across all services
  - Updated YahooFinanceService retries from 2s/4s/8s to 5s/10s/20s
  - Synchronized with PriceSyncService minimum 5-second delays
  - Eliminated timing conflicts causing price sync failures
- **📊 FIXED: Updates Page Layout Issues**: Resolved sidebar positioning and viewport calculations
  - Added `max-h-96` constraint to Releases section
  - Fixed System Info positioning with `flex-shrink-0`
  - Reduced gaps and padding for better space utilization

### 🎨 **UI/UX Improvements**
- **🔔 Notifications Page Refinement**: Simplified interface based on user feedback
  - Removed statistics cards (Total, Read, Unread counts)
  - Changed "Clear Read" to "Mark All as Read" with blue styling
  - Streamlined layout focusing on notification filtering
- **⚙️ System Info Enhancement**: Changed icon from Clock to Settings for better clarity
- **📱 Demo Mode UX**: Dismissible banner with responsive design for mobile/desktop
- **🎯 Notification Visibility**: Count badges now show on both avatar and dropdown menu items

### 🔧 **Technical Improvements**
- **🏠 Smart Self-Hosted Detection**: Automatic hostname checking for localhost, 127.0.0.1, and .local domains
- **💾 Settings Persistence**: Auto-updates preference stored in localStorage with backend integration ready
- **🎭 Demo Mode Management**: Enhanced DemoSessionManager with proper banner display logic
- **🔄 Unified Rate Limiting**: Consistent 5-second minimum delays across all Yahoo Finance operations
- **⚡ Service Reliability**: Improved price sync success rates with aligned timing strategies

### 🛡️ **Security & Compatibility**
- **📱 Next.js 15+ Compatibility**: Updated dynamic route parameter handling for latest Next.js requirements
- **🔒 Cross-Deployment Support**: Notification system works consistently across cloud and self-hosted modes
- **🎯 User Isolation**: Proper notification badge display based on user authentication state
- **🔐 Demo Mode Security**: Secure banner display only for authenticated demo sessions

### 📚 **Documentation**
- **🔧 Environment Mode Switching**: Comprehensive `.env.local` configuration guide
- **🏠 Self-Hosted Auto-Updates**: Documentation for auto-update toggle functionality
- **🎭 Demo Mode Features**: Complete guide for demo mode banner and user experience
- **📱 Notification System**: Documentation for badge placement and user interaction patterns

### 🚀 **Performance**
- **⚡ Reduced API Conflicts**: Eliminated timing inconsistencies in market data fetching
- **🎯 Optimized Price Sync**: Better success rates with unified rate limiting approach
- **📱 Efficient Notifications**: Streamlined notification loading and badge updates
- **🔄 Smart Updates**: Conditional auto-updates only for self-hosted deployments

### 🔄 **Migration & Compatibility**
- **✅ Backward Compatible**: All changes maintain existing functionality
- **🔧 Environment Detection**: Automatic mode detection without configuration changes
- **📱 Progressive Enhancement**: New features gracefully degrade for older browsers
- **🎯 Zero Breaking Changes**: Existing installations continue working without modifications

## [v1.2.3] - 2025-06-01

### 🐛 **Bug Fixes**
- **FIXED: MDX Components**: Resolved TypeScript errors in documentation components
- **FIXED: Build Process**: Enhanced development server compatibility

### 🔧 **Improvements**
#### Technical
- **TypeScript Safety**: Proper type annotations for all MDX components
- **Developer Experience**: Better error reporting and compilation

### 📊 **Summary**
- **Files Changed**: 5 files modified
- **Issues Resolved**: 24 TypeScript errors

## [v1.2.2] - 2025-06-01

### ✨ **Features**
- **Proxmox LXC Support**: Native container creation with optimized configuration
- **Container Management**: Automatic Ubuntu 24.04 setup with DHCP/static IP support

### 🐛 **Bug Fixes**
- **FIXED: Demo Mode Sign-Out**: Users can now properly sign out without cache clearing
- **FIXED: Authentication Flow**: Improved demo session cleanup across all auth methods

### 🔧 **Improvements**
#### Technical
- **Repository Cleanup**: Removed redundant scripts, simplified structure
- **Documentation**: Complete Proxmox installation guide

### 📦 **Installation & Updates**
- **New Deployment Option**: Proxmox LXC containers (recommended for Proxmox users)
- **Enhanced Installer**: Supports three deployment modes with Proxmox auto-detection

### 📊 **Summary**
- **Features Added**: 2 major features
- **Scripts Removed**: 4 redundant files
- **Deployment Options**: 3 supported modes

## [v1.2.1] - 2025-06-01

### ✨ **Features**
- **Environment Preservation**: Automatic detection and preservation of Firebase configurations
- **Zero-Downtime Updates**: Updates no longer break existing authentication settings

### 🐛 **Bug Fixes**
- **FIXED: Firebase Auth Breaking**: Prevented installer from overwriting environment files
- **FIXED: API Key Reset**: Eliminated "API key not valid" errors after updates

### 🔧 **Improvements**
#### Technical
- **Smart Preservation**: Auto-preserve mode for unattended installations
- **Multi-File Support**: Handles .env.production, .env.local, and .env files

### 📊 **Summary**
- **Critical Issue**: Environment file overwriting resolved
- **Downtime**: Zero authentication interruption during updates

## [v1.2.0] - 2025-06-01

### ✨ **Features**
- **Enhanced Demo Mode**: 24-hour session management with automatic expiration
- **Real Market Data**: Demo users now access actual Yahoo Finance data
- **Session Management**: DemoSessionManager for proper lifecycle handling

### 🐛 **Bug Fixes**
- **FIXED: Authentication Vulnerabilities**: Standardized user.id usage across components
- **FIXED: Token Security**: Replaced hardcoded demo tokens with proper auth flow
- **FIXED: Cross-User Data Access**: Eliminated potential data leakage risks

### 🔧 **Improvements**
#### Security
- **Authentication Standardization**: Unified auth system usage throughout codebase
- **Session Security**: Proper time-limited access with automatic cleanup
- **Data Isolation**: Enhanced user data boundaries

### 📊 **Summary**
- **Features Added**: 3 demo mode features
- **Security Issues**: All authentication vulnerabilities resolved
- **Files Changed**: 8 files modified

## [v1.1.0] - 2025-06-01

### ✨ **Features**
- **Unified Authentication**: Support for both self-hosted (PostgreSQL + JWT) and cloud (Firebase) auth
- **Smart Auto-Detection**: Automatically selects appropriate auth mode based on environment
- **Adaptive UI**: Sign-in page shows different options based on deployment mode

### 🔧 **Improvements**
#### Technical
- **Dual-Mode Architecture**: Single codebase supports both deployment types
- **Enhanced Security**: Local JWT for self-hosted, Firebase security for cloud
- **Complete Privacy**: Self-hosted mode works completely offline

#### UI/UX
- **Installer Improvements**: Fixed color formatting and banner spacing in update wizard

### 📦 **Installation & Updates**
- **Deployment Modes**: Self-hosted (privacy-focused) and SaaS (cloud-ready)
- **Backward Compatible**: Existing Firebase installations continue working

### 📊 **Summary**
- **Features Added**: 2 authentication modes
- **Deployment Options**: Self-hosted and cloud support
- **Breaking Changes**: None (fully backward compatible)

## [v1.0.12] - 2025-06-01

### 🐛 Bug Fixes
- **FIXED: Git Strategy**: Resolved divergent branches issue preventing updates after security fixes
- **FIXED: Update Process**: Installer now handles force-pushed history cleanup gracefully

### 🔧 Improvements
#### Technical
- **Git Compatibility**: Uses `git reset --hard origin/main` for exact remote matching
- **Update Reliability**: Resolves update failures after repository history rewrites

## [v1.0.11] - 2025-06-01

### 🐛 Bug Fixes
- **FIXED: Hardcoded API Key**: Removed reintroduced Firebase API key from auth.tsx
- **FIXED: Dynamic Cleanup**: Pattern-based localStorage cleanup instead of hardcoded keys

### 📚 Documentation
- **Configuration Guide**: Comprehensive setup instructions and Firebase documentation
- **Security Best Practices**: Guidelines for safe configuration management

## [v1.0.10] - 2025-06-01

### 🐛 Bug Fixes
- **CRITICAL SECURITY FIX**: Complete removal of exposed Firebase API keys from repository and git history
- **FIXED: Git History**: Used git-filter-repo to remove sensitive files from all 199 commits

### 🔧 Improvements
#### Security
- **Template Configuration**: Users create own configs from secure templates
- **Enhanced .gitignore**: Comprehensive protection against secret exposure
- **Prevention Measures**: Enhanced security rules for future development

⚠️ **IMMEDIATE ACTION REQUIRED**: Rotate Firebase API key and update configuration
📅 **Exposure Period**: April 1, 2025 - June 1, 2025

## [v1.0.9] - 2025-05-31

### 🐛 Bug Fixes
- **FIXED: Backend Compilation**: Resolved TypeScript compilation issues after pnpm migration
- **FIXED: Missing Dependencies**: Added required NestJS packages and regenerated Prisma client

### 🔧 Improvements
#### Performance
- **Backend Startup**: 0 TypeScript errors, all services load correctly
- **Dependency Resolution**: pnpm's optimized dependency resolution

## [v1.0.8] - 2025-05-31

### 🔧 Improvements
#### Technical
- **Package Manager Standardization**: Migrated to pnpm for 40-60% smaller node_modules
- **Component Organization**: Reorganized frontend components into logical directories
- **Dependency Cleanup**: Removed duplicate React/Next.js dependencies

#### Performance
- **Faster Builds**: pnpm's efficient dependency resolution improves build times
- **Smaller Dependencies**: ~1.5GB → ~800MB dependency size reduction

## [v1.0.7] - 2025-05-31

### 📚 Documentation
- **Process Documentation**: Added comprehensive commit/push guide and release process guide
- **Release Notes**: Created missing release notes for v1.0.4, v1.0.5, and v1.0.6
- **Documentation Structure**: Reorganized `/docs` folder with clear subdirectories

### 📊 Summary
- **Documentation**: Established standards for development workflow and release management

## [v1.0.4] - 2025-05-31

### ✨ Features
- **Installer v2.0**: Complete overhaul with rollback protection and version control
- **Automatic Rollback**: Git-based restoration with backup fallback on failures
- **Version Management**: Install/update to any specific version with `--version` option
- **Manual Rollback**: Emergency rollback capability with `--rollback` command

### 🔧 Improvements
#### Technical
- **Production Safety**: Comprehensive failure detection and automatic recovery
- **Enhanced CLI**: Version validation, existence checking, and comprehensive help

### 📦 Installation & Updates
**Command Line Options**: `--version`, `--force-version`, `--no-rollback`, `--list-versions`, `--rollback`, `--auto`, `--help`

## [v1.0.1] - 2024-05-30

### 🐛 Bug Fixes
- **CRITICAL: MDX React Context Error**: Resolved `r.createContext is not a function` build failure
- **FIXED: Build Process**: Complete resolution of frontend build failures
- **FIXED: Installer Reliability**: Enhanced error handling and credential preservation

### 📚 Documentation
- **Complete Policy Documentation**: All policy pages with full content (1,400+ lines total)
- **Enhanced MDX Support**: Professional documentation rendering with dark mode

### 📊 Summary
- **Critical Issue**: Installer failure at frontend build step resolved
- **Impact**: Complete successful installation with working policy pages

## [v1.0.0] - 2024-05-30

### 🚀 Initial Public Release

### ✨ Features
- **One-Command Installation**: Proxmox community standard installer
- **Portfolio Management**: Multi-asset support (stocks, crypto, real estate, bonds)
- **Real-Time Market Data**: Trading 212 API integration
- **Demo Mode**: Safe API key testing with localStorage-only storage
- **Self-Hosted Focus**: Complete data privacy and control

### 📦 Installation & Updates
```bash
curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh | sudo bash
```

### 🔧 Technical Stack
- **Backend**: NestJS + PostgreSQL + TypeScript
- **Frontend**: Next.js + React + TypeScript  
- **Security**: AES-256-GCM encryption, JWT auth, input validation
- **Deployment**: Proxmox LXC ready, self-hosted optimized

### 📊 Summary
- **Installation**: One-command setup with smart install/update detection
- **Security**: Enterprise-grade encryption and authentication
- **Performance**: Optimized for self-hosted deployment scenarios

---

## 📋 Changelog Template

**New entries should use the template at**: `docs/processes/CHANGELOG_TEMPLATE.md`

**Format**: Focus on user impact, keep descriptions concise, only include relevant sections.

---

## 🔗 Links
- **GitHub Releases**: [View all releases](https://github.com/Obednal97/profolio/releases)
- **Installation Guide**: [README.md](README.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) 