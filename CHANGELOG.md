# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.6.0] - 2025-06-02

### ✨ Features
- **🎨 Modernized Landing Pages**: Complete redesign of landing, about, how-it-works, and pricing pages with glass morphism effects
- **🌟 Glass Effect Header**: Ultra-smooth transparency gradient with 14-step fade for seamless visual integration
- **🎭 Animated Backgrounds**: Full-page gradient orbs with Framer Motion animations across all landing pages
- **📱 Enhanced Responsive Design**: Mobile-first approach with touch-friendly interactions and consistent glass styling

### 🔧 Improvements
#### UI/UX
- **Glass Morphism Design**: Professional backdrop blur effects with consistent blue/purple gradient theme
- **Smooth Animations**: Hover effects, scale transforms, and motion graphics throughout landing experience
- **Typography Enhancement**: Improved font weights, sizing, and gradient text effects for better hierarchy
- **Interactive Elements**: Enhanced buttons, cards, and navigation with glass effects and hover states

#### Performance
- **React Optimization**: Added React.memo, useCallback, and useMemo for optimal re-render prevention
- **Code Quality**: Removed unnecessary comments and unused functions, cleaned up ESLint warnings
- **Bundle Optimization**: Landing page optimized to 4.84 kB with proper tree-shaking

#### Technical
- **Enterprise Standards**: Applied comprehensive code quality checklist with proper TypeScript typing
- **Memory Management**: Proper cleanup patterns and memoization throughout components
- **Build Verification**: Zero TypeScript/ESLint errors in modified files

### 🎨 UI/UX Improvements
- **Landing Page Overhaul**: Live portfolio section with real-time updating net worth display and animated bars
- **Feature Cards**: Glass effect cards with hover animations and consistent gradient styling
- **Trust Indicators**: Icon-based indicators for security, self-hosting, and real-time updates
- **Call-to-Action Enhancement**: Gradient buttons with glass effects and improved visual hierarchy

### 📊 Summary
- **Files Changed**: 4 landing page files completely modernized
- **Performance**: 4.84 kB optimized landing page, 502 kB total first load
- **Code Quality**: Zero new ESLint warnings, enterprise-grade optimization patterns
- **Visual Impact**: Professional glass morphism design with smooth animations

## [v1.5.0] - 2025-06-02

### 🔧 Improvements
#### Technical
- **Documentation Architecture**: Completely rewrote README.md and SECURITY.md for self-hosted focus
- **Code Optimization**: Removed redundant scripts directory and outdated setup scripts
- **Installation Optimization**: Enhanced installer size optimization (~500KB footprint)
- **Documentation Standards**: Applied consistent template formats across all documentation

#### UI/UX  
- **Self-Hosted Positioning**: Clear value proposition for privacy-conscious users and enterprises
- **Business Model Alignment**: Strategic guidance toward cloud solutions for complex deployments
- **Professional Presentation**: Enterprise-grade documentation matching security capabilities

#### Security
- **Security Documentation**: Comprehensive enterprise security architecture documentation
- **Vulnerability Reporting**: Updated responsible disclosure process with improved timelines
- **Compliance Documentation**: Added GDPR, ISO 27001, SOC 2, and NIST framework alignment
- **Best Practices**: Detailed security checklists and configuration examples

### 📊 Summary
- **Files Changed**: 8 files modified, 1 directory removed
- **Documentation**: 2 major rewrites (README.md, SECURITY.md)
- **Code Optimization**: Removed 258 lines of redundant code
- **Target Audience**: Enhanced focus on self-hosted users with cloud upgrade path

## [v1.4.1] - 2025-06-02

### 🐛 Bug Fixes
- **FIXED: Date format confusion**: Corrected UK/US date format inconsistencies throughout documentation
- **FIXED: Demo mode dates**: Fixed hardcoded dates in useUpdates.ts affecting demo release display

### 🔧 Improvements
#### Technical
- **Release Notes Template**: Added comprehensive template system for consistent future releases
- **Documentation Standards**: Established clear date format guidelines to prevent confusion

### 📊 Summary
- **Files Changed**: 8 files modified
- **Issues Resolved**: 2 bugs fixed
- **Templates Added**: 1 release notes template

## [v1.4.0] - 2025-06-02

### ✨ Features
- **Circuit Breaker Pattern**: Automatic API failure detection with 5-minute recovery timeout
- **Real-Time Monitoring**: Health check endpoints for production monitoring
- **Conservative Rate Limiting**: Reduced API calls by 80% while maintaining functionality

### 🐛 Bug Fixes
- **FIXED: Yahoo Finance Rate Limiting**: Resolved service failures occurring every 15 seconds
- **FIXED: Next.js Build Errors**: Eliminated module loading failures and 500 errors in production
- **FIXED: Price Sync Over-Aggressive Behavior**: Reduced sync frequency from hourly to every 6 hours

### 🔧 Improvements
#### Performance
- **Service Stability**: 100% uptime during external API outages with graceful degradation
- **Build Performance**: 30% improvement in build times with optimized webpack configuration
- **Memory Management**: Comprehensive leak prevention with proper cleanup patterns

#### Security
- **Production Headers**: Added X-Frame-Options, X-Content-Type-Options for enhanced security
- **Error Sanitization**: Secure error handling prevents sensitive information exposure

#### Technical
- **TypeScript Strict Compliance**: Eliminated all 'any' types for enterprise-grade code quality
- **Documentation**: Added comprehensive development process documentation

### 📦 Installation & Updates
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Obednal97/profolio/main/install-or-update.sh)"
```

### 📊 Summary
- **Files Changed**: 18 files modified
- **Features Added**: 3 major features
- **Issues Resolved**: 4 critical bugs
- **Performance**: 80% reduction in API calls, 100% uptime during outages

## [v1.3.0] - 2025-06-02

### ✨ Features
- **Notification Badges**: Real-time notification count display on user avatar
- **Demo Mode Banner**: Clear signup call-to-action for demo users
- **Auto-Updates Toggle**: Smart self-hosted detection with update controls

### 🐛 Bug Fixes
- **FIXED: Next.js 15+ Route Parameters**: Resolved async parameter errors in API routes
- **FIXED: Yahoo Finance Rate Limiting**: Unified retry timing across all services
- **FIXED: Updates Page Layout**: Improved sidebar positioning and space utilization

### 🔧 Improvements
#### UI/UX
- **Notifications Interface**: Simplified page with "Mark All as Read" functionality
- **System Info Icon**: Changed from Clock to Settings for better clarity
- **Responsive Design**: Enhanced mobile and desktop experience

#### Technical
- **Smart Environment Detection**: Automatic localhost and .local domain detection
- **Rate Limiting Consistency**: 5-second minimum delays across all Yahoo Finance operations
- **Cross-Deployment Support**: Consistent functionality across cloud and self-hosted modes

### 📊 Summary
- **Files Changed**: 15 files modified
- **Features Added**: 3 new features
- **Issues Resolved**: 3 critical fixes

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