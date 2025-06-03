# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.8.2] - 2025-01-18

### 🐛 Bug Fixes
- **FIXED: PWA Home Screen Icon**: Resolved issue where "Add to Home Screen" showed generic "P" instead of Profolio logo
- **FIXED: Missing Manifest Link**: Added proper PWA manifest link in HTML head for browser discovery
- **FIXED: iOS Icon Compatibility**: Enhanced Apple touch icon configuration for better iOS home screen support

### 🔧 Improvements
#### Technical
- **Enhanced PWA Configuration**: Updated manifest.json with both SVG and PNG icon references for maximum compatibility
- **Service Worker Optimization**: Updated cached icon files to match manifest configuration
- **Cross-Platform Icon Support**: Added comprehensive meta tags for iOS, Android, and Windows PWA installations

#### UI/UX
- **Progressive Enhancement**: Configured SVG icons with PNG fallbacks for older device compatibility
- **Consistent Branding**: Home screen icons now display proper Profolio gradient logo across all platforms
- **App Store Readiness**: Enhanced PWA metadata for better app store and installation presentation

### 📦 Installation & Updates
- **PNG Icon Generator**: Added script for generating PNG versions from SVG icons for enhanced compatibility
- **Automatic Icon Caching**: Service worker now properly caches all icon sizes for offline functionality
- **Cross-Platform Testing**: Improved "Add to Home Screen" experience on iOS Safari, Android Chrome, and desktop browsers

### 📊 Summary
- **Files Changed**: 5 files modified
- **Issues Resolved**: 1 critical PWA display bug
- **Platform Support**: Enhanced compatibility across iOS, Android, and desktop PWA installations
- **User Experience**: Beautiful Profolio logo now appears when adding app to home screen

## [v1.8.1] - 2025-01-18

### ✨ Features
- **🎯 Customizable Optimization Levels**: Added safe and aggressive optimization modes for space reduction (600-800MB vs 400-500MB)
- **📊 Comprehensive Installer Statistics**: Beautiful summary table with runtime, file counts, disk usage, and version tracking
- **🔄 Installer Self-Update**: Automatic installer updates with backup and validation for latest features
- **⚡ Incremental Update System**: Revolutionary bandwidth savings with sparse checkout and shallow cloning for updates

### 🐛 Bug Fixes
- **FIXED: Production Optimization Reliability**: Only removes actual devDependencies, preserves all runtime dependencies
- **FIXED: Service Startup Issues**: Corrected backend start script to use compiled dist files instead of CLI tools
- **FIXED: Installer Statistics Display**: Shows actual download sizes instead of misleading total app size
- **FIXED: Duplicate Configuration Checks**: Streamlined optimization flow with cleaner code structure

### 🔧 Improvements
#### Technical
- **Smart Dependency Management**: Precise devDependency removal from package.json without affecting production packages
- **Enhanced Production Safety**: Comprehensive validation and rollback protection for critical deployments
- **Git Operation Optimization**: Massive bandwidth savings through incremental fetch operations (3.47 KiB vs 1.6GB)
- **Border Alignment System**: Intelligent padding system for statistics display with perfect table formatting

#### UI/UX
- **Quick Install Mode**: Safe optimization by default with no prompts for typical users
- **Advanced Mode Options**: Power users get full control with comprehensive warnings about trade-offs
- **Transparent Statistics**: Real-time tracking of operation timing, service downtime, and resource usage
- **Clear Optimization Warnings**: Detailed explanations of risks and benefits for aggressive optimization

#### Performance
- **Space Reduction**: Safe mode achieves ~600-800MB, aggressive mode reaches ~400-500MB final size
- **Download Efficiency**: Incremental updates download only changed files instead of entire repository
- **Statistics Tracking**: Comprehensive monitoring of file counts, disk usage, and operation performance
- **Memory Optimization**: Enhanced resource management during optimization processes

### 📦 Installation & Updates
- **Enhanced Update Process**: Automatic installer self-update ensures latest features and bug fixes
- **Optimization Choices**: Interactive selection between safe and aggressive space optimization
- **Backup Protection**: Creates installer backup before updates with syntax validation
- **Progress Transparency**: Detailed statistics and progress tracking throughout operations

### 📊 Summary
- **Files Changed**: Multiple installer and optimization components enhanced
- **Features Added**: 4 major installer improvements
- **Issues Resolved**: 4 critical production deployment bugs
- **Performance**: Up to 66% space reduction with customizable optimization levels

## [v1.8.0] - 2025-06-03

### ✨ Features
- **📝 Markdown Support in Release Notes**: Full markdown formatting support including bold, italic, links, inline code, and code blocks
- **📱 Mobile-First Updates Page**: Complete responsive redesign with dropdown release selector and compact mobile layout
- **🎯 Smart Release Detection**: Enhanced GitHub API integration with proper sorting and latest version detection

### 🐛 Bug Fixes
- **FIXED: Pricing Page Regressions**: Restored animated background orbs, fixed card height consistency, and glass effects
- **FIXED: Apostrophe Rendering**: Resolved "What&apos;s" and similar HTML entity display issues throughout UI
- **FIXED: Footer Padding Issues**: Eliminated excessive padding on logged-in pages that wasn't present on public pages
- **FIXED: Release Sorting**: Latest version (1.7.1) now appears first in mobile dropdown instead of 1.4.0
- **FIXED: Text Overflow**: Added proper text wrapping for URLs and long content in release notes

### 🔧 Improvements
#### UI/UX
- **Desktop Theme Toggle**: Hidden theme toggle from user menu on desktop since standalone button exists
- **Updates Page Structure**: Mobile-first with responsive breakpoints, transparent header with animated background
- **Pricing Page Enhancement**: Restored "Most Popular" overlay banner and consistent card heights
- **Text Wrapping**: Enhanced typography with proper word breaks and overflow handling

#### Technical
- **GitHub Release Fetching**: Increased API limit from 10 to 30 releases with better sorting and filtering
- **Code Quality**: Cleaned up console.log statements to be development-mode only
- **Background Consistency**: Fixed duplicate background orbs issue by using layout wrapper system
- **Responsive Design**: Desktop sidebar layout preserved while optimizing mobile experience

#### Performance
- **Release Loading**: Improved release data fetching with better error handling and fallbacks
- **Mobile Navigation**: Optimized mobile header with backdrop blur and transparent background

### 📊 Summary
- **Files Changed**: 8 files modified
- **Features Added**: 3 new features (markdown support, mobile-first design, smart detection)
- **Issues Resolved**: 5 critical UI/UX bugs
- **Performance**: Enhanced GitHub API integration with 3x more releases fetched

## [v1.7.1] - 2025-06-02

### 🔧 Improvements
- **📋 Release Notes Template**: Streamlined template from 358 to 80 lines by removing verbose sections like acknowledgments and extensive statistics
- **📱 Updates Page Navigation**: Fixed left sidebar scrolling - now stays properly positioned below header while main content scrolls
- **🎯 Documentation Process**: Simplified release documentation process for faster, more focused release notes

### 📊 Summary
- **Files Changed**: 2 files modified
- **User Experience**: Better navigation behaviour in updates page
- **Process**: Significantly faster release documentation workflow

## [v1.7.0] - 2025-06-02

### ✨ Features
- **🎨 SVG Logo System**: Comprehensive scalable logo implementation with enterprise-grade optimization
- **📱 Modern Favicon Support**: SVG favicon with cross-platform compatibility and automatic sizing
- **🔧 Logo Generation Engine**: Automated SVG generation script with 13 standard sizes for all platforms
- **📋 PWA Icon Complete Set**: Full Progressive Web App compliance with manifest.json integration

### 🔧 Improvements
#### Performance
- **React Optimization**: Enterprise-grade memoization with useMemo, useCallback for zero unnecessary re-renders
- **Bundle Efficiency**: SVG components optimized for tree-shaking and minimal bundle impact
- **Memory Management**: Proper cleanup patterns and optimized rendering performance

#### Technical
- **TypeScript Excellence**: Strict typing with const assertions and comprehensive interface definitions
- **Code Quality Standards**: Applied full enterprise checklist with comprehensive documentation
- **Design System**: Centralized constants and proportional scaling for perfect consistency
- **Cross-Platform Support**: Universal compatibility across all browsers and devices

#### UI/UX
- **Squircle Design**: Modern rounded square aesthetic with 27.3% border radius for premium appearance
- **Perfect Centering**: Mathematically precise icon positioning with optimal visual balance
- **Scalable Quality**: Vector graphics maintain crisp quality at any resolution or device density
- **Brand Consistency**: Unified purple gradient theme across all logo implementations

### 🛡️ Security & Compatibility
- **Modern Browser Support**: SVG favicons work across all contemporary browsers
- **File Structure**: Proper gitignore patterns and clean repository organization
- **Future-Proof**: Design system ready for any branding updates or size requirements

### 📦 Installation & Updates
- **Automatic Favicon**: Existing favicon.ico automatically replaced with SVG version (seamless upgrade)
- **Icon Generation**: Run `node scripts/generate-logo-svg.mjs` to regenerate all sizes
- **PWA Ready**: All icon sizes automatically available for Progressive Web App installation

### 📊 Summary
- **Files Changed**: 4 files optimized, 13 icon sizes generated
- **Code Quality**: Zero new ESLint warnings, enterprise-grade patterns applied
- **Icon Coverage**: 13 platform-specific sizes from 16px to 512px
- **Performance**: Optimized React components with comprehensive memoization

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